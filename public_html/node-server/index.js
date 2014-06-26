/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var SESSIONAGE = 3600000 * 24 * 30;
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
var socketGarbageCollector = require('./socketGarbageCollector');

//socketio's Socket object prototype extension
var Socket = require('socket.io/lib/socket');
Socket.prototype.extendSessionAge = function(socket){
    var session = socket.request.session;
    //half window extension
    if(session.cookie.maxAge < (SESSIONAGE/2)){
        socket.emit('session extension');
        var sessionRoom = io.sockets.adapter.rooms['/private/session/'+session.id];
        for(var socketID in sessionRoom){
            if(sessionRoom.hasOwnProperty(socketID)){
                var targetSocket = socketList[socketID];
                targetSocket.request.session.touch();
            }
        }
    }
};
Socket.prototype.renderErrorMsg = function(socket, errorJSON){
    socket.emit('system message', errorJSON);
    console.log(errorJSON);
};
Socket.prototype.setSocketUser = function(socket, user){
    socket.username = user.username;
    socket.permission = user.permission;
    socket.join('/private/user/'+socket.username);
    socket.renderChat(socket);
};
Socket.prototype.removeSocketUser = function(socket, user){
    delete socket.username;
    delete socket.permission;
    socket.leave('/private/user/'+socket.username);
};
Socket.prototype.welcomeUser = function(socket, user){
    console.log(socket.username + ' is connected');
    socket.broadcast.emit('status message', socket.username + ' has joined the conversation');
};
Socket.prototype.seeyouUser = function(socket){
    console.log(socket.username + ' has quitted the conversation');
    socket.broadcast.emit('status message', socket.username + ' has quitted the conversation');
};

Socket.prototype.changePermission = function(socket, permission){
    socket.permission = permission;
}

Socket.prototype.isLoggedIn = function(socket){
    return socket.username ? true : false;
};
Socket.prototype.isAdmin = function(socket){
    return socket.permission == 1 ? true : false;
};

Socket.prototype.renderLogin = function(socket){
    socket.emit('render message', 'login');
};
Socket.prototype.renderRegister = function(socket){
    socket.emit('render message', 'register');
};
Socket.prototype.renderChat = function(socket){
    socket.emit('render message', 'chat');
};
Socket.prototype.renderAdmin = function(socket){
    socket.emit('render message', 'admin');
};
Socket.prototype.renderBoot = function(socket){
    socket.emit('render message', 'bootedPage');
}

var checkLoginStatus = function(session, isLoginFunc, isntLoginFunc){
    var username = session.username;
    if(username){
        findUserWithUsername(username, function(user){
            user ? isLoginFunc(user) : function(){
                                            delete session.username;
                                            session.save();
                                            isntLoginFunc();
                                        }
        });
    }
    else{
        isntLoginFunc();
    }
} 
//Database operations 
var findUserWithUsername = function(username, success){
    app.db.collection('users').findOne({'username': username}, function(err, user){
        if(err){
            throw new DatabaseError();
            //redo the work
        }
        else{
            success(user);
        }
    }); 
};
    
var createNewUser = function(username, password, session, success){
    findUserWithUsername(username, function(user){
        if(user){
            throw new ExistingUserError();
        }
        else{
            var user = {'username': username, 'password': crypto.createHash('sha1').update(password).digest('hex'), 'permission':0};
            app.db.collection('users').insert(user, {w:1}, function(err, result) {
                if(err){
                    throw new DatabaseError();
                }
                else{
                    loginUser(username, password, session, success);
                }
            });
        }
    });
};
    
var loginUser = function(username, password, session, success){
    findUserWithUsername(username, function(user){
        if(user && user.password === crypto.createHash('sha1').update(password).digest('hex')){
            session.username = user.username;
            session.save();
            success(user);
        }
        else{
            throw new WrongPasswordError();
        }
    });
}

var logoutUser = function(session, success){
    delete session.permission;
    delete session.username;
    session.save();
    success(session.socketID);
}

var retrieveUserList = function(success){
    app.db.collection('users').find().toArray(function(err, documents){
        if(err){
            throw new DatabaseError();
            //redo the work
        }
        else{
            success(documents);
        }
    });
}

