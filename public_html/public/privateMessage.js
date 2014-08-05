var Message = function(data){
	this.msg = data.msg;
	this.ctime = data.ctime;
	this.username = data.fromUsername;
	this.hasRead = data.hasRead;
	return this;
}

Message.prototype = {
	render: function(){
		this.$el = $('<li>' + this.username + ': ' + this.msg + '</li>');
		// if(this.hasRead){
		// 	this.$el.addClass('oldMessage');
		// }
		return this.$el;
	}
}

var PmItem = function(data){
	var that = this;
	this.username = data.username;
	this.messageArr = [];
	$.each(data.messageArr, function(index, messageData){
		var message = new Message(messageData);
		that.messageArr.push(message);
	});
	return this;
}

PmItem.prototype = {
	render: function(){
		var that = this;
		that.$el = $(module.template.pmItemTmpl(that));
		
		that.renderMessage();

		that.$el.find('.pm-header').unbind('click').click(function(){that.toggle.apply(that); return false;});
		that.$el.find('.pm-close').unbind('click').click(function(){that.close.apply(that); return false;});
		that.$el.find('.pm-input').unbind('keydown').keydown(function(event){
			if(event.which == 13){
				that.sendpm.apply(that);
				return false;
			}
		});
		return that.$el;
	},

	renderMessage: function(){
		var that = this;
		var pmContainer = that.$el.find('.pm-content>.pm-message-container>ul');
		pmContainer.html('');
		$.each(that.messageArr, function(index, message){
			pmContainer.append(message.render());
		});
	},

	toggle: function(){
		if(this.$el.is('.active')){
			this.$el.removeClass('active');
		}
		else{
			this.open();
		}
	},

	close: function(){
		this.$el.removeClass('active').hide();
		return this;
	},

	open: function(){
		this.$el.show();
		module.privateMessage.closeOverfitPm();
		this.$el.addClass('active').find('.pm-input').focus();

		this.$el.find('.pm-message-container').scrollTop(this.$el.find('.pm-message-container')[0].scrollHeight);
		var data = {
			fromUsername: this.username
		}
		socket.emit('readPmAction', JSON.stringify(data));
		return this;
	},

	sendpm: function(){
		var $input = this.$el.find('.pm-input');
		var msg = $input.val();
		var pm = {
			toUsername: this.username,
			msg: msg
		}
		socket.emit('sendPmAction', JSON.stringify(pm));
		$input.val('');
	}
}

module.privateMessage = {
	init: function(){
		var $el = $(module.template.pmContainerTmpl());

		$el.find('.new-pm .fui-search').unbind('click').click(module.privateMessage.searchIconClicked);
		$el.find('.new-pm .search-input').unbind('keydown').keydown(function(event){
			if(event.which == 13){
				module.privateMessage.searchIconClicked();
				return false;
			}
		});
		$(document).unbind('.click').click(function(e){
			var clickWithinNewPm = $(e.target).closest('.new-pm').length == 0? false : true;
			if(!clickWithinNewPm && $('.new-pm-outer').is('.active')){
				module.privateMessage.searchClose();
			}
		});
		$(window).resize(module.privateMessage.closeOverfitPm);
		return $el;
	},

	findUserWithUsername: function(username){
		var data = {
			username: username
		}
		socket.emit('createPmAction', JSON.stringify(data));
	},

	closeOverfitPm: function(){
		if($(window).width() - $('#pm-container').width() < 200){
			$('.pm-box-outer.active').first().find('.pm-close').click();
		}	
	},

	createNewPm: function(data){
		var pmItem = new PmItem(data);
		$('#pm-container').append(pmItem.render());
		pmItem.open();
		module.data.pmList[pmItem.username] = pmItem;
		return pmItem;
	},

	receivepm: function(data){
		data = JSON.parse(data);
		if(data.meta.status == 200){
			data = data.data;
			var pmItem = module.data.pmList[data.username];
			if(!pmItem){
				pmItem = module.privateMessage.createNewPm(data);
			}
			else{
				$.each(data.messageArr, function(index, messageData){
					var message = new Message(messageData);
					pmItem.messageArr.push(message);
				});
				pmItem.open().renderMessage();
			}
		}
	},

	searchIconClicked: function(){
		if($('.new-pm-outer').is('.active')){
			//search
			var username = $('.new-pm .search-input').val();
			var pmItem = module.data.pmList[username];
			if(pmItem){
				pmItem.open();
			}
			else{
				module.privateMessage.findUserWithUsername(username);	
			}
			module.privateMessage.searchClose();
		}
		else{
			module.privateMessage.searchOpen();
		}
	},

	searchOpen: function(){
		$('.new-pm-outer').addClass('active').animate({
			width: 195
		},500, function(){
			$('.new-pm .search-input').show().focus();
		});
	},

	searchClose: function(){
		$('.new-pm-outer').removeClass('active').animate({
			width: 35
		},0, function(){
			$('.new-pm .search-input').val('').hide();
		});
	}
}