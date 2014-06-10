/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var urlencode = require('urlencode');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var express = require("express");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var sha1 = require('sha1');
var app = {};
app.express = express();
app.express.use(cookieParser());
app.express.use(bodyParser());
var http = require("http").Server(app.express);var cookieParser = require('cookie-parser')

app.express
    .get('/', function(req, res){
        console.log(req);
        var token = req.cookies.token;
        console.log(token);
        isLoggedIn(token, function(session){
            if(typeof session === "undefined" || session == null){
                res.sendfile(path.resolve(__dirname+'/../login.html'));
            }
            else{
                res.sendfile(path.resolve(__dirname+'/../index.html'));
            }
        });
})
    .get('/login', function(req, res){
        res.sendfile(path.resolve(__dirname+'/../login.html'));
})
    .get('/register', function(req, res){
        res.sendfile(path.resolve(__dirname+'/../register.html'));
})
    .get('/admin', function(req, res){
        //if user has not logged in as administrator
        res.sendfile(path.resolve(__dirname+'/../adminLogin.html'));
        //else show the administator page for admin
})
    .post('/signin', function(req, res){
        if(typeof(req.body) === 'undefined' || typeof(req.body.username) === 'undefined' || typeof(req.body.password) === 'undefined'){
             //it should also validate other things before actual insert to database
            res.json({meta: {status: 500,msg: "bad request"},
                data:{}});
            res.end();
        }
        else{
            var username = req.body.username;
            var password = req.body.password;
            loginUser(username, password, res);
        }
})
    .post('/signup', function(req, res){
        if(typeof(req.body) === 'undefined' || typeof(req.body.username) === 'undefined' || typeof(req.body.password) === 'undefined'){
             //it should also validate other things before actual insert to database
            res.json({meta: {
                    status: 500,
                    msg: "bad request"
                },
                data:{
                }
            });
            res.end();
        }
        else{
            var username = req.body.username;
            var password = req.body.password;
            createNewUser(username, password, res);
        }
})
    .post('/signout', function(req, res){
        
})
    .get('/check', function(req, res){
        
});

var dbConnection = function(){
    MongoClient.connect("mongodb://localhost:27017/test", function(err,db){
        if(err){
            console.dir(err);
            //should set a upper bound for try time
            dbConnection();
        }
        else{
            console.log("we are connected");
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
            res.json({meta: {status: 500,msg: "bad request"},
                             data:{}});
            res.end();
        }
        else{
            callback(result);
        }
    }); 
};

var isLoggedIn = function(token, callback){
    app.dbConnection.collection('sessions').findOne({'token':token}, function(err, session){
        if(err){
            res.json({meta: {status: 500,msg: "bad request"},
                             data:{}});
            res.end();
        }
        else{
            callback(session);
        }
    });
}
    
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
                    res.json({meta: {status: 500,msg: "bad request"},
                             data:{}});
                    res.end();
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
                        res.json({meta: {status: 500,msg: "bad request"},
                                 data:{}});
                        res.end(); 
                    }
                    else{
                        res.json({meta: {status: 200,msg: "OK"},
                                  data:result[0]});
                        res.end();
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

dbConnection();