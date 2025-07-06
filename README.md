# WordSearch Game

Multiplayer word search game with Java backend and HTML/CSS/JavaScript frontend.

## Quick Start

### 1. Install Java (if not installed)
```bash
# Check if Java is installed
java -version

# If not installed, install Java 11
brew install openjdk@11
```

### 2. Set JAVA_HOME
```bash
# Set Java home path
export JAVA_HOME=$(/usr/libexec/java_home)
```

### 3. Run the game
```bash
# Build and run
./run.sh
```

## Alternative: Manual Maven commands
```bash
export JAVA_HOME=$(/usr/libexec/java_home)
mvn clean
mvn install
mvn package
mvn compile
mvn exec:java
```

## Play

1. Open http://localhost:9018 in browser
2. Enter username and login
3. Join a game room
4. Find words in the grid
5. Chat with opponent

## What it does

- 5 concurrent game rooms
- Real-time multiplayer
- Live chat
- Score tracking
- Color-coded word selection

## How to run locally

### Prerequisites
- Java 8 or higher
- Maven
- Web browser

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/axjh03/twsg.git
   cd twsg
   ```

2. **Build the project**
   ```bash
   mvn clean install
   ```

3. **Run the server**
   ```bash
   sh run.sh
   ```

4. **Open in browser**
   - Go to: http://localhost:9018
   - The game will load automatically

### How to play

1. **Login**: Enter a username
2. **Join a game**: Click "Join" on any available game room
3. **Wait for opponent**: Game starts when 2 players join
4. **Find words**: Click letters to select words in the grid
5. **Chat**: Use the chat box to communicate
6. **Score**: Find more words than your opponent to win

### Game Controls

- **Select letters**: Click on grid cells to highlight words
- **Check selection**: Click "Check Selection" to submit a word
- **Chat**: Type in chat box and press Enter
- **Exit game**: Click "Exit Game" to return to lobby
- **Reset game**: Click "Reset Game" to start fresh

### Technical Details

- **Backend**: Java with WebSocket server (port 9118)
- **Frontend**: Static HTML/CSS/JS served on port 9018
- **Dependencies**: Maven manages all Java libraries
- **Build**: Creates executable JAR with all dependencies

### Troubleshooting

- **Port already in use**: Make sure ports 9018 and 9118 are free
- **Java not found**: Install Java 8+ and add to PATH
- **Maven not found**: Install Maven and add to PATH
- **Build fails**: Check Java version compatibility

---

## 🚀 Project Overview

This project is a web-based multiplayer word search game built with a Java backend and a modern HTML/CSS/JavaScript frontend. It features real-time gameplay, live chat, a dynamic scoreboard, and a clean, responsive UI.

---

## ✨ Features

- **User Login:** Simple username-based login system.
- **Lobby:** See all online players and available game rooms.
- **Game Rooms:** Join or create rooms, play head-to-head.
- **Word Search Grid:** Interactive, color-coded word search grid.
- **Real-Time Chat:** Chat with your opponent during the game.
- **Scoreboard:** Live score updates as you find words.
- **Customizable UI:** Dark/light themes, responsive design.
- **Reset & Exit:** Easily reset games or exit to the lobby.

---

## 🛠️ Tech Stack

- **Backend:** Java (WebSocket, custom game logic)
- **Frontend:** HTML, CSS (custom, responsive), JavaScript (vanilla)
- **Build/Run:** Java, Maven, shell scripts

---

## 📦 Setup Instructions

### Prerequisites
- Java 17+
- Maven
- Modern web browser

### Clone & Build
```bash
git clone <your-repo-url>
cd <project-directory>
mvn clean install
```

### Run the Server
```bash
sh run.sh
```

### Open the App
- Visit [http://localhost:9118](http://localhost:9118) in your browser.

---

## 🕹️ Usage
1. **Login:** Enter a username to join the lobby.
2. **Lobby:** See online players and available game rooms.
3. **Join/Create Game:** Click "Join" to enter a game room.
4. **Play:** Find words in the grid, chat, and compete for the highest score.
5. **Exit/Reset:** Use the controls to exit or reset the game.
---

## 📄 License

This project is for educational and portfolio use. See [LICENSE](LICENSE) for details. 