var editUser = function(username, permission, success){
    app.db.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:{permission: permission}}, {}, function(err, user){
        if(err){
            throw new DatabaseError();
        }
        else{
            success();
        }
    });
}

var deleteUser = function(username, success){
    app.db.collection('users').remove({username:username}, function(err, result){
        if(err){
            throw new DatabaseError();
        }
        else{
            success();   
        }
    });
}

//json status render
var DatabaseError = function(){
    this.JSON = JSON.stringify({meta: {status: 500, msg: "database failure"}, data:{}});
}
var InvalidRequestError = function(){
    this.JSON = JSON.stringify({meta: {status: 500, msg: "bad request"}, data:{}});
}

var WrongPasswordError = function(){
    this.JSON = JSON.stringify({meta: {status: 403, msg: "login failed, please check your password"}, data:{}});
}

var ExistingUserError = function(){
    this.JSON = JSON.stringify({meta: {status: 409, msg: "existing user. please log in"}, data:{}});
}

var SuccessJson = function(data){
    return JSON.stringify({meta: {status: 200, msg: "OK"}, data: data});
}

//naive data validator
var validateData = function(data){
    if(typeof(data) === 'undefined' || typeof(data.username) === 'undefined' || typeof(data.password) === 'undefined'){
        throw new InvalidRequestError();
    }
}

