const express = require('express')
const app = express()
const port = 3000
const WebSocket = require('ws');
const uuid = require('uuid');

const wss = new WebSocket.Server({ port: port });

app.get('/', (req, res) => {
  res.send('Nothing to see here!')
})

let users = 0, readyUsers = 0;

let playerIDs = [];

let letters = ["X", "O"]

let squares = Array(9).fill("")

let currentTurn = 0

let gameStarted = false;

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function initializeGame(){
  squares = Array(9).fill("")
  playerIDs = shuffle(playerIDs)
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

wss.on('connection', (ws) => {
  let id = uuid.v4();
  const arrival = new Date(Date.now());
  console.log(`User ${id} connected, ${arrival.toString()}`);
  ws.isAlive = true;
  users++;
  console.log(`${users} users now here`);
  ws.send(JSON.stringify({message:'welcome'}))
  
  let userStatus = 'spectator' //can change to player
  
  let letter = ""
  
  ws.send(JSON.stringify({userStatus: userStatus, activePlayers: playerIDs.length}))
  
  //wait for users to become players
  ws.on('message', message => {
    //console.log(message)
    let userAction = JSON.parse(message);
    console.log(userAction)
    if("action" in userAction){
      if (userAction.action === "joinGame"){
        if(playerIDs.length < 2){
          if(playerIDs.indexOf(id) === -1){
            playerIDs.push(id)
            userStatus = 'player'
            ws.send(JSON.stringify({userStatus: userStatus, activePlayers: playerIDs.length}))
            console.log(`player ${id} is ready`)
            if(playerIDs.length === 2){
              initializeGame()
              letter = letters(playerIDs.indexOf(id))
              if(playerIDs.indexOf(id)> -1){
                ws.send(JSON.stringify({playerLetter: letter}))
              }
            }
          }
          else{
            console.log('player has previously joined')
          }
        }
        else{
          console.log('no space for new players')
        }

      }
    }
  })
  
  ws.on('close', () => {
    const departure = new Date(Date.now());
    console.log(`User ${id} disconnected, ${departure.toString()}`);
    users--;
    
    //if (ws.isReady) readyUsers--;
    if (playerIDs.indexOf(id) > -1){
      playerIDs.splice(playerIDs.indexOf(id), 1)
    }

    //checkReadyUsers();
  });
})

/*app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})*/