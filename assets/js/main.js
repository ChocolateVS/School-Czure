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
    console.log("Game ID: " + roomID);
    if (buttonIndex == 0) {
        joinRoom(roomID);
    }
    else if (buttonIndex == 1) {
        createRoom(roomID);   
    }
}

function joinRoom() {
    
}

function createRoom() {
    
}

