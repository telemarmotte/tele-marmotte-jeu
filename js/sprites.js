// Télé-Marmotte : sprites en pixel art (une lettre = une couleur, "." = transparent)
window.TM = window.TM || {};
(function (TM) {
  const PAL = {
    k: '#2b1a10', // contour
    d: '#74461f', // brun foncé
    b: '#a8693a', // brun marmotte
    l: '#e8bd86', // ventre clair
    w: '#fffaf0', // blanc
    p: '#d9707a', // rose
    n: '#141018', // noir
    o: '#e2782a', // renard
    O: '#a94f17', // renard foncé
    c: '#fbf1dc', // crème
    g: '#a3aab4', // gris
    G: '#5c636e', // gris foncé
    h: '#d9c49b', // bouquetin clair
    H: '#86704c', // bouquetin foncé, cornes, bois
    r: '#e23b3b', // rouge
    y: '#f5c842', // or
    Y: '#b8871d', // or foncé
    u: '#5458d0', // myrtille
    U: '#2c2f7a', // myrtille foncée
    a: '#8fd3f5', // verre bleu
    e: '#4a3222', // aigle foncé
    E: '#7a5435', // aigle
    f: '#f3ead6', // tête d'aigle
    j: '#f0b020'  // bec et pattes
  };

  const RAW = {};

  // --- La marmotte (16x16, regarde à droite) ---
  const M = [
    '................',
    '.......kk.......',
    '......kdkkkkk...',
    '.....kbbbbbbbbk.',
    '....kbbbbbbbbbbk',
    '....kbbbbbnbbbnk',
    '....kbbbbbbblllk',
    '.....kbbbbbbkwk.',
    '...kbbbbbbbllk..',
    '..kbbbbbbblllk..',
    '..kbbbbbbllllk..',
    '.kdbbbbbbllllk..',
    'kddbbbbbbllllk..',
    'kdkbbbbbblllk...',
    '.k.kbbbkbbbbk...',
    '...kkkk.kkkkk...'
  ];
  function variant(base, rows) {
    const out = base.slice();
    for (const i in rows) out[i] = rows[i];
    return out;
  }
  RAW.mStand = M;
  RAW.mBlink = variant(M, { 5: '....kbbbbbdbbbnk' });
  RAW.mRun1 = variant(M, {
    13: 'kdkbbbbbblllk...',
    14: '..kbbk...kbbk...',
    15: '.kkk......kkkk..'
  });
  RAW.mRun2 = variant(M, {
    13: 'kdkbbbbbblllk...',
    14: '....kbbbbbbk....',
    15: '....kkkkkkkk....'
  });
  RAW.mJump = variant(M, {
    14: '.k.kbbbbbbbk....',
    15: '....kkk.kkk.....'
  });
  RAW.mWhistle = variant(M, {
    5: '....kbbbbbnbbbnk',
    6: '....kbbbbbbbbllk',
    7: '.....kbbbbbbknk.',
    8: '...kbbbbbbbkbk..'
  });
  RAW.mHurt = variant(M, {
    4: '....kbbbbbkbbbbk',
    5: '....kbbbbbbkbbnk',
    7: '.....kbbbbbbknk.'
  });

  // --- Renard (16x12) ---
  const F = [
    '..........k..k..',
    '.........kok.kok',
    '.........kooook.',
    '.kk......koonok.',
    'kcck.....kooookk',
    'kcok....kcoooook',
    '.koookkkkcoook..',
    '..kooooooooock..',
    '...koooooooocck.',
    '...kOooooooOck..',
    '..kOk.kOkkOk.kOk',
    '..kkk.kkkkkk.kkk'
  ];
  RAW.fox1 = F;
  RAW.fox2 = variant(F, { 10: '..kOkkOk..kOkkOk', 11: '..kkkkkk..kkkkkk' });
  RAW.foxSleep = variant(F, { 3: '.kk......kookok.' });

  // --- Aigle (16x12) ---
  RAW.eagle1 = [
    '................',
    '.kkk........kkk.',
    '.keEk......kEek.',
    '..keEk....kEek..',
    '...keEk..kEek...',
    '....keEkkEekkk..',
    '.....keeeeekffk.',
    '.....keeeeefnfjk',
    '......keeeekfk..',
    '.......keeekk...',
    '.......kjkjk....',
    '................'
  ];
  RAW.eagle2 = [
    '................',
    '................',
    '................',
    '................',
    '......kkkk...kk.',
    '.....keeeek.kffk',
    '....keeeeeekfnjk',
    '...keEeeeeeekfk.',
    '..keEk.keeek....',
    '.keEk...kjkjk...',
    '.kkk............',
    '................'
  ];
  RAW.eagleSleep = variant(RAW.eagle2, { 6: '....keeeeeekffjk' });

  // --- Bouquetin (20x15) ---
  const B = [
    '....................',
    '...........kkkk.....',
    '..........kHHHHk....',
    '.........kHk..kHk...',
    '.........kk...kHhk..',
    '.............khhhnk.',
    '..kkkkkkkkkkkkhhhhk.',
    '.khhhhhhhhhhhhhhhhhk',
    '.kHhhhhhhhhhhhhkHk..',
    '.kHHhhhhhhhhhhhk.k..',
    '..kHHhhhhhhhhhk.....',
    '..khk.kHk..khk.kHk..',
    '..khk.kHk..khk.kHk..',
    '..kHk.kHk..kHk.kHk..',
    '..kkk.kkk..kkk.kkk..'
  ];
  RAW.ibex1 = B;
  RAW.ibex2 = variant(B, {
    11: '..khkkHk...khkkHk...',
    12: '..khkkHk...khkkHk...',
    13: '..kHkkHk...kHkkHk...',
    14: '..kkkkkk...kkkkkk...'
  });
  RAW.ibexSleep = variant(B, { 5: '.............khhhkk.' });

  // --- Objets ---
  RAW.reel = [
    '....kkkk....',
    '..kkggggkk..',
    '.kgggGGgggk.',
    '.kgggGGgggk.',
    'kgGGggggGGgk',
    'kgGGgkkgGGgk',
    'kggggkkggggk',
    'kggGGggGGggk',
    '.kgGGggGGgk.',
    '.kggggggggk.',
    '..kkggggkk..',
    '....kkkk....'
  ];
  RAW.berry = [
    '...kk...',
    '..kGk...',
    '.kuuuuk.',
    'kuuwuuuk',
    'kuuuuuuk',
    'kUuuuuUk',
    '.kUUUUk.',
    '..kkkk..'
  ];
  RAW.cassette = [
    'kkkkkkkkkkkkkk',
    'kyyyyyyyyyyyyk',
    'kykkkkkkkkkkyk',
    'kykwnkkkknwkyk',
    'kykkkkkkkkkkyk',
    'kyyyyyyyyyyyyk',
    'kYYYYYYYYYYYYk',
    'kkkkkkkkkkkkkk'
  ];
  RAW.note = [
    '...kk..',
    '...kyk.',
    '...kyyk',
    '...kykk',
    '...kyk.',
    '.kkkyk.',
    'kyyyyk.',
    'kyyyk..',
    '.kkk...'
  ];
  const CLAP_BODY = [
    '..knnnnnnnnnnk..',
    '..knwwwnnwwwnk..',
    '..knnnnnnnnnnk..',
    '..knwwnnnwwwnk..',
    '..knnnnnnnnnnk..',
    '..kkkkkkkkkkkk..',
    '.......kk.......',
    '.......kk.......',
    '......kkkk......'
  ];
  RAW.clapOpen = [
    '..kkkkkkkkkkkk..',
    '..kwwnnwwnnwwk..',
    '..kkkkkkkkkkkk..',
    '..k.............',
    '..k.............'
  ].concat(CLAP_BODY);
  RAW.clapShut = [
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '..kyynnyynnyyk..',
    '..kkkkkkkkkkkk..'
  ].concat(CLAP_BODY);
  RAW.camera = [
    '...kkkk..kkkk.......',
    '..kgGGgkkgGGgk......',
    '..kGkkGkkGkkGk......',
    '..kgGGgkkgGGgk......',
    '...kkkk..kkkk.......',
    '..kkkkkkkkkkkk......',
    '..kGGGGGGGGGGkkkkk..',
    '..kGrGGGGGGGGkgggk..',
    '..kGGGGGGGGGGkgaagk.',
    '..kGGGGGGGGGGkgaagk.',
    '..kGGGGGGGGGGkgggk..',
    '..kGGGGGGGGGGkkkkk..',
    '..kkkkkkkkkkkk......',
    '.......kkk..........',
    '......kHkHk.........',
    '.....kHk.kHk........',
    '....kHk...kHk.......',
    '...kHk.....kHk......',
    '..kHk.......kHk.....',
    '..kk.........kk.....'
  ];
  RAW.sign = [
    '............',
    '.kkkkkkkkkk.',
    '.khhhhnhhhk.',
    '.khhhhhhhhk.',
    '.khhhhnhhhk.',
    '.khhhhnhhhk.',
    '.kHHHHHHHHk.',
    '.kkkkkkkkkk.',
    '.....kk.....',
    '.....kk.....',
    '.....kk.....',
    '....kkkk....'
  ];

  RAW.heart = [
    '.kk...kk.',
    'krrk.krrk',
    'krwrkrrrk',
    'krrrrrrrk',
    '.krrrrrk.',
    '..krrrk..',
    '...krk...',
    '....k....'
  ];
  RAW.heartOff = RAW.heart.map(r => r.replace(/[rw]/g, 'G'));

  function build(name, rows) {
    const w = Math.max.apply(null, rows.map(r => r.length));
    const h = rows.length;
    rows.forEach((r, i) => { if (r.length !== w) console.warn('sprite', name, 'ligne', i, r.length, '≠', w); });
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ') continue;
        g.fillStyle = PAL[ch] || '#ff00ff';
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }
  function flip(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }
  function tint(src, color) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  TM.PAL = PAL;
  TM.SPR = {};
  for (const name in RAW) {
    const r = build(name, RAW[name]);
    const w = tint(r, '#ffffff');
    TM.SPR[name] = { r: r, l: flip(r), wr: w, wl: flip(w), w: r.width, h: r.height };
  }
})(window.TM);
