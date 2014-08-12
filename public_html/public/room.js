module.room = {

	onlineList:[],

	renderIndex: function(data){
		module.data.pos = 'room';
		module.data.room = data.id;

		var $el = $(module.template.roomIndexTmpl(data));
		$el.append(module.chat.renderChatPanel(data.messages));
		$el.find('#room-admin').unbind('click').click(function(){
      		socket.emit('adminRender', module.data.room);
      	});

		$('.container-idle').html($el);
		setChatPanelSize();
	},

	renderOnlineList: function(data){
		data = JSON.parse(data);
		if(data.meta.status == 200){
			console.log(data.data);
			if(data.data.type === 'delete'){
				$.each(data.data.users, function(index, userdata){
					if(!_.find(module.room.onlineList, function(obj){return obj.username === userdata.username})){
						module.room.onlineList.push(new ContactItem(userdata));
					}
				});
			}
			else{
				if(data.data.type === 'reset'){
					module.room.onlineList = [];
				}
				$.each(data.data.users, function(index, userdata){
					if(!_.find(module.room.onlineList, function(obj){return obj.username === userdata.username})){
						module.room.onlineList.push(new ContactItem(userdata));
					}
				});
			}
			_.sortBy(module.room.onlineList, 'username');
			$("#online-list ul").html('');
			$.each(module.room.onlineList, function(index, contactItem){
				$("#online-list ul").append(contactItem.render());
			})

		}
	}
}