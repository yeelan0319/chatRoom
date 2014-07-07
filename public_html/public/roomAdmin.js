module.roomAdmin = {
    linkedUserList:{},

    renderIndex: function(){
        var tmpl = $.trim($('#admin-index-tmpl').html());
        var $el = $(Mustache.to_html(tmpl, module.data).replace(/^\s*/mg, ''));
        $('#container').html($el);

        $('#back').click(function(){
            data = {
                id: module.data.room,
                name: module.data.roomname
            }
            module.room.renderIndex(data);
        });
        $('#realtime').click(function(){
            module.roomAdmin.linkedUserList = {};
            socket.emit('retrieveLinkedUserAction', module.data.room);
        });
        $('#realtime').click();
    },

    renderLinkedUserData:function(data){
        module.data.pos = 'admin-linkeduser';
        data = JSON.parse(data);
        if(data.meta.status == 200){
            $('#user-list').html('');
            $.each(data.data.users, function(index, userdata){
                var linkedUserItem = module.roomAdmin.linkedUserList[userdata.username];
                if(!linkedUserItem){
                    linkedUserItem = new LinkedUserItem(userdata);
                    linkedUserList.isAdminOfRoom = 0;
                    module.roomAdmin.linkedUserList[linkedUserItem.username] = linkedUserItem;
                }
                linkedUserItem.addSession(userdata.token);
                linkedUserItem.addSocketID(userdata.id);
            });
            $.each(data.data.admins, function(index, admin){
               var linkedUserItem = module.roomAdmin.linkedUserList[userdata.username];
               linkedUserItem.isAdminOfRoom = 1; 
            });
            for(var username in module.roomAdmin.linkedUserList){
                if(module.roomAdmin.linkedUserList.hasOwnProperty(username)){
                    module.roomAdmin.linkedUserList[username].renderRoomStyle();
                }
            }
        }
    }
};

socket.on('room users data', function(data){
    module.roomAdmin.renderLinkedUserData(data);
});