var UserItem = function(userdata){
	this.username = userdata.username;
	this.permission = userdata.permission;
};

UserItem.prototype = {
	render:function(){
		var that = this;
		var userTmpl = $.trim($('#user-item-tmpl').html());
		that.$el = $(Mustache.to_html(userTmpl, that).replace(/^\s*/mg, ''));
		that.$el.find('.delete').click(function(){that.destroy.apply(that)});
		that.$el.find('.permission :checkbox').checkbox().on('change', function(){that.edit.apply(that)});
		$('#alluser-userlist').append(that.$el);
	},
	edit: function(){
		this.permission = this.permission^1;
		data = {
			username: this.username, 
			permission: this.permission
		};
		socket.emit("editPermissionAction", JSON.stringify(data));
		this.$el.find('.permission .permission-label').text(this.permission?'Administrator':'User');
	},
	destroy: function(){
		var confirmed = confirm("Are you sure to delete this user?");
		var that = this;
		if(confirmed){
			data = {username: that.username};
			socket.emit("deleteUserAction", JSON.stringify(data));
			that.$el.remove();
		}
	}
};