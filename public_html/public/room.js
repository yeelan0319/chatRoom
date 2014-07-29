module.room = {

	renderIndex: function(data){
		module.data.pos = 'room';
		module.data.room = data.id;

		var tmpl = module.template.roomIndexTmpl;
		var $el = $(Mustache.to_html(tmpl, data).replace(/^\s*/mg, ''));
		$('.container-idle').html($el);
		module.chat.renderChatPanel($('.container-idle'), data.messages);
		
      	$('#room-admin').click(function(){
      		socket.emit('adminRender', module.data.room);
      	});
	}
}