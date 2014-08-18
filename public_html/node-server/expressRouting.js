var express = require("express");
var bodyParser = require('body-parser');
var formidable = require('formidable');
var easyimage = require('easyimage');
var fs = require('fs');
var _ = require('underscore');
var crypto = require('crypto');
var responseJson = require('./responseJson');
var validator = require('../public/validator');
var DEFAULTAVATAR = '/avatar/defaultAvatar.png';

module.exports = function(app){
    app.express.use(app.middleware.cookieParserFunction);
    app.express.use(app.middleware.sessionParserFunction);
    app.express.use(bodyParser.json());
    app.express.use(bodyParser.urlencoded());
    app.express.use(express.static(__dirname + '/../public'));

    //routing
    app.express.get('/sessionExtension', function(req, res){
        res.status(200);
        res.json(responseJson.success());
        res.end();
    });

   	app.express.post('/login', function(req, res){
   		if(!req.session.username){
   			var username = req.body.username;
   			var password = req.body.password;
   			var sessionID = req.sessionID;
   			var session = req.session;
   			if(!validator.nickName(username)||!validator.password(password)){
                res.status(400);
                res.json(responseJson.badData());
                res.end();
            }
            else{
                app.db.collection('users').findOne({'username': username}, function(err, user){
		            if(err){
		                res.status(500);
		                //redo the work
		                res.end();
		            }
		            else{
		            	if(user && user.password === crypto.createHash('sha1').update(password).digest('hex')){
			                session.username = user.username;
			                session.save();

			                var result = {
			                    user: user,
			                    target: sessionID
			                };
			                app.ioController.emit('successfullyLoggedInUser', result);
			                res.status(200);
			                res.json(responseJson.success());
			                res.end();
			            }
			            else{
			                res.status(401);
			                res.json(responseJson.wrongCredentials());
			                res.end();
			            }
		            }
		        }); 
            }
   		}
   		else{
   			res.status(400);
            res.json(responseJson.badData());
            res.end();
   		}
   	});

	app.express.post('/register', function(req, res){
		if(!req.session.username){
   			var username = req.body.username;
   			var password = req.body.password;
   			var email = req.body.email;
   			var sessionID = req.sessionID;
   			var session = req.session;
   			if(!validator.nickName(username)||!validator.password(password)||!validator.email(email)){
                res.status(400);
                res.json(responseJson.badData());
                res.end();
            }
            else{
                app.db.collection('users').findOne({'username': username}, function(err, user){
		            if(err){
		                res.status(500);
		                //redo the work
		                res.end();
		            }
		            else if(user){
		            	res.status(409);
		                res.json(responseJson.userExist());
		                res.end();
		            }
		            else{
		            	var user = {
		                    'username': username, 
		                    'password': crypto.createHash('sha1').update(password).digest('hex'), 
		                    'email': email,
		                    'avatar': DEFAULTAVATAR,
		                    'permission':0,
		                    'prompts':{
		                        'needUserInfo': true
		                    }
		                };
		                app.db.collection('users').insert(user, {w:1}, function(err, result) {
		                    if(err){
		                        res.status(500);
				                //redo the work
				                res.end();
		                    }
		                    else{
		                        session.username = user.username;
				                session.save();

				                var result = {
				                    user: user,
				                    target: sessionID
				                };
				                app.ioController.emit('successfullyLoggedInUser', result);
				                res.status(200);
				                res.json(responseJson.success());
				                res.end();
		                    }
		                });
		            }
		        }); 
            }
   		}
   		else{
   			res.status(400);
            res.json(responseJson.badData());
            res.end();
   		}
	});

    app.express.post('/upload/avatar', function(req, res){
    	var username = req.session.username;
    	if(username){
    		var form = new formidable.IncomingForm();
	    	form.parse(req, function(err, fields, files){
	    		var old_path = files.file.path,
	    			file_size = files.file.size,
	    			file_ext = files.file.name.split('.').pop(),
	    			file_name = username + Date.now() + '.' + file_ext,
	    			new_path = process.env.PWD + '/../public/avatar/' + file_name;

	    		fs.readFile(old_path, function(err, data){
	    			fs.writeFile(new_path, data, function(err){
	    				fs.unlink(old_path, function(err){
	    					if(err){
	    						res.status(500);
	    						//failed to upload
	    						res.end();
	    					}
	    					else{
	    						easyimage.thumbnail({
	    							src: new_path,
	    							dst: new_path,
	    							width: 230
	    						}).then(
	    							function(file){
	    								app.db.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:{avatar:'/avatar/'+file_name}}, {new:true}, function(err, user){
								            if(err){
								                res.status(500);
								                //redo the work
								                res.end();
								            }
								            else{
								           		res.status(200);
					    						res.json(responseJson.success(_.pick(user, 'avatar')));
					    						res.end();     
								            }
								        });
	    							}, function(err){
	    								res.status(500);
						                //redo the work
						                res.end();
	    							}
	    						);
	    					}
	    				});
	    			});
	    		});
	    	});
    	}
    	else{
    		res.status(403);
            res.json(responseJson.userNotLoggedIn());
            res.end();
    	}
    });

    app.express.post('/user/edit', function(req, res){
    	var username = req.session.username;
    	if(username){
            var firstNameFlag = typeof req.body.firstName === 'undefined'? true : validator.personName(req.body.firstName);
            var lastNameFlag = typeof req.body.lastName === 'undefined'? true : validator.personName(req.body.lastName);
            var emailFlag = typeof req.body.email === 'undefined'? true : validator.email(req.body.email);
            var phoneNumberFlag = typeof req.body.phoneNumber === 'undefined'? true : validator.phoneNumber(req.body.phoneNumber);
            var birthdayFlag = typeof req.body.birthday === 'undefined'? true : validator.date(req.body.birthday);
            var jobDescriptionFlag = typeof req.body.jobDescription === 'undefined'? true : validator.textMaxLength(req.body.jobDescription);
            if(!firstNameFlag||!lastNameFlag||!phoneNumberFlag||!birthdayFlag||!jobDescriptionFlag||!emailFlag){
                socket.emit('system warning', responseJson.badData());
            }
            else{
                req.body = _.pick(req.body, 'firstName', 'lastName', 'phoneNumber', 'birthday', 'jobDescription', 'email');
		        if(req.body.phoneNumber){
		            req.body.phoneNumber = req.body.phoneNumber.replace(/[/(/)-\s]/g,'');
		        }
		        req.body.prompts = {};
		        req.body.prompts.needUserInfo = false;
		        app.db.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:req.body}, {}, function(err, user){
		            if(err){
		                res.status(500);
		                //redo the work
		                res.end();
		            }
		            else{
		                if(user.prompts.needUserInfo){
		                    var result = {
		                        user: user,
		                        target: username
		                    };
		                    app.ioController.emit('successfullyCompleteUserInfo', result);
		                }
		                res.status(200);
			            res.json(responseJson.success());
			            res.end();
		            }
		        });
            }
    	}
    	else{
    		res.status(403);
            res.json(responseJson.userNotLoggedIn());
            res.end();
    	}
    });
}