# Télé-Marmotte : le jeu

Un petit jeu de plateforme en pixel art, pensé pour le téléphone, pour le site de captations **Télé-Marmotte**.

**Jouer : https://telemarmotte.github.io/tele-marmotte-jeu/**

La marmotte part en tournage dans les Alpes. Elle ne se bat pas : elle **siffle** pour endormir les bêtes, puis rebondit sur elles. En chemin, elle ramasse les bobines de film. À chaque chute, c'est « Coupez ! » et on recommence à la prise suivante. Le niveau est fini quand elle arrive à la caméra : c'est dans la boîte.

## Les trois cassettes

1. **L'Alpage** : on apprend à courir, sauter, siffler et rebondir.
2. **Le Bois de mélèzes** : les ronces, et un bouquetin qui fonce dès qu'il te voit.
3. **Le Sommet** : la glace qui glisse, le télésiège, et l'antenne de télé tout en haut.

Chaque cassette cache une cassette dorée.

## Commandes

| | Téléphone | Clavier |
|---|---|---|
| Courir | croix gauche / droite | ← → (ou Q / D) |
| Sauter (appui long = plus haut) | A | Espace, ↑ ou Z |
| Siffler | B | X ou C |
| Pause | bouton II | Échap |

En portrait, le jeu s'affiche dans un petit téléviseur avec la manette dessous. En paysage, il passe en plein écran.

## Mettre le jeu sur un site

Un simple lien vers l'adresse ci-dessus suffit. Pour l'intégrer dans une page :

```html
<iframe src="https://telemarmotte.github.io/tele-marmotte-jeu/"
        style="width:100%; aspect-ratio:16/9; border:0"
        allow="autoplay; fullscreen" title="Le jeu Télé-Marmotte"></iframe>
```

## Fichiers

- `index.html` : la page, le téléviseur et les commandes tactiles
- `js/sprites.js` : les personnages en pixel art (une lettre = une couleur)
- `js/levels.js` : les trois niveaux (hauteur du sol colonne par colonne, puis les objets)
- `js/world.js` : lecture des niveaux et collisions
- `js/game.js` : les règles (saut, sifflet, sommeil, rebond, clap, caméra)
- `js/render.js` : le décor en parallaxe et le dessin
- `js/audio.js` : bruitages et musiques, synthétisés (aucun fichier son)
- `js/main.js` : boucle de jeu, commandes, écrans et sauvegarde des scores
- `_dev/` : planche de sprites et essais automatiques (non publié sur la page du jeu)

Aucune dépendance, aucun outil de construction : ce sont des fichiers statiques.
