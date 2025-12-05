#!/usr/bin/env python3
"""
Video Background Removal Script
Removes solid color backgrounds from video files and creates transparent WebM output
"""

import subprocess
import sys
import os

def check_ffmpeg():
    """Check if FFmpeg is installed"""
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def install_ffmpeg_instructions():
    """Provide instructions to install FFmpeg"""
    print("\n❌ FFmpeg is not installed!")
    print("\n📦 To install FFmpeg, run:")
    print("\n  Option 1 - Using Homebrew (recommended):")
    print("    /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
    print("    brew install ffmpeg")
    print("\n  Option 2 - Download from:")
    print("    https://ffmpeg.org/download.html")
    print("\n  Option 3 - Use online tool:")
    print("    https://www.unscreen.com (automatic background removal)")
    print("    https://ezgif.com/video-to-gif (then gif-to-video)")
    sys.exit(1)

def remove_background_chromakey(input_file, output_file, color_hex, similarity=0.3, blend=0.1):
    """
    Remove background using chromakey filter
    
    Args:
        input_file: Input video path
        output_file: Output video path (WebM with alpha)
        color_hex: Hex color of background to remove (e.g., '0x2a3a4f')
        similarity: Color similarity threshold (0.01-1.0)
        blend: Blending threshold (0.0-1.0)
    """
    cmd = [
        'ffmpeg',
        '-i', input_file,
        '-vf', f"chromakey={color_hex}:{similarity}:{blend},format=yuva420p",
        '-c:v', 'libvpx-vp9',
        '-b:v', '0',
        '-crf', '30',
        '-pix_fmt', 'yuva420p',
        '-an',  # Remove audio
        '-y',  # Overwrite output
        output_file
    ]
    
    print(f"Processing {os.path.basename(input_file)}...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ Created: {os.path.basename(output_file)}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error processing {input_file}")
        print(f"Error: {e.stderr}")
        return False

def process_videos():
    """Process all three navigation icon videos"""
    
    # Check FFmpeg
    if not check_ffmpeg():
        install_ffmpeg_instructions()
    
    # Define video files and their background colors (estimated from screenshot)
    videos = [
        {
            'input': 'assets/videos/fire-icon.mp4',
            'output': 'assets/videos/fire-icon-transparent.webm',
            'color': '0x5a3a4f',  # Dark purplish background
            'similarity': 0.4,
            'blend': 0.15
        },
        {
            'input': 'assets/videos/bingo-card-icon.mp4',
            'output': 'assets/videos/bingo-card-icon-transparent.webm',
            'color': '0x4a4a3f',  # Dark greenish background
            'similarity': 0.4,
            'blend': 0.15
        },
        {
            'input': 'assets/videos/dice-icon.mp4',
            'output': 'assets/videos/dice-icon-transparent.webm',
            'color': '0x5a4a5f',  # Dark purple background
            'similarity': 0.4,
            'blend': 0.15
        }
    ]
    
    print("\n🎬 Starting background removal process...\n")
    
    success_count = 0
    for video in videos:
        if os.path.exists(video['input']):
            if remove_background_chromakey(
                video['input'],
                video['output'],
                video['color'],
                video['similarity'],
                video['blend']
            ):
                success_count += 1
        else:
            print(f"⚠️  File not found: {video['input']}")
    
    print(f"\n✨ Processed {success_count} out of {len(videos)} videos")
    
    if success_count > 0:
        print("\n📝 Next steps:")
        print("1. Check the generated *-transparent.webm files")
        print("2. If backgrounds aren't fully removed, try the online tool:")
        print("   https://www.unscreen.com")
        print("3. Rename files to:")
        print("   - fire-icon.webm")
        print("   - bingo-card-icon.webm")
        print("   - dice-icon.webm")
        print("4. Refresh your browser to see the changes!")

if __name__ == '__main__':
    try:
        process_videos()
    except KeyboardInterrupt:
        print("\n\n⛔ Process cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
