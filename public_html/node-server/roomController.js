var util = require('util');
var events = require('events');
var responseJson = require('./responseJson');

function RoomController(app){

    events.EventEmitter.call(this);

    (function initRoomList(){
        app.db.collection('rooms').find({'destoryTime': 0}).toArray(function(err, documents){
            if(err){
                //redo the work
            }
            else{
                for(var i in documents){
                    var room = documents[i];
                    app.roomList[room._id] = room;
                }
            }
        });
    })();

    this.createRoom = function(name, username){
        var that = this;
        _findActiveRoomWithName(name, function(room){
            if(room){
                //this is socket-level info
                //that.emit('excepetion', new ExistingRoomError());
            }
            else{
                var adminOfRoom = [username];
                var room = {'name': name, 'owner': username, 'createTime': Date.now(), 'destoryTime': 0, 'adminOfRoom': adminOfRoom};
                app.db.collection('rooms').insert(room, {w:1}, function(err, result) {
                    if(err){
                        //this is socket-level info
                        //that.emit('excepetion', new ExistingUserError());
                        //redo the work
                    }
                    else{
                        that.emit('successfullyCreatedRoom', room);
                    }
                });
            }
        });
    }

    function _findActiveRoomWithName(name, callback){
        app.db.collection('rooms').findOne({'name': name, 'destoryTime': 0}, function(err, room){
            if(err){
                //throw new DatabaseError();
                //redo the work
            }
            else{
                callback(room);
            }
        }); 
    }

    function _updateRoomList(room){
        var data = [room];
        app.io.sockets.emit('room data', responseJson.success(data));
    }

    this.retrieveRoomList = function(socketID){
        var that = this;
        app.db.collection('rooms').find().toArray(function(err, documents){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                var result = {
                    target: socketID,
                    data: documents
                };
                that.emit('successfullyRetrievedRoomList', result);
            }
        });
    }

    function _sendRoomListSocket(res){
        var socket = app.io.socketList[res.target];
        socket.emit('room data', responseJson.success(res.data));
    }

    this.on('successfullyCreatedRoom', _updateRoomList);
    this.on('successfullyRetrievedRoomList', _sendRoomListSocket)
};

util.inherits(RoomController, events.EventEmitter);
module.exports = function(app){
    return new RoomController(app);
};