'use strict';

// Orbella room controller
(function () {
  const statusEl = document.getElementById('orbellaStatus');
  const mainEl = document.getElementById('orbellaMain');
  const modalEl = document.getElementById('orbellaModal');
  const modalCloseBtn = document.getElementById('orbellaModalClose');
  const modalGenerateBtn = document.getElementById('orbellaModalGenerate');
  const modalTextArea = document.getElementById('orbellaModalText');

  let renderer = null;
  let scene = null;
  let camera = null;
  let mesh = null;
  let videoTex = null;
  let videoEl = null;
  let animationId = null;

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function openModal() {
    if (modalEl) modalEl.classList.remove('hidden');
  }

  function closeModal() {
    if (modalEl) modalEl.classList.add('hidden');
  }

  function ensureThreeScene() {
    if (renderer) {
      console.log('Three.js scene already exists');
      return;
    }
    
    const container = document.getElementById('orbellaCanvas');
    if (!container) {
      console.error('orbellaCanvas container not found');
      return;
    }

    console.log('Creating Three.js scene, container size:', container.clientWidth, container.clientHeight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x222222); // Dark gray background for debugging
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red material for debugging
    mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    console.log('Three.js scene created - renderer:', !!renderer, 'scene:', !!scene, 'camera:', !!camera, 'mesh:', !!mesh);

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  function handleResize() {
    if (!renderer) return;
    const container = document.getElementById('orbellaCanvas');
    if (!container) return;
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    console.log('handleResize - setting size to:', w, h);
    renderer.setSize(w, h, false);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (videoTex) videoTex.needsUpdate = true;
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  async function generateFromTheme(theme) {
    const base = window.ORBELLA_API_BASE || 'http://127.0.0.1:8000';
    setStatus('Generating...');

    try {
      const res = await fetch(base + '/scenario/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      console.log('Orbella /scenario/generate response', data);
      const urls = (data.asset_urls || []);
      if (!urls.length) throw new Error('No video URLs returned');

      await playVideo(urls[0]);
      setStatus('Playing');
    } catch (e) {
      console.error(e);
      setStatus('Error');
    }
  }

  async function playVideo(url) {
    console.log('=== playVideo start ===', url);
    
    // Ensure Three.js scene is ready
    ensureThreeScene();
    if (!renderer || !scene || !mesh) {
      console.error('Three.js scene not ready');
      return;
    }

    // Clean up existing video
    if (videoEl) {
      console.log('Cleaning up existing video');
      try {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      } catch (_) {}
    }

    // Create video element
    videoEl = document.createElement('video');
    videoEl.src = url;
    videoEl.crossOrigin = 'anonymous';
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    
    console.log('Video element created, src set');

    videoEl.addEventListener('loadeddata', () => {
      console.log('Video loadeddata event - video ready to play');
    });
    
    videoEl.addEventListener('canplay', () => {
      console.log('Video canplay event');
    });

    videoEl.addEventListener('error', (ev) => {
      console.error('Video element error', ev, videoEl.error);
      setStatus('Video load error');
    });

    try {
      console.log('Attempting to play video...');
      await videoEl.play();
      console.log('Video play() successful');
    } catch (err) {
      console.error('video.play() failed', err);
      setStatus('Video play blocked');
      return;
    }

    // Create video texture
    console.log('Creating THREE.VideoTexture...');
    videoTex = new THREE.VideoTexture(videoEl);
    videoTex.minFilter = THREE.LinearFilter;
    videoTex.magFilter = THREE.LinearFilter;
    videoTex.format = THREE.RGBAFormat;
    videoTex.needsUpdate = true;
    
    console.log('Video texture created, applying to mesh material');

    // Apply texture to mesh
    mesh.material.map = videoTex;
    mesh.material.needsUpdate = true;
    
    // Start animation loop
    if (!animationId) {
      console.log('Starting Three.js animation loop');
      animate();
    }

    // Show the main area
    if (mainEl) {
      mainEl.classList.remove('hidden');
      mainEl.classList.add('full-video');
    }

    // Force resize to ensure proper dimensions
    handleResize();
    console.log('=== playVideo complete ===');
  }

  function attachModalHandlers() {
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        closeModal();
      });
    }

    if (modalGenerateBtn) {
      modalGenerateBtn.addEventListener('click', async () => {
        const theme = (modalTextArea && modalTextArea.value.trim()) || 'Magical bingo background';
        closeModal();
        await generateFromTheme(theme);
      });
    }
  }

  // Lifecycle hooks used by main.js
  window.enterOrbellaRoom = function () {
    if (mainEl) {
      mainEl.classList.add('hidden');
      mainEl.classList.remove('full-video');
    }
    openModal();
    setStatus('Ready');
  };

  window.leaveOrbellaRoom = function () {
    closeModal();
    if (mainEl) {
      mainEl.classList.add('hidden');
      mainEl.classList.remove('full-video');
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl = null;
    }
    videoTex = null;
  };

  attachModalHandlers();
})();
