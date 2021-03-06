var questionsDiv = id("questions");
var numQuestions = 10;
for (var i = 1; i <= numQuestions; i++) {
    addQuestion(i);
}
function id(id){return document.getElementById(id)}
function $(sel){return document.querySelector(sel)}

function addQuestion(questionNum) {
    if (questionNum == 0) {
        numQuestions += 1;
        questionNum = numQuestions;
    }
    var quesDiv = document.createElement("div");
    quesDiv.classname = "quesDiv";
    
    var newQuestion = document.createElement("input");
    var newAnswer = document.createElement("input");
    
    newQuestion.setAttribute("class", "questionInput");
    newQuestion.setAttribute("type", "text");
    newQuestion.setAttribute("id", "questionInput");
    newQuestion.setAttribute("placeholder", "Question " + questionNum + ":");
    newQuestion.setAttribute("maxlength", 100); 
    newQuestion.setAttribute("name", "question" + questionNum); 
    newQuestion.required = true;
    
    newAnswer.setAttribute("class", "questionInput");
    newAnswer.setAttribute("type", "text");
    newAnswer.setAttribute("id", "answerInput");
    newAnswer.setAttribute("placeholder", "Answer: ");
    newAnswer.setAttribute("maxlength", 20);  
    newAnswer.setAttribute("name", "answer" + questionNum); 
    newAnswer.required = true;
    
    quesDiv.appendChild(newQuestion);
    quesDiv.appendChild(newAnswer);
    questionsDiv.appendChild(quesDiv);
}

var form = id("myForm");
var questionsForm = id("questionsForm");

function handleForm(event) { event.preventDefault(); } 
form.addEventListener('submit', handleForm);
questionsForm.addEventListener('submit', handleForm);

var buttonIndex;

var clientID = "";
let socket = new WebSocket("ws://localhost:8080");

let lobbyID = "";
let playerID = "";

let players = [];

let ready = false;

var count = 4;

id("startBtn").style.display = "none";

socket.onopen = function(e) {
      console.log("Server Connection established");
};

socket.onclose = function(event) {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
    /*setTimeout(function() {
        socket = new WebSocket("ws://localhost:8080");
    }, 1000);*/
  if (event.wasClean) {
    displayMessage("Connection Closed", event.reason);
    //console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    console.log('[close] Connection died');
    //displayError("Connection closed", event.reason);
  }
};

socket.onerror = function(error) {
    console.log(`[error] ${error.message}`);
    //socket = new WebSocket("ws://localhost:8080")
    //displayError(action, error.message);
    /*setTimeout(function() {
        socket = new WebSocket("ws://localhost:8080");
    }, 1000);*/
};

socket.onmessage = function(event) {
    console.log(`[message] Data received from server: ${event.data}`);
    
    let data = JSON.parse(event.data);

    switch (data.type) {
        case "clientid":
            clientID = data.id;
            console.log("Client ID: ", clientID);
            break;
        case "create": 
            switch (data.status) {
                case "success":
                    //Join Room
                    id("startBtn").style.display = "inline-block";// only start quiz if host
                    id("quizSelect").style.display = "inline-block";// only select quiz if host
                    console.log("Succesfully Created Room!");
                    console.log(data.quizList[0]);

                    let count = 0;
                    for (let element in data.quizList) {
                        var option = document.createElement("option");
                        option.innerHTML = data.quizList[element];
                        option.setAttribute("value",data.quizList[element]);
                        console.log(data.quizList[element]);
                        id("quizSelect").appendChild(option);
                        count++;
                    };
                    create();
                    break;
                case "fail":
                    displayMessage(data.message);
                    break; 
                default:
                    break;
            }
            break;
        case "connect":
            switch (data.status) {
                case "success":
                    //Join Room
                    id("startBtn").style.display = "none";
                    id("quizSelect").style.display = "none";// only select quiz if host
                    console.log("Succesfully Joined Room!");
                    create();
                    break;
                case "fail":
                    displayMessage(data.message);
                    break; 
                default:
                    break;
            }
            break;
        case "playerlist":
            players = data.players;
            updateRoomPlayers();
            break;
        case "message":
            displayMessage(data.message);
            break;
        case "quizzes":
            displayMessage("QUIZZES RECIEVED");
        case "createQuiz":
            if(data.status == "success"){
                displayMessage("Quiz creation successful");
                hideQuizCreator();
            } else {
                displayError("Something went wrong.")
            }
            break;
            
        case "question":
            
            break;
        default:
            console.warn("Message type:" + data.type +" not yet implemented")
           break;
    }
}
                    


function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function beginSeizure() {
    requestAnimationFrame(beginSeizure);
    $("html").style.backgroundColor = getRandomColor();
    setTimeout(100);
}

