var LinkedUserItem = function(userdata){
	this.username = userdata.username;
	this.activeSessions = 0;
	this.socketCount = 0;
	this.sessions = [];
	this.socketIDs = [];
	module.systemAdmin.linkedUserList[this.username] = this;
};

LinkedUserItem.prototype = {
	render: function(){
		var that = this;
		that.isSelf = that.username === module.data.user.username? true : false;
		that.$el = $(module.template.linkedUserItemTmpl(that));
		that.$el.find('.boot').unbind('click').click(function(){that.boot.apply(that)});
		$('#realtime-userlist').append(that.$el);
	},
	addSession: function(session){
		if(this.sessions.indexOf(session) == -1){
			this.sessions.push(session);
			this.activeSessions++;
		}
	},
	addSocketID: function(socketID){
		if(this.socketIDs.indexOf(socketID) == -1){
			this.socketIDs.push(socketID);
			this.socketCount++;
		}
	},
	boot: function(){
		var that = this;
		chobiUtil.confirmBox("Are you sure to boot this user?", function(){
			var data = {username: that.username};
			socket.emit("systemBootAction", JSON.stringify(data));
			that.$el.remove();
		});
	}
};