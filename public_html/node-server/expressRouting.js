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
				                res.end();
		                    }
		                });
		            }
		        }); 
            }
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
								                //this is socket-level info
								                //throw new DatabaseError();
								                //redo the work
								            }
								            else{
								           		res.status(200);
					    						res.json(responseJson.success(_.pick(user, 'avatar')));
					    						res.end();     
								            }
								        });
	    							}, function(err){
	    								//this is socket-level info
						                //throw new DatabaseError();
						                //redo the work
	    							}
	    						);
	    					}
	    				});
	    			});
	    		});
	    	});
    	}
    	else{
    		//user is not logged in
    	}
    }); 
}