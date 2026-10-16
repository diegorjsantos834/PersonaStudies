// TRANSITIONS.JS - Transição animada ao trocar de tema
// P5 (3s): vídeo com fundo verde -> chroma-key via canvas sobre base
// vermelha/preta. P3 (6s): vídeo direto, congela 1s no segundo 4.
// A troca da classe do tema acontece com o overlay já cobrindo a tela.
// Exige Live Server (canvas + vídeo no file:// bloqueia o getImageData).
console.log('transitions.js');

(function () {
  const overlay = document.getElementById('theme-transition');
  const bg = document.getElementById('transition-bg');
  const canvas = document.getElementById('transition-canvas');
  const video = document.getElementById('transition-video');
  if (!overlay || !canvas || !video) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Config por tema de destino
  const CONFIG = {
    p5: { src: 'assets/transition/P5_transition.mp4', key: true, freezeAt: 0, holdMs: 0,
          bg: 'radial-gradient(circle at 50% 55%, #e60023 0%, #7a0013 45%, #000 100%)' },
    p3: { src: 'assets/transition/p3_transition.mp4', key: false, freezeAt: 4, holdMs: 1000,
          bg: '#000' },
  };

  let rafId = 0;
  let playing = false;
  let keyFailed = false;
  let frozen = false;
  let swapped = false;
  let safetyTimer = 0;

  function sizeCanvas() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2, 1280 / w);
    canvas.width = Math.floor(w * scale);
    canvas.height = Math.floor(h * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  // Desenha o frame cobrindo a tela (cover)
  function drawFrame() {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    const cw = canvas.clientWidth || window.innerWidth;
    const ch = canvas.clientHeight || window.innerHeight;
    const s = Math.max(cw / vw, ch / vh);
    const dw = vw * s, dh = vh * s;
    ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  // Verde vira transparência; azul vira preto (fundo vermelho/preto do P5)
  function keyOutGreen() {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (g > 80 && g > r + 30 && g > b + 30) {
        const diff = Math.min(g - r, g - b); // verde -> some
        d[i + 3] = diff > 70 ? 0 : Math.round(255 * (1 - (diff - 30) / 40));
      } else if (b > 80 && b > r + 30 && b > g + 30) {
        d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; // azul -> preto
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function loop() {
    if (!playing) return;
    drawFrame();
    // No fim: some o fundo para o tema (já trocado) aparecer no "quebrar"
    try {
      if (video.duration && video.duration - video.currentTime < 0.7) {
        bg.style.opacity = '0';
      }
    } catch (e) { /* ignora */ }
    if (CONFIG.current.key && !keyFailed) {
      try {
        keyOutGreen();
      } catch (e) {
        keyFailed = true; // ex.: file:// sem Live Server -> segue sem keying
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    playing = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function hideOverlay() {
    stopLoop();
    clearTimeout(safetyTimer);
    overlay.classList.add('fading');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('fading');
      video.pause();
    }, 320);
  }

  function playTransition(theme, swapFn) {
    const cfg = CONFIG[theme];
    if (!cfg) {
      swapFn();
      return;
    }
    CONFIG.current = cfg;
    keyFailed = false;
    frozen = false;
    swapped = false;

    bg.style.background = cfg.bg;
    bg.style.opacity = '1';
    overlay.classList.remove('hidden', 'fading');
    sizeCanvas();

    video.onloadedmetadata = () => {
      const swapAt = Math.min(1.2, (video.duration || 3) * 0.3);
      video.currentTime = 0;
      video.play().catch(() => hideOverlay());

      if (!swapped) {
        swapped = true;
        setTimeout(swapFn, swapAt * 1000);
      }
      // Trava de segurança: nunca prende a tela
      clearTimeout(safetyTimer);
      safetyTimer = setTimeout(hideOverlay, (video.duration || 3) * 1000 + 2500);
    };

    video.ontimeupdate = () => {
      // P3: congela no segundo 4 e retoma após holdMs
      if (cfg.freezeAt > 0 && !frozen && video.currentTime >= cfg.freezeAt) {
        frozen = true;
        video.pause();
        setTimeout(() => video.play().catch(() => hideOverlay()), cfg.holdMs);
      }
    };

    video.onended = () => {
      // P3: garante exibição mínima até o segundo 4
      const elapsed = video.currentTime;
      if (cfg.freezeAt > 0 && elapsed < cfg.freezeAt && !frozen) {
        frozen = true;
        setTimeout(hideOverlay, (cfg.freezeAt - elapsed) * 1000);
      } else {
        hideOverlay();
      }
    };

    video.src = cfg.src;
    video.load();
    playing = true;
    loop();
  }

  // Pré-carrega os dois vídeos
  Object.values(CONFIG).forEach((cfg) => {
    if (!cfg.src) return;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.src = cfg.src;
  });

  // Intercepta a troca de tema: anima primeiro, troca no meio
  if (typeof window.switchTheme === 'function') {
    const originalSwitch = window.switchTheme;
    window.switchTheme = function (themeName) {
      if (!CONFIG[themeName] || document.body.classList.contains('theme-' + themeName)) {
        originalSwitch(themeName);
        return;
      }
      playTransition(themeName, () => originalSwitch(themeName));
    };
  }
})();
