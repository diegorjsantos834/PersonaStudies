// SOUND-CANVAS.JS - Linha de áudio do fundo (camada .layer_canva_sounds)
// Sem música: onda idle animada pelo tempo. Tocando: waveform real via
// AnalyserNode (criado no primeiro play, por causa da política de autoplay).
// Cores por tema: P5 vermelho/preto em tela cheia; P3 branco com brilho
// ciano. O resize() lê a caixa real do canvas a cada frame para acompanhar
// trocas de tema sem distorcer.
(function () {
  const canvas = document.getElementById("sound-canvas");
  const audio = document.getElementById("persona-audio-player");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let analyser = null;
  let timeData = null;
  let audioCtx = null;

  let lastW = 0, lastH = 0;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // Conecta o <audio> ao AnalyserNode uma única vez (após gesto do usuário)
  function ensureAudioGraph() {
    if (analyser || !audio) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      const src = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
      timeData = new Uint8Array(analyser.fftSize);
    } catch (e) {
      analyser = null;
    }
  }

  if (audio) {
    audio.addEventListener("play", () => {
      ensureAudioGraph();
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    });
  }
  // Também tenta no primeiro clique (política de autoplay)
  window.addEventListener("pointerdown", ensureAudioGraph, { once: true });

  let t = 0;
  function themeColors() {
    const p3 = document.body && document.body.classList.contains('theme-p3');
    return p3
      ? { main: '#ffffff', edge: '#1b9ad6', glow: '#7df3ff', blur: 12, amp: 10, lw1: 4, lw2: 2 }
      : { main: '#e60023', edge: '#000', glow: 'transparent', blur: 0, amp: 26, lw1: 6, lw2: 3 };
  }
  function drawIdleLine(now) {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const midY = h * 0.5;
    ctx.clearRect(0, 0, w, h);

    // Linha vermelha central (fundo cinza) com contorno preto fino estilo P5
    const drawPass = (strokeStyle, lineWidth, amp, freq, speed) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = midY + Math.sin(x * freq + t * speed) * amp + Math.sin(x * 0.008 - t * 0.7) * amp * 0.5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const th0 = themeColors();
      ctx.strokeStyle = strokeStyle;
      ctx.shadowColor = th0.glow;
      ctx.shadowBlur = th0.blur;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "miter";
      ctx.stroke();
    };

    const { main, edge } = themeColors();
    drawPass(edge, themeColors().lw1, themeColors().amp, 0.012, 0.9);
    drawPass(main, themeColors().lw2, themeColors().amp, 0.012, 0.9);
  }

  function drawAudioLine() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const midY = h * 0.5;
    analyser.getByteTimeDomainData(timeData);
    ctx.clearRect(0, 0, w, h);

    const step = 4;
    const drawPass = (strokeStyle, lineWidth, scale) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += step) {
        const i = Math.min(timeData.length - 1, Math.floor((x / w) * timeData.length));
        const v = (timeData[i] - 128) / 128; // -1..1
        const y = midY + v * 70 * scale;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const th1 = themeColors();
      ctx.strokeStyle = strokeStyle;
      ctx.shadowColor = th1.glow;
      ctx.shadowBlur = th1.blur;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "miter";
      ctx.stroke();
    };

    const { main, edge } = themeColors();
    drawPass(edge, 6, 1);
    drawPass(main, 3, 1);
  }

  function loop() {
    resize();
    t += 0.03;
    const playing = analyser && audio && !audio.paused && !audio.ended;
    if (playing) drawAudioLine();
    else drawIdleLine(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
