var validator = require('../public/validator');
var responseJson = require('./responseJson');
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
        socket.on('joinRoomAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var from = data.from;
                var to = data.to;

                if((to===0||roomController._getRoom(to))&&(from===0||roomController._getRoom(from))){
                    roomController.joinRoom(to, socketID);
                    socket.leaveRoom(from);
                }
                else{
                   socket.emit('system warning', responseJson.badData()); 
                }
            }
            else{
                //user not logged in
            }
        });
        socket.on('leaveRoomAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var id = data.id;
                if(id===0 || roomController._getRoom(id)){
                    socket.leaveRoom(id);
                }
                else{
                   socket.emit('system warning', responseJson.badData()); 
                }
            }
            else{
                //user not logged in
            }
        });
        socket.on('retrieveUserProfileAction', function(){
            if(socket.isLoggedIn()){
                ioController.retrieveUserProfile(socketID);
            }
            else{
                //user not logged in
            }
        });
        socket.on('searchPmAction', function(str){
            if(socket.isLoggedIn()){
                ioController.searchPm(str, socketID);
            }
            else{
                //user not logged in
            }
        });
        socket.on('createPmAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var username = data.username;
                if(!validator.nickName(username)){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.createPm(username, socketID);
                }
            }
            else{
                //user not logged in
            }
        });
        socket.on('adminRender', function(id){
            if(id===0){
                if(socket.isAdmin()){
                    socket.renderSystemAdmin();
                }
                else{
                    //user donnot have the provilage for this operation
                }
            }
            else{
                if(roomController._getRoom(id)){
                    if(socket.isAdmin() || roomController.isAdminOfRoom(id, socket.username)){
                        socket.renderRoomAdmin(id);
                    }
                    else{
                        //user donnot have the privilage for this operation
                    }
                }
                else{
                    socket.emit('system warning', responseJson.badData());
                }
            }
        });
        socket.on('retrieveLinkedUserAction', function(){
            if(socket.isAdmin()){
                ioController.retrieveLinkedUser(socketID);
            }
            else{
                //user donnot have the privilage
            }
        });
        socket.on('retrieveUserDataAction', function(){
            if(socket.isAdmin()){
                ioController.retrieveUserList(socketID);
            }
            else{
                //user donnot have the privilage
            }
        });
        socket.on('retrieveRoomLinkedUserAction', function(id){
            if(roomController._getRoom(id)){
                if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                    roomController.retrieveLinkedUser(id, socketID);
                }
                else{
                    //user donnot have the privilage
                }
            }
            else{
                socket.emit('system warning', responseJson.badData());
            }
        });
        socket.on('retrieveChatLogAction', function(constraints){
            constraints = _parseData(constraints);
            if(socket.isAdmin()){
                ioController.retrieveChatLog(constraints, socketID);
            }
            else{
                //user donnot have the privilage
            }
        });
        socket.on('loginAction', function(data){
            data = _parseData(data);
            if(!socket.isLoggedIn()){
                var username = data.username;
                var password = data.password;
                if(!validator.nickName(username)||!validator.password(password)){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.loginUser(username, password, session);
                }
            }
        });
        
        socket.on('registerAction', function(data){
            data = _parseData(data);
            if(!socket.isLoggedIn()){
                var username = data.username;
                var password = data.password;
                var email = data.email;
                if(!validator.nickName(username)||!validator.password(password)||!validator.email(email)){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.createNewUser(username, password, email, session);
                }  
            }
        });
        socket.on('logoutAction', function(){
            if(socket.isLoggedIn()){
                ioController.logoutUser(session);
            }
            else{
                //user is not logged
            }
        });
        socket.on('editPermissionAction', function(data){
            data = _parseData(data);
            if(socket.isAdmin()){
                var username = data.username;
                var permission = data.permission;
                if(!validator.nickName(username)||!validator.permission(permission)||socket.username === username){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.editUserPermission(username, permission);
                }
            }
            else{
                //user donnot have the privilage
            }
        });
        socket.on('deleteUserAction', function(data){
            data = _parseData(data);
            if(socket.isAdmin()){
                var username = data.username;
                if(!validator.nickName(username) || socket.username===username){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.deleteUser(username);
                }
            }
            else{
                //user donnot have the privilage
            }
        });
        socket.on('systemBootAction', function(data){
            data = _parseData(data);
            if(socket.isAdmin()){
                var username = data.username;
                if(!validator.nickName(username) || socket.username===username){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.bootUser(username);
                }
            }
            else{
                //user donnot have the privilage
            }
        });
        socket.on('sendPmAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var toUsername = data.toUsername;
                var msg = data.msg;
                if(!validator.nickName(toUsername)){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.sendPm(toUsername, msg, socketID);
                }    
            }
            else{
                //user not logged in
            }
        });
        socket.on('readPmAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var fromUsername = data.fromUsername;
                var toUsername = socket.username;
                if(!validator.nickName(fromUsername) || !validator.nickName(toUsername)){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.readPm(fromUsername, toUsername);
                }
            }
            else{
                //user not logged in
            }
        });
        socket.on('editUserAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var username = socket.username;
                
                var firstNameFlag = typeof data.firstName === 'undefined'? true : validator.personName(data.firstName);
                var lastNameFlag = typeof data.lastName === 'undefined'? true : validator.personName(data.lastName);
                var phoneNumberFlag = typeof data.phoneNumber === 'undefined'? true : validator.phoneNumber(data.phoneNumber);
                var birthdayFlag = typeof data.birthday === 'undefined'? true : validator.date(data.birthday);
                var jobDescriptionFlag = typeof data.jobDescription === 'undefined'? true : validator.textMaxLength(data.jobDescription);
                if(!firstNameFlag||!lastNameFlag||!phoneNumberFlag||!birthdayFlag||!jobDescriptionFlag){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    ioController.editUserInfo(username, data);
                }
            }
            else{
                //user not logged in
            }
        });
        socket.on('editRoomAdminAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(roomController._getRoom(id)){
                if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                    var username = data.username;
                    var permission = data.permission;
                    if(!validator.nickName(username) || !validator.permission(permission) || socket.username===username){
                        socket.emit('system warning', responseJson.badData());
                    }
                    else{
                        roomController.editRoomAdmin(id, username, permission);
                    }
                }
                else{
                    //user donnot have the privilage
                }
            }
            else{
                socket.emit('system warning', responseJson.badData());
            }
        });
        socket.on('roomBootAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(roomController._getRoom(id)){
                if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                    var username = data.username;
                    if(!validator.nickName(username) || socket.username===username){
                        socket.emit('system warning', responseJson.badData());
                    }
                    else{
                        roomController.bootUser(id, username);
                    }
                }
            }
            else{
               socket.emit('system warning', responseJson.badData()); 
            }
        });
        socket.on('chatAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(id===0||roomController._getRoom(id)){
                if(socket.isLoggedIn() && socket.isInRoom(id)){
                    var msg = data.msg;
                    ioController.sendChatMessage(socket.username, id, msg);
                }
                else{
                    //user not logged in
                }
            }
            else{
                socket.emit('system warning', responseJson.badData());
            }   
        });
        socket.on('createRoomAction', function(data){
            data = _parseData(data);
            if(socket.isLoggedIn()){
                var name = data.name;
                if(!validator.nickName(name)){
                    socket.emit('system warning', responseJson.badData());
                }
                else{
                    roomController.createRoom(name, socket.username);
                }
            }
            else{
                //user not logged in
            }
        });
        socket.on('destoryRoomAction', function(data){
            data = _parseData(data);
            var id = data.id;
            if(roomController._getRoom(id)){
                if(socket.isAdmin()|| roomController.isAdminOfRoom(id, socket.username)){
                    roomController.destoryRoom(id);
                }
                else{
                    //user donnot have the privilage
                }
            }
            else{
                socket.emit('system warning', responseJson.badData());
            }
        });
        socket.on('disconnect', function(){
            if(socket.isLoggedIn()){
                socket.seeyouUser();
            }
            else{
                //user not logged in
            }
        });
    });
}