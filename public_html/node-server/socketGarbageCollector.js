var socketGarbageTimer;
var DAY = 1000 * 60 * 60 * 24;  //millisecond in a day
var interval = DAY; //running per day

function start(socketList){
    console.log('socket garbage daemon started');
    if(socketGarbageTimer){
        stop();
    }
    socketGarbageTimer = setInterval(function(){
       for(var socketID in socketList){
            if(socketList.hasOwnProperty(socketID)){
                var targetSocket = socketList[socketID];
                console.log(targetSocket.request.session.cookie.maxAge);
                if(targetSocket.request.session.cookie.maxAge < 0){
                    targetSocket.renderBoot(targetSocket);
                    targetSocket.disconnect();
                    //need to find if express session deal with session storage already
                }
            }
        } 
    }, interval);
}

function stop(){
    clearInterval(socketGarbageTimer);
}

exports.start = start;
exports.stop = stop;
