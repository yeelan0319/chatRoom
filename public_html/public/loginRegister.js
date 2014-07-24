module.loginRegister = {
	renderLogin: function(){
		module.data.pos = 'login';
		module.data.room = '';

		var tmpl = module.template.loginIndexTmpl;
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$('.container-idle').html($el);

		$('form').submit(function(){
	        var username = $("#username").val() || '';
	        var password = $("#password").val() || '';
	        socket.emit('loginAction', JSON.stringify({username: username, password: password}));
				return false;
	    });
	    $('#register').click(function(){
	    	socket.emit('registerRender');
	    })
	},

	renderRegister: function(){
		module.data.pos = 'register';
		module.data.room = '';

		var tmpl = module.template.registerIndexTmpl;
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$('.container-idle').html($el);

		$('form').submit(function(){
            var username = $("#username").val() || '';
            var password = $("#password").val() || '';
            var passwordConfirm = $("#passwordConfirm").val() || '';
            var firstName = $("#firstName").val() || '';
            var lastName = $("#lastName").val() || '';
            var phoneNumber = $("#phoneNumber").val() || '';
            var birthday = $("#birthday").val()||'';
            var jobDescription = $("#job").val()||'';
            var data = {
            	username: username,
            	password: password,
            	firstName: firstName,
            	lastName: lastName,
            	phoneNumber: phoneNumber,
            	birthday: birthday,
            	jobDescription: jobDescription
            }
            if(password === passwordConfirm){
            	socket.emit('registerAction', JSON.stringify(data));
            }
			return false;
        });
        $('#login').click(function(){
        	socket.emit('loginRender');
        });
        $('.input-group.date').datepicker({
		    startDate: "01/01/1940",
		    startView: 2,
		    autoclose: true
		});
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