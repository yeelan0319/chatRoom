var RoomAdminItem = function(username){
	this.username = username;
}

RoomAdminItem.prototype = {
	render: function(){
		var that = this;
		var roomAdminItemTmpl = $.trim($('#room-admin-item-tmpl').html());
		that.$el = $(Mustache.to_html(roomAdminItemTmpl, that).replace(/^\s*/mg, ''));
		that.$el.find('.unset-admin').click(function(){that.unsetAdmin.apply(that)});
		$('#admin-list').append(that.$el);
		
	}
}