// ================= AI MEMORY =================
let aiMemory = JSON.parse(localStorage.getItem("gomokuMemory")) || {};

// Add global error handler
window.addEventListener('error', (e) => {
    console.error('JS Error:', e.error, e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

console.log("Script starting...");

// Save memory function
function saveMemory() {
    localStorage.setItem("gomokuMemory", JSON.stringify(aiMemory));
}

let board;
let resetBtn;
let backBtn;
let clearMemoryBtn;
let actionButtons;
let titleHeader;
let xPlayer;
let oPlayer;
let modeBtns;
let scoreDisplay;
let playerSelect;
let playerOneInput;
let playerTwoInput;
let playerTwoRow;
let startGameBtn;
let xPlayerName;
let oPlayerName;
let xPlayerScore;
let oPlayerScore;
let savedPlayerNames;
let playerOneSuggestions;
let playerTwoSuggestions;
let symXBtn;
let symOBtn;

function setupDomElements() {
    board = document.getElementById("board");
    resetBtn = document.getElementById("resetBtn");
    backBtn = document.getElementById("backBtn");
    clearMemoryBtn = document.getElementById("clearMemoryBtn");
    actionButtons = document.getElementById("actionButtons");
    titleHeader = document.getElementById("titleHeader");
    xPlayer = document.getElementById("xplayerDisplay");
    oPlayer = document.getElementById("oplayerDisplay");
    modeBtns = document.querySelectorAll(".modeBtn");
    scoreDisplay = document.getElementById("scoreDisplay");
    playerSelect = document.getElementById("playerSelect");
    playerOneInput = document.getElementById("playerOneInput");
    playerTwoInput = document.getElementById("playerTwoInput");
    playerTwoRow = document.getElementById("playerTwoRow");
    startGameBtn = document.getElementById("startGameBtn");
    xPlayerName = document.getElementById("xPlayerName");
    oPlayerName = document.getElementById("oPlayerName");
    xPlayerScore = document.getElementById("xPlayerScore");
    oPlayerScore = document.getElementById("oPlayerScore");
    savedPlayerNames = document.getElementById("savedPlayerNames");
    playerOneSuggestions = document.getElementById("playerOneSuggestions");
    playerTwoSuggestions = document.getElementById("playerTwoSuggestions");
    symXBtn = document.getElementById("symX");
    symOBtn = document.getElementById("symO");
}

// symbol tracking for human/opponent
let humanSymbol = "X";
let opponentSymbol = "O";

function selectSymbol(sym) {
    humanSymbol = sym;
    opponentSymbol = sym === "X" ? "O" : "X";
    if (symXBtn) symXBtn.classList.toggle("selected", sym === "X");
    if (symOBtn) symOBtn.classList.toggle("selected", sym === "O");
    // also highlight header players during setup
    xPlayer.classList.toggle("active", sym === "X");
    oPlayer.classList.toggle("active", sym === "O");
    // update header names to position placeholder correctly
    updateHeaderNames();
}

// header clicks will be enabled on setup too
// listeners for symbol buttons are added later inside showNameInputsForMode

// header click listeners and default symbol state are set during app initialization.

const BOARD_SIZE = 11;
const WIN_COUNT = 5;

let currentPlayer = "X";
let gameActive = false;
let cells = [];
let boardState = Array(BOARD_SIZE * BOARD_SIZE).fill("");
let gameMode = null; // "pvp" or "ai"
let AI_PLAYER = "O"; // will be adjusted when starting a game
let gameMoves = [];
let lastMoveIndex = null;
let lastMovePlayer = null;

const PLAYERS_KEY = "gomokuPlayers";
let players = JSON.parse(localStorage.getItem(PLAYERS_KEY)) || {};
const AI_SCORE_KEY = "gomokuAiScore";
let aiScore = Number(localStorage.getItem(AI_SCORE_KEY)) || 0;
const NAME_HISTORY_KEY = "gomokuNameHistory";
let nameHistory = JSON.parse(localStorage.getItem(NAME_HISTORY_KEY)) || [];
let selectedPlayer = "";
let secondPlayer = "";


function normalizeName(name) {
    return name.trim().toUpperCase();
}

function enforceUppercaseInput(inputElement) {
    inputElement.addEventListener("input", () => {
        inputElement.value = inputElement.value.toUpperCase();
    });
}

function savePlayers() {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

function saveAiScore() {
    localStorage.setItem(AI_SCORE_KEY, String(aiScore));
}

function saveNameHistory() {
    localStorage.setItem(NAME_HISTORY_KEY, JSON.stringify(nameHistory));
}

function updateNameSuggestions() {
    const mergedNames = [...new Set([...Object.keys(players), ...nameHistory])];
    mergedNames.sort((a, b) => a.localeCompare(b));

    savedPlayerNames.innerHTML = "";

    mergedNames.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        savedPlayerNames.appendChild(option);
    });
}

function getAllKnownNames() {
    return [...new Set([...Object.keys(players), ...nameHistory])]
        .filter(name => name && name !== "AI")
        .sort((a, b) => a.localeCompare(b));
}

function hideNameSuggestionList(listElement) {
    if (!listElement) return;
    listElement.style.display = "none";
    listElement.innerHTML = "";
}

function renderNameSuggestionList(inputElement, listElement) {
    if (!inputElement || !listElement) return;

    const query = normalizeName(inputElement.value);
    const names = getAllKnownNames().filter(name =>
        query ? name.startsWith(query) : true
    );

    if (names.length === 0) {
        hideNameSuggestionList(listElement);
        return;
    }

    listElement.innerHTML = "";

    names.forEach(name => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "nameSuggestionItem";
        item.textContent = name;

        item.addEventListener("mousedown", event => {
            event.preventDefault();
            inputElement.value = name;
            hideNameSuggestionList(listElement);
            inputElement.focus();
        });

        listElement.appendChild(item);
    });

    listElement.style.display = "flex";
}

function attachNameSuggestionEvents(inputElement, listElement) {
    if (!inputElement || !listElement) return;

    inputElement.addEventListener("focus", () => {
        renderNameSuggestionList(inputElement, listElement);
    });

    inputElement.addEventListener("input", () => {
        renderNameSuggestionList(inputElement, listElement);
    });
}

function rememberName(name) {
    if (!name || name === "AI") return;
    if (!nameHistory.includes(name)) {
        nameHistory.push(name);
        saveNameHistory();
    }
}

function updateScoreDisplay() {
    if (!selectedPlayer) {
        scoreDisplay.textContent = "PLAYER: - | SCORE: 0";
        xPlayerScore.textContent = "SCORE: 0";
        oPlayerScore.textContent = "SCORE: 0";
        return;
    }

    if (gameMode === "pvp" && secondPlayer) {
        const firstScore = players[selectedPlayer] ?? 0;
        const secondScore = players[secondPlayer] ?? 0;
        let xScore, oScore;
        if (humanSymbol === "X") {
            xScore = firstScore;
            oScore = secondScore;
        } else {
            xScore = secondScore;
            oScore = firstScore;
        }
        scoreDisplay.textContent = `${selectedPlayer}: ${firstScore} | ${secondPlayer}: ${secondScore}`;
        xPlayerScore.textContent = `SCORE: ${xScore}`;
        oPlayerScore.textContent = `SCORE: ${oScore}`;
        return;
    }

    // ai or single player
    const humanScore = players[selectedPlayer] ?? 0;
    scoreDisplay.textContent = `PLAYER: ${selectedPlayer} | SCORE: ${humanScore}`;
    if (humanSymbol === "X") {
        xPlayerScore.textContent = `SCORE: ${humanScore}`;
        oPlayerScore.textContent = gameMode === "ai" ? `SCORE: ${aiScore}` : "SCORE: 0";
    } else {
        oPlayerScore.textContent = `SCORE: ${humanScore}`;
        xPlayerScore.textContent = gameMode === "ai" ? `SCORE: ${aiScore}` : "SCORE: 0";
    }
}

function updateHeaderNames() {
    // while in input mode (no selectedPlayer), mirror typed names
    let xName = "-";
    let oName = "-";

    if (!selectedPlayer) {
        const name1 = normalizeName(playerOneInput.value) || "-";
        const name2 = normalizeName(playerTwoInput.value) || "-";
        if (humanSymbol === "X") {
            xName = name1;
            oName = name2;
        } else {
            xName = name2;
            oName = name1;
        }
    } else {
        if (humanSymbol === "X") {
            xName = selectedPlayer || "-";
            oName = secondPlayer || "-";
        } else {
            xName = secondPlayer || "-";
            oName = selectedPlayer || "-";
        }
    }

    xPlayerName.textContent = xName;
    oPlayerName.textContent = oName;
}

function setMenuTitle() {
    titleHeader.textContent = "CHOOSE MODE";
}

function getRankedPlayers() {
    const entries = Object.entries(players).map(([name, score]) => ({
        name,
        score: score || 0
    }));

    if (aiScore > 0) {
        entries.push({ name: "AI", score: aiScore });
    }

    entries.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.name.localeCompare(b.name);
    });

    return entries;
}

