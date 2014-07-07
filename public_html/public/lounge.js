module.lounge = {
	roomList: {},

	renderIndex: function(){
		module.data.pos = 'lounge';
		module.data.room = 0;

		var tmpl = $.trim($('#lounge-index-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$('#container').html($el);
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
      		if(name && !module.lounge.roomList[name]){
      			socket.emit('createRoomAction', JSON.stringify({name: name}));
      		}
      	})
	},

	renderRoomData: function(roomList){
		$.each(roomList, function(key, roomdata){
			var room = new RoomItem(roomdata);
			module.lounge.roomList[room.name] = room;
			room.render();
		});
	},

	destoryRoomData: function(roomList){
		$.each(roomList, function(key, roomdata){
			var room = module.lounge.roomList[roomdata.name];
			if(room){
				room.destory();
				delete room;
			}
		})
	}
};

socket.on('room data', function(data){
	if(module.data.pos === 'lounge'){
		data = JSON.parse(data);
		if(data.meta.status === 200){
			if(data.data.type === 'destory'){
				module.lounge.destoryRoomData(data.data.roomList);
			}
			else{
				if(data.data.type === 'reset'){
					$('#room-list').html('');
				}
				module.lounge.renderRoomData(data.data.roomList);
			}
		}
	}
});