module.lounge = {
	roomList: [],

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
      		socket.emit('adminRender');
      	});
      	$('#new-room').click(function(){
      		var name = prompt("please enter the name of your room");
      		if(name && module.lounge.roomList.indexOf(name) == -1){
      			socket.emit('createRoomAction', JSON.stringify({name: name}));
      		}
      	})
	},

	renderRoomData: function(data){
		data = JSON.parse(data);
		if(data.meta.status == 200){
			$.each(data.data, function(index, roomdata){
				var room = new RoomItem(roomdata);
				room.render();
			});
		}
	}
};

socket.on('room data', function(data){
	if(module.data.pos === 'lounge'){
		module.lounge.renderRoomData(data);
	}
});