function renderRanks() {
    const rankedPlayers = getRankedPlayers();
    rankList.innerHTML = "";

    if (rankedPlayers.length === 0) {
        const emptyRow = document.createElement("div");
        emptyRow.className = "rankRow";
        emptyRow.innerHTML = `
            <span class="rankPos">-</span>
            <span class="rankName">NO SCORES YET</span>
            <span class="rankScore">0</span>
        `;
        rankList.appendChild(emptyRow);
        return;
    }

    rankedPlayers.forEach((player, index) => {
        const row = document.createElement("div");
        row.className = "rankRow";
        row.innerHTML = `
            <span class="rankPos">#${index + 1}</span>
            <span class="rankName">${player.name}</span>
            <span class="rankScore">${player.score}</span>
        `;
        rankList.appendChild(row);
    });
}

function showNameInputsForMode() {
    const modeSelect = document.getElementById("modeSelect");
    modeSelect.classList.add("hide");
    playerSelect.classList.add("show");

    playerTwoRow.style.display = gameMode === "pvp" ? "grid" : "none";

    if (gameMode === "ai") {
        titleHeader.textContent = "Enter Your Name";
        playerOneInput.placeholder = "PLAYER NAME";
        playerTwoInput.value = "";
    } else {
        titleHeader.textContent = "Enter Player Names";
        playerOneInput.placeholder = "PLAYER 1 NAME";
    }

    updateHeaderNames();
    renderNameSuggestionList(playerOneInput, playerOneSuggestions);

    if (gameMode === "pvp") {
        renderNameSuggestionList(playerTwoInput, playerTwoSuggestions);
    } else {
        hideNameSuggestionList(playerTwoSuggestions);
    }
}

