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
let isMuted = false;
let currentProfileAnimal = '🦊'; // Default fox
let currentLevel = 1;

// Animal profiles with unlock levels
const animalProfiles = [
    { emoji: '🦊', level: 0, name: 'Fox' },
    { emoji: '🐶', level: 0, name: 'Dog' },
    { emoji: '🐱', level: 0, name: 'Cat' },
    { emoji: '🐼', level: 0, name: 'Panda' },
    { emoji: '🐻', level: 2, name: 'Bear' },
    { emoji: '🐨', level: 3, name: 'Koala' },
    { emoji: '🐯', level: 5, name: 'Tiger' },
    { emoji: '🦁', level: 7, name: 'Lion' },
    { emoji: '🐷', level: 8, name: 'Pig' },
    { emoji: '🐸', level: 10, name: 'Frog' },
    { emoji: '🐵', level: 12, name: 'Monkey' },
    { emoji: '🐧', level: 15, name: 'Penguin' },
    { emoji: '🦉', level: 18, name: 'Owl' },
    { emoji: '🐦', level: 20, name: 'Bird' },
    { emoji: '🦄', level: 25, name: 'Unicorn' },
    { emoji: '🐉', level: 30, name: 'Dragon' }
];

// Screen elements
const welcomeScreen = document.getElementById('welcomeScreen');
const roomScreen = document.getElementById('roomScreen');
const gameScreen = document.getElementById('gameScreen');
const orbellaScreen = document.getElementById('orbellaScreen');

/**
 * Navigate between screens
 */
