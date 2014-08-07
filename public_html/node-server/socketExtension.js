var _ = require('underscore');
var responseJson = require('./responseJson');

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
        this.avatar = user.avatar;
        this.join('/private/user/'+this.username);
    };
    socket.removeSocketUser = function(){
        this.leave('/private/user/'+this.username);
        delete this.username;
        delete this.permission;
        delete this.avatar;
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

    socket.joinLounge = function(messages){
        this.join('/chatRoom/0');
        this.renderLounge(messages);
    };

    socket.joinRoom = function(id, name, isAdminOfRoom, messages){
        this.join('/chatRoom/' + id);
        this.renderRoom(id, name, isAdminOfRoom, messages);
    };
    socket.leaveRoom = function(id){
        this.leave('/chatRoom/' + id);
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
        this.emit('render message', responseJson.success(res));
    };
    socket.renderRegister = function(){
        var res = {
            target: 'register'
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderChatFrame = function(){
        var res = {
            target: 'chatFrame',
            data: {
                username: this.username,
                permission: this.permission,
                avatar: this.avatar
            }
        }
        this.emit('render message', responseJson.success(res));
    }
    socket.renderLounge = function(messages){
        var res = {
            target: 'lounge',
            data: {
                messages: messages
            }
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderRoom = function(id, name, isAdminOfRoom, messages){
        var res = {
            target: 'room',
            data: {
                id: id,
                name: name,
                isAdminOfRoom: isAdminOfRoom,
                messages: messages
            }
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderSystemAdmin = function(){
        var res = {
            target: 'systemAdmin'
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderRoomAdmin = function(id){
        var res = {
            target: 'roomAdmin',
            data: {
                id: id
            }
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderBoot = function(){
        var res = {
            target: 'bootedPage'
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderProfile = function(user){
        var res = {
            target: 'profile',
            data: {
                user: _.omit(user, 'password', 'prompts')
            }
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderFillInfo = function(user){
        var res = {
            target: 'fillInfo',
            data: {
                username: user.username,
                avatar: user.avatar
            }
        }
        this.emit('render message', responseJson.success(res));
    };
    socket.renderErrorMsg = function(errorJSON){
        this.emit('system message', errorJSON);
        console.log(errorJSON);
    };
    next();
}
