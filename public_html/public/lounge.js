module.lounge = {
	renderFrame: function(user){
		$('body').addClass('symbolic');
		$('.main-container').removeClass('session-container').addClass('chat-container');

		var $userPanelEl = module.lounge.renderUserPanel(user);
	  	$('.site-wrapper').append($userPanelEl);
	  	
	  	module.privateMessage.init();
	  	
	  	$('.left-container').animate({
			left: 0
		},600);
		$('.left-container').find('#lounge').unbind('click').click(function(){
			var data = {
				from: module.data.room,
				to: 0
			}
			socket.emit('joinRoomAction', JSON.stringify(data));
		});
	  	$('.left-container').find('#new-room').unbind('click').click(function(){
	  		var $el = $(module.template.roomPromptTmpl());
	  		$el.modal('toggle').on('hidden.bs.modal', function(e){
	  			$el.remove();
	  		}).on('shown.bs.modal', function(){
	  			$el.find('input').focus();
	  		});
	  		$el.find("button:last").unbind('click').click(function(){
	  			module.lounge.createRoom();
	  		});
	  		$el.unbind('keydown').keydown(function(event){
	  			if(event.which == 13){
	  				module.lounge.createRoom();
	  			}
	  		});
	  		$('.site-wrapper').append($el);	
	  	});
	},

	renderUserPanel: function(user){
		var userdata = JSON.parse(JSON.stringify(user));
		userdata.permission = userdata.permission === 1? true : false;
		var $userPanelEl = $(module.template.userPanelTmpl(userdata));
		$userPanelEl.find('#profile').unbind('click').click(function(){
			socket.emit('retrieveUserProfileAction');
		});
		$userPanelEl.find('#signout').unbind('click').click(function(){
	  		socket.emit('logoutAction');
	  		$.removeCookie('PHPSESSID');
	  	});
	  	$userPanelEl.find('#admin').unbind('click').click(function(){
	  		socket.emit('adminRender', 0);
	  	});

	  	return $userPanelEl;
	},

	renderProfile: function(data){
		var $el = $(module.template.profileTmpl(data.user));
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
		$el.find('.input-group.date').datepicker({
		    startDate: "01/01/1940",
		    startView: 2,
		    autoclose: true
		});
		$el.find('.read-only button').unbind('click').click(function(){
			$el.find('.read-only').hide();
			$el.find('.edit-mode').show();
			$el.find("input[name=firstName]").focus();
		});
		$el.find('.edit-mode button:last').unbind('click').click(function(){
			$el.find("input[name=firstName]").val($el.find("#firstName").text());
			$el.find("input[name=lastName]").val($el.find("#lastName").text());
			$el.find("input[name=phoneNumber]").val($el.find("#phoneNumber").text());
			$el.find('input[name=email]').val($el.find("#email").text());
			$el.find("input[name=birthday]").val($el.find("#birthday").text());
			$el.find("textarea[name=job]").val($el.find("#job").text());
            
			$el.find('.read-only').show();
			$el.find('.edit-mode').hide();
		});
		$el.find('.edit-mode button:first').unbind('click').click(function(){
			chobiUtil.inputErrorClear($el);

			var $firstNameEl = $el.find("input[name=firstName]");
			var $lastNameEl = $el.find("input[name=lastName]");
			var $phoneNumberEl = $el.find("input[name=phoneNumber]");
			var $emailEl = $el.find('input[name=email]');
			var $birthdayEl = $el.find("input[name=birthday]");
			var $jobDescriptionEl = $el.find("textarea[name=job]");
            var firstName = $firstNameEl.val();
            var lastName = $lastNameEl.val();
            var phoneNumber = $phoneNumberEl.val();
            var email = $emailEl.val();
            var birthday = $birthdayEl.val();
            var jobDescription = $jobDescriptionEl.val();

            if(!validator.personName(firstName)){
            	chobiUtil.inputError($firstNameEl.parent(), 'Please enter a valid name');
            }
            else if(!validator.personName(lastName)){
            	chobiUtil.inputError($lastNameEl.parent(), 'Please enter a valid name');
            }
            else if(!validator.phoneNumber(phoneNumber)){
            	chobiUtil.inputError($phoneNumberEl.parent(), 'Please enter a valid phone number');
            }
            else if(!validator.email(email)){
            	chobiUtil.inputError($emailEl.parent(), 'Please enter a valid email address');
            }
            else if(!validator.date(birthday)||new Date(birthday)>Date.now()){
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
	            	email: email,
	            	birthday: birthday,
	            	jobDescription: jobDescription
	            }
	            var btn = $(this).find('button').button('loading');
	        	$.ajax({
	        		type: "POST",
	        		url: "/user/edit",
	        		data: data,
	        		success: function(){
	        			btn.button('reset');
	        			$el.find("#firstName").text(firstName);
			            $el.find('#lastName').text(lastName);
			            $el.find('#phoneNumber').text(phoneNumber);
			            $el.find('#email').text(email);
			            $el.find('#birthday').text(birthday);
			            $el.find('#job').text(jobDescription);
			            $el.find('.read-only').show();
						$el.find('.edit-mode').hide();
	        		},
	        		error: function(jqxhr, textStatus, thrownError){
	        			if(jqxhr.status === 403){
	        				location.reload();
	        			}
	        		}
	        	});
            }
		});
		$('.site-wrapper').append($el);
        $el.modal('toggle').on('hidden.bs.modal', function(e){
            $el.remove();
        });
	},

	renderIndex: function(data){
		module.data.pos = 'lounge';
		module.data.room = 0;

		var $el = $(module.template.loungeIndexTmpl());
		$el.append(module.chat.renderChatPanel(data.messages));		
		$('.container-idle').html($el);
	},

	renderRoom: function(data){
		$.each(data, function(key, roomdata){
			var room = new RoomItem(roomdata);
			module.data.roomList[room.id] = room;
			room.render();
		});
	},

	createRoom: function(){
		var $el = $("#roomPrompt");
		chobiUtil.inputErrorClear($el);
		var name = $el.find("input").val();
		if(!validator.looseNickName(name)){
			chobiUtil.inputError($el.find('input').parent(), 'Room name must between 3-20 characters');
		}
		else if(module.lounge.findRoomIDWithName(name)){
			chobiUtil.inputError($el.find('input').parent(), 'The name is already in use...');
  		}
  		else{
  			socket.emit('createRoomAction', JSON.stringify({name: name}));
  			$el.modal('hide');
  		}
	},

	deleteRoom: function(data){
		$.each(data, function(key, roomdata){
			var room = module.data.roomList[roomdata._id];
			if(room){
				room.destory();
				delete module.data.roomList[roomdata._id];
			}
		});
	},

	findRoomIDWithName: function(name){
		var id;
		if(name.toLowerCase() === 'lounge'){
			id = 0;
		}
		$.each(module.data.roomList, function(key, roomdata){
			if(roomdata.name.toLowerCase() === name.toLowerCase()){
				id = key;
			}
		});
		return id;
	}
};