function initApp() {
    setupDomElements();

    console.log("Elements found:", {
        board,
        modeBtns: modeBtns ? modeBtns.length : 0,
        playerSelect,
        playerOneInput,
        titleHeader
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", resetGame);
    }

    if (backBtn) {
        backBtn.addEventListener("click", goBackToMenu);
    }

    if (clearMemoryBtn) {
        clearMemoryBtn.addEventListener("click", () => {
            aiMemory = {};
            localStorage.removeItem("gomokuMemory");
            titleHeader.textContent = "AI Memory Cleared";
        });
    }

    selectSymbol("X");

    if (xPlayer) {
        xPlayer.addEventListener("click", () => {
            if (playerSelect.style.display === "flex") selectSymbol("X");
        });
    }

    if (oPlayer) {
        oPlayer.addEventListener("click", () => {
            if (playerSelect.style.display === "flex") selectSymbol("O");
        });
    }

    enforceUppercaseInput(playerOneInput);
    enforceUppercaseInput(playerTwoInput);
    attachNameSuggestionEvents(playerOneInput, playerOneSuggestions);
    attachNameSuggestionEvents(playerTwoInput, playerTwoSuggestions);

    playerOneInput.addEventListener("input", updateHeaderNames);
    playerTwoInput.addEventListener("input", updateHeaderNames);

    const startGameFromInputs = () => {
        if (!gameMode) {
            titleHeader.textContent = "Choose Mode";
            return;
        }

        const firstName = normalizeName(playerOneInput.value);
        const secondName = normalizeName(playerTwoInput.value);

        if (!firstName) {
            titleHeader.textContent = "Enter Player 1 Name";
            return;
        }

        if (gameMode === "pvp" && !secondName) {
            titleHeader.textContent = "Enter Player 2 Name";
            return;
        }

        selectedPlayer = firstName;
        secondPlayer = gameMode === "ai" ? "AI" : secondName;
        opponentSymbol = humanSymbol === "X" ? "O" : "X";

        if (gameMode === "ai") {
            AI_PLAYER = opponentSymbol;
        }

        rememberName(selectedPlayer);
        if (gameMode === "pvp") {
            rememberName(secondPlayer);
        }

        if (!players[selectedPlayer]) {
            players[selectedPlayer] = 0;
        }

        if (gameMode === "pvp" && secondPlayer && !players[secondPlayer]) {
            players[secondPlayer] = 0;
        }

        savePlayers();
        updateNameSuggestions();
        updateScoreDisplay();
        updateHeaderNames();

        board.style.display = "grid";
        actionButtons.style.display = "flex";
        document.getElementById("modeSelect").style.display = "none";
        playerSelect.style.display = "none";
        playerSelect.classList.remove("show");

        const mainArea = document.getElementById("mainArea");
        mainArea.classList.remove("menu");
        mainArea.classList.add("play");
        mainArea.classList.toggle("pvp-mode", gameMode === "pvp");

        createBoard();
    };

    playerOneInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            startGameFromInputs();
        }
    });

    playerTwoInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            startGameFromInputs();
        }
    });

    if (startGameBtn) {
        startGameBtn.addEventListener("click", event => {
            event.preventDefault();
            startGameFromInputs();
        });
    }

    document.addEventListener("click", event => {
        if (!event.target.closest(".nameInputWrap")) {
            hideNameSuggestionList(playerOneSuggestions);
            hideNameSuggestionList(playerTwoSuggestions);
        }
    });

    updateScoreDisplay();
    updateHeaderNames();
    updateNameSuggestions();

    console.log("Attaching mode button listeners, found", modeBtns.length, "buttons");

    modeBtns.forEach((btn, index) => {
        console.log("Attaching listener to button", index, btn, btn.textContent);
        btn.addEventListener("click", () => {
            try {
                console.log("=== MODE BUTTON CLICKED ===", btn.dataset.mode);
                modeBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                gameMode = btn.dataset.mode;
                console.log("gameMode set to:", gameMode);
                console.log("Calling showNameInputsForMode");
                showNameInputsForMode();
                console.log("showNameInputsForMode completed");
            } catch (err) {
                console.error("Error in mode button click handler:", err);
            }
        });
    });

    const modeSelect = document.getElementById("modeSelect");
    if (modeSelect) {
        modeSelect.addEventListener("click", event => {
            const btn = event.target.closest(".modeBtn");
            if (!btn) return;
            if (!modeBtns || modeBtns.length === 0) return;

            modeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            gameMode = btn.dataset.mode;
            showNameInputsForMode();
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

/* ---------- INIT ---------- */
function createBoard() {
    board.innerHTML = "";
    board.style.display = "grid";
    boardState.fill("");
    cells = [];
    gameMoves = [];
    lastMoveIndex = null;
    lastMovePlayer = null;

    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        cell.addEventListener("click", handleCellClick);
        board.appendChild(cell);
        cells.push(cell);
    }

    // start with whichever symbol the human chose
    currentPlayer = humanSymbol;
    setActivePlayer();
    titleHeader.textContent = "Turn";
    gameActive = true;
    updateScoreDisplay();
    updateHeaderNames();
}

/* ---------- UI ---------- */
function setActivePlayer() {
    xPlayer.classList.toggle("active", currentPlayer === "X");
    oPlayer.classList.toggle("active", currentPlayer === "O");
}

/* ---------- CLICK ---------- */
function handleCellClick(e) {
    if (!gameActive) return;

    const index = e.target.dataset.index;
    if (boardState[index] !== "") return;

    makeMove(index, currentPlayer);

    // ✅ CHECK HUMAN WIN PROPERLY
    if (checkWin(index, currentPlayer)) {
        endGame(currentPlayer);
        return; 
    }

    if (isDraw()) {
        endGame("draw");
        return;
    }


    switchTurn();

    // ✅ AI MOVE ONLY IF GAME IS STILL ON
    if (gameMode === "ai" && currentPlayer === AI_PLAYER && gameActive) {
        setTimeout(aiMove, 300);
    }
}


/* ---------- MOVE ---------- */
function makeMove(index, player) {
    if (lastMoveIndex !== null) {
        cells[lastMoveIndex].classList.remove("last-move", "last-x", "last-o");
    }

    boardState[index] = player;
    cells[index].textContent = player;
    cells[index].style.color = player === "X" ? "#1892ea" : "#A737ff";
    cells[index].classList.add("last-move", `last-${player.toLowerCase()}`);
    lastMoveIndex = index;
    lastMovePlayer = player;
    gameMoves.push({
        board: boardState.join(""),
        move: index,
        player: player
    });


}


/* ---------- TURN ---------- */
function switchTurn() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    setActivePlayer();
}

/* ---------- AI ---------- */
function aiMove() {
    if (!gameActive) return;

    let bestMove = null;

    const learnedMove = getLearnedMove();
    if (learnedMove !== null) {
        bestMove = learnedMove;
    }

    if (bestMove === null) {
        const winMove = findWinningMove(AI_PLAYER);
        if (winMove !== null) bestMove = winMove;
    }

    if (bestMove === null) {
        const blockMove = findWinningMove("X");
        if (blockMove !== null) bestMove = blockMove;
    }

    if (bestMove === null) {
        const makeUnblockableFour = findOpenSequenceMove(AI_PLAYER, 4, 2);
        if (makeUnblockableFour !== null) bestMove = makeUnblockableFour;
    }

    if (bestMove === null) {
        const makeOpenFour = findOpenSequenceMove(AI_PLAYER, 4, 1);
        if (makeOpenFour !== null) bestMove = makeOpenFour;
    }

    if (bestMove === null) {
        const blockOpenFour = findOpenSequenceMove("X", 4, 1);
        if (blockOpenFour !== null) bestMove = blockOpenFour;
    }

    if (bestMove === null) {
        const forkMove = detectDoubleThreat(AI_PLAYER);
        if (forkMove !== null) bestMove = forkMove;
    }

    if (bestMove === null) {
        const blockFork = detectDoubleThreat("X");
        if (blockFork !== null) bestMove = blockFork;
    }

    if (bestMove === null) {
        const makeOpenThree = findOpenSequenceMove(AI_PLAYER, 3, 2);
        if (makeOpenThree !== null) bestMove = makeOpenThree;
    }

    if (bestMove === null) {
        const blockOpenThree = findOpenSequenceMove("X", 3, 2);
        if (blockOpenThree !== null) bestMove = blockOpenThree;
    }

    if (bestMove === null) {
        bestMove = getCenterMove();
    }

    if (bestMove === null) {
        bestMove = findBestGrowthMove();
    }

    if (bestMove === null) {
        let bestScore = -Infinity;
        const possibleMoves = getCandidateMoves();

        for (let move of possibleMoves) {
            boardState[move] = AI_PLAYER;

            let score = minimax(3, -Infinity, Infinity, false);

            boardState[move] = "";

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
    }

    if (bestMove === null) bestMove = getRandomMove();

    makeMove(bestMove, AI_PLAYER);

    if (checkWin(bestMove, AI_PLAYER)) {
        endGame(AI_PLAYER);
        return;
    }

    if (isDraw()) {
        endGame("draw");
        return;
    }

    switchTurn();
}
    



function findThreatMove(player, threatCount) {
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== "") continue;

        boardState[i] = player;

        if (createsThreat(i, player, threatCount)) {
            boardState[i] = "";
            return i;
        }

        boardState[i] = "";
    }
    return null;
}

