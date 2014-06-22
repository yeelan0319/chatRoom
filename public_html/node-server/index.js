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
    var that = this;
    myMongoStore.get(that.token, function(err, sessData){
        if(err){
            that.emit('system message', renderDatabaseErrorJson());
            console.log(renderDatabaseErrorJson());
            //redo the work
        }
        else{
            that.request.session.username = sessData.username || '';
            that.request.session.socketID = sessData.socketID || '';
            that.request.session.touch().save();
            that.emit('session extension', SESSIONAGE);
        }
    });
};

//sessionList prototype extension
var SessionList = function(){
    this.sessions = {};
    this.locked = false;
};

SessionList.prototype.getSessionObject = function(socket){
    return this.sessions[socket.token] || '';
}
SessionList.prototype.setSessionObject = function(socket){
    this.sessions[socket.token] = socket.request.session;
}

//set socket session middleware, depend on that the program have a global sessionList object and its extension
var setSocketSession = function(socket, next){
    if(typeof sessionList == 'undefined'){
        sessionList = new SessionList();
    }
    var session = sessionList.getSessionObject(socket);
    if(session){
        socket.request.session = session;
        next();
    }
    else{
        if(sessionList.locked){
            setTimeout(function(){sessionList.setSocketSession(socket, next)}, 100);
        }
        else{
            socket.request.originalUrl = "/";
            sessionList.locked = true;
            sessionParserFunction(socket.request, {}, function(){
                sessionList.setSessionObject(socket);
                sessionList.locked = false;
                next();
            }); 
        }
    }
}
 
