var Message = function(data){
	this.msg = data.msg;
	this.ctime = data.ctime;
	this.firstName = data.fromFirstName;
	this.lastName = data.fromLastName;
	this.username = data.fromUsername;
	return this;
}

Message.prototype = {
	render: function(){
		this.$el = $('<li>' + this.firstName + ' ' + this.lastName + ': ' + this.msg + '</li>');
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

		that.$el.find('.pm-header').click(function(){that.toggle.apply(that)});
		that.$el.find('.pm-close').click(function(){that.close.apply(that)});
		return this.$el;
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
		this.$el.toggleClass('active');
	},

	close: function(){
		this.$el.hide();
		return false;
	},

	open: function(){
		this.$el.addClass('active').show();
		return this;
	},

	sendpm: function(){
		//emit and send pm
	}
}

module.privateMessage = {
	pmList:{},

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
		//emit and send the user information back, in dummy data format
	},

	_createNewPm: function(data){
		var pmItem = new PmItem(data);
		$('.pm-container').append(pmItem.render());
		module.privateMessage.pmList[pmItem.username] = pmItem;
		return pmItem;
	},

	receivepm: function(data){
		// data = JSON.parse(data);
		// if(data.meta.status == 200){
			var pmItem = module.privateMessage.pmList[data.username];
			if(!pmItem){
				pmItem = module.privateMessage._createNewPm(data);
			}
			else{
				$.each(data.messageArr, function(index, messageData){
					var message = new Message(messageData);
					pmItem.messageArr.push(message);
				});
				pmItem.open().renderMessage();
			}
	// 	}
	},

	searchIconClicked: function(){
		if($('.new-pm-outer').is('.active')){
			//search
		}
		else{
			module.privateMessage.searchOpen();
		}
	},

	searchOpen: function(){
		$('.new-pm-outer').addClass('active').animate({
			width: 195
		},600, function(){
			$('.new-pm .search-input').show().focus();
		});
	},

	searchClose: function(){
		$('.new-pm-outer').removeClass('active').animate({
			width: 35
		},600, function(){
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
		fromUsername: 'yiranmao@gmail.com'
	},{
		msg: 'haha',
		ctime: Date.now(),
		fromFirstName: 'yeelan',
		fromLastName: 'Mao',
		fromUsername: 'yiranmao@gmail.com'
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
		fromUsername: 'yiranmao@gmail.com'
	},{
		msg: 'haha1111',
		ctime: Date.now(),
		fromFirstName: 'yeelan',
		fromLastName: 'Mao',
		fromUsername: 'yiranmao@gmail.com'
	}]
}