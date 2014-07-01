var module = {};
module.data = {
	pos : '',
	room : ''
}
var socket = io();

socket.on('session extension', function(){
	$.get('/sessionExtension');
});

socket.on('render message', function(res){
	res = JSON.parse(res);
	if(res.target == 'bootedPage'){
		$('body').html('');
		alert("You've been booted out of the system by administrator");
	}

	switch(res.target){
		case 'lounge':
			module.lounge.renderIndex();
			break;
		case 'room':
			module.room.renderIndex(res.data);
			break;
		case 'login':
			module.loginRegister.renderLogin();
			break;
		case 'register':
			module.loginRegister.renderRegister();
			break;
		case 'admin':
			module.admin.renderIndex();
			break;
	}
});