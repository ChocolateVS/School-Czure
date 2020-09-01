// utility functions for the app
//////////////////////////
// WS/Room related
//////////////////////////
exports.broadcast = (message,room) =>{
    for(let player in room.players){
        room.players[player].socket.send(message)
    }
}
exports.sendPlayerInfo =  (room)=> {
    var playerlist = [];
    // have to turn it into an array instead of object fto get rid of reference to WebSocket in players object
    // (see data formats at top)
    for(let playername in room.players){
        playerlist.push({
            name:playername,
            ready:room.players[playername].ready
        })
    }
    exports.broadcast(JSON.stringify({
        type:"playerlist",
        players:playerlist
    }))
}

exports.addQuestionTimeout = (ws,fn,milliseconds) =>{
    ws.playerInfo.timeout = setTimeout(fn.bind(ws),milliseconds);
}
exports.clearQuestionTimeout = (ws) =>{
    if(ws.playerInfo.timeout == undefined) return;
    clearTimeout(ws.playerInfo.timeout)
    ws.playerInfo.timeout = undefined;
} 


/////////////////////////
// General
/////////////////////////

exports.escapeHtml = (text)=> {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        //'"': '&quot;',
        //"'": '&#039;'
    };
    
    return text.replace(/[&<>]/g, function(m) { return map[m]; });
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
exports.shuffleArray = (array) => {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

// returns random key or undefined if nothing in object
exports.randomObjectKey = function (obj) {
    var keys = Object.keys(obj);
    return keys[ keys.length * Math.random() << 0];
};

// move object property from one object to another
exports.moveProperty = function (key, source,destination){
    destination[key] = source[key]
    delete source[key]
}