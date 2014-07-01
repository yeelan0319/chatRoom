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
		that.$el.find('.permission').change(function(){that.edit.apply(that)});
		$('#user-list').append(that.$el);
	},
	edit: function(){
		var that = this;
		var username = that.username;
		var permission = that.$el.find('.permission').val() === 'admin'? 1 : 0;
		if(that.permission != permission){
			//send request to update information
			data = {username: username, permission: permission};
			socket.emit("editPermissionAction", JSON.stringify(data));
			that.permission = permission;
		}
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