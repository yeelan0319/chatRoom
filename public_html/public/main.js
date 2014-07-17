var module = {};
module.data = {
	pos: '',
	room: '',
	roomList: {}
}
var socket = io();

socket.on('session extension', function(){
	$.get('/sessionExtension');
});

socket.on('render message', function(res){
	console.log(res);
	if(res.target == 'bootedPage'){
		$('body').html('');
		alert("You've been booted out of the system by administrator");
	}

	switch(res.target){
		case 'login':
			module.loginRegister.renderSessionFrame();
			module.loginRegister.renderLogin();
			break;
		case 'register':
			module.loginRegister.renderSessionFrame();
			module.loginRegister.renderRegister();
			break;
		case 'chatFrame':
			module.lounge.renderFrame(res.data);
			break;
		case 'lounge':
			module.lounge.renderIndex();
			break;
		case 'room':
			module.room.renderIndex(res.data);
			break;
		case 'systemAdmin':
			module.systemAdmin.renderIndex();
			break;
		case 'roomAdmin':
			module.roomAdmin.renderIndex();
			break;
	}
});