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
var sha1 = require('sha1');
var app = {};
var myMongoStore = new MongoStore({
        db: 'test',
        host: '127.0.0.1',
        port: 27017
    });
var cookieParserFunction = cookieParser(SECRET);
var sessionParserFunction = expressSession({
    name:'PHPSESSID',
    secret: SECRET,
    cookie: {
        maxAge: SESSIONAGE
    },
    store: myMongoStore
});
app.express = express();
app.express.use(cookieParserFunction);
app.express.use(sessionParserFunction);
var http = require("http").Server(app.express);
var io = require('socket.io')(http);

//routing
app.express.get('/', function(req, res){
    res.sendfile(path.resolve(__dirname+'/../index.html'));
});

var socketList = io.of('/');

io.use(function(socket, next){
    socket.request.originalUrl = "/";
    cookieParserFunction(socket.request, {}, next);
});

io.use(function(socket, next){
    //TODO:
    //Don't use the session information for socketID in session object, which is not the latest one!!
    //The mysterious is if I put this function last, it will crash server
    sessionParserFunction(socket.request, {}, next);
});

io.use(function(socket, next){
    var seed = crypto.randomBytes(20);
    socket.token = socket.request.signedCookies['PHPSESSID'] || crypto.createHash('sha1').update(seed).digest('hex');
    //store the socketID into session form for get/post request usage
    myMongoStore.get(socket.token, function(err, sessData){
        if(err){
            socket.emit('system message', renderDatabaseErrorJson());
            console.log(renderDatabaseErrorJson());
            //redo the work
        }
        else{
            sessData.socketID = socket.id;
            myMongoStore.set(socket.token, sessData, function(err){
                if(err){
                    socket.emit('system message', renderDatabaseErrorJson());
                    console.log(renderDatabaseErrorJson());
                    //redo the work
                }
            });
        }
    });
    next();
});

io.on('connection', function(socket){
    socket.prototype.extendSessionAge = function(expirationDate){
        this.request.session.touch();
        this.emit('session extension', expirationDate);
    }

    socket.extendSessionAge(new Date(Date.now() + SESSIONAGE));
    for(var e in ['loginRender', 'loginAction', 'registerRender', 'registerAction', 'logoutAction', 'chatAction','adminRender', 'retrieveUserDataAction', 'editPermissionAction', 'deleteUserAction']){
        socket.on(e, function(){
            socket.extendSessionAge(new Date(Date.now() + SESSIONAGE));
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
                socket.username = user.username;
                socket.permission = user.permission;
                console.log(socket.username + ' is connected');
                socket.broadcast.emit('status message', socket.username + ' has joined the conversation');
                socket.emit('render message', 'chat');
                myMongoStore.get(socket.token, function(err, sessData){
                    if(err){
                        socket.emit('system message', renderDatabaseErrorJson());
                        console.log(renderDatabaseErrorJson());
                        //redo the work
                    }
                    else{
                        sessData.username = socket.username;
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
                socket.username = user.username;
                socket.permission = user.permission;
                console.log(socket.username + ' is connected');
                socket.broadcast.emit('status message', socket.username + ' has joined the conversation');
                socket.emit('render message', 'chat');
                myMongoStore.get(socket.token, function(err, sessData){
                    if(err){
                        socket.emit('system message', renderDatabaseErrorJson());
                        console.log(renderDatabaseErrorJson());
                        //redo the work 
                    }
                    else{
                        sessData.username = socket.username;
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
            logoutUser(socket.token, function(){
                socket.broadcast.emit('status message', socket.username + ' has quitted the conversation');
                console.log(socket.username + ' has quitted the conversation');
                delete socket.username;
                delete socket.permission;
                socket.emit('render message', 'login');
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
                delete sessData.socketID;
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
                socket.emit('admin data', data);
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
});

var dbConnection = function(){
    MongoClient.connect("mongodb://localhost:27017/test", function(err,db){
        if(err){
            console.dir(err);
            //should set a upper bound for try time
            dbConnection();
        }
        else{
            console.log("Connected to database");
            app.dbConnection = db;
            //start listening to port and receive request
            http.listen(3000, function(err){
                console.log("listening on port: 3000");
            });
        }
    }
);};
    
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
            var user = {'username': username, 'password': sha1(password), 'permission':0};
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
        if(user && user.password === sha1(password)){
            success(user);
        }
        else{
            error(renderWrongPasswordJson);
        }
    }, error);

};

var checkLoginStatus = function(token, success, error){
    myMongoStore.get(token, function(err, sessData){
        if(err){
            error(renderDatabaseErrorJson);
            //redo the work
        }
        else{
            if(sessData.username){
                findUserWithUsername(sessData.username, success, error);
            }
            else{
                success("");
            }
            
        }
    });
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
                    success();
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
            success(renderSuccessJson(documents));
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

dbConnection();