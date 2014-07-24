var module = {};
var socket = io();

$(document).ready(function(){
	module.data = {
		pos: '',
		room: '',
		roomList: {}
	}
	module.template = {
		userItemTmpl: $.trim($('#user-item-tmpl').html()),
		linkedUserItemTmpl: $.trim($('#linked-user-item-tmpl').html()),
		roomUserItemTmpl: $.trim($('#room-user-item-tmpl').html()),
		loginIndexTmpl: $.trim($('#login-index-tmpl').html()),
		registerIndexTmpl: $.trim($('#register-index-tmpl').html()),
		loungeIndexTmpl: $.trim($('#lounge-index-tmpl').html()),
		roomIndexTmpl: $.trim($('#room-index-tmpl').html()),
		systemAdminIndexTmpl: $.trim($('#systemAdmin-index-tmpl').html()),
		roomAdminIndexTmpl: $.trim($('#roomAdmin-index-tmpl').html()),
		chatPanelTmpl: $.trim($('#chat-panel-tmpl').html()),
		userPanelTmpl: $.trim($('#user-panel-tmpl').html()),
		profileTmpl: $.trim($('#profile-index-tmpl').html()),
		pmItemTmpl: $.trim($('#pm-item-tmpl').html()),
		pmContainerTmpl: $.trim($('#pm-container-tmpl').html())
	}
	$('.template').remove();

	socket.on('session extension', function(){
		$.get('/sessionExtension');
	});

	socket.on('render message', function(res){
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
				module.data.user = res.data;
				module.lounge.renderFrame(res.data);
				break;
			case 'profile':
				module.lounge.renderProfile(res.data);
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


	socket.on('status message', function(msg){
		if(module.data.pos === 'lounge' || module.data.pos === 'room'){
			module.chat.renderSystemMessage(msg);
		}
	});
	socket.on('chat messages', function(data){
		data = JSON.parse(data);
		if(data.meta.status == 200){
			if(module.data.pos === 'lounge' || module.data.pos === 'room'){
				$.each(data.data, function(index, message){
					var msg = message.firstName + ": " + message.msg;
					module.chat.renderChatMessage(msg);
				});
			}
		}
	});

	socket.on('room data', function(data){
		data = JSON.parse(data);
		if(data.meta.status == 200){
			switch(data.data.type){
			case 'reset':
				$('#room-list').html('');
				module.lounge.renderRoom(data.data.data);
				break;
			case 'add':
				module.lounge.renderRoom(data.data.data);
				break;
			case 'delete':
				module.lounge.deleteRoom(data.data.data);
				break;
			}	
		}
	});

	socket.on('room linked users data', function(data){
	    module.roomAdmin.renderLinkedUserData(data);
	});

	socket.on('users data', function(data){
	    module.systemAdmin.renderRegisterUserData(data);
	});
	socket.on('linked users data', function(data){
	    module.systemAdmin.renderLinkedUserData(data);
	});

	socket.on('chat log', function(data){
		module.systemAdmin.renderChatLogData(data);
	});

	socket.on('private messages', function(pmItemData){
		module.privateMessage.receivepm(pmItemData);
	});
});