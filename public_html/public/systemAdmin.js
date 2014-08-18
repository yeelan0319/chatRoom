module.systemAdmin = {
    linkedUserList:{},
    chatLogCache: [],
    constraintsCount: 0,

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
        chobiUtil.inputErrorClear($('#chatHistory-pane'));

        var $usernameEl = $('#chatHistory-pane #search-username');
        var $roomEl = $('#chatHistory-pane #search-room');
        var $startDateEl = $('#chatHistory-pane #search-startDate');
        var $endDateEl = $('#chatHistory-pane #search-endDate');
        
        var username = $usernameEl.val();
        var room = $roomEl.val();
        var startDate = $startDateEl.val();
        var endDate = $endDateEl.val();

        var constraints = {};
        var constraintstr = '';
        if(username){
            if(!validator.nickName(username)){
                chobiUtil.inputError($usernameEl.parent(), 'Please enter a valid username');
                return false;
            }
            else{
                constraints.username = username;
                constraintstr += username;
            }
        }
        else{
            constraintstr += 'everyone'
        }

        if(room){
            if(!validator.looseNickName(room)){
                chobiUtil.inputError($roomEl.parent(), 'Please enter a valid room name');
                return false;
            }
            else{
                var id = module.lounge.findRoomIDWithName(room);
                if(typeof id != 'undefined'){
                    constraints.room = id;
                    constraintstr += "@" + room;
                }
                else{
                    chobiUtil.inputError($roomEl.parent(), 'Please enter a valid room name');
                    return false;
                }
            }
        }
        else{
            constraintstr += "@everywhere"
        }
        if(startDate || endDate){
            constraints.ctime = {};
            constraintstr += ' (';
            if(startDate && !validator.date(startDate)){
                chobiUtil.inputError($startDateEl.parent(), 'Please enter a valid date in mm/dd/yyyy format');
                return false;
            }
            else{
                constraints.ctime.$gt = new Date(startDate).getTime();
                constraintstr += startDate;
            }
            constraintstr += '~';
            if(endDate && !validator.date(endDate)){
                chobiUtil.inputError($endDateEl.parent(), 'Please enter a valid date in mm/dd/yyyy format');
                return false;
            }
            else{
                constraints.ctime.$lt = new Date(endDate).getTime();
                constraintstr += endDate;
            }
            constraintstr += ')';
        }
        socket.emit('retrieveChatLogAction', JSON.stringify(constraints));
        $('#constraints-container').prepend($('<li class="constraint">').text(constraintstr).attr('data-index', module.systemAdmin.constraintsCount).click(function(){
            module.systemAdmin.renderChatLogData(module.systemAdmin.chatLogCache[parseInt($(this).attr('data-index'))]);
        }));
        module.systemAdmin.constraintsCount++;
    },

    receivedChatLogData: function(data){
        data = JSON.parse(data);
        if(data.meta.status == 200){
            module.systemAdmin.chatLogCache.push(data.data);
            module.systemAdmin.renderChatLogData(data.data);
        }
    },

    renderChatLogData: function(messages){
        if(module.data.pos === 'admin-chatlog'){
            $('#chatlog-container').html('');
            $.each(messages, function(index, message){
                $('#chatlog-container').append($('<li>').text(message.username + ': ' + message.msg));
            });
        }
    }
};