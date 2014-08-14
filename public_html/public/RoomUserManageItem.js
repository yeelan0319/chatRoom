var RoomUserManageItem = function(userdata){
	this.username = userdata.username;
	this.activeSessions = userdata.activeSessions || 0;
	this.socketCount = userdata.socketCount || 0;
	this.isAdminOfRoom = 0;
};

RoomUserManageItem.prototype = {
	render: function(){
		var that = this;
		var userdata = JSON.parse(JSON.stringify(that));
		userdata.isSelf = that.username === module.data.user.username? true : false;
		userdata.isAdminOfRoom = that.isAdminOfRoom === 1? true : false;
		that.$el = $(module.template.roomUserItemTmpl(userdata));
		that.$el.find('.boot').unbind('click').click(function(){that.boot.apply(that)});
		that.$el.find('.roomAdmin :checkbox').checkbox().unbind('change').on('change', function(){that.changePermission.apply(that)});
		return that.$el;
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