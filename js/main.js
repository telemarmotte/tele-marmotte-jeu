// Télé-Marmotte : boucle, commandes, écrans et sauvegarde
window.TM = window.TM || {};
(function (TM) {
  const $ = id => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  // ---------- Sauvegarde (facultative : le jeu marche sans) ----------
  const SAVE_KEY = 'tele-marmotte-v1';
  const save = { unlocked: 1, best: {}, sfx: true, music: true, pad: true }; // pad : croix et boutons A/B affichés
  try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* stockage indisponible */ }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* tant pis */ } }
  TM.audio.setSfx(save.sfx);
  TM.audio.setMusic(save.music);

  // Icônes du HUD tirées des sprites du jeu
  const rootStyle = document.documentElement.style;
  [['--i-heart', 'heart'], ['--i-heart-off', 'heartOff'], ['--i-reel', 'reel'], ['--i-gold', 'cassette']]
    .forEach(([v, n]) => rootStyle.setProperty(v, 'url(' + TM.SPR[n].r.toDataURL() + ')'));

  // ---------- Commandes ----------
  const keys = { left: false, right: false, jump: false, whistle: false };
  const touch = { left: false, right: false, jump: false, whistle: false };
  let jumpEdge = false, whistleEdge = false;
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', Space: 'jump', KeyW: 'jump', KeyZ: 'jump', KeyK: 'jump',
    KeyX: 'whistle', KeyC: 'whistle', KeyJ: 'whistle', ShiftLeft: 'whistle', ShiftRight: 'whistle'
  };
  addEventListener('keydown', e => {
    TM.audio.unlock();
    if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); e.preventDefault(); return; }
    if (e.code === 'Enter' && screen === 'title') { startLevel(save.unlocked - 1); return; }
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return;
    if (k === 'jump' && !keys.jump) jumpEdge = true;
    if (k === 'whistle' && !keys.whistle) whistleEdge = true;
    keys[k] = true;
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; for (const k in touch) touch[k] = false; fingerId = null; finger = null; });

  function bindButton(el, name) {
    const down = e => {
      e.preventDefault();
      TM.audio.unlock();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* pas grave */ }
      if (!touch[name]) { if (name === 'jump') jumpEdge = true; else whistleEdge = true; }
      touch[name] = true; el.classList.add('on');
      if (navigator.vibrate) try { navigator.vibrate(8); } catch (err) { /* pas grave */ }
    };
    const up = e => { e.preventDefault(); touch[name] = false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }
  bindButton($('bA'), 'jump');
  bindButton($('bB'), 'whistle');

  // Position d'un doigt dans un élément, en fractions de sa largeur et de sa hauteur
  // (en plein écran tenu en portrait, la page est tournée d'un quart de tour : voir layout)
  let rotated = false, big = false, fsOwned = false;
  function local(e, el) {
    const r = el.getBoundingClientRect();
    return rotated
      ? { x: (e.clientY - r.top) / r.height, y: (r.right - e.clientX) / r.width }
      : { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  const dpad = $('dpad');
  let dpadId = null;
  function dpadSet(e) {
    const dx = (local(e, dpad).x - 0.5) * dpad.offsetWidth;
    const dead = dpad.offsetWidth * 0.08;
    touch.left = dx < -dead; touch.right = dx > dead;
    dpad.classList.toggle('l', touch.left);
    dpad.classList.toggle('r', touch.right);
  }
  function dpadEnd() { dpadId = null; touch.left = touch.right = false; dpad.classList.remove('l', 'r'); }
  dpad.addEventListener('pointerdown', e => {
    e.preventDefault(); TM.audio.unlock();
    dpadId = e.pointerId;
    try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* pas grave */ }
    dpadSet(e);
  });
  dpad.addEventListener('pointermove', e => { if (e.pointerId === dpadId) dpadSet(e); });
  dpad.addEventListener('pointerup', dpadEnd);
  dpad.addEventListener('pointercancel', dpadEnd);
  $('pad').addEventListener('contextmenu', e => e.preventDefault());

  // Au doigt, n'importe où sur la page : la marmotte va vers le doigt (plus il est loin, plus elle court),
  // saute quand il est au-dessus de sa tête, siffle du côté touché sur une touche brève ou un deuxième doigt
  const NEAR = 10; // demi-largeur de la zone « sur la marmotte », en pixels du jeu
  let fingerId = null, finger = null, fingerStart = null, fingerLive = false, whistleFace = 0;
  function toGame(e) {
    const l = local(e, cv);
    return { x: l.x * TM.VW, y: l.y * TM.VH };
  }
  function sideOf(pt) {
    if (!G) return 0;
    const dx = pt.x + G.cam.x - (G.p.x + G.p.w / 2);
    return Math.abs(dx) < NEAR ? 0 : Math.sign(dx);
  }
  const app = $('app');
  app.addEventListener('pointerdown', e => {
    if (screen !== 'play' || paused || !G || (e.target.closest && e.target.closest('button, #pad'))) return;
    e.preventDefault();
    TM.audio.unlock();
    if (fingerId !== null) { whistleEdge = true; whistleFace = sideOf(toGame(e)); return; } // un deuxième doigt = sifflet
    fingerId = e.pointerId;
    try { app.setPointerCapture(e.pointerId); } catch (err) { /* pas grave */ }
    fingerStart = { x: e.clientX, y: e.clientY, t: performance.now() };
    finger = toGame(e); fingerLive = false;
  });
  app.addEventListener('pointermove', e => {
    if (e.pointerId !== fingerId) return;
    finger = toGame(e);
    if (Math.hypot(e.clientX - fingerStart.x, e.clientY - fingerStart.y) > 8) fingerLive = true;
  });
  function fingerUp(e) {
    if (e.pointerId !== fingerId) return;
    const moved = Math.hypot(e.clientX - fingerStart.x, e.clientY - fingerStart.y);
    if (e.type === 'pointerup' && performance.now() - fingerStart.t < 220 && moved < 12) {
      whistleEdge = true; whistleFace = sideOf(toGame(e));
    }
    fingerId = null; finger = null; fingerLive = false;
  }
  app.addEventListener('pointerup', fingerUp);
  app.addEventListener('pointercancel', fingerUp);
  // Ce que le doigt demande à cette image (il ne compte qu'après 130 ms ou dès qu'il glisse : une touche brève ne fait pas bouger)
  function fingerInput() {
    const f = { dir: 0, speed: 1, up: false };
    if (!finger || !G || G.state !== 'play' || !(fingerLive || performance.now() - fingerStart.t > 130)) return f;
    const p = G.p;
    const dx = finger.x + G.cam.x - (p.x + p.w / 2);
    if (Math.abs(dx) >= NEAR) {
      f.dir = Math.sign(dx);
      f.speed = Math.min(1, 0.4 + (Math.abs(dx) - NEAR) / 30);
    }
    f.up = finger.y + G.cam.y < p.y;
    return f;
  }

  // iPhone : Safari passe outre « user-scalable=no ». Deux touches rapprochées à côté d'un bouton zoomaient la page,
  // et le pincement étant bloqué, on ne pouvait plus en revenir. La deuxième touche ne zoome plus (un bouton reçoit
  // quand même son clic) ; si la page est zoomée malgré tout, pincement et double touche sont rendus pour la remettre.
  const zoomed = () => !!window.visualViewport && visualViewport.scale > 1.02;
  if (window.visualViewport) visualViewport.addEventListener('resize', () => document.documentElement.classList.toggle('zoomed', zoomed()));
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = performance.now(), quick = now - lastTouchEnd < 400;
    lastTouchEnd = now;
    if (!quick || !e.cancelable || zoomed()) return;
    e.preventDefault();
    const b = e.target.closest && e.target.closest('button'), t = e.changedTouches[0];
    if (b && !b.disabled && t && b.contains(document.elementFromPoint(t.clientX, t.clientY))) b.click();
  }, { passive: false });
  document.addEventListener('touchmove', e => { if (!zoomed() && e.target.closest && e.target.closest('#app')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', e => { if (!zoomed()) e.preventDefault(); });

  // ---------- Écrans ----------
  let screen = 'title', G = null, demo = null, paused = false;
  let hintIdx = -1, hintTimer = 0, flashTimer = 0, winDelay = 0;
  const SCREENS = ['title', 'pause', 'coupez', 'win'];
  let menuOpen = false;
  function show(name) {
    SCREENS.forEach(s => { $('scr-' + s).hidden = s !== name; });
    menuOpen = !!name && name !== 'coupez';
    app.classList.toggle('menu', menuOpen); // en paysage, la manette posée sur l'image cacherait les boutons du menu
  }

  function fmtTime(frames) {
    const s = Math.floor(frames / 60);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function buildMenu() {
    const box = $('tapes');
    box.textContent = '';
    TM.LEVELS.forEach((lv, i) => {
      const b = document.createElement('button');
      b.className = 'tape';
      b.id = 'tape-' + i;
      const locked = i >= save.unlocked;
      b.disabled = locked;
      const best = save.best[i];
      let info = locked ? 'Verrouillée' : 'Pas encore tournée';
      if (best) info = best.reels + '/' + best.total + ' bobines' + (best.cassette ? ' · or' : '');
      b.innerHTML = '<span class="lbl"><span class="tape-n">Cassette ' + (i + 1) + '</span>' +
        '<span class="tape-t"></span><span class="tape-i"></span></span>';
      b.querySelector('.tape-t').textContent = lv.name;
      b.querySelector('.tape-i').textContent = info;
      b.addEventListener('click', () => { TM.audio.unlock(); startLevel(i); });
      box.appendChild(b);
    });
    syncToggles();
  }
  function syncToggles() {
    const canFs = !!document.documentElement.requestFullscreen;
    document.querySelectorAll('[data-toggle]').forEach(b => {
      const k = b.dataset.toggle;
      const on = k === 'fs' ? big : save[k];
      b.textContent = { sfx: 'Bruitages : ', music: 'Musique : ', pad: 'Boutons : ', fs: 'Plein écran : ' }[k] + (on ? 'oui' : 'non');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (k === 'fs') b.hidden = !(canFs || big); // iPhone tenu en paysage : il n'y a rien de plus grand à proposer
    });
  }
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    TM.audio.unlock();
    const k = b.dataset.toggle;
    if (k === 'fs') { if (big) leaveBig(); else goBig(); return; }
    save[k] = !save[k];
    if (k === 'sfx') TM.audio.setSfx(save.sfx);
    else if (k === 'music') TM.audio.setMusic(save.music);
    else layout();
    store(); syncToggles();
  }));

  function toTitle() {
    screen = 'title'; paused = false; G = null;
    demo = TM.newGame(0); demo.hidePlayer = true;
    $('hud').hidden = true; $('hint').hidden = true; $('flash').hidden = true;
    buildMenu(); show('title');
    TM.audio.music(0);
  }

  function startLevel(i) {
    if (i >= save.unlocked) return;
    G = TM.newGame(i);
    screen = 'play'; paused = false;
    hintIdx = -1; hintTimer = 0; flashTimer = 0; winDelay = 0;
    show(null);
    $('hud').hidden = false; $('hint').hidden = true;
    lastHud = {};
    TM.audio.music(TM.LEVELS[i].music);
    TM.sfx('start');
    flash(TM.LEVELS[i].name + ' · Moteur !');
  }

  function togglePause() {
    if (screen !== 'play' || !G || G.state !== 'play') return;
    paused = !paused;
    if (paused) { show('pause'); syncToggles(); } else show(null);
  }
  $('btn-pause').addEventListener('click', () => { TM.audio.unlock(); togglePause(); });
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-restart').addEventListener('click', () => startLevel(G.li));
  $('btn-menu').addEventListener('click', toTitle);
  $('btn-next').addEventListener('click', () => {
    if (G.li + 1 < TM.LEVELS.length) startLevel(G.li + 1); else toTitle();
  });
  $('btn-again').addEventListener('click', () => startLevel(G.li));
  $('btn-menu2').addEventListener('click', toTitle);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { TM.audio.pause(); if (screen === 'play' && !paused) togglePause(); }
    else TM.audio.resume();
  });

  function flash(text) {
    const f = $('flash');
    f.textContent = text; f.hidden = false;
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    flashTimer = 110;
  }

  function onWin() {
    const L = G.L, li = G.li;
    const prev = save.best[li];
    save.best[li] = {
      total: L.totalReels,
      reels: Math.max(G.reels, prev ? prev.reels : 0),
      cassette: G.cassette || !!(prev && prev.cassette),
      time: Math.min(G.time, prev ? prev.time : 1e9)
    };
    save.unlocked = Math.max(save.unlocked, Math.min(TM.LEVELS.length, li + 2));
    store();
    const last = li + 1 >= TM.LEVELS.length;
    $('win-title').textContent = last ? 'Diffusion !' : "C'est dans la boîte !";
    $('win-sub').textContent = last
      ? 'La tournée est en boîte. Bravo, et merci d’avoir regardé Télé-Marmotte.'
      : TM.LEVELS[li].name + ' est en boîte.';
    const rows = [
      ['Bobines', G.reels + ' / ' + L.totalReels],
      ['Cassette dorée', G.cassette ? 'trouvée' : 'cachée quelque part'],
      ['Prises', String(G.prise)],
      ['Temps', fmtTime(G.time)],
      ['Animaux endormis', String(G.sleeps)]
    ];
    const dl = $('win-stats');
    dl.textContent = '';
    rows.forEach(r => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = r[0]; dd.textContent = r[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });
    $('btn-next').textContent = last ? 'Retour aux cassettes' : 'Cassette suivante';
    $('hud').hidden = true;
    show('win');
    TM.audio.music(-1);
  }

  let lastHud = {};
  function hud() {
    const p = G.p, L = G.L;
    const vals = {
      hearts: p.hearts, reels: G.reels + '/' + L.totalReels,
      prise: 'PRISE ' + G.prise, clock: fmtTime(G.time), cassette: G.cassette
    };
    if (vals.hearts !== lastHud.hearts) {
      const h = $('hearts');
      h.textContent = '';
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('i');
        s.className = 'heart' + (i < p.hearts ? '' : ' off');
        h.appendChild(s);
      }
    }
    if (vals.reels !== lastHud.reels) $('reels').textContent = vals.reels;
    if (vals.prise !== lastHud.prise) $('prise').textContent = vals.prise;
    if (vals.clock !== lastHud.clock) $('clock').textContent = vals.clock;
    if (vals.cassette !== lastHud.cassette) $('gold').hidden = !vals.cassette;
    lastHud = vals;
  }

  function tick() {
    if (screen === 'title') {
      demo.frame++;
      demo.cam.x = (demo.cam.x + 0.35) % (demo.L.pw - TM.VW);
      demo.cam.y = 48;
      for (const e of demo.L.enemies) e.anim = (e.anim || 0) + 0.1;
      return;
    }
    if (paused || !G) return;
    const f = fingerInput();
    const left = keys.left || touch.left, right = keys.right || touch.right;
    const inp = {
      left: left || f.dir < 0, right: right || f.dir > 0,
      speed: left || right ? 1 : f.speed,
      jump: keys.jump || touch.jump || f.up, whistle: keys.whistle || touch.whistle,
      jumpPressed: jumpEdge || f.up, // doigt resté en haut : elle ressaute en retombant
      whistlePressed: whistleEdge, whistleFace: whistleFace
    };
    jumpEdge = whistleEdge = false; whistleFace = 0;
    TM.step(G, inp);
    for (const ev of G.events) {
      if (ev.type === 'hint') {
        if (ev.data !== hintIdx || $('hint').hidden) {
          hintIdx = ev.data;
          const touchHint = layoutMode !== 'desk' && !save.pad && G.L.def.hintsTouch && G.L.def.hintsTouch[ev.data];
          $('hint-text').textContent = touchHint || G.L.def.hints[ev.data] || '';
          $('hint').hidden = false;
          hintTimer = 330;
        } else hintTimer = Math.max(hintTimer, 150);
      } else if (ev.type === 'flash') flash(ev.data);
      else if (ev.type === 'coupez') {
        $('coupez-prise').textContent = 'On la refait. Prise ' + ev.data + '.';
        show('coupez');
      } else if (ev.type === 'reprise') show(null);
      else if (ev.type === 'win') winDelay = 80;
    }
    G.events.length = 0;
    if (hintTimer > 0 && --hintTimer === 0) $('hint').hidden = true;
    if (flashTimer > 0 && --flashTimer === 0) $('flash').hidden = true;
    if (winDelay > 0 && --winDelay === 0) onWin();
    if (screen === 'play') hud();
  }

  // ---------- Plein écran à l'horizontale ----------
  // Android : vrai plein écran, verrouillé en paysage. iPhone (ni l'un ni l'autre n'existe) ou verrouillage refusé :
  // tant que le téléphone est tenu en portrait, la page est tournée d'un quart de tour, le jeu prend toute la longueur.
  async function goBig() {
    big = true;
    const el = document.documentElement;
    try {
      if (el.requestFullscreen && !document.fullscreenElement) { await el.requestFullscreen({ navigationUI: 'hide' }); fsOwned = true; }
      if (document.fullscreenElement) await window.screen.orientation.lock('landscape');
    } catch (e) { /* la page tournée fait l'affaire */ }
    layout();
  }
  function leaveBig() {
    big = false;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { /* pas grave */ });
    layout();
  }
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && fsOwned) { fsOwned = false; big = false; } // sorti par le geste « retour »
    layout();
  });
  $('fs-port').addEventListener('click', () => { TM.audio.unlock(); goBig(); });

  // ---------- Mise en page ----------
  let layoutMode = 'desk';
  function layout() {
    let vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const coarse = matchMedia('(any-pointer: coarse)').matches;
    rotated = big && coarse && vh > vw;
    if (rotated) [vw, vh] = [vh, vw];
    app.style.cssText = rotated
      ? 'position:fixed;left:0;top:0;width:' + vw + 'px;height:' + vh + 'px;transform-origin:0 0;transform:rotate(90deg) translateY(-100%)'
      : '';
    const portrait = vh > vw * 1.05;
    const mode = layoutMode = !coarse ? 'desk' : portrait ? 'port' : 'land';
    app.className = 'mode-' + mode + (save.pad ? '' : ' nopad') + (rotated ? ' rot' : '') + (menuOpen ? ' menu' : ''); // sans boutons, on joue au doigt
    syncToggles();
    let w;
    if (mode === 'port') {
      w = Math.min(vw - 28, (vh * 0.52) * 16 / 9);
    } else if (mode === 'land') {
      w = Math.min(vw, vh * 16 / 9);
    } else {
      w = Math.min(vw - 64, (vh - 150) * 16 / 9);
      if (w >= 512) w = Math.floor(w / 256) * 256;
    }
    w = Math.max(240, Math.floor(w));
    const sc = $('screen');
    sc.style.width = w + 'px';
    sc.style.height = Math.round(w * 9 / 16) + 'px';
  }
  addEventListener('resize', layout);
  addEventListener('orientationchange', () => setTimeout(layout, 120));

  // ---------- Boucle ----------
  let acc = 0, last = performance.now();
  const STEP = 1000 / 60;
  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min(100, now - last);
    last = now;
    let n = 0;
    while (acc >= STEP && n < 4) { tick(); acc -= STEP; n++; }
    if (n === 4) acc = 0;
    const world = G || demo;
    if (world) TM.render(g, world);
  }

  TM.debug = {
    get G() { return G; }, start: startLevel, keys: keys, save: save,
    // doigt posé en (x, y), en pixels de l'écran du jeu ; null = doigt levé
    finger: function (x, y) {
      finger = x === null ? null : { x: x, y: y };
      fingerStart = { x: 0, y: 0, t: 0 }; fingerLive = true;
    },
    tap: function (x, y) { whistleEdge = true; whistleFace = sideOf({ x: x, y: y }); },
    run: function (n) { for (let i = 0; i < n; i++) tick(); TM.render(g, G || demo); }
  };
  layout();
  toTitle();
  requestAnimationFrame(frame);
})(window.TM);