//Database operations 
var findUserWithUsername = function(username, success, error){
    app.dbConnection.collection('users').findOne({'username': username}, function(err, user){
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
            app.dbConnection.collection('users').insert(user, {w:1}, function(err, result) {
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

};

var checkLoginStatus = function(token, success, error){
    var session = sessionList.getSessionObject(token);
    var username = session.username;
    if(username){
        findUserWithUsername(username, success, error);
    }
    else{
        success("");
    }
}

var logoutUser = function(token, success, error){
    myMongoStore.get(token, function(err, sessData){
        if(err){
            error(renderDatabaseErrorJson);
            //redo the work
        }
        else{
            delete sessData.username;
            myMongoStore.set(token, sessData, function(err){
                if(err){
                    error(renderDatabaseErrorJson);
                    //redo the work
                }
                else{
                    success(sessData.socketID);
                }
            });
        }
    });
}

var retrieveUserList = function(success, error){
    app.dbConnection.collection('users').find().toArray(function(err, documents){
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
    app.dbConnection.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:{permission: permission}}, {}, function(err, user){
        if(err){
            error(renderDatabaseErrorJson);
        }
        else{
            success();
        }
    });
}

var deleteUser = function(username, success, error){
    app.dbConnection.collection('users').remove({username:username}, function(err, result){
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
    }
    var ServerInitialization = function(db){
        app = {};
        app.dbConnection = db;
        myMongoStore = new MongoStore({
            db: app.dbConnection
        });
        cookieParserFunction = cookieParser(SECRET);
        sessionParserFunction = expressSession({
            name:'PHPSESSID',
            secret: SECRET,
            cookie: {
                maxAge: SESSIONAGE,
                expires: new Date(Date.now()+SESSIONAGE)
            },
            store: myMongoStore
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

        io.use(function(socket, next){
            var session = socket.request.session;
            if(!session.socketID){
                session.socketID = [];
            }
            session.socketID.push(socket.id);
            session.touch().save();
            next();
        });

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
            
            checkLoginStatus(socket.token, function(user){
                if(user){

                    socket.username = user.username;
                    socket.permission = user.permission;
                    console.log(socket.username + ' is connected');
                    socket.broadcast.emit('status message', socket.username + ' has joined the conversation');
                    socket.emit('render message', 'chat');
                }
                else{
                    socket.emit('render message', 'login');
                }
            }, function(errorJSON){
                socket.emit('system message', errorJSON());
                console.log(errorJSON());
            });
            socket.on('loginRender', function(){
                if(!socket.username){
                    socket.emit('render message', 'login');
                }
            });
            socket.on('loginAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(!socket.username && isDataValid(data)){
                    var username = data.username;
                    var password = data.password;
                    loginUser(username, password, function(user){
                        myMongoStore.get(socket.token, function(err, sessData){
                            if(err){
                                socket.emit('system message', renderDatabaseErrorJson());
                                console.log(renderDatabaseErrorJson());
                                //redo the work
                            }
                            else{
                                var socketIDs = sessData.socketID;
                                for(var i = 0; i < socketIDs.length; i++){
                                    var target = socketList.connected[socketIDs[i]];
                                    if(target){
                                        target.username = user.username;
                                        target.permission = user.permission;
                                        console.log(target.username + ' is connected');
                                        target.broadcast.emit('status message', target.username + ' has joined the conversation');
                                        target.emit('render message', 'chat');
                                    }
                                }
                                sessData.username = user.username;
                                myMongoStore.set(socket.token, sessData, function(err){
                                    if(err){
                                        socket.emit('system message', renderDatabaseErrorJson());
                                        console.log(renderDatabaseErrorJson());
                                        //redo the work
                                    }
                                });
                            }
                        });
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
                if(!socket.username){
                    socket.emit('render message', 'register');
                }
            });
            socket.on('registerAction', function(data){
                try{
                    data = JSON.parse(data);
                }
                catch(e){
                    console.log("Receive invalid JSON");
                }
                if(!socket.username && isDataValid(data)){
                    var username = data.username;
                    var password = data.password;
                    createNewUser(username, password, function(user){
                        myMongoStore.get(socket.token, function(err, sessData){
                            if(err){
                                socket.emit('system message', renderDatabaseErrorJson());
                                console.log(renderDatabaseErrorJson());
                                //redo the work
                            }
                            else{
                                var socketIDs = sessData.socketID;
                                for(var i = 0; i < socketIDs.length; i++){
                                    var target = socketList.connected[socketIDs[i]];
                                    if(target){
                                        target.username = user.username;
                                        target.permission = user.permission;
                                        console.log(target.username + ' is connected');
                                        target.broadcast.emit('status message', target.username + ' has joined the conversation');
                                        target.emit('render message', 'chat');
                                    }
                                }
                                sessData.username = user.username;
                                myMongoStore.set(socket.token, sessData, function(err){
                                    if(err){
                                        socket.emit('system message', renderDatabaseErrorJson());
                                        console.log(renderDatabaseErrorJson());
                                        //redo the work
                                    }
                                });
                            }
                        });
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
                if(socket.username){
                    logoutUser(socket.token, function(socketIDs){
                        for(var i = 0; i < socketIDs.length; i++){
                            var target = socketList.connected[socketIDs[i]];
                            if(target){
                                target.broadcast.emit('status message', target.username + ' has quitted the conversation');
                                console.log(target.username + ' has quitted the conversation');
                                delete target.username;
                                delete target.permission;
                                target.emit('render message', 'login');
                            }
                        }
                    })
                }
            }, function(errorJSON){
                socket.emit('system message', errorJSON());
                console.log(errorJSON());
            });
            socket.on('chatAction', function(msg){
                if(socket.username){
                    io.sockets.emit('chat message', socket.username + ': ' + msg);
                }
            }); 
            socket.on('disconnect', function(){
                if(socket.username){
                    socket.broadcast.emit('status message', socket.username + ' has quitted the conversation');
                    console.log(socket.username + ' has quitted the conversation');
                }
                //remove the socketID into session form
                myMongoStore.get(socket.token, function(err, sessData){
                    if(err){
                        socket.emit('system message', renderDatabaseErrorJson());
                        console.log(renderDatabaseErrorJson());
                        //redo the work
                    }
                    else{
                        sessData.socketID.splice(sessData.socketID.indexOf(socket.id),1);
                        myMongoStore.set(socket.token, sessData, function(err){
                            if(err){
                                socket.emit('system message', renderDatabaseErrorJson());
                                console.log(renderDatabaseErrorJson());
                                //redo the work
                            }   
                        });
                    }
                });
            });
            socket.on('adminRender', function(){
                if(socket.permission == 1){
                    socket.emit("render message", 'admin');
                }
            });
            socket.on('retrieveUserDataAction', function(){
                if(socket.permission == 1){
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
                if(socket.permission == 1){
                    var username = data.username;
                    var permission = data.permission;
                    editUser(username, permission, function(){
                        for(socketID in socketList.connected){
                            if(socketList.connected.hasOwnProperty(socketID)){
                                if(socketList.connected[socketID].username === username){
                                    socketList.connected[socketID].permission = permission;
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
                if(socket.permission == 1){
                    var username = data.username;
                    deleteUser(username, function(){
                        for(socketID in socketList.connected){
                            if(socketList.connected.hasOwnProperty(socketID)){
                                var targetSocket = socketList.connected[socketID];
                                if(targetSocket.username === username){
                                    targetSocket.broadcast.emit('status message', targetSocket.username + ' has quitted the conversation');
                                    console.log(targetSocket.username + ' has quitted the conversation');
                                    delete targetSocket.username;
                                    delete targetSocket.permission;
                                    targetSocket.emit('render message', 'register');
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
                if(socket.permission == 1){
                    var keyNeeded = ['id', 'username', 'permission', 'token'];
                    var sockets = [];
                    for(var socketID in socketList.connected){
                        if(socketList.connected.hasOwnProperty(socketID)){
                            var simpleSocket = {};
                            for(var key in socketList.connected[socketID]){
                                if(keyNeeded.indexOf(key) !== -1){
                                    simpleSocket[key] = socketList.connected[socketID][key];
                                }
                            }
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
                if(socket.permission == 1){
                    var sessions = data.sessions;
                    if(sessions){
                        for(var i=0; i < sessions.length; i++){
                            logoutUser(sessions[i], function(socketIDs){
                                for(var i = 0; i < socketIDs.length; i++){
                                    var target = socketList.connected[socketIDs[i]];
                                    if(target){
                                        target.emit('render message', 'bootedPage');
                                        target.disconnect();
                                    }
                                }
                            }); 
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
    }

    dbConnection(ServerInitialization);
}

ServerStart();