// const socket = new WebSocket("ws://localhost:9118");
serverUrl = "ws://" + window.location.hostname + ":9118";
let socket = null;
var lastSentWords = []; // This will store the last sent words for reference
var confirmedCells = new Set(); // Stores IDs of cells confirmed as correct
var selectedWords = []; // This will store the selected words

// Track current room and user for color selection
let currentRoom = null;
let currentUser = null;

// Store color selections per room and player
const playerColors = {
  // gameroom1: { player: color, opponent: color }
};

// Helper to get color for a player in a room
function getPlayerColor(roomId, username, isConfirmed) {
  if (playerColors[roomId] && playerColors[roomId][username]) {
    return playerColors[roomId][username];
  }
  // Default: cyan for selection, green for confirmed
  return isConfirmed ? 'green' : 'cyan';
}

function showGameRules() {
  const gameRules = "Welcome to the Game!\n\nHere's how to play:\n1. Search the grid and sequentially select the letters to form words. You can select each letter in any direction: horizontal, vertical, or diagonal.\n2. As you select letters, they will be highlighted in cyan to indicate your current selection.\n3. After you have selected all letters for a word, click the 'Check Selection' button to submit your word for verification.\n4. If the word is correct, it will turn green on the grid. If it's incorrect, the selection will fade away, allowing you to try again.\n5. Each correct word remains highlighted in green.\n6. Aim to find and correctly identify more words than your opponents to win the game.\n\nBest of luck, and enjoy the challenge!";
  alert(gameRules);
}

document.addEventListener("DOMContentLoaded", function () {
  initializeWebSocket(); // Initialize WebSocket connection
  setupEventListeners();
  fetchVersionAndUpdateTitle();
});

function fetchVersionAndUpdateTitle() {
  fetch('/api/version')
    .then(response => response.text())
    .then(version => {
        document.title = `${version}`;  
    })
    .catch(error => console.error('Failed to fetch version:', error));
}

function setupEventListeners() {
  // Login form submission event
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent form submission
      const username = document.getElementById("username").value;
      connectWebSocket(username);
      updateGameTable([]);
      safeSend("section1");
    });
  }

  // Game reset event
  const resetGameButton = document.getElementById("resetGame");
  if (resetGameButton) {
    resetGameButton.addEventListener("click", function () {
      console.log("[RESETING ALL GAMES] \n Resetting the game");
      safeSend("reset_game:" + "gameroom1");
      safeSend("reset_game:" + "gameroom2");
      safeSend("reset_game:" + "gameroom3");
      safeSend("reset_game:" + "gameroom4");
      safeSend("reset_game:" + "gameroom5");
      alert("Games are being reset and new grid will be generated with all players associated with them removed!\nPlease wait till all player count becomes 0/2\nIt will take 5 seconds (1 second each)\nClick 'OK' to view latest changes.")
    });
  }
}

// Add event listeners for sending words in each game room
addSendButtonListener("gameroom1");
addSendButtonListener("gameroom2");
addSendButtonListener("gameroom3");
addSendButtonListener("gameroom4");
addSendButtonListener("gameroom5");

// GRID
function addSendButtonListener(roomId) {
  const sendButton = document.getElementById(roomId + "_send");
  if (sendButton) {
    sendButton.addEventListener("click", function () {
      sendWords(roomId);
    });
  }
}

function toggleCell(cell, value) {
  let cellId = cell.id;
  console.log(`Toggle cell ${cellId} with value ${value}, current room: ${currentRoom}, current user: ${currentUser}`);
  
  if (!confirmedCells.has(cellId)) {
    // Only toggle if not confirmed as correct
    const currentColor = getPlayerColor(currentRoom, currentUser, false);
    console.log(`Current color for user ${currentUser}: ${currentColor}`);
    
    if (cell.style.backgroundColor === currentColor || cell.style.backgroundColor === 'cyan') {
      cell.style.backgroundColor = "";
      removeFromSelected(value);
      console.log(`Cleared cell ${cellId}`);
    } else {
      cell.style.backgroundColor = currentColor;
      addToSelected(value);
      console.log(`Highlighted cell ${cellId} with color ${currentColor}`);
    }
  } else {
    console.log(`Cell ${cellId} is confirmed, cannot toggle`);
  }
}

