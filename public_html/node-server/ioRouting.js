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
            socket.isLoggedIn() ? socket.renderChat() : socket.renderLogin();
        });
        socket.on('loginAction', function(data){
            data = _parseData(data);
            if(!socket.isLoggedIn()){
                var username = data.username;
                var password = data.password;
                ioController.loginUser(username, password, session);
            }
        });
        socket.on('registerRender', function(){
            socket.isLoggedIn() ? socket.renderChat() : socket.renderRegister();
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
        socket.on('chatAction', function(msg){
            if(socket.isLoggedIn()){
                app.io.sockets.emit('chat message', socket.username + ': ' + msg);
            }
        }); 
        socket.on('disconnect', function(){
            if(socket.isLoggedIn()){
                socket.seeyouUser();
            }
        });
        socket.on('adminRender', function(){
            if(socket.isAdmin()){
                socket.renderAdmin();
            }
        });
        socket.on('retrieveUserDataAction', function(){
            if(socket.isAdmin()){
                ioController.retrieveUserList(socketID);
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
        socket.on('retrieveLinkedUserAction', function(){
            if(socket.isAdmin()){
                ioController.retrieveLinkedUser(socketID);
            }
        });
        socket.on('forceLogout', function(data){
            data = _parseData(data);
            if(socket.isAdmin()){
                var username = data.username;
                ioController.bootUser(username);
            }
        });
    });
}