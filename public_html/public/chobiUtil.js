var chobiUtil = {};

chobiUtil.inputError = function($targetEl, message){
	$targetEl.addClass('has-error').append('<span class="error-message" style="position:absolute; bottom:-18px; left:0px; font-size:12px; line-height:18px; color:#C0392B">' + message + '</span>');
}

chobiUtil.inputErrorClear = function($targetContainer){
	$targetContainer.find('.has-error').removeClass('has-error');
	$targetContainer.find('.error-message').remove();
}

chobiUtil.offlineBlock = function(status){
	switch(status){
		case 'disconnected':
			module.data.offlineFlag = true;
			if(['admin-roomuser', 'admin-linkeduser', 'admin-alluser', 'admin-chatlog'].indexOf(module.data.pos) !== -1){
				$("#adminModal").modal('hide');
			}
			$('body').append('<div class="offline-alert"><div class="modal-backdrop fade in"></div><div class="msg">Temporarily lost connect to the server</div></div>');
			//hint that the application is offline right now
			break;
		case 'reconnecting':
			$('.offline-alert .msg').text('Reconnecting to server...');
			break;
		case 'reconnected':
			$('.offline-alert .msg').text('Successfully reconnected!');
			break;
		case 'renderMessageReceived':
			if(module.data.pos === 'room'){
				var data = {
					from: 0,
					to: module.data.room
				}
				socket.emit('joinRoomAction', JSON.stringify(data));
			}
			module.data.offlineFlag = false;
			$('.offline-alert').remove();
			break;
		case 'booted':
			$('body').html('<div class="offline-alert"><div class="modal-backdrop fade in"></div><div class="msg">You have been booted out of the system by administrator</div></div>');
			break;
	}
}