#Chat room documentation


##API documentation
_all the following response level is based on the response level, since all request is send by socket level._
###Socket Level Action:
**Login Page Render:**

Request: loginRender

Response: render message - [target: login/lounge] 

Process:

1. Socket.isLoggedIn()
2. If not logged in, Socket.renderLogin(); If logged in, Socket.renderLounge()


**Register Page Render:**

Request: registerRender

Response: render message - [target: register/lounge]

Process:

1. Socket.isLoggedIn()
2. If not logged in, Socket.renderRegister(); If logged in, Socket.renderLounge()

**Load Room List:**

Request: retrieveRoomListAction

Response: room data - [type: reset, data: {room objs}]

**Enter Room:**

Request: joinRoomAction - [roomid]

Response: render message - [target: room, data: roomid&name]

**Leave Room:**

Request: leaveRoomAction - [roomid]

Response: render message - [target: lounge]

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

**Edit room admin:**

Request: editRoomAdminAction - [id, username, permission]

Reponse: No

**Room boot user:**

Request: roomBootAction - [id, username]

Response: render message - [target: lounge]

 
###Room Level Action:

**Chat:**

Request: chatAction - [msg, roomid]

Response: chat message - [msg]

**Create Room:**

Request: createRoomAction - [name]

Response: room data - [type: add, data: {room obj}]

**Destory Room:**

Request: destoryRoomAction - [id]

Response: room data - [type: delete, data: {room obj}]




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
3.  User is able to chat with each other
4.  Admin is able to view the content of the admin page
5.  Admin is able to go back and foreth between admin and chat page
6.  Admin is able to boot user
    - Boot one user
    - Boot one user with multiple socket but same session
    - Boot one user with multiple session, and of course sockets
7. Admin is able to change the permission of user
    - Change one user
    - Change one user with multiple socket but same session
    - Change one user with multiple session, and of course sockets
8. Admin is able to delete user
    - Delete one user
    - Delete one user with multiple socket but same session
    - Delete one user with multiple session, and of course sockets


