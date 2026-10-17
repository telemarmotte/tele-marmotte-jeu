// Télé-Marmotte : bruitages et musiques (synthétisés, aucun fichier son)
window.TM = window.TM || {};
(function (TM) {
  let ac = null, master = null, sfxGain = null, musicGain = null;
  let sfxOn = true, musicOn = true, seq = null, wanted = -1;

  function unlock() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.connect(ac.destination);
      sfxGain = ac.createGain(); sfxGain.gain.value = 0.32; sfxGain.connect(master);
      musicGain = ac.createGain(); musicGain.gain.value = musicOn ? 0.13 : 0; musicGain.connect(master);
      if (wanted >= 0) startSong(wanted);
    }
    if (ac.state === 'suspended') ac.resume();
  }

  function tone(type, f0, f1, dur, vol, delay) {
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  let noiseBuf = null;
  function noise(dur, vol, freq, delay) {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + (delay || 0);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = 'bandpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain);
    s.start(t); s.stop(t + dur);
  }
  function arp(type, notes, step, dur, vol) {
    notes.forEach((f, i) => { if (f) tone(type, f, 0, dur, vol, i * step); });
  }

  const SFX = {
    jump: () => tone('square', 280, 620, 0.14, 0.22),
    whistle: () => { // le cri d'alerte de la marmotte : bref, aigu, qui monte puis retombe
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1700, t);
      o.frequency.exponentialRampToValueAtTime(2700, t + 0.05);
      o.frequency.exponentialRampToValueAtTime(2150, t + 0.22);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.28);
    },
    reel: () => { tone('square', 988, 0, 0.06, 0.18); tone('square', 1319, 0, 0.12, 0.18, 0.06); },
    berry: () => arp('triangle', [660, 880, 1100], 0.06, 0.1, 0.3),
    cassette: () => arp('square', [523, 659, 784, 1047, 784, 1047], 0.08, 0.12, 0.16),
    hurt: () => { tone('sawtooth', 400, 90, 0.3, 0.25); noise(0.15, 0.3, 800); },
    fall: () => tone('triangle', 700, 80, 0.5, 0.35),
    boing: () => tone('square', 180, 760, 0.22, 0.22),
    bump: () => tone('square', 220, 330, 0.08, 0.18),
    sleep: () => { tone('triangle', 520, 260, 0.35, 0.3); tone('triangle', 390, 195, 0.35, 0.2, 0.12); },
    clap: () => { noise(0.08, 0.8, 2500); tone('square', 1200, 0, 0.03, 0.12); },
    ibex: () => { noise(0.1, 0.4, 300); noise(0.1, 0.4, 300, 0.14); },
    thud: () => { tone('sine', 120, 50, 0.25, 0.5); noise(0.1, 0.3, 200); },
    coupez: () => { noise(0.08, 0.8, 2500); arp('square', [0, 392, 330, 262], 0.16, 0.18, 0.18); },
    win: () => arp('square', [523, 659, 784, 1047, 0, 1047, 1319], 0.1, 0.14, 0.18),
    start: () => { tone('square', 660, 0, 0.08, 0.18); tone('square', 990, 0, 0.12, 0.18, 0.08); },
    tick: () => tone('square', 880, 0, 0.04, 0.1)
  };

  // Musiques : croches, 0 = silence. Mélodie (carré) et basse (triangle).
  const SONGS = [
    { tempo: 140, // L'Alpage, sol majeur
      lead: [67,0,71,74,71,0,67,0, 69,0,72,76,74,0,71,0, 67,69,71,72,74,0,76,74, 72,0,69,0,74,0,0,0,
             67,0,71,74,79,0,78,76, 74,0,71,0,72,0,69,0, 71,72,74,71,69,0,66,0, 67,0,0,0,0,0,0,0],
      bass: [43,0,50,0,43,0,50,0, 45,0,52,0,50,0,45,0, 43,0,50,0,40,0,47,0, 48,0,43,0,50,0,45,0,
             43,0,50,0,40,0,47,0, 50,0,45,0,48,0,43,0, 43,0,50,0,50,0,45,0, 43,0,50,0,43,0,0,0] },
    { tempo: 120, // Le Bois de mélèzes, mi mineur
      lead: [64,0,67,71,69,0,67,0, 66,0,69,0,71,0,0,0, 64,0,67,71,76,0,74,71, 69,0,66,0,67,0,0,0,
             72,0,71,69,71,0,67,0, 69,0,67,66,67,0,64,0, 66,67,69,71,72,0,69,0, 71,0,0,0,64,0,0,0],
      bass: [40,0,47,0,40,0,47,0, 38,0,45,0,43,0,50,0, 40,0,47,0,40,0,47,0, 38,0,45,0,43,0,47,0,
             48,0,43,0,43,0,50,0, 45,0,52,0,40,0,47,0, 38,0,45,0,45,0,52,0, 47,0,42,0,40,0,0,0] },
    { tempo: 150, // Le Sommet, ré majeur
      lead: [74,0,69,0,66,0,69,0, 74,0,76,78,76,0,74,0, 71,0,67,0,62,0,67,0, 71,0,73,74,73,0,69,0,
             74,0,78,0,81,0,78,0, 79,0,76,0,73,0,76,0, 78,76,74,73,71,0,73,0, 74,0,0,0,0,0,0,0],
      bass: [50,0,45,0,50,0,45,0, 50,0,45,0,45,0,52,0, 43,0,50,0,43,0,50,0, 45,0,52,0,45,0,52,0,
             50,0,45,0,50,0,45,0, 45,0,52,0,45,0,43,0, 43,0,45,0,43,0,45,0, 50,0,45,0,50,0,0,0] }
  ];

  function note(type, midi, dur, vol, t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function stopSong() { if (seq) { clearInterval(seq.timer); seq = null; } }
  function startSong(i) {
    stopSong();
    const s = SONGS[i], stepDur = 60 / s.tempo / 2;
    let step = 0, next = ac.currentTime + 0.08;
    seq = { i: i, timer: setInterval(function () {
      if (ac.state !== 'running') { next = ac.currentTime + 0.08; return; }
      while (next < ac.currentTime + 0.15) {
        const l = s.lead[step % s.lead.length], b = s.bass[step % s.bass.length];
        if (l) note('square', l, stepDur * 0.85, 0.2, next);
        if (b) note('triangle', b, stepDur * 1.8, 0.55, next);
        next += stepDur; step++;
      }
    }, 30) };
  }

  TM.sfx = function (n) {
    if (!ac || !sfxOn || ac.state !== 'running') return;
    const f = SFX[n];
    if (f) try { f(); } catch (e) { /* un son raté ne doit pas arrêter le jeu */ }
  };
  TM.audio = {
    unlock: unlock,
    music: function (i) {
      wanted = i;
      if (!ac) return;
      if (i < 0) { stopSong(); return; }
      if (!seq || seq.i !== i) startSong(i);
    },
    setSfx: function (on) { sfxOn = on; },
    setMusic: function (on) { musicOn = on; if (musicGain) musicGain.gain.value = on ? 0.13 : 0; },
    pause: function () { if (ac && ac.state === 'running') ac.suspend(); },
    resume: function () { if (ac && ac.state === 'suspended') ac.resume(); }
  };
})(window.TM);