function addToSelected(word) {
  selectedWords.push(word);
};

function removeFromSelected(word) {
  const index = selectedWords.indexOf(word);
  if (index > -1) {
    selectedWords.splice(index, 1);
  }
}

function sendWords(roomId) {
  const usernameSpan = document.querySelector(".currentUsername");
  if (usernameSpan) {
    const username = usernameSpan.textContent;
    if (selectedWords.length > 0) {
      const message =
        "check_word:" + roomId + ":" + username + ":" + selectedWords.join("");
      lastSentWords = selectedWords.slice(); // Copy of currently selected words
      safeSend(message);
      selectedWords = []; // Optionally clear the selected words array immediately
    }
  } else {
    console.error("Username display element not found");
  }
}

function updateGrid(roomId, gridJson) {
  let gridData = JSON.parse(gridJson);
  let gridHtml = formatGridHtml(gridData);
  document.getElementById(`${roomId}_grid`).innerHTML = gridHtml;
}

function formatGridHtml(grid) {
  let html = '<table class="game-grid">';
  let cellId = 0;
  grid.forEach((row, rowIndex) => {
    html += "<tr>";
    row.forEach((cell, colIndex) => {
      html += `<td id="cell_${rowIndex}_${colIndex}" onclick="toggleCell(this, '${cell}')" class="grid-cell">${cell}</td>`;
    });
    html += "</tr>";
  });
  html += "</table>";
  return html;
}

function updatePlayerList(playerNamesJSON) {
  const playerNames = JSON.parse(playerNamesJSON);
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = ""; // Clear previous entries

  playerNames.forEach((player) => {
    let playerItem = document.createElement("li");
    playerItem.textContent = player; // Set the text to the player's name
    playerList.appendChild(playerItem);
  });
}

// showGameRoom function to show the game room
function showGameRoom(roomId, player, opponent) {
  // Set player names in the scoreboard
  const player1NameCell = document.getElementById(`${roomId}_score_player1`);
  const player2NameCell = document.getElementById(`${roomId}_score_player2`);
  if (player1NameCell) player1NameCell.textContent = player;
  if (player2NameCell) player2NameCell.textContent = opponent;
  // Reset scores to 0
  const player1ScoreCell = document.getElementById(`${roomId}_score_player1_value`);
  const player2ScoreCell = document.getElementById(`${roomId}_score_player2_value`);
  if (player1ScoreCell) player1ScoreCell.textContent = '0';
  if (player2ScoreCell) player2ScoreCell.textContent = '0';
  // Get color values from the color selectors
  const player1ColorSelect = document.getElementById(`player1-color-${roomId}`);
  const player2ColorSelect = document.getElementById(`player2-color-${roomId}`);
  function updatePlayerInfoLine() {
    const player1Color = player1ColorSelect ? player1ColorSelect.options[player1ColorSelect.selectedIndex].text : '';
    const player2Color = player2ColorSelect ? player2ColorSelect.options[player2ColorSelect.selectedIndex].text : '';
    const playerInfoDiv = document.getElementById(`${roomId}_playerinfo`);
    if (playerInfoDiv) {
      playerInfoDiv.textContent = `${player} Color ${player1Color} | ${opponent} Color ${player2Color}`;
    }
  }
  if (player1ColorSelect) player1ColorSelect.addEventListener('change', updatePlayerInfoLine);
  if (player2ColorSelect) player2ColorSelect.addEventListener('change', updatePlayerInfoLine);
  updatePlayerInfoLine();
  showSection(roomId); // Shows the appropriate game room
  showGameRules();
  setupColorSelection(roomId, player, opponent);
  setCurrentRoomAndUser(roomId, player); // Assume the local user is player
}

