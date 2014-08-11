responseJson = {};
responseJson.success = function(data){
	return JSON.stringify({meta: {status: 200, msg: "OK"}, data: data});
}

responseJson.badData = function(){
	return JSON.stringify({meta: {status: 400, msg: "Bad Request"}, data: {}});
}

exports = module.exports = responseJson;