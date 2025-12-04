/**
 * Audio Module
 * Generates sound effects using Web Audio API
 */

class BingoAudio {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        
        // Initialize audio context on user interaction
        this.initAudioContext();
    }

    /**
     * Initialize Web Audio API context
     */
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    /**
     * Resume audio context (required for some browsers)
     */
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Play a tone
     */
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext || this.isMuted) return;
        
        this.resumeContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Play number call sound
     */
    playNumberCall() {
        if (!this.audioContext || this.isMuted) return;
        
        this.resumeContext();
        
        // Pleasant chime sound
        const now = this.audioContext.currentTime;
        
        // First note
        this.playTone(523.25, 0.15, 'sine', 0.3); // C5
        
        // Second note (slightly delayed)
        setTimeout(() => {
            this.playTone(659.25, 0.2, 'sine', 0.3); // E5
        }, 100);
    }

    /**
     * Play daub (mark) sound
     */
    playDaub() {
        if (!this.audioContext || this.isMuted) return;
        
        this.resumeContext();
        
        // Quick pop sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * Play error sound
     */
    playError() {
        if (!this.audioContext || this.isMuted) return;
        
        this.resumeContext();
        
        // Low buzz
        this.playTone(200, 0.2, 'sawtooth', 0.2);
    }

    /**
     * Play win sound
     */
    playWin() {
        if (!this.audioContext || this.isMuted) return;
        
        this.resumeContext();
        
        // Victory fanfare
        const notes = [
            { freq: 523.25, time: 0 },      // C5
            { freq: 659.25, time: 0.15 },   // E5
            { freq: 783.99, time: 0.3 },    // G5
            { freq: 1046.50, time: 0.45 }   // C6
        ];
        
        notes.forEach(note => {
            setTimeout(() => {
                this.playTone(note.freq, 0.3, 'sine', 0.4);
            }, note.time * 1000);
        });
    }

    /**
     * Play button click sound
     */
    playClick() {
        if (!this.audioContext || this.isMuted) return;
        
        this.resumeContext();
        
        this.playTone(600, 0.05, 'sine', 0.2);
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}
