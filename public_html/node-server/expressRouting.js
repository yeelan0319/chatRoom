var express = require("express");
var formidable = require('formidable');
var easyimage = require('easyimage');
var fs = require('fs');
var _ = require('underscore');
var responseJson = require('./responseJson');
var AVATARPATH = "https://10.100.11.111/avatar/";

module.exports = function(app){
    app.express.use(app.middleware.cookieParserFunction);
    app.express.use(app.middleware.sessionParserFunction);
    app.express.use(express.static(__dirname + '/../public'));

    //routing
    app.express.get('/sessionExtension', function(req, res){
        res.status(200);
        res.json(responseJson.success());
        res.end();
    });

    app.express.post('/upload/avatar', function(req, res){
    	var username = req.session.username;
    	if(username){
    		console.log('receive upload req');
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
	    								app.db.collection('users').findAndModify({username:username}, [['_id','asc']], {$set:{avatar:AVATARPATH+file_name}}, {new:true}, function(err, user){
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