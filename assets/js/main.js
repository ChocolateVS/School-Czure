var questionsDiv = document.getElementById("questions");
var numQuestions = 10;
for (var i = 1; i <= numQuestions; i++) {
    addQuestion(i);
}

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
var form = document.getElementById("myForm");
var questionsForm = document.getElementById("questionsForm");

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

document.getElementById("startBtn").style.display = "none";

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
                    console.log("Succesfully Created Room!");
                    
                    create();
                    break;
                case "fail":
                    displayMessage(data.message);
                    break; 
                default:
                    break;
            }
        case "connect":
            switch (data.status) {
                case "success":
                    //Join Room
                    console.log("Succesfully Joined Room!");
                    create();
                    break;
                case "fail":
                    displayMessage(data.message);
                    break; 
                default:
                    break;
            }
        case "playerlist":
            players = data.players;
            updateRoomPlayers();
            break;
        case "message":
            displayMessage(data.message);
            break;
        default:
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
    document.querySelector("html").style.backgroundColor = getRandomColor();
    setTimeout(100);
}

function go() { 
    if (socket.readyState != 1) {
        socket = new WebSocket("ws://localhost:8080");
        console.log("WEB SOCKET STATE: ", socket.readyState);
        document.getElementById("loadingGIF").style.visibility = "none";
        displayMessage("Sorry, No server was found :(, Please try refreshing the page");
        setTimeout(function() {
            console.log("GO");
            if (socket.readyState == 1) {
                go();   
            }
        }, 1000);
    }
    else {
        var roomID = document.getElementById("gameID").value;
        var userID = document.getElementById("userID").value;
        lobbyID = roomID;
        playerID = userID;
        console.log("Game ID: " + roomID);
        console.log("User ID: " + userID);

        document.getElementById("message").style.visibility = "visible";
        document.getElementById("loadingGIF").style.visibility = "visible";
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
    document.getElementById("messagetxt").style.visibility = "visible";
    document.getElementById("loadingGIF").style.visibility = "hidden";
    document.getElementById("errorMessage").style.visibility = "visible";
    document.getElementById("messagetxt").innerHTML = "Error " + action + ", Message: " + error;
}

function displayMessage(action) {
    console.log("DISPLAYING MESSAGE");
    document.getElementById("messagetxt").style.visibility = "visible";
    document.getElementById("loadingGIF").style.visibility = "hidden";
    document.getElementById("errorMessage").style.visibility = "visible";
    document.getElementById("messagetxt").innerHTML = action;
}

function closeMSG() {
    document.getElementById("message").style.visibility = "hidden";
    document.getElementById("messagetxt").style.visibility = "hidden";
    document.getElementById("loadingGIF").style.visibility = "hidden";
    document.getElementById("errorMessage").style.visibility = "hidden";
    document.getElementById("messagetxt").innerHTML = "";
}

function create() {
    document.getElementById("startBtn").style.display = "inline-block";
    closeMSG();
    document.getElementById("home").style.display = "none";
    document.getElementById("lobby").style.display = "block";
    document.getElementById("lobbyID").innerHTML = lobbyID;
    updateRoomPlayers(); 
}

function updateRoomPlayers() {
    // clear players div
    document.getElementById("players").innerHTML = "";
    console.log(players.length);
    for (let player of players) {
        var newPlayer = document.createElement("span");
        newPlayer.className = "player";
        newPlayer.innerHTML = player.name;
        
        if (player.ready == true) {
            newPlayer.style.color = "lightgreen";
        }
        else {
            newPlayer.style.color = "black";     
        }
        
        document.getElementById("players").appendChild(newPlayer);
    }
}

function readyup() {
    if (ready) {
        ready = false;
        document.getElementById("readyBtn").value = "READY UP";
        document.getElementById("readyBtn").style.color = "black";
        socket.send(JSON.stringify(
        {
            type:"unready", 
            clientid:clientID,
            id:lobbyID
        }));
    }
    else if (!ready) {
        ready = true;
        document.getElementById("readyBtn").value = "UNREADY";
        document.getElementById("readyBtn").style.color = "lightgreen";
        socket.send(JSON.stringify(
        {
            type:"ready", 
            clientid:clientID,
            id:lobbyID
        }));
    }
}
function startGame() {
    socket.send(JSON.stringify(
    {
        type:"startGame", 
        clientid:clientID,
        id:lobbyID
    }));
}

function createQuestions() {
    if (socket.readyState != 1) {
        displayMessage("Sorry, No server was found :(, Please try refreshing the page");
    }
    else {
        console.log("HIIIIIII");
        document.getElementById("gameOptions").style.visibility = "visible";
    }
}

function createNewQuiz() {
    var questions = {

    };
    for (var i = 1; i <= numQuestions; i++) {
        var question = document.getElementsByName("question" + i)[0].value;
        var answer = document.getElementsByName("answer" + i)[0].value;
        var quizname = document.getElementById("quizName").value;
        if (question != "" && answer != "") {
            var pair = {
                question: question,
                answer: answer
            }
            questions[i] = pair;
            socket.send(JSON.stringify(
            {
                type:"newquiz", 
                quizname:quizname, 
                questions:questions
            }));
        }
        else {
            displayMessage("Sorry, Couldn't create quiz. Please check to make sure there are at least 10 valid questions and answers");
        }

    }
    console.log(quizname, questions);
}