function ServerStart(){
    var dbConnection = function(success) {
        MongoClient.connect("mongodb://127.0.0.1:27017/test", function(err,db){
            if(err){
                console.dir(err);
                //should set a upper bound for try time
                dbConnection();
            }
            else{
                console.log("Connected to database");
                success(db);
            }
        });
    };
    var ServerInitialization = function(db){
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
                maxAge: SESSIONAGE,
                expires: new Date(Date.now()+SESSIONAGE)
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

        //event listening
        io.on('connection', function(socket){
            var eventList = ['loginRender', 'loginAction', 'registerRender', 'registerAction', 'logoutAction', 'chatAction', 'adminRender', 'retrieveUserDataAction', 'retrieveLinkedUserAction', 'forceLogout', 'editPermissionAction', 'deleteUserAction'];
            for(var i = 0; i < eventList.length; i++){
                socket.on(eventList[i], function(){
                    socket.extendSessionAge(socket);
                });
            }

            try{
                checkLoginStatus(socket.request.session, function(user){
                    socket.setSocketUser(socket, user);
                    socket.welcomeUser(socket); 
                }, function(){
                    socket.renderLogin(socket);
                });
            }
            catch(e){
                socket.renderErrorMsg(socket, e.JSON);
            }

            socket.on('loginRender', function(){
                socket.isLoggedIn(socket) ? socket.renderChat(socket) : socket.renderLogin(socket);
            });
            socket.on('loginAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(!socket.isLoggedIn(socket)){
                    try{
                        validateData(data);
                    }
                    catch(e){
                        socket.renderErrorMsg(socket, e.JSON);
                    }

                    var username = data.username;
                    var password = data.password;
                    var session = socket.request.session;
                    try{
                        loginUser(username, password, session, function(user){
                            var sessionRoom = io.sockets.adapter.rooms['/private/session/'+session.id];
                            for(var socketID in sessionRoom){
                                if(sessionRoom.hasOwnProperty(socketID)){
                                    var targetSocket = socketList[socketID];
                                    targetSocket.setSocketUser(targetSocket, user);
                                }
                            }
                            socket.welcomeUser(socket);
                        }); 
                    }
                    catch(e){
                        socket.renderErrorMsg(socket, e.JSON);
                    }
                }
            });
            socket.on('registerRender', function(){
                socket.isLoggedIn(socket) ? socket.renderChat(socket) : socket.renderRegister(socket);
            });
            socket.on('registerAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(!socket.isLoggedIn(socket)){
                    try{
                        validateData(data);
                    }
                    catch(e){
                        socket.renderErrorMsg(socket, e.JSON);
                    }

                    var username = data.username;
                    var password = data.password;
                    var session = socket.request.session;
                    try{
                        createNewUser(username, password, session, function(user){
                            var sessionRoom = io.sockets.adapter.rooms['/private/session/'+session.id];
                            for(var socketID in sessionRoom){
                                if(sessionRoom.hasOwnProperty(socketID)){
                                    var targetSocket = socketList[socketID];
                                    targetSocket.setSocketUser(targetSocket, user);
                                }
                            }
                            socket.welcomeUser(socket);
                        });
                    }
                    catch(e){
                        socket.renderErrorMsg(socket, e.JSON);
                    }
                }
            });
            socket.on('logoutAction', function(){
                if(socket.isLoggedIn(socket)){
                    var session = socket.request.session;
                    logoutUser(session, function(){
                        socket.seeyouUser(socket);

                        var sessionRoom = io.sockets.adapter.rooms['/private/session/'+session.id];
                        for(var socketID in sessionRoom){
                            if(sessionRoom.hasOwnProperty(socketID)){
                                var targetSocket = socketList[socketID];
                                targetSocket.removeSocketUser(targetSocket);
                                targetSocket.renderLogin(targetSocket);
                            }
                        }
                    });
                }
            }); 
            socket.on('chatAction', function(msg){
                if(socket.isLoggedIn(socket)){
                    io.sockets.emit('chat message', socket.username + ': ' + msg);
                }
            }); 
            socket.on('disconnect', function(){
                if(socket.username){
                    socket.seeyouUser(socket);
                }
            });
            socket.on('adminRender', function(){
                if(socket.isAdmin(socket)){
                    socket.renderAdmin(socket);
                }
            });
            socket.on('retrieveUserDataAction', function(){
                if(socket.isAdmin(socket)){
                    try{
                        retrieveUserList(function(data){
                            socket.emit('users data', SuccessJson(data));
                        }); 
                    }
                    catch(e){
                        socket.renderErrorMsg(socket, e.JSON);
                    }  
                }
            });
            socket.on('editPermissionAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(socket.isAdmin(socket)){
                    var username = data.username;
                    var permission = data.permission;
                    try{
                        editUser(username, permission, function(){
                            var userRoom = io.sockets.adapter.rooms['/private/user/'+username];
                            for(var socketID in userRoom){
                                if(userRoom.hasOwnProperty(socketID)){
                                    var targetSocket = socketList[socketID];
                                    targetSocket.changePermission(targetSocket, permission);
                                }
                            }
                        }); 
                    }
                    catch(e){
                        socket.renderErrorMsg(socket, e.JSON);
                    }
                }
            });
            socket.on('deleteUserAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(socket.isAdmin(socket)){
                    var username = data.username;
                    try{
                        deleteUser(username, function(){
                            var userRoom = io.sockets.adapter.rooms['/private/user/'+username];
                            for(var socketID in userRoom){
                                if(userRoom.hasOwnProperty(socketID)){
                                    var targetSocket = socketList[socketID];
                                    targetSocket.removeSocketUser(targetSocket);
                                    targetSocket.renderRegister(targetSocket);
                                }
                            }
                        }); 
                    }
                    catch(e){
                        socket.renderErrorMsg(socket, e.JSON);
                    }   
                }
            });
            socket.on('retrieveLinkedUserAction', function(){
                if(socket.isAdmin(socket)){
                    var sockets = [];
                    for(var socketID in socketList){
                        if(socketList.hasOwnProperty(socketID)){
                            var simpleSocket = {};
                            var targetSocket = socketList[socketID];
                            simpleSocket.id = targetSocket.id;
                            simpleSocket.username = targetSocket.username;
                            simpleSocket.permission = targetSocket.permission;
                            simpleSocket.token = targetSocket.token;
                            sockets.push(simpleSocket);
                        }
                    }
                    socket.emit('linked users data', SuccessJson(sockets));
                }
            });
            socket.on('forceLogout', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(socket.isAdmin(socket)){
                    var username = data.username;
                    var userRoom = io.sockets.adapter.rooms['/private/user/'+username];
                    for(var socketID in userRoom){
                        if(userRoom.hasOwnProperty(socketID)){
                            var targetSocket = socketList[socketID];
                            if(targetSocket.isLoggedIn(targetSocket)){
                                var session = targetSocket.request.session;
                                logoutUser(session, function(){});
                            }
                            targetSocket.removeSocketUser(targetSocket);
                            targetSocket.renderBoot(targetSocket);
                            targetSocket.disconnect();
                        }
                    }
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

    dbConnection(ServerInitialization);
}

ServerStart();