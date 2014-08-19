var cryptoModule = require('crypto');

var helper = {};
helper.crypto = function(salt){
	return cryptoModule.createHash('sha1').update(salt).digest('hex');
}

exports = module.exports = helper;