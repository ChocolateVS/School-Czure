//DONT KNOW IF IT WOULD BE A GOOD WAY TO DO IT BUT I MADE A quizzes.json file which could just be an object called quizzes that we can add to 

const WebSocket  = require("ws")
const utils = require("./utils")
const fs = require('fs');
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
                // Step 2: create room
                rooms[data.id] = {
                    players:{},//For storing players in room
                    questions:data.questions,
                    questionsYetToBeUsed,
                    questionsWithAnswershowing,
                    questionsWithQuestionShowing,
                    questionsFinished,
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
                //check if all players are ready
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
                ///////////////////////////
                // start game stuff
                //////////////////////////
                ws.room.questionsYetToBeUsed = {...ws.room.questions}// shallow copy
                // choose 3 "answers" to be displayed on screen per player
                // fourth will be chosen later, those are the ones with a question showing too
                let playerCount = Object.keys(players).length();
                let key;
                for(let i = 0; i < playerCount * 3;i++){
                    key = utils.randomObjectKey(ws.room.questionsYetToBeUsed);
                    ws.room.questionsWithAnswershowing[key] = ws.room.questionsYetToBeUsed[key];
                    delete ws.room.questionsYetToBeUsed[key]// it is now a question with answer showing
                }
                // choose 1 question per player to show
                for(let i = 0; i < playerCount; i++){
                    key = utils.randomObjectKey(ws.room.questionsYetToBeUsed);
                    ws.room.questionsWithQuestionShowing[key] = ws.room.questionsYetToBeUsed[key];
                    delete ws.room.questionsYetToBeUsed[key]// it is now a question with question showing
                }
                // get all the answers, (from answersShowing and QuesitionsShowing) and shuffle them up,
                // get all the questions, and shuffle them up
                let allAnswers = Object.values(ws.room.questionsWithAnswershowing).concat(Object.values(ws.room.questionsWithQuestionShowing))
                allAnswers = utils.shuffleArray(allAnswers);
                let allQuestions = Object.keys(ws.room.questionsWithQuestionShowing);
                allQuestions = utils.shuffleArray(allQuestions);
                // send copy to each client
                for(let client in ws.rooms.players){
                    ws.rooms.players[client].socket.send(JSON.stringify(
                        {
                            type:"initialSetup",
                            question:allQuestions.pop(),// should be string value
                            answers:[allAnswers.pop(),allAnswers.pop(),allAnswers.pop(),allAnswers.pop()]// should be array of strings
                        }
                    ))
                }
                // AND THE GAME BEGINS!
                break;
            case "":

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
                fs.readFile('../assets/quizzes/quizzes.json', 'utf8', function readFileCallback(err, data){
                    if (err){
                        console.log(err);
                    } 
                    else {
                        obj = JSON.parse(data); //now it an object
                        obj.quiz.push(quiz); //add some data
                        json = JSON.stringify(obj); //convert it back to json
                        console.log("JSON: " + json)
                        fs.writeFile('../assets/quizzes/quizzes.json', json, function(error) {
                            if(error) { 
                              console.log('[write auth]: ' + err);
                                if (fail) {
                                    console.log('[write auth]: success');
                                }
                                else {
                                  console.log('[write auth]: success');
                                }
                            }
                        });
                    }});
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

function hi() {
    
}