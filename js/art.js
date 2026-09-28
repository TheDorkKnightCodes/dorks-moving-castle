window.Art = (() => {
  const INK = '#2e2a33';

  const FACES = {
    awake: {
      eyes: `<g class="calc-eyes">
           <ellipse cx="40" cy="72" rx="8" ry="10" fill="#fff"/>
           <ellipse cx="60" cy="72" rx="8" ry="10" fill="#fff"/>
           <circle class="pupil" cx="41" cy="74" r="4.2" fill="${INK}"/>
           <circle class="pupil" cx="61" cy="74" r="4.2" fill="${INK}"/>
         </g>`,
      mouth: `<path d="M39 89 Q50 101 61 89 Q50 95 39 89 Z" fill="#8a2f10"/>`,
    },
    sleeping: {
      eyes: `<path d="M33 74 Q40 80 47 74 M53 74 Q60 80 67 74" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
      mouth: `<ellipse cx="50" cy="94" rx="3.5" ry="2.5" fill="#8a2f10"/>`,
    },
    grumpy: {
      eyes: `<path d="M33 75 Q40 79 47 75" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
           <path d="M52 73 Q60 67 68 73 Q60 80 52 73 Z" fill="#fff"/>
           <circle cx="60" cy="74" r="3.4" fill="${INK}"/>
           <path d="M51 72 L69 70" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
      mouth: `<path d="M42 96 Q50 90 58 96" stroke="#8a2f10" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    },
    angry: {
      eyes: `<ellipse cx="40" cy="74" rx="8" ry="8" fill="#fff"/>
           <ellipse cx="60" cy="74" rx="8" ry="8" fill="#fff"/>
           <circle cx="42" cy="76" r="3.4" fill="${INK}"/>
           <circle cx="58" cy="76" r="3.4" fill="${INK}"/>
           <path d="M29 62 L48 69 M71 62 L52 69" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
      mouth: `<path d="M37 91 Q50 83 63 91 Q50 107 37 91 Z" fill="#8a2f10"/>
           <path d="M42 90 L45 94 L48 89 L51 94 L54 89 L57 94 L59 90" fill="#fff"/>`,
    },
  };

  function calcifer({ sleeping = false, mood = sleeping ? 'sleeping' : 'awake' } = {}) {
    const { eyes, mouth } = FACES[mood] || FACES.awake;
    return `<svg viewBox="0 0 100 120" class="calcifer-svg" aria-hidden="true">
      <g class="calc-flame">
        <path d="M50 4 C56 22 72 26 76 44 C80 36 78 28 76 22 C92 36 96 60 92 78 C88 102 70 116 50 116 C30 116 12 102 8 78 C4 60 8 40 22 28 C22 38 24 44 28 48 C30 30 44 22 50 4 Z" fill="#ff6f1a"/>
        <path d="M50 30 C56 44 70 50 72 66 C76 60 76 54 74 50 C84 62 84 80 80 90 C74 106 62 112 50 112 C38 112 26 106 20 90 C16 80 18 64 26 56 C26 62 28 66 30 68 C32 52 46 46 50 30 Z" fill="#ffa62b"/>
        <path d="M50 60 C55 70 64 76 64 90 C64 102 58 108 50 108 C42 108 36 102 36 90 C36 76 45 70 50 60 Z" fill="#ffe27a"/>
      </g>
      ${eyes}${mouth}
    </svg>`;
  }

  const CATS = {
    orange: { body: '#ec9d52', mark: '#c9722f', ear: '#f7b9b1', eye: INK },
    black:  { body: '#3b3542', mark: '#3b3542', ear: '#c98a93', eye: '#f2d74e' },
    grey:   { body: '#a3a8b2', mark: '#7f848e', ear: '#f2b6bd', eye: '#3f7d4f' },
    white:  { body: '#f7f2e8', mark: '#e3d8c4', ear: '#f4b6bd', eye: '#4a78b8' },
    calico: { body: '#f7f2e8', mark: '#ec9d52', ear: '#f4b6bd', eye: INK, patch: '#3b3542' },
  };

  function cat(color = 'orange', { hat = false, party = false } = {}) {
    const c = CATS[color] || CATS.orange;
    const top = hat || party ? -30 : 0;
    const stripes = color === 'orange' || color === 'grey'
      ? `<path d="M44 21 L45.5 27 M50 19.5 L50 26 M56 21 L54.5 27" stroke="${c.mark}" stroke-width="2.4" stroke-linecap="round"/>
         <path d="M29 66 Q35 67 36 72 M71 66 Q65 67 64 72" stroke="${c.mark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : '';
    const patches = c.patch
      ? `<path d="M56 21 Q68 20 70 34 Q62 30 56 21 Z" fill="${c.patch}"/>
         <ellipse cx="38" cy="70" rx="9" ry="7" fill="${c.mark}"/>
         <ellipse cx="62" cy="80" rx="7" ry="6" fill="${c.patch}"/>`
      : '';
    const wizardHat = hat
      ? `<g class="wizard-hat">
           <path d="M26 24 Q40 -6 52 -26 Q58 -6 76 24 Z" fill="#5b3f8f" stroke="${INK}" stroke-width="2"/>
           <ellipse cx="51" cy="24" rx="30" ry="6" fill="#4a3278" stroke="${INK}" stroke-width="2"/>
           <path d="M44 4 l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#ffd35c"/>
           <circle cx="58" cy="12" r="2" fill="#ffd35c"/><circle cx="52" cy="-10" r="1.6" fill="#ffd35c"/>
         </g>`
      : '';
    const partyHat = party
      ? `<g><path d="M38 22 L50 -20 L62 22 Z" fill="#c9504b" stroke="${INK}" stroke-width="2"/>
           <path d="M42 8 L58 8 M45 -4 L55 -4" stroke="#ffd35c" stroke-width="3"/>
           <circle cx="50" cy="-22" r="5" fill="#ffd35c" stroke="${INK}" stroke-width="1.5"/></g>`
      : '';
    return `<svg viewBox="0 ${top} 100 ${100 - top}" class="cat-svg" aria-hidden="true">
      <path class="cat-tail" d="M70 88 C94 86 96 58 84 50" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <path class="cat-tail" d="M70 88 C94 86 96 58 84 50" fill="none" stroke="${c.body}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="50" cy="72" rx="25" ry="23" fill="${c.body}" stroke="${INK}" stroke-width="2"/>
      <polygon points="31,33 29,9 47,22" fill="${c.body}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="69,33 71,9 53,22" fill="${c.body}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="33,27 32,15 42,22" fill="${c.ear}"/>
      <polygon points="67,27 68,15 58,22" fill="${c.ear}"/>
      <circle cx="50" cy="40" r="21" fill="${c.body}" stroke="${INK}" stroke-width="2"/>
      ${patches}${stripes}
      <g class="cat-eyes">
        <ellipse cx="42" cy="39" rx="3" ry="4.4" fill="${c.eye}"/>
        <ellipse cx="58" cy="39" rx="3" ry="4.4" fill="${c.eye}"/>
        <circle cx="43" cy="37.5" r="1.1" fill="#fff"/><circle cx="59" cy="37.5" r="1.1" fill="#fff"/>
      </g>
      <path class="cat-happy" d="M38 40 Q42 36 46 40 M54 40 Q58 36 62 40" stroke="${color === 'black' ? '#f2d74e' : INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="36" cy="47" rx="4" ry="2.5" fill="#f4a0a8" opacity=".55"/>
      <ellipse cx="64" cy="47" rx="4" ry="2.5" fill="#f4a0a8" opacity=".55"/>
      <path d="M47.5 44.5 L52.5 44.5 L50 47.5 Z" fill="#e58c9a"/>
      <path d="M50 47.5 Q47 51.5 44 49.5 M50 47.5 Q53 51.5 56 49.5" stroke="${color === 'black' ? '#c9b9c0' : INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M28 44 L39 46 M28 50 L39 49 M72 44 L61 46 M72 50 L61 49" stroke="${color === 'black' ? '#c9b9c0' : INK}" stroke-width="1" opacity=".6"/>
      <ellipse cx="41" cy="93" rx="7" ry="4.5" fill="${c.body}" stroke="${INK}" stroke-width="1.8"/>
      <ellipse cx="59" cy="93" rx="7" ry="4.5" fill="${c.body}" stroke="${INK}" stroke-width="1.8"/>
      ${wizardHat}${partyHat}
    </svg>`;
  }

  function castle() {
    const leg = (x, i) => `
      <g class="leg leg-${i % 2}" style="transform-origin:${x}px 258px">
        <path d="M${x} 256 L${x - 9} 302 L${x + 3} 338" fill="none" stroke="#5a4f46" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M${x - 12} 341 L${x + 20} 341 M${x + 3} 339 L${x + 15} 332" stroke="#5a4f46" stroke-width="7" stroke-linecap="round"/>
      </g>`;
    const S = `stroke="#3f3a34" stroke-width="3" stroke-linejoin="round"`;
    const win = (x, y, w = 8, h = 11) => `<rect class="win" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#ffd36b" stroke="#3f3a34" stroke-width="1.5"/>`;
    return `<svg viewBox="0 0 400 350" class="castle-svg" aria-hidden="true">
      <g class="smoke-group">
        <circle class="smoke s1" cx="156" cy="66" r="9"/>
        <circle class="smoke s2" cx="156" cy="66" r="9"/>
        <circle class="smoke s3" cx="297" cy="94" r="8"/>
        <circle class="smoke s4" cx="297" cy="94" r="8"/>
      </g>
      ${[122, 170, 232, 280].map(leg).join('')}
      <g class="castle-body">
        <rect x="148" y="70" width="16" height="56" fill="#6d655c" ${S}/>
        <rect x="290" y="98" width="14" height="44" fill="#6d655c" ${S}/>
        <rect x="236" y="68" width="36" height="74" fill="#9c9385" ${S}/>
        <path d="M229 71 L254 28 L279 71 Z" fill="#4a6fa5" ${S}/>
        <path d="M254 28 L254 10" stroke="#3f3a34" stroke-width="3"/>
        <path class="flag" d="M254 10 L272 15 L254 21 Z" fill="#c9504b"/>
        <rect x="182" y="60" width="26" height="64" fill="#a8a092" ${S}/>
        <path d="M177 63 L195 30 L213 63 Z" fill="#c9504b" ${S}/>
        <path d="M78 258 C58 228 66 188 96 172 C92 140 118 116 150 122 C168 98 214 94 232 118 C266 104 308 126 306 160 C336 172 346 216 322 246 C314 268 282 276 252 270 L142 274 C112 278 90 274 78 258 Z" fill="#8d8579" ${S}/>
        <path d="M100 198 L150 188 L153 236 L104 245 Z" fill="#a39a8c" ${S}/>
        <path d="M250 178 L306 172 L311 222 L256 229 Z" fill="#766e64" ${S}/>
        <path d="M160 142 L228 138 L232 176 L162 180 Z" fill="#9b9284" ${S}/>
        <path d="M84 216 L42 204" stroke="#5a4f46" stroke-width="9" stroke-linecap="round"/>
        <path d="M322 204 L366 190" stroke="#5a4f46" stroke-width="9" stroke-linecap="round"/>
        <path d="M312 170 L350 150" stroke="#5a4f46" stroke-width="7" stroke-linecap="round"/>
        <rect x="108" y="118" width="36" height="58" fill="#b3ab9b" ${S}/>
        <path d="M101 121 L126 84 L151 121 Z" fill="#c4913f" ${S}/>
        ${win(116, 134)}${win(129, 134)}${win(188, 78)}${win(246, 88)}${win(258, 88)}
        ${win(176, 150, 10, 10)}${win(212, 148, 10, 10)}${win(268, 190)}${win(116, 212)}
        <g fill="#5a4f46">
          <circle cx="106" cy="204" r="2.2"/><circle cx="146" cy="196" r="2.2"/><circle cx="108" cy="238" r="2.2"/><circle cx="148" cy="230" r="2.2"/>
          <circle cx="256" cy="184" r="2.2"/><circle cx="300" cy="180" r="2.2"/><circle cx="260" cy="222" r="2.2"/><circle cx="304" cy="216" r="2.2"/>
        </g>
        <path class="castle-door" d="M186 270 L186 234 Q200 214 214 234 L214 270 Z" fill="#3b2f2a" stroke-width="5" stroke-linejoin="round"/>
        <circle cx="208" cy="252" r="2.4" fill="#ffd36b"/>
      </g>
    </svg>`;
  }

  function paint(root = document) {
    root.querySelectorAll('[data-art]').forEach(el => {
      const kind = el.dataset.art;
      if (kind === 'calcifer') el.innerHTML = calcifer();
      else if (kind === 'calcifer-sleep') el.innerHTML = calcifer({ sleeping: true });
      else if (kind === 'castle') el.innerHTML = castle();
      else if (kind === 'cat-wizard') el.innerHTML = cat('orange', { hat: true });
      else if (kind === 'cat-party') el.innerHTML = cat('orange', { party: true });
    });
  }

  return { calcifer, cat, castle, paint };
})();
