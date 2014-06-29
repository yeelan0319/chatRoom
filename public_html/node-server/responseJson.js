function success(data){
	return JSON.stringify({meta: {status: 200, msg: "OK"}, data: data});
}

exports.success = success;