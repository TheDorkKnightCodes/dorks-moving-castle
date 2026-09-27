(() => {
  'use strict';
  const { state, save, unlock, Sound } = window.App;
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  const overlay = document.getElementById('game-overlay');
  const elScore = document.getElementById('g-score');
  const elBest = document.getElementById('g-best');
  const elLives = document.getElementById('g-lives');

  let W = 0, H = 0;
  let running = false, raf = 0, last = 0;
  let score = 0, lives = 3, hurtTimer = 0, spawnTimer = 0, time = 0;
  let items = [], pops = [];
  const keys = { left: false, right: false };
  const cat = { x: 0, target: null, face: 1, bob: 0 };
  const sky = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() * 0.8, r: Math.random() * 1.4 + 0.4, t: Math.random() * 6 }));

  function resize() {
    const r = wrap.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) cat.x = W / 2;
    cat.x = Math.min(Math.max(cat.x, 0), W);
    if (!running) draw();
  }
  new ResizeObserver(resize).observe(wrap);

  const catSize = () => Math.max(46, Math.min(W * 0.13, 84));

  function hud() {
    elScore.textContent = score;
    elBest.textContent = state.best || 0;
    elLives.textContent = '♥'.repeat(Math.max(lives, 0)) + '♡'.repeat(3 - Math.max(lives, 0));
  }

  function start() {
    score = 0; lives = 3; hurtTimer = 0; spawnTimer = 0.4; time = 0;
    items = []; pops = [];
    cat.x = W / 2; cat.target = null;
    overlay.hidden = true;
    running = true;
    hud();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    cancelAnimationFrame(raf);
    const newBest = score > (state.best || 0);
    if (newBest) { state.best = score; save(); }
    hud();
    document.getElementById('game-big').textContent = newBest && score > 0 ? 'NEW BEST!' : 'GAME OVER';
    document.getElementById('game-info').innerHTML = `You caught <b>${score}</b> point${score === 1 ? '' : 's'} of stars.`;
    document.getElementById('game-start').textContent = 'Play again';
    overlay.hidden = false;
    draw();
  }

  function pause() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    document.getElementById('game-big').textContent = 'PAUSED';
    document.getElementById('game-info').innerHTML = `Score so far: <b>${score}</b>`;
    document.getElementById('game-start').textContent = 'Resume';
    overlay.hidden = false;
    overlay.dataset.resume = '1';
  }

  document.getElementById('game-start').addEventListener('click', () => {
    if (overlay.dataset.resume) {
      delete overlay.dataset.resume;
      overlay.hidden = true; running = true; last = performance.now();
      raf = requestAnimationFrame(loop);
    } else start();
  });

  function spawn() {
    const difficulty = Math.min(score, 60);
    const roll = Math.random();
    const blobChance = 0.2 + difficulty * 0.004;
    const type = roll < blobChance ? 'blob' : roll < blobChance + 0.08 ? 'gold' : 'star';
    const r = type === 'blob' ? 17 : type === 'gold' ? 17 : 15;
    items.push({
      type, r,
      x: r + Math.random() * (W - r * 2),
      y: -r,
      vy: H * (0.28 + difficulty * 0.011) * (0.85 + Math.random() * 0.3) * (type === 'gold' ? 1.25 : 1),
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 3,
      wob: Math.random() * 6,
    });
    spawnTimer = Math.max(0.3, 0.85 - difficulty * 0.009) * (0.7 + Math.random() * 0.6);
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    time += dt;
    const size = catSize();
    const speed = W * 1.1;
    let move = 0;
    if (keys.left) move -= 1;
    if (keys.right) move += 1;
    if (move) { cat.x += move * speed * dt; cat.target = null; cat.face = move; }
    else if (cat.target != null) {
      const d = cat.target - cat.x;
      const step = Math.sign(d) * Math.min(Math.abs(d), speed * 1.3 * dt);
      cat.x += step;
      if (Math.abs(d) > 2) cat.face = Math.sign(d);
    }
    cat.x = Math.min(Math.max(cat.x, size / 2), W - size / 2);
    cat.bob += dt * (move || cat.target != null ? 14 : 3);
    if (hurtTimer > 0) hurtTimer -= dt;

    spawnTimer -= dt;
    if (spawnTimer <= 0) spawn();

    const catTop = H - size * 1.02;
    for (const it of items) {
      it.y += it.vy * dt;
      it.rot += it.vr * dt;
      it.wob += dt * 5;
      const inX = Math.abs(it.x - cat.x) < size * 0.5 + it.r * 0.5;
      const inY = it.y + it.r > catTop && it.y - it.r < catTop + size * 0.55;
      if (!it.dead && inX && inY) {
        it.dead = true;
        if (it.type === 'blob') {
          if (hurtTimer <= 0) {
            lives--; hurtTimer = 1; Sound.hit();
            pops.push({ x: it.x, y: catTop, text: 'ouch!', t: 0, color: '#ff8a8a' });
            if (lives <= 0) { hud(); gameOver(); return; }
          }
        } else {
          const pts = it.type === 'gold' ? 3 : 1;
          score += pts;
          it.type === 'gold' ? Sound.gold() : Sound.star();
          pops.push({ x: it.x, y: catTop, text: '+' + pts, t: 0, color: it.type === 'gold' ? '#ffe27a' : '#fff' });
          if (score >= 10) unlock('stars10');
          if (score >= 25) unlock('stars25');
        }
        hud();
      }
    }
    items = items.filter(it => !it.dead && it.y - it.r < H + 10);
    for (const p of pops) p.t += dt;
    pops = pops.filter(p => p.t < 0.8);
  }

  function drawStarShape(x, y, r, rot, fill) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(80,50,0,.55)'; ctx.stroke();
    ctx.restore();
  }

  function drawBlob(it) {
    const { x, y, r, wob } = it;
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = r * (1 + Math.sin(a * 3 + wob) * 0.12);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 1.1);
    }
    ctx.fillStyle = '#3a2a22'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.25, r * 0.15, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-r * 0.3, 0, r * 0.18, 0, 7); ctx.arc(r * 0.3, 0, r * 0.18, 0, 7); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-r * 0.28, r * 0.05, r * 0.08, 0, 7); ctx.arc(r * 0.32, r * 0.05, r * 0.08, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawCat() {
    const s = catSize();
    const x = cat.x;
    const baseY = H - 6;
    const bob = Math.abs(Math.sin(cat.bob)) * 3;
    if (hurtTimer > 0 && Math.floor(hurtTimer * 12) % 2) return;
    ctx.save();
    ctx.translate(x, baseY - bob);
    ctx.scale(cat.face < 0 ? -1 : 1, 1);
    const u = s / 100;
    ctx.scale(u, u);
    ctx.lineWidth = 3; ctx.strokeStyle = '#2e2a33'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-30, -20);
    ctx.quadraticCurveTo(-60, -30 + Math.sin(time * 6) * 8, -52, -62);
    ctx.lineWidth = 13; ctx.stroke();
    ctx.strokeStyle = '#ec9d52'; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#2e2a33'; ctx.lineWidth = 3;
    ctx.fillStyle = '#ec9d52';
    ctx.beginPath(); ctx.ellipse(0, -28, 36, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -62); ctx.lineTo(10, -92); ctx.lineTo(26, -74); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(34, -66); ctx.lineTo(44, -92); ctx.lineTo(48, -64); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(28, -58, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2e2a33';
    ctx.beginPath(); ctx.ellipse(22, -60, 3, 4.5, 0, 0, 7); ctx.ellipse(37, -60, 3, 4.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e58c9a';
    ctx.beginPath(); ctx.moveTo(28, -52); ctx.lineTo(33, -52); ctx.lineTo(30.5, -49); ctx.fill();
    ctx.fillStyle = 'rgba(244,160,168,.6)';
    ctx.beginPath(); ctx.ellipse(16, -52, 4, 2.5, 0, 0, 7); ctx.ellipse(42, -51, 4, 2.5, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9722f'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-10, -50); ctx.lineTo(-6, -40); ctx.moveTo(-22, -46); ctx.lineTo(-17, -37); ctx.stroke();
    ctx.strokeStyle = '#2e2a33'; ctx.lineWidth = 3; ctx.fillStyle = '#ec9d52';
    const step = Math.sin(cat.bob) * 4;
    [[-20, step], [-6, -step], [12, step], [24, -step]].forEach(([lx, o]) => {
      ctx.beginPath(); ctx.ellipse(lx + o, -4, 7, 5, 0, 0, 7); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
  }

  function draw() {
    if (!W) return;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2447'); g.addColorStop(0.6, '#3b3a6d'); g.addColorStop(1, '#6d527d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const s of sky) {
      ctx.globalAlpha = 0.4 + Math.sin(time * 2 + s.t) * 0.3;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff4c9';
    ctx.beginPath(); ctx.arc(W * 0.85, H * 0.15, Math.min(W, H) * 0.06, 0, 7); ctx.fill();
    ctx.fillStyle = '#2d4a3e';
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H - 18 - Math.sin(x / 70) * 8);
    ctx.lineTo(W, H); ctx.fill();

    for (const it of items) {
      if (it.type === 'blob') drawBlob(it);
      else {
        if (it.type === 'gold') {
          ctx.strokeStyle = 'rgba(255,226,122,.35)'; ctx.lineWidth = it.r;
          ctx.beginPath(); ctx.moveTo(it.x, it.y - it.r * 4); ctx.lineTo(it.x, it.y); ctx.stroke();
        }
        drawStarShape(it.x, it.y, it.r, it.rot, it.type === 'gold' ? '#ffcf3a' : '#fff6b0');
      }
    }
    drawCat();

    ctx.font = 'bold 18px Fredoka, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const p of pops) {
      ctx.globalAlpha = 1 - p.t / 0.8;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y - p.t * 50);
    }
    ctx.globalAlpha = 1;
  }

  const onGreen = () => document.body.dataset.screen === 'green';
  addEventListener('keydown', e => {
    if (!onGreen()) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = true; e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { keys.right = true; e.preventDefault(); }
    if ((k === ' ' || k === 'enter') && !overlay.hidden && document.activeElement?.id !== 'game-start') {
      e.preventDefault(); document.getElementById('game-start').click();
    }
  });
  addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  });
  function pointer(e) {
    const r = canvas.getBoundingClientRect();
    cat.target = Math.min(Math.max(e.clientX - r.left, 0), r.width);
  }
  canvas.addEventListener('pointermove', pointer);
  canvas.addEventListener('pointerdown', pointer);
  canvas.style.touchAction = 'none';

  addEventListener('screenchange', e => { if (e.detail !== 'green') pause(); else resize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  hud();
  resize();
})();
