var validator = validator || {};
var PASS = true;
var FAIL = false;

validator.nickName = function(input){
	//username must be consist of a-z, A-Z, 0-9 and underscore, length between 6-20
	var nickNameRegex = /^[\w]{6,20}$/;
	return nickNameRegex.test(input)? PASS : FAIL;
}

validator.looseNickName = function(input){
	var nickNameRegex = /^.{3,20}$/
	return nickNameRegex.test(input)? PASS : FAIL;
}

validator.password = function(input){
	//password must have a length between 6-20 characters
	if(input.length < 6 || input.length > 20){
		return FAIL;
	}
	//password must be a combination of letter and number and special characters
	var passwordRegex = /^[\da-zA-Z]*\d+[a-zA-Z]+[\da-zA-Z]*|[\da-zA-Z]*[a-zA-Z]+\d+[\da-zA-Z]*$/;
	return passwordRegex.test(input)? PASS : FAIL;
}

validator.email = function(input){
	//email format will be fine
	var emailRegex = /^[\w.]+(\+[\w.]+)?@\w+(.\w+){1,2}$/;
	return emailRegex.test(input)? PASS : FAIL;
}

validator.personName = function(input){
	//name must be A-Z and a-z without number or other letters
	var personNameRegex = /^[a-zA-Z]+$/;
	return personNameRegex.test(input)? PASS : FAIL;
}

validator.phoneNumber = function(input){
	//only support US phone number
	//XXX-XXX-XXXX, (XXX)XXX-XXXX, XXXXXXXXXX
	var phoneNumberRegex = /^\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/;
	return phoneNumberRegex.test(input)? PASS : FAIL;
}

validator.date = function(input){
	var dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
	if(!dateRegex.test(input)){
		return FAIL;
	}
	else{
		return new Date(input) === 'Invalid Date'? FAIL : PASS;
	}
}

validator.textMaxLength = function(input){
	//the max length of a text must be less than 63354 characters??
	return input.length < 63354? PASS : FAIL;
}

validator.permission = function(input){
	if(input!==1&&input!==0){
		return FAIL;
	}
	else{
		return PASS;
	}
}

if(typeof exports !== 'undefined'){
	if(typeof module !== 'undefined' && module.exports){
		exports = module.exports = validator;
	}
}