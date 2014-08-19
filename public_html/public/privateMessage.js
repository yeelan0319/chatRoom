var DONETYPINGINTERVAL = 500;

var Message = function(data){
	this.msg = data.msg;
	this.ctime = data.ctime;
	this.username = data.fromUsername;
	this.hasRead = data.hasRead;
	return this;
}

Message.prototype = {
	render: function(){
		this.$el = $('<li>').text(this.username + ': ' + this.msg);
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
		setPmContainerSize(that.$el);
		return that.$el;
	},

	renderMessage: function(){
		var that = this;
		var pmContainer = that.$el.find('.pm-content>.pm-message-container>ul');
		pmContainer.html('');
		$.each(that.messageArr, function(index, message){
			pmContainer.append(message.render());
		});
		return that;
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

ContactItem = function(data){
	this.username = data.username;
	this.avatar = data.avatar;
	return this;
}

ContactItem.prototype = {
	render: function(){
		var that = this;
		that.$el = $(module.template.contactItemTmpl(that));
		if(that.username !== module.data.user.username){
			that.$el.unbind('click').click(function(){module.privateMessage.openPm(that.username)});
		}
		return that.$el;
	}
}

module.privateMessage = {
	init: function(){
		var typingTimer;
		
		$('.left-container .search-input').unbind('keyup').keyup(function(){
			clearTimeout(typingTimer);
			typingTimer = setTimeout(module.privateMessage.searchContact, DONETYPINGINTERVAL)
		}).unbind('keydown').keydown(function(event){
			clearTimeout(typingTimer);
			if(event.which == 13){
				module.privateMessage.searchContact();
			}
			
		});
		$(window).resize(module.privateMessage.closeOverfitPm);
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

	receivePm: function(data){
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
				pmItem.renderMessage().open();
			}
		}
	},
	searchContact: function(){
		var str = $('.left-container .search-input').val();
		if(str){
			socket.emit('searchPmAction', str);
		}
		else{
			$('#contact-list .contact-item').remove();
		}
	},
	renderContactList: function(data){
		data = JSON.parse(data);
		if(data.meta.status === 200){
			$('#contact-list').html('');
			$.each(data.data, function(index, contactData){
				if(contactData.username!==module.data.user.username){
					var contactItem = new ContactItem(contactData);
					$('#contact-list').append(contactItem.render());
				}
			});
		}
	},
	openPm: function(username){
		var pmItem = module.data.pmList[username];
		if(pmItem){
			pmItem.open();
		}
		else{
			var data = {
				username: username
			}
			socket.emit('createPmAction', JSON.stringify(data));
		}
	}
}