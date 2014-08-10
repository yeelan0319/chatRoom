module.roomAdmin = {
    linkedUserList:{},

    renderIndex: function(){
        var $el = $(module.template.roomAdminIndexTmpl(module.data));
        $el.find('#delete-room').unbind('click').click(module.roomAdmin.destoryRoom);
        $el.find('#realtime').unbind('click').click(function(){
            module.roomAdmin.linkedUserList = {};
            socket.emit('retrieveRoomLinkedUserAction', module.data.room);
        }).click();
        $('.site-wrapper').append($el);
        $el.modal('toggle').on('hidden.bs.modal', function(e){
            module.data.pos = 'room'; 
            $el.remove();
        });
    },

    renderLinkedUserData:function(data){
        module.data.pos = 'admin-roomuser';
        data = JSON.parse(data);
        if(data.meta.status == 200){
            var admins = data.data.admins;
            var sockets = data.data.sockets;
            $('#realtime-userlist').html('');

            $.each(sockets, function(index, userdata){
                var roomUserItem = module.roomAdmin.linkedUserList[userdata.username];
                if(!roomUserItem){
                    roomUserItem = new RoomUserItem(userdata);
                }
                roomUserItem.addSession(userdata.token);
                roomUserItem.addSocketID(userdata.id);
            });
            $.each(admins, function(index, username){
                var roomUserItem = module.roomAdmin.linkedUserList[username];
                if(!roomUserItem){
                    var userdata = {username: username};
                    roomUserItem = new RoomUserItem(userdata);
                }
                roomUserItem.isAdminOfRoom = 1;
            });
            for(var username in module.roomAdmin.linkedUserList){
                if(module.roomAdmin.linkedUserList.hasOwnProperty(username)){
                    module.roomAdmin.linkedUserList[username].render();
                }
            }
        }
    },

    destoryRoom: function(){
        var confirmed = confirm("Are you sure to delete this room?");
        if(confirmed){
            data = {
                id: module.data.room
            }
            socket.emit('destoryRoomAction', JSON.stringify(data));
            $('#adminModal').modal('hide');
        }
    }

};