module.room = {
	renderIndex: function(data){
		module.data.pos = 'room';
		module.data.room = data.id;

		var tmpl = $.trim($('#room-index-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, data).replace(/^\s*/mg, ''));
		$('#container').html($el);
		module.chat.renderChatPanel($('#container'));
		
		$('#back').click(function(){
            window.location = './';
        });
		$('#signout').click(function(){
      		socket.emit('logoutAction');
      		$.removeCookie('PHPSESSID');
      	});
      	$('#admin').click(function(){
      		socket.emit('adminRender');
      	});
	}
}