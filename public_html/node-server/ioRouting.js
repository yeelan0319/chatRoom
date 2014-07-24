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
        socket.on('joinRoomAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var from = data.from;
                var to = data.to;
                socket.leaveRoom(from);

                if(to === 0){
                    socket.joinLounge();
                }
                else{
                    var targetRoom = app.roomList[to];
                    if(targetRoom){
                        var name = targetRoom.name;
                        socket.joinRoom(to, name);
                    }
                }
            }
        });
        socket.on('leaveRoomAction', function(id){
            if(socket.isLoggedIn()){
                socket.leaveRoom(id);
            }
        });
        socket.on('retrievePastMessage', function(id){
            if(socket.isLoggedIn()){
                ioController.retrievePastMessage(id, socketID);
            }
        });
        socket.on('retrieveUserProfileAction', function(){
            if(socket.isLoggedIn()){
                ioController.retrieveUserProfile(socketID);
            }
        });
        socket.on('createPmAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var username = data.username;
                ioController.createPm(username, socketID);
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
        socket.on('retrieveChatLogAction', function(constraints){
            constraints = _parseData(constraints);
            if(socket.isAdmin()){
                ioController.retrieveChatLog(constraints, socketID);
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
                var firstName = data.firstName;
                var lastName = data.lastName;
                var phoneNumber = data.phoneNumber;
                var birthday = data.birthday;
                var jobDescription = data.jobDescription;
                ioController.createNewUser(username, password, firstName, lastName, phoneNumber, birthday, jobDescription, session);
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
        socket.on('sendPmAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var toUsername = data.toUsername;
                var msg = data.msg;
                ioController.sendPm(toUsername, msg, socketID);     
            }
        });
        socket.on('readPmAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var fromUsername = data.fromUsername;
                var toUsername = socket.username;
                ioController.readPm(fromUsername, toUsername);
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
                ioController.sendChatMessage(socket.username, socket.firstName, socket.lastName, id, msg);
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