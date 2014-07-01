module.exports = function socketExtension(socket, next){
    socket.extendSessionAge = function(){
        var session = this.request.session;
        if(session.cookie.maxAge < (session.cookie.originalMaxAge/2)){
            this.emit('session extension');
            var sessionRoom = io.sockets.adapter.rooms['/private/session/'+session.id];
            console.log("3:"+sessionRoom);
            for(var socketID in sessionRoom){
                if(sessionRoom.hasOwnProperty(socketID)){
                    console.log("4:"+socketID);
                    var targetSocket = socketList[socketID];
                    targetSocket.request.session.touch();
                    console.log("5:after touch:"+targetSocket.request.session.cookie.maxAge);
                }
            }
        }
    };

    socket.boot = function(){
        this.renderBoot();
        this.disconnect();
    };

    socket.renderErrorMsg = function(errorJSON){
        this.emit('system message', errorJSON);
        console.log(errorJSON);
    };
    socket.setSocketUser = function(user){
        this.username = user.username;
        this.permission = user.permission;
        this.join('/private/user/'+this.username);
        this.renderLounge();
    };
    socket.removeSocketUser = function(){
        this.leave('/private/user/'+this.username);
        delete this.username;
        delete this.permission;
    };
    socket.welcomeUser = function(){
        //console.log(this.username + ' is connected');
        //this.broadcast.emit('status message', this.username + ' has joined the conversation');
    };
    socket.seeyouUser = function(){
        //console.log(this.username + ' has quitted the conversation');
        //this.broadcast.emit('status message', this.username + ' has quitted the conversation');
    };

    socket.changePermission = function(permission){
        this.permission = permission;
    }

    socket.isLoggedIn = function(){
        return this.username ? true : false;
    };
    socket.isAdmin = function(){
        return this.permission == 1 ? true : false;
    };
    socket.isInRoom = function(id){
        if(id===0) return true;
        return this.rooms.indexOf('/chatRoom/' + id) != -1 ? true : false;
    }

    socket.joinRoom = function(id, name){
        this.join('/chatRoom/' + id);
        this.renderRoom(id, name);
    }
    socket.leaveRoom = function(id){
        this.leave('/chatRoom/' + id);
    }

    socket.renderLogin = function(){
        var res = {
            target: 'login'
        }
        this.emit('render message', JSON.stringify(res));
    };
    socket.renderRegister = function(){
        var res = {
            target: 'register'
        }
        this.emit('render message', JSON.stringify(res));
    };
    socket.renderLounge = function(){
        var res = {
            target: 'lounge'
        }
        this.emit('render message', JSON.stringify(res));
    };
    socket.renderRoom = function(id, name){
        var res = {
            target: 'room',
            data: {
                id: id,
                name: name
            }
        }
        this.emit('render message', JSON.stringify(res));
    }
    socket.renderAdmin = function(){
        var res = {
            target: 'admin'
        }
        this.emit('render message', JSON.stringify(res));
    };
    socket.renderBoot = function(){
        var res = {
            target: 'bootedPage'
        }
        this.emit('render message', JSON.stringify(res));
    }
    next();
}
