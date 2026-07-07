(function () {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');

  function isDark() {
    return document.body.classList.contains('dark-mode');
  }

  const COLORS_LIGHT = [
    [13,148,136],
    [37,99,235],
    [16,163,74],
    [217,119,6],
    [139,92,246],
    [236,72,153],
  ];
  const COLORS_DARK = [
    [13,148,136],
    [37,99,235],
    [16,163,74],
    [217,119,6],
    [139,92,246],
    [236,72,153],
  ];

  function makeBlob() {
    const tier = Math.random();
    let r, baseAlpha, speed;
    if (tier < 0.35) {
      r = 3 + Math.random() * 8;        // tiny  3�11
      baseAlpha = 0.55 + Math.random() * 0.25;
      speed = 0.25 + Math.random() * 0.35;
    } else if (tier < 0.65) {
      r = 11 + Math.random() * 14;      // small 11�25
      baseAlpha = 0.35 + Math.random() * 0.20;
      speed = 0.18 + Math.random() * 0.25;
    } else if (tier < 0.85) {
      r = 25 + Math.random() * 22;      // med   25�47
      baseAlpha = 0.18 + Math.random() * 0.15;
      speed = 0.10 + Math.random() * 0.18;
    } else {
      r = 47 + Math.random() * 45;      // large 47�92
      baseAlpha = 0.08 + Math.random() * 0.10;
      speed = 0.06 + Math.random() * 0.10;
    }

    const W = canvas.width;
    const H = canvas.height;
    const colors = isDark() ? COLORS_DARK : COLORS_LIGHT;
    const col = colors[Math.floor(Math.random() * colors.length)];

    return {
      x: r + Math.random() * (W - 2 * r),
      y: H + r + Math.random() * H,      // start below screen
      r,
      col,
      baseAlpha,
      alpha: 0,
      speed,
      drift: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.003 + Math.random() * 0.008,
      life: 0,        // 0..1
      fadeIn: 0.12,
      fadeOut: 0.88,
    };
  }

  const BLOB_COUNT = 32;
  let blobs = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Stagger initial spawn across full screen height
  for (let i = 0; i < BLOB_COUNT; i++) {
    const b = makeBlob();
    // Scatter them across the full screen at start
    b.y = Math.random() * (canvas.height + 200) - 100;
    b.life = Math.random();  // random life phase so they don't all start together
    blobs.push(b);
  }

  function tick() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];

      // Move up
      b.y -= b.speed;
      // Horizontal sine drift
      b.phase += b.phaseSpeed;
      b.x += Math.sin(b.phase) * b.drift;

      // Advance life based on vertical travel
      b.life = 1 - (b.y + b.r) / (H + b.r * 2);
      b.life = Math.max(0, Math.min(1, b.life));

      // Fade in/out
      let alpha;
      if (b.life < b.fadeIn) {
        alpha = (b.life / b.fadeIn) * b.baseAlpha;
      } else if (b.life > b.fadeOut) {
        alpha = ((1 - b.life) / (1 - b.fadeOut)) * b.baseAlpha;
      } else {
        alpha = b.baseAlpha;
      }

      // Draw
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      const [r, g, bv] = b.col;
      ctx.fillStyle = `rgba(${r},${g},${bv},${alpha.toFixed(3)})`;
      ctx.fill();

      // Recycle when off screen top
      if (b.y + b.r < -10) {
        blobs[i] = makeBlob();
      }
    }

    requestAnimationFrame(tick);
  }

  tick();
})();