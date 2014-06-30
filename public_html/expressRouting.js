var express = require("express");
var path = require("path");
var responseJson = require('./responseJson');

module.exports = function(app){
	app.express.use(express.static(__dirname + '/../public'));
    app.express.use(app.middleware.cookieParserFunction);
    app.express.use(app.middleware.sessionParserFunction);

    //routing
    app.express.get('/', function(req, res){
        res.sendfile(path.resolve(__dirname+'/../index.html'));
    });
    app.express.get('/sessionExtension', function(req, res){
        res.write(responseJson.success());
        res.end();
    });
}