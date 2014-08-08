var stateHandler = {};

stateHandler.inputError = function($targetEl, message){
	$targetEl.addClass('has-error').append('<span class="error-message" style="position:absolute; bottom:-18px; left:0px; font-size:12px; line-height:18px; color:#C0392B">' + message + '</span>');
}

stateHandler.inputErrorClear = function($targetContainer){
	$targetContainer.find('.has-error').removeClass('has-error');
	$targetContainer.find('.error-message').remove();
}