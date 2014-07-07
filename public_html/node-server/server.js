var DAY = 1000 * 60 * 60 * 24;  //millisecond in a day
var SESSIONAGE = DAY * 30;
var SECRET = '3d4f2bf07dc1be38b20cd6e46949a1071f9d0e3d';

var httpModule = require('http');
var httpsModule = require('https');
var express = require("express");
var socketio = require('socket.io');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var fs = require('fs');

var socketGarbageCollector = require('./socketGarbageCollector');
var databaseManager = require('./databaseManager');

var app = {};
var http;
var https;

var serverInitialization = function(db){  
    app.express = express();
    app.io = socketio();
    app.io.socketList = app.io.of('/').connected;
    app.roomList = {};

    app.db = db;
    app.sessiondb = new MongoStore({
        db: app.db
    });

    app.middleware = {};
    app.middleware.cookieParserFunction = cookieParser(SECRET);
    app.middleware.sessionParserFunction = expressSession({
        name:'PHPSESSID',
        secret: SECRET,
        cookie: {
            maxAge: SESSIONAGE
        },
        store: app.sessiondb,
        rolling: true
    });

    (require('./expressRouting'))(app);
    (require('./ioRouting'))(app);

    http = httpModule.createServer(function(req, res){
        res.writeHead(302, {Location: 'https://' + req.headers.host + req.url});
        res.end();
    });
    https = httpsModule.Server({
        key: fs.readFileSync('/path/to/server.key.orig'),
        cert: fs.readFileSync('/path/to/server.crt')
    }, app.express);
    app.io.attach(https);
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

exports.start = function start(){
    databaseManager.connect();

    databaseManager.on('connected',function(db){
    	serverInitialization(db);
    	portListeningStart();
    	socketGarbageCollector.start(app.io.socketList);
    });
}