'use strict';

/**
 * Orbella Room - Redesigned with persistent storage and interactive bingo
 * Features:
 * - Local storage for generated assets
 * - Three.js video background with card overlay
 * - Persistent theme across sessions
 * - Interactive bingo gameplay
 */

class OrbellaRoom {
    constructor() {
        // Storage keys
        this.STORAGE_KEYS = {
            VIDEO_URL: 'orbella_video_url',
            CARD_URL: 'orbella_card_url',
            THEME: 'orbella_theme',
            BINGO_CARD: 'orbella_bingo_card',
            MARKED_TILES: 'orbella_marked_tiles',
            CALLED_NUMBERS: 'orbella_called_numbers'
        };

        // UI elements
        this.statusEl = document.getElementById('orbellaStatus');
        this.mainEl = document.getElementById('orbellaMain');
        this.modalEl = document.getElementById('orbellaModal');
        this.modalCloseBtn = document.getElementById('orbellaModalClose');
        this.modalGenerateBtn = document.getElementById('orbellaModalGenerate');
        this.modalTextArea = document.getElementById('orbellaModalText');

        // Three.js components
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.videoMesh = null;
        this.videoTexture = null;
        this.videoElement = null;
        this.animationId = null;

        // Bingo game state
        this.bingoCard = [];
        this.markedTiles = new Set();
        this.calledNumbers = [];
        this.isGameActive = false;

        // Bingo ranges (same as main game)
        this.ranges = {
            B: [1, 15],   // B column: 1-15
            I: [16, 30],  // I column: 16-30
            N: [31, 45],  // N column: 31-45
            G: [46, 60],  // G column: 46-60
            O: [61, 75]   // O column: 61-75
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredAssets();
    }

    setupEventListeners() {
        if (this.modalCloseBtn) {
            this.modalCloseBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.modalGenerateBtn) {
            this.modalGenerateBtn.addEventListener('click', () => this.generateNewAssets());
        }

        // Add reset button functionality
        const resetBtn = document.getElementById('orbellaResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetTheme());
        }

        // Add new card button functionality  
        const newCardBtn = document.getElementById('orbellaNewCardBtn');
        if (newCardBtn) {
            newCardBtn.addEventListener('click', () => this.generateNewCard());
        }

        // Add dropdown toggle functionality
        const dropdownToggle = document.getElementById('orbellaDropdownToggle');
        const dropdownContent = document.getElementById('orbellaDropdownContent');
        if (dropdownToggle && dropdownContent) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownContent.classList.toggle('hidden');
                // Rotate arrow
                dropdownToggle.style.transform = dropdownContent.classList.contains('hidden')
                    ? 'rotate(0deg)'
                    : 'rotate(180deg)';
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdownToggle.contains(e.target) && !dropdownContent.contains(e.target)) {
                    dropdownContent.classList.add('hidden');
                    dropdownToggle.style.transform = 'rotate(0deg)';
                }
            });
        }

        window.addEventListener('resize', () => this.handleResize());
    }

    // === LOCAL STORAGE MANAGEMENT ===

    saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    loadFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    clearStorage() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        // Also clear ball caller URLs
        localStorage.removeItem('orbella_ball_caller_url');
        localStorage.removeItem('orbella_original_ball_caller_url');
    }

    // === ASSET MANAGEMENT ===

    async loadStoredAssets() {
        const videoUrl = this.loadFromStorage(this.STORAGE_KEYS.VIDEO_URL);
        const cardUrl = this.loadFromStorage(this.STORAGE_KEYS.CARD_URL);
        const ballCallerUrl = this.loadFromStorage('orbella_ball_caller_url');
        const theme = this.loadFromStorage(this.STORAGE_KEYS.THEME);
        const bingoCard = this.loadFromStorage(this.STORAGE_KEYS.BINGO_CARD);
        const markedTiles = this.loadFromStorage(this.STORAGE_KEYS.MARKED_TILES);
        const calledNumbers = this.loadFromStorage(this.STORAGE_KEYS.CALLED_NUMBERS);

        if (videoUrl || cardUrl) {
            this.setStatus(`Loaded theme: "${theme || 'Unknown'}"`);

            // Restore bingo game state
            if (bingoCard) {
                this.bingoCard = bingoCard;
                this.markedTiles = new Set(markedTiles || []);
                this.calledNumbers = calledNumbers || [];
            } else {
                this.generateBingoCard();
            }

            // Show the main interface
            this.showMainInterface();

            // Setup Three.js scene with ball caller
            await this.setupThreeJsScene(videoUrl, cardUrl, ballCallerUrl);

            // Show reset button and new card button
            this.showResetButton();
            this.showNewCardButton();
        } else {
            // No stored assets, show modal for first time setup
            this.openModal();
        }
    }

    showResetButton() {
        const resetBtn = document.getElementById('orbellaResetBtn');
        if (resetBtn) {
            resetBtn.classList.remove('hidden');
        }
    }

    hideResetButton() {
        const resetBtn = document.getElementById('orbellaResetBtn');
        if (resetBtn) {
            resetBtn.classList.add('hidden');
        }
    }

    showNewCardButton() {
        const newCardBtn = document.getElementById('orbellaNewCardBtn');
        if (newCardBtn) {
            newCardBtn.classList.remove('hidden');
        }
    }

    hideNewCardButton() {
        const newCardBtn = document.getElementById('orbellaNewCardBtn');
        if (newCardBtn) {
            newCardBtn.classList.add('hidden');
        }
    }

    resetTheme() {
        this.clearStorage();
        this.cleanup();
        this.hideResetButton();
        this.hideNewCardButton();
        this.openModal();
        this.setStatus('Ready to generate new theme');
    }

    // === BINGO GAME LOGIC ===

    generateBingoCard() {
        // Reset everything for a completely fresh card
        this.bingoCard = [];
        this.markedTiles = new Set();

        const columns = ['B', 'I', 'N', 'G', 'O'];

        for (let col = 0; col < 5; col++) {
            const column = columns[col];
            const [min, max] = this.ranges[column];
            const numbers = this.getRandomNumbers(min, max, 5);

            for (let row = 0; row < 5; row++) {
                const index = row * 5 + col;

                // Center tile is FREE and automatically marked
                if (row === 2 && col === 2) {
                    this.bingoCard[index] = { value: 'FREE', isFree: true };
                    this.markedTiles.add(index);
                } else {
                    this.bingoCard[index] = { value: numbers[row], isFree: false };
                }
            }
        }

        // Save fresh state to storage immediately
        this.saveToStorage(this.STORAGE_KEYS.BINGO_CARD, this.bingoCard);
        this.saveToStorage(this.STORAGE_KEYS.MARKED_TILES, Array.from(this.markedTiles));

        return this.bingoCard;
    }

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

    markTile(index) {
        // Use the enhanced toggle method
        return this.toggleTileMark(index);
    }

    checkBingo() {
        const winningPatterns = [];

        // Check rows
        for (let row = 0; row < 5; row++) {
            let isWin = true;
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                if (!this.markedTiles.has(index)) {
                    isWin = false;
                    break;
                }
            }
            if (isWin) {
                winningPatterns.push({ type: 'row', name: `Row ${row + 1}` });
            }
        }

        // Check columns
        for (let col = 0; col < 5; col++) {
            let isWin = true;
            for (let row = 0; row < 5; row++) {
                const index = row * 5 + col;
                if (!this.markedTiles.has(index)) {
                    isWin = false;
                    break;
                }
            }
            if (isWin) {
                const columns = ['B', 'I', 'N', 'G', 'O'];
                winningPatterns.push({ type: 'column', name: `Column ${columns[col]}` });
            }
        }

        // Check diagonals
        let isDiagonal1Win = true;
        let isDiagonal2Win = true;
        for (let i = 0; i < 5; i++) {
            if (!this.markedTiles.has(i * 5 + i)) isDiagonal1Win = false;
            if (!this.markedTiles.has(i * 5 + (4 - i))) isDiagonal2Win = false;
        }
        if (isDiagonal1Win) winningPatterns.push({ type: 'diagonal', name: 'Diagonal \\' });
        if (isDiagonal2Win) winningPatterns.push({ type: 'diagonal', name: 'Diagonal /' });

        if (winningPatterns.length > 0) {
            this.showBingoWin(winningPatterns);
        }

        return winningPatterns;
    }

    showBingoWin(patterns) {
        const patternNames = patterns.map(p => p.name).join(', ');
        alert(`🎉 BINGO! 🎉\n\nYou won with: ${patternNames}`);

        // Optional: Generate new card after win
        setTimeout(() => {
            if (confirm('Generate a new bingo card?')) {
                this.generateNewCard();
            }
        }, 1000);
    }

    generateNewCard() {
        // Clear previous state completely
        this.markedTiles.clear();
        this.calledNumbers = [];

        // Generate fresh bingo card
        this.generateBingoCard();

        // Save the fresh state immediately
        this.saveToStorage(this.STORAGE_KEYS.MARKED_TILES, Array.from(this.markedTiles));
        this.saveToStorage(this.STORAGE_KEYS.CALLED_NUMBERS, this.calledNumbers);

        // Remove any existing overlay first
        const container = document.getElementById('orbellaCanvas');
        if (container) {
            const existingOverlay = container.querySelector('.bingo-card-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
        }

        // Refresh the interactive bingo grid with new numbers
        const cardUrl = this.loadFromStorage(this.STORAGE_KEYS.CARD_URL);
        if (cardUrl) {
            this.createBingoCardOverlay(cardUrl);
        }

        this.setStatus('New bingo card generated!');
    }

    // === THREE.JS MANAGEMENT ===

    async setupThreeJsScene(videoUrl, cardUrl, ballCallerUrl) {
        this.initializeThreeJs();

        if (videoUrl) {
            await this.loadVideo(videoUrl);
        }

        if (ballCallerUrl) {
            this.createBallCallerOverlay(ballCallerUrl);
        }

        if (cardUrl) {
            this.createBingoCardOverlay(cardUrl);
        }
    }

    initializeThreeJs() {
        const container = document.getElementById('orbellaCanvas');
        if (!container) return;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        this.renderer.setClearColor(0x000000);

        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // Create scene and camera
        this.scene = new THREE.Scene();

        // Use orthographic camera with 1:1 aspect to avoid distortion
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        // Create background plane for the video texture (2x2 to fill viewport)
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.videoMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.videoMesh);

        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    async loadVideo(videoUrl) {
        // Clean up existing video
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.removeAttribute('src');
            this.videoElement.load();
        }

        // Create video element
        this.videoElement = document.createElement('video');
        this.videoElement.src = videoUrl;
        this.videoElement.crossOrigin = 'anonymous';
        this.videoElement.loop = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;

        return new Promise((resolve) => {
            this.videoElement.addEventListener('canplay', () => {
                this.createVideoTexture();
                resolve();
            });

            this.videoElement.addEventListener('error', (ev) => {
                console.error('Video load error:', ev);
                this.setStatus('Video load error');
                resolve();
            });

            // Try to play
            this.videoElement.play().catch(err => {
                console.warn('Autoplay prevented:', err);
                this.createPlayButton();
                resolve();
            });
        });
    }

    createVideoTexture() {
        if (!this.videoElement || this.videoTexture) return;

        try {
            this.videoTexture = new THREE.VideoTexture(this.videoElement);
            this.videoTexture.minFilter = THREE.LinearFilter;
            this.videoTexture.magFilter = THREE.LinearFilter;
            this.videoTexture.flipY = true;

            if (this.videoMesh) {
                const videoMaterial = new THREE.MeshBasicMaterial({
                    map: this.videoTexture,
                    toneMapped: false
                });
                this.videoMesh.material.dispose();
                this.videoMesh.material = videoMaterial;
            }

            // Ensure the render loop is running so the video is visible
            if (!this.animationId) {
                this.animate();
            }
        } catch (error) {
            console.error('Error creating video texture:', error);
        }
    }

    createPlayButton() {
        const container = document.getElementById('orbellaCanvas');
        if (!container) return;

        const playBtn = document.createElement('div');
        playBtn.className = 'orbella-play-button';
        playBtn.innerHTML = '▶️ Click to Play Video';
        playBtn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
            user-select: none;
        `;

        playBtn.addEventListener('click', async () => {
            try {
                if (this.videoElement) {
                    await this.videoElement.play();
                    playBtn.remove();
                }
            } catch (err) {
                console.error('Manual video play failed:', err);
            }
        });

        container.style.position = 'relative';
        container.appendChild(playBtn);
    }

    createBallCallerOverlay(ballCallerImageUrl) {
        const container = document.getElementById('orbellaCanvas');
        if (!container) return;

        // Remove existing ball caller overlay
        const existing = container.querySelector('.ball-caller-overlay');
        if (existing) existing.remove();

        // Create ball caller display at top center - LARGER and more visible
        const overlay = document.createElement('div');
        overlay.className = 'ball-caller-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 12%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 450px;
            height: 120px;
            z-index: 1002;
            background-image: url('${ballCallerImageUrl}');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            pointer-events: none;
        `;

        container.style.position = 'relative';
        container.appendChild(overlay);
    }

    createBingoCardOverlay(cardImageUrl) {
        const container = document.getElementById('orbellaCanvas');
        if (!container) return;

        // Remove existing overlay
        const existing = container.querySelector('.bingo-card-overlay');
        if (existing) existing.remove();

        // Create pure card display - LARGER size, no background styling
        const overlay = document.createElement('div');
        overlay.className = 'bingo-card-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 65%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 750px;
            height: 650px;
            z-index: 1001;
            background-image: url('${cardImageUrl}');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            pointer-events: auto;
        `;

        // Create invisible interactive zones with NO visual elements
        this.createInvisibleInteractiveZones(overlay);

        container.style.position = 'relative';
        container.appendChild(overlay);
    }

    createInvisibleInteractiveZones(container) {
        // Create completely invisible 5x5 grid for interactions
        const grid = document.createElement('div');
        grid.className = 'invisible-bingo-grid';
        grid.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(5, 1fr);
            z-index: 10;
        `;

        // Create 25 invisible interactive zones
        this.bingoCard.forEach((tile, index) => {
            const zone = document.createElement('div');
            zone.className = 'invisible-zone';
            zone.dataset.index = index;
            zone.style.cssText = `
                background: transparent;
                border: none;
                cursor: ${tile.isFree ? 'default' : 'pointer'};
                position: relative;
            `;

            // Add click functionality for non-free tiles
            if (!tile.isFree) {
                zone.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleTileMark(index);
                });
            }

            // Add checkmark for marked tiles
            if (this.markedTiles.has(index)) {
                const checkmark = document.createElement('div');
                checkmark.className = 'checkmark';
                checkmark.innerHTML = '✓';
                checkmark.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 32px;
                    font-weight: bold;
                    color: #10b981;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(16, 185, 129, 0.5);
                    pointer-events: none;
                `;
                zone.appendChild(checkmark);
            }

            grid.appendChild(zone);
        });

        container.appendChild(grid);
    }

    createInteractiveBingoGrid(container) {
        const grid = document.createElement('div');
        grid.className = 'bingo-grid interactive';
        grid.style.cssText = `
            position: relative;
            z-index: 10;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(5, 1fr);
            width: 100%;
            height: 100%;
            border-radius: 15px;
            overflow: hidden;
            gap: 2px;
            padding: 10px;
        `;

        // Add interactive number tiles (no header row)
        this.bingoCard.forEach((tile, index) => {
            const cell = document.createElement('div');
            cell.className = `bingo-cell interactive-cell ${this.markedTiles.has(index) ? 'marked' : ''}`;
            cell.textContent = tile.value;
            cell.dataset.index = index;

            const isMarked = this.markedTiles.has(index);
            cell.style.cssText = `
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0px;
                font-weight: bold;
                cursor: ${tile.isFree ? 'default' : 'pointer'};
                background: transparent;
                color: transparent;
                transition: all 0.2s ease;
                user-select: none;
                position: relative;
            `;

            // Add click functionality for non-free tiles
            if (!tile.isFree) {
                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleTileMark(index);
                });

                cell.addEventListener('mouseenter', () => {
                    if (!this.markedTiles.has(index)) {
                        cell.style.background = 'rgba(255, 255, 255, 0.2)';
                        cell.style.transform = 'scale(1.05)';
                    }
                });

                cell.addEventListener('mouseleave', () => {
                    if (!this.markedTiles.has(index)) {
                        cell.style.background = 'transparent';
                        cell.style.transform = 'scale(1)';
                    }
                });
            }

            // Add checkmark for marked tiles
            if (isMarked) {
                const checkmark = document.createElement('div');
                checkmark.className = 'checkmark';
                checkmark.innerHTML = '✓';
                checkmark.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 24px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
                    pointer-events: none;
                `;
                cell.appendChild(checkmark);
            }

            grid.appendChild(cell);
        });

        container.appendChild(grid);
    }

    // Enhanced tile marking with visual feedback
    toggleTileMark(index) {
        const tile = this.bingoCard[index];
        if (!tile || tile.isFree) return false;

        // Toggle mark
        const wasMarked = this.markedTiles.has(index);
        if (wasMarked) {
            this.markedTiles.delete(index);
        } else {
            this.markedTiles.add(index);
        }

        // Save state
        this.saveToStorage(this.STORAGE_KEYS.MARKED_TILES, Array.from(this.markedTiles));

        // Update visual immediately
        this.updateCellVisual(index, !wasMarked);

        // Check for bingo
        const winningPatterns = this.checkBingo();
        if (winningPatterns.length > 0) {
            setTimeout(() => this.showBingoWin(winningPatterns), 300);
        }

        return true;
    }

    updateCellVisual(index, isMarked) {
        const zone = document.querySelector(`.invisible-zone[data-index="${index}"]`);
        if (!zone) return;

        const tile = this.bingoCard[index];

        // Only manage checkmarks - no other visual elements
        if (isMarked) {
            // Add checkmark
            if (!zone.querySelector('.checkmark')) {
                const checkmark = document.createElement('div');
                checkmark.className = 'checkmark';
                checkmark.innerHTML = '✓';
                checkmark.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 32px;
                    font-weight: bold;
                    color: #10b981;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(16, 185, 129, 0.5);
                    pointer-events: none;
                    animation: markAppear 0.3s ease-out;
                `;
                zone.appendChild(checkmark);
            }
        } else {
            // Remove checkmark
            const checkmark = zone.querySelector('.checkmark');
            if (checkmark) checkmark.remove();
        }
    }

    updateCardVisual() {
        const cells = document.querySelectorAll('.bingo-cell');
        cells.forEach((cell, index) => {
            if (index < this.bingoCard.length) {
                const tile = this.bingoCard[index];
                const isMarked = this.markedTiles.has(index);

                cell.style.background = isMarked ? '#10b981' : (tile.isFree ? '#fbbf24' : 'white');
                cell.style.color = isMarked || tile.isFree ? 'white' : '#1f2937';
            }
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.videoTexture) {
            this.videoTexture.needsUpdate = true;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    handleResize() {
        if (!this.renderer) return;

        const container = document.getElementById('orbellaCanvas');
        if (!container) return;

        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;

        this.renderer.setSize(w, h, false);

        if (this.camera && this.camera.isOrthographicCamera) {
            // Simple aspect ratio calculation to fit video naturally
            const aspect = w / h;
            this.camera.left = -aspect;
            this.camera.right = aspect;
            this.camera.top = 1;
            this.camera.bottom = -1;
            this.camera.updateProjectionMatrix();
        }
    }

    // === API CALLS ===

    async generateNewAssets() {
        const theme = (this.modalTextArea && this.modalTextArea.value.trim()) || 'Magical bingo background';
        this.closeModal();

        // Show the main interface immediately for the loading screen
        this.showMainInterface();

        // Start the 3D loading animation
        this.showLoadingAnimation();
        this.setStatus('Generating video, card, and ball caller...');

        try {
            const base = window.ORBELLA_API_BASE || 'http://127.0.0.1:8000';

            // Call all three APIs simultaneously
            const [videoResponse, cardResponse, ballCallerResponse] = await Promise.all([
                fetch(base + '/scenario/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme })
                }),
                fetch(base + '/scenario/generate-card', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme })
                }),
                fetch(base + '/scenario/generate-ball-caller', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme })
                })
            ]);

            if (!videoResponse.ok || !cardResponse.ok || !ballCallerResponse.ok) {
                throw new Error('Generation failed');
            }

            const [videoData, cardData, ballCallerData] = await Promise.all([
                videoResponse.json(),
                cardResponse.json(),
                ballCallerResponse.json()
            ]);

            console.log('Video data:', videoData);
            console.log('Card data:', cardData);
            console.log('Ball Caller data:', ballCallerData);

            const videoUrls = videoData.asset_urls || [];
            const cardUrls = cardData.asset_urls || [];
            const originalCardUrls = cardData.original_urls || cardUrls;
            const ballCallerUrls = ballCallerData.asset_urls || [];
            const originalBallCallerUrls = ballCallerData.original_urls || ballCallerUrls;

            if (videoUrls.length > 0 || cardUrls.length > 0) {
                // Save to local storage
                if (videoUrls.length > 0) {
                    this.saveToStorage(this.STORAGE_KEYS.VIDEO_URL, videoUrls[0]);
                }
                if (cardUrls.length > 0) {
                    this.saveToStorage(this.STORAGE_KEYS.CARD_URL, cardUrls[0]);
                    if (originalCardUrls.length > 0 && originalCardUrls[0] !== cardUrls[0]) {
                        this.saveToStorage('orbella_original_card_url', originalCardUrls[0]);
                    }
                }
                if (ballCallerUrls.length > 0) {
                    this.saveToStorage('orbella_ball_caller_url', ballCallerUrls[0]);
                    if (originalBallCallerUrls.length > 0 && originalBallCallerUrls[0] !== ballCallerUrls[0]) {
                        this.saveToStorage('orbella_original_ball_caller_url', originalBallCallerUrls[0]);
                    }
                }
                this.saveToStorage(this.STORAGE_KEYS.THEME, theme);

                // Stop loading animation
                this.hideLoadingAnimation();

                // Generate bingo card
                this.generateBingoCard();

                // Setup Three.js scene with ball caller
                await this.setupThreeJsScene(videoUrls[0], cardUrls[0], ballCallerUrls[0]);

                // Show reset button and new card button
                this.showResetButton();
                this.showNewCardButton();

                this.setStatus(`Generated - Theme: "${theme}"`);
            } else {
                throw new Error('No assets generated');
            }

        } catch (error) {
            console.error('Generation error:', error);
            this.hideLoadingAnimation();
            this.setStatus(`Error: ${error.message}`);
            alert(`Generation failed: ${error.message}\n\nMake sure the backend is running.`);
            this.openModal(); // Re-open modal on failure
        }
    }

    // === LOADING ANIMATION ===

    showLoadingAnimation() {
        this.isLoading = true;
        this.initializeThreeJs(); // Ensure renderer exists

        // Clear scene
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        // Setup Loading Scene
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Use Perspective Camera for 3D scene
        const aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Ice Floor
        const iceGeo = new THREE.CylinderGeometry(8, 8, 0.5, 32);
        const iceMat = new THREE.MeshStandardMaterial({
            color: 0xe0f7fa,
            roughness: 0.1,
            metalness: 0.1
        });
        const ice = new THREE.Mesh(iceGeo, iceMat);
        ice.position.y = -0.25;
        this.scene.add(ice);

        // Create Penguins
        this.penguins = [];
        for (let i = 0; i < 3; i++) {
            const penguin = this.createPenguin();
            // Start position off-screen or on one side
            penguin.position.set(-4 - (i * 1.5), 0, 0);
            penguin.rotation.y = Math.PI / 2; // Face right

            // Add some random variation
            const scale = 0.8 + Math.random() * 0.4;
            penguin.scale.set(scale, scale, scale);

            this.scene.add(penguin);
            this.penguins.push({
                mesh: penguin,
                speed: 0.03 + Math.random() * 0.02,
                waddleOffset: Math.random() * Math.PI * 2,
                baseY: 0
            });
        }

        // Add funny loading text overlay
        this.createLoadingTextOverlay();
        
        // Add snow particles for atmosphere
        this.createSnowParticles();

        // Start animation loop if not running
        if (!this.animationId) {
            this.animate();
        }
    }

    createPenguin() {
        const penguin = new THREE.Group();

        // Body (Black Capsule/Cylinder)
        const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.7, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        penguin.add(body);

        // Belly (White patch)
        const bellyGeo = new THREE.CapsuleGeometry(0.23, 0.5, 4, 8);
        const bellyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.position.set(0, 0.45, 0.12);
        penguin.add(belly);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.1, 0.8, 0.22);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.1, 0.8, 0.22);

        // Pupils
        const pupilGeo = new THREE.SphereGeometry(0.02, 8, 8);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
        pupilL.position.set(0, 0, 0.04);
        eyeL.add(pupilL);
        const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
        pupilR.position.set(0, 0, 0.04);
        eyeR.add(pupilR);

        penguin.add(eyeL);
        penguin.add(eyeR);

        // Beak (Orange Cone)
        const beakGeo = new THREE.ConeGeometry(0.08, 0.2, 8);
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xff9800 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.7, 0.35);
        penguin.add(beak);

        // Wings
        const wingGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const wingL = new THREE.Mesh(wingGeo, wingMat);
        wingL.position.set(-0.35, 0.5, 0);
        wingL.rotation.z = Math.PI / 8;
        const wingR = new THREE.Mesh(wingGeo, wingMat);
        wingR.position.set(0.35, 0.5, 0);
        wingR.rotation.z = -Math.PI / 8;
        penguin.add(wingL);
        penguin.add(wingR);

        // Feet
        const footGeo = new THREE.BoxGeometry(0.2, 0.1, 0.3);
        const footMat = new THREE.MeshStandardMaterial({ color: 0xff9800 });
        const footL = new THREE.Mesh(footGeo, footMat);
        footL.position.set(-0.15, 0.05, 0.1);
        const footR = new THREE.Mesh(footGeo, footMat);
        footR.position.set(0.15, 0.05, 0.1);
        penguin.add(footL);
        penguin.add(footR);

        return penguin;
    }

    createSnowParticles() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(
                (Math.random() - 0.5) * 20, // x
                Math.random() * 10,         // y
                (Math.random() - 0.5) * 20  // z
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
        this.snowSystem = new THREE.Points(geometry, material);
        this.scene.add(this.snowSystem);
    }

    createLoadingTextOverlay() {
        const container = document.getElementById('orbellaCanvas');
        if (!container) return;

        // Remove existing loading text if any
        const existingText = container.querySelector('.orbella-loading-text');
        if (existingText) existingText.remove();

        // Create the funny loading text overlay
        const textOverlay = document.createElement('div');
        textOverlay.className = 'orbella-loading-text';
        textOverlay.innerHTML = `
            <div class="loading-main-text">Your generation is on the way! 🐧</div>
            <div class="loading-sub-text">Our penguin team is working hard...</div>
        `;
        textOverlay.style.cssText = `
            position: absolute;
            top: 70%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            text-align: center;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            pointer-events: none;
            text-shadow: 0 3px 15px rgba(0, 0, 0, 0.9);
        `;

        // Style the main text
        const mainTextStyle = `
            font-size: 2.5em;
            font-weight: 800;
            margin-bottom: 15px;
            color: #ffffff;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
        `;

        // Style the sub text
        const subTextStyle = `
            font-size: 1.2em;
            color: #e5e7eb;
            font-weight: 500;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        `;


        // Apply styles to text elements
        textOverlay.querySelector('.loading-main-text').style.cssText = mainTextStyle;
        textOverlay.querySelector('.loading-sub-text').style.cssText = subTextStyle;

        container.style.position = 'relative';
        container.appendChild(textOverlay);
    }

    hideLoadingAnimation() {
        this.isLoading = false;
        this.penguins = null;
        this.snowSystem = null;
        
        // Remove the loading text overlay
        const container = document.getElementById('orbellaCanvas');
        if (container) {
            const loadingText = container.querySelector('.orbella-loading-text');
            if (loadingText) loadingText.remove();
        }
        
        // The setupThreeJsScene method will clear and reset the scene
    }

    // === UI MANAGEMENT ===

    setStatus(text) {
        if (this.statusEl) this.statusEl.textContent = text;
    }

    openModal() {
        if (this.modalEl) this.modalEl.classList.remove('hidden');
    }

    closeModal() {
        if (this.modalEl) this.modalEl.classList.add('hidden');
    }

    showMainInterface() {
        if (this.mainEl) {
            this.mainEl.classList.remove('hidden');
            this.mainEl.classList.add('full-video');
        }
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.removeAttribute('src');
            this.videoElement.load();
            this.videoElement = null;
        }

        if (this.videoTexture) {
            this.videoTexture.dispose();
            this.videoTexture = null;
        }

        if (this.mainEl) {
            this.mainEl.classList.add('hidden');
            this.mainEl.classList.remove('full-video');
        }

        // Clear overlays including ball caller and loading text
        const container = document.getElementById('orbellaCanvas');
        if (container) {
            const overlays = container.querySelectorAll('.bingo-card-overlay, .ball-caller-overlay, .orbella-play-button, .orbella-loading-text');
            overlays.forEach(overlay => overlay.remove());
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.isLoading) {
            // Animate Loading Scene
            const time = Date.now() * 0.005;

            if (this.penguins) {
                this.penguins.forEach(p => {
                    // Move forward
                    p.mesh.position.x += p.speed;

                    // Reset if too far
                    if (p.mesh.position.x > 5) {
                        p.mesh.position.x = -5;
                    }

                    // Waddle animation (rotate z)
                    p.mesh.rotation.z = Math.sin(time * 3 + p.waddleOffset) * 0.1;

                    // Hop animation (y position)
                    p.mesh.position.y = Math.abs(Math.sin(time * 3 + p.waddleOffset)) * 0.1;
                });
            }

            if (this.snowSystem) {
                const positions = this.snowSystem.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] -= 0.05; // Fall down
                    if (positions[i] < 0) {
                        positions[i] = 10; // Reset to top
                    }
                }
                this.snowSystem.geometry.attributes.position.needsUpdate = true;
            }

        } else {
            // Normal Video Scene Animation
            if (this.videoTexture) {
                this.videoTexture.needsUpdate = true;
            }
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Global instance
let orbellaRoom = null;

// Lifecycle hooks for main.js integration
window.enterOrbellaRoom = function () {
    if (!orbellaRoom) {
        orbellaRoom = new OrbellaRoom();
    } else {
        // Room instance exists but was cleaned up - reload stored assets
        orbellaRoom.loadStoredAssets();
    }
};

window.leaveOrbellaRoom = function () {
    if (orbellaRoom) {
        orbellaRoom.cleanup();
    }
};
