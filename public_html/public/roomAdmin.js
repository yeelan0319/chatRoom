module.roomAdmin = {
    linkedUserList:{},

    renderIndex: function(){
        var tmpl = $.trim($('#roomAdmin-index-tmpl').html());
        var $el = $(Mustache.to_html(tmpl, module.data).replace(/^\s*/mg, ''));
        $('.container-idle').html($el);

        $('#back').click(function(){
            var id = module.data.room;
            data = {
                id: id,
                name: module.data.roomList[id].name
            }
            module.room.renderIndex(data);

        });
        $('#delete-room').click(module.roomAdmin.destoryRoom);
        $('#realtime').click(function(){
            module.roomAdmin.linkedUserList = {};
            socket.emit('retrieveRoomLinkedUserAction', module.data.room);
        });
        $('#realtime').click();
    },

    renderLinkedUserData:function(data){
        module.data.pos = 'admin-linkeduser';
        data = JSON.parse(data);
        if(data.meta.status == 200){
            var admins = data.data.admins;
            var sockets = data.data.sockets;
            $('#user-list').html('');

            $.each(sockets, function(index, userdata){
                var roomUserItem = module.roomAdmin.linkedUserList[userdata.username];
                console.log(roomUserItem);
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
        }
    }

};

socket.on('room linked users data', function(data){
    module.roomAdmin.renderLinkedUserData(data);
});