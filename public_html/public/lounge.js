module.lounge = {
	renderFrame: function(user){
		$('body').addClass('symbolic');
		$('.main-container').removeClass('session-container').addClass('chat-container');

		var $el = $(module.template.userPanelTmpl(user));
		$el.find('#profile').click(function(){
			socket.emit('retrieveUserProfileAction');
		});
		$el.find('#signout').click(function(){
			socket.emit('leaveRoomAction', JSON.stringify(module.data.room));
	  		socket.emit('logoutAction');
	  		$.removeCookie('PHPSESSID');
	  	});
	  	$el.find('#admin').click(function(){
	  		socket.emit('adminRender', 0);
	  	});
	  	$('.site-wrapper').append($el);
	  	
	  	module.privateMessage.init();

	  	$('.left-container').animate({
			left: 0
		},600);
		$('#lounge').unbind('click').click(function(){
			var data = {
				from: module.data.room,
				to: 0
			}
			socket.emit('joinRoomAction', JSON.stringify(data));
		});

	  	$('#new-room').unbind('click').click(function(){
	  		var name = prompt("please enter the name of your room");
	  		if(name && !module.lounge.findRoomIDWithName(name)){
	  			socket.emit('createRoomAction', JSON.stringify({name: name}));
	  		}
	  	});

	  	$('#adminTab a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});
	},

	renderProfile: function(data){
		var $el = $(module.template.profileTmpl(data.user));
		$('.site-wrapper').append($el);
        $('#profileModal').modal('toggle').on('hidden.bs.modal', function(e){
            $('#profileModal').remove();
        });
	},

	renderIndex: function(data){
		module.data.pos = 'lounge';
		module.data.room = 0;

		var $el = $(module.template.loungeIndexTmpl());
		$('.container-idle').html($el);
		module.chat.renderChatPanel($('.container-idle'), data.messages);
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

