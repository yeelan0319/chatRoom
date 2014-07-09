var express = require("express");
var responseJson = require('./responseJson');

module.exports = function(app){
    app.express.use(app.middleware.cookieParserFunction);
    app.express.use(app.middleware.sessionParserFunction);
    app.express.use(express.static(__dirname + '/../public'));

    //routing
    app.express.get('/sessionExtension', function(req, res){
        res.write(responseJson.success());
        res.end();
    });
}