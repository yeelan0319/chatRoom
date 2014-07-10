module.lounge = {

	renderIndex: function(){
		module.data.pos = 'lounge';
		module.data.room = 0;

		var tmpl = $.trim($('#lounge-index-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$('.container-idle').html($el);
		module.chat.renderChatPanel($('#left-container'));

		socket.emit('retrieveRoomListAction');

		$('#signout').click(function(){
      		socket.emit('logoutAction');
      		$.removeCookie('PHPSESSID');
      	});
      	$('#admin').click(function(){
      		socket.emit('adminRender', module.data.room);
      	});
      	$('#new-room').click(function(){
      		var name = prompt("please enter the name of your room");
      		if(name && module.lounge.noDuplicateName(name)){
      			socket.emit('createRoomAction', JSON.stringify({name: name}));
      		}
      	});
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
	if(module.data.pos === 'lounge'){
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
	}
});