function updateGameTable(gameRooms) {
  const tbody = document.getElementById("gameTableBody");
  tbody.innerHTML = ""; // Clear existing content

  gameRooms.forEach((room) => {
    let row = tbody.insertRow();
    let cellRoom = row.insertCell(0);
    let cellPlayers = row.insertCell(1);
    let cellJoin = row.insertCell(2);
    let cellGridTime = row.insertCell(3);  // Cell for grid generation time


    cellRoom.textContent = room.name;
    cellPlayers.textContent = room.players;
    cellGridTime.textContent = room.gridGenerationTime + " seconds";  // Display grid generation time in milliseconds


    let joinButton = document.createElement("button");
    joinButton.textContent = "Join";
    joinButton.id = "join_" + room.name; // Unique ID for button
    joinButton.addEventListener("click", function () {
      safeSend("join_game:" + room.name);
    });
    cellJoin.appendChild(joinButton);
  });
}

function updateWords(roomId, words) {
  // Only show up to 15 words
  const limitedWords = words.slice(0, 15);
  const wordsListHtml = limitedWords.map((word) => `<li>${word}</li>`).join("");
  const wordsElement = document.getElementById(`${roomId}_words`);
  if (wordsElement) {
    wordsElement.innerHTML = wordsListHtml;
  } else {
    console.error("No words element found for room ID:", roomId);
  }
}

function updateLoggedInUser(username) {
  // Query all elements that could contain the username and update them.
  document.querySelectorAll(".currentUsername").forEach(function (span) {
    span.textContent = username;
  });
  console.log("Logged in user updated: ", username);
}
// connect and send the username to the server
function connectWebSocket(username) {
  console.log("Attempting to add new player");
  // Send the username to the server
  try {
    safeSend("new_player:" + username);
    console.log("New player added: ", username);
  } catch (error) {
    console.log("Error adding new player: ", error);
  }
}

