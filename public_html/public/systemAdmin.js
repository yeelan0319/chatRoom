module.systemAdmin = {
    linkedUserList:{},

    renderIndex: function(){
        var tmpl = module.template.systemAdminIndexTmpl;
        var $el = $(Mustache.to_html(tmpl, module.data).replace(/^\s*/mg, ''));
        $el.find('.input-group.date').datepicker({
            autoclose: true
        });
        $('.site-wrapper').append($el);
        $('#adminModal').modal('toggle').on('hidden.bs.modal', function(e){
            $('#adminModal').remove();
        });
        $('#realtime').click(function(){
            module.systemAdmin.linkedUserList = {};
            module.data.pos = 'admin-linkeduser';
            socket.emit('retrieveLinkedUserAction');
        }).click();
        $('#alluser').click(function(){
            module.data.pos = 'admin-alluser';
            socket.emit('retrieveUserDataAction');
        });
        $('#chatHistory').click(function(){
            module.data.pos = 'admin-chatlog';
            $('#chatlog-container').html('');
        });
        $('#search-message').click(module.systemAdmin.searchForChatLog); 
    },

    renderRegisterUserData: function(data){
        data = JSON.parse(data);
        if(data.meta.status == 200 && module.data.pos === 'admin-alluser'){
            $('#alluser-userlist').html('');
            $.each(data.data, function(index, userdata){
                var user = new UserItem(userdata);
                user.render();
            });
        }
    },

    renderLinkedUserData:function(data){
        data = JSON.parse(data);
        if(data.meta.status == 200 &&  module.data.pos === 'admin-linkeduser'){
            $('#realtime-userlist').html('');
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
    },

    searchForChatLog: function(){
        var input = {
            username: $('#adminModal #search-username').val(),
            room: $.trim($('#adminModal #search-room').val()),
            startDate: $('#adminModal #search-startDate').val(),
            endDate: $('#adminModal #search-endDate').val()
        }
        var constraints = {};
        if(input.username){
            constraints.username = input.username;
        }
        if(input.room){
            var id = module.lounge.findRoomIDWithName(input.room);
            if(typeof id != 'undefined'){
                constraints.room = id;
            }
        }
        if(input.startDate || input.endDate){
            constraints.ctime = {};
            if(input.startDate){
                constraints.ctime.$gt = new Date(input.startDate).getTime();
            }
            if(input.endDate){
                constraints.ctime.$lt = new Date(input.endDate).getTime();
            }
        }
        socket.emit('retrieveChatLogAction', JSON.stringify(constraints));
        $('#adminModal input').val('');
    },

    renderChatLogData: function(data){
        data = JSON.parse(data);
        if(data.meta.status == 200 && module.data.pos === 'admin-chatlog'){
            $('#chatlog-container').html('');
            $.each(data.data, function(index, message){
                $('#chatlog-container').append('<li>' + message.firstName + ' ' + message.lastName + ': ' + message.msg + '</li>');
            });
        }
    }
};