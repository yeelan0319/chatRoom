var LinkedUserItem = function(userdata){
	this.username = userdata.username;
	this.sessionNumber = 0;
	this.socketNumber = 0;
	this.sessions = [];
	this.socketIDs = [];
};

LinkedUserItem.prototype = {
	render: function(){
		var that = this;
		var linkedUserItemTmpl = $.trim($('#linked-user-item-tmpl').html());
		that.$el = $(Mustache.to_html(linkedUserItemTmpl, that).replace(/^\s*/mg, ''));
		that.$el.find('.boot').click(function(){that.boot.apply(that)});
		$('#user-list').append(that.$el);
	},
	renderRoomStyle: function(){
		var that = this;
		var linkedUserItemTmpl = $.trim($('#room-linked-user-item-tmpl').html());
		that.$el = $(Mustache.to_html(linkedUserItemTmpl, that).replace(/^\s*/mg, ''));
		that.$el.find('.boot').click(function(){that.boot.apply(that)});
		that.$el.find('.changePermission').click(function(){that.changePermission.apply(that)});
		$('#user-list').append(that.$el);
	},
	changePermission: function(){
		this.isAdminOfRoom = this.isAdminOfRoom^1;
		var data = {
			username: this.username,
			permission: this.isAdminOfRoom,
			id: module.data.room
		}
		socket.emit('editPermissionAction', JSON.stringify(data));
		this.$el.find('.changePermission').text(this.isAdminOfRoom ? 'unset admin' : 'set to admin');
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
			data = {username: that.username};
			socket.emit("forceLogout", JSON.stringify(data));
			that.$el.remove();
		}
	}
};