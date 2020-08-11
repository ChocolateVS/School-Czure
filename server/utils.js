// utility functions for the app
//////////////////////////
// WS/Room related
//////////////////////////
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
    var myjson = JSON.stringify({
        type:"playerlist",
        players:playerlist
    })
    
    for(let player in room.players){
        room.players[player].socket.send(myjson)
    }
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

