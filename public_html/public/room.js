var RoomUserItem = function(userdata){
	this.username = userdata.username;
	this.avatar = userdata.avatar;
	this.sessions = {};
	this.activeSessions = 0;
	this.socketCount = 0;
};

RoomUserItem.prototype = {
	addNewConnection: function(session){
		this.socketCount++;
		if(!this.sessions[session]){
			this.sessions[session] = 1;
			this.activeSessions++;
		}
		else{
			this.sessions[session]++;
		}
	},
	deleteConnection: function(session){
		this.socketCount--;
		this.sessions[session]--;
		if(this.sessions[session]==0){
			delete this.sessions[session];
			this.activeSessions--;
		}
	}
};

module.room = {

	onlineList:[],

	renderIndex: function(data){
		module.data.pos = 'room';
		module.data.room = data.id;

		var $el = $(module.template.roomIndexTmpl(data));
		$el.append(module.chat.renderChatPanel(data.messages));
		$el.find('#room-admin').unbind('click').click(function(){
      		socket.emit('adminRender', module.data.room);
      	});

		$('.container-idle').html($el);
	},

	updateOnlineList: function(data){
		data = JSON.parse(data);
		if(data.meta.status == 200){
			if(data.data.type === 'delete'){
				$.each(data.data.users, function(index, userdata){
					roomUserItem = _.find(module.room.onlineList, function(obj){return obj.username === userdata.username});
					roomUserItem.deleteConnection(userdata.token);
					if(roomUserItem.socketCount == 0){
						module.room.onlineList = _.filter(module.room.onlineList, function(roomUserItem){return roomUserItem.username !== userdata.username});
						$('#messages').append(module.chat.renderSystemMessage(roomUserItem.username + ' has left the room'));
					}
				});
			}
			else{
				if(data.data.type === 'reset'){
					module.room.onlineList = [];
				}
				$.each(data.data.users, function(index, userdata){
					var roomUserItem = _.find(module.room.onlineList, function(obj){return obj.username === userdata.username});
					if(!roomUserItem){
						roomUserItem = new RoomUserItem(userdata);
						module.room.onlineList.push(roomUserItem);
						if(data.data.type == 'add'){
							$('#messages').append(module.chat.renderSystemMessage(roomUserItem.username + ' has joined the room'));
						}
					}
					roomUserItem.addNewConnection(userdata.token);
				});
			}
			module.room.onlineList = _.sortBy(module.room.onlineList, 'username');
			//here to trigger event and update online list/admin page information
			module.room.renderOnlineList();
		}
	},

	renderOnlineList: function(){
		$("#online-list").html('');
		$.each(module.room.onlineList, function(index, roomUserItem){
			$("#online-list").append(new ContactItem(roomUserItem).render());
		});
	}
}