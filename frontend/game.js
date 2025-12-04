/**
 * Game Logic Module
 * Handles core bingo game mechanics
 */

class BingoGame {
    constructor() {
        this.card = [];
        this.calledNumbers = [];
        this.markedTiles = new Set();
        this.isGameActive = false;
        this.isPaused = false;
        this.callInterval = null;
        this.callDelay = 4000; // 4 seconds between calls
        this.gamesWon = 0;
        this.currentNumber = null;
        
        // Bingo number ranges for each column
        this.ranges = {
            B: [1, 15],   // B column: 1-15
            I: [16, 30],  // I column: 16-30
            N: [31, 45],  // N column: 31-45
            G: [46, 60],  // G column: 46-60
            O: [61, 75]   // O column: 61-75
        };
    }

    /**
     * Generate a new bingo card
     */
    generateCard() {
        this.card = [];
        this.markedTiles = new Set();
        
        const columns = ['B', 'I', 'N', 'G', 'O'];
        
        for (let col = 0; col < 5; col++) {
            const column = columns[col];
            const [min, max] = this.ranges[column];
            const numbers = this.getRandomNumbers(min, max, 5);
            
            for (let row = 0; row < 5; row++) {
                const index = row * 5 + col;
                
                // Center tile is FREE
                if (row === 2 && col === 2) {
                    this.card[index] = { value: 'FREE', isFree: true };
                    this.markedTiles.add(index);
                } else {
                    this.card[index] = { value: numbers[row], isFree: false };
                }
            }
        }
        
        return this.card;
    }

    /**
     * Get random unique numbers from a range
     */
    getRandomNumbers(min, max, count) {
        const numbers = [];
        const available = [];
        
        for (let i = min; i <= max; i++) {
            available.push(i);
        }
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            numbers.push(available[randomIndex]);
            available.splice(randomIndex, 1);
        }
        
        return numbers;
    }

    /**
     * Start the game
     */
    startGame() {
        this.isGameActive = true;
        this.isPaused = false;
        this.calledNumbers = [];
        this.currentNumber = null;
        
        // Call the first number immediately
        this.callNextNumber();
    }

    /**
     * Pause the game
     */
    pauseGame() {
        this.isPaused = true;
    }

    /**
     * Resume the game
     */
    resumeGame() {
        this.isPaused = false;
    }

    /**
     * Stop the game
     */
    stopGame() {
        this.isGameActive = false;
        this.isPaused = false;
    }

    /**
     * Call the next number
     */
    callNextNumber() {
        // Get all possible numbers (1-75)
        const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
        
        // Filter out already called numbers
        const availableNumbers = allNumbers.filter(num => !this.calledNumbers.includes(num));
        
        if (availableNumbers.length === 0) {
            this.stopGame();
            return null;
        }
        
        // Pick a random number
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const number = availableNumbers[randomIndex];
        
        this.currentNumber = number;
        this.calledNumbers.push(number);
        
        return number;
    }

    /**
     * Mark a tile on the card
     */
    markTile(index) {
        if (!this.isGameActive) return false;
        
        const tile = this.card[index];
        if (!tile || tile.isFree) return false;
        
        // Check if this number has been called
        if (!this.calledNumbers.includes(tile.value)) {
            return false;
        }
        
        // Toggle mark
        if (this.markedTiles.has(index)) {
            this.markedTiles.delete(index);
        } else {
            this.markedTiles.add(index);
        }
        
        return true;
    }

    /**
     * Check for bingo (winning patterns)
     */
    checkBingo() {
        const winningPatterns = [];
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            const indices = [];
            let isWin = true;
            
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                indices.push(index);
                if (!this.markedTiles.has(index)) {
                    isWin = false;
                    break;
                }
            }
            
            if (isWin) {
                winningPatterns.push({ type: 'row', indices, name: `Row ${row + 1}` });
            }
        }
        
        // Check columns
        for (let col = 0; col < 5; col++) {
            const indices = [];
            let isWin = true;
            
            for (let row = 0; row < 5; row++) {
                const index = row * 5 + col;
                indices.push(index);
                if (!this.markedTiles.has(index)) {
                    isWin = false;
                    break;
                }
            }
            
            if (isWin) {
                const columns = ['B', 'I', 'N', 'G', 'O'];
                winningPatterns.push({ type: 'column', indices, name: `Column ${columns[col]}` });
            }
        }
        
        // Check diagonal (top-left to bottom-right)
        let diagonal1 = [];
        let isDiagonal1Win = true;
        for (let i = 0; i < 5; i++) {
            const index = i * 5 + i;
            diagonal1.push(index);
            if (!this.markedTiles.has(index)) {
                isDiagonal1Win = false;
                break;
            }
        }
        if (isDiagonal1Win) {
            winningPatterns.push({ type: 'diagonal', indices: diagonal1, name: 'Diagonal \\' });
        }
        
        // Check diagonal (top-right to bottom-left)
        let diagonal2 = [];
        let isDiagonal2Win = true;
        for (let i = 0; i < 5; i++) {
            const index = i * 5 + (4 - i);
            diagonal2.push(index);
            if (!this.markedTiles.has(index)) {
                isDiagonal2Win = false;
                break;
            }
        }
        if (isDiagonal2Win) {
            winningPatterns.push({ type: 'diagonal', indices: diagonal2, name: 'Diagonal /' });
        }
        
        return winningPatterns;
    }

    /**
     * Reset the game
     */
    reset() {
        this.stopGame();
        this.generateCard();
        this.calledNumbers = [];
        this.currentNumber = null;
    }

    /**
     * Get the letter for a number (B, I, N, G, O)
     */
    getLetterForNumber(number) {
        if (number >= 1 && number <= 15) return 'B';
        if (number >= 16 && number <= 30) return 'I';
        if (number >= 31 && number <= 45) return 'N';
        if (number >= 46 && number <= 60) return 'G';
        if (number >= 61 && number <= 75) return 'O';
        return '';
    }

    /**
     * Auto-mark tiles when numbers are called
     */
    autoMarkTile(number) {
        for (let i = 0; i < this.card.length; i++) {
            const tile = this.card[i];
            if (!tile.isFree && tile.value === number) {
                this.markedTiles.add(i);
                return i;
            }
        }
        return -1;
    }
}
