// Initialize Socket.IO connection
const socket = io("http://localhost:3001");

// DOM Elements
const gameStatus = document.querySelector(".game-status");
const joinScreen = document.getElementById("joinScreen");
const gameScreen = document.getElementById("gameScreen");
const nicknameInput = document.getElementById("nicknameInput");
const joinGameBtn = document.getElementById("joinGame");
const currentCategory = document.getElementById("currentCategory");
const timer = document.getElementById("timer");
const answerInput = document.getElementById("answerInput");
const submitAnswerBtn = document.getElementById("submitAnswer");
const personalScore = document.getElementById("personalScore");
const topAnswers = document.getElementById("topAnswers");
const roundResults = document.querySelector(".round-results");

// Game state
let nickname = "";
let isRoundActive = false;

// Fun messages for players
const playerMessages = [
  "🎯 Get ready to type!",
  "🌟 Show us your word power!",
  "🎪 The stage is yours!",
  "🎭 Time to shine!",
  "🎨 Let's get creative!",
  "🎪 Show time!",
  "🎯 Your turn to dazzle!",
];

// Event Listeners
joinGameBtn.addEventListener("click", joinGame);
nicknameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") joinGame();
});

submitAnswerBtn.addEventListener("click", submitAnswer);
answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submitAnswer();
  }
});

// Socket Event Handlers
socket.on("connect", () => {
  updateGameStatus("Connected to game server");
});

socket.on("roundStart", (data) => {
  startRound(data);
});

socket.on("roundEnd", (data) => {
  endRound(data);
});

socket.on("gameReset", () => {
  resetGame();
});

socket.on("invalidNickname", () => {
  alert("This nickname is already taken. Please choose another one.");
  nicknameInput.value = "";
  nicknameInput.focus();
});

// Game Functions
function joinGame() {
  nickname = nicknameInput.value.trim();

  if (nickname.length < 2 || nickname.length > 15) {
    alert("Nickname must be between 2 and 15 characters.");
    return;
  }

  socket.emit("joinGame", { nickname });

  joinScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  updateGameStatus(getRandomMessage(playerMessages));
}

function startRound(data) {
  isRoundActive = true;
  currentCategory.textContent = data.category;
  roundResults.classList.add("hidden");
  answerInput.value = "";
  answerInput.disabled = false;
  submitAnswerBtn.disabled = false;
  answerInput.focus();
  updateGameStatus("Type your answer!");
  startTimer(data.duration);
}

function endRound(data) {
  isRoundActive = false;
  answerInput.disabled = true;
  submitAnswerBtn.disabled = true;
  displayResults(data);
  updateGameStatus("Round complete! Wait for next round...");
}

function submitAnswer() {
  if (!isRoundActive) return;

  const answer = answerInput.value.trim();
  if (!answer) return;

  socket.emit("submitAnswer", { answer });
  answerInput.value = ""; // Clear the input for the next answer
  answerInput.focus(); // Keep focus on input for quick typing
  updateGameStatus("Answer submitted! Keep going!");
}

function startTimer(duration) {
  let timeRemaining = duration;
  updateTimerDisplay(timeRemaining);

  const timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay(timeRemaining);

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      answerInput.disabled = true;
      submitAnswerBtn.disabled = true;
    }
  }, 1000);
}

function updateTimerDisplay(time) {
  timer.textContent = time;
  timer.className = "";

  if (time <= 5) {
    timer.classList.add("timer-danger");
  } else if (time <= 10) {
    timer.classList.add("timer-warning");
  }
}

function displayResults(data) {
  roundResults.classList.remove("hidden");

  // Show personal score
  personalScore.textContent = `Your total score: ${data.playerScore}`;

  // Show answer breakdown
  const answerBreakdown = document.getElementById("answerBreakdown");
  answerBreakdown.innerHTML = data.answers
    .map(
      (answer) => `
        <div class="answer-item ${answer.status}">
          <span class="answer-text">${answer.word}</span>
          <span class="answer-points">${answer.points > 0 ? '+' : ''}${answer.points}</span>
          <span class="answer-reason">${answer.reason}</span>
        </div>
      `
    )
    .join("");
}

function resetGame() {
  currentCategory.textContent = "-";
  timer.textContent = "-";
  answerInput.value = "";
  answerInput.disabled = true;
  submitAnswerBtn.disabled = true;
  roundResults.classList.add("hidden");
  updateGameStatus("Game reset! Waiting for new game to start...");
}

// Helper Functions
function updateGameStatus(message) {
  gameStatus.textContent = message;
}

function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}
