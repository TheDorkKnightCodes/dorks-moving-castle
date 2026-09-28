(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CFG = window.BIRTHDAY || {};
  const params = new URLSearchParams(location.search);
  const ROOMS = ['blue', 'green', 'red', 'black'];

  const STORE_KEY = 'movingCastle.v1';
  if (params.has('reset')) {
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem('movingCastle.key'); } catch {}
  }
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch {}
  const state = Object.assign({ ach: {}, cats: [], visited: [], fortunes: 0, best: 0, muted: false }, saved);
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }

  const Sound = (() => {
    let ac = null;
    function ctx() {
      if (state.muted) return null;
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    }
    function tone(freq, start, dur, type = 'sine', vol = 0.12) {
      const a = ctx(); if (!a) return;
      const t = a.currentTime + start;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + dur + 0.05);
    }
    function noise(dur, vol = 0.18, freq = 1000) {
      const a = ctx(); if (!a) return;
      const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
      src.connect(f).connect(g).connect(a.destination); src.start();
    }
    return {
      achievement() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.1)); },
      pet() { tone(880, 0, 0.12, 'sine', 0.09); tone(1175, 0.08, 0.18, 'sine', 0.07); },
      puff() { noise(0.3, 0.25, 700); },
      star() { tone(1320, 0, 0.07, 'square', 0.035); tone(1760, 0.05, 0.1, 'square', 0.03); },
      gold() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.05, 0.12, 'square', 0.03)); },
      hit() { tone(170, 0, 0.3, 'sawtooth', 0.07); },
      crackle() { for (let i = 0; i < 7; i++) setTimeout(() => noise(0.05, 0.15, 1800 + Math.random() * 2500), i * 55); },
      click() { tone(660, 0, 0.06, 'triangle', 0.06); },
      chime() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.13, 0.6, 'sine', 0.07)); },
      grumble() { tone(140, 0, 0.18, 'sawtooth', 0.05); tone(110, 0.12, 0.25, 'sawtooth', 0.05); },
      wrong() { tone(233, 0, 0.14, 'square', 0.04); tone(185, 0.13, 0.22, 'square', 0.04); },
      door() { noise(0.5, 0.12, 300); tone(392, 0.1, 0.5, 'sine', 0.05); },
    };
  })();

  const Confetti = (() => {
    const cv = $('#confetti'), cx = cv.getContext('2d');
    const COLORS = ['#4a78b8', '#4f9a5e', '#c9504b', '#ffcf4a', '#ff8a2b', '#f4a7c0', '#ffffff'];
    let parts = [], raf = 0;
    function size() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * d; cv.height = innerHeight * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
    }
    addEventListener('resize', size); size();
    function add(x, y, n, spread, up) {
      for (let i = 0; i < n; i++) {
        parts.push({
          x, y, vx: (Math.random() - 0.5) * spread, vy: up ? -Math.random() * spread - 3 : Math.random() * 2,
          w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.3, c: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      if (!raf) raf = requestAnimationFrame(step);
    }
    function step() {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.22; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
        cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 1);
        cx.restore();
      }
      parts = parts.filter(p => p.y < innerHeight + 30);
      raf = parts.length ? requestAnimationFrame(step) : 0;
      if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
    }
    return {
      burst(x = innerWidth / 2, y = innerHeight / 2, n = 90) { add(x, y, n, 13, true); },
      shower() {
        for (let k = 0; k < 6; k++) setTimeout(() => {
          for (let j = 0; j < 4; j++) add(Math.random() * innerWidth, -20, 12, 4, false);
        }, k * 250);
      },
    };
  })();

  function floatText(x, y, text, cls = '') {
    const el = document.createElement('span');
    el.className = 'float-text ' + cls;
    el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  const ACHIEVEMENTS = [
    { id: 'door',     icon: '🚪', name: 'Door Opener',          desc: "Step inside Dork's Moving Castle." },
    { id: 'calcifer', icon: '🔥', name: "Calcifer's Friend",    desc: 'Feed Calcifer a log.' },
    { id: 'explorer', icon: '🧭', name: 'World Traveller',      desc: 'Go through all four doors.' },
    { id: 'wish',     icon: '🎂', name: 'Wish Granted',         desc: 'Blow out every candle on the cake.' },
    { id: 'stars10',  icon: '⭐', name: 'Star Catcher',         desc: 'Score 10 in one game of Falling Stars.' },
    { id: 'stars25',  icon: '🌠', name: 'Shooting Star',        desc: 'Score 25 in one game of Falling Stars.' },
    { id: 'fortune',  icon: '🔮', name: 'Fortune Favours You',  desc: 'Hear 5 fortunes from Professor Whiskers.' },
    { id: 'cats',     icon: '🐈', name: 'Crazy Cat Person',     desc: () => `Pet all 5 hidden cats. (${state.cats.length}/5 found)` },
    { id: 'letter',   icon: '💌', name: 'The Secret Door',      desc: 'Open the black door.' },
    { id: 'poke',     icon: '😤', name: 'Poked the Bear',       desc: 'Woke Calcifer up one too many times.', secret: true, hint: 'Someone was sleeping before the big day…' },
    { id: 'konami',  icon: '🕹️', name: 'Old School',           desc: 'Enter a legendary code.', secret: true, hint: 'Some codes are older than the castle. ↑↑…' },
    { id: 'complete', icon: '🎉', name: 'Level Up!',            desc: 'Find everything else. (Secrets optional.)', final: true },
  ];
  const text = v => (typeof v === 'function' ? v() : v);

  function updateCount() {
    $('#trophy-count').textContent = `${Object.keys(state.ach).filter(id => ACHIEVEMENTS.some(a => a.id === id)).length}/${ACHIEVEMENTS.length}`;
  }

  function toast(a) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-icon"></span><span><small>Achievement unlocked</small><b></b></span>`;
    el.querySelector('.toast-icon').textContent = a.icon;
    el.querySelector('b').textContent = a.name;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('leaving'), 4200);
    setTimeout(() => el.remove(), 4700);
  }

  function unlock(id) {
    if (state.ach[id]) return;
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    state.ach[id] = Date.now();
    save(); toast(a); Sound.achievement(); updateCount();
    if (!a.final) checkComplete();
  }

  function checkComplete() {
    const needed = ACHIEVEMENTS.filter(a => !a.secret && !a.final);
    if (state.ach.complete || !needed.every(a => state.ach[a.id])) return;
    setTimeout(() => {
      unlock('complete');
      openOverlay('#finale');
      Confetti.shower(); Sound.chime();
    }, 1600);
  }

  function renderTrophies() {
    const list = $('#ach-list');
    list.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const got = !!state.ach[a.id];
      const li = document.createElement('li');
      li.className = 'ach' + (got ? ' got' : '');
      const icon = got ? a.icon : a.secret ? '❔' : '🔒';
      const name = got || !a.secret ? a.name : '???';
      const desc = got || !a.secret ? text(a.desc) : a.hint;
      li.innerHTML = `<span class="ach-icon"></span><span><b></b><small></small></span>`;
      li.querySelector('.ach-icon').textContent = icon;
      li.querySelector('b').textContent = name;
      li.querySelector('small').textContent = desc;
      list.appendChild(li);
    }
    const n = Object.keys(state.ach).length;
    $('#trophy-progress').textContent = n === 0 ? 'Nothing yet. Go explore!' : `${n} of ${ACHIEVEMENTS.length} unlocked`;
  }

  function openOverlay(sel) { $(sel).hidden = false; }
  function closeOverlay(el) { el.hidden = true; }
  $$('.overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov || e.target.closest('[data-close]')) closeOverlay(ov);
    });
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.overlay').forEach(ov => { if (!ov.hidden) closeOverlay(ov); });
  });

  $('#btn-trophies').addEventListener('click', () => { renderTrophies(); openOverlay('#trophy-overlay'); Sound.click(); });
  function renderSoundBtn() { $('#btn-sound').textContent = state.muted ? '🔇' : '🔊'; }
  $('#btn-sound').addEventListener('click', () => { state.muted = !state.muted; save(); renderSoundBtn(); Sound.click(); });

  let locked = false;
  function show(id) {
    $$('.screen').forEach(s => { s.hidden = s.id !== id; });
    document.body.dataset.screen = id;
    window.scrollTo(0, 0);
    if (ROOMS.includes(id)) {
      if (!state.visited.includes(id)) { state.visited.push(id); save(); }
      if (ROOMS.every(r => state.visited.includes(r))) unlock('explorer');
    }
    window.dispatchEvent(new CustomEvent('screenchange', { detail: id }));
  }
  function route() {
    if (locked) return;
    const id = location.hash.slice(1);
    show(ROOMS.includes(id) ? id : 'home');
  }
  addEventListener('hashchange', route);

  const unlockAt = new Date(CFG.unlockAt).getTime();
  let opened = false;

  function startLock() {
    locked = true;
    show('lock');
    $('#lock-when').textContent = 'Opens ' + new Date(unlockAt).toLocaleString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
    }) + ' (your time)';
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const ms = unlockAt - Date.now();
      if (ms <= 0) {
        clearInterval(timer);
        opened = true;
        wakeUp('Happy birthday!! 🎉');
        return;
      }
      const s = Math.floor(ms / 1000);
      $('#cd-d').textContent = Math.floor(s / 86400);
      $('#cd-h').textContent = pad(Math.floor(s / 3600) % 24);
      $('#cd-m').textContent = pad(Math.floor(s / 60) % 60);
      $('#cd-s').textContent = pad(s % 60);
    };
    const timer = setInterval(tick, 1000);
    tick();
  }

  const WELCOMES = [
    "Oh, it's you! Welcome back! 🎉",
    'Fine, fine, I\'m up. Come on in!',
    'Back again? The castle missed you.',
    'Happy birthday-week! In you go!',
  ];
  function startGreeting() {
    opened = true;
    locked = true;
    show('lock');
    $('.countdown').hidden = true;
    $('#lock-when').hidden = true;
    $('#lock-sub').textContent = 'Wake him up to get into the castle.';
    $('#wake-btn').hidden = false;
  }
  $('#wake-btn').addEventListener('click', () => wakeUp(WELCOMES[(Math.random() * WELCOMES.length) | 0]));

  function wakeUp(line) {
    clearTimeout(napTimer);
    raging = true;
    $('#wake-btn').hidden = true;
    calc.classList.remove('grumpy', 'angry');
    lockInner.classList.remove('shaking');
    lockInner.classList.add('awake', 'poked');
    setMood('awake');
    calc.classList.add('woken');
    say(line);
    $('#lock h1').textContent = 'Calcifer is awake!';
    $('#lock-sub').textContent = 'The castle is on its way…';
    Sound.chime();
    setTimeout(() => {
      $('#lock').classList.add('waking');
      setTimeout(() => {
        locked = false;
        route();
        Confetti.shower();
      }, 1400);
    }, 1900);
  }

  const calc = $('#lock-calcifer');
  const bubble = $('#calc-bubble');
  const lockInner = $('.lock-inner');
  let pokes = 0, napTimer = 0, raging = false;
  const grumbles = () => [
    'Mmph… five more minutes…',
    'Zzz… go away…',
    "Hey! I'm sleeping!",
    'Stop poking me!',
    "I'm a fire demon, you know. Very scary.",
    opened ? "There's a button for waking me, you know." : "It's not your birthday yet. Shoo!",
    'One more poke and I swear…',
  ];

  function setMood(mood) { calc.innerHTML = Art.calcifer({ mood }); }
  function say(text) {
    bubble.textContent = text;
    bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
  }
  function backToSleep(delay) {
    clearTimeout(napTimer);
    napTimer = setTimeout(() => {
      raging = false;
      setMood('sleeping');
      calc.classList.remove('grumpy', 'angry');
      lockInner.classList.remove('awake', 'shaking');
      bubble.classList.remove('show');
    }, delay);
  }

  calc.addEventListener('click', () => {
    if (raging) return;
    pokes++;
    lockInner.classList.add('awake', 'poked');
    const GRUMBLES = grumbles();
    if (pokes % (GRUMBLES.length + 1) === 0) {
      raging = true;
      setMood('angry');
      calc.classList.remove('grumpy'); calc.classList.add('angry');
      lockInner.classList.remove('shaking'); void lockInner.offsetWidth; lockInner.classList.add('shaking');
      say('RAAAH! LET ME SLEEP!!');
      Sound.crackle(); Sound.hit();
      unlock('poke');
      backToSleep(2600);
      return;
    }
    setMood('grumpy');
    calc.classList.remove('grumpy'); void calc.offsetWidth; calc.classList.add('grumpy');
    say(GRUMBLES[(pokes - 1) % (GRUMBLES.length + 1)]);
    Sound.grumble();
    backToSleep(1800);
  });

  const castleBtn = $('#castle');
  castleBtn.addEventListener('click', () => {
    Sound.door();
    unlock('door');
    castleBtn.classList.add('visited');
    openOverlay('#dial-overlay');
  });

  const DIAL_ANGLE = { blue: 0, green: 90, red: 180, black: 270 };
  let dialAngle = 0, dialBusy = false;
  function chooseDoor(door) {
    if (dialBusy) return;
    dialBusy = true;
    let target = DIAL_ANGLE[door];
    let delta = ((target - dialAngle) % 360 + 540) % 360 - 180;
    dialAngle += delta;
    $('#dial-pointer').style.transform = `rotate(${dialAngle}deg)`;
    Sound.click();
    setTimeout(() => { closeOverlay($('#dial-overlay')); goThroughDoor(door); dialBusy = false; }, 650);
  }
  $$('.dial-seg').forEach(seg => {
    seg.addEventListener('click', () => chooseDoor(seg.dataset.door));
    seg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseDoor(seg.dataset.door); } });
  });

  const DOOR_COLORS = { blue: '#4a78b8', green: '#4f9a5e', red: '#c9504b', black: '#2b2733' };
  function goThroughDoor(door) {
    const t = $('#door-transition');
    t.style.setProperty('--door-color', DOOR_COLORS[door]);
    t.classList.remove('open');
    t.hidden = false;
    Sound.door();
    requestAnimationFrame(() => {
      setTimeout(() => {
        location.hash = door;
        t.classList.add('open');
        setTimeout(() => { t.hidden = true; t.classList.remove('open'); }, 950);
      }, 350);
    });
  }

  const LINES = [
    'Nom! Thanks! ♥', 'Ooh, crispy!', 'More! MORE!', 'That hit the spot.',
    "I'm feeling fiery today!", 'Mmm, oak. My favourite.',
  ];
  $('#dial-calcifer').addEventListener('click', e => {
    const btn = e.currentTarget;
    btn.classList.remove('fed'); void btn.offsetWidth; btn.classList.add('fed');
    const r = btn.getBoundingClientRect();
    floatText(r.left + r.width / 2, r.top, '🪵');
    Sound.crackle();
    $('#dial-note').textContent = LINES[(Math.random() * LINES.length) | 0];
    unlock('calcifer');
  });

  const cats = $$('.pet-cat');
  cats.forEach(el => {
    el.innerHTML = Art.cat(el.dataset.color);
    if (state.cats.includes(el.dataset.cat)) el.classList.add('petted');
    el.addEventListener('click', () => {
      const r = el.getBoundingClientRect();
      el.classList.remove('purr'); void el.offsetWidth; el.classList.add('purr', 'petted');
      Sound.pet();
      const id = el.dataset.cat;
      if (!state.cats.includes(id)) {
        state.cats.push(id); save();
        floatText(r.left + r.width / 2, r.top, `♥ ${state.cats.length}/${cats.length} cats`);
        if (state.cats.length >= cats.length) unlock('cats');
      } else {
        floatText(r.left + r.width / 2, r.top, ['purr ♥', 'mrrp!', '♥', 'prrrr'][(Math.random() * 4) | 0]);
      }
    });
  });

  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kPos = 0;
  addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kPos = key === KONAMI[kPos] ? kPos + 1 : (key === KONAMI[0] ? 1 : 0);
    if (kPos === KONAMI.length) { kPos = 0; catRain(); }
  });
  let sunTaps = 0, sunTimer = 0;
  $('#sun').addEventListener('click', () => {
    sunTaps++; clearTimeout(sunTimer);
    sunTimer = setTimeout(() => { sunTaps = 0; }, 2500);
    if (sunTaps >= 10) { sunTaps = 0; catRain(); }
  });
  function catRain() {
    const EMOJI = ['🐈', '🐈‍⬛', '😺', '😸', '😻', '🐾', '⭐'];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('span');
      el.className = 'cat-rain';
      el.textContent = EMOJI[(Math.random() * EMOJI.length) | 0];
      el.style.left = Math.random() * 100 + 'vw';
      el.style.animationDelay = Math.random() * 1.5 + 's';
      el.style.fontSize = 22 + Math.random() * 26 + 'px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }
    Sound.gold();
    unlock('konami');
  }

  if (CFG.name) {
    $('#name-slot').textContent = ', ' + CFG.name;
    $$('.name-slot-2').forEach(el => { el.textContent = ', ' + CFG.name; });
  }
  Art.paint();
  renderSoundBtn();
  updateCount();

  window.App = { state, save, unlock, Sound, Confetti, floatText };

  const now = Date.now();
  if (now < unlockAt && !params.has('preview')) startLock();
  else if (ROOMS.includes(location.hash.slice(1))) route();
  else startGreeting();
})();
