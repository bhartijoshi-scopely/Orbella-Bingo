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

### 1. Setup Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --host 0.0.0.0 --port 8000 --reload #use 8001 / 8002 / 8003 when in use
```

### 2. Setup Frontend
```bash
cd frontend  
python3 -m http.server 8080 --bind 127.0.0.1
```

### 3. Play
Open `http://localhost:8080` in your browser!

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

- **Backend won't start**: Check `.env` file has your API keys
- **No AI content**: Verify Scenario API credentials in `.env`
- **Frontend issues**: Make sure backend is running on port 8000

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
