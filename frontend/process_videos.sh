#!/bin/bash
# Video Background Removal Script
# This script will help locate FFmpeg and process your videos

echo "🔍 Searching for FFmpeg..."
echo ""

# Check common locations
FFMPEG_PATH=""

# Check Downloads folder first
if [ -f "$HOME/Downloads/ffmpeg" ]; then
    FFMPEG_PATH="$HOME/Downloads/ffmpeg"
elif [ -f "/usr/local/bin/ffmpeg" ]; then
    FFMPEG_PATH="/usr/local/bin/ffmpeg"
elif [ -f "/opt/homebrew/bin/ffmpeg" ]; then
    FFMPEG_PATH="/opt/homebrew/bin/ffmpeg"
elif [ -f "$HOME/ffmpeg" ]; then
    FFMPEG_PATH="$HOME/ffmpeg"
elif command -v ffmpeg &> /dev/null; then
    FFMPEG_PATH=$(which ffmpeg)
fi

if [ -z "$FFMPEG_PATH" ]; then
    echo "❌ FFmpeg not found in common locations"
    echo ""
    echo "Please tell me where you installed FFmpeg:"
    echo "  - Check your Downloads folder"
    echo "  - Or provide the full path to the ffmpeg executable"
    echo ""
    echo "Example paths:"
    echo "  /usr/local/bin/ffmpeg"
    echo "  /opt/homebrew/bin/ffmpeg"
    echo "  ~/Downloads/ffmpeg"
    exit 1
fi

echo "✅ Found FFmpeg at: $FFMPEG_PATH"
echo ""

# Get version
$FFMPEG_PATH -version | head -1
echo ""

# Process videos
echo "🎬 Processing videos..."
echo ""

cd "$(dirname "$0")/assets/videos" || exit

# Fire icon - remove dark background
echo "Processing fire-icon.mp4..."
$FFMPEG_PATH -i fire-icon.mp4 \
  -vf "chromakey=0x2a3a4f:0.4:0.15,format=yuva420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 30 \
  -pix_fmt yuva420p -an -y \
  fire-icon.webm 2>&1 | grep -E "(frame=|size=|time=)" | tail -1

# Bingo card icon - remove dark background  
echo "Processing bingo-card-icon.mp4..."
$FFMPEG_PATH -i bingo-card-icon.mp4 \
  -vf "chromakey=0x4a4a3f:0.4:0.15,format=yuva420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 30 \
  -pix_fmt yuva420p -an -y \
  bingo-card-icon.webm 2>&1 | grep -E "(frame=|size=|time=)" | tail -1

# Dice icon - remove dark background
echo "Processing dice-icon.mp4..."
$FFMPEG_PATH -i dice-icon.mp4 \
  -vf "chromakey=0x5a4a5f:0.4:0.15,format=yuva420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 30 \
  -pix_fmt yuva420p -an -y \
  dice-icon.webm 2>&1 | grep -E "(frame=|size=|time=)" | tail -1

echo ""
echo "✨ Done! Created transparent WebM files:"
ls -lh *.webm 2>/dev/null || echo "⚠️  No WebM files found - check for errors above"
echo ""
echo "📝 Next steps:"
echo "1. Check the generated .webm files"
echo "2. Refresh your browser to see the changes!"
