var RoomItem = function(roomdata){
	this.id = roomdata.id;
	this.name = roomdata.name;
	this.admins = roomdata.admins;
}

RoomItem.prototype = {
	render: function(){
		var that = this;
		that.$el = $('<li class="room">').text(that.name);
		that.$el.click(function(){that.join.apply(that)});
		$('#room-list').append(that.$el);
	},
	destory: function(){
		this.$el.remove();
	},
	join: function(){
		socket.emit('joinRoomAction', this.id);
	}
}