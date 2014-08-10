var RoomItem = function(roomdata){
	this.id = roomdata._id;
	this.name = roomdata.name;
	this.admins = roomdata.admins;
}

RoomItem.prototype = {
	render: function(){
		var that = this;
		that.$el = $('<li class="room">').text(that.name);
		that.$el.unbind('click').click(function(){that.join.apply(that)});
		$('#room-list').append(that.$el);
	},
	//when receive destory information from others, it need to clear the list
	destory: function(){
		this.$el.remove();
	},
	join: function(){
		var data = {
			from: module.data.room,
			to: this.id
		}
		socket.emit('joinRoomAction', JSON.stringify(data));
	}
}