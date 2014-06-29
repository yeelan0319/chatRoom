var exceptions = require('./exceptions');

//naive data validator
module.exports = function validateData(data){
    if(typeof(data) === 'undefined' || typeof(data.username) === 'undefined' || typeof(data.password) === 'undefined'){
        throw new InvalidRequestError();
    }
}


//json status render
var DatabaseError = function(){
    this.JSON = JSON.stringify({meta: {status: 500, msg: "database failure"}, data:{}});
}
var InvalidRequestError = function(){
    this.JSON = JSON.stringify({meta: {status: 500, msg: "bad request"}, data:{}});
}

var WrongPasswordError = function(){
    this.JSON = JSON.stringify({meta: {status: 403, msg: "login failed, please check your password"}, data:{}});
}

var ExistingUserError = function(){
    this.JSON = JSON.stringify({meta: {status: 409, msg: "existing user. please log in"}, data:{}});
}

var SuccessJson = function(data){
    return JSON.stringify({meta: {status: 200, msg: "OK"}, data: data});
}

var validator = function(){
	this.validUsername = function(data.username){}
}