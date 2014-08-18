var util = require('util');
var events = require('events');
var _ = require('underscore');
var responseJson = require('./responseJson');
var ObjectID = require('mongodb').ObjectID;
var MINUTE = 1000*60;

function RoomController(app){
    events.EventEmitter.call(this);

    this._getRoom = function(id){
        try{
            var room = app.roomList[id];
            if(!room){
                throw "roomNotDefined";
            }
            else{
                return room;
            }
        }
        catch(e){
            console.log("trying to access room that is not defined");
        }
    }

    function _setRoom(id, room){
        app.roomList[id] = room;
    }

    app.db.collection('rooms').find({'destoryTime': 0}).toArray(function(err, documents){
        if(err){
            //redo the work
        }
        else{
            for(var i in documents){
                var room = documents[i];
                _setRoom(room._id, room)
            }
        }
    });

    this.isAdminOfRoom = function(id, username){
        var room = this._getRoom(id);
        return room.adminOfRoom.indexOf(username) != -1 ? true : false;
    };

    this.joinRoom = function(to, socket){
        var that = this;

        _retrievePastMessage(to, function(messages){
            _informJoinLeftOfRoom(to, socket, 'add');
            if(to === 0){    
                socket.joinLounge(messages, function(){
                    return {
                        type: 'reset',
                        users: _getRoomLinkedSockets(to)
                    };
                });
            }
            else{
                var targetRoom = that._getRoom(to);
                var name = targetRoom.name;
                var isAdminOfRoom = socket.isAdmin()||that.isAdminOfRoom(to, socket.username);
                socket.joinRoom(to, name, isAdminOfRoom, messages, function(){
                    return {
                        type: 'reset',
                        users: _getRoomLinkedSockets(to)
                    };
                });
            }
        });
    };

    this.leaveRoom = function(from, socket){
        _informJoinLeftOfRoom(from, socket, 'delete');
        socket.leaveRoom(from);
    };

    this.passiveLeaveRoom = function(socket){
        var roompath = _.find(socket.rooms, function(roompath){return /\/chatRoom\//.test(roompath)});
        if(roompath){
            var id = roompath.replace(/\/chatRoom\//, '');
            this.leaveRoom(id, socket);
        }
    }

    function _retrievePastMessage(id, callback){
        var that = this;
        var duration = 10 * MINUTE;
        app.db.collection('messages').find({room: id, ctime:{$gt: Date.now() - duration}}).toArray(function(err, messages){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                callback(messages);
            }
        });
    };

    function _informJoinLeftOfRoom(id, socketJoined, action){
        var data = {
            type: action,
            users:[
                socketJoined.getSocketInfo()
            ]
        }
        socketJoined.broadcast.to('/chatRoom/' + id).emit('room linked users data', responseJson.success(data));
    }

    function _getRoomLinkedSockets(id){
        var sockets = [];
        app.ioController._iterateInRoom(id, function(socket){
            sockets.push(socket.getSocketInfo());
        });
        return sockets;
    }

    this.editRoomAdmin = function(id, username, permission){
        var room = this._getRoom(id);
        var index = room.adminOfRoom.indexOf(username);
        if(permission === 0 && index !== -1){
            room.adminOfRoom.splice(index, 1);
        }
        else if(permission === 1 && index === -1){
            room.adminOfRoom.push(username);
        }
        //async update database
        app.db.collection('rooms').update({_id:room._id}, room, function(err, result){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
        });
    };

    this.bootUser = function(id, username){
        app.ioController._iterateInRoom(id, function(socket){
            if(socket.username === username){
                this._forceLeaveRoomJoinLounge(id, socket);
            }
        });
    };

    this.createRoom = function(name, username){
        var that = this;
        var hasActiveRoomWithSameName = false;
        for(var id in app.roomList){
            if(app.roomList.hasOwnProperty(id)){
                if(this._getRoom(id).name === name){
                    hasActiveRoomWithSameName = true;
                }
            }
        }
        if(!hasActiveRoomWithSameName){
            var adminOfRoom = [username];
            var room = {'name': name, 'owner': username, 'createTime': Date.now(), 'destoryTime': 0, 'adminOfRoom': adminOfRoom};
            app.db.collection('rooms').insert(room, {w:1}, function(err, result) {
                if(err){
                    //this is socket-level info
                    //that.emit('excepetion', new ExistingUserError());
                    //redo the work
                }
                else{
                    _setRoom(room._id, room);
                    that.emit('successfullyCreatedRoom', room);
                }
            });
        }
        else{
            //bad data
        }
    };

    this.destoryRoom = function(id){
        var that = this;
        app.db.collection('rooms').findAndModify({_id: new ObjectID(id)}, [['_id','asc']], {$set:{destoryTime: Date.now()}}, {}, function(err, room){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                delete app.roomList[id];
                that.emit('successfullyDeletedRoom', room);
            }
        });
    }

    function _addToRoomList(room){
        var result = {
            type: 'add',
            data: {'1': room}
        }
        app.io.sockets.emit('room data', responseJson.success(result));
    }

    function _deleteFromRoomListAndClearRoom(room){
        var that = this;
        var result = {
            type: 'delete',
            data: {'1': room}
        }
        app.io.sockets.emit('room data', responseJson.success(result));

        app.ioController._iterateInRoom(room._id, function(socket){
            that._forceLeaveRoomJoinLounge(room._id, socket);
        });
    }

    this._forceLeaveRoomJoinLounge = function(id, socket){
        this.leaveRoom(id, socket);
        this.joinRoom(0, socket);
    };

    this.on('successfullyCreatedRoom', _addToRoomList);
    this.on('successfullyDeletedRoom', _deleteFromRoomListAndClearRoom);
};

util.inherits(RoomController, events.EventEmitter);
module.exports = function(app){
    return new RoomController(app);
};