function createsThreat(index, player, threatCount) {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;

    return (
        countDirection(row, col, 1, 0, player) >= threatCount ||
        countDirection(row, col, 0, 1, player) >= threatCount ||
        countDirection(row, col, 1, 1, player) >= threatCount ||
        countDirection(row, col, 1, -1, player) >= threatCount
    );
}

function countDirection(row, col, rDir, cDir, player) {
    let count = 1;

    count += countOneWay(row, col, rDir, cDir, player);
    count += countOneWay(row, col, -rDir, -cDir, player);

    return count;
}

function countOneWay(row, col, rDir, cDir, player) {
    let r = row + rDir;
    let c = col + cDir;
    let count = 0;

    while (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        boardState[r * BOARD_SIZE + c] === player
    ) {
        count++;
        r += rDir;
        c += cDir;
    }
    return count;
}



function findBestGrowthMove() {
    let bestScore = -1;
    let bestMove = null;

    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === "") {
            let score = countNearby(i, AI_PLAYER);
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestScore > 0 ? bestMove : null;
}

function countNearby(index, player) {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    let score = 0;

    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            const nr = row + r;
            const nc = col + c;
            if (
                nr >= 0 &&
                nr < BOARD_SIZE &&
                nc >= 0 &&
                nc < BOARD_SIZE &&
                boardState[nr * BOARD_SIZE + nc] === player
            ) {
                score++;
            }
        }
    }
    return score;
}



