module.chat = {
	renderChatPanel: function(targetContainer){
		var tmpl = $.trim($('#chat-panel-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		targetContainer.append($el);
		$('form').submit(function(){
			var data = {
				msg: $('#m').val(),
				id: module.data.room
			}
			socket.emit('chatAction', JSON.stringify(data));
			$('#m').val('');
			return false;
		});
	},

	renderChatMessage: function(msg){
		$('#messages').append($('<li>').text(msg));
	},

	renderSystemMessage: function(msg){
		$('#messages').append($('<li class="system-message">').text(msg));
	}
}

socket.on('status message', function(msg){
	if(module.data.pos === 'lounge' || module.data.pos === 'room'){
		module.chat.renderSystemMessage(msg);
	}
});
socket.on('chat message', function(msg){
	if(module.data.pos === 'lounge' || module.data.pos === 'room'){
		module.chat.renderSystemMessage(msg);
	}
});