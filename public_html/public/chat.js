module.chat = {
	renderChatPanel: function(targetContainer){
		socket.emit('retrievePastMessage', module.data.room);
		var tmpl = module.template.chatPanelTmpl;
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		targetContainer.append($el);
		$('#m').keydown(function(event){
			if(event.which == 13){
				module.chat.sendMessage();
				return false;
			}
		});
		$('#m-send').click(module.chat.sendMessage);
	},

	renderChatMessage: function(msg){
		$('#messages').append($('<li>').text(msg));
	},

	renderSystemMessage: function(msg){
		$('#messages').append($('<li class="system-message">').text(msg));
	},

	sendMessage: function(){
		var msg = $('#m').val();
		if(msg){
			var data = {
				msg: msg,
				id: module.data.room
			}
			socket.emit('chatAction', JSON.stringify(data));
			$('#m').val('').focus();
		}
		return false;
	}
}