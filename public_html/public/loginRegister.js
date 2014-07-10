module.loginRegister = {
	renderLogin: function(){
		module.data.pos = 'login';
		module.data.room = '';

		var tmpl = $.trim($('#login-index-tmpl').html());
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

		var tmpl = $.trim($('#register-index-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$('.container-idle').html($el);

		$('form').submit(function(){
            var username = $("#username").val() || '';
            var password = $("#password").val() || '';
            var passwordConfirm = $("#passwordConfirm").val() || '';
            var firstName = $("#firstName").val() || '';
            var lastName = $("#lastName").val() || '';
            var phoneNumber = $("#phoneNumber").val() || '';
            var data = {
            	username: username,
            	password: password,
            	firstName: firstName,
            	lastName: lastName,
            	phoneNumber: phoneNumber
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
	}
}