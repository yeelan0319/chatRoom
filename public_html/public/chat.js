module.chat = {
	renderChatPanel: function(targetContainer, messages){
		var tmpl = module.template.chatPanelTmpl;
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$.each(messages, function(index, message){
			$el.find('#messages').append(module.chat.renderChatMessage(message));
		})
		targetContainer.append($el);
		$el.find('#m').unbind('keydown').keydown(function(event){
			if(event.which == 13){
				module.chat.sendMessage();
				return false;
			}
		});
		$el.find('#m-send').unbind('click').click(module.chat.sendMessage);
	},

	renderChatMessage: function(message){
		return $('<li>').text(message.username + ": " + message.msg);
	},

	renderSystemMessage: function(message){
		return $('<li class="system-message">').text(message.username + ": " + message.msg);
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