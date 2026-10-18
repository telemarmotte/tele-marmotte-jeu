// Essais automatiques des règles (à lancer dans la page du jeu)
(function () {
  const D = TM.debug, out = [];
  const ok = (name, cond, info) => out.push((cond ? 'OK   ' : 'ÉCHEC ') + name + (info !== undefined ? ' : ' + info : ''));
  const press = (k, on) => { D.keys[k] = on; };

  // 1. Sol et course
  D.start(0); let G = D.G;
  D.run(40);
  ok('posée au sol au départ', G.p.onGround, 'y=' + G.p.y.toFixed(1));
  const x0 = G.p.x; press('right', true); D.run(90); press('right', false);
  ok('court vers la droite', G.p.x - x0 > 120, (G.p.x - x0).toFixed(0) + ' px en 1,5 s');

  // 2. Hauteur de saut (appui long)
  D.run(30);
  const ground = G.p.y; let top = G.p.y;
  press('jump', true);
  D.run(1); // le front montant est lu au tick suivant : on passe par l'événement clavier
  dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
  dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
  for (let i = 0; i < 60; i++) { D.run(1); top = Math.min(top, G.p.y); }
  dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
  ok('saut long ≈ 4 cases', ground - top > 50 && ground - top < 70, (ground - top).toFixed(1) + ' px');

  // 3. Sifflet : le renard s'endort
  D.start(0); G = D.G;
  const fox = G.L.enemies.find(e => e.type === 'F');
  D.run(20);
  G.p.x = fox.x - 40; G.p.y = fox.y; G.p.face = 1; fox.face = -1;
  dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyX' }));
  D.run(20);
  dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyX' }));
  ok('le sifflet endort le renard', fox.sleep > 0, 'sommeil=' + fox.sleep);

  // 4. Rebond sur la bête endormie
  G.p.x = fox.x + 2; G.p.y = fox.y - 30; G.p.vy = 2; G.p.inv = 0;
  let bounced = false;
  for (let i = 0; i < 30; i++) { D.run(1); if (G.p.vy < -6) bounced = true; }
  ok('rebond sur le renard endormi', bounced);
  ok('pas de blessure en rebondissant', G.p.hearts === 3, 'cœurs=' + G.p.hearts);

  // 5. Contact avec un renard réveillé
  fox.sleep = 0; G.p.inv = 0; G.p.x = fox.x + fox.w; G.p.y = fox.y + fox.h - G.p.h; G.p.vy = 0;
  D.run(2);
  ok('le renard réveillé blesse', G.p.hearts === 2, 'cœurs=' + G.p.hearts);

  // 6. Chute dans un ravin
  D.start(0); G = D.G; D.run(5);
  G.p.x = 29 * 16; G.p.y = 100; G.p.vx = 0;
  D.run(90);
  ok('ravin : un cœur en moins, retour au départ', G.p.hearts === 2 && G.p.x < 100, 'cœurs=' + G.p.hearts + ' x=' + G.p.x.toFixed(0));

  // 7. Coupez au troisième cœur perdu
  G.p.hearts = 1; G.p.inv = 0; G.p.x = 29 * 16; G.p.y = 100;
  D.run(60);
  ok('coupez : prise 2', G.state === 'coupez' && G.prise === 2, G.state + ' prise ' + G.prise);
  D.run(120);
  ok('reprise avec 3 cœurs', G.state === 'play' && G.p.hearts === 3);

  // 8. Clap : point de reprise
  const cp = G.L.checkpoints[0];
  G.p.x = cp.x; G.p.y = cp.y; D.run(3);
  ok('le clap enregistre la reprise', cp.on && Math.abs(G.cp.x - cp.x) < 8);

  // 9. Arrivée à la caméra
  G.p.x = G.L.goal.x - 4; G.p.y = G.L.goal.y + 6; D.run(3);
  ok('la caméra termine le niveau', G.state === 'win');
  D.run(90);
  ok("l'écran « dans la boîte » s'affiche", !document.getElementById('scr-win').hidden);

  // 10. Les trois niveaux se chargent, rien n'est coincé dans le sol
  TM.LEVELS.forEach((lv, i) => {
    const L = TM.buildLevel(lv);
    const stuck = L.enemies.concat(L.items).filter(e => TM.hitsSolid(L, e)).length;
    ok('niveau ' + (i + 1) + ' « ' + lv.name + ' »', stuck === 0 && L.goal && L.hints.length === lv.hints.length,
      L.w + ' colonnes, ' + L.totalReels + ' bobines, ' + L.enemies.length + ' bêtes, ' + L.hints.length + ' panneaux / ' + lv.hints.length + ' conseils');
  });

  // 11. Au doigt : elle va vers lui, saute quand il est au-dessus de sa tête, siffle du côté touché
  D.start(0); G = D.G; D.run(40);
  const sx = () => G.p.x + G.p.w / 2 - G.cam.x, sy = () => G.p.y - G.cam.y;
  const hold = (dx, dy, n) => { for (let i = 0; i < n; i++) { D.finger(sx() + dx, sy() + dy); D.run(1); } };
  let fx = G.p.x; hold(80, 20, 90);
  ok('doigt loin devant : elle court', G.p.x - fx > 120 && G.p.vx > 1.9, (G.p.x - fx).toFixed(0) + ' px en 1,5 s');
  D.finger(null); D.run(40); hold(15, 20, 60);
  ok('doigt tout près : elle marche', G.p.vx > 0.5 && G.p.vx < 1.5, 'vitesse ' + G.p.vx.toFixed(2));
  hold(2, 6, 40);
  ok('doigt sur elle : elle s’arrête', G.p.vx === 0);
  const gy = G.p.y; let fTop = G.p.y, hops = 0, wasG = true;
  for (let i = 0; i < 120; i++) { hold(0, -30, 1); fTop = Math.min(fTop, G.p.y); if (wasG && !G.p.onGround) hops++; wasG = G.p.onGround; }
  ok('doigt au-dessus de sa tête : saut long, répété', gy - fTop > 50 && hops >= 3, (gy - fTop).toFixed(1) + ' px, ' + hops + ' sauts en 2 s');
  D.finger(null); D.run(80);
  G.p.face = 1; D.tap(sx() - 60, sy()); D.run(1);
  ok('touche brève à gauche : sifflet vers la gauche', G.p.face === -1 && G.waves.length === 1 && G.waves[0].vx < 0);
  hold(80, 20, 30); D.finger(null); D.run(30);
  ok('doigt levé : elle s’arrête', G.p.vx === 0);
  return out.join('\n');
})();
