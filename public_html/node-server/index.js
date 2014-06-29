var DAY = 1000 * 60 * 60 * 24;  //millisecond in a day
var SESSIONAGE = DAY * 30;
var SECRET = '3d4f2bf07dc1be38b20cd6e46949a1071f9d0e3d';

var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var express = require("express");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var crypto = require('crypto');
var fs = require('fs');
var httpModule = require('http');
var httpsModule = require('https');
var socketioModule = require('socket.io');
var socketExtension = require('./socketExtension');
var socketGarbageCollector = require('./socketGarbageCollector');
var databaseModule = require('databaseModule');

databaseModule.on('userLoggedIn', welcomeSocket);
databaseModule.on('userNotLoggedIn', renderLoginSocket);
databaseModule.on('successfullyLoggedInUser', welcomeSession)
databaseModule.on('successfullyLoggedOutUser', renderLoginSession);
databaseModule.on('successfullyRetrievedUserList', sendUserListSocket);
databaseModule.on('successfullyChangedUserPermission', informChangedPermissionUser);
databaseModule.on('successfullyDeletedUser', renderRegisterUser);

var welcomeSocket = function(res){
    var socket = socketList[res.target];
    _welcomeUser(socket, res.user);
}

var renderLoginSocket = function(res){
    var socket = socketList[res.target];
    _renderLogin(socket);
}

var welcomeSession = function(res){
    var sessionRoom = io.sockets.adapter.rooms['/private/session/'+res.target];
    for(var socketID in sessionRoom){
        if(sessionRoom.hasOwnProperty(socketID)){
            var socket = socketList[socketID];
            _welcomeUser(socket, res.user);
        }
    }
}

var renderLoginSession = function(res){
    var sessionRoom = io.sockets.adapter.rooms['/private/session/'+res.target];
    for(var socketID in sessionRoom){
        if(sessionRoom.hasOwnProperty(socketID)){
            var socket = socketList[socketID];
            _seeyouUser(socket);
            _renderLogin(socket);
        }
    }
}

var sendUserListSocket = function(res){
    var socket = socketList[res.target];
    socket.emit('users data', SuccessJson(res.data));
}

var informChangedPermissionUser = function(res){
    var username = res.target;
    var permission = res.permission;
    var userRoom = io.sockets.adapter.rooms['/private/user/'+username];
    for(var socketID in userRoom){
        if(userRoom.hasOwnProperty(socketID)){
            var socket = socketList[socketID];
            socket.changePermission(permission);
        }
    }
}

var renderRegisterUser = function(res){
    var username = res.username;
    var userRoom = io.sockets.adapter.rooms['/private/user/'+username];
    for(var socketID in userRoom){
        if(userRoom.hasOwnProperty(socketID)){
            var socket = socketList[socketID];
            _seeyouUser(socket);
            _renderRegister(socket);
        }
    }
}

var retrieveLinkedUser = function(socketID){
    var socket = socketList[socketID];
    var data = [];
    for(var socketID in socketList){
        if(socketList.hasOwnProperty(socketID)){
            var simpleSocket = {};
            var targetSocket = socketList[socketID];
            simpleSocket.id = targetSocket.id;
            simpleSocket.username = targetSocket.username;
            simpleSocket.permission = targetSocket.permission;
            simpleSocket.token = targetSocket.token;
            data.push(simpleSocket);
        }
    }
    socket.emit('linked users data', SuccessJson(data));
}

var boot = function(username){
    var userRoom = io.sockets.adapter.rooms['/private/user/'+username];
    for(var socketID in userRoom){
        if(userRoom.hasOwnProperty(socketID)){
            var targetSocket = socketList[socketID];
            targetSocket.renderBoot(targetSocket);
            targetSocket.disconnect();
        }
    }
}

var _welcomeUser = function(socket, user){
    socket.setSocketUser(user);
    socket.welcomeUser(); 
}

var _seeyouUser = function(socket){
    socket.seeyouUser();
    socket.removeSocketUser();
}

var _renderLogin = function(socket){
    socket.renderLogin();
}

var _renderRegister = function(socket){
    socket.renderRegister();
}

var _parseData = function(data){
    try{
        data = JSON.parse(data);
    }
    catch(e){
        console.log("Receive invalid JSON");
    }
    return data;
}

