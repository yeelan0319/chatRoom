/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var urlencode = require('urlencode');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookie = require('cookie');
var express = require("express");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var sha1 = require('sha1');
var app = {};
app.express = express();
app.express.use(cookieParser());
app.express.use(bodyParser());
var http = require("http").Server(app.express);
var cookieParser = require('cookie-parser');
var io = require('socket.io')(http);

//routing
app.express
    .get('/', function(req, res){
        checkMainAction(req,res);
})
    .get('/login', function(req, res){
        renderLoginAction(req,res);
})
    .get('/register', function(req, res){
        renderRegisterAction(req, res);
})
    .get('/admin', function(req, res){
        checkAdminAction(req, res);
})
    .post('/signin', function(req, res){
        if(isDataValid(req.body)){
            var username = req.body.username;
            var password = req.body.password;
            loginUser(username, password, res);
        }
        else{
            renderInvalidRequestJson(res);
        }
})
    .post('/signup', function(req, res){
        if(isDataValid(req.body)){
            var username = req.body.username;
            var password = req.body.password;
            createNewUser(username, password, res);
        }
        else{
            renderInvalidRequestJson(res);
        }
})
    .get('/signout', function(req, res){
        var token = req.cookies.token;
        logoutUser(token, res);
})
    .get('/users', function(req, res){
        var token = req.cookies.token;
        checkAdminStatus(token, function(){
                retrieveUserList(res);
            }, function(){
                renderInvalidRequestJson(res);
            });
})
    .delete('/users/delete', function(req, res){
        var token = req.cookies.token;
        checkAdminStatus(token, function(){
                deleteUser(req.body.username, res);
            }, function(){
                renderInvalidRequestJson(res);
            });
})
    .put('/users/edit', function(req, res){
        var token = req.cookies.token;
        checkAdminStatus(token, function(){
                var username = req.body.username;
                var permission = req.body.permission;
                editUser(username, permission, res);
            }, function(){
                renderInvalidRequestJson(res);
            });
});

