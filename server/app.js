
const WebSocket  = require("ws")
const utils = require("./utils")
const fs = require('fs');

"use strict"

console.log("[Server] Started Server!");
const wss = new WebSocket.Server({ port: 8080 });
var quizzes;
let rooms = {};

fs.readFile('../assets/quizzes/quizzes.json', 'utf8', function readFileCallback(err, datas){
    if (err){
        if(err.errno = -2){
            quizzes = {};// likely 404 file not found
            // JK 404 is a HTTP thing, but you get the idea
            console.log("Quizes.json not found, assuming no quizzes")
        } else {
            console.log(err);
        }
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
                    questionsWithAnswerShowing:{},
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
                
                ws.send(JSON.stringify({
                    type:"create",
                    status:"success",
                    quizList:Object.keys(quizzes)
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
                var selectedQuiz = quizzes[data.selected]
                if(selectedQuiz == undefined) console.error("Tried to get quiz " + data.selected + " but not found")
                // check if everyone is ready
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
                ws.room.questionsYetToBeUsed = {...selectedQuiz};// shallow copy, i.e new object referencing the same sub objects
                console.log("questions", selectedQuiz);
                startGame(ws.room);
                break;
            case "newquiz":
                let quizname = data.quizname;
                let questions = data.questions;
                // check if enouhg questions
                if(questions.length < 10){
                    ws.send(JSON.stringify({
                        type:"message",
                        message:"Not enough questions"
                    }))
                    break;
                }
                let quiz = {};
                
                for(var i of questions){
                    quiz[i.question] = i.answer;
                }
                console.log("New Quiz: ", quizname);
                
                // add to quizzes if doesnt exist
                if(quizzes[quizname] == undefined)
                    quizzes[quizname] = quiz;
                else {
                    ws.send(JSON.stringify({
                        type:"message",
                        message:"That quiz is already taken!"
                    }))
                    break;
                }
                // save it
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
                ws.send(JSON.stringify({
                    type:"createQuiz",status:"success"
                }))
                break;
            case "answerClicked":
                let completedQuestion = false
                for(let q in ws.room.questionsWithQuestionShowing){
                    if(ws.room.questionsWithQuestionShowing[q] == data.answer){
                        // move to questionsFinished
                        completedQuestion = q;
                        ws.room.questionsFinished[q] = ws.room.questionsWithQuestionShowing[q];
                        delete ws.room.questionsWithQuestionShowing[q];
                        break;
                    }
                }
                if(completedQuestion){
                    // we need to find a new question & answer to replace this question!
                    newAnswer = utils.randomObjectKey(ws.room.questionsYetToBeUsed)
                    utils.moveProperty(newAnswer,ws.room.questionsYetToBeUsed,ws.room.questionsWithAnswerShowing)
                    newQuestion = utils.randomObjectKey(ws.room.questionsWithAnswerShowing)
                    utils.moveProperty(newAnswer,ws.room.questionsWithQuestionShowing,ws.room.questionsWithQuestionShowing)
                    // we also need to move this question to questionsFinished
                    utils.moveProperty(completedQuestion,ws.room.questionsWithQuestionShowing,ws.room.questionsFinished)
                    // we need to send the person with that question (remember people have answers for other peoples questions)
                    // a new question
                    for(let p in ws.room.players){
                        if(ws.room.players[p].questionShowing == completedQuestion){
                            ws.room.players[p].socket.send(JSON.stringify({
                                type:"newQuestion",
                                question:newQuestion
                            }))
                            break;
                        }
                    }
                    // we also need to send this guy a new answer
                    ws.send(JSON.stringify({
                        type:"newAnswer",
                        replaces:data.answer,
                        answer:newAnswer,
                    }))
                    // OK all done I think

                }else{
                    ws.send(JSON.stringify({
                        type:"incorrectAnswer"
                    }))
                }
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
    // choose 3 answers to show per player
    for(let i = 0; i < playerCount * 3;i++){
        key = utils.randomObjectKey(room.questionsYetToBeUsed);
        utils.moveProperty(key,room.questionsYetToBeUsed,room.questionsWithAnswerShowing)
    }
    // choose 1 question (and corresponding answer) to show
    for(let i = 0; i < playerCount; i++){
        key = utils.randomObjectKey(room.questionsYetToBeUsed);
        utils.moveProperty(key,room.questionsYetToBeUsed,room.questionsWithQuestionShowing)
    }
    // get all the answers, (from answersShowing and QuesitionsShowing) and shuffle them up,
    // get all the questions, and shuffle them up
    let allAnswers = Object.values(room.questionsWithAnswerShowing).concat(Object.values(room.questionsWithQuestionShowing))
    allAnswers = utils.shuffleArray(allAnswers);
    let allQuestions = Object.keys(room.questionsWithQuestionShowing);
    allQuestions = utils.shuffleArray(allQuestions);
    // send copy to each client
    for(let client in room.players){
        room.players[client].questionShowing = allQuestions.pop()
        room.players[client].socket.send(JSON.stringify(
            {
                type:"initialSetup",
                question:room.players[client].questionShowing,// should be string value
                answers:[allAnswers.pop(),allAnswers.pop(),allAnswers.pop(),allAnswers.pop()]// should be array of strings
            }
        ))
    }
}