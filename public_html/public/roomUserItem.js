var RoomUserItem = function(userdata){
	this.username = userdata.username;
	this.loginCount = 0;
	this.socketCount = 0;
	this.sessions = [];
	this.socketIDs = [];
	this.isAdminOfRoom = 0;
	module.roomAdmin.linkedUserList[this.username] = this;
};

RoomUserItem.prototype = {
	render: function(){
		var that = this;
		var userdata = JSON.parse(JSON.stringify(that));
		userdata.isSelf = that.username === module.data.user.username? true : false;
		userdata.isAdminOfRoom = that.isAdminOfRoom === 1? true : false;
		that.$el = $(module.template.roomUserItemTmpl(userdata));
		that.$el.find('.boot').unbind('click').click(function(){that.boot.apply(that)});
		that.$el.find('.roomAdmin :checkbox').checkbox().unbind('change').on('change', function(){that.changePermission.apply(that)});
		$('#realtime-userlist').append(that.$el);
	},
	addSession: function(session){
		if(this.sessions.indexOf(session) == -1){
			this.sessions.push(session);
			this.loginCount++;
		}
	},
	addSocketID: function(socketID){
		if(this.socketIDs.indexOf(socketID) == -1){
			this.socketIDs.push(socketID);
			this.socketCount++;
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