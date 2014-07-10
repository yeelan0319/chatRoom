var util = require('util');
var events = require('events');
var crypto = require('crypto');
var responseJson = require('./responseJson');

function IoController(app){
    events.EventEmitter.call(this);

    this.checkLoginStatus = function(session, socketID){
        var that = this;
        var username = session.username;
        if(username){
            _findUserWithUsername(username, function(user){
                if(user){
                    var result = {
                        user: user,
                        target: socketID
                    };
                    that.emit('userLoggedIn', result);
                }
                else{
                    delete session.username;
                    session.save();

                    var result = {
                        target: socketID
                    };
                    that.emit('userNotLoggedIn', result);
                }
            });
        }
        else{
            var result = {
                target: socketID
            };
            that.emit('userNotLoggedIn', result);
        }
    };

    function _findUserWithUsername(username, callback){
        app.db.collection('users').findOne({'username': username}, function(err, user){
            if(err){
                //throw new DatabaseError();
                //redo the work
            }
            else{
                callback(user);
            }
        }); 
    };
        
    this.createNewUser = function(username, password, firstName, lastName, phoneNumber, session){
        var that = this;
        _findUserWithUsername(username, function(user){
            if(user){
                //this is socket-level info
                //that.emit('excepetion', new ExistingUserError());
            }
            else{
                var user = {
                    'username': username, 
                    'password': crypto.createHash('sha1').update(password).digest('hex'), 
                    'firstName': firstName, 
                    'lastName':lastName, 
                    'phoneNumber':phoneNumber, 
                    'permission':0
                };
                app.db.collection('users').insert(user, {w:1}, function(err, result) {
                    if(err){
                        //this is socket-level info
                        //that.emit('excepetion', new ExistingUserError());
                        //redo the work
                    }
                    else{
                        that.loginUser(username, password, session);
                    }
                });
            }
        });
    };
        
    this.loginUser = function(username, password, session){
        var that = this;
        _findUserWithUsername(username, function(user){
            if(user && user.password === crypto.createHash('sha1').update(password).digest('hex')){
                session.username = user.username;
                session.save();

                var result = {
                    user: user,
                    target: session.id
                };
                that.emit('successfullyLoggedInUser', result);
            }
            else{
                //this is socket-level info
                //that.emit('excepetion', new WrongPasswordError());
            }
        });
    };

    this.logoutUser = function(session){
        delete session.username;
        session.save();

        var result = {
            target: session.id
        };
        renderLoginSession(result);
    };

    this.retrieveUserList = function(socketID){
        var that = this;
        app.db.collection('users').find().toArray(function(err, documents){
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
                that.emit('successfullyRetrievedUserList', result);
            }
        });
    };

    this.editUser = function(username, permission){
        var that = this;
        app.db.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:{permission: permission}}, {}, function(err, user){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                var result = {
                    target: username,
                    permission: permission
                };
                that.emit('successfullyChangedUserPermission', result);
            }
        });
    };

    this.deleteUser = function(username){
        var that = this;
        app.db.collection('users').remove({username:username}, function(err, result){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                var result = {
                    target: username
                };
                that.emit('successfullyDeletedUser', result);
            }
        });
    };

    this.retrieveLinkedUser = function(socketID){
        var socket = app.io.socketList[socketID];
        var data = [];
        for(var socketID in app.io.socketList){
            if(app.io.socketList.hasOwnProperty(socketID)){
                var simpleSocket = {};
                var targetSocket = app.io.socketList[socketID];
                simpleSocket.id = targetSocket.id;
                simpleSocket.username = targetSocket.username;
                simpleSocket.permission = targetSocket.permission;
                simpleSocket.token = targetSocket.token;
                data.push(simpleSocket);
            }
        }
        socket.emit('linked users data', responseJson.success(data));
    };

    this.bootUser = function(username){
        var userRoom = app.io.sockets.adapter.rooms['/private/user/'+username];
        for(var socketID in userRoom){
            if(userRoom.hasOwnProperty(socketID)){
                var targetSocket = app.io.socketList[socketID];
                targetSocket.boot();
            }
        }
    };

    function welcomeSocket(res){
        var socket = app.io.socketList[res.target];
        _welcomeUser(socket, res.user);
    }

    function renderLoginSocket(res){
        var socket = app.io.socketList[res.target];
        _renderLogin(socket);
    }

    function welcomeSession(res){
        var sessionRoom = app.io.sockets.adapter.rooms['/private/session/'+res.target];
        for(var socketID in sessionRoom){
            if(sessionRoom.hasOwnProperty(socketID)){
                var socket = app.io.socketList[socketID];
                _welcomeUser(socket, res.user);
            }
        }
    }

    function renderLoginSession(res){
        var sessionRoom = app.io.sockets.adapter.rooms['/private/session/'+res.target];
        for(var socketID in sessionRoom){
            if(sessionRoom.hasOwnProperty(socketID)){
                var socket = app.io.socketList[socketID];
                _seeyouUser(socket);
                _renderLogin(socket);
            }
        }
    }

    function sendUserListSocket(res){
        var socket = app.io.socketList[res.target];
        socket.emit('users data', responseJson.success(res.data));
    }

    function informChangedPermissionUser(res){
        var username = res.target;
        var permission = res.permission;
        var userRoom = app.io.sockets.adapter.rooms['/private/user/'+username];
        for(var socketID in userRoom){
            if(userRoom.hasOwnProperty(socketID)){
                var socket = app.io.socketList[socketID];
                socket.changePermission(permission);
            }
        }
    }

    function renderRegisterUser(res){
        var username = res.target;
        var userRoom = app.io.sockets.adapter.rooms['/private/user/'+username];
        for(var socketID in userRoom){
            if(userRoom.hasOwnProperty(socketID)){
                var socket = app.io.socketList[socketID];
                _seeyouUser(socket);
                _renderRegister(socket);
            }
        }
    }

    function _welcomeUser(socket, user){
        socket.setSocketUser(user);
        socket.welcomeUser(); 
    }

    function _renderLogin(socket){
        socket.renderLogin();
    }

    function _seeyouUser(socket){
        socket.seeyouUser();
        socket.removeSocketUser();
    }

    function _renderRegister(socket){
        socket.renderRegister();
    }

    this.on('userLoggedIn', welcomeSocket);
    this.on('userNotLoggedIn', renderLoginSocket);
    this.on('successfullyLoggedInUser', welcomeSession)
    this.on('successfullyRetrievedUserList', sendUserListSocket);
    this.on('successfullyChangedUserPermission', informChangedPermissionUser);
    this.on('successfullyDeletedUser', renderRegisterUser);
};

util.inherits(IoController, events.EventEmitter);
module.exports = function(app){
    return new IoController(app);
};