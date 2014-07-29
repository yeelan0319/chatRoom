module.room = {

	renderIndex: function(data){
		module.data.pos = 'room';
		module.data.room = data.id;

		var $el = $(module.template.roomIndexTmpl(data));
		$('.container-idle').html($el);
		module.chat.renderChatPanel($('.container-idle'), data.messages);
		
      	$('#room-admin').click(function(){
      		socket.emit('adminRender', module.data.room);
      	});
	}
}