function findWinningMove(player) {
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === "") {
            boardState[i] = player;
            const win = checkWin(i, player);
            boardState[i] = "";
            if (win) return i;
        }
    }
    return null;
}




function getCenterMove() {
    const center = Math.floor(boardState.length / 2);
    return boardState[center] === "" ? center : null;
}

function getRandomMove() {
    const empty = boardState
        .map((v, i) => (v === "" ? i : null))
        .filter(v => v !== null);
    return empty[Math.floor(Math.random() * empty.length)];
}

function getRandomMoveList() {
    return boardState
        .map((v, i) => (v === "" ? i : null))
        .filter(v => v !== null);
}

/* ---------- WIN LOGIC ---------- */
function checkWin(index, player) {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;

    return (
        checkDirection(row, col, 1, 0, player) ||
        checkDirection(row, col, 0, 1, player) ||
        checkDirection(row, col, 1, 1, player) ||
        checkDirection(row, col, 1, -1, player)
    );
}

function checkDirection(row, col, rDir, cDir, player) {
    let count = 1;
    count += countCells(row, col, rDir, cDir, player);
    count += countCells(row, col, -rDir, -cDir, player);
    return count >= WIN_COUNT;
}

function countCells(row, col, rDir, cDir, player) {
    let r = row + rDir;
    let c = col + cDir;
    let count = 0;

    while (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        boardState[r * BOARD_SIZE + c] === player
    ) {
        count++;
        r += rDir;
        c += cDir;
    }
    return count;
}


