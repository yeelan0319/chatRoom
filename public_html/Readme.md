#Chat room documentation

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