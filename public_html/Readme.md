#Chat room documentation


##API documentation
_all the following response level is based on the response level, since all request is send by socket level._
###Socket Level Action:
**Login Page Render:**

Request: loginRender

Response: 

1. render message - [target: login/lounge] 
2. private messages(only if there is unread message)
3. room data - [type: reset, data: {room objs}]

Process:

1. Socket.isLoggedIn()
2. If not logged in, Socket.renderLogin(); If logged in, Socket.renderLounge()


**Register Page Render:**

Request: registerRender

Response: render message - [target: register/lounge]

Process:

1. Socket.isLoggedIn()
2. If not logged in, Socket.renderRegister(); If logged in, Socket.renderLounge()

**Enter Room:**

Request: joinRoomAction - [data:{from, to}]

Response: render message - [target: room, data: roomid&name]

**Leave Room:**

Request: leaveRoomAction - [roomid]

Response: render message - [target: lounge]

**Retrieve the past 10 minutes message within room:**

Request: retrievePastMessage - [roomid]

Response: chat messages - [[messages]]

**Retrieve the user profile:**:

Request: retrieveUserProfileAction

Response: render message- [target: profile, data: user]

**Create private message:**

Request: createPmAction - [username]

Response: private messages - [{username, firstName, lastName, messageArr:[msg, ctime, fromUsername, fromFirstName, fromLastName, hasRead]}]

**Admin Page Render:**

Request: adminRender - [roomid]

Response: render message - [target: systemAdmin/ target:roomAdmin, data:{id: id}]

**Retrieve all linked user data:**

Request: retrieveLinkedUserAction

Response: linked users data - successJSON:[[simple socket objs]]

**Retrieve all registered user data:**

Request: retrieveUserDataAction

Reponse: users data - successJSON:[[users objs]] 

**retrieve room linked user & admin data:**

Request: retrieveRoomLinkedUserAction - [roomid]

Response: room linked users data - [sockets:[simple socket objs], admins: [usernames]]

**retrieve chat log with room/user/date constraint:**

Request: retrieveChatLogAction - constaints
Response: chat log - [[messages]]

###Session Level Action:

**Login:**

Request: loginAction - [username, password]

Response: render message - [target: lounge], if valid

Process:

1. ioController.loginUser(username, password)
    - _findUserWithUsername(username) -> user
    - compare password
    - update session database
    - _emit "succeesfullyLoggedInUser" event - [target: session.id, user: user]_ 
 2. welcomeSession(res)
     - retrieve session socket list
     - iterate over session socket list
     - _welcomeUser(socket, user)
         - socket.setSocketUser(user)
             - set socket username, permission
             - add socket to user room: /private/user/[username]
             - joinLounge(renderLounge(), /chatRoom/0)
         - socket.welcomeUser(user) 
 
**Register:**

Request: registerAction - [username, password]

Response: render message - [target: lounge], if valid

Process:

1. ioController.createUser(username, password)
    - _findUserWithUsername(username) -> no user
    - create user
 2. ioController: loginUser(username, password)

 **Logout:**
 
Request: logoutAction

Response: render message - [target: login]

Process: 

1. ioController.logoutUser(session)
    	- update session database
	-  _emit "succeesfullyLoggedOutUser" event - [target: session.id]_
2. renderLoginSession(res)
     - retrieve session socket list
     - iterate over session socket list
     - _seeyouUser(socket)
         - socket.seeyouUser(user)
         - socket.removeSocketUser
             - delete socket username, permission
             - leave socket to user room: /private/user/[username]
             - leave current room **HOWTO**
     - _renderLogin(socket) 

###User Level Action:

**Edit system admin:**

Request: editPermissionAction - [username, permission]

Response: No

**Delete registered user:**

Request: deleteUserAction - [username]

Response: render message - [target: register]

**System boot user:**

Request: systemBootAction - [username]

Response: render message - [target: bootedPage]

**Send private message:**

Request: sendPmAction - [toUsername, msg]

Response: private messages - [{username, firstName, lastName, messageArr:[msg, ctime, fromUsername, fromFirstName, fromLastName, hasRead]}]
	
**Read private message:**

Request: readPmAction - [fromUsername]

Response: No

 
###Room Level Action:

**Chat:**

Request: chatAction - [msg, roomid]

Response: chat messages - [[msg]]

**Create Room:**

Request: createRoomAction - [name]

Response: room data - [type: add, data: {room obj}]

**Destory Room:**

Request: destoryRoomAction - [id]

Response: room data - [type: delete, data: {room obj}]

**Edit room admin:**

Request: editRoomAdminAction - [id, username, permission]

Reponse: No

**Room boot user:**

Request: roomBootAction - [id, username]

Response: render message - [target: lounge]


###Server initalization:
1. Mongo database connection. _(Robustness: iterate until successfully connected)_
2. After successfully connected to Mongo database, **serverInitialization()**, which do the followings app initialization:
     
     - Initialize the **sessiondb** instance for session management
     - Initialize middleware function **cookieParserFunction** and **sessionParserFunction** 
     - Initialize  **express** with proper **route**, **middleware**
     - Initialize **http** server for forwarding all request to https server
     - Initialize **https** server with express
     - Initialize **io** for socket io connection with proper **middleware**, **eventListeners**, **roomStructure**
3. Start listening, http for port 80 and https for port 443.




###Service Test list
1.  User is able to login/logout/register with multiple tabs
2.  User is able to perserve proper login/logout status
3.  User is able to create a room and the information should be announced with all users at lounge, no duplicate name for active room
4.  User is able to enter/leave the room and lounge
5.  User is able to chat with each other in lounge and room, the traffic won't interrupt each other
6.  When enter a room/lounge, show past 10 minutes messages
7.  User is able to view profile
8.  Admin is able to view the content of the admin page
9.  Admin is able to boot user
    - Boot one user
    - Boot one user with multiple socket but same session
    - Boot one user with multiple session, and of course sockets
10. Admin is able to change the permission of user(Not realtime but after refresh/reload)
11. Admin is able to delete user
    - Delete one user
    - Delete one user with multiple socket but same session
    - Delete one user with multiple session, and of course sockets
12. Room admin/system admin is able to view the content of the room admin page
13. Room admin/system admin can set others as room admin
14.  Room admin/system admin is able to boot people to lounge
15.  Room admin/system admin is able to delete a room
16.  System admin is able to retrieve chat traffic for active room and filter with username, room, start and end date
17.  User is able to send PM between each other
18.  Unread PM will pop out when user login