function showScreen(screenName) {
    // Hide all screens
    welcomeScreen.classList.add('hidden');
    roomScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    if (orbellaScreen) orbellaScreen.classList.add('hidden');
    
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
        case 'orbella':
            if (orbellaScreen) orbellaScreen.classList.remove('hidden');
            if (window.enterOrbellaRoom) {
                try { window.enterOrbellaRoom(); } catch (_) {}
            }
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
    
    // Set random animal profile picture
    setRandomAnimalProfile();
    
    // Initialize profile grid
    initializeProfileGrid();
    
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
    // Tab system
    setupTabSystem();
    
    // Navigation arrows
    setupNavigationArrows();
    
    // Settings dropdown
    setupSettingsDropdown();
    
    // Profile dropdown
    setupProfileDropdown();
    
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
    
    // Room Screen Buttons - Setup dynamically
    setupRoomCards();
    
    // Home button (game)
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

    // Home button (Orbella)
    const orbellaHomeBtn = document.getElementById('orbellaHomeBtn');
    if (orbellaHomeBtn) {
        orbellaHomeBtn.addEventListener('click', () => {
            audio.playClick();
            if (window.leaveOrbellaRoom) {
                try { window.leaveOrbellaRoom(); } catch (_) {}
            }
            showScreen('room');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const settingsContainer = document.querySelector('.settings-container');
        const profileContainer = document.querySelector('.profile-level-container');
        
        if (settingsContainer && !settingsContainer.contains(e.target)) {
            closeSettingsDropdown();
        }
        
        if (profileContainer && !profileContainer.contains(e.target)) {
            closeProfileDropdown();
        }
    });
    
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
 * Setup tab system for switching between What's Hot and Bingo Rooms
 */
function setupTabSystem() {
    const whatsHotTab = document.getElementById('whatsHotTab');
    const bingoRoomsTab = document.getElementById('bingoRoomsTab');
    const miniGamesTab = document.getElementById('miniGamesTab');
    
    const whatsHotContent = document.getElementById('whatsHotContent');
    const bingoRoomsContent = document.getElementById('bingoRoomsContent');
    
    // What's Hot tab
    if (whatsHotTab) {
        whatsHotTab.addEventListener('click', () => {
            if (!isMuted) audio.playClick();
            
            // Update active tab
            whatsHotTab.classList.add('active');
            bingoRoomsTab.classList.remove('active');
            miniGamesTab.classList.remove('active');
            
            // Show/hide content
            whatsHotContent.classList.remove('hidden');
            bingoRoomsContent.classList.add('hidden');
            
            // Show arrows so user can navigate between rooms
            updateArrowVisibility(true);
            
            // Re-setup room cards for the new view
            setupRoomCards();
        });
    }
    
    // Bingo Rooms tab
    if (bingoRoomsTab) {
        bingoRoomsTab.addEventListener('click', () => {
            if (!isMuted) audio.playClick();
            
            // Update active tab
            whatsHotTab.classList.remove('active');
            bingoRoomsTab.classList.add('active');
            miniGamesTab.classList.remove('active');
            
            // Show/hide content
            whatsHotContent.classList.add('hidden');
            bingoRoomsContent.classList.remove('hidden');
            
            // Show arrows for Bingo Rooms (6 cards)
            updateArrowVisibility(true);
            
            // Re-setup room cards for the new view
            setupRoomCards();
        });
    }
    
    // Mini Games tab
    if (miniGamesTab) {
        miniGamesTab.addEventListener('click', () => {
            if (!isMuted) audio.playClick();
            
            // Show unlock message
            alert('🎮 Mini Games\n\nUnlocks at Level 80!\n\nKeep playing to reach this level and unlock exciting mini games!');
        });
    }
    
    // Initialize - show arrows on default tab so user can navigate rooms
    updateArrowVisibility(true);
}

/**
 * Setup room cards event listeners
 */
function setupRoomCards() {
    const roomCards = document.querySelectorAll('.room-card:not(.locked)');
    roomCards.forEach(card => {
        // Remove existing listeners by cloning
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);

        newCard.addEventListener('click', () => {
            audio.playClick();
            const roomType = newCard.dataset.room;
            console.log(`Selected room: ${roomType}`);

            if (roomType === 'orbella') {
                // Normal game should not be running
                if (game.isGameActive) {
                    game.stopGame();
                    if (numberCallTimeout) {
                        clearTimeout(numberCallTimeout);
                    }
                }
                // Ensure compact mode is off for Orbella
                gameScreen.classList.remove('game-compact');
                showScreen('orbella');
                if (window.enterOrbellaRoom) {
                    try { window.enterOrbellaRoom(); } catch (_) {}
                }
                return;
            }

            // Classic / Adventure and others use compact mode
            if (roomType === 'classic' || roomType === 'adventure') {
                gameScreen.classList.add('game-compact');
            } else {
                gameScreen.classList.remove('game-compact');
            }

            showScreen('game');
            // Auto-start the game
            setTimeout(() => startGame(), 500);
        });
    });
}

/**
 * Setup navigation arrows for scrolling through cards
 */
function setupNavigationArrows() {
    const navLeft = document.getElementById('navLeft');
    const navRight = document.getElementById('navRight');
    
    if (navLeft) {
        navLeft.addEventListener('click', () => {
            if (!isMuted) audio.playClick();
            const activeContent = document.querySelector('.tab-content:not(.hidden)');
            if (activeContent) {
                const roomCardsContainer = activeContent.querySelector('.room-cards');
                if (roomCardsContainer) {
                    // Scroll by one card width + gap
                    const scrollAmount = 280; // 250px card + 30px gap
                    roomCardsContainer.scrollBy({
                        left: -scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }
    
    if (navRight) {
        navRight.addEventListener('click', () => {
            if (!isMuted) audio.playClick();
            const activeContent = document.querySelector('.tab-content:not(.hidden)');
            if (activeContent) {
                const roomCardsContainer = activeContent.querySelector('.room-cards');
                if (roomCardsContainer) {
                    // Scroll by one card width + gap
                    const scrollAmount = 280; // 250px card + 30px gap
                    roomCardsContainer.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }
}

/**
 * Update arrow visibility based on active tab
 */
function updateArrowVisibility(show) {
    const navLeft = document.getElementById('navLeft');
    const navRight = document.getElementById('navRight');
    
    if (navLeft && navRight) {
        if (show) {
            navLeft.classList.remove('hidden');
            navRight.classList.remove('hidden');
        } else {
            navLeft.classList.add('hidden');
            navRight.classList.add('hidden');
        }
    }
}

/**
 * Setup settings dropdown functionality
 */
function setupSettingsDropdown() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const settingsDropdownClose = document.getElementById('settingsDropdownClose');
    const muteToggle = document.getElementById('muteToggle');
    const muteIcon = document.getElementById('muteIcon');
    const muteLabel = document.getElementById('muteLabel');
    
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isMuted) audio.playClick();
            
            // Toggle dropdown
            const isHidden = settingsDropdown.classList.contains('hidden');
            
            if (isHidden) {
                settingsDropdown.classList.remove('hidden');
                settingsBtn.classList.add('active');
                // Close profile dropdown if open
                closeProfileDropdown();
            } else {
                closeSettingsDropdown();
            }
        });
    }
    
    // Close button
    if (settingsDropdownClose) {
        settingsDropdownClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isMuted) audio.playClick();
            closeSettingsDropdown();
        });
    }
    
    if (muteToggle) {
        muteToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            isMuted = !isMuted;
            
            // Update icon and label
            if (isMuted) {
                muteIcon.textContent = '🔇'; // Muted icon
                muteLabel.textContent = 'Sound: OFF';
                audio.masterVolume = 0;
            } else {
                muteIcon.textContent = '🔊'; // Unmuted icon
                muteLabel.textContent = 'Sound: ON';
                audio.masterVolume = 1;
                audio.playClick(); // Play click sound when unmuting
            }
        });
    }
}

function closeSettingsDropdown() {
    const settingsDropdown = document.getElementById('settingsDropdown');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (settingsDropdown && !settingsDropdown.classList.contains('hidden')) {
        settingsDropdown.classList.add('hidden');
        settingsBtn.classList.remove('active');
    }
}

/**
 * Setup profile dropdown functionality
 */
function setupProfileDropdown() {
    const profileLevelSection = document.getElementById('profileLevelSection');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileDropdownClose = document.getElementById('profileDropdownClose');
    
    if (profileLevelSection && profileDropdown) {
        profileLevelSection.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isMuted) audio.playClick();
            
            // Toggle dropdown
            const isHidden = profileDropdown.classList.contains('hidden');
            
            if (isHidden) {
                profileDropdown.classList.remove('hidden');
                // Close settings dropdown if open
                closeSettingsDropdown();
            } else {
                closeProfileDropdown();
            }
        });
    }
    
    // Close button
    if (profileDropdownClose) {
        profileDropdownClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isMuted) audio.playClick();
            closeProfileDropdown();
        });
    }
}

function closeProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
        profileDropdown.classList.add('hidden');
    }
}

/**
 * Initialize profile grid with animals
 */
function initializeProfileGrid() {
    const profileGrid = document.getElementById('profileGrid');
    
    if (profileGrid) {
        profileGrid.innerHTML = '';
        
        animalProfiles.forEach(animal => {
            const option = document.createElement('div');
            option.className = 'profile-option';
            option.textContent = animal.emoji;
            option.dataset.emoji = animal.emoji;
            option.dataset.level = animal.level;
            option.title = `${animal.name} ${animal.level > 0 ? `(Level ${animal.level})` : ''}`;
            
            // Check if locked
            if (animal.level > currentLevel) {
                option.classList.add('locked');
            } else {
                option.addEventListener('click', () => selectProfile(animal.emoji));
            }
            
            // Mark current selection
            if (animal.emoji === currentProfileAnimal) {
                option.classList.add('selected');
            }
            
            profileGrid.appendChild(option);
        });
    }
}

/**
 * Select a profile animal
 */
function selectProfile(emoji) {
    if (!isMuted) audio.playClick();
    
    currentProfileAnimal = emoji;
    
    // Update profile pic
    const profilePic = document.getElementById('profilePic');
    if (profilePic) {
        profilePic.textContent = emoji;
    }
    
    // Update grid selection
    const allOptions = document.querySelectorAll('.profile-option');
    allOptions.forEach(opt => {
        if (opt.dataset.emoji === emoji) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    // Close dropdown
    closeProfileDropdown();
}

/**
 * Set random animal profile picture
 */
function setRandomAnimalProfile() {
    // Choose from unlocked animals only
    const unlockedAnimals = animalProfiles.filter(a => a.level <= currentLevel);
    const randomAnimal = unlockedAnimals[Math.floor(Math.random() * unlockedAnimals.length)];
    
    currentProfileAnimal = randomAnimal.emoji;
    
    const profilePic = document.getElementById('profilePic');
    if (profilePic) {
        profilePic.textContent = currentProfileAnimal;
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
