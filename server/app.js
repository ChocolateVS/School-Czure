//IM NOT ON INTERNET DOING THIS SO CANT LOOK UP HOW TO DO ANYTHING...
//CREATING AND CONNECTING TO LOBBIES IS WORKING!!!!!!!!!!!!!!

//WE NEED AN ARRAY OR SOMETHING TO STORE ALL THE PLAYERS FOR EACH ROOM, COULD BE PART OF THE rooms VARIABLE
//WHEN PLAYER JOINS ROOM SERVER SEND MESSAGE TO ALL CLIENTS WITH THE PLAYERS SO I CAN UPDATE THE ROOMS WITH WHAT PLAYERS ARE IN THEM
//ALSO HOW DO WE DISTINGUISH CLIENTS???? can you see like client ip's or something????????
//WE NEEDED CHECK IF A CLIENT DISCONNECTS, IF SO, IT SHOULD DELETE THEM, AND IF NO CLIENTS ARE IN A ROOM, DELETE THE ROOM (MAYBE AFTER CERTAIN PERIOD OF TIME)

"use strict"

console.log("[Server] Started Server!");
const WebSocket = require('ws');
const express = require('express');
const SocketSocket = require('ws').Server;

const wss = new WebSocket.Server({ port: 8080 });
let rooms = {};
wss.on('connection', function connection(ws) {
  console.log("[Server] Client Connected!");
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
                    console.log(rooms);
                    //rooms[data.id].players. //push(data.name); whats the equivalent to add a player there?
                    ws.send(JSON.stringify({
                        type:"connect",
                        status:"success",
                        //players: rooms[data.id].players
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
                        //players:{},//data.name}, //Stores the players in the room somehow
                        questions:data.questiondata,
                        questionsShowing:{},// stores the key value pairs of questions currently showing and their answers
                        answersShowing:{},// stores the key-value pairs of answers currently showing, that dont have a question showing as well!
                    }
                    ws.room = rooms[data.id]
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
     console.log("[Server] Error");//Data was not in json format");
    }
        
  });
  ws.on("close",()=>{
  });
});
