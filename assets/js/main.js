var form = document.getElementById("myForm");

var buttonIndex;

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
    
    let socket = new WebSocket("wss://localhost:8080"); //I ASSUME PORT OF THE SERVER THINGY GOES HERE
    let action = "Joining Room";
    socket.onopen = function(e) {
      console.log("Server Connection established");
      socket.send({type:"connect", id:roomID,name:userID});
    };

    socket.onmessage = function(event) {
      alert(`[message] Data received from server: ${event.data}`);
    };

    socket.onclose = function(event) {
      if (event.wasClean) {
        alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
      }
    };

    socket.onerror = function(error) {
      console.log(`[error] ${error.message}`);
      displayError(action, error.message);
    };
}

function createRoom(roomID, userID) {
    let socket = new WebSocket("ws://localhost:8080");
    let action = "Creating Room";
    socket.onopen = function(e) {
      console.log("Server Connection established");
      socket.send({type:"connect", id:roomID, name:userID});
    };

    socket.onmessage = function(event) {
      alert(`[message] Data received from server: ${event.data}`);
    };

    socket.onclose = function(event) {
      if (event.wasClean) {
        alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died');
      }
    };

    socket.onerror = function(error) {
      console.log(`[error] ${error.message}`);
      displayError(action, error.message);
    };
}

function displayError(action, error) {
    console.log("DISPLAYING ERROR");
    document.getElementById("messagetxt").style.visibility = "visible";
    document.getElementById("loadingGIF").style.visibility = "hidden";
    document.getElementById("errorMessage").style.visibility = "visible";
    document.getElementById("messagetxt").innerHTML = "Error " + action + ", Message: " + error;
}

function closeMSG() {
    console.log("CLOSE ERROR MESSAGE");
    document.getElementById("message").style.visibility = "hidden";
    document.getElementById("messagetxt").style.visibility = "hidden";
    document.getElementById("loadingGIF").style.visibility = "hidden";
    document.getElementById("errorMessage").style.visibility = "hidden";
    document.getElementById("messagetxt").innerHTML = "";
}