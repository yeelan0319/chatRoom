var RoomItem = function(roomdata){
	this.id = roomdata.id;
	this.name = roomdata.name;
	this.admins = roomdata.admins;
	module.lounge.roomList.push(this.name);
}

RoomItem.prototype = {
	render: function(){
		var that = this;
		that.$el = $('<li class="room">').text(that.name);
		that.$el.click(function(){that.join.apply(that)});
		$('#room-list').append(that.$el);
	},
	join: function(){
		socket.emit('joinRoomAction', this.id);
	},
	isAdmin: function(username){
		return this.admins.indexOf(username) != -1 ? true : false;
	}
}