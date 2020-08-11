const WebSocket  = require("ws")
const utils = require("./utils")
//IM NOT ON INTERNET DOING THIS SO CANT LOOK UP HOW TO DO ANYTHING...
//CREATING AND CONNECTING TO LOBBIES IS WORKING!!!!!!!!!!!!!!

//WE NEEDED CHECK IF A CLIENT DISCONNECTS, IF SO, IT SHOULD DELETE THEM, AND IF NO CLIENTS ARE IN A ROOM, DELETE THE ROOM (MAYBE AFTER CERTAIN PERIOD OF TIME)

"use strict"

console.log("[Server] Started Server!");
const wss = new WebSocket.Server({ port: 8080 });
let rooms = {};
/*
ROOMS DATA FORMAT:
{
    myRoom:{
        players:{
            ben:{
                ready:true,
                socket:<WebSocket object>
            },
            ... more people
        },
        questions:{
            TODO
        }
        questionsShowing:{
            TODO
        }
        answersShowing:{
            TODO
        }
    },
    SomeoneElsesRoom:{...},
    ...
}
WebSocket Object:
{
    ... all the normal websocket stuff, plus (hopefully if they connected first):
    room:<Reference to one of the rooms in <rooms> global var>
    playerInfo:<Reference to one of the players in one of the rooms>


}
*/


wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(jsondata) {// assuming data is always string

    try {
        let data = JSON.parse(utils.escapeHtml(jsondata));
        switch (data.type) {
            case "connect":
                // connect to an existing room!

                // Step A: Validation
                // ensure valid room
                if(rooms[data.id] == undefined){
                    ws.send(JSON.stringify({
                        type:"connect",
                        status:"fail",
                        message:"Sorry, that room doesn't exist"
                    }))
                    return;
                }
                // ensure name not taken
                if(rooms[data.id].players[data.name] != undefined){
                    ws.send(JSON.stringify({
                        type:"connect",
                        status:"fail",
                        message:"Sorry that name is taken"
                    }))
                    return;
                }
                //Step B: Join player into room
                rooms[data.id].players[data.name] = {ready: false,socket:ws};
                ws.room = rooms[data.id];
                ws.playerInfo = rooms[data.id].players[data.name];
                console.log("User " +data.name+" joined room " + data.id );
                ws.send(JSON.stringify({
                    type:"connect",
                    status:"success"
                }))
                utils.sendPlayerInfo(ws.room);
                break;
            case "create":
                console.log("Player creating room");
                // Step 1: check if room taken
                if(rooms[data.id] != undefined){
                    console.log("HIIIII");
                    ws.send(JSON.stringify({
                        type:"create",
                        status:"fail",
                        message:"Sorry, that room is already in use!"
                    }))
                    return;
                }
                // Step 2: Question object
                // Step 3:create room
                rooms[data.id] = {
                    players:{},//For storing players in room
                    questions:data.questions,
                    questionsShowing:{},// stores the key value pairs of questions currently showing and their answers
                    answersShowing:{},// stores the key-value pairs of answers currently showing, that dont have a question showing as well!
                }

                // step 3: add player to room
                // see case "connect"
                rooms[data.id].players[data.name] = {ready: false,socket:ws};
                ws.room = rooms[data.id];
                ws.playerInfo = rooms[data.id].players[data.name];
                console.log("User " + data.name + " joined room " + data.id );
                ws.send(JSON.stringify({
                    type:"connect",
                    status:"success"
                }))
                utils.sendPlayerInfo(ws.room);
                break;
            case "ready":
                //Some player wants to be ready
                ws.playerInfo.ready = true;
                utils.sendPlayerInfo(ws.room)
                break;
            case "unready":
                // some player wants to be unready
                ws.playerInfo.ready = false;
                utils.sendPlayerInfo(ws.room)
                break;
            case "startGame":
                //I ACTUALLY GOT THIS TO WORK SOMEHOW LOL, YOU PROBS KNOW A BETTER WAY :-)
                let allReady = true;
                for (let playername in rooms[data.id].players) {
                    console.log(playername + " ready status is " + rooms[data.id].players[playername].ready);
                    if (!rooms[data.id].players[playername].ready) {
                        allReady = false;
                    }
                }
                if (!allReady) {
                    ws.send(JSON.stringify({
                        type:"message",
                        message:"Sorry, not all players are ready"
                    }))
                    return;
                }
                break;
            default:
                break;
        }
    }
    catch (ex) {
     console.log("[Server] Error" + ex);//Data was most likely not in json format;
    }

  });
  ws.on("close",()=>{
  });
});
