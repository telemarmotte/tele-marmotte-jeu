// Télé-Marmotte : les niveaux
// ground : une lettre par colonne = rangée du sol (0 en haut, b = 11 en bas), "." = ravin.
// objects : "<lettre><x>[-<x2>[/<pas>]],<y>"
//   P départ, K caméra (arrivée), T clap (point de reprise), i panneau (conseil)
//   o bobine, m myrtille, C cassette dorée
//   F renard, E aigle (x-x2 = zone de vol), B bouquetin, L télésiège (x-x2 = trajet)
//   = rocher, - planche (traversable par dessous), _ glace, ^ ronces / piques, # terre
//   f fleur, h herbe, a arbre, A antenne
window.TM = window.TM || {};
TM.LEVELS = [
  {
    name: "L'Alpage",
    world: 0,
    music: 0,
    hints: [
      'Avance avec les flèches, saute avec A. Garde A appuyé pour sauter plus haut.',
      "Un renard ! Siffle avec B pour l'endormir. Réveillé, il te blesse.",
      'Saute sur un animal endormi : tu rebondis très haut.',
      'Les aigles endormis restent en l’air. Rebondis dessus !',
      "La caméra t'attend au bout du pré. Moteur !"
    ],
    // les mêmes, pour qui joue au doigt (sans les boutons)
    hintsTouch: [
      'Pose le doigt devant la marmotte pour avancer, au-dessus de sa tête pour sauter.',
      "Un renard ! Une touche brève de son côté : la marmotte siffle et l'endort."
    ],
    ground:
      '9999999999 9999999999 99999999.. .999999999 9999999999 ' +
      '9998888888 8888777777 77...77777 7777888999 9999999999 ' +
      '99999....9 9999999999 9999888877 7766666666 6666777888 ' +
      '9999999999 9999999999 9999999999',
    objects:
      'P2,8 i5,8 h8,8 o10-14/2,7 f16,8 f19,8 a17,8 ' +
      '=22-26,6 o23-25,5 o29,6 ' +
      'i33,8 h37,8 F40,8 o42-44/2,7 a35,8 ' +
      'i46,8 F44,8 =49-52,4 o49-51,3 C52,3 ' +
      'T58,7 f61,7 m66,6 h69,6 o72-74,4 a77,6 ' +
      'i80,6 E84-90,3 o85-89/2,1 ' +
      'f92,8 o96-98,7 a99,8 ' +
      '-106-107,7 E102-110,4 o105-108,6 ' +
      'o111-117/2,6 F114,8 F119,8 ' +
      'T123,8 h126,7 a129,6 o133-137,4 F138,5 f141,5 m145,6 ' +
      'o152-158/3,7 h155,8 i160,8 f165,8 a167,8 K172,8 h176,8'
  },
  {
    name: 'Le Bois de mélèzes',
    world: 1,
    music: 1,
    hints: [
      'Attention aux ronces : elles piquent !',
      "Un bouquetin ! Il fonce dès qu'il te voit. Siffle avant qu'il charge.",
      "Trop loin pour sauter ? Endors l'aigle et rebondis dessus."
    ],
    ground:
      '9999999999 9999999999 999..99999 99999999.. ...9999999 ' +
      '9999999999 99.....999 9999999999 8877766655 5555555555 ' +
      '555....555 5555555555 6677788999 9999999999 9999...... ' +
      '....999999 9999999999 9999999999 9999999999 9999999999',
    objects:
      'P2,8 a4,8 o6-10/2,7 i12,8 a14,8 ^16-17,8 o16-17,6 h19,8 ' +
      'o23-24,6 i27,8 B33,8 a29,8 ' +
      '-39-41,6 o39-41,5 o44-46,7 ' +
      'F48,8 ^52-53,8 o52-53,6 a55,8 ' +
      'T57,8 i59,8 E61-67,6 o63-65,4 ' +
      'a71,8 o72-78/2,7 F75,8 ' +
      'o83,5 o86,4 o88,3 -91-94,1 C93,0 B96,4 m99,4 ' +
      '-104-105,3 o104-105,2 ^110,4 ' +
      'T112,4 o114-118/2,2 F116,4 a119,4 ' +
      'o122,4 o125,5 o128,6 h131,8 F134,8 T137,8 a139,8 ' +
      '-146-147,7 -150-151,7 E145-153,4 o146-147,6 o150-151,6 ' +
      'h156,8 B163,8 o160-166/2,7 a170,8 ^174-175,8 o174-175,6 ' +
      'F181,8 f185,8 a188,8 K192,8 h196,8'
  },
  {
    name: 'Le Sommet',
    world: 2,
    music: 2,
    hints: [
      'Neige et glace : sur la glace bleue, tu glisses !',
      'Monte sur le télésiège pour traverser.',
      "Dernier effort : endors l'aigle et rebondis vers le sommet."
    ],
    ground:
      '9999999999 9999999999 99999..... ....999999 9999999999 ' +
      '8887776666 6666666666 66........ ........66 6666655555 ' +
      '5555555555 55555...55 5555544444 4444444444 444....... ' +
      '.........3 3333333333 3333333333',
    objects:
      'P2,8 i6,8 a9,8 _12-16,6 o12-16,5 ^13-15,8 F19,8 ' +
      'i22,8 L24-34,6 o27-31/2,4 a37,8 ' +
      'm40,8 T42,8 B47,8 ' +
      'o52,6 o55,5 o58,4 a61,5 F64,5 ' +
      'L71-88,3 E76-84,0 o74-86/3,2 ' +
      'T92,5 a94,5 F97,4 B104,4 o100-106/2,2 _106-108,1 C107,0 ' +
      '^111,4 o115-117,2 ' +
      'F122,4 ^126-127,3 a129,3 ' +
      'T132,3 m134,3 o136-139,2 ' +
      'i140,3 _146-147,4 E148-153,3 _154-155,4 o146-147,3 o154-155,3 ' +
      'o161-165/2,1 a163,2 F168,2 K175,2 A178,2'
  }
];
