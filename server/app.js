
const WebSocket  = require("ws")
const utils = require("./utils")
const fs = require('fs');

"use strict"

console.log("[Server] Started Server!");
const wss = new WebSocket.Server({ port: 8080 });
var quizzes;
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
        questions:{},// question:answer pairs
        questionsYetToBeUsed:{},
        questionsWithAnswershowing:{},
        questionsWithQuestionShowing: {},
        questionsFinished:{},
        host:<reference to host's WebSocket>
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
fs.readFile('../assets/quizzes/quizzes.json', 'utf8', function readFileCallback(err, datas){
    if (err){
        console.log(err);
    } 
    else {
        quizzes = JSON.parse(datas)
        obj = JSON.parse(datas); //now it an object
    }
});

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
                console.log("User " +data.name+" joined room " + data.id);
                ws.send(JSON.stringify({
                    type:"connect",
                    status:"success"
                }))
                utils.sendPlayerInfo(ws.room);
                break;
            case "create":
                console.log("Player creating room");
                // Step 1: check if room taken
                if(rooms[data.id] != undefined) {
                    ws.send(JSON.stringify({
                        type:"create",
                        status:"fail",
                        message:"Sorry, that room is already in use!"
                    }))
                    return;
                }
                // Step 2: create room
                rooms[data.id] = {
                    players:{},//For storing players in room
                    questions:{},
                    questionsYetToBeUsed:{},
                    questionsWithAnswershowing:{},
                    questionsWithQuestionShowing: {},
                    questionsFinished:{},
                    host:ws,// this websocket is the host
                }

                // step 3: add player to room
                // see case "connect"
                rooms[data.id].players[data.name] = {ready: false,socket:ws};
                ws.room = rooms[data.id];
                ws.playerInfo = rooms[data.id].players[data.name];
                console.log("User " + data.name + " created room " + data.id);
                
                
                quizList = {};
                for (quiz in quizzes.quiz) {
                    quizList[i] = {name:quiz.quizname};
                }
                ws.send(JSON.stringify({
                    type:"create",
                    status:"success",
                    quizList:quizList
                }));

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
                //check if all players are ready
                var selectedQuiz;
                let allReady = true;
                for (let playername in rooms[data.id].players) {
                    if (!rooms[data.id].players[playername].ready) allReady = false;
                }
                if (!allReady) {    
                    ws.send(JSON.stringify({
                        type:"message",
                        message:"Sorry, not all players are ready"
                    }))
                    return;
                }
                
                //GET THE QUESTIONS !!!!!!!
                fs.readFile('../assets/quizzes/quizzes.json', 'utf8', function readFileCallback(err, datas){
                    if (err){console.log(err);} 
                    else {
                        obj = JSON.parse(datas); //now it an object
                        selectedQuiz = obj.quiz[data.selected];
                        ws.room.questionsYetToBeUsed = selectedQuiz.questions;// shallow copy
                        console.log("questions", selectedQuiz);
                        startGame(ws.room);
                    }
                });
                break;
            case "newquiz":
                let quizname = data.quizname;
                let questions = data.questions;
                
                let quiz = {
                    quizname: quizname,
                    questions: questions
                }
                console.log("New Quiz: ", quizname);
                console.log("New Quiz: ", questions);
                
                // quizzes list is updated, save it
                obj = JSON.parse(data); //now it an object
                quizzes.push(quiz); //add some data
                json = JSON.stringify(quizzes); //convert it back to json
                fs.writeFile('../assets/quizzes/quizzes.json', json, function(error) {
                    if(error) { 
                        console.log('[write auth]: ' + err);
                        if (fail) {
                            console.log('[write auth]: Fael Fale FAIL');
                        }
                        else {
                            console.log('[write auth]: success');
                        }
                    }
                });
                    
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
      if(ws.room == undefined) return;
      
      if(ws = ws.room.host){
          // if a host, delete room (AND ALL REFERENCES TO ROOM)
        for(player in ws.room.players){
            if(ws.room.players[player] != ws.playerInfo){
                ws.room.players[player].socket.send(JSON.stringify({
                    type:"close",
                    message:"Host Disconnected"
                }))
                // remove this person's references to the room and player info for the garbage collector
                delete ws.room.players[player].socket.room
                delete ws.room.players[player].socket.playerInfo
            }
        }
        // remove the reference from the "rooms" global var
        for(let roomName in rooms){
            if(rooms[roomName] == ws.room) {
                delete rooms[roomName];
                break;
            }
        }
        // remove reference from the hosts'websocket
        delete ws.room
        // OK that should clear all references now
      } else{
        // Remove the player from the players
        for(let player in ws.room.players)
            if(ws.room.players[player] == ws.playerInfo){
                delete ws.room.players[player];
                break;
            }
        // ensure any remaining references are removed
        delete ws.playerInfo;
        // send updated player list
        utils.sendPlayerInfo(ws.room);
        delete ws.room;

      }
  });
});

function startGame(room) {
    let playerCount = Object.keys(room.players).length;
    let key;
    for(let i = 0; i < playerCount * 3;i++){
        key = utils.randomObjectKey(room.questionsYetToBeUsed);
        room.questionsWithAnswershowing[key] = room.questionsYetToBeUsed[key];
        delete room.questionsYetToBeUsed[key]// it is now a question with answer showing
    }
    // choose 1 question per player to show
    for(let i = 0; i < playerCount; i++){
        key = utils.randomObjectKey(room.questionsYetToBeUsed);
        room.questionsWithQuestionShowing[key] = room.questionsYetToBeUsed[key];
        delete room.questionsYetToBeUsed[key]// it is now a question with question showing
    }
    // get all the answers, (from answersShowing and QuesitionsShowing) and shuffle them up,
    // get all the questions, and shuffle them up
    let allAnswers = Object.values(room.questionsWithAnswershowing).concat(Object.values(room.questionsWithQuestionShowing))
    allAnswers = utils.shuffleArray(allAnswers);
    let allQuestions = Object.keys(room.questionsWithQuestionShowing);
    allQuestions = utils.shuffleArray(allQuestions);
    // send copy to each client
    for(let client in room.players){
        room.players[client].socket.send(JSON.stringify(
            {
                type:"initialSetup",
                question:allQuestions.pop(),// should be string value
                answers:[allAnswers.pop(),allAnswers.pop(),allAnswers.pop(),allAnswers.pop()]// should be array of strings
            }
        ))
    }
}