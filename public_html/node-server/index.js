/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var SECRET = '3d4f2bf07dc1be38b20cd6e46949a1071f9d0e3d';
var urlencode = require('urlencode');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookie = require('cookie');
var cookieSession = require('express-session');
var connect = require('connect');
var parseSignedCookie = connect.utils.parseSignedCookie;
var express = require("express");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var sha1 = require('sha1');
var app = {};
app.express = express();
app.express.use(bodyParser());
app.express.use(cookieParser(SECRET));
app.express.use(cookieSession({
    name:'PHPSESSID',
    secret: SECRET
}));
var http = require("http").Server(app.express);
var io = require('socket.io')(http);

//routing
app.express.get('/', function(req, res){
    res.sendfile(path.resolve(__dirname+'/../index.html'));
});

var socketList = {};

io.on('connection', function(socket){
    socketList[socket.id] = socket;
    var tokenCrypto = cookie.parse(socket.request.headers.cookie)['PHPSESSID']
    var token = parseSignedCookie(tokenCrypto, SECRET);
    socket.token = token;
    checkLoginStatus(token, function(session){
        if(session){
            socket.username = session.username;
            socket.permission = session.permission;
            console.log(socket.username + ' is connected');
            socket.broadcast.emit('status message', socket.username + ' has joined the conversation');
            socket.emit('render message', 'chat');
            app.dbConnection.collection('sessions').update(session, {$set:{socketID: socket.id}}, function(err, result){
                if(err){
                    socket.emit('system message', renderDatabaseErrorJson());
                    console.log(renderDatabaseErrorJson());
                    //redo the work
                }
            });
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
                var session = {'token': socket.token, 'username': socket.username, 'permission': socket.permission, 'socketID':socket.id}
                app.dbConnection.collection('sessions').insert(session, function(err, result){
                    if(err){
                        socket.emit('system message', renderDatabaseErrorJson());
                        console.log(renderDatabaseErrorJson());
                        //redo the work
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

                var session = {'token': socket.token, 'username': socket.username, 'permission': socket.permission, 'socketID':socket.id}
                app.dbConnection.collection('sessions').insert(session, function(err, result){
                    if(err){
                        socket.emit('system message', renderDatabaseErrorJson());
                        console.log(renderDatabaseErrorJson());
                        //redo the work
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
        socket.broadcast.emit('status message', socket.username + ' has quitted the conversation');
        app.dbConnection.collection('sessions').update({token:socket.token}, {$set:{socketID: ''}}, function(err, result){
            if(err){
                socket.emit('system message', renderDatabaseErrorJson());
                console.log(renderDatabaseErrorJson());
                //redo the work
            }
        });
        delete socketList[socket.id];
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
            editUser(username, permission, function(socketID){
                if(socketList[socketID]){
                    socketList[socketID].permission = 1;
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
            deleteUser(username, function(socketID){
                if(socketList[socketID]){
                    socketList[socketID].emit('render message', 'register');
                    delete socketList[socketID].username;
                    delete socketList[socketID].permission;
                };
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
    app.dbConnection.collection('sessions').findOne({'token':token}, function(err, session){
        if(err){
            error(renderDatabaseErrorJson);
        }
        else{
            success(session);
        }
    });
}

var logoutUser = function(token, success, error){
    app.dbConnection.collection('sessions').remove({'token':token}, function(err, result){
        if(err){
            error(renderDatabaseErrorJson);
        }
        else{
            success();
        }
    })
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
    app.dbConnection.collection('users').update({username:username}, {$set:{permission: permission}}, function(err, result){
        if(err){
            error(renderDatabaseErrorJson);
        }
        else{
            app.dbConnection.collection('sessions').update({username:username}, {$set:{permission: permission}}, function(err, result){
                if(err){
                    error(renderDatabaseErrorJson);
                }
                else{
                    success(result.socketID);
                }
            });
        }
    });
}

var deleteUser = function(username, success, error){
    app.dbConnection.collection('users').remove({username:username}, function(err, result){
        if(err){
            error(renderDatabaseErrorJson);
        }
        else{
            app.dbConnection.collection('users').remove({username:username}, function(err, result){
                if(err){
                    error(renderDatabaseErrorJson);
                }
                else{
                    app.dbConnection.collection('sessions').remove({username:username}, function(err, result){
                        if(err){
                            error(renderDatabaseErrorJson);
                        }
                        else{
                            success();
                        }
                    });  
                }
            });  
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