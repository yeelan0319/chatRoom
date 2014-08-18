module.roomAdmin = {
    admins: [],

    renderIndex: function(data){
        module.data.pos = 'admin-roomuser';
        
        var $el = $(module.template.roomAdminIndexTmpl());
        module.roomAdmin.initUserManageList(data, $el.find('#realtime-userlist'));
        $el.find('#delete-room').unbind('click').click(module.roomAdmin.destoryRoom);

        $('.site-wrapper').append($el);
        $el.modal('toggle').on('hidden.bs.modal', function(e){
            module.data.pos = 'room'; 
            $el.remove();
            $(document).unbind('.roomAdmin');
        });
        $(document).on('onlineListUpdated.roomAdmin', function(){
            module.roomAdmin.renderUserManageList($el.find('#realtime-userlist'));
        });
    },

    initUserManageList: function(data, $container){
        module.roomAdmin.admins = data.admins;
        module.roomAdmin.renderUserManageList($container);
    },

    renderUserManageList: function($container){
        var userManageList = [];
        $.each(module.room.onlineList, function(index, roomUserItem){
            userManageList.push(new RoomUserManageItem(roomUserItem));
        });

        $.each(module.roomAdmin.admins, function(index, username){
            var roomUserManageItem = _.find(userManageList, function(obj){return obj.username === username});
            if(!roomUserManageItem){
                roomUserManageItem = new RoomUserManageItem({username: username});
                userManageList.push(roomUserManageItem);
            }
            roomUserManageItem.isAdminOfRoom = 1;
        });
        
        userManageList = _.chain(userManageList).sortBy('username').sortBy(function(roomUserManageItem){
            return roomUserManageItem.isAdminOfRoom * -1;
        }).sortBy(function(roomUserManageItem){
            return (roomUserManageItem.username === module.data.user.username ? 1 : 0) * -1;
        }).value();
        $container.html('');
        $.each(userManageList, function(index, roomUserManageItem){
            $container.append(roomUserManageItem.render());
        });
    },

    destoryRoom: function(){
        chobiUtil.confirmBox("Are you sure you want to delete this room?", function(){
            var data = {
                id: module.data.room
            }
            socket.emit('destoryRoomAction', JSON.stringify(data));
            $('#adminModal').modal('hide');
        });
    }
};