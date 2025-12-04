/**
 * UI Module
 * Handles all UI updates and interactions
 */

class BingoUI {
    constructor(game, audio) {
        this.game = game;
        this.audio = audio;
        
        // DOM elements
        this.bingoCardEl = document.getElementById('bingoCard');
        this.winModal = document.getElementById('winModal');
        this.winPatternEl = document.getElementById('winPattern');
        this.confettiContainer = document.getElementById('confetti');
        
        // Buttons
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        this.timerInterval = null;
        this.lastCalledNumbers = [];
    }

    /**
     * Render the bingo card
     */
    renderCard() {
        this.bingoCardEl.innerHTML = '';
        
        this.game.card.forEach((tile, index) => {
            const tileEl = document.createElement('div');
            tileEl.className = 'bingo-tile';
            tileEl.dataset.index = index;
            
            if (tile.isFree) {
                tileEl.classList.add('free');
                tileEl.textContent = 'FREE';
            } else {
                tileEl.textContent = tile.value;
            }
            
            if (this.game.markedTiles.has(index)) {
                tileEl.classList.add('marked');
            }
            
            // Add click handler
            tileEl.addEventListener('click', () => this.handleTileClick(index));
            
            this.bingoCardEl.appendChild(tileEl);
        });
    }

    /**
     * Handle tile click
     */
    handleTileClick(index) {
        const tile = this.game.card[index];
        
        if (tile.isFree) return;
        
        if (this.game.markTile(index)) {
            this.audio.playDaub();
            this.renderCard();
            
            // Check for bingo
            const winningPatterns = this.game.checkBingo();
            if (winningPatterns.length > 0) {
                this.handleWin(winningPatterns);
            }
        } else {
            this.audio.playError();
        }
    }

    /**
     * Update the current number display
     */
    updateCurrentNumber(number) {
        if (number === null) return;
        
        const letter = this.game.getLetterForNumber(number);
        
        // Store in history
        this.lastCalledNumbers.unshift(number);
        if (this.lastCalledNumbers.length > 6) {
            this.lastCalledNumbers.pop();
        }
        
        // Ball order: [Current=newest⭐] [1] [2] [3] [4] [5=oldest]
        // Shift all balls right (push older numbers to the right)
        
        // Shift ball 4 → ball 5, ball 3 → ball 4, ball 2 → ball 3, ball 1 → ball 2
        for (let i = 5; i >= 2; i--) {
            const sourceBall = document.getElementById(`ball${i-1}`);
            const sourceBallLetter = document.getElementById(`ballLetter${i-1}`);
            const targetBall = document.getElementById(`ball${i}`);
            const targetBallLetter = document.getElementById(`ballLetter${i}`);
            const targetContainer = targetBall?.parentElement;
            
            if (sourceBall && targetBall && targetContainer) {
                const sourceText = sourceBall.textContent;
                const sourceLetterText = sourceBallLetter.textContent;
                
                targetBall.textContent = sourceText;
                targetBallLetter.textContent = sourceLetterText;
                
                if (sourceText && sourceLetterText) {
                    targetContainer.setAttribute('data-letter', sourceLetterText);
                    targetContainer.classList.remove('empty');
                } else {
                    targetContainer.setAttribute('data-letter', '');
                    targetContainer.classList.add('empty');
                }
            }
        }
        
        // Move current ball to ball1 position
        const ball1 = document.getElementById('ball1');
        const ballLetter1 = document.getElementById('ballLetter1');
        const ball1Container = ball1?.parentElement;
        const ballCurrent = document.getElementById('ballCurrent');
        const ballLetterCurrent = document.getElementById('ballLetterCurrent');
        
        if (ball1 && ballLetter1 && ball1Container && ballCurrent && ballLetterCurrent) {
            const currentText = ballCurrent.textContent;
            const currentLetterText = ballLetterCurrent.textContent;
            
            if (currentText && currentLetterText) {
                ball1.textContent = currentText;
                ballLetter1.textContent = currentLetterText;
                ball1Container.setAttribute('data-letter', currentLetterText);
                ball1Container.classList.remove('empty');
            }
        }
        
        // Update current ball with new number (leftmost position)
        const currentBallContainer = ballCurrent?.parentElement;
        
        if (ballCurrent && ballLetterCurrent && currentBallContainer) {
            ballCurrent.textContent = number;
            ballLetterCurrent.textContent = letter;
            currentBallContainer.setAttribute('data-letter', letter);
            currentBallContainer.classList.remove('empty');
        }
    }

    /**
     * Clear called numbers display
     */
    clearCalledNumbers() {
        this.lastCalledNumbers = [];
    }

    /**
     * Start timer animation
     */
    startTimer(duration) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        let elapsed = 0;
        const step = 100; // Update every 100ms
        
        const powerFill = document.getElementById('powerFill');
        if (!powerFill) return;
        
        powerFill.style.width = '0%';
        
        this.timerInterval = setInterval(() => {
            if (this.game.isPaused) return;
            
            elapsed += step;
            const progress = (elapsed / duration) * 100;
            powerFill.style.width = `${Math.min(progress, 100)}%`;
            
            if (elapsed >= duration) {
                clearInterval(this.timerInterval);
                powerFill.style.width = '0%';
            }
        }, step);
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        const powerFill = document.getElementById('powerFill');
        if (powerFill) {
            powerFill.style.width = '0%';
        }
    }

    /**
     * Update games won counter
     */
    updateGamesWon() {
        // Games won is now tracked in the game state
        // Could update a display if needed
    }

    /**
     * Handle win
     */
    handleWin(winningPatterns) {
        this.game.stopGame();
        this.game.gamesWon++;
        this.updateGamesWon();
        
        this.audio.playWin();
        
        // Highlight winning tiles
        winningPatterns.forEach(pattern => {
            pattern.indices.forEach(index => {
                const tile = this.bingoCardEl.querySelector(`[data-index="${index}"]`);
                if (tile) {
                    tile.classList.add('winning');
                }
            });
        });
        
        // Show win modal
        setTimeout(() => {
            this.showWinModal(winningPatterns);
        }, 1000);
    }

    /**
     * Show win modal
     */
    showWinModal(winningPatterns) {
        const patternNames = winningPatterns.map(p => p.name).join(', ');
        this.winPatternEl.textContent = `Winning Pattern: ${patternNames}`;
        
        this.winModal.classList.add('show');
        this.createConfetti();
    }

    /**
     * Hide win modal
     */
    hideWinModal() {
        this.winModal.classList.remove('show');
        this.confettiContainer.innerHTML = '';
    }

    /**
     * Create confetti animation
     */
    createConfetti() {
        const colors = ['#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#ffecd2', '#fcb69f'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 3}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            this.confettiContainer.appendChild(confetti);
        }
    }

}
