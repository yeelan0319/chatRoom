var linkedUserList = {};

var socket = io();
socket.on('status message', function(msg){
	$('#messages').append($('<li class="system-message">').text(msg));
});
socket.on('chat message', function(msg){
	$('#messages').append($('<li>').text(msg));
});
socket.on('users data', function(data){
	data = JSON.parse(data);
	if(data.meta.status == 200){
		$('#user-list').html('');
        $.each(data.data, function(index, userdata){
        	var user = new UserItem(userdata);
        	$('#user-list').append(user.$el);
        });
    }
});
socket.on('linked users data', function(data){
	data = JSON.parse(data);
	if(data.meta.status == 200){
		$('#user-list').html('');
		$.each(data.data, function(index, userdata){
			var linkedUserItem = linkedUserList[userdata.username];
			if(!linkedUserItem){
				linkedUserItem = new LinkedUserItem(userdata);
			}
			linkedUserItem.addSession(userdata.token);
			linkedUserItem.addSocketID(userdata.id);
		});
		for(var username in linkedUserList){
			if(linkedUserList.hasOwnProperty(username)){
				linkedUserList[username].initEl();
			}
		}
	}
});
//TODOS: The following code cannot read PHPSESSID from safari and extend the expiration date properly.
//Tried jquery cookie plugin, W3C code and read the whole cookie data. None works.
//It all works on browser set cookies but not on the server set PHPSESSID.
socket.on('session extension', function(SESSIONAGE){
	$.get('/sessionExtension');
});
socket.on('render message', function(target){
	if(target == 'bootedPage'){
		$('body').html('');
		alert("You've been booted out of the system by administrator");
	}

	var tmpl = $.trim($('#' + target + '-index-tmpl').html());
	var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
	$('#container').html($el);
	switch(target){
		case 'admin':
			$('#back').click(function(){
				window.location = './';
			});
			$('#realtime').click(function(){
				linkedUserList = {};
				socket.emit('retrieveLinkedUserAction');
			}); 
			$('#alluser').click(function(){
				socket.emit('retrieveUserDataAction');
			});
			$('#realtime').click();
		case 'chat':
			$('form').submit(function(){
				var msg = $('#m').val();
				socket.emit('chatAction', msg);
				$('#m').val('');
				return false;
			});
	      	$('#signout').click(function(){
	      		socket.emit('logoutAction');
	      		$.removeCookie('PHPSESSID');
	      	});
	      	$('#admin').click(function(){
	      		socket.emit('adminRender');
	      	})
		break;
		case 'login':
			$('form').submit(function(){
                var username = $("#username").val() || '';
                var password = $("#password").val() || '';
                socket.emit('loginAction', JSON.stringify({username: username, password: password}));
					return false;
            });
            $('#register').click(function(){
            	socket.emit('registerRender');
            })
		break;
		case 'register':
			$('form').submit(function(){
                var username = $("#username").val() || '';
                var password = $("#password").val() || '';
                socket.emit('registerAction', JSON.stringify({username: username, password: password}));
					return false;
            });
            $('#login').click(function(){
            	socket.emit('loginRender');
            })
		break;
	}
});