// Initialize WebSocket connection
function initializeWebSocket() {
  try {
    socket = new WebSocket(serverUrl);
    
    socket.onopen = function (event) {
      console.log("WebSocket connection established");
    };

    socket.onerror = function (event) {
      console.error("WebSocket error observed:", event);
    };

    socket.onclose = function (event) {
      console.log("WebSocket connection closed", event.code, event.reason);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        initializeWebSocket();
      }, 3000);
    };

    socket.onmessage = function (event) {
      const sectionToShow = event.data;
      // Use a switch case to determine which section to show

      console.log("Received message:", event.data);
      const data = event.data.split(":");
      const command = data[0];
      const content = data.slice(1).join(":"); // Ensure all content after the first colon is included
      let jsonPart = data.slice(2).join(":"); // Join the remaining parts that might contain JSON data

      switch (command) {
        case "update_highlight":
          const roomIdHighlight = data[1];
          const word = data[2];
          let positions = JSON.parse(data[2]);
          updateHighlightedCells(roomIdHighlight, word, positions);
          break;

          case "username_exists":
            alert("This username already exists. Please try a different one.");
            showSection("section0");
            break;

        case "update_words":
          const roomIdWords = data[1];
          const wordsJson = data.slice(2).join(":");
          const wordsList = JSON.parse(wordsJson);
          updateWords(roomIdWords, wordsList);
          break;

        case "update_scores": {
          const roomId = data[1];

          console.log("CONTENT:\n" + content);
          const json = extractJson(jsonPart);
          console.log("JSON:\n" + json);
          const scores = JSON.parse(json);

          console.log("\n\n-- JSON --\n\n" + json);
          console.log("\n\n-- SCORE UPDATE REQUEST --\n\n");
          console.log("Updating scores for room:", roomId);
          console.log("Scores:", scores);

          updateLeaderboard(roomId, scores);
          break;
        }
        case "word_correct":
          console.log("Word is correct: " + content);
          //let positions = JSON.parse(data[2]); // Assuming positions are passed as JSON
          highlightWords(positions, true);
          console.log(positions)
          // Increment score for the current user
          incrementScore(currentRoom, currentUser);
          break;

        case "word_incorrect":
          console.log("Word is incorrect: " + content);
          clearSelection(); // Now only clears unconfirmed selection
          break;

        case "update_grid":
          const roomId = data[1];
          const gridJson = data.slice(2).join(":"); // Assuming grid data is sent as JSON
          updateGrid(roomId, gridJson);
          break;

        case "chat_update":
          if (data.length >= 3) {
            const roomId = data[1];
            const message = data.slice(2).join(":");
            appendChatMessage(roomId, message);
          }
          break;

        case "update_players":
          const username = content;
          console.log("Updating player list with data:", content);
          updatePlayerList(username); // Handle updated player list
          console.log(
            "[switch: command (update_players)] Received data:",
            event.data
          );
          console.log(
            "[switch: command (update_players)] Received command:",
            command
          );
          break;

        case "winner":
          alert(data[1] + " wins!"); // Alert user who wins
          break;

        case "update_gameRooms":
          console.log("RECIEVED GAMEROOM UPDATE REQUEST [update_gameRooms]");
          const gameRooms = JSON.parse(content);
          console.log("Updating game rooms with data:", gameRooms);
          updateGameTable(gameRooms);
          break;

        case "chat_update":
          if (data.length >= 3) {
            const roomId = data[1];
            const message = data[2];
            const chatBox = document.getElementById(roomId + "_chat");
            chatBox.innerHTML += "<div>" + message + "</div>"; // Append new message
          }
          break;

        case "update_words":
          if (data.length >= 3) {
            const roomId = data[1];
            const words = JSON.parse(data.slice(2).join(":")); // Joining back the rest of the message
            updateWords(roomId, words);
          }
          break;

        case "start_game":
          // Extracted room ID, player, and opponent names
          const room = data[1];
          const player = data[2];
          const opponent = data[3];
          // Show the game room with updated player and opponent info
          showGameRoom(room, player, opponent);
          // Additionally, show the grid and words for this game room
          showSection(room);
          break;

        case "player_added":
          try {
            const username = content;
            updateLoggedInUser(username);
          } catch (error) {
            console.log("Error updating logged in user: ", error);
            break;
          }

          break;
        case "color_update": {
          // Format: color_update:<roomId>:<username>:<color>
          const roomId = data[1];
          const username = data[2];
          const color = data[3];
          if (!playerColors[roomId]) playerColors[roomId] = {};
          playerColors[roomId][username] = color;
          // Update dropdown if present
          const player1Select = document.getElementById(`player1-color-${roomId}`);
          const player2Select = document.getElementById(`player2-color-${roomId}`);
          if (player1Select && player1Select.value !== color && player1Select.previousElementSibling && player1Select.previousElementSibling.textContent.startsWith(username)) {
            player1Select.value = color;
          }
          if (player2Select && player2Select.value !== color && player2Select.previousElementSibling && player2Select.previousElementSibling.textContent.startsWith(username)) {
            player2Select.value = color;
          }
          break;
        }
        default:
          console.log("no such command [update_players]", command);
          break;
      }

      switch (sectionToShow) {
        case "section0":
          showSection("section0");
          console.log("section0");
          break;
        case "section1":
          showSection("section1");
          console.log("From the switch case :section1");
          break;
        case "section2":
          showSection("section2");
          console.log("From the switch case :section2");
          break;
        case "section3":
          showSection("section3");
          console.log("From the switch case :section3");
          break;
        case "gameroom1":
          showSection("gameroom1");
          console.log("From the switch case :gameroom1");
          break;

        case "gameroom2":
          console.log("From the switch case :gameroom2");
          showSection("gameroom2");
          break;

        case "gameroom3":
          console.log("From the switch case :gameroom3");
          showSection("gameroom3");
          break;

        case "gameroom4":
          console.log("From the switch case :gameroom4");
          showSection("gameroom4");
          break;

        case "gameroom5":
          console.log("From the switch case :gameroom5");
          showSection("gameroom5");
          break;

        case "player_added":
          const player = event.data;
          console.log("New player added: ", player);
          break;
        case "player_not_added":
          console.log("Player not added");
          break;
        default:
          console.log("No such section exists", sectionToShow);
          break;
      }
    };
  } catch (error) {
    console.error("Failed to initialize WebSocket:", error);
  }
}

