(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const { state, save, unlock, Sound, Confetti, floatText } = window.App;

  const CANDLES = 5;
  const candleWrap = $('#candles');
  const cakeMsg = $('#cake-msg');
  const cakeMsgDefault = cakeMsg.textContent;
  let litCount = 0;

  function buildCandles() {
    candleWrap.innerHTML = '';
    litCount = CANDLES;
    for (let i = 0; i < CANDLES; i++) {
      const c = document.createElement('button');
      c.className = 'candle';
      c.setAttribute('aria-label', `Blow out candle ${i + 1}`);
      c.innerHTML = `<span class="flame">${Art.calcifer()}</span><span class="puff"></span><span class="stick"></span>`;
      c.style.animationDelay = (i * 0.17) + 's';
      c.addEventListener('click', () => blowOut(c));
      candleWrap.appendChild(c);
    }
    cakeMsg.textContent = cakeMsgDefault;
    $('#relight').hidden = true;
  }

  function blowOut(c) {
    if (c.classList.contains('out')) return;
    c.classList.add('out');
    Sound.puff();
    litCount--;
    if (litCount === 0) {
      setTimeout(() => {
        cakeMsg.textContent = 'Now close your eyes and make a wish… ✨';
        const r = candleWrap.getBoundingClientRect();
        Confetti.burst(r.left + r.width / 2, r.top, 120);
        Sound.chime();
        unlock('wish');
        $('#relight').hidden = false;
      }, 350);
    }
  }
  $('#relight').addEventListener('click', buildCandles);
  buildCandles();

  const FORTUNES = [
    'A legendary drop is in your future. Probably this year. Probably.',
    'A cat will choose your lap at the exact moment you get comfortable. Do not move.',
    'Your next adventure begins behind a door you did not know was there.',
    'The RNG gods smile upon you this year.',
    "You will level up in ways that don't show on any stat screen.",
    'Something small and fluffy is plotting to knock something off your desk.',
    'A certain fire demon thinks you are pretty great.',
    "This year's save file is going to be a good one.",
    'Your hair will look magnificent all year. No green slime involved.',
    'You will find the perfect cozy game at exactly the right time.',
    'Someone is thinking of you right now. (It is the person who made this castle.)',
    "You will finally beat the boss you've been stuck on. Victory tastes like cake.",
    'Beware scarecrows bearing gifts. Actually, they are probably friendly.',
    'The stars you catch this year will not fall on your head.',
    'Nine lives? You will only need one very good one.',
    'Your backlog will shrink this year. (The cat is laughing at this one.)',
    'A warm drink, a soft blanket and a purring cat are in your near future.',
    'You will speedrun happiness. Any%, no glitches required.',
    'The castle has decided you may visit whenever you like.',
    'You will say "one more game", and it will, in fact, be several more games.',
    'Your heart is bigger than a fire demon\'s appetite. That is saying something.',
    'Critical hit! This will be a great year.',
    'The crystal ball sees… snacks. Many snacks. All for you.',
    'Loading next chapter… it looks like a good one.',
    'You will pet at least one extremely good cat this year. The ball is certain.',
    'A quest marker has appeared over something wonderful. Go get it.',
    'Your luck stat has been permanently increased by +10.',
    'The wind will change in your favour, and it will not blow your hat away.',
  ];
  let deck = [];
  function nextFortune() {
    if (!deck.length) deck = FORTUNES.map((f, i) => i).sort(() => Math.random() - 0.5);
    return FORTUNES[deck.pop()];
  }
  const card = $('#fortune');
  const crystal = $('#crystal');
  let reading = false;
  $('#ask-fortune').addEventListener('click', () => {
    if (reading) return;
    reading = true;
    card.classList.add('fading');
    crystal.classList.add('swirl');
    Sound.chime();
    setTimeout(() => {
      card.textContent = '“' + nextFortune() + '”';
      card.classList.remove('fading');
      crystal.classList.remove('swirl');
      reading = false;
      state.fortunes = (state.fortunes || 0) + 1;
      save();
      if (state.fortunes >= 5) unlock('fortune');
    }, 1300);
  });

  const L = window.LETTER;
  const form = $('#secret-form');
  const input = $('#secret-answer');
  const says = $('#calc-says');
  const hintEl = $('#secret-hint');
  const gate = $('#secret-gate');
  const letter = $('#letter');
  let wrongTries = 0;

  const normalize = s => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const fromB64 = b => Uint8Array.from(atob(b), ch => ch.charCodeAt(0));

  const KEY_STORE = 'movingCastle.key';
  let secretKey = null;

  async function openLetter(answer) {
    const pw = normalize(answer);
    if (!pw) throw new Error('empty');
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: fromB64(L.salt), iterations: L.iterations, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(L.iv) }, key, fromB64(L.data));
    secretKey = key;
    return new TextDecoder().decode(plain);
  }

  async function unlockFromStorage() {
    if (secretKey) return true;
    let known = null;
    try { known = localStorage.getItem(KEY_STORE); } catch {}
    if (!known) return false;
    try { await openLetter(known); return true; } catch { return false; }
  }

  const tracks = {};
  async function getTrack(name) {
    if (tracks[name]) return tracks[name];
    const m = L.media[name];
    const res = await fetch(m.src);
    if (!res.ok) throw new Error('Missing ' + m.src);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(m.iv) }, secretKey, await res.arrayBuffer());
    const audio = new Audio(URL.createObjectURL(new Blob([plain], { type: m.type })));
    for (const type of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata']) {
      audio.addEventListener(type, () => {
        if (type === 'play') Object.values(tracks).forEach(a => { if (a !== audio) a.pause(); });
        if (type === 'ended') audio.currentTime = 0;
        window.dispatchEvent(new CustomEvent('trackchange', { detail: { name, type } }));
      });
    }
    tracks[name] = audio;
    return audio;
  }
  addEventListener('screenchange', () => Object.values(tracks).forEach(a => a.pause()));

  const PLAYERS = [['voice', '🎙️ Let me read it out for you'], ['song', '🎂 Hear me sing']];
  const fmt = s => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '');

  function buildPlayers() {
    const wrap = $('#players');
    wrap.innerHTML = '';
    for (const [name, label] of PLAYERS) {
      if (!L.media || !L.media[name]) continue;
      const el = document.createElement('div');
      el.className = 'player';
      el.dataset.track = name;
      el.innerHTML = `<button class="player-btn" aria-label="Play">▶</button>
        <div class="player-body"><span class="player-label"></span><div class="player-bar"><i></i></div></div>
        <span class="player-time"></span>`;
      el.querySelector('.player-label').textContent = label;
      el.querySelector('.player-btn').addEventListener('click', async () => {
        el.classList.add('loading');
        try {
          const a = await getTrack(name);
          if (a.paused) await a.play(); else a.pause();
        } catch {
          el.querySelector('.player-label').textContent = "Couldn't load this recording";
        }
        el.classList.remove('loading');
      });
      el.querySelector('.player-bar').addEventListener('click', e => {
        const a = tracks[name];
        if (!a || !isFinite(a.duration)) return;
        const r = e.currentTarget.getBoundingClientRect();
        a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
      });
      wrap.appendChild(el);
    }
  }

  addEventListener('trackchange', e => {
    const { name, type } = e.detail;
    const a = tracks[name];
    document.querySelectorAll(`.player[data-track="${name}"]`).forEach(el => {
      const btn = el.querySelector('.player-btn');
      btn.textContent = a.paused ? '▶' : '❚❚';
      btn.setAttribute('aria-label', a.paused ? 'Play' : 'Pause');
      el.classList.toggle('playing', !a.paused);
      el.querySelector('.player-bar i').style.width = isFinite(a.duration) && a.duration ? (a.currentTime / a.duration) * 100 + '%' : '0';
      el.querySelector('.player-time').textContent = fmt(a.currentTime > 0 ? a.currentTime : a.duration);
    });
    if (name === 'song') {
      songBtn.textContent = a.paused ? '🎵 Play the birthday song' : '⏹ Stop the song';
      $('.cake-stage').classList.toggle('singing', !a.paused);
      if (type === 'ended' && litCount > 0) cakeMsg.textContent = 'Now make a wish and blow out the candles! 🎂';
    }
  });

  function showLetter(textContent) {
    const body = $('#letter-body');
    body.innerHTML = '';
    textContent.split(/\n\s*\n/).forEach((para, i) => {
      const p = document.createElement('p');
      p.textContent = para.trim();
      p.style.animationDelay = (0.6 + i * 0.45) + 's';
      body.appendChild(p);
    });
    buildPlayers();
    gate.hidden = true;
    letter.hidden = false;
  }

  const QUIPS = [
    "Hmm, that's not it. I'd know. I'm a fire demon.",
    'Nope! The door stays shut. Try again?',
    "Not quite. Maybe feed me a log and think about it?",
    "Close? Maybe? I'm a flame, not a judge. Try again.",
  ];

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const answer = input.value;
    try {
      const text = await openLetter(answer);
      try { localStorage.setItem(KEY_STORE, answer); } catch {}
      Sound.chime();
      says.textContent = 'Correct! Welcome in. ♥';
      setTimeout(() => {
        showLetter(text);
        const r = letter.getBoundingClientRect();
        Confetti.burst(r.left + r.width / 2, r.top + 40, 70);
        unlock('letter');
      }, 600);
    } catch {
      wrongTries++;
      Sound.wrong();
      says.textContent = QUIPS[(wrongTries - 1) % QUIPS.length];
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      if (L.hint && wrongTries >= 2) { hintEl.textContent = 'Hint: ' + L.hint; hintEl.hidden = false; }
    }
  });

  const songBtn = $('#play-song');
  songBtn.hidden = !(L && L.media && L.media.song);
  songBtn.addEventListener('click', async () => {
    if (!(await unlockFromStorage())) {
      cakeMsg.textContent = '🔥 Calcifer says: that song is locked behind the black door. Open it first!';
      Sound.wrong();
      return;
    }
    try {
      const a = await getTrack('song');
      if (a.paused) await a.play();
      else { a.pause(); a.currentTime = 0; }
    } catch {
      cakeMsg.textContent = "Hmm, the song couldn't be loaded.";
    }
  });

  if (L) {
    $('#secret-question').textContent = L.question;
    let known = null;
    try { known = localStorage.getItem(KEY_STORE); } catch {}
    if (known) openLetter(known).then(showLetter).catch(() => {});
  }
})();
