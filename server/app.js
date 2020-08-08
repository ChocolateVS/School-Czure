"use strict"
const WebSocket = require('ws');
const express = require('express');
const SocketSocket = require('ws').Server;

const wss = new WebSocket.Server({ port: 8080 });
let rooms = {};
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(jsondata) {// assuming data is always string
    data = JSON.parse(jsondata);
    switch (data.type) {
        case "connect":
            // connect to an existing room
            if(rooms[data.id] != undefined){
                ws.room = rooms[data.id]
                console.log("User " +data.name+"joined room " + data.id );
                ws.send(JSON.stringify({
                    type:"connect",
                    status:"success"
                }))
            } else{
                ws.send(JSON.stringify({
                    type:"connect",
                    status:"fail"
                }))
            }
            break;
        case "create":
            // creating a room if room id not taken
            if(rooms[data.id] == undefined){
                rooms[data.id] = {
                    questions:data.questiondata,
                    questionsShowing:{},// stores the key value pairs of questions currently showing and their answers
                    answersShowing:{},// stores the key-value pairs of answers currently showing, that dont have a question showing as well!
                }
                ws.room = rooms[data.id]
                console.log("User " +data.name+"joined room " + data.id );
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
  });
  ws.on("close",()=>{
  })
});
