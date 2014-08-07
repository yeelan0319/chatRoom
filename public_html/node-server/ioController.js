var util = require('util');
var events = require('events');
var crypto = require('crypto');
var _ = require('underscore');
var responseJson = require('./responseJson');
var DAY = 1000*60*60*24;
var DEFAULTAVATAR = 'https://10.100.11.111/avatar/defaultAvatar.png';

function IoController(app){
    var roomController = require('./roomController')(app);

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
        
    this.createNewUser = function(username, password, email, session){
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
                    'email': email,
                    'avatar': DEFAULTAVATAR,
                    'permission':0,
                    'prompts':{
                        'needUserInfo': true
                    }
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
    this.editUserInfo = function(username, data){
        var that = this;
        data = _.pick(data, 'firstName', 'lastName', 'phoneNumber', 'birthday', 'jobDescription');
        data.prompts = {};
        data.prompts.needUserInfo = false;
        app.db.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:data}, {}, function(err, user){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                if(user.prompts.needUserInfo){
                    var result = {
                        user: user,
                        target: username
                    };
                    that.emit('successfullyCompleteUserInfo', result);
                }
                else{
                    //revised in the profile page
                }
            }
        });
    };
    this.editUserPermission = function(username, permission){
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

    this.retrieveChatLog = function(constraints, socketID){
        var that = this;
        app.db.collection('messages').find(constraints).toArray(function(err, documents){
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
                that.emit('successfullyRetrievedChatLog', result);
            }
        });
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

    this.sendChatMessage = function(username, id, msg){
        var message = {
            'username': username,
            'room': id, 
            'msg': msg, 
            'ctime':Date.now()
        };
        app.db.collection('messages').insert(message, {w:1}, function(err, result) {
            if(err){
                //this is socket-level info
                //that.emit('excepetion', new ExistingUserError());
                //redo the work
            }
            else{
                var messages = [message];
                app.io.to('/chatRoom/' + id).emit('chat messages', responseJson.success(messages));
            }
        });
    };

    this.retrieveUserProfile = function(socketID){
        var socket = app.io.socketList[socketID];
        _findUserWithUsername(socket.username, function(user){
            socket.renderProfile(user);
        });
    };

    this.sendPm = function(toUsername, msg, socketID){
        var socket = app.io.socketList[socketID];
        if(socket.username === toUsername) return;

        _findUserWithUsername(toUsername, function(user){
            if(user){
                var salt = [toUsername, socket.username].sort().toString();
                var pmid = crypto.createHash('sha1').update(salt).digest('hex');

                var pm = {
                    pmid: pmid,
                    toUsername: user.username,
                    fromUsername: socket.username,
                    ctime: Date.now(),
                    msg: msg,
                    hasRead: false
                }
                app.db.collection('pms').insert(pm, {w:1}, function(err, result) {
                    if(err){
                        //this is socket-level info
                        //that.emit('excepetion', new ExistingUserError());
                        //redo the work
                    }
                    else{
                        var receiverPmItemData = {
                            username: socket.username,
                            messageArr: [pm]
                        };
                        var senderPmItemData = {
                            username: user.username,
                            messageArr: [pm]
                        };
                        app.io.to('/private/user/' + user.username).emit('private messages', responseJson.success(receiverPmItemData));
                        app.io.to('/private/user/' + socket.username).emit('private messages', responseJson.success(senderPmItemData));
                    }
                });
            }
        });
    };

    this.createPm = function(toUsername, socketID){
        var socket = app.io.socketList[socketID];
        if(socket.username === toUsername) return;

        _findUserWithUsername(toUsername, function(user){
            if(user){
                var salt = [toUsername, socket.username].sort().toString();
                var pmid = crypto.createHash('sha1').update(salt).digest('hex');
                _retrievePm(pmid, function(pms){
                    var pmItemData = {
                        username: user.username,
                        messageArr: pms
                    };
                    app.io.to('/private/user/' + socket.username).emit('private messages', responseJson.success(pmItemData));
                });
            }
            else{
                //should tell user that the user not exist
            }
        });
    };

    this.searchPm = function(str, socketID){
        var socket = app.io.socketList[socketID];
        app.db.collection('users').find({'$or':[
            {'username':{'$regex':str, '$options':'i'}},
            {'firstName':{'$regex':str, '$options':'i'}},
            {'lastName':{'$regex':str, '$options':'i'}},
            {'email':{'$regex':str, '$options':'i'}},
            {'jobDescription':{'$regex':str, '$options':'i'}},
        ]},{username:1, avatar:1}).toArray(function(err, users){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                socket.emit('searchPm data', responseJson.success(users));
            }
        });
    }

    function _retrievePm(pmid, callback){
        var duration = DAY * 10;
        app.db.collection('pms').find({pmid: pmid, ctime:{$gt: Date.now() - duration}}).toArray(function(err, pms){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
            else{
                callback(pms);
            }
        });
    }

    this.readPm = function(fromUsername, toUsername){
        var conditions = {
            fromUsername: fromUsername, 
            toUsername: toUsername, 
            ctime:{
                $lt: Date.now()
            }
        }

        app.db.collection('pms').update(conditions, {$set: {hasRead: true}}, {multi: true}, function(err, result){
            if(err){
                //this is socket-level info
                //throw new DatabaseError();
                //redo the work
            }
        });
    };

    function _checkUnreadPm(socket){
        app.db.collection('pms').distinct('pmid', {toUsername: socket.username, hasRead: false}, function(err, pmidArr){
            if(err){
               //this is socket-level info
                //throw new DatabaseError();
                //redo the work 
            }
            else{
                for(var i in pmidArr){
                    _retrievePm(pmidArr[i], function(pms){
                        var pmItemData = {
                            messageArr: pms
                        };
                        for(var j in pms){
                            if(pms[j].fromUsername !== socket.username){
                                pmItemData.username = pms[j].fromUsername;
                                break;
                            }
                        }
                        socket.emit('private messages', responseJson.success(pmItemData));
                    });
                }
            }
        });
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
    function welcomeUser(res){
        var username = res.target;
        var user = res.user;
        console.log(user);
        var userRoom = app.io.sockets.adapter.rooms['/private/user/'+username];
        for(var socketID in userRoom){
            if(userRoom.hasOwnProperty(socketID)){
                var socket = app.io.socketList[socketID];
                _initiateLounge(socket, user);
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

    function sendChatLogSocket(res){
        var socket = app.io.socketList[res.target];
        socket.emit('chat log', responseJson.success(res.data));
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

    function _retrieveRoomList(socket){
        var result = {
            type: 'reset',
            data: app.roomList
        }
        socket.emit('room data', responseJson.success(result));     
    }

    function _welcomeUser(socket, user){
        socket.setSocketUser(user);
        if(user.prompts.needUserInfo){
            socket.renderFillInfo(user);
        }
        else{
            _initiateLounge(socket, user);
        }
    }

    function _initiateLounge(socket, user){
        console.log("haha");
        socket.renderChatFrame();
        _checkUnreadPm(socket);
        _retrieveRoomList(socket);
        roomController.joinRoom(0, socket.id);
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
    this.on('successfullyCompleteUserInfo', welcomeUser)
    this.on('successfullyChangedUserPermission', informChangedPermissionUser);
    this.on('successfullyDeletedUser', renderRegisterUser);
    this.on('successfullyRetrievedChatLog', sendChatLogSocket);
};

util.inherits(IoController, events.EventEmitter);
module.exports = function(app){
    return new IoController(app);
};