io.on('connection', function(socket){
    var token = cookie.parse(socket.request.headers.cookie)['token'];
    checkLoginStatus(token, function(session){
        if(session){
            console.log(session.username + ' is connected');
            app.dbConnection.collection('sessions').update(session, {$set:{socketID: socket.id}}, function(err, result){
                if(err){
                    console.log("error when updating the session's socket ID information");
                }
                else{
                    socket.token = session.token;
                    socket.username = session.username;
                    socket.broadcast.emit('system message', socket.username + ' has joined the conversation');
                    //add listeners to the socket
                    socket.on('disconnect', function(){
                        socket.broadcast.emit('system message', socket.username + ' has quitted the conversation');
                        app.dbConnection.collection('sessions').update(session, {$set:{socketID: ''}}, function(err, result){
                            if(err){
                                console.log('error when clear the socket information in session collection');
                            }
                        });
                    });
                    socket.on('chat message', function(msg){
                        io.sockets.emit('chat message', socket.username + ': ' + msg);
                    });     
                }
            });
        }
        else{
            console.log("this user is not authorized");
            //is it possible to cut the socket link when we find the request is fake?
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
    
var findUserWithUsername = function(username, callback){
    app.dbConnection.collection('users').findOne({'username': username}, function(err, result){
        if(err){
            renderDatabaseErrorJson(res);
        }
        else{
            callback(result);
        }
    }); 
};
    
var createNewUser = function(username, password, res){
    findUserWithUsername(username, function(user){
        if(user){
            res.json({meta: {status: 409,msg: "existing user, please login"},
                    data:{}});
            res.end();
        }
        else{
            //should generate a session key for the user and return it to the brwoser to save in cookie
            var user = {'username': username, 'password': sha1(password), 'permission':0};
            app.dbConnection.collection('users').insert(user, {w:1}, function(err, result) {
                if(err){
                    renderDatabaseErrorJson(res);
                }
                else{
                    loginUser(username, password, res);
                }
            });
        }
    });
};
    
var loginUser = function(username, password, res){
    findUserWithUsername(username, function(user){
        if(user && user.password === sha1(password)){
            //should generate a session key for the user and return it to the brwoser to save in cookie
            require('crypto').randomBytes(48, function(ex, buf) {
                var token = buf.toString('hex');
                var session = {'token': token, 'username': username, 'permission': user.permission}
                app.dbConnection.collection('sessions').insert(session, function(err, result){
                    if(err){
                        renderDatabaseErrorJson(res);
                    }
                    else{
                        renderSuccessJson(res, result[0]);
                    }
                });
            });
        }
        else{
            res.json({meta: {status: 403,msg: "Login failed. Please check your username and password"},
                     data:{}});
            res.end();
        }
    });
};

var retrieveUserList = function(res){
    app.dbConnection.collection('users').find().toArray(function(err, documents){
        if(err){
            renderDatabaseErrorJson(res);
        }
        else{
            console.log(documents);
            renderSuccessJson(res, documents);
        }
    });
}

var checkLoginStatus = function(token, callback){
    app.dbConnection.collection('sessions').findOne({'token':token}, function(err, session){
        if(err){
            renderDatabaseErrorJson(res);
        }
        else{
            callback(session);
        }
    });
}

var checkAdminStatus = function(token, adminAction, userAction){
    checkLoginStatus(token, function(session){
        if(session){
            var isAdmin = session.permission == 1? true : false;
            if(isAdmin){
                adminAction();
            }
            else{
                userAction();
            }
        }
        else{
            userAction();
        }
    });
}

var logoutUser = function(token, res){
    app.dbConnection.collection('sessions').remove({'token':token}, function(err, result){
        if(err){
            renderDatabaseErrorJson(res);
        }
        else{
            renderSuccessJson(res, {});
        }
    })
}

var editUser = function(username, permission, res){
    app.dbConnection.collection('users').update({username:username}, {$set:{permission: permission}}, function(err, result){
        if(err){
            renderDatabaseErrorJson(res);
        }
        else{
            renderSuccessJson(res, {});
        }
    });
}

var deleteUser = function(username, res){
    app.dbConnection.collection('users').remove({username:username}, function(err, result){
        if(err){
            renderDatabaseErrorJson(res);
        }
        else{
            app.dbConnection.collection('sessions').remove({username:username}, function(err, result){
                if(err){
                    renderDatabaseErrorJson(res);
                }
                else{
                    renderSuccessJson(res);
                }
            });    
        }
    });
}

//Route handlers
var checkMainAction = function(req, res){
    var token = req.cookies.token;
    checkLoginStatus(token, function(session){
        if(session){
            renderMainAction(req, res);
        }
        else{
            renderLoginAction(req, res); 
        }
    });
}

var renderMainAction = function(req, res){
    res.sendfile(path.resolve(__dirname+'/../index.html'));
}

var renderLoginAction = function(req, res){
    res.sendfile(path.resolve(__dirname+'/../login.html'));
}

var renderRegisterAction = function(req, res){
    res.sendfile(path.resolve(__dirname+'/../register.html'));
}

var renderAdminAction = function(req, res){
    res.sendfile(path.resolve(__dirname+'/../admin.html'));
}

var renderAdminLoginAction = function(req, res){
    res.sendfile(path.resolve(__dirname+'/../adminLogin.html')); 
}

var checkAdminAction = function(req, res){
    var token = req.cookies.token;
    checkAdminStatus(token, function(){
                renderAdminAction(req, res);
            }, function(){
                renderAdminLoginAction(req, res);
            });
}

//json status render
var renderInvalidRequestJson = function(res){
    res.json({meta: {status: 500,msg: "bad request"},
                data:{}});
    res.end();
}

var renderDatabaseErrorJson = function(res){
    res.json({meta: {status: 500,msg: "database failure"},
                data:{}});
    res.end();
}

var renderSuccessJson = function(res, data){
    res.json({meta: {status: 200,msg: "OK"},
              data: data});
    res.end();
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