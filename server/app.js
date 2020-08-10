//IM NOT ON INTERNET DOING THIS SO CANT LOOK UP HOW TO DO ANYTHING...
//CREATING AND CONNECTING TO LOBBIES IS WORKING!!!!!!!!!!!!!!

//WE NEEDED CHECK IF A CLIENT DISCONNECTS, IF SO, IT SHOULD DELETE THEM, AND IF NO CLIENTS ARE IN A ROOM, DELETE THE ROOM (MAYBE AFTER CERTAIN PERIOD OF TIME)

"use strict"

console.log("[Server] Started Server!");
const WebSocket = require('ws');
const express = require('express');
const SocketSocket = require('ws').Server;

let hostID = "";
let clients = [];
const wss = new WebSocket.Server({ port: 8080 });
let rooms = {};

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wss.on('connection', function connection(ws) {
  clients.push(ws);
  ws.id = wss.getUniqueID();
  ws.send(JSON.stringify({
    type:"clientid",
    id:ws.id
  }))
  ws.on('message', function incoming(jsondata) {// assuming data is always string
    console.log("[Server] Client Connected!", + ws.id);
    
    try {
        let data = JSON.parse(jsondata);
        switch (data.type) {
            case "connect":
                console.log("Trying to connect to a room");
                // connect to an existing room
                for (var i = 0; i < rooms[data.id].players.length; i++) {
                    console.log("Data.name: " + data.name);
                    console.log("COMPARED TO: " + rooms[data.id].players[i][0]);
                    if (data.name == rooms[data.id].players[i][0]) {
                        console.log("Player exists");
                        ws.send(JSON.stringify({
                            type:"connect",
                            status:"fail",
                            message:"Sorry this name is taken"
                        }))
                        break;
                    }
                }
                if(rooms[data.id] != undefined){
                    ws.room = rooms[data.id];
                    rooms[data.id].players.push([data.name, ws.id, false]);
                    console.log("User " + data.name + "joined room " + data.id + ", Number of clients in lobby: " + rooms[data.id].players.length);
                    sendPlayers(data.id);
                    ws.send(JSON.stringify({
                        type:"connect",
                        status:"success",
                    }))
                } else{
                    ws.send(JSON.stringify({
                        type:"connect",
                        status:"fail"
                    }))
                }
                break;
            case "create":
                console.log("Trying to create a room");
                // creating a room if room id not taken
                if(rooms[data.id] == undefined){
                    hostID = ws.id;
                    rooms[data.id] = {
                        players:[],//For storing the players in each room somehow
                        activePlayers:[],
                        questions:data.questiondata,
                        questionsShowing:{},// stores the key value pairs of questions currently showing and their answers
                        answersShowing:{},// stores the key-value pairs of answers currently showing, that dont have a question showing as well!
                    }
                    rooms[data.id].players.push([data.name, ws.id, false]);
                    ws.room = rooms[data.id];
                    sendPlayers(data.id);
                    console.log("User " +data.name+" joined room " + data.id );
                    ws.send(JSON.stringify({
                        type:"connect",
                        status:"success"
                    }))
                } else{
                    ws.send(JSON.stringify({
                        type:"create",
                        status:"fail"
                    }))
                }
                break;
            case "ready":
                console.log("Some player wants to be ready");
                for (var i = 0; i < rooms[data.id].players.length; i++) {
                    if (data.clientid == rooms[data.id].players[i][1]) {
                        rooms[data.id].players[i][2] = true;
                        sendPlayers(data.id);
                    }
                }
                break;
            case "unready":
                console.log("Some player wants to be unready");
                for (var i = 0; i < rooms[data.id].players.length; i++) {
                    if (data.clientid == rooms[data.id].players[i][1]) {
                        rooms[data.id].players[i][2] = false;
                        sendPlayers(data.id);
                    }
                }
            default:
                break;
        }
    }
    catch (ex) {
     console.log("[Server] Error" + ex);//Data was most likely not in json format");
    }
        
  });
  ws.on("close",()=>{
  });
});

function sendPlayers (room) {
    for (var i = 0; i < clients.length; i++) {
        clients[i].send(JSON.stringify({
            type:"playerlist",
            player:rooms[room].players
        }));
    }
}