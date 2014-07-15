module.lounge = {
	renderFrame: function(data){
		$('body').addClass('symbolic');
		$('.main-container').removeClass('session-container').addClass('chat-container');

		var tmpl = $.trim($('#user-panel-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, data).replace(/^\s*/mg, ''));
		$el.find('#signout').click(function(){
			socket.emit('leaveRoomAction', module.data.room);
	  		socket.emit('logoutAction');
	  		$.removeCookie('PHPSESSID');
	  	});
	  	$el.find('#admin').click(function(){
	  		socket.emit('adminRender', module.data.room);
	  	});
	  	$('#user-panel').html($el);


	  	socket.emit('retrieveRoomListAction');
	  	$('.left-container').animate({
			left: 0
		},600);
		$('#lounge').click(function(){
			data = {
				from: module.data.room,
				to: 0
			}
			socket.emit('joinRoomAction', JSON.stringify(data));
		});

	  	$('#new-room').click(function(){
	  		var name = prompt("please enter the name of your room");
	  		if(name && module.lounge.noDuplicateName(name)){
	  			socket.emit('createRoomAction', JSON.stringify({name: name}));
	  		}
	  	});

	  	$('#adminTab a').click(function (e) {
		  e.preventDefault()
		  $(this).tab('show')
		});
	},

	renderIndex: function(){
		module.data.pos = 'lounge';
		module.data.room = 0;

		var tmpl = $.trim($('#lounge-index-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$('.container-idle').html($el);
		module.chat.renderChatPanel($('.container-idle'));
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
				delete room;
			}
		});
	},

	noDuplicateName: function(name){
		$.each(module.data.roomList, function(key, roomdata){
			if(roomdata.name === name){
				return false;
			}
		});
		return true;
	}
};

socket.on('room data', function(data){
	data = JSON.parse(data);
	if(data.meta.status == 200){
		switch(data.data.type){
		case 'reset':
			$('#room-list').html('');
			module.lounge.renderRoom(data.data.data);
			break;
		case 'add':
			module.lounge.renderRoom(data.data.data);
			break;
		case 'delete':
			module.lounge.deleteRoom(data.data.data);
			break;
		}	
	}
});