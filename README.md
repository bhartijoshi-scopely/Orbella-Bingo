# 🎉 Orbella Bingo

An immersive AI-powered bingo experience combining classic bingo gameplay with AI-generated themed environments and interactive 3D visuals.

## ✨ Features

### 🎮 Game Modes
- **Classic Bingo**: Traditional 5×5 bingo with automatic number calling
- **Orbella Room**: AI-generated themed environments with immersive backgrounds
- **Interactive Overlay**: Clickable bingo cards overlaid on 3D scenes

### 🤖 AI Integration
- **Theme-based Video Generation**: AI creates custom background videos
- **Dynamic Card Generation**: AI generates themed bingo card designs
- **Background Removal**: Automatic processing for clean overlays

### 🎨 Visual Features
- Three.js powered 3D environments
- Real-time interactive bingo cards
- Win animations and effects
- Responsive design for all devices

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js (optional, for serving)
- Modern web browser

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd Orbella-Bingo
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start the server
python main.py
```
Server runs on: `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend

# Option A: Direct browser (simple)
open index.html

# Option B: Local server (recommended)
python3 -m http.server 8080
# Then open: http://localhost:8080
```

### 4. Play!
- **Classic Mode**: Click "START GAME" for traditional bingo
- **Orbella Room**: Enter themed AI-generated environments

## 🏗️ Architecture

```
Orbella-Bingo/
├── backend/                 # FastAPI server
│   ├── llm/                # AI prompt management
│   │   ├── prompt.py       # Prompt generators
│   │   └── scenario.py     # AI API clients
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
├── frontend/               # Web application
│   ├── assets/            # Game assets & videos
│   ├── index.html         # Main game interface
│   ├── styles.css         # Styling & animations
│   ├── game.js           # Core bingo logic
│   ├── ui.js             # UI interactions
│   ├── audio.js          # Sound effects
│   ├── orbella.js        # AI room functionality
│   └── main.js           # Application controller
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `backend/` directory:

```bash
# Scenario API (required for AI features)
SCENARIO_API_KEY=your_api_key_here
SCENARIO_API_SECRET=your_api_secret_here

# CORS Configuration (optional)
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### API Endpoints
- `POST /scenario/generate` - Generate themed videos
- `POST /scenario/generate-card` - Generate bingo card designs
- `POST /scenario/generate-ball-caller` - Generate ball caller graphics

## 🎯 Game Mechanics

### Bingo Rules
- **5×5 Grid**: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
- **FREE Center**: Always marked
- **Win Conditions**: Row, column, or diagonal
- **Auto-marking**: Optional feature for accessibility

### Orbella Room Features
- **Theme Input**: Text or image-based themes
- **AI Generation**: Simultaneous video and card creation
- **Interactive Overlay**: Click tiles on generated backgrounds
- **Persistent Storage**: Themes saved across sessions

## 🛠️ Development

### Adding New Themes
1. Modify prompts in `backend/llm/prompt.py`
2. Add theme logic to frontend `orbella.js`
3. Test with various input types

### Customization
- **Calling Speed**: Edit `game.js` call delay
- **Visual Themes**: Modify CSS color schemes
- **Sound Effects**: Adjust audio.js frequency/duration
- **Win Patterns**: Add custom patterns in game logic

### API Integration
The backend integrates with Scenario API for:
- Video generation (8-second themed clips)
- Image generation (bingo cards and UI elements)
- Background removal processing

## 🚨 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.8+ required)
- Verify all requirements installed: `pip install -r requirements.txt`
- Ensure .env file exists with valid API keys

**No AI content generated:**
- Verify Scenario API credentials in .env
- Check network connectivity
- Review backend logs for API errors

**Frontend display issues:**
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify all files are served from same domain

**No sound effects:**
- Click anywhere on page to enable Web Audio
- Check browser and system volume settings
- Some browsers require HTTPS for audio

### Performance Tips
- Use local server instead of file:// protocol
- Clear browser cache if assets don't update
- Monitor backend logs for generation times

## 🎮 Game Controls

### Classic Bingo
- **START GAME**: Begin number calling
- **PAUSE/RESUME**: Control game flow
- **NEW CARD**: Generate fresh bingo card
- **Tile Clicks**: Mark called numbers

### Orbella Room
- **Enter Room**: Access themed environments
- **Reset Theme**: Clear and regenerate
- **New Card**: Keep theme, new numbers

## 📝 License

Open source project - modify and enhance as needed.

## 🎉 Contributing

Feel free to submit issues and enhancement requests!

---

**Enjoy your immersive bingo experience! 🎲**
