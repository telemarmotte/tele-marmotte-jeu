// Télé-Marmotte : lecture des niveaux et collisions avec le décor
window.TM = window.TM || {};
(function (TM) {
  const T = 16, ROWS = 12;
  const AIR = 0, DIRT = 1, ROCK = 2, PLANK = 3, ICE = 4, SPIKE = 5;
  TM.T = T;
  TM.ROWS = ROWS;
  TM.TILE = { AIR, DIRT, ROCK, PLANK, ICE, SPIKE };

  const TILE_OF = { '#': DIRT, '=': ROCK, '-': PLANK, '_': ICE, '^': SPIKE };
  const RE = /^(.)(\d+)(?:-(\d+))?(?:\/(\d+))?,(\d+)$/;

  function isSolid(t) { return t === DIRT || t === ROCK || t === ICE; }
  TM.isSolid = isSolid;

  TM.buildLevel = function (def) {
    const g = def.ground.replace(/\s+/g, '');
    const w = g.length, h = ROWS;
    const tiles = new Uint8Array(w * h);
    for (let x = 0; x < w; x++) {
      if (g[x] === '.') continue;
      const s = parseInt(g[x], 36);
      for (let y = s; y < h; y++) tiles[y * w + x] = DIRT;
    }
    const L = {
      def: def, w: w, h: h, tiles: tiles, pw: w * T, ph: h * T,
      start: { x: 2 * T + 3, y: 8 * T }, goal: null,
      items: [], enemies: [], lifts: [], checkpoints: [], hints: [], decor: [],
      totalReels: 0
    };
    L.tile = function (tx, ty) {
      if (tx < 0 || tx >= w) return ROCK;
      if (ty < 0 || ty >= h) return AIR;
      return tiles[ty * w + tx];
    };

    for (const tok of def.objects.trim().split(/\s+/)) {
      const m = RE.exec(tok);
      if (!m) { console.warn('objet illisible', tok); continue; }
      const ch = m[1], x1 = +m[2], x2 = m[3] !== undefined ? +m[3] : x1;
      const step = m[4] ? +m[4] : 1, y = +m[5];
      const bottom = (y + 1) * T;
      if (TILE_OF[ch] !== undefined) {
        for (let x = x1; x <= x2; x += step) if (x < w) tiles[y * w + x] = TILE_OF[ch];
        continue;
      }
      if (ch === 'E') {
        L.enemies.push({ type: 'E', x: x1 * T, y: y * T + 2, w: 14, h: 9, ox: 1, oy: 2,
          x0: x1 * T, x1: x2 * T + T - 14, y0: y * T + 2, face: 1, t: x1 * 7 });
        continue;
      }
      if (ch === 'L') {
        L.lifts.push({ x: x1 * T, y: y * T + 8, w: 32, h: 6, xa: x1 * T, xb: x2 * T, dir: 1, dx: 0 });
        continue;
      }
      for (let x = x1; x <= x2; x += step) {
        const px = x * T;
        switch (ch) {
          case 'P': L.start = { x: px + 3, y: bottom - 13 }; break;
          case 'K': L.goal = { x: px, y: bottom - 20, w: 20, h: 20 }; break;
          case 'T': L.checkpoints.push({ x: px, y: bottom - 14, w: 16, h: 14, on: false, anim: 0 }); break;
          case 'i': L.hints.push({ x: px + 2, y: bottom - 12, w: 12, h: 12, idx: 0 }); break;
          case 'o': L.items.push({ kind: 'reel', x: px + 2, y: y * T + 2, w: 12, h: 12 }); L.totalReels++; break;
          case 'm': L.items.push({ kind: 'berry', x: px + 4, y: y * T + 6, w: 8, h: 8 }); break;
          case 'C': L.items.push({ kind: 'cassette', x: px + 1, y: y * T + 6, w: 14, h: 8 }); break;
          case 'F': L.enemies.push({ type: 'F', x: px + 1, y: bottom - 11, w: 14, h: 11, ox: 1, oy: 1, face: -1 }); break;
          case 'B': L.enemies.push({ type: 'B', x: px, y: bottom - 13, w: 18, h: 13, ox: 1, oy: 2, face: -1, state: 'walk', timer: 0 }); break;
          case 'f': case 'h': case 'a': case 'A':
            L.decor.push({ kind: ch, x: px, y: bottom, seed: (x * 7919) % 97 }); break;
          default: console.warn('lettre inconnue', ch);
        }
      }
    }
    L.hints.sort((a, b) => a.x - b.x).forEach((hnt, i) => { hnt.idx = i; });
    L.checkpoints.sort((a, b) => a.x - b.x);
    // Un objet posé dans le sol remonte jusqu'à l'air libre
    for (const e of L.enemies.concat(L.items)) {
      let n = 0;
      while (n++ < ROWS && TM.hitsSolid(L, e)) e.y -= T;
    }
    if (!L.goal) L.goal = { x: L.pw - 3 * T, y: 8 * T - 4, w: 20, h: 20 };
    return L;
  };

  TM.hitsSolid = function (L, e) {
    const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
    const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        if (isSolid(L.tile(tx, ty))) return true;
    return false;
  };

  // Déplacement horizontal, renvoie true si un mur arrête l'entité
  TM.moveX = function (L, e, dx) {
    e.x += dx;
    const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
    if (dx > 0) {
      const tx = Math.floor((e.x + e.w - 0.01) / T);
      for (let ty = y0; ty <= y1; ty++)
        if (isSolid(L.tile(tx, ty))) { e.x = tx * T - e.w; return true; }
    } else if (dx < 0) {
      const tx = Math.floor(e.x / T);
      for (let ty = y0; ty <= y1; ty++)
        if (isSolid(L.tile(tx, ty))) { e.x = (tx + 1) * T; return true; }
    }
    return false;
  };

  // Déplacement vertical : sol, plafond et planches traversables par dessous
  TM.moveY = function (L, e, dy) {
    const prevBottom = e.y + e.h;
    e.y += dy;
    e.onGround = false;
    const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
    if (dy > 0) {
      const ty = Math.floor((e.y + e.h - 0.01) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const t = L.tile(tx, ty);
        if (isSolid(t) || (t === PLANK && prevBottom <= ty * T + 0.5)) {
          e.y = ty * T - e.h; e.onGround = true; e.groundTile = t;
          return true;
        }
      }
    } else if (dy < 0) {
      const ty = Math.floor(e.y / T);
      for (let tx = x0; tx <= x1; tx++)
        if (isSolid(L.tile(tx, ty))) { e.y = (ty + 1) * T; return true; }
    }
    return false;
  };

  // Le sol porte-t-il quelque chose en (px, py) ? Sert aux bêtes pour ne pas tomber
  TM.floorAt = function (L, px, py) {
    const t = L.tile(Math.floor(px / T), Math.floor(py / T));
    return isSolid(t) || t === PLANK;
  };

  TM.overlap = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };
})(window.TM);
