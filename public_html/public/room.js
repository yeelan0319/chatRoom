module.room = {

	renderIndex: function(data){
		module.data.pos = 'room';
		module.data.room = data.id;

		var tmpl = $.trim($('#room-index-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, data).replace(/^\s*/mg, ''));
		$('.container-idle').html($el);
		module.chat.renderChatPanel($('.container-idle'));
		
      	$('#admin').click(function(){
      		socket.emit('adminRender', module.data.room);
      	});
	}
}