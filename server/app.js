//IM NOT ON INTERNET DOING THIS SO CANT LOOK UP HOW TO DO ANYTHING...
//CREATING AND CONNECTING TO LOBBIES IS WORKING!!!!!!!!!!!!!!

//WE NEEDED CHECK IF A CLIENT DISCONNECTS, IF SO, IT SHOULD DELETE THEM, AND IF NO CLIENTS ARE IN A ROOM, DELETE THE ROOM (MAYBE AFTER CERTAIN PERIOD OF TIME)

"use strict"

console.log("[Server] Started Server!");
const WebSocket = require('ws');
const express = require('express');
const SocketSocket = require('ws').Server;

let clients = [];
const wss = new WebSocket.Server({ port: 8080 });
let rooms = {};
wss.on('connection', function connection(ws) {
  clients.push(ws);
  console.log("[Server] Client Connected!", + ws);
  ws.on('message', function incoming(jsondata) {// assuming data is always string
    try {
        let data = JSON.parse(jsondata);
        switch (data.type) {
            case "connect":
                console.log("Trying to connect to a room");
                // connect to an existing room
                if(rooms[data.id] != undefined){
                    ws.room = rooms[data.id]
                    console.log("User " + data.name + "joined room " + data.id);
                    rooms[data.id].players.push(data.name);
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
                    rooms[data.id] = {
                        players:[],//For storing the players in each room somehow
                        questions:data.questiondata,
                        questionsShowing:{},// stores the key value pairs of questions currently showing and their answers
                        answersShowing:{},// stores the key-value pairs of answers currently showing, that dont have a question showing as well!
                    }
                    rooms[data.id].players.push(data.name);
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
            default:
                break;
        }
    }
    catch {
     console.log("[Server] Error");//Data was most likely not in json format");
    }
        
  });
  ws.on("close",()=>{
  });
});

function sendPlayers (room) {
    console.log("SENDING PLAYERS TO CLIENTS NOW!");
    console.log("Number of Clients", clients.length);
    for (var i = 0; i < clients.length; i++) {
        console.log("SHOULD RUN THIS");
        clients[i].send(JSON.stringify({
            type:"playerlist",
            player:rooms[room].players
        }));
    }
    console.log("????");
}