module.loginRegister = {
	renderLogin: function(){
		module.data.pos = 'login';
		module.data.room = '';

		var $el = $(module.template.loginIndexTmpl());
		$el.find('form').submit(function(){
	        var username = $el.find("#username").val() || '';
	        var password = $el.find("#password").val() || '';
	        socket.emit('loginAction', JSON.stringify({username: username, password: password}));
				return false;
	    });
	    $el.find('#register').unbind('click').click(function(){
	    	socket.emit('registerRender');
	    })
	    $('.container-idle').html($el);
	},

	renderRegister: function(){
		module.data.pos = 'register';
		module.data.room = '';

		var $el = $(module.template.registerIndexTmpl());
		$el.find('form').submit(function(){
            var username = $el.find("#username").val() || '';
            var password = $el.find("#password").val() || '';
            var passwordConfirm = $el.find("#passwordConfirm").val() || '';
            var firstName = $el.find("#firstName").val() || '';
            var lastName = $el.find("#lastName").val() || '';
            var phoneNumber = $el.find("#phoneNumber").val() || '';
            var birthday = $el.find("#birthday").val() || '';
            var email = $el.find("#email").val() || '';
            var jobDescription = $el.find("#job").val() || '';
            var data = {
            	username: username,
            	password: password,
            	firstName: firstName,
            	lastName: lastName,
            	phoneNumber: phoneNumber,
            	birthday: birthday,
            	email: email,
            	jobDescription: jobDescription
            }
            if(password === passwordConfirm){
            	socket.emit('registerAction', JSON.stringify(data));
            }
			return false;
        });
        $el.find('#login').unbind('click').click(function(){
        	socket.emit('loginRender');
        });
        $el.find('.input-group.date').datepicker({
		    startDate: "01/01/1940",
		    startView: 2,
		    autoclose: true
		});
		$('.container-idle').html($el);
	},

	renderSessionFrame: function(){
		module.data.user = {};
		module.data.roomList = {};
		module.data.pmList = {};
		$('#user-panel, #pm-container').remove();
		$('body').removeClass('symbolic');
		$('.main-container').removeClass('chat-container').addClass('session-container');
		$('.left-container').animate({
			left: -200
		},600).find('#room-list').html('');
	}
}