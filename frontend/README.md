# 🎉 Bingo Bash - Casual Bingo Game

A fun, colorful bingo game built with vanilla JavaScript, HTML, and CSS. Play locally on your laptop with no external dependencies!

## 🎮 Features

### Core Gameplay
- **5×5 Bingo Card** with randomized numbers (1-75)
- **Automatic Number Caller** draws numbers every 3 seconds
- **Interactive Tiles** - click to mark numbers as they're called
- **Smart Bingo Detection** - automatically detects rows, columns, and diagonals
- **Win Animations** - confetti and celebration effects
- **Score Tracking** - keeps track of games won

### Game Mechanics
- **B Column**: Numbers 1-15
- **I Column**: Numbers 16-30
- **N Column**: Numbers 31-45 (with FREE center space)
- **G Column**: Numbers 46-60
- **O Column**: Numbers 61-75

### UI Features
- Bright, casual-game style design
- Large, clickable tiles with hover effects
- Number caller display with timer
- Called numbers history
- Pause/Resume functionality
- Generate new cards anytime

### Audio
- Generated sound effects using Web Audio API
- Number call chimes
- Tile marking sounds
- Victory fanfare
- Error feedback

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required!

### Running the Game

1. **Navigate to the frontend folder:**
   ```bash
   cd /Users/bharti/Bingo/frontend
   ```

2. **Open the game:**
   - **Option 1**: Double-click `index.html` to open in your default browser
   - **Option 2**: Right-click `index.html` → Open With → Choose your browser
   - **Option 3**: Use a local server (recommended for best experience):
     ```bash
     # Python 3
     python3 -m http.server 8080
     
     # Python 2
     python -m SimpleHTTPServer 8000
     
     # Node.js (if you have npx)
     npx http-server
     ```
   - Then open `http://localhost:8000` in your browser

3. **Play!**
   - Click **START GAME** to begin
   - Numbers will be called automatically every 3 seconds
   - Click tiles to mark them when your numbers are called
   - Get 5 in a row (horizontal, vertical, or diagonal) to win!

## 🎯 How to Play

1. **Start**: Click the "START GAME" button
2. **Watch**: Numbers are called automatically and displayed at the top
3. **Mark**: Click on tiles that match called numbers
4. **Win**: Complete a row, column, or diagonal to win!
5. **Play Again**: After winning, click "PLAY AGAIN" for a new game

### Controls
- **START GAME**: Begin calling numbers
- **PAUSE**: Pause/resume the number caller
- **NEW CARD**: Generate a new bingo card

### Tips
- You can only mark numbers that have been called
- The center tile is always FREE and pre-marked
- Watch the called numbers display to see all numbers drawn
- The timer bar shows when the next number will be called

## 📁 Project Structure

```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── game.js             # Core game logic (card generation, bingo detection)
├── ui.js               # UI updates and interactions
├── audio.js            # Sound effects using Web Audio API
├── main.js             # Application controller
└── README.md           # This file
```

## 🏗️ Architecture

### Modular Design
The game is built with clean separation of concerns:

1. **game.js** - `BingoGame` class
   - Card generation with proper number ranges
   - Number calling logic
   - Bingo pattern detection (rows, columns, diagonals)
   - Game state management

2. **ui.js** - `BingoUI` class
   - DOM manipulation
   - Visual updates
   - Animation triggers
   - User interaction handling

3. **audio.js** - `BingoAudio` class
   - Web Audio API sound generation
   - Different sounds for different actions
   - Mute functionality

4. **main.js** - Application Controller
   - Coordinates all modules
   - Event handling
   - Game flow control

## 🎨 Customization

### Change Number Call Speed
Edit `game.js`, line ~10:
```javascript
this.callDelay = 3000; // Change to desired milliseconds
```

### Modify Colors
Edit `styles.css`:
- Background gradient: `body` selector
- Card colors: `.bingo-tile` selector
- Caller display: `.caller-section` selector

### Adjust Sounds
Edit `audio.js`:
- Modify frequencies in `playTone()` calls
- Change durations and volumes
- Add new sound effects

### Enable Auto-Marking
In `main.js`, uncomment lines in `callNumberLoop()`:
```javascript
// Uncomment these lines for automatic marking
game.autoMarkTile(number);
ui.renderCard();
```

## 🚀 Next Features (Suggestions)

### Power-Ups & Boosters
- **Free Daub**: Mark any tile for free
- **Extra Time**: Slow down the caller
- **Double Bingo**: Win with two patterns
- **Magic Wand**: Auto-mark next 3 numbers

### Game Modes
- **Speed Bingo**: Faster number calling
- **Blackout**: Fill entire card
- **Four Corners**: Mark all corner tiles
- **Pattern Bingo**: Custom winning patterns (X, T, L shapes)

### Tournament Mode
- **Leaderboard**: Track high scores
- **Timed Challenges**: Complete in X minutes
- **Multiple Cards**: Play 2-4 cards simultaneously
- **Progressive Jackpot**: Accumulating prizes

### Social Features
- **Multiplayer**: Play with friends locally
- **Chat**: Simple text chat during games
- **Achievements**: Unlock badges and rewards
- **Daily Challenges**: Special objectives

### Visual Enhancements
- **Themes**: Different color schemes (Ocean, Sunset, Neon)
- **Avatars**: Player customization
- **Better Animations**: More elaborate win effects
- **Particle Effects**: Enhanced visual feedback

### Technical Improvements
- **Save Progress**: LocalStorage for stats
- **Settings Panel**: Volume, speed, auto-mark options
- **Responsive Design**: Better mobile support
- **PWA**: Install as desktop app
- **Accessibility**: Screen reader support, keyboard navigation

## 🐛 Troubleshooting

### No Sound?
- Check browser volume settings
- Some browsers require user interaction before playing audio
- Try clicking anywhere on the page first

### Game Not Starting?
- Check browser console (F12) for errors
- Ensure all files are in the same directory
- Try refreshing the page

### Tiles Not Clickable?
- Make sure the game has started
- You can only mark numbers that have been called
- Check that the tile isn't already marked

## 📝 License

This is a completely original implementation created from scratch. No proprietary code, assets, or materials from any existing games were used.

## 🎉 Have Fun!

Enjoy playing Bingo Bash! Feel free to modify and enhance the game as you like.
