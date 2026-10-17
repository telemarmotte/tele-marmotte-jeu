// Télé-Marmotte : règles du jeu (une image = 1/60 s)
window.TM = window.TM || {};
(function (TM) {
  const T = 16, VW = 256, VH = 144;
  const SLEEP = 330;
  TM.VW = VW; TM.VH = VH;

  function sfx(n) { if (TM.sfx) TM.sfx(n); }
  function emit(G, type, data) { G.events.push({ type: type, data: data }); }

  TM.newGame = function (li) {
    const L = TM.buildLevel(TM.LEVELS[li]);
    const p = {
      x: L.start.x, y: L.start.y, w: 10, h: 13, vx: 0, vy: 0, face: 1,
      onGround: false, groundTile: 0, coyote: 0, jumpBuf: 0, wcd: 0, wpose: 0,
      inv: 0, hurtT: 0, hearts: 3, anim: 0, ride: null, prevBottom: 0
    };
    const G = {
      li: li, L: L, p: p, waves: [], parts: [], events: [],
      reels: 0, cassette: false, prise: 1, time: 0, sleeps: 0,
      cp: { x: L.start.x, y: L.start.y }, state: 'play', stateT: 0,
      cam: { x: 0, y: 0 }, frame: 0
    };
    snapCamera(G);
    return G;
  };

  function particle(G, x, y, kind, n) {
    for (let i = 0; i < n; i++) {
      G.parts.push({
        x: x, y: y, kind: kind,
        vx: (Math.random() - 0.5) * (kind === 'dust' ? 1.2 : 2.4),
        vy: kind === 'z' ? -0.4 : -Math.random() * 2,
        life: kind === 'z' ? 50 : 24, max: kind === 'z' ? 50 : 24
      });
    }
  }

  function respawn(G) {
    const p = G.p;
    p.x = G.cp.x; p.y = G.cp.y; p.vx = 0; p.vy = 0; p.ride = null;
    p.inv = 90; p.hurtT = 0;
    snapCamera(G);
  }

  function coupez(G) {
    G.state = 'coupez'; G.stateT = 0; G.prise++;
    G.p.hearts = 0;
    sfx('coupez');
    emit(G, 'coupez', G.prise);
  }

  function hurt(G, fromX) {
    const p = G.p;
    if (p.inv > 0 || G.state !== 'play') return;
    p.hearts--;
    sfx('hurt');
    if (p.hearts <= 0) { coupez(G); return; }
    p.inv = 90; p.hurtT = 16; p.ride = null;
    p.vy = -3.8;
    p.vx = (p.x + p.w / 2 < fromX ? -1 : 1) * 2.4;
  }

  function fall(G) {
    const p = G.p;
    p.hearts--;
    sfx('fall');
    if (p.hearts <= 0) { coupez(G); return; }
    respawn(G);
  }

  function snapCamera(G) {
    const c = G.cam, p = G.p, L = G.L;
    c.x = clamp(p.x + p.w / 2 - VW / 2, 0, L.pw - VW);
    c.y = clamp(p.y + p.h / 2 - VH * 0.58, -48, L.ph - VH);
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function updateCamera(G) {
    const c = G.cam, p = G.p, L = G.L;
    const tx = p.x + p.w / 2 - VW / 2 + p.face * 20;
    const ty = p.y + p.h / 2 - VH * 0.58;
    c.x += (tx - c.x) * 0.1;
    c.y += (ty - c.y) * 0.08;
    c.x = clamp(c.x, 0, L.pw - VW);
    c.y = clamp(c.y, -48, L.ph - VH);
  }

  function updateLifts(G) {
    for (const lf of G.L.lifts) {
      if (lf.wait > 0) { lf.wait--; lf.dx = 0; continue; }
      const sp = 0.8;
      lf.dx = lf.dir * sp;
      lf.x += lf.dx;
      if (lf.x >= lf.xb) { lf.x = lf.xb; lf.dir = -1; lf.wait = 40; }
      if (lf.x <= lf.xa) { lf.x = lf.xa; lf.dir = 1; lf.wait = 40; }
    }
  }

  function updatePlayer(G, inp) {
    const p = G.p, L = G.L;
    if (p.ride) TM.moveX(L, p, p.ride.dx);

    const onIce = p.onGround && p.groundTile === TM.TILE.ICE;
    const acc = p.onGround ? (onIce ? 0.06 : 0.24) : 0.16;
    const dec = p.onGround ? (onIce ? 0.015 : 0.28) : 0.05;
    const max = 2.0;
    let dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (p.hurtT > 0) { p.hurtT--; dir = 0; }
    if (dir) {
      if (Math.abs(p.vx) < max || Math.sign(p.vx) !== dir) p.vx += dir * acc;
      p.face = dir;
    } else if (p.vx > 0) p.vx = Math.max(0, p.vx - dec);
    else p.vx = Math.min(0, p.vx + dec);
    if (Math.abs(p.vx) > max) p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx) - max, 0.2);

    p.jumpBuf = inp.jumpPressed ? 8 : Math.max(0, p.jumpBuf - 1);
    p.coyote = (p.onGround || p.ride) ? 7 : Math.max(0, p.coyote - 1);
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -6.2; p.jumpBuf = 0; p.coyote = 0; p.ride = null; p.onGround = false;
      sfx('jump');
      particle(G, p.x + p.w / 2, p.y + p.h, 'dust', 3);
    }
    const g = (p.vy < 0 && inp.jump) ? 0.30 : 0.55;
    p.vy = Math.min(p.vy + g, 6.5);

    if (p.wcd > 0) p.wcd--;
    if (p.wpose > 0) p.wpose--;
    if (inp.whistlePressed && p.wcd === 0) {
      G.waves.push({ x: p.face > 0 ? p.x + p.w : p.x - 6, y: p.y + 4, vx: p.face * 3.2, age: 0, face: p.face });
      p.wcd = 26; p.wpose = 14;
      sfx('whistle');
    }

    if (TM.moveX(L, p, p.vx)) p.vx = 0;
    p.prevBottom = p.y + p.h;
    const wasGround = p.onGround;
    if (TM.moveY(L, p, p.vy)) p.vy = 0;
    p.ride = null;
    if (p.vy >= 0) {
      for (const lf of L.lifts) {
        if (p.x + p.w > lf.x + 2 && p.x < lf.x + lf.w - 2 &&
            p.prevBottom <= lf.y + 1 && p.y + p.h >= lf.y) {
          p.y = lf.y - p.h; p.vy = 0; p.onGround = true;
          p.groundTile = TM.TILE.PLANK; p.ride = lf;
        }
      }
    }
    if (p.onGround && !wasGround && p.vy === 0) particle(G, p.x + p.w / 2, p.y + p.h, 'dust', 2);
    p.anim = p.onGround ? p.anim + Math.abs(p.vx) * 0.09 : p.anim;
    if (p.inv > 0) p.inv--;

    // Ronces et piques : la moitié basse de la case pique
    const ty = Math.floor((p.y + p.h - 1) / T);
    for (let tx = Math.floor(p.x / T); tx <= Math.floor((p.x + p.w - 1) / T); tx++) {
      if (L.tile(tx, ty) === TM.TILE.SPIKE && p.y + p.h > ty * T + 9) hurt(G, tx * T + 8);
    }
    if (p.y > L.ph + 24) fall(G);
  }

  function updateEnemies(G) {
    const L = G.L, p = G.p;
    for (const e of L.enemies) {
      if (e.squash > 0) e.squash--;
      if (e.sleep > 0) {
        e.sleep--;
        if (e.sleep % 40 === 0 && e.sleep > 0) particle(G, e.x + e.w / 2, e.y - 2, 'z', 1);
      }
      const awake = !(e.sleep > 0);
      if (e.type === 'E') {
        if (awake) {
          e.t++;
          e.x += e.face * 0.7;
          if (e.x < e.x0) { e.x = e.x0; e.face = 1; }
          if (e.x > e.x1) { e.x = e.x1; e.face = -1; }
          e.y = e.y0 + Math.sin(e.t * 0.06) * 6;
          e.anim = (e.anim || 0) + 0.12;
        }
      } else {
        if (awake) walker(G, e);
        e.vy = Math.min((e.vy || 0) + 0.4, 6);
        if (TM.moveY(L, e, e.vy)) e.vy = 0;
        if (e.y > L.ph + 40) e.gone = true;
      }
      if (e.gone || G.state !== 'play') continue;
      if (TM.overlap(p, e)) {
        const fromAbove = p.vy > 0 && p.prevBottom <= e.y + 6;
        if (!awake) {
          if (fromAbove) {
            p.y = e.y - p.h; p.vy = G.input.jump ? -8.4 : -7.2;
            e.squash = 8;
            sfx('boing');
            particle(G, p.x + p.w / 2, p.y + p.h, 'star', 4);
          }
        } else if (fromAbove && e.type !== 'E') {
          p.y = e.y - p.h; p.vy = -4.6;
          sfx('bump');
        } else {
          hurt(G, e.x + e.w / 2);
        }
      }
    }
    L.enemies = L.enemies.filter(e => !e.gone);
  }

  function walker(G, e) {
    const L = G.L, p = G.p;
    let sp = e.type === 'F' ? 0.55 : 0.35;
    if (e.type === 'B') {
      if (e.state === 'walk') {
        const dy = Math.abs((p.y + p.h) - (e.y + e.h));
        const dx = (p.x + p.w / 2 - (e.x + e.w / 2)) * e.face;
        if (dy < 20 && dx > 0 && dx < 120) { e.state = 'prep'; e.timer = 26; sfx('ibex'); }
      } else if (e.state === 'prep') {
        e.timer--; sp = 0;
        if (e.timer <= 0) e.state = 'charge';
      } else if (e.state === 'charge') {
        sp = 2.6;
      } else if (e.state === 'stun') {
        e.timer--; sp = 0;
        if (e.timer <= 0) { e.face *= -1; e.state = 'walk'; }
      }
    }
    if (sp === 0) return;
    const hit = TM.moveX(L, e, e.face * sp);
    const aheadX = e.face > 0 ? e.x + e.w + 1 : e.x - 1;
    const noFloor = !TM.floorAt(L, aheadX, e.y + e.h + 2);
    if (hit || noFloor) {
      if (e.type === 'B' && e.state === 'charge') {
        e.state = 'stun'; e.timer = 50;
        if (hit) sfx('thud');
      } else e.face *= -1;
    }
    e.anim = (e.anim || 0) + sp * 0.12;
  }

  function updateWaves(G) {
    const L = G.L;
    for (const w of G.waves) {
      w.age++;
      w.x += w.vx;
      const hh = 5 + w.age * 0.8;
      const box = { x: w.x, y: w.y - hh, w: 8, h: hh * 2 };
      for (const e of L.enemies) {
        if (!TM.overlap(box, e)) continue;
        if (!(e.sleep > 0)) {
          sfx('sleep');
          G.sleeps++;
          particle(G, e.x + e.w / 2, e.y - 2, 'z', 1);
          if (e.type === 'B') e.state = 'walk';
        }
        e.sleep = SLEEP;
      }
      if (TM.isSolid(L.tile(Math.floor((w.x + 4) / T), Math.floor(w.y / T)))) w.age = 99;
    }
    G.waves = G.waves.filter(w => w.age < 26);
  }

  function updatePickups(G) {
    const L = G.L, p = G.p;
    for (const it of L.items) {
      if (!TM.overlap(p, it)) continue;
      it.taken = true;
      if (it.kind === 'reel') { G.reels++; sfx('reel'); particle(G, it.x + 6, it.y + 6, 'spark', 5); }
      if (it.kind === 'berry') { p.hearts = Math.min(3, p.hearts + 1); sfx('berry'); particle(G, it.x + 4, it.y + 4, 'star', 5); }
      if (it.kind === 'cassette') { G.cassette = true; sfx('cassette'); particle(G, it.x + 7, it.y + 4, 'star', 10); emit(G, 'flash', 'Cassette dorée trouvée !'); }
    }
    L.items = L.items.filter(it => !it.taken);

    for (const c of L.checkpoints) {
      if (c.anim > 0) c.anim--;
      if (!c.on && TM.overlap(p, c)) {
        c.on = true; c.anim = 20;
        G.cp = { x: c.x + 3, y: c.y + c.h - p.h };
        sfx('clap');
        emit(G, 'flash', 'Clap ! Tu reprendras ici.');
      }
    }
    for (const h of L.hints) {
      if (TM.overlap(p, { x: h.x - 8, y: h.y - 16, w: h.w + 16, h: h.h + 16 })) emit(G, 'hint', h.idx);
    }
    if (TM.overlap(p, L.goal)) {
      G.state = 'win'; G.stateT = 0;
      sfx('win');
      emit(G, 'win');
    }
  }

  function updateParticles(G) {
    for (const q of G.parts) {
      q.x += q.vx; q.y += q.vy; q.life--;
      if (q.kind !== 'z') q.vy += 0.12;
    }
    G.parts = G.parts.filter(q => q.life > 0);
  }

  TM.step = function (G, inp) {
    G.frame++;
    G.input = inp;
    if (G.state === 'play') {
      G.time++;
      updateLifts(G);
      updatePlayer(G, inp);
      updateWaves(G);
      updateEnemies(G);
      updatePickups(G);
      updateCamera(G);
    } else if (G.state === 'coupez') {
      G.stateT++;
      if (G.stateT === 100) {
        G.p.hearts = 3;
        respawn(G);
        G.state = 'play';
        emit(G, 'reprise', G.prise);
      }
    } else if (G.state === 'win') {
      G.stateT++;
      G.p.vx = 0; G.p.wpose = 2;
    }
    updateParticles(G);
  };
})(window.TM);
