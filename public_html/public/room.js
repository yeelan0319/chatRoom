module.room = {

	renderIndex: function(data){
		module.data.pos = 'room';
		module.data.room = data.id;

		var $el = $(module.template.roomIndexTmpl(data));
		$el.append(module.chat.renderChatPanel(data.messages));
		$el.find('#room-admin').unbind('click').click(function(){
      		socket.emit('adminRender', module.data.room);
      	});

		$('.container-idle').html($el);
		setChatPanelSize();
	}
}