/* ---------- RESET ---------- */
function resetGame() {
    hideOverlay();
    if (!gameMode || !selectedPlayer) {
        setMenuTitle();
        return;
    }
    board.style.display = "grid";
    createBoard();
}

function goBackToMenu() {
    hideOverlay();
    gameActive = false;
    board.style.display = "none";
    actionButtons.style.display = "none";

    const modeSelect = document.getElementById("modeSelect");
    if (modeSelect) {
        modeSelect.style.display = "flex";
        modeSelect.classList.remove("hide");
    }

    playerSelect.style.display = "none";
    playerSelect.classList.remove("show");
    playerTwoRow.style.display = "none";

    selectedPlayer = "";
    secondPlayer = "";
    gameMode = null;
    playerOneInput.value = "";
    playerTwoInput.value = "";
    hideNameSuggestionList(playerOneSuggestions);
    hideNameSuggestionList(playerTwoSuggestions);

    selectSymbol("X");

    const mainArea = document.getElementById("mainArea");
    mainArea.classList.remove("pvp-mode");
    mainArea.classList.remove("play");
    mainArea.classList.add("menu");

    setMenuTitle();
    playerOneInput.placeholder = "PLAYER 1 NAME";
    modeBtns.forEach(b => b.classList.remove("active"));
    updateScoreDisplay();
    updateHeaderNames();
}

