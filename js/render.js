// Télé-Marmotte : dessin du décor et des personnages (écran interne 256 x 144)
window.TM = window.TM || {};
(function (TM) {
  const T = 16;
  const WORLDS = [
    { // L'Alpage
      sky: ['#5fb4e6', '#76c0ea', '#8fcdef', '#a9d9f3', '#c4e6f7', '#ddf1fa'],
      far: '#8aa9c9', farSnow: '#eef4fa', near: '#79b85c', nearDk: '#58954a', cloud: '#ffffff',
      grass: '#5cb83a', grassLt: '#93d963', grassDk: '#2f7a2a',
      dirt: '#94602f', dirtDk: '#6a4121', dirtLt: '#b47c44',
      rock: '#8c929c', rockDk: '#5b616b', rockLt: '#bcc2ca',
      plank: '#b57d42', plankDk: '#6e4a24',
      spike: '#4c7d34', spikeTip: '#b36ad8',
      ice: '#8fd0f2', iceLt: '#e0f6ff', iceDk: '#4f9cc8',
      tree: '#2f6e3a', treeDk: '#1f4d29', treeLt: '#3f8a4a', trunk: '#5a3a1e',
      flower: '#3f5fd8', flowerC: '#f5d76e', dust: '#d9c09a'
    },
    { // Le Bois de mélèzes
      sky: ['#e58a5c', '#ec9a66', '#f1ad73', '#f5c084', '#f8d39a', '#fbe4b6'],
      far: '#a77490', farSnow: '#f6e6ea', near: '#cf7f2a', nearDk: '#a65d1c', cloud: '#ffe9d2',
      grass: '#c79a35', grassLt: '#e8c45c', grassDk: '#8a6420',
      dirt: '#7a4a2a', dirtDk: '#4f2d18', dirtLt: '#98603a',
      rock: '#8b8380', rockDk: '#5d5552', rockLt: '#b4aca6',
      plank: '#9a6a38', plankDk: '#5c3d1e',
      spike: '#5a2e2e', spikeTip: '#e04848',
      ice: '#8fd0f2', iceLt: '#e0f6ff', iceDk: '#4f9cc8',
      tree: '#e0902a', treeDk: '#b0641a', treeLt: '#f2b24a', trunk: '#4a2e18',
      flower: '#d23a2a', flowerC: '#fff4e0', dust: '#c9a070'
    },
    { // Le Sommet
      sky: ['#7aa9dc', '#8db7e4', '#a2c6eb', '#b8d5f1', '#cfe3f6', '#e6f1fb'],
      far: '#b4c6dd', farSnow: '#ffffff', near: '#d9e5f3', nearDk: '#b5c8e0', cloud: '#ffffff',
      grass: '#f4f8ff', grassLt: '#ffffff', grassDk: '#bccde4',
      dirt: '#6d7584', dirtDk: '#4a5160', dirtLt: '#8a93a2',
      rock: '#7d8696', rockDk: '#525a68', rockLt: '#a9b1be',
      plank: '#a87a4a', plankDk: '#634526',
      spike: '#7fc0e4', spikeTip: '#ffffff',
      ice: '#8fd0f2', iceLt: '#e0f6ff', iceDk: '#4f9cc8',
      tree: '#2d5e4a', treeDk: '#1d4234', treeLt: '#ffffff', trunk: '#4a3220',
      flower: '#ffffff', flowerC: '#f2d24a', dust: '#ffffff'
    }
  ];
  TM.WORLDS = WORLDS;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  // --- Tuiles : 0 dessus de terre, 1-2 terre, 3 rocher, 4 planche, 5 glace, 6 piques ---
  function makeTiles(P, wi) {
    const c = canvas(T * 7, T), g = c.getContext('2d'), r = rng(42 + wi);
    function speckle(ox, oy0) {
      for (let i = 0; i < 9; i++) { g.fillStyle = P.dirtDk; g.fillRect(ox + (r() * 15 | 0), oy0 + (r() * (15 - oy0) | 0), 2, 1); }
      for (let i = 0; i < 4; i++) { g.fillStyle = P.dirtLt; g.fillRect(ox + (r() * 15 | 0), oy0 + (r() * (15 - oy0) | 0), 1, 1); }
    }
    for (let k = 0; k < 3; k++) { g.fillStyle = P.dirt; g.fillRect(k * T, 0, T, T); speckle(k * T, k === 0 ? 6 : 0); }
    for (let x = 0; x < T; x++) {
      const hgt = 4 + ((x * 7) % 3 === 0 ? 1 : 0) + (x % 5 === 2 ? 1 : 0);
      g.fillStyle = P.grass; g.fillRect(x, 0, 1, hgt);
      g.fillStyle = P.grassDk; g.fillRect(x, hgt, 1, 1);
      if (x % 4 === 1) { g.fillStyle = P.grassLt; g.fillRect(x, 1, 1, 1); }
    }
    // rocher
    let o = 3 * T;
    g.fillStyle = P.rock; g.fillRect(o, 0, T, T);
    g.fillStyle = P.rockLt; g.fillRect(o, 0, T, 1); g.fillRect(o, 0, 1, T);
    g.fillStyle = P.rockDk; g.fillRect(o, T - 1, T, 1); g.fillRect(o + T - 1, 0, 1, T);
    g.fillRect(o + 5, 4, 1, 4); g.fillRect(o + 6, 8, 3, 1); g.fillRect(o + 11, 10, 1, 3);
    // planche
    o = 4 * T;
    g.fillStyle = P.plank; g.fillRect(o, 0, T, 5);
    g.fillStyle = P.plankDk; g.fillRect(o, 5, T, 1); g.fillRect(o + 7, 1, 1, 3);
    g.fillRect(o + 2, 2, 1, 1); g.fillRect(o + 13, 2, 1, 1);
    g.fillRect(o + 3, 6, 2, 3); g.fillRect(o + 11, 6, 2, 3);
    // glace
    o = 5 * T;
    g.fillStyle = P.ice; g.fillRect(o, 0, T, T);
    g.fillStyle = P.iceLt; g.fillRect(o, 0, T, 2);
    for (let i = 0; i < 5; i++) g.fillRect(o + 3 + i, 4 + i, 1, 1);
    g.fillRect(o + 10, 9, 1, 1); g.fillRect(o + 11, 10, 1, 1);
    g.fillStyle = P.iceDk; g.fillRect(o, T - 1, T, 1); g.fillRect(o + T - 1, 0, 1, T);
    // piques (chardons, ronces ou glace selon le monde)
    o = 6 * T;
    for (let i = 0; i < 4; i++) {
      const bx = o + i * 4;
      g.fillStyle = P.spike;
      g.fillRect(bx + 1, 10, 2, 6); g.fillRect(bx, 13, 4, 3);
      g.fillStyle = P.spikeTip;
      g.fillRect(bx + 1, 8, 2, 2);
    }
    return c;
  }

  // --- Lointain : montagnes, puis collines proches ---
  function makeFar(P, wi) {
    const c = canvas(512, 220), g = c.getContext('2d'), r = rng(7 + wi * 13);
    let x = -40;
    while (x < 560) {
      const w = 70 + r() * 70, h = 45 + r() * 45, base = 118;
      const px = x + w / 2, py = base - h;
      g.fillStyle = P.far;
      g.beginPath(); g.moveTo(x, base); g.lineTo(px, py); g.lineTo(x + w, base); g.closePath(); g.fill();
      g.fillStyle = P.farSnow;
      g.beginPath(); g.moveTo(px, py);
      g.lineTo(px + w * 0.16, py + h * 0.3); g.lineTo(px + w * 0.05, py + h * 0.24);
      g.lineTo(px - w * 0.04, py + h * 0.33); g.lineTo(px - w * 0.16, py + h * 0.3);
      g.closePath(); g.fill();
      x += w * 0.6;
    }
    g.fillStyle = P.far; g.fillRect(0, 117, 512, 103);
    // les bords de la bande doivent se raccorder : on recopie le début à la fin
    g.drawImage(c, 0, 0, 40, 220, 512 - 40, 0, 40, 220);
    return c;
  }
  function makeNear(P, wi) {
    const c = canvas(512, 220), g = c.getContext('2d'), r = rng(99 + wi);
    for (let x = 0; x < 512; x++) {
      const t = x / 512 * Math.PI * 2;
      const y = 112 + Math.sin(t * 2) * 8 + Math.sin(t * 5 + 1) * 4;
      g.fillStyle = P.near; g.fillRect(x, y | 0, 1, 220);
    }
    for (let i = 0; i < 26; i++) {
      const x = (i * 512 / 26 + r() * 12) | 0;
      const t = x / 512 * Math.PI * 2;
      const y = 114 + Math.sin(t * 2) * 8 + Math.sin(t * 5 + 1) * 4;
      const h = 10 + (r() * 10 | 0);
      g.fillStyle = P.nearDk;
      for (let k = 0; k < h; k++) {
        const half = Math.floor(k / 2.6);
        g.fillRect(x - half, (y - h + k) | 0, half * 2 + 1, 1);
      }
    }
    // Plus bas, la vallée s'enfonce dans l'ombre : un ravin doit se lire comme un trou
    const steps = ['rgba(20,14,10,.25)', 'rgba(20,14,10,.45)', 'rgba(20,14,10,.65)', 'rgba(20,14,10,.82)'];
    steps.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, 128 + i * 6, 512, 220); });
    return c;
  }

  const cache = {};
  function worldGfx(wi) {
    if (!cache[wi]) {
      const P = WORLDS[wi];
      cache[wi] = { P: P, tiles: makeTiles(P, wi), far: makeFar(P, wi), near: makeNear(P, wi) };
    }
    return cache[wi];
  }

  function tiled(g, img, off, y) {
    const w = img.width;
    let x = -(((off % w) + w) % w);
    for (; x < TM.VW; x += w) g.drawImage(img, x | 0, y | 0);
  }

  function drawSky(g, W, cx, cy, frame) {
    const P = W.P, bands = P.sky, bh = Math.ceil(TM.VH / bands.length);
    bands.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * bh, TM.VW, bh); });
    tiled(g, W.far, cx * 0.12, -cy * 0.08 - 26);
    // nuages en pixels
    g.fillStyle = P.cloud;
    for (let i = 0; i < 5; i++) {
      const span = TM.VW + 80;
      const x = ((i * 97 - cx * 0.2 + frame * 0.06 * (1 + i % 2)) % span + span) % span - 40;
      const y = 10 + (i * 23) % 34 - cy * 0.05;
      g.fillRect(x, y, 22, 4); g.fillRect(x + 4, y - 3, 10, 3); g.fillRect(x + 12, y - 2, 6, 2);
    }
    tiled(g, W.near, cx * 0.35, -18 - cy * 0.25);
  }

  function drawTree(g, P, wi, x, y) {
    g.fillStyle = P.trunk; g.fillRect(x + 6, y - 6, 3, 6);
    for (let k = 0; k < 22; k++) {
      const half = Math.min(7, 1 + Math.floor((k % 8) * 0.9 + k / 6));
      g.fillStyle = (k % 8 === 7) ? P.treeDk : P.tree;
      g.fillRect(x + 7 - half, y - 28 + k, half * 2 + 1, 1);
      if (wi === 2 && k % 8 === 0) { g.fillStyle = P.treeLt; g.fillRect(x + 7 - half, y - 28 + k, half * 2 + 1, 1); }
      if (wi === 1 && k % 8 === 3) { g.fillStyle = P.treeLt; g.fillRect(x + 6 - half, y - 28 + k, 2, 1); }
    }
  }
  function drawAntenna(g, x, y, frame) {
    g.fillStyle = '#c33a3a';
    for (let k = 0; k < 64; k++) {
      const half = Math.max(1, Math.floor((64 - k) / 10));
      g.fillStyle = Math.floor(k / 8) % 2 ? '#f4f4f4' : '#d43c3c';
      g.fillRect(x + 8 - half, y - 64 + k, 1, 1);
      g.fillRect(x + 8 + half, y - 64 + k, 1, 1);
      if (k % 8 === 4) g.fillRect(x + 8 - half, y - 64 + k, half * 2 + 1, 1);
    }
    g.fillStyle = '#e8eef4'; g.fillRect(x + 10, y - 44, 5, 7); g.fillStyle = '#9aa6b4'; g.fillRect(x + 14, y - 43, 1, 5);
    if ((frame >> 4) % 2) { g.fillStyle = '#ff3030'; g.fillRect(x + 7, y - 67, 3, 3); }
  }
  function drawFlower(g, P, wi, d) {
    const x = d.x + 6 + (d.seed % 5), y = d.y;
    if (wi === 1) { // amanite
      g.fillStyle = P.flowerC; g.fillRect(x, y - 4, 2, 4);
      g.fillStyle = P.flower; g.fillRect(x - 2, y - 6, 6, 2); g.fillRect(x - 1, y - 7, 4, 1);
      g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 6, 1, 1); g.fillRect(x + 2, y - 7, 1, 1);
      return;
    }
    g.fillStyle = wi === 2 ? '#9aa8bb' : '#2f7a2a'; g.fillRect(x + 1, y - 4, 1, 4);
    g.fillStyle = P.flower;
    g.fillRect(x, y - 6, 3, 1); g.fillRect(x + 1, y - 7, 1, 3);
    if (wi === 2) { g.fillRect(x - 1, y - 6, 5, 1); g.fillRect(x + 1, y - 8, 1, 5); }
    g.fillStyle = P.flowerC; g.fillRect(x + 1, y - 6, 1, 1);
  }
  function drawGrass(g, P, d) {
    const x = d.x + 4 + (d.seed % 6), y = d.y;
    g.fillStyle = P.grassDk;
    g.fillRect(x, y - 3, 1, 3); g.fillRect(x + 2, y - 5, 1, 5); g.fillRect(x + 4, y - 3, 1, 3);
    g.fillStyle = P.grass; g.fillRect(x + 1, y - 2, 1, 2); g.fillRect(x + 3, y - 4, 1, 4);
  }

  function drawTiles(g, Wg, L, cx, cy) {
    const tx0 = Math.max(0, Math.floor(cx / T)), tx1 = Math.min(L.w - 1, Math.floor((cx + TM.VW) / T));
    const ty0 = Math.max(0, Math.floor(cy / T)), ty1 = Math.min(L.h - 1, Math.floor((cy + TM.VH) / T));
    const TL = TM.TILE, P = Wg.P;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = L.tile(tx, ty);
        if (!t) continue;
        let k;
        if (t === TL.DIRT) {
          const above = ty > 0 ? L.tile(tx, ty - 1) : 0;
          k = (above === TL.DIRT || above === TL.ROCK || above === TL.ICE) ? 1 + ((tx * 3 + ty) % 2) : 0;
        } else k = { 2: 3, 3: 4, 4: 5, 5: 6 }[t];
        const sx = tx * T - cx, sy = ty * T - cy;
        g.drawImage(Wg.tiles, k * T, 0, T, T, sx, sy, T, T);
        if (t === TL.DIRT) {
          g.fillStyle = P.dirtDk;
          if (!TM.isSolid(L.tile(tx - 1, ty))) g.fillRect(sx, sy + (k === 0 ? 5 : 0), 1, T);
          if (!TM.isSolid(L.tile(tx + 1, ty))) g.fillRect(sx + T - 1, sy + (k === 0 ? 5 : 0), 1, T);
        }
      }
    }
  }

  function spr(g, s, x, y, face, white) {
    const img = white ? (face < 0 ? s.wl : s.wr) : (face < 0 ? s.l : s.r);
    g.drawImage(img, Math.round(x), Math.round(y));
  }
  function zGlyph(g, x, y) {
    g.fillStyle = '#2b1a10';
    g.fillRect(x + 1, y + 1, 4, 1); g.fillRect(x + 3, y + 2, 1, 1); g.fillRect(x + 2, y + 3, 1, 1); g.fillRect(x + 1, y + 4, 4, 1);
    g.fillStyle = '#ffffff';
    g.fillRect(x, y, 4, 1); g.fillRect(x + 2, y + 1, 1, 1); g.fillRect(x + 1, y + 2, 1, 1); g.fillRect(x, y + 3, 4, 1);
  }

  function drawEnemy(g, G, e, cx, cy) {
    const S = TM.SPR, asleep = e.sleep > 0;
    let s;
    if (e.type === 'F') s = asleep ? S.foxSleep : (Math.floor(e.anim || 0) % 2 ? S.fox2 : S.fox1);
    else if (e.type === 'E') s = asleep ? S.eagleSleep : (Math.floor(e.anim || 0) % 2 ? S.eagle2 : S.eagle1);
    else s = asleep ? S.ibexSleep : (Math.floor(e.anim || 0) % 2 ? S.ibex2 : S.ibex1);
    let x = e.x - e.ox - cx, y = e.y - e.oy - cy;
    if (e.type === 'B' && e.state === 'prep') x += (G.frame >> 1) % 2 ? 1 : -1;
    const white = asleep && e.sleep < 90 && (e.sleep >> 2) % 2 === 0;
    if (e.squash > 0) {
      const img = e.face < 0 ? s.l : s.r, k = 0.7 + (8 - e.squash) * 0.0375;
      g.drawImage(img, Math.round(x), Math.round(y + s.h * (1 - k)), s.w, Math.round(s.h * k));
    } else spr(g, s, x, y, e.face, white);
    if (asleep && (G.frame >> 5) % 2) zGlyph(g, Math.round(x + s.w - 4), Math.round(y - 5));
  }

  function drawPlayer(g, G, cx, cy) {
    const p = G.p, S = TM.SPR;
    if (p.inv > 0 && (p.inv >> 2) % 2 && G.state === 'play') return;
    let s;
    if (G.state === 'coupez' || p.hurtT > 0) s = S.mHurt;
    else if (G.state === 'win') s = (G.stateT >> 3) % 2 ? S.mJump : S.mWhistle;
    else if (p.wpose > 0) s = S.mWhistle;
    else if (!p.onGround) s = S.mJump;
    else if (Math.abs(p.vx) > 0.3) s = [S.mRun1, S.mStand, S.mRun2, S.mStand][Math.floor(p.anim) % 4];
    else s = (G.frame % 200) < 8 ? S.mBlink : S.mStand;
    let y = p.y - 3 - cy;
    if (G.state === 'win') y -= Math.abs(Math.sin(G.stateT * 0.15)) * 6;
    spr(g, s, p.x - 3 - cx, y, p.face);
  }

  function drawWave(g, w, cx, cy) {
    const r = 3 + w.age * 0.55, fade = w.age > 18;
    g.fillStyle = fade ? '#fff3c4' : '#ffffff';
    for (let k = 0; k < 2; k++) {
      const rr = r - k * 4;
      if (rr < 1) continue;
      for (let a = -1.0; a <= 1.0; a += 0.2) {
        const x = w.x + 4 + Math.cos(a) * rr * w.face - cx, y = w.y + Math.sin(a) * rr * 1.3 - cy;
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    const S = TM.SPR.note;
    g.drawImage(w.face < 0 ? S.l : S.r, Math.round(w.x - cx), Math.round(w.y - 6 + Math.sin(w.age * 0.6) * 2 - cy));
  }

  function drawParticles(g, G, cx, cy, P) {
    for (const q of G.parts) {
      const x = Math.round(q.x - cx), y = Math.round(q.y - cy);
      if (q.kind === 'z') { if ((q.life >> 3) % 2 || q.life > 20) zGlyph(g, x, y); continue; }
      if (q.kind === 'dust') { g.fillStyle = P.dust; g.fillRect(x, y, 2, 1); continue; }
      g.fillStyle = q.kind === 'spark' ? '#ffe680' : '#ffffff';
      g.fillRect(x, y, 1, 1);
      if (q.kind === 'star' && q.life > 10) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    }
  }

  TM.render = function (g, G) {
    const L = G.L, wi = L.def.world, Wg = worldGfx(wi), P = Wg.P, S = TM.SPR;
    const cx = Math.round(G.cam.x), cy = Math.round(G.cam.y), f = G.frame;
    drawSky(g, Wg, cx, cy, f);

    for (const d of L.decor) {
      const x = d.x - cx, y = d.y - cy;
      if (x < -24 || x > TM.VW + 24) continue;
      if (d.kind === 'a') drawTree(g, P, wi, x, y);
      if (d.kind === 'A') drawAntenna(g, x, y, f);
    }
    for (const lf of L.lifts) {
      g.fillStyle = '#3a3a44';
      g.fillRect(lf.xa - 8 - cx, lf.y - 22 - cy, lf.xb - lf.xa + 48, 1);
    }
    drawTiles(g, Wg, L, cx, cy);
    for (const d of L.decor) {
      const x = d.x - cx;
      if (x < -16 || x > TM.VW + 16) continue;
      if (d.kind === 'f') drawFlower(g, P, wi, { x: x, y: d.y - cy, seed: d.seed });
      if (d.kind === 'h') drawGrass(g, P, { x: x, y: d.y - cy, seed: d.seed });
    }
    for (const h of L.hints) spr(g, S.sign, h.x - cx, h.y - cy, 1);
    for (const c of L.checkpoints) {
      const s = c.on ? S.clapShut : S.clapOpen;
      spr(g, s, c.x - cx, c.y - cy, 1, c.anim > 14);
    }
    const goal = L.goal;
    spr(g, S.camera, goal.x - cx, goal.y - cy, -1);
    if ((f >> 4) % 2) { g.fillStyle = '#ff2a2a'; g.fillRect(Math.round(goal.x - cx + 15), Math.round(goal.y - cy + 7), 1, 1); }

    for (const it of L.items) {
      const x = it.x - cx, y = it.y - cy;
      if (x < -16 || x > TM.VW + 16) continue;
      if (it.kind === 'reel') {
        const k = Math.abs(Math.cos(f * 0.07 + it.x * 0.05));
        const w = Math.max(2, Math.round(12 * k));
        g.drawImage(S.reel.r, Math.round(x + (12 - w) / 2), Math.round(y), w, 12);
      } else if (it.kind === 'berry') {
        spr(g, S.berry, x, y + Math.sin(f * 0.1 + it.x) * 1.5, 1);
      } else {
        spr(g, S.cassette, x, y + Math.sin(f * 0.08) * 2, 1, (f >> 3) % 6 === 0);
      }
    }
    for (const lf of L.lifts) {
      const x = Math.round(lf.x - cx), y = Math.round(lf.y - cy);
      g.fillStyle = '#3a3a44'; g.fillRect(x + 15, y - 22, 2, 18);
      g.fillStyle = '#c8402e'; g.fillRect(x, y, 32, 4); g.fillRect(x, y - 6, 3, 6);
      g.fillStyle = '#7a2216'; g.fillRect(x, y + 4, 32, 2);
    }
    for (const e of L.enemies) drawEnemy(g, G, e, cx, cy);
    for (const w of G.waves) drawWave(g, w, cx, cy);
    if (!G.hidePlayer) drawPlayer(g, G, cx, cy);
    drawParticles(g, G, cx, cy, P);
  };
})(window.TM);
