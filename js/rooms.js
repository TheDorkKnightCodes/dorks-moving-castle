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

  async function decrypt(answer) {
    const pw = normalize(answer);
    if (!pw) throw new Error('empty');
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: fromB64(L.salt), iterations: L.iterations, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(L.iv) }, key, fromB64(L.data));
    return new TextDecoder().decode(plain);
  }

  function showLetter(textContent) {
    const body = $('#letter-body');
    body.innerHTML = '';
    textContent.split(/\n\s*\n/).forEach((para, i) => {
      const p = document.createElement('p');
      p.textContent = para.trim();
      p.style.animationDelay = (0.6 + i * 0.45) + 's';
      body.appendChild(p);
    });
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
      const text = await decrypt(answer);
      try { localStorage.setItem('movingCastle.key', answer); } catch {}
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

  if (L) {
    $('#secret-question').textContent = L.question;
    let known = null;
    try { known = localStorage.getItem('movingCastle.key'); } catch {}
    if (known) decrypt(known).then(showLetter).catch(() => {});
  }
})();