// Helper function to safely send messages
function safeSend(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
    return true;
  } else {
    console.warn("WebSocket is not ready. Message not sent:", message);
    return false;
  }
}

function updateHighlightedCells(roomId, word, positions) {
  console.log(`Updating highlighted cells for word: ${word} in room: ${roomId}`);
  positions.forEach(pos => {
    const cellId = `cell_${pos[0]}_${pos[1]}`;
    const cell = document.getElementById(cellId);
    if (cell) {
      // Use the current user's color for confirmed cells
      const confirmedColor = getPlayerColor(roomId, currentUser, true);
      cell.style.backgroundColor = confirmedColor;
      confirmedCells.add(cellId); // Add to confirmed list
    }
  });
}

function extractJson(jsonPart) {
  let braceCount = 0;
  let json = "";

  for (let i = 0; i < jsonPart.length; i++) {
    json += jsonPart[i];
    if (jsonPart[i] === "{") {
      braceCount++;
    } else if (jsonPart[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        break; // When brace count returns to 0, we've captured a complete JSON object
      }
    }
  }

  return json;
}

function clearSelection() {
  document.querySelectorAll(".grid-cell").forEach((cell) => {
    if (!confirmedCells.has(cell.id)) {
      // Only clear non-confirmed cells
      cell.style.backgroundColor = "";
    }
  });
}

function highlightWords(wordsPositions, correct) {
  wordsPositions.forEach((pos) => {
    let cell = document.getElementById(`cell_${pos[0]}_${pos[1]}`);
    if (cell) {
      if (correct) {
        const confirmedColor = getPlayerColor(currentRoom, currentUser, true);
        cell.style.backgroundColor = confirmedColor;
        confirmedCells.add(cell.id); // Add to confirmed list
      } else {
        cell.style.backgroundColor = "";
      }
    }
  });
}

function showSection(sectionId) {
  console.log("Showing section:", sectionId); 
  document
    .querySelectorAll("div[id^='section'], div[id^='gameroom']")
    .forEach((div) => {

      if (!div.id.endsWith('_words_container')) {
        div.classList.add("hidden");
      }
    });

  // Show the current section
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove("hidden");
  } else {
    console.error("No section found with ID:", sectionId);
  }

  // If the section is a game room, also removes the hidden class from its grid, word list, and chat area.. preety smart right?
  if (sectionId.startsWith("gameroom")) {
    const grid = document.getElementById(sectionId + "_grid");
    const words = document.getElementById(sectionId + "_words");
    const chatArea = document.getElementById(sectionId + "_chat");

    if (grid && words && chatArea) {
      grid.classList.remove("hidden");
      words.classList.remove("hidden");
      chatArea.classList.remove("hidden");
    }
  }}

// CHAT
function sendChatMessage(roomId) {
  const input = document.getElementById(roomId + "_chat_input");
  const usernameSpan = document.querySelector(".currentUsername"); // Adjust selector as needed
  const username = usernameSpan.textContent; // Or use .value if it's an input field
  const message = input.value.trim();

  if (message) {
    const fullMessage = username + ": " + message; // Combine username with message
    safeSend(`chat:${roomId}:${fullMessage}`);
    input.value = ""; // Clear the input after sending
  }
}

function updateChat(roomId, message) {
  const chatBox = document.getElementById(roomId + "_chat");
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
}

