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

    socket.isLoggedIn = function(){
        return this.username ? true : false;
    };
    socket.isAdmin = function(){
        return this.permission == 1 ? true : false;
    };
    socket.isInRoom = function(id){
        return this.rooms.indexOf('/chatRoom/' + id) != -1 ? true : false;
    };

    socket.setSocketUser = function(user){
        this.username = user.username;
        this.permission = user.permission;
        this.join('/private/user/'+this.username);
        this.joinLounge();
    };
    socket.removeSocketUser = function(){
        this.leave('/private/user/'+this.username);
        delete this.username;
        delete this.permission;
        //TODO:also remove from the chat room user is currently in!!!
    };

    socket.welcomeUser = function(){
        //console.log(this.username + ' is connected');
        //this.broadcast.emit('status message', this.username + ' has joined the conversation');
    };
    socket.seeyouUser = function(){
        //console.log(this.username + ' has quitted the conversation');
        //this.broadcast.emit('status message', this.username + ' has quitted the conversation');
    };

    socket.joinLounge = function(){
        this.join('/chatRoom/0');
        this.renderLounge();
    };

    socket.joinRoom = function(id, name){
        this.leave('/chatRoom/0');
        this.join('/chatRoom/' + id);
        this.renderRoom(id, name);
    };
    socket.leaveRoom = function(id){
        this.leave('/chatRoom/' + id);
        this.joinLounge();
    };
    socket.boot = function(){
        this.renderBoot();
        this.disconnect();
    };
    socket.changePermission = function(permission){
        this.permission = permission;
    };
    socket.renderLogin = function(){
        var res = {
            target: 'login'
        }
        this.emit('render message', res);
    };
    socket.renderRegister = function(){
        var res = {
            target: 'register'
        }
        this.emit('render message', res);
    };
    socket.renderLounge = function(){
        var res = {
            target: 'lounge'
        }
        this.emit('render message', res);
    };
    socket.renderRoom = function(id, name){
        var res = {
            target: 'room',
            data: {
                id: id,
                name: name
            }
        }
        this.emit('render message', res)
    };
    socket.renderSystemAdmin = function(){
        var res = {
            target: 'systemAdmin'
        }
        this.emit('render message', res);
    };
    socket.renderRoomAdmin = function(id){
        var res = {
            target: 'roomAdmin',
            data: {
                id: id
            }
        }
        this.emit('render message', res);
    };
    socket.renderBoot = function(){
        var res = {
            target: 'bootedPage'
        }
        this.emit('render message', res);
    };

    socket.renderErrorMsg = function(errorJSON){
        this.emit('system message', errorJSON);
        console.log(errorJSON);
    };
    next();
}
