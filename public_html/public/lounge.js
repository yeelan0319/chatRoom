module.lounge = {
	renderFrame: function(user){
		$('body').addClass('symbolic');
		$('.main-container').removeClass('session-container').addClass('chat-container');

		var $userPanelEl = module.lounge.renderUserPanel(user);
	  	$('.site-wrapper').append($userPanelEl);
	  	
	  	module.privateMessage.init();
	  	
	  	$('.left-container').animate({
			left: 0
		},600);
		$('.left-container').find('#lounge').unbind('click').click(function(){
			var data = {
				from: module.data.room,
				to: 0
			}
			socket.emit('joinRoomAction', JSON.stringify(data));
		});
	  	$('.left-container').find('#new-room').unbind('click').click(function(){
	  		var $el = $(module.template.roomPromptTmpl());
	  		$el.modal('toggle').on('hidden.bs.modal', function(e){
	  			$el.remove();
	  		});
	  		$el.find("button:last").click(function(){
	  			chobiUtil.inputErrorClear($el);
	  			var name = $el.find("input").val();
	  			if(name && !module.lounge.findRoomIDWithName(name)){
		  			socket.emit('createRoomAction', JSON.stringify({name: name}));
		  			$el.modal('hide');
		  		}
		  		else{
		  			chobiUtil.inputError($el.find('input').parent(), 'The name is already in use...');
		  		}
	  		});
	  		$('.site-wrapper').append($el);
	  	});
	},

	renderUserPanel: function(user){
		user.permission = user.permission == 1? true : false;
		var $userPanelEl = $(module.template.userPanelTmpl(user));
		$userPanelEl.find('#profile').unbind('click').click(function(){
			socket.emit('retrieveUserProfileAction');
		});
		$userPanelEl.find('#signout').unbind('click').click(function(){
			socket.emit('leaveRoomAction', JSON.stringify(module.data.room));
	  		socket.emit('logoutAction');
	  		$.removeCookie('PHPSESSID');
	  	});
	  	$userPanelEl.find('#admin').unbind('click').click(function(){
	  		socket.emit('adminRender', 0);
	  	});

	  	return $userPanelEl;
	},

	renderProfile: function(data){
		var $el = $(module.template.profileTmpl(data.user));
		$('.site-wrapper').append($el);
        $el.modal('toggle').on('hidden.bs.modal', function(e){
            $el.remove();
        });
	},

	renderIndex: function(data){
		module.data.pos = 'lounge';
		module.data.room = 0;

		var $el = $(module.template.loungeIndexTmpl());
		$el.append(module.chat.renderChatPanel(data.messages));		
		$('.container-idle').html($el);
	},

	renderRoom: function(data){
		$.each(data, function(key, roomdata){
			var room = new RoomItem(roomdata);
			module.data.roomList[room.id] = room;
			room.render();
		});
	},

	deleteRoom: function(data){
		$.each(data, function(key, roomdata){
			var room = module.data.roomList[roomdata._id];
			if(room){
				room.destory();
				delete module.data.roomList[roomdata._id];
			}
		});
	},

	findRoomIDWithName: function(name){
		var id;
		if(name.toLowerCase() === 'lounge'){
			id = 0;
		}
		$.each(module.data.roomList, function(key, roomdata){
			if(roomdata.name.toLowerCase() === name.toLowerCase()){
				id = key;
			}
		});
		return id;
	}
};

