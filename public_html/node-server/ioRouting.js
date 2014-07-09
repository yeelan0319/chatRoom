var _parseData = function(data){
    try{
        data = JSON.parse(data);
    }
    catch(e){
        console.log("Receive invalid JSON");
    }
    return data;
}

module.exports = function(app){
	var socketExtension = require('./socketExtension');
	var ioController = require('./ioController')(app);
    var roomController = require('./roomController')(app);

	//socket io middlewares
    app.io.use(function(socket, next){
        //TODOS: Should generate socket based session key if the initial request is not via browser
        // var seed = crypto.randomBytes(20);
        // socket.token = socket.request.signedCookies['PHPSESSID'] || crypto.createHash('sha1').update(seed).digest('hex');
        app.middleware.cookieParserFunction(socket.request, {}, function(){
            socket.token = socket.request.signedCookies['PHPSESSID'];
            socket.join('/private/session/' + socket.token);
            next();
        });
    });
    app.io.use(function(socket, next){
        socket.request.originalUrl = "/";
        app.middleware.sessionParserFunction(socket.request, {}, next);
    });
    app.io.use(socketExtension);

    //event listening
    app.io.on('connection', function(socket){
        var session = socket.request.session;
        var socketID = socket.id;

        ioController.checkLoginStatus(session, socketID);

        //register listeners needed
        socket.on('loginRender', function(){
            socket.isLoggedIn() ? socket.renderLounge() : socket.renderLogin();
        });
        socket.on('registerRender', function(){
            socket.isLoggedIn() ? socket.renderLounge() : socket.renderRegister();
        });
        socket.on('retrieveRoomListAction', function(){
            if(socket.isLoggedIn()){
                roomController.retrieveRoomList(socketID);
            }
        });
        socket.on('joinRoomAction', function(id){
            if(socket.isLoggedIn()){
                var room = app.roomList[id];
                if(room){
                    var name = room.name;
                    socket.joinRoom(id, name);
                }
            }
        });
        socket.on('leaveRoomAction', function(id){
            if(socket.isLoggedIn()){
                socket.leaveRoom(id);
            }
        });
        socket.on('adminRender', function(id){
            if(id===0){
                if(socket.isAdmin()){
                    socket.renderSystemAdmin();
                }
            }
            else{
                if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                    socket.renderRoomAdmin(id);
                }
            }
        });
        socket.on('retrieveLinkedUserAction', function(){
            if(socket.isAdmin()){
                ioController.retrieveLinkedUser(socketID);
            }
        });
        socket.on('retrieveUserDataAction', function(){
            if(socket.isAdmin()){
                ioController.retrieveUserList(socketID);
            }
        });
        socket.on('retrieveRoomLinkedUserAction', function(id){
            if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                roomController.retrieveLinkedUser(id, socketID);
            }
        });

        socket.on('loginAction', function(data){
            data = _parseData(data);
            if(!socket.isLoggedIn()){
                var username = data.username;
                var password = data.password;
                ioController.loginUser(username, password, session);
            }
        });
        
        socket.on('registerAction', function(data){
            data = _parseData(data);
            if(!socket.isLoggedIn()){
                var username = data.username;
                var password = data.password;
                ioController.createNewUser(username, password, session);
            }
        });
        socket.on('logoutAction', function(){
            if(socket.isLoggedIn()){
                ioController.logoutUser(session);
            }
        });
        socket.on('editPermissionAction', function(data){
            data = _parseData(data);
            if(socket.isAdmin()){
                var username = data.username;
                var permission = data.permission;
                ioController.editUser(username, permission);
            }
        });
        socket.on('deleteUserAction', function(data){
            data = _parseData(data);
            if(socket.isAdmin()){
                var username = data.username;
                ioController.deleteUser(username);  
            }
        });
        socket.on('systemBootAction', function(data){
            data = _parseData(data);
            if(socket.isAdmin()){
                var username = data.username;
                ioController.bootUser(username);
            }
        });
        socket.on('editRoomAdminAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                var username = data.username;
                var permission = data.permission;
                roomController.editRoomAdmin(id, username, permission);
            }
        });
        socket.on('roomBootAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                var username = data.username;
                roomController.bootUser(id, username);
            }
        });
        socket.on('chatAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(socket.isLoggedIn() && socket.isInRoom(id)){
                var msg = data.msg;
                app.io.to('/chatRoom/' + id).emit('chat message', socket.username + ': ' + msg);
            }
        });
        socket.on('createRoomAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var name = data.name;
                roomController.createRoom(name, socket.username);
            }
        });
        socket.on('destoryRoomAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                roomController.destoryRoom(id);
            }
        });
        socket.on('disconnect', function(){
            if(socket.isLoggedIn()){
                socket.seeyouUser();
            }
        });
    });
}