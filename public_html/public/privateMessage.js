var Message = function(data){
	this.msg = data.msg;
	this.ctime = data.ctime;
	this.firstName = data.fromFirstName;
	this.lastName = data.fromLastName;
	this.username = data.fromUsername;
	this.hasRead = data.hasRead;
	return this;
}

Message.prototype = {
	render: function(){
		this.$el = $('<li>' + this.firstName + ' ' + this.lastName + ': ' + this.msg + '</li>');
		// if(this.hasRead){
		// 	this.$el.addClass('oldMessage');
		// }
		return this.$el;
	}
}

var PmItem = function(data){
	var that = this;
	this.username = data.username;
	this.firstName = data.firstName;
	this.lastName = data.lastName;
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
		var pmItemTmpl = module.template.pmItemTmpl;
		that.$el = $(Mustache.to_html(pmItemTmpl, that).replace(/^\s*/mg, ''));
		
		that.renderMessage();

		that.$el.find('.pm-header').click(function(){that.toggle.apply(that); return false;});
		that.$el.find('.pm-close').click(function(){that.close.apply(that); return false;});
		that.$el.find('.pm-input').keydown(function(event){
			if(event.which == 13){
				that.sendpm.apply(that);
				return false;
			}
		});
		that.open();
		return that.$el;
	},

	renderMessage: function(){
		var that = this;
		var pmContainer = that.$el.find('.pm-content>ul');
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
		this.$el.hide();
		return this;
	},

	open: function(){
		this.$el.addClass('active').show().find('.pm-input').focus();
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
		var tmpl = module.template.pmContainerTmpl;
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));

		$el.find('.new-pm .fui-search').click(module.privateMessage.searchIconClicked);
		$(document).on('click.bs.pm', function(e){
			var clickWithinNewPm = $(e.target).closest('.new-pm').length == 0? false : true;
			if(!clickWithinNewPm && $('.new-pm-outer').is('.active')){
				module.privateMessage.searchClose();
			}
		});
		$('.site-wrapper').append($el);
	},

	findUserWithUsername: function(username){
		var data = {
			username: username
		}
		socket.emit('createPmAction', JSON.stringify(data));
	},

	createNewPm: function(data){
		var pmItem = new PmItem(data);
		$('#pm-container').append(pmItem.render());
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

var dummyData = {
	username: 'yiranmao@gmail.com',
	firstName: 'Yiran',
	lastName: 'Mao',
	messageArr: [{
		msg: 'test',
		ctime: Date.now(),
		fromFirstName: 'Yiran',
		fromLastName: 'Mao',
		fromUsername: 'yiranmao@gmail.com',
		hasRead: true
	},{
		msg: 'haha',
		ctime: Date.now(),
		fromFirstName: 'yeelan',
		fromLastName: 'Mao',
		fromUsername: 'yiranmao@gmail.com',
		hasRead: false
	}]
}

var dummyData2 = {
	username: 'ym731@nyu.com',
	firstName: 'Yiran',
	lastName: 'Mao',
	messageArr: [{
		msg: 'test1111',
		ctime: Date.now(),
		fromFirstName: 'Yiran',
		fromLastName: 'Mao',
		fromUsername: 'yiranmao@gmail.com',
		hasRead: false
	},{
		msg: 'haha1111',
		ctime: Date.now(),
		fromFirstName: 'yeelan',
		fromLastName: 'Mao',
		fromUsername: 'yiranmao@gmail.com',
		hasRead: false
	}]
}