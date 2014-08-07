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
            var email = $el.find("#email").val() || '';
            var data = {
            	username: username,
            	password: password,
            	email: email
            }
            if(password === passwordConfirm){
            	socket.emit('registerAction', JSON.stringify(data));
            }
			return false;
        });
        $el.find('#login').unbind('click').click(function(){
        	socket.emit('loginRender');
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
	},

	renderFillInfo: function(data){
		module.data.pos = 'fillInfo';
		module.data.room = '';

		var $el = $(module.template.fillInfoIndexTmpl(data));

		$el.find('form').submit(function(){
            var firstName = $el.find("#firstName").val() || '';
            var lastName = $el.find("#lastName").val() || '';
            var phoneNumber = $el.find("#phoneNumber").val() || '';
            var birthday = $el.find("#birthday").val() || '';
            var jobDescription = $el.find("#job").val() || '';
            var data = {
            	firstName: firstName,
            	lastName: lastName,
            	phoneNumber: phoneNumber,
            	birthday: birthday,
            	jobDescription: jobDescription
            }
            socket.emit('editUserAction', JSON.stringify(data));
			return false;
        });
        $el.find('.input-group.date').datepicker({
		    startDate: "01/01/1940",
		    startView: 2,
		    autoclose: true
		});
		var uploader = new qq.FileUploaderBasic({
			button: $el.find('.avatar-upload')[0],
			action: '/upload/avatar',
			allowedExtension:['jpg', 'jpeg', 'png'],
			onProgress: function(id, fileName, loaded, total){
				console.log(id, fileName, loaded, total);
			},
			onComplete: function(id, fileName, responseJSON){
				var res = JSON.parse(responseJSON);
				console.log(res);
				if(res.meta.status == 200){
					$el.find('.avatar').attr('src', res.data.avatar);
				}
			}
		})
		$('.container-idle').html($el);
	}
}