function appendChatMessage(roomId, message) {
  // Expecting message in format 'Username: text'
  const chatArea = document.getElementById(`${roomId}_chat`);
  if (chatArea) {
    const div = document.createElement('div');
    // Split message into username and text
    const sepIdx = message.indexOf(':');
    if (sepIdx !== -1) {
      const username = message.substring(0, sepIdx).trim();
      const text = message.substring(sepIdx + 1).trim();
      div.textContent = `${username} > ${text}`;
    } else {
      div.textContent = message;
    }
    div.style.textAlign = 'left';
    chatArea.appendChild(div);
    // Auto-scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

// leader board
function updateLeaderboard(roomId, scores) {
  const tbody = document
    .getElementById(roomId + "_leaderboard_table")
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear existing rows

  Object.entries(scores).forEach(([player, score]) => {
    const row = tbody.insertRow();
    const cellPlayer = row.insertCell(0);
    const cellScore = row.insertCell(1);
    cellPlayer.textContent = player;
    cellScore.textContent = score;

    // debug
    console.log("Player: ", player, " Score: ", score);
  });
}

// Setup color selection listeners for all rooms
function setupColorSelection(roomId, player, opponent) {
  console.log(`Setting up color selection for room ${roomId}: player=${player}, opponent=${opponent}`);
  
  // Player 1
  const player1Select = document.getElementById(`player1-color-${roomId}`);
  const player2Select = document.getElementById(`player2-color-${roomId}`);
  const player1Label = player1Select ? player1Select.previousElementSibling : null;
  const player2Label = player2Select ? player2Select.previousElementSibling : null;

  // Set label to username
  if (player1Label) {
    player1Label.textContent = `${player} Color`;
    console.log(`Updated label for player 1: ${player} Color`);
  }
  if (player2Label) {
    player2Label.textContent = `${opponent} Color`;
    console.log(`Updated label for player 2: ${opponent} Color`);
  }

  // Set initial color
  if (!playerColors[roomId]) playerColors[roomId] = {};
  playerColors[roomId][player] = player1Select ? player1Select.value : 'cyan';
  playerColors[roomId][opponent] = player2Select ? player2Select.value : 'cyan';
  
  console.log(`Initial colors for room ${roomId}:`, playerColors[roomId]);

  // Listen for changes
  if (player1Select) {
    player1Select.addEventListener('change', function() {
      playerColors[roomId][player] = this.value;
      console.log(`Player ${player} changed color to ${this.value} in room ${roomId}`);
      // Send color update to server
      safeSend(`color_update:${roomId}:${player}:${this.value}`);
    });
  }
  if (player2Select) {
    player2Select.addEventListener('change', function() {
      playerColors[roomId][opponent] = this.value;
      console.log(`Player ${opponent} changed color to ${this.value} in room ${roomId}`);
      // Send color update to server
      safeSend(`color_update:${roomId}:${opponent}:${this.value}`);
    });
  }
}

// Update current room/user on game start
function setCurrentRoomAndUser(roomId, username) {
  currentRoom = roomId;
  currentUser = username;
  console.log(`Current room: ${currentRoom}, Current user: ${currentUser}`);
}

// Helper to increment score for a player
function incrementScore(roomId, playerName) {
  const player1NameCell = document.getElementById(`${roomId}_score_player1`);
  const player2NameCell = document.getElementById(`${roomId}_score_player2`);
  const player1ScoreCell = document.getElementById(`${roomId}_score_player1_value`);
  const player2ScoreCell = document.getElementById(`${roomId}_score_player2_value`);
  if (player1NameCell && player1ScoreCell && player1NameCell.textContent === playerName) {
    player1ScoreCell.textContent = (parseInt(player1ScoreCell.textContent) + 1).toString();
  } else if (player2NameCell && player2ScoreCell && player2NameCell.textContent === playerName) {
    player2ScoreCell.textContent = (parseInt(player2ScoreCell.textContent) + 1).toString();
  }
}