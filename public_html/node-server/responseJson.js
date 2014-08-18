responseJson = {};
responseJson.success = function(data){
	return JSON.stringify({meta: {status: 200, msg: "OK"}, data: data});
}

responseJson.badData = function(){
	return JSON.stringify({meta: {status: 400, msg: "Bad Request"}, data: {}});
}

responseJson.wrongCredentials = function(){
	return JSON.stringify({meta: {status: 401, msg: "The credentials provided did not match the record in the database"}, data: {}});		
}

responseJson.userExist = function(){
	return JSON.stringify({meta: {status: 409, msg: "User already exist"}, data: {}});	
}

responseJson.userNotLoggedIn = function(){
	return JSON.stringify({meta: {status: 403, msg: "Please login to proceed"}, data: {}});
}

responseJson.notAuthorized = function(){
	return JSON.stringify({meta: {status: 403, msg: "You are not authorized for this activity"}, data:{}});
}
exports = module.exports = responseJson;