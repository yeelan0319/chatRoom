module.admin = {
    linkedUserList:{},

    renderIndex: function(){
        var tmpl = $.trim($('#admin-index-tmpl').html());
        var $el = $(Mustache.to_html(tmpl, module.data).replace(/^\s*/mg, ''));
        $('#container').html($el);

        $('#back').click(function(){
            window.location = './';
        });
        $('#realtime').click(function(){
            module.admin.linkedUserList = {};
            socket.emit('retrieveLinkedUserAction', module.data.room);
        });
        if(module.data.room === 0){
            $('#alluser').click(function(){
                socket.emit('retrieveUserDataAction', module.data.room);
            });
        }
        $('#realtime').click();
    },

    renderRegisterUserData: function(data){
        module.data.pos = 'admin-alluser';
        data = JSON.parse(data);
        if(data.meta.status == 200){
            $('#user-list').html('');
            $.each(data.data, function(index, userdata){
                var user = new UserItem(userdata);
                user.render();
            });
        }
    },

    renderLinkedUserData:function(data){
        module.data.pos = 'admin-linkeduser';
        data = JSON.parse(data);
        if(data.meta.status == 200){
            $('#user-list').html('');
            $.each(data.data, function(index, userdata){
                var linkedUserItem = module.admin.linkedUserList[userdata.username];
                if(!linkedUserItem){
                    linkedUserItem = new LinkedUserItem(userdata);
                }
                linkedUserItem.addSession(userdata.token);
                linkedUserItem.addSocketID(userdata.id);
            });
            for(var username in module.admin.linkedUserList){
                if(module.admin.linkedUserList.hasOwnProperty(username)){
                    module.admin.linkedUserList[username].render();
                }
            }
        }
    }
};

socket.on('users data', function(data){
    module.admin.renderRegisterUserData(data);
});
socket.on('linked users data', function(data){
    module.admin.renderLinkedUserData(data);
});