var ServerStart = function(){
    var dbConnection = function() {
        MongoClient.connect("mongodb://127.0.0.1:27017/test", function(err,db){
            if(err){
                //should set a upper bound for try time
                dbConnection();
            }
            else{
                console.log("Connected to database");
                serverInitialization(db);
            }
        });
    };

    var serverInitialization = function(db){
        app = {};
        app.db = db;
        app.sessiondb = new MongoStore({
            db: app.db
        });
        cookieParserFunction = cookieParser(SECRET);
        sessionParserFunction = expressSession({
            name:'PHPSESSID',
            secret: SECRET,
            cookie: {
                maxAge: SESSIONAGE
            },
            store: app.sessiondb,
            rolling: true
        });
        app.express = express();
        app.express.use(express.static(__dirname + '/../public'));
        app.express.use(cookieParserFunction);
        app.express.use(sessionParserFunction);

        //routing
        app.express.get('/', function(req, res){
            res.sendfile(path.resolve(__dirname+'/../index.html'));
        });
        app.express.get('/sessionExtension', function(req, res){
            res.write(SuccessJson());
            res.end();
        })

        http = httpModule.createServer(function(req, res){
            res.writeHead(302, {Location: 'https://' + req.headers.host + req.url});
            res.end();
        });
        var options = {
            key: fs.readFileSync('/path/to/server.key.orig'),
            cert: fs.readFileSync('/path/to/server.crt')
        };
        https = httpsModule.Server(options, app.express);
        
        io = socketioModule(https);
        socketList = io.of('/').connected;
        
        //socket io middlewares
        io.use(function(socket, next){
            //TODOS: Should generate socket based session key if the initial request is not via browser
            // var seed = crypto.randomBytes(20);
            // socket.token = socket.request.signedCookies['PHPSESSID'] || crypto.createHash('sha1').update(seed).digest('hex');
            cookieParserFunction(socket.request, {}, function(){
                socket.token = socket.request.signedCookies['PHPSESSID'];
                socket.join('/private/session/' + socket.token);
                next();
            });
        });
        io.use(function(socket, next){
            socket.request.originalUrl = "/";
            sessionParserFunction(socket.request, {}, next);
        });
        io.use(socketExtension);

        //event listening
        io.on('connection', function(socket){
            var session = socket.request.session;
            var socketID = socket.id;

            databaseModule.checkLoginStatus(session, socketID);

            //register listeners needed
            socket.on('loginRender', function(){
                socket.isLoggedIn() ? socket.renderChat() : socket.renderLogin();
            });
            socket.on('loginAction', function(data){
                data = _parseData(data);
                if(!socket.isLoggedIn()){
                    //should validate data here!!
                    var username = data.username;
                    var password = data.password;
                    databaseModule.loginUser(username, password, session);
                }
            });
            socket.on('registerRender', function(){
                socket.isLoggedIn() ? socket.renderChat() : socket.renderRegister();
            });
            socket.on('registerAction', function(data){
                data = _parseData(data);
                if(!socket.isLoggedIn()){
                    //should validate data here!!
                    var username = data.username;
                    var password = data.password;
                    databaseModule.createNewUser(username, password, session);
                }
            });
            socket.on('logoutAction', function(){
                if(socket.isLoggedIn()){
                    databaseModule.logoutUser(session);
                }
            }); 
            socket.on('chatAction', function(msg){
                if(socket.isLoggedIn()){
                    io.sockets.emit('chat message', socket.username + ': ' + msg);
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
                    databaseModule.retrieveUserList(socketID);
                }
            });
            socket.on('editPermissionAction', function(data){
                data = _parseData(data);
                if(socket.isAdmin()){
                    var username = data.username;
                    var permission = data.permission;
                    databaseModule.editUser(username, permission);
                }
            });
            socket.on('deleteUserAction', function(data){
                data = _parseData(data);
                if(socket.isAdmin()){
                    var username = data.username;
                    deleteUser(username);  
                }
            });
            socket.on('retrieveLinkedUserAction', function(){
                if(socket.isAdmin()){
                    retrieveLinkedUser(socketID);
                }
            });
            socket.on('forceLogout', function(data){
                data = _parseData(data);
                if(socket.isAdmin()){
                    var username = data.username;
                    boot(username);
                }
            });
        });
            
        portListeningStart();
    }

    var portListeningStart = function(){
        //start listening to port and receive request
        http.listen(80, function(err){
            console.log("http listening on port: 80");
        });
        https.listen(443, function(err){
            console.log("https listening on port: 443");
        });
        socketGarbageCollector.start(socketList);
    }

    dbConnection(serverInitialization);
}

ServerStart();