function go() { 
    if (socket.readyState != 1) {
        socket = new WebSocket("ws://localhost:8080");
        console.log("WEB SOCKET STATE: ", socket.readyState);
        id("loadingGIF").style.display = "block";
        displayMessage("Sorry, No server was found :(, Please try refreshing the page");
        setTimeout(function() {
            console.log("GO");
            if (socket.readyState == 1) {
                go();   
            }
        }, 1000);
    }
    else {
        var roomID = id("gameID").value;
        var userID = id("userID").value;
        lobbyID = roomID;
        playerID = userID;
        console.log("Game ID: " + roomID);
        console.log("User ID: " + userID);

        id("message").style.display = "block";
        id("loadingGIF").style.display = "block";
        if (buttonIndex == 0) {
            joinRoom(roomID, userID);
        }
        else if (buttonIndex == 1) {
            createRoom(roomID, userID);   
        }
    }
}

function joinRoom(roomID, userID) {
    let action = "Joining Room";
    
    socket.send(JSON.stringify(
      {
          type:"connect", 
          id:roomID, 
          name:userID
      }));
}

function createRoom(roomID, userID) {
    let action = "Creating Room";
    console.log("HI");
    socket.send(JSON.stringify(
      {
          type:"create", 
          id:roomID, 
          name:userID
      }));
}

function displayError(action, error) {
    console.log("DISPLAYING ERROR");
    id("message").style.display = "block";
    id("messagetxt").style.display = "block";
    id("loadingGIF").style.display = "none";
    id("errorMessage").style.display = "block";
    id("messagetxt").innerHTML = "Error " + action + ", Message: " + error;
}

function displayMessage(action) {
    console.log("DISPLAYING MESSAGE");
    id("message").style.display = "block";
    id("messagetxt").style.display = "block";
    id("loadingGIF").style.display = "none";
    id("errorMessage").style.display = "block";
    id("messagetxt").innerHTML = action;
}

function closeMSG() {
    id("message").style.display = "none";
    id("messagetxt").style.display = "none";
    id("loadingGIF").style.display = "none";
    id("errorMessage").style.display = "none";
    id("messagetxt").innerHTML = "";
}

function create() {
    
    closeMSG();
    id("home").style.display = "none";
    id("lobby").style.display = "block";
    id("lobbyID").innerHTML = lobbyID;
    updateRoomPlayers(); 
}

function updateRoomPlayers() {
    // clear players div
    id("players").innerHTML = "";

    for (let player of players) {
        var newPlayer = document.createElement("span");
        newPlayer.className = "player";
        newPlayer.innerHTML = player.name;
        
        if (player.ready == true) {
            newPlayer.style.color = "lightgreen";
        }
        else {
            newPlayer.style.color = "white";     
        }
        
        id("players").appendChild(newPlayer);
    }
}

function readyup() {
    if (ready) {
        ready = false;
        id("readyBtn").value = "READY UP";
        id("readyBtn").style.color = "black";
        socket.send(JSON.stringify(
        {
            type:"unready", 
            clientid:clientID,
            id:lobbyID
        }));
    }
    else if (!ready) {
        ready = true;
        id("readyBtn").value = "UNREADY";
        id("readyBtn").style.color = "lightgreen";
        socket.send(JSON.stringify(
        {
            type:"ready", 
            clientid:clientID,
            id:lobbyID
        }));
    }
}
function startGame() {
    let e = id("quizSelect").value;
    console.log(e);
    if (e != -1) {
        socket.send(JSON.stringify(
        {
            type:"startGame", 
            clientid:clientID,
            id:lobbyID,
            selected:e
        }));   
    }
    else {
        displayMessage("Please Select a quiz to begin");
    }
}

function createQuestions() {
    if (socket.readyState != 1) {
        displayMessage("Sorry, No server was found :(, Please try refreshing the page");
    }
    else {
        id("gameOptions").style.display = "block";
        id("home").style.display = "none";
    }
}
function hideQuizCreator(){
    id("gameOptions").style.display = "none";
    id("home").style.display = "flex";
}

function createNewQuiz() {
    var questions = [];
    for (var i = 1; i <= numQuestions; i++) {
        var question = document.getElementsByName("question" + i)[0].value;
        var answer = document.getElementsByName("answer" + i)[0].value;
        var quizname = id("quizName").value;
        if (question != "" && answer != "") {
            questions.push({
                question: question,
                answer: answer
            });
        }
    }
    socket.send(JSON.stringify(
    {
        type:"newquiz", 
        quizname:quizname, 
        questions:questions
    }));
    console.log(quizname, questions);
}