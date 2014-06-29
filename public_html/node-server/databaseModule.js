var util = require('util');
var events = require('events');
var crypto = require('crypto');

var DatabaseModule = function(){
    events.EventEmitter.call(this);

    //This only check the login status for single socketID
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
    } 

    var _findUserWithUsername = function(username, callback){
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
        
    this.createNewUser = function(username, password, session){
        var that = this;
        _findUserWithUsername(username, function(user){
            if(user){
                //this is socket-level info
                //that.emit('excepetion', new ExistingUserError());
            }
            else{
                var user = {'username': username, 'password': crypto.createHash('sha1').update(password).digest('hex'), 'permission':0};
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
    }

    this.logoutUser = function(session){
        delete session.username;
        session.save();

        var result = {
            target: session.id
        };
        this.emit('successfullyLoggedOutUser', result);
    }

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
    }

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
    }

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
    }
};

util.inherits(DatabaseModule, events.EventEmitter);
module.exports = new DatabaseModule();