var LinkedUserItem = function(userdata){
	this.username = userdata.username;
	this.sessionNumber = 0;
	this.socketNumber = 0;
	this.sessions = [];
	this.socketIDs = [];
	linkedUserList[this.username] = this;
};

LinkedUserItem.prototype = {
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
	initEl: function(){
		var linkedUserItemTmpl = $.trim($('#linked-user-item-tmpl').html());
		var that = this;
		that.$el = $(Mustache.to_html(linkedUserItemTmpl, that).replace(/^\s*/mg, ''));
		that.$el.find('.boot').click(function(){that.boot.apply(that)});
		$('#user-list').append(that.$el);
	},
	boot: function(){
		var confirmed = confirm("Are you sure to boot this user?");
		var that = this;
		if(confirmed){
			data = {sessions: that.sessions};
			socket.emit("focusLogout", JSON.stringify(data));
			that.$el.remove();
		}
	}
};