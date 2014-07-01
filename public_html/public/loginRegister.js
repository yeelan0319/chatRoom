module.loginRegister = {
	renderLogin: function(){
		module.data.pos = 'login';
		module.data.room = '';

		var tmpl = $.trim($('#login-index-tmpl').html());
		var $el = $(Mustache.to_html(tmpl, {}).replace(/^\s*/mg, ''));
		$('#container').html($el);

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
		$('#container').html($el);

		$('form').submit(function(){
            var username = $("#username").val() || '';
            var password = $("#password").val() || '';
            socket.emit('registerAction', JSON.stringify({username: username, password: password}));
				return false;
        });
        $('#login').click(function(){
        	socket.emit('loginRender');
        })
	}
}