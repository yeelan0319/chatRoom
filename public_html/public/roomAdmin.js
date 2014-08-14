module.roomAdmin = {

    renderIndex: function(data){
        module.data.pos = 'admin-roomuser';
        
        var $el = $(module.template.roomAdminIndexTmpl());
        module.roomAdmin.renderUserManageList(data, $el.find('#realtime-userlist'));
        $el.find('#delete-room').unbind('click').click(module.roomAdmin.destoryRoom);

        $('.site-wrapper').append($el);
        $el.modal('toggle').on('hidden.bs.modal', function(e){
            module.data.pos = 'room'; 
            $el.remove();
        });
    },

    renderUserManageList: function(data, $container){
        var userManageList = [];
        $.each(module.room.onlineList, function(index, roomUserItem){
            userManageList.push(new RoomUserManageItem(roomUserItem));
        });

        var admins = data.admins;
        $.each(admins, function(index, username){
            var roomUserManageItem = _.find(userManageList, function(obj){return obj.username === username});
            if(!roomUserManageItem){
                roomUserManageItem = new RoomUserManageItem({username: username});
                userManageList.push(roomUserManageItem);
            }
            roomUserManageItem.isAdminOfRoom = 1;
        });
        
        userManageList = _.chain(userManageList).sortBy('username').sortBy(function(roomUserManageItem){
            return roomUserManageItem.isAdminOfRoom * -1;
        }).value();
        $.each(userManageList, function(index, roomUserManageItem){
            $container.append(roomUserManageItem.render());
        });
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