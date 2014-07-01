var RoomItem = function(roomdata){
	this.id = roomdata._id;
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
		data = {
			id: this.id,
			name: this.name
		}
		socket.emit('joinRoomAction', JSON.stringify(data));
	},
	isAdmin: function(username){
		return this.admins.indexOf(username) != -1 ? true : false;
	}
}