# La Maison de Michka 🐾

Un petit tower defense en 3D, tout mignon : postez des chats le long de l'allée du jardin
pour empêcher souris, écureuils, pigeons, hérissons, chiens — et le Roi Bouledogue — d'atteindre les croquettes de Michka.

- Les règles détaillées sont dans [MECHANICS.md](MECHANICS.md) (en anglais).
- Les idées pour la suite sont dans [IDEES.md](IDEES.md).

## Jouer en local

Le jeu n'a besoin d'aucune installation ni d'aucune étape de build : c'est du HTML, du CSS et du JavaScript.
Il faut juste le servir en HTTP, car les navigateurs refusent de charger des modules JavaScript en ouvrant directement le fichier.

```sh
npm start
```

Puis ouvrir http://localhost:8080. (Il faut Node.js ; n'importe quel autre serveur de fichiers statiques fait aussi l'affaire.)

three.js est chargé depuis un CDN, donc il faut une connexion internet.

## Organisation du code

```
index.html        la page : le balisage de l'interface, et le chargement des modules
src/
  style.css       l'interface (style « autocollant » : papier crème, contour encré)
  main.js         point d'entrée : branche les modules et fait tourner la boucle de jeu
  config.js       toutes les données et l'équilibrage : terrains, chats, intrus, vagues, difficulté
  state.js        l'état partagé de la partie (objet S) et la sauvegarde des réglages
  i18n.js         tous les textes, en français et en anglais
  game.js         déroulé d'une partie : nouvelle partie, début, fin, records
  waves.js        les vagues : composition, envoi (en avance = bonus), apparition des intrus
  enemies.js      les intrus : déplacement, dégâts, ralentis, sortie
  cats.js         les chats : pose, amélioration, vente, ciblage, attaques, projectiles, animation
  world.js        le décor : terrain, maison, Michka sur la cheminée, marqueurs de placement
  models.js       les modèles 3D (chats, intrus, barres de vie)
  gfx.js          la base three.js : rendu, scène, caméra, matériaux, contours, cache de géométries
  camera.js       la caméra : vues, contrôles souris et clavier, rotation de l'écran d'accueil
  fx.js           les effets visuels : fumée, étincelles, anneaux, griffures, poissons qui volent
  audio.js        les sons, synthétisés en direct (aucun fichier audio)
  hud.js          l'interface en jeu : stats, bandeau des chats, fiche du chat, messages, boutons
  menu.js         l'écran d'accueil et l'écran de fin
  input.js        clics sur le terrain et raccourcis clavier
  art.js          les petits dessins SVG de l'interface
  util.js         petits utilitaires
tools/serve.mjs   le mini-serveur de `npm start`
```

Pour **équilibrer** le jeu, presque tout se règle dans `src/config.js`.
