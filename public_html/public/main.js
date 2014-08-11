var module = {};
var socket = io();

$(document).ready(function(){
	module.data = {
		pos: '',
		room: '',
		roomList: {},
		pmList:{},
		offlineFlag: false
	}
	module.template = {
		userItemTmpl: Handlebars.compile($.trim($('#user-item-tmpl').html())),
		linkedUserItemTmpl: Handlebars.compile($.trim($('#linked-user-item-tmpl').html())),
		roomUserItemTmpl: Handlebars.compile($.trim($('#room-user-item-tmpl').html())),
		loginIndexTmpl: Handlebars.compile($.trim($('#login-index-tmpl').html())),
		registerIndexTmpl: Handlebars.compile($.trim($('#register-index-tmpl').html())),
		fillInfoIndexTmpl: Handlebars.compile($.trim($('#fill-info-index-tmpl').html())),
		loungeIndexTmpl: Handlebars.compile($.trim($('#lounge-index-tmpl').html())),
		roomIndexTmpl: Handlebars.compile($.trim($('#room-index-tmpl').html())),
		systemAdminIndexTmpl: Handlebars.compile($.trim($('#systemAdmin-index-tmpl').html())),
		roomAdminIndexTmpl: Handlebars.compile($.trim($('#roomAdmin-index-tmpl').html())),
		chatPanelTmpl: Handlebars.compile($.trim($('#chat-panel-tmpl').html())),
		userPanelTmpl: Handlebars.compile($.trim($('#user-panel-tmpl').html())),
		profileTmpl: Handlebars.compile($.trim($('#profile-index-tmpl').html())),
		pmItemTmpl: Handlebars.compile($.trim($('#pm-item-tmpl').html())),
		roomPromptTmpl: Handlebars.compile($.trim($('#room-prompt-tmpl').html())),
		contactItemTmpl: Handlebars.compile($.trim($('#contact-item-tmpl').html()))
	}
	$('.template').remove();

	socket.on('session extension', function(){
		$.get('/sessionExtension');
	});

	socket.on('disconnect', function(){
		chobiUtil.offlineBlock('disconnected');
	});
	socket.on('reconnect', function(){
		chobiUtil.offlineBlock('reconnected');
	});
	socket.on('reconnecting', function(){
		chobiUtil.offlineBlock('reconnecting');
	});
	socket.on('render message', function(res){
		res = JSON.parse(res);
		if(res.meta.status == 200){
			if(module.data.offlineFlag === true){
				chobiUtil.offlineBlock('renderMessageReceived');
			}
			else{
				res = res.data;
				if(res.target == 'bootedPage'){
					chobiUtil.offlineBlock('booted');
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
					case 'fillInfo':
						module.loginRegister.renderSessionFrame();
						module.loginRegister.renderFillInfo(res.data);
						break;
					case 'chatFrame':
						module.data.user = res.data;
						module.lounge.renderFrame(res.data);
						break;
					case 'profile':
						module.lounge.renderProfile(res.data);
						break;
					case 'lounge':
						module.lounge.renderIndex(res.data);
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
			}
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
			$.each(data.data, function(index, message){
				if(message.room == module.data.room){
					$("#messages").append(module.chat.renderChatMessage(message));
				}
			});
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
		module.privateMessage.receivePm(pmItemData);
	});
	socket.on('pm contact data', function(data){
		module.privateMessage.renderContactList(data);
	});
});