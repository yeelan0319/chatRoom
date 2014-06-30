var MongoClient = require("mongodb").MongoClient;
var util = require('util');
var events = require('events');

databaseManager = function(){
    events.EventEmitter.call(this);

    this.connect = function(){
        var that = this;
        MongoClient.connect("mongodb://127.0.0.1:27017/test", function(err,db){
            if(err){
                console.log("attempt fails. Try to reconnect to database"); 
                that.connect();  //should set a upper bound for try time
            }
            else{
                console.log("Connected to database");
                that.emit('connected', db);
            }
        });
    };
};

util.inherits(databaseManager, events.EventEmitter);
module.exports = new databaseManager();