var user = function(user){
	var that = this;
	that.username = user.username;
	that.permission = user.permission;

	var userTmpl = $.trim($('#user-item-tmpl').html());
	that.$el = $(Mustache.to_html(userTmpl, that).replace(/^\s*/mg, ''));
	that.$el.find('.delete').click(that.destroy);

	$('#user-list').append(that.$el);
}

user.prototype = {
	edit: function(){
		var that = this;
		var username = that.$el.find('.username').val();
		var permission = that.$el.find('.permission').val();
		if(that.permission != permission){
			//send request to update information
			data = {username: username, permission: permission};
			$.ajax({
				url: '/user/' + username,
				type: 'PUT',
				data: JSON.stringify(data),
				contentType: "application/json; charset=utf-8",
                dataType:"json",
                success: function(data){
                	if(data.meta.status == 200){
                		that.permission = permission;
                		that.$el.find('.status-box').val('update successful!').delay(3000).val('');
                	}
                	else{
                		//how to set select to certain value?
                		that.$el.find('.permission').val(that.permission);
                		that.$el.find('.status-box').val('update failed! Try again').delay(3000).val('');
                	}
                }
			});
		}
	},
	destroy: function(){
		var confirm = prompt("Are you sure to delete this user?");
		var that = this;
		if(confirm){
			data = {username: username};
			$.ajax({
				url: '/user/' + username,
				type: 'DELETE',
				data: JSON.stringify(data),
				contentType: "application/json; charset=utf-8",
                dataType:"json",
                success: function(data){
                	if(data.meta.status == 200){
                		that.$el.find('.status-box').val('delete successful!');
                		that.$el.delay(3000).remove();
                	}
                	else{
                		that.$el.find('.status-box').val('delete failed! Try again').delay(3000).val('');
                	}
                }
			});
		}
	}
}