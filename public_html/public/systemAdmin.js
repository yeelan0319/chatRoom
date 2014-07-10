module.systemAdmin = {
    linkedUserList:{},

    renderIndex: function(){
        var tmpl = $.trim($('#systemAdmin-index-tmpl').html());
        var $el = $(Mustache.to_html(tmpl, module.data).replace(/^\s*/mg, ''));
        $('.container-idle').html($el);

        $('#back').click(function(){
            window.location = './';
        });
        $('#realtime').click(function(){
            module.systemAdmin.linkedUserList = {};
            socket.emit('retrieveLinkedUserAction');
        });
        if(module.data.room === 0){
            $('#alluser').click(function(){
                socket.emit('retrieveUserDataAction');
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
                var linkedUserItem = module.systemAdmin.linkedUserList[userdata.username];
                if(!linkedUserItem){
                    linkedUserItem = new LinkedUserItem(userdata);
                }
                linkedUserItem.addSession(userdata.token);
                linkedUserItem.addSocketID(userdata.id);
            });
            for(var username in module.systemAdmin.linkedUserList){
                if(module.systemAdmin.linkedUserList.hasOwnProperty(username)){
                    module.systemAdmin.linkedUserList[username].render();
                }
            }
        }
    }
};

socket.on('users data', function(data){
    module.systemAdmin.renderRegisterUserData(data);
});
socket.on('linked users data', function(data){
    module.systemAdmin.renderLinkedUserData(data);
});