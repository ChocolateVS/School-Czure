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
    if (buttonIndex == 0) {
        joinRoom(roomID, userID);
    }
    else if (buttonIndex == 1) {
        createRoom(roomID, userID);   
    }
}

function joinRoom(roomID, userID) {
    
    let socket = new WebSocket("wss://I ASSUME PORT OF THE SERVER THINGY GOES HERE");
    
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
        alert('[close] Connection died');
      }
    };

    socket.onerror = function(error) {
      alert(`[error] ${error.message}`);
    };
}

function createRoom(roomID, userID) {
    let socket = new WebSocket("wss://I ASSUME PORT OF THE SERVER THINGY GOES HERE");

    socket.onopen = function(e) {
      console.log("Server Connection established");
      socket.send({type:"create", id:roomID,name:userID});
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
        alert('[close] Connection died');
      }
    };

    socket.onerror = function(error) {
      alert(`[error] ${error.message}`);
    };
}

