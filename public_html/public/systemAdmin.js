module.systemAdmin = {
    linkedUserList:{},

    renderIndex: function(){
        var $el = $(module.template.systemAdminIndexTmpl());
        $el.find('.input-group.date').datepicker({
            autoclose: true
        });
        $el.find('#realtime').unbind('click').click(function(){
            module.systemAdmin.linkedUserList = {};
            module.data.pos = 'admin-linkeduser';
            socket.emit('retrieveLinkedUserAction');
        }).click();
        $el.find('#alluser').unbind('click').click(function(){
            module.data.pos = 'admin-alluser';
            socket.emit('retrieveUserDataAction');
        });
        $el.find('#chatHistory').unbind('click').click(function(){
            module.data.pos = 'admin-chatlog';
            $el.find('#chatlog-container').html('');
        });
        $el.find('#search-message').unbind('click').click(module.systemAdmin.searchForChatLog); 
        $('.site-wrapper').append($el);
        $el.modal('toggle').on('hidden.bs.modal', function(e){
            module.data.pos = module.data.room == 0 ? 'lounge' : 'room'; 
            $el.remove();
        });
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
                if(userdata.username){
                    var linkedUserItem = module.systemAdmin.linkedUserList[userdata.username];
                    if(!linkedUserItem){
                        linkedUserItem = new LinkedUserItem(userdata);
                    }
                    linkedUserItem.addSession(userdata.token);
                    linkedUserItem.addSocketID(userdata.id);
                }
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
    },

    renderChatLogData: function(data){
        data = JSON.parse(data);
        if(data.meta.status == 200 && module.data.pos === 'admin-chatlog'){
            $('#chatlog-container').html('');
            $.each(data.data, function(index, message){
                $('#chatlog-container').append('<li>' + message.username + ': ' + message.msg + '</li>');
            });
        }
    }
};