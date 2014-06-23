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

//socketio's Socket object prototype extension
var Socket = require('socket.io/lib/socket');
Socket.prototype.extendSessionAge = function(){
    this.request.session.touch().save();
};

//sessionList prototype extension
var SessionList = function(){
    this.sessions = {};
    this.locked = false;
};

SessionList.prototype.getSessionObject = function(socket){
    return this.sessions[socket.token] || '';
}

SessionList.prototype.getSessionObjectByToken = function(token){
    return this.sessions[token] || '';
}

SessionList.prototype.setSessionObject = function(socket){
    this.sessions[socket.token] = socket.request.session;
    return this.sessions[socket.token];
}

//set socket session middleware, depend on that the program have a global sessionList object and its extension
var setSocketSession = function(socket, next){
    if(typeof sessionList == 'undefined'){
        sessionList = new SessionList();
        console.log("log::create session list");
    }
    var session = sessionList.getSessionObject(socket);
    console.log(sessionList);
    if(session){
        console.log("log::reading exsiting session");
        session.counter++;
        socket.request.session = session;
        if(!session.socketID){
            session.socketID = [];
        }
        session.socketID.push(socket.id);
        session.save();
        next();
    }
    else{
        if(sessionList.locked){
            setTimeout(function(){sessionList.setSocketSession(socket, next)}, 100);
            return;
        }
        else{
            console.log("log::build new session instance");
            socket.request.originalUrl = "/";
            sessionList.locked = true;
            sessionParserFunction(socket.request, {}, function(){
                var session = socket.request.session;
                if(!session.socketID){
                    session.socketID = [];
                }
                session.socketID.push(socket.id);
                session.counter = 1;
                session.save();
                sessionList.setSessionObject(socket);
                sessionList.locked = false;
                next();
            }); 
        }
    }
}
 
//Database operations 
var findUserWithUsername = function(username, success, error){
    app.db.collection('users').findOne({'username': username}, function(err, user){
        if(err){
            error(renderDatabaseErrorJson);
            //redo the work
        }
        else{
            success(user);
        }
    }); 
};
    
var createNewUser = function(username, password, success, error){
    findUserWithUsername(username, function(user){
        if(user){
            error(renderExistingUserJson);
        }
        else{
            var user = {'username': username, 'password': crypto.createHash('sha1').update(password).digest('hex'), 'permission':0};
            app.db.collection('users').insert(user, {w:1}, function(err, result) {
                if(err){
                    error(renderDatabaseErrorJson);
                }
                else{
                    loginUser(username, password, success, error);
                }
            });
        }
    }, error);
};
    
var loginUser = function(username, password, success, error){
    findUserWithUsername(username, function(user){
        if(user && user.password === crypto.createHash('sha1').update(password).digest('hex')){
            success(user);
        }
        else{
            error(renderWrongPasswordJson);
        }
    }, error);
}

var checkPermission = function(username, success, error){
    var username = socket.request.session.username;
    if(username){
        findUserWithUsername(username, success, error);
    }
}

var logoutUser = function(session, success){
    delete session.permission;
    delete session.username;
    session.save();
    success(session.socketID);
}

var retrieveUserList = function(success, error){
    app.db.collection('users').find().toArray(function(err, documents){
        if(err){
            error(renderDatabaseErrorJson);
            //redo the work
        }
        else{
            success(documents);
        }
    });
}

var editUser = function(username, permission, success, error){
    app.db.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:{permission: permission}}, {}, function(err, user){
        if(err){
            error(renderDatabaseErrorJson);
        }
        else{
            success();
        }
    });
}

var deleteUser = function(username, success, error){
    app.db.collection('users').remove({username:username}, function(err, result){
        if(err){
            error(renderDatabaseErrorJson);
        }
        else{
            success();   
        }
    });
}

//json status render
var renderInvalidRequestJson = function(){
    return '{meta: {status: 500, msg: "bad request"}, data:{}}';
}

var renderDatabaseErrorJson = function(){
    return '{meta: {status: 500, msg: "database failure"}, data:{}}';
}

var renderWrongPasswordJson = function(){
    return '{meta: {status: 403, msg: "login failed, please check your password"}, data:{}}';
}

var renderExistingUserJson = function(){
    return '{meta: {status: 409, msg: "existing user. please log in"}, data:{}}';
}

