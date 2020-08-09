var form = document.getElementById("myForm");

var buttonIndex;

let socket = new WebSocket("ws://localhost:8080");

let lobbyID = "";
let playerID = "";

let players = [];
socket.onopen = function(e) {
      console.log("Server Connection established");
};

socket.onclose = function(event) {
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
  displayError(action, error.message);
};

socket.onmessage = function(event) {
  //alert(`[message] Data received from server: ${event.data}`);
    
    let data = JSON.parse(event.data);

    switch (data.type) {
        case "create": 
            switch (data.status) {
                case "success":
                    //Join Room
                    console.log("Succesfully Created Room!");
                    create();
                    break;
                case "failed":
                    displayMessage("Unable to create room", "Room may already exist");
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
                case "failed":
                    displayMessage("Unable to join room", "Room doesn't exist");
                    break; 
                default:
                    break;
            }
        default:
           break;
    }
}
                        
function handleForm(event) { event.preventDefault(); } 
form.addEventListener('submit', handleForm);

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
    var roomID = document.getElementById("gameID").value;
    var userID = document.getElementById("userID").value;
    lobbyID = roomID;
    playerID = userID;
    players.push(playerID);
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

function displayMessage(action, error) {
    console.log("DISPLAYING ERROR");
    document.getElementById("messagetxt").style.visibility = "visible";
    document.getElementById("loadingGIF").style.visibility = "hidden";
    document.getElementById("errorMessage").style.visibility = "visible";
    document.getElementById("messagetxt").innerHTML = action + ", Message: " + error;
}

function closeMSG() {
    document.getElementById("message").style.visibility = "hidden";
    document.getElementById("messagetxt").style.visibility = "hidden";
    document.getElementById("loadingGIF").style.visibility = "hidden";
    document.getElementById("errorMessage").style.visibility = "hidden";
    document.getElementById("messagetxt").innerHTML = "";
}

function create() {
    closeMSG();
    document.getElementById("home").style.display = "none";
    document.getElementById("lobby").style.display = "block";
    document.getElementById("lobbyID").innerHTML = lobbyID;
    updateRoomPlayers(); 
}

function join() {
    
}

function updateRoomPlayers() {
    document.getElementById("players").innerHTML = "";
    for (i = 0; i < players.length; i++) {
        var newPlayer = document.createElement("span");
        newPlayer.className = "player";
        newPlayer.innerHTML = players[i];
        
        document.getElementById("players").appendChild(newPlayer);
    }
}