/* ---------- START ---------- */
setMenuTitle();

// allow overlay dismissal by click
const overlayElem = document.getElementById("winnerOverlay");
if (overlayElem) {
    overlayElem.addEventListener("click", hideOverlay);
}

function showOverlay(text) {
    const overlay = document.getElementById("winnerOverlay");
    const textEl = document.getElementById("winnerOverlayText");
    if (!overlay || !textEl) return;
    textEl.textContent = text;
}

function hideOverlay() {
    const overlay = document.getElementById("winnerOverlay");
    if (overlay) overlay.classList.add("hidden");
}

function endGame(winner) {
    gameActive = false;

    let winnerName = "";
    if (winner === "X" || winner === "O") {
        // determine which player owns the winning mark
        if (winner === humanSymbol) {
            winnerName = selectedPlayer;
        } else {
            winnerName = secondPlayer;
        }

        titleHeader.textContent = `${winnerName.toUpperCase()} WINS 🎉`;
        // show centered overlay
        showOverlay(`${winnerName.toUpperCase()} WINS 🎉`);
    } else {
        titleHeader.textContent = "DRAW";
        showOverlay("DRAW");
    }

    // award points based on which symbol won
    if (winner === humanSymbol && selectedPlayer) {
        players[selectedPlayer] = (players[selectedPlayer] || 0) + 1;
        savePlayers();
        updateScoreDisplay();
    } else if (winner === opponentSymbol) {
        if (gameMode === "ai") {
            aiScore += 1;
            saveAiScore();
            updateScoreDisplay();
        } else if (secondPlayer) {
            players[secondPlayer] = (players[secondPlayer] || 0) + 1;
            savePlayers();
            updateScoreDisplay();
        }
    }

    trainAI(winner); // 🔥 this is the important part
}

function isDraw() {
    return boardState.every(cell => cell !== "");
}

function trainAI(winner) {
    gameMoves.forEach(moveData => {

        if (moveData.player !== AI_PLAYER) return;

        const state = moveData.board;
        const move = moveData.move;

        if (!aiMemory[state]) {
            aiMemory[state] = {};
        }

        if (!aiMemory[state][move]) {
            aiMemory[state][move] = 0;
        }

        // Reward or punish
        if (winner === AI_PLAYER) {
            aiMemory[state][move] += 3;  // reward winning moves
        } else if (winner === "draw") {
            aiMemory[state][move] += 1;  // slight reward
        } else {
            aiMemory[state][move] -= 3;  // punish losing moves
        }

    });

    saveMemory();
    gameMoves = [];
}

function getLearnedMove() {
    const state = boardState.join("");

    if (!aiMemory[state]) return null;

    let bestScore = -Infinity;
    let bestMove = null;

    for (let move in aiMemory[state]) {

        // Only consider empty cells
        if (boardState[move] === "") {

            let score = aiMemory[state][move];

            if (score > bestScore) {
                bestScore = score;
                bestMove = parseInt(move);
            }
        }
    }

    return bestScore > 0 ? bestMove : null;
}
function detectDoubleThreat(player) {
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== "") continue;

        boardState[i] = player;

        let threats = 0;

        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;

        if (countDirection(row, col, 1, 0, player) >= 4) threats++;
        if (countDirection(row, col, 0, 1, player) >= 4) threats++;
        if (countDirection(row, col, 1, 1, player) >= 4) threats++;
        if (countDirection(row, col, 1, -1, player) >= 4) threats++;

        boardState[i] = "";

        if (threats >= 2) {
            return i;
        }
    }

    return null;
}
function findOpenSequenceMove(player, length, requiredOpenEnds) {
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== "") continue;

        boardState[i] = player;
        const isThreat = hasOpenSequence(i, player, length, requiredOpenEnds);
        boardState[i] = "";

        if (isThreat) return i;
    }

    return null;
}

