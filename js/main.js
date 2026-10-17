// Télé-Marmotte : boucle, commandes, écrans et sauvegarde
window.TM = window.TM || {};
(function (TM) {
  const $ = id => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  // ---------- Sauvegarde (facultative : le jeu marche sans) ----------
  const SAVE_KEY = 'tele-marmotte-v1';
  const save = { unlocked: 1, best: {}, sfx: true, music: true };
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
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; for (const k in touch) touch[k] = false; });

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

  const dpad = $('dpad');
  let dpadId = null;
  function dpadSet(e) {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dead = r.width * 0.08;
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
  document.addEventListener('touchmove', e => { if (e.target.closest && e.target.closest('#app')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());

  // ---------- Écrans ----------
  let screen = 'title', G = null, demo = null, paused = false;
  let hintIdx = -1, hintTimer = 0, flashTimer = 0, winDelay = 0;
  const SCREENS = ['title', 'pause', 'coupez', 'win'];
  function show(name) {
    SCREENS.forEach(s => { $('scr-' + s).hidden = s !== name; });
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
    document.querySelectorAll('[data-toggle]').forEach(b => {
      const k = b.dataset.toggle;
      b.textContent = (k === 'sfx' ? 'Bruitages : ' : 'Musique : ') + (save[k] ? 'oui' : 'non');
      b.setAttribute('aria-pressed', save[k] ? 'true' : 'false');
    });
  }
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    TM.audio.unlock();
    const k = b.dataset.toggle;
    save[k] = !save[k];
    if (k === 'sfx') TM.audio.setSfx(save.sfx); else TM.audio.setMusic(save.music);
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
    const inp = {
      left: keys.left || touch.left, right: keys.right || touch.right,
      jump: keys.jump || touch.jump, whistle: keys.whistle || touch.whistle,
      jumpPressed: jumpEdge, whistlePressed: whistleEdge
    };
    jumpEdge = whistleEdge = false;
    TM.step(G, inp);
    for (const ev of G.events) {
      if (ev.type === 'hint') {
        if (ev.data !== hintIdx || $('hint').hidden) {
          hintIdx = ev.data;
          $('hint-text').textContent = G.L.def.hints[ev.data] || '';
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

  // ---------- Mise en page ----------
  function layout() {
    const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const coarse = matchMedia('(any-pointer: coarse)').matches;
    const portrait = vh > vw * 1.05;
    const mode = !coarse ? 'desk' : portrait ? 'port' : 'land';
    const app = $('app');
    app.className = 'mode-' + mode;
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
    run: function (n) { for (let i = 0; i < n; i++) tick(); TM.render(g, G || demo); }
  };
  layout();
  toTitle();
  requestAnimationFrame(frame);
})(window.TM);
