var RoomUserItem = function(userdata){
	this.username = userdata.username;
	this.sessionNumber = 0;
	this.socketNumber = 0;
	this.sessions = [];
	this.socketIDs = [];
	this.isAdminOfRoom = 0;
	module.roomAdmin.linkedUserList[this.username] = this;
};

RoomUserItem.prototype = {
	render: function(){
		var that = this;
		var roomUserItemTmpl = $.trim($('#room-user-item-tmpl').html());
		that.$el = $(Mustache.to_html(roomUserItemTmpl, that).replace(/^\s*/mg, ''));
		that.$el.find('.boot').click(function(){that.boot.apply(that)});
		that.$el.find('.roomAdmin :checkbox').checkbox().on('change', function(){that.changePermission.apply(that)});
		$('#realtime-userlist').append(that.$el);
	},
	addSession: function(session){
		if(this.sessions.indexOf(session) == -1){
			this.sessions.push(session);
			this.sessionNumber++;
		}
	},
	addSocketID: function(socketID){
		if(this.socketIDs.indexOf(socketID) == -1){
			this.socketIDs.push(socketID);
			this.socketNumber++;
		}
	},
	boot: function(){
		var confirmed = confirm("Are you sure to boot this user?");
		var that = this;
		if(confirmed){
			data = {
				id: module.data.room, 
				username: that.username
			};
			socket.emit("roomBootAction", JSON.stringify(data));
			that.$el.remove();
		}
	},
	changePermission: function(){
		this.isAdminOfRoom = this.isAdminOfRoom^1;
		var data = {
			id: module.data.room,
			username: this.username,
			permission: this.isAdminOfRoom
		}
		socket.emit("editRoomAdminAction", JSON.stringify(data));
		this.$el.find('.roomAdmin .roomAdmin-label').text(this.isAdminOfRoom?'Administrator':'User');	
	}
};