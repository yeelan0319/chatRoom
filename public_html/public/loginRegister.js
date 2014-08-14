module.loginRegister = {
	renderLogin: function(){
		module.data.pos = 'login';
		module.data.room = '';

		var $el = $(module.template.loginIndexTmpl());
		$el.find('form').submit(function(){
			chobiUtil.inputErrorClear($(this));

			var $usernameEl = $(this).find("#username");
			var $passwordEl = $(this).find("#password");
	        var username = $usernameEl.val() || '';
	        var password = $passwordEl.val() || '';
	        if(!validator.nickName(username)){
	        	chobiUtil.inputError($usernameEl.parent(), 'The username and password you entered did not match our records');
	        }
	        else if(!validator.password(password)){
	        	chobiUtil.inputError($passwordEl.parent(), 'The username and password you entered did not match our records');
	        }
	        else{
	        	socket.emit('loginAction', JSON.stringify({username: username, password: password}));
	        }
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
			chobiUtil.inputErrorClear($(this));

			var $usernameEl = $(this).find("#username");
			var $passwordEl = $(this).find("#password");
			var $passwordConfirmEl = $(this).find("#passwordConfirm");
			var $emailEl = $(this).find("#email");
            var username = $usernameEl.val() || '';
            var password = $passwordEl.val() || '';
            var passwordConfirm = $passwordConfirmEl.val() || '';
            var email = $emailEl.val() || '';

            if(!validator.nickName(username)){
	        	chobiUtil.inputError($usernameEl.parent(), 'Username must between 6-20 characters, consist of letters, numbers and underscores only');
	        }
	        else if(password !== passwordConfirm){
	        	chobiUtil.inputError($passwordEl.parent(), '');
	        	chobiUtil.inputError($passwordConfirmEl.parent(), "The two password fields didn't match");
	        }
	        else if(!validator.password(password)){
	        	chobiUtil.inputError($passwordEl.parent(), 'Password must have at least 6 characters, including both number and letter');
	        }
	        else if(!validator.email(email)){
	        	chobiUtil.inputError($emailEl.parent(), 'Please enter a valid email');
	        }
	        else{
	        	var data = {
	            	username: username,
	            	password: password,
	            	email: email
	            }
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
		$('#user-panel, .pm-item').remove();
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
			chobiUtil.inputErrorClear($(this));

			var $firstNameEl = $(this).find("#firstName");
			var $lastNameEl = $(this).find("#lastName");
			var $phoneNumberEl = $(this).find("#phoneNumber");
			var $birthdayEl = $(this).find("#birthday");
			var $jobDescriptionEl = $(this).find("#job");
            var firstName = $firstNameEl.val() || '';
            var lastName = $lastNameEl.val() || '';
            var phoneNumber = $phoneNumberEl.val() || '';
            var birthday = $birthdayEl.val() || '';
            var jobDescription = $jobDescriptionEl.val() || '';

            if(!validator.personName(firstName)){
            	chobiUtil.inputError($firstNameEl.parent(), 'Please enter a valid name');
            }
            else if(!validator.personName(lastName)){
            	chobiUtil.inputError($lastNameEl.parent(), 'Please enter a valid name');
            }
            else if(!validator.phoneNumber(phoneNumber)){
            	chobiUtil.inputError($phoneNumberEl.parent(), 'Please enter a valid phone number');
            }
            else if(!validator.date(birthday)&&new Date(birthday)<Date.now()){
            	chobiUtil.inputError($birthdayEl.parent(), 'Please enter a valid date in mm/dd/yyyy format');
            }
            else if(!validator.textMaxLength(jobDescription)){
            	chobiUtil.inputError($jobDescriptionEl.parent(), 'The job description should be less than 63354 characters');
            }
            else{
            	var data = {
	            	firstName: firstName,
	            	lastName: lastName,
	            	phoneNumber: phoneNumber,
	            	birthday: birthday,
	            	jobDescription: jobDescription
	            }
	            socket.emit('editUserAction', JSON.stringify(data));
            }
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
		});
		$('.container-idle').html($el);
	}
}