function hasOpenSequence(index, player, length, requiredOpenEnds) {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;

    const directions = [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1]
    ];

    for (let [rDir, cDir] of directions) {
        const info = getLineInfo(row, col, rDir, cDir, player);
        if (info.count >= length && info.openEnds >= requiredOpenEnds) {
            return true;
        }
    }

    return false;
}

function getLineInfo(row, col, rDir, cDir, player) {
    let count = 1;
    let openEnds = 0;

    let r = row + rDir;
    let c = col + cDir;

    while (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        boardState[r * BOARD_SIZE + c] === player
    ) {
        count++;
        r += rDir;
        c += cDir;
    }

    if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        boardState[r * BOARD_SIZE + c] === ""
    ) {
        openEnds++;
    }

    r = row - rDir;
    c = col - cDir;

    while (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        boardState[r * BOARD_SIZE + c] === player
    ) {
        count++;
        r -= rDir;
        c -= cDir;
    }

    if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        boardState[r * BOARD_SIZE + c] === ""
    ) {
        openEnds++;
    }

    return { count, openEnds };
}
function evaluateBoard(player) {
    let score = 0;

    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== player) continue;

        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;

        score += evaluatePosition(row, col, player);
    }

    return score;
}
function evaluatePosition(row, col, player) {
    let total = 0;

    const directions = [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1]
    ];

    for (let [rDir, cDir] of directions) {
        const count = countDirection(row, col, rDir, cDir, player);

        if (count >= 5) total += 100000;       // WIN
        else if (count === 4) total += 10000;  // Open 4
        else if (count === 3) total += 1000;   // 3 in row
        else if (count === 2) total += 100;    // small build
    }

    return total;
}
function minimax(depth, alpha, beta, maximizing) {
    if (depth === 0) {
        return evaluateBoard(AI_PLAYER) - evaluateBoard("X");
    }

    const possibleMoves = getCandidateMoves();

    if (maximizing) {
        let maxEval = -Infinity;

        for (let move of possibleMoves) {
            boardState[move] = AI_PLAYER;

            if (checkWin(move, AI_PLAYER)) {
                boardState[move] = "";
                return 100000;
            }

            let score = minimax(depth - 1, alpha, beta, false);
            boardState[move] = "";

            maxEval = Math.max(maxEval, score);
            alpha = Math.max(alpha, score);

            if (beta <= alpha) break; // Alpha-beta pruning
        }

        return maxEval;
    } else {
        let minEval = Infinity;

        for (let move of possibleMoves) {
            boardState[move] = "X";

            if (checkWin(move, "X")) {
                boardState[move] = "";
                return -100000;
            }

            let score = minimax(depth - 1, alpha, beta, true);
            boardState[move] = "";

            minEval = Math.min(minEval, score);
            beta = Math.min(beta, score);

            if (beta <= alpha) break;
        }

        return minEval;
    }
}
function getCandidateMoves() {
    let moves = [];

    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === "" && hasNeighbor(i)) {
            moves.push(i);
        }
    }

    return moves.length > 0 ? moves : getRandomMoveList();
}

function hasNeighbor(index) {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;

    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            const nr = row + r;
            const nc = col + c;
            if (
                nr >= 0 &&
                nr < BOARD_SIZE &&
                nc >= 0 &&
                nc < BOARD_SIZE &&
                boardState[nr * BOARD_SIZE + nc] !== ""
            ) {
                return true;
            }
        }
    }

    return false;
}

