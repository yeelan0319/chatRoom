var _ = require('underscore');
var responseJson = require('./responseJson');

module.exports = function socketExtension(socket, next){
    socket.extendSessionAge = function(){
        var session = this.request.session;
        if(session.cookie.maxAge < (session.cookie.originalMaxAge/2)){
            this.emit('session extension');
            var sessionRoom = io.sockets.adapter.rooms['/private/session/'+session.id]; //TODO: why socketExt will have access to io.sockets?
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
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.phoneNumber = user.phoneNumber;
        this.birthday = user.birthday;
        this.jobDescription = user.jobDescription;
        this.join('/private/user/'+this.username);
    };
    socket.removeSocketUser = function(){
        this.leave('/private/user/'+this.username);
        delete this.username;
        delete this.permission;
        delete this.avatar;
        delete this.firstName
        delete this.lastName
        delete this.email
        delete this.phoneNumber
        delete this.birthday
        delete this.jobDescription
    };
    socket.getSocketInfo = function(){
        return {
            username: this.username,
            permission: this.permission,
            avatar: this.avatar,
            token: this.token,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phoneNumber: this.phoneNumber,
            birthday: this.birthday,
            jobDescription: this.jobDescription
        }
    }

    socket.joinLounge = function(messages, getLinkedUsers){
        this.join('/chatRoom/0');
        var data = {
            messages: messages,
            linkedUsers: getLinkedUsers()
        }
        this.render('lounge', data);
    };

    socket.joinRoom = function(id, name, isAdminOfRoom, messages, getLinkedUsers){
        this.join('/chatRoom/' + id);
        var data = {
            id: id,
            name: name,
            isAdminOfRoom: isAdminOfRoom,
            messages: messages,
            linkedUsers: getLinkedUsers()
        }
        this.render('room', data);
    };
    socket.leaveRoom = function(id){
        this.leave('/chatRoom/' + id);
    };
    socket.boot = function(){
        this.render('bootedPage');
        this.disconnect();
    };
    socket.changePermission = function(permission){
        this.permission = permission;
    };

    socket.render = function(target, data){
        var res = {
            target: target,
            data: data
        }
        this.emit('render message', responseJson.success(res));
    }
    socket.renderErrorMsg = function(errorJSON){
        this.emit('system message', errorJSON);
        console.log(errorJSON);
    };
    next();
}
