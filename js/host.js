// Initialize Socket.IO connection
const socket = io("https://quizthingbackend.onrender.com/");

// DOM Elements
const gameStatus = document.querySelector(".game-status");
const currentCategory = document.getElementById("currentCategory");
const timer = document.getElementById("timer");
const startRoundBtn = document.getElementById("startRound");
const nextRoundBtn = document.getElementById("nextRound");
const resetGameBtn = document.getElementById("resetGame");
const leaderboardList = document.getElementById("leaderboardList");
const answersList = document.getElementById("answersList");

// Game state
let isRoundActive = false;
let timeRemaining = 0;
let timerInterval;

// Fun loading messages for the host
const hostMessages = [
  "🎮 Gathering players...",
  "🎲 Rolling the dice...",
  "🎯 Setting up the game board...",
  "📝 Preparing categories...",
  "🎪 Getting the show ready...",
  "🎭 Setting the stage...",
  "🎪 Warming up the crowd...",
];

// Event Listeners
startRoundBtn.addEventListener("click", () => {
  socket.emit("startRound");
  startRoundBtn.disabled = true;
});

nextRoundBtn.addEventListener("click", () => {
  socket.emit("nextRound");
  nextRoundBtn.disabled = true;
  startRoundBtn.disabled = false;
});

resetGameBtn.addEventListener("click", () => {
  if (
    confirm(
      "Are you sure you want to reset the game? This will clear all scores."
    )
  ) {
    socket.emit("resetGame");
  }
});

// Socket Event Handlers
socket.on("connect", () => {
  socket.emit("hostJoin");
  updateGameStatus(getRandomMessage(hostMessages));
});

socket.on("hostConnected", (data) => {
  updateGameStatus("🎮 Host connected! Waiting for players...");
});

socket.on("hostExists", () => {
  alert("Another host is already connected!");
  window.location.href = "/player.html";
});

socket.on("roundStart", (data) => {
  isRoundActive = true;
  currentCategory.textContent = data.category;
  startTimer(data.duration);
  updateGameStatus("⏳ Round in progress...");
  nextRoundBtn.disabled = true;
});

socket.on("roundEnd", (data) => {
  isRoundActive = false;
  clearInterval(timerInterval);
  displayResults(data);
  nextRoundBtn.disabled = false;
  updateGameStatus("🏁 Round complete!");
});

socket.on("gameReset", () => {
  resetGameDisplay();
  updateGameStatus("🔄 Game reset! Ready to start new game.");
});

socket.on("playerJoined", (data) => {
  updateGameStatus(`👋 ${data.nickname} joined the game!`);
  updateLeaderboard(data.players);
});

socket.on("playerLeft", (data) => {
  updateGameStatus(`👋 ${data.nickname} left the game.`);
  updateLeaderboard(data.players);
});

// Helper Functions
function updateGameStatus(message) {
  gameStatus.textContent = message;
}

function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function startTimer(duration) {
  timeRemaining = duration;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      socket.emit("timeUp");
    }
  }, 1000);
}

function updateTimerDisplay() {
  timer.textContent = timeRemaining;

  // Add visual indicators for time running out
  timer.className = "";
  if (timeRemaining <= 5) {
    timer.classList.add("timer-danger");
  } else if (timeRemaining <= 10) {
    timer.classList.add("timer-warning");
  }
}

function updateLeaderboard(players) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  leaderboardList.innerHTML = sortedPlayers
    .map(
      (player, index) => `
            <div class="player-score">
                ${index + 1}. ${player.nickname}: ${player.score} points
            </div>
        `
    )
    .join("");
}

function displayResults(data) {
  // Display top answers with counts
  answersList.innerHTML = data.topAnswers
    .map(
      (answer) => `
            <div class="answer-item">
                ${answer.word} (${answer.count})
            </div>
        `
    )
    .join("");
}

function resetGameDisplay() {
  currentCategory.textContent = "-";
  timer.textContent = "-";
  leaderboardList.innerHTML = "";
  answersList.innerHTML = "";
  startRoundBtn.disabled = false;
  nextRoundBtn.disabled = true;
}
