/**
 * Main Application Controller
 * Coordinates game logic, UI, and audio
 */

// Initialize game components
const game = new BingoGame();
const audio = new BingoAudio();
const ui = new BingoUI(game, audio);

// Game state
let numberCallTimeout = null;
let currentScreen = 'welcome';

// Screen elements
const welcomeScreen = document.getElementById('welcomeScreen');
const roomScreen = document.getElementById('roomScreen');
const gameScreen = document.getElementById('gameScreen');

/**
 * Navigate between screens
 */
function showScreen(screenName) {
    // Hide all screens
    welcomeScreen.classList.add('hidden');
    roomScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    
    // Show requested screen
    switch(screenName) {
        case 'welcome':
            welcomeScreen.classList.remove('hidden');
            break;
        case 'room':
            roomScreen.classList.remove('hidden');
            break;
        case 'game':
            gameScreen.classList.remove('hidden');
            break;
    }
    
    currentScreen = screenName;
    audio.playClick();
}

/**
 * Initialize the application
 */
function init() {
    // Generate initial card
    game.generateCard();
    ui.renderCard();
    ui.updateGamesWon();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show welcome screen
    showScreen('welcome');
    
    console.log('🎉 Bingo Bash initialized! Welcome!');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Welcome Screen Buttons
    const playWithFriendsBtn = document.getElementById('playWithFriendsBtn');
    const playAsGuestBtn = document.getElementById('playAsGuestBtn');
    
    if (playWithFriendsBtn) {
        playWithFriendsBtn.addEventListener('click', () => {
            audio.playClick();
            alert('Facebook login would go here! For now, proceeding as guest...');
            showScreen('room');
        });
    }
    
    if (playAsGuestBtn) {
        playAsGuestBtn.addEventListener('click', () => {
            audio.playClick();
            showScreen('room');
        });
    }
    
    // Room Screen Buttons
    const roomCards = document.querySelectorAll('.room-card:not(.locked)');
    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            audio.playClick();
            const roomType = card.dataset.room;
            console.log(`Selected room: ${roomType}`);
            showScreen('game');
            // Auto-start the game
            setTimeout(() => startGame(), 500);
        });
    });
    
    // Home button
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            audio.playClick();
            if (game.isGameActive) {
                game.stopGame();
                if (numberCallTimeout) {
                    clearTimeout(numberCallTimeout);
                }
            }
            showScreen('room');
        });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            audio.playClick();
            alert('Settings panel would go here!');
        });
    }
    
    // Play again button
    ui.playAgainBtn.addEventListener('click', () => {
        audio.playClick();
        playAgain();
    });
    
    // Chat functionality
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message';
            messageEl.innerHTML = `<strong>You:</strong> ${message}`;
            chatMessages.appendChild(messageEl);
            chatInput.value = '';
            
            // Auto-scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            audio.playClick();
            
            // Simulate bot response after 2 seconds
            setTimeout(() => {
                const botMessages = [
                    'Good luck! 🍀',
                    'Nice play! 🎉',
                    'Almost there! 💪',
                    'You got this! ⭐',
                    'Great game! 🎊'
                ];
                const botMessage = botMessages[Math.floor(Math.random() * botMessages.length)];
                const botEl = document.createElement('div');
                botEl.className = 'chat-message';
                botEl.innerHTML = `<strong>Player:</strong> ${botMessage}`;
                chatMessages.appendChild(botEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 2000);
        }
    }
    
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
}

/**
 * Start the game
 */
function startGame() {
    game.startGame();
    ui.clearCalledNumbers();
    
    // Start the number calling loop
    callNumberLoop();
}

/**
 * Number calling loop
 */
function callNumberLoop() {
    if (!game.isGameActive) return;
    
    if (!game.isPaused) {
        // Get the current number (already called by game.startGame or previous loop)
        const number = game.currentNumber;
        
        if (number !== null) {
            // Update UI
            ui.updateCurrentNumber(number);
            ui.startTimer(game.callDelay);
            
            // Play sound
            audio.playNumberCall();
        }
        
        // Call the next number for the next iteration
        game.callNextNumber();
    }
    
    // Schedule next call
    if (game.isGameActive) {
        numberCallTimeout = setTimeout(callNumberLoop, game.callDelay);
    }
}

/**
 * Generate new card
 */
function generateNewCard() {
    // Stop current game if active
    if (game.isGameActive) {
        game.stopGame();
        if (numberCallTimeout) {
            clearTimeout(numberCallTimeout);
        }
    }
    
    // Generate new card
    game.generateCard();
    ui.renderCard();
    ui.clearCalledNumbers();
    ui.stopTimer();
}

/**
 * Play again after win
 */
function playAgain() {
    ui.hideWinModal();
    
    // Generate new card and reset
    game.reset();
    ui.renderCard();
    ui.clearCalledNumbers();
    ui.stopTimer();
    
    // Auto-start new game
    setTimeout(() => startGame(), 500);
}

/**
 * Handle page unload (cleanup)
 */
window.addEventListener('beforeunload', () => {
    if (game.isGameActive) {
        game.stopGame();
    }
    if (numberCallTimeout) {
        clearTimeout(numberCallTimeout);
    }
});

// Initialize the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