var renderSuccessJson = function(data){
    var result = {meta: {status: 200, msg: "OK"}, data: data};
    return JSON.stringify(result);
}

//naive data validator
var isDataValid = function(data){
    if(typeof(data) === 'undefined' || typeof(data.username) === 'undefined' || typeof(data.password) === 'undefined'){
        return false;
    }
    else{
        return true;
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
            store: app.sessiondb
        });
        app.express = express();
        app.express.use(express.static(__dirname + '/../public'));
        app.express.use(cookieParserFunction);
        app.express.use(sessionParserFunction);

        //routing
        app.express.get('/', function(req, res){
            res.sendfile(path.resolve(__dirname+'/../index.html'));
        });

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
        
        //socket io middlewares
        io.use(function(socket, next){
            //TODOS: Should generate socket based session key if the initial request is not via browser
            // var seed = crypto.randomBytes(20);
            // socket.token = socket.request.signedCookies['PHPSESSID'] || crypto.createHash('sha1').update(seed).digest('hex');
            cookieParserFunction(socket.request, {}, function(){
                socket.token = socket.request.signedCookies['PHPSESSID'];
                next();
            });
        });
        io.use(setSocketSession);

        //room structure
        socketList = io.of('/');

        //event listening
        io.on('connection', function(socket){
            var eventList = ['loginRender', 'loginAction', 'registerRender', 'registerAction', 'logoutAction', 'chatAction', 'adminRender', 'retrieveUserDataAction', 'editPermissionAction', 'deleteUserAction'];
            for(var i = 0; i < eventList.length; i++){
                socket.on(eventList[i], function(){
                    socket.extendSessionAge();
                });
            }
            
            var username = socket.request.session.username;
            if(username){
                //double check if the user still exsit and have the correct permission
                findUserWithUsername(username, function(user){
                    if(user){
                        socket.request.session.permission = user.permission;
                        console.log(socket.request.session.username + ' is connected');
                        socket.broadcast.emit('status message', socket.request.session.username + ' has joined the conversation');
                        socket.emit('render message', 'chat');
                    }
                    //possibly that user is deleted but the session information is not correctly updated in db
                    else{
                        socket.emit('render message', 'login');
                    }
                }, function(errorJSON){
                    socket.emit('system message', errorJSON());
                    console.log(errorJSON());
                });
            }
            else{
                socket.emit('render message', 'login');
            }

            socket.on('loginRender', function(){
                if(!socket.request.session.username){
                    socket.emit('render message', 'login');
                }
                else{
                    socket.emit('render message', 'chat');
                }
            });
            socket.on('loginAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(!socket.request.session.username && isDataValid(data)){
                    var username = data.username;
                    var password = data.password;
                    loginUser(username, password, function(user){
                        var session = socket.request.session;
                        session.username = user.username;
                        session.permission = user.permission;
                        session.save();

                        console.log(session.username + ' is connected');
                        socket.broadcast.emit('status message', session.username + ' has joined the conversation');
                        
                        var socketIDs = session.socketID;
                        for(var i=0; i < socketIDs.length; i++){
                            var target = socketList.connected[socketIDs[i]];
                            if(target){
                                target.emit('render message', 'chat');
                            }
                        }
                    },function(errorJSON){
                        socket.emit('system message', errorJSON());
                        console.log(errorJSON());
                    });
                }
                else{
                    socket.emit('system message', renderInvalidRequestJson());
                    console.log(renderInvalidRequestJson());
                }
            });
            socket.on('registerRender', function(){
                if(!socket.request.session.username){
                    socket.emit('render message', 'register');
                }
                else{
                    socket.emit('render message', 'chat');
                }
            });
            socket.on('registerAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(!socket.request.session.username && isDataValid(data)){
                    var username = data.username;
                    var password = data.password;
                    createNewUser(username, password, function(user){
                        var session = socket.request.session;
                        session.username = user.username;
                        session.permission = user.permission;
                        session.save();

                        console.log(session.username + ' is connected');
                        socket.broadcast.emit('status message', session.username + ' has joined the conversation');

                        var socketIDs = session.socketID;
                        for(var i=0; i < socketIDs.length; i++){
                            var target = socketList.connected[socketIDs[i]];
                            if(target){
                                target.emit('render message', 'chat');
                            }
                        }
                    }, function(errorJSON){
                        socket.emit('system message', errorJSON());
                        console.log(errorJSON());
                    });
                }
                else{
                    socket.emit('system message', renderInvalidRequestJson());
                    console.log(renderInvalidRequestJson());
                }
            });
            socket.on('logoutAction', function(){
                var session = socket.request.session;
                var username = session.username;
                if(username){
                    logoutUser(session, function(socketIDs){
                        socket.broadcast.emit('status message', username + ' has quitted the conversation');
                        console.log(username + ' has quitted the conversation');

                        for(var i = 0; i < socketIDs.length; i++){
                            var target = socketList.connected[socketIDs[i]];
                            if(target){
                                target.emit('render message', 'login');
                            }
                        }
                    });
                }
            }); 
            socket.on('chatAction', function(msg){
                if(socket.request.session.username){
                    io.sockets.emit('chat message', socket.request.session.username + ': ' + msg);
                }
                console.log(socket.request.session.counter);
            }); 
            socket.on('disconnect', function(){
                var session = socket.request.session;
                if(session.username){
                    socket.broadcast.emit('status message', session.username + ' has quitted the conversation');
                    console.log(session.username + ' has quitted the conversation');
                }
                session.socketID.splice(session.socketID.indexOf(socket.id),1);
                session.save();
            });
            socket.on('adminRender', function(){
                if(socket.request.session.permission == 1){
                    socket.emit("render message", 'admin');
                }
            });
            socket.on('retrieveUserDataAction', function(){
                if(socket.request.session.permission == 1){
                    retrieveUserList(function(data){
                        socket.emit('users data', renderSuccessJson(data));
                    }, function(errorJSON){
                        socket.emit('system message', errorJSON());
                        console.log(errorJSON());
                    });
                }
            });
            socket.on('editPermissionAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(socket.request.session.permission == 1){
                    var username = data.username;
                    var permission = data.permission;
                    editUser(username, permission, function(){
                        for(socketID in socketList.connected){
                            if(socketList.connected.hasOwnProperty(socketID)){
                                var targetSocket = socketList.connected[socketID];
                                var session = targetSocket.request.session;
                                if(session.username === username){
                                    session.permission = permission;
                                    session.save();
                                }
                            }
                        }
                    }, function(errorJSON){
                        socket.emit('system message', errorJSON());
                        console.log(errorJSON());
                    });
                }
            });
            socket.on('deleteUserAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(socket.request.session.permission == 1){
                    var username = data.username;
                    deleteUser(username, function(){
                        for(socketID in socketList.connected){
                            if(socketList.connected.hasOwnProperty(socketID)){
                                var session = socketList.connected[socketID].request.session;
                                if(session.username === username){
                                    delete session.username;
                                    delete session.permission;
                                    session.save();
                                    for(var i=0; i < session.socketID.length; i++){
                                        var targetSocket = socketList.connected[session.socketID[i]];
                                        targetSocket.emit('render message', 'register');
                                    }
                                }
                            }
                        }
                    }, function(errorJSON){
                        socket.emit('system message', errorJSON());
                        console.log(errorJSON());
                    });
                }
            });
            socket.on('retrieveLinkedUserAction', function(){
                if(socket.request.session.permission == 1){
                    var sockets = [];
                    for(var socketID in socketList.connected){
                        if(socketList.connected.hasOwnProperty(socketID)){
                            var simpleSocket = {};
                            var targetSocket = socketList.connected[socketID];
                            var session = targetSocket.request.session;
                            simpleSocket.id = targetSocket.id;
                            simpleSocket.username = session.username;
                            simpleSocket.permission = session.permission;
                            simpleSocket.token = targetSocket.token;
                            sockets.push(simpleSocket);
                        }
                    }
                    socket.emit('linked users data', renderSuccessJson(sockets));
                }
            });
            socket.on('focusLogout', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(socket.request.session.permission == 1){
                    var sessionTokens = data.sessions;
                    for(var i=0; i < sessionTokens.length; i++){
                        var session = sessionList.getSessionObjectByToken(sessionTokens[i]);
                        logoutUser(session, function(socketIDs){
                            while(socketIDs.length){
                                var targetSocket = socketList.connected[socketIDs[0]];
                                if(targetSocket){
                                    targetSocket.emit('render message', 'bootedPage');
                                    targetSocket.disconnect();
                                }
                            }
                        }); 
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
    }

    dbConnection(ServerInitialization);
}

ServerStart();