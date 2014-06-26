module.exports = function socketExtension(socket, next){
    socket.extendSessionAge = function(socket){
        var session = socket.request.session;
        //half window extension
        console.log("1:age:"+session.cookie.maxAge);
        console.log("2:maxage:"+session.cookie.originalMaxAge);
        if(session.cookie.maxAge < (session.cookie.originalMaxAge/2)){
            socket.emit('session extension');
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
    socket.renderErrorMsg = function(socket, errorJSON){
        socket.emit('system message', errorJSON);
        console.log(errorJSON);
    };
    socket.setSocketUser = function(socket, user){
        socket.username = user.username;
        socket.permission = user.permission;
        socket.join('/private/user/'+socket.username);
        socket.renderChat(socket);
    };
    socket.removeSocketUser = function(socket, user){
        delete socket.username;
        delete socket.permission;
        socket.leave('/private/user/'+socket.username);
    };
    socket.welcomeUser = function(socket, user){
        //console.log(socket.username + ' is connected');
        //socket.broadcast.emit('status message', socket.username + ' has joined the conversation');
    };
    socket.seeyouUser = function(socket){
        //console.log(socket.username + ' has quitted the conversation');
        //socket.broadcast.emit('status message', socket.username + ' has quitted the conversation');
    };

    socket.changePermission = function(socket, permission){
        socket.permission = permission;
    }

    socket.isLoggedIn = function(socket){
        return socket.username ? true : false;
    };
    socket.isAdmin = function(socket){
        return socket.permission == 1 ? true : false;
    };

    socket.renderLogin = function(socket){
        socket.emit('render message', 'login');
    };
    socket.renderRegister = function(socket){
        socket.emit('render message', 'register');
    };
    socket.renderChat = function(socket){
        socket.emit('render message', 'chat');
    };
    socket.renderAdmin = function(socket){
        socket.emit('render message', 'admin');
    };
    socket.renderBoot = function(socket){
        socket.emit('render message', 'bootedPage');
    }

    next();
}
