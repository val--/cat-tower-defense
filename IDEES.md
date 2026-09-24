# Idées pour la suite — La Maison de Michka

Carnet d'idées pour les prochaines versions. Rien ici n'est encore dans le jeu.
Pour les règles actuelles, voir [MECHANICS.md](MECHANICS.md).

Statuts : 💭 idée · 🔍 à creuser · 📐 conçue, prête à coder · ✅ faite

---

## 1. Le chat principal 💭

On choisit un **chat principal** avant la partie, sur l'écran d'accueil, à côté du choix du terrain.
C'est le chat de la maison : il n'est pas dans le bandeau et on ne peut pas l'acheter.
Chaque chat principal a **un pouvoir unique** qui change la façon de jouer.

- Michka est le chat par défaut. Les autres pourraient se débloquer, par exemple en gagnant des étoiles.
- Le chat choisi remplace Michka sur la cheminée, avec son propre modèle 3D.

### Michka — la chasse en vue subjective 🔍

On peut « sauter » dans Michka et passer en **vue à la première personne** pour attaquer les intrus soi-même.

- **Entrer et sortir :** une touche (par ex. **F**) ou un bouton. Michka saute de la cheminée.
- **Déplacements :** Z Q S D / W A S D et la souris pour regarder. Il faut verrouiller le pointeur (Pointer Lock).
- **Attaque :** clic = coup de patte devant soi. On peut réutiliser l'animation et les griffures du Chaton.
- **Limites, pour garder l'intérêt de la défense :**
  - une jauge d'**endurance** qui se vide pendant la chasse ;
  - Michka doit rentrer se reposer sur la cheminée quand la jauge est vide.
- **Idées bonus :**
  - un bond qui renverse les souris ;
  - un « miaou » qui fait fuir les intrus une seconde (ils reculent sur le chemin).

**Points techniques :**
- Les touches Z Q S D / W A S D déplacent aujourd'hui la caméra. En vue subjective, elles doivent diriger Michka.
- Il faut empêcher Michka de traverser les chats posés, les buissons et la maison. La grille `grid` connaît déjà chaque case.
- La vue subjective peut remplacer temporairement la caméra orbitale : la fonction `applyCamera` est l'endroit à modifier.
- Faut-il ralentir le temps en vue subjective ? À décider en jouant.

### Potiron — le tireur du toit 🔍

Potiron, un chat roux, reste **sur le toit** de la maison et lance des projectiles sur les ennemis.

- **Hauteur :** depuis le toit, il a une très grande portée, mais seulement sur la fin du chemin : c'est la dernière ligne de défense.
- **Cible privilégiée :** les **ennemis en hauteur**, comme les pigeons (et plus tard d'autres volants, voir §3).
- **Contrôle :** automatique comme les autres chats, ou visé à la main (clic sur un ennemi, avec un temps de recharge).
  Le mode visé rend le rôle plus actif.
- **Amélioration :** il progresse avec les vagues plutôt qu'avec des poissons (par ex. un niveau toutes les 3 vagues).
- **Projectile :** à inventer. Une pelote, un poisson séché, une tuile du toit ?

**Points techniques :**
- Le toit existe déjà (le groupe `house`). Potiron s'y pose comme Michka sur la cheminée.
- La logique de tir peut reprendre celle du Tigré (`release`, `shots`), avec une trajectoire plongeante depuis le toit.

### Autres chats principaux possibles 💭

À trier. Ce sont juste des pistes :
- **Chat du voisin, le négociant :** +20 % de poissons par ennemi, mais on commence avec moins de vies.
- **Vieux chat sage :** une fois par partie, un grand « FFFF ! » renvoie tous les intrus présents au début du chemin.
- **Chaton surexcité :** les chats posés coûtent 10 % moins cher, mais le Roi Bouledogue a plus de PV.

**À équilibrer :** un chat principal ne doit pas rendre la partie trop facile, alors que le jeu vient juste d'être durci.
Les bots de test (des scripts qui jouent des parties complètes) pourront mesurer chaque pouvoir.

---

## 2. Terrains 💭

- Un troisième terrain avec **deux chemins** qui se rejoignent avant la maison.
- Un terrain où le chemin **change** au milieu de la partie (une barrière s'ouvre à la vague 5).

## 3. Intrus 💭

- **Chauve-souris :** vole, n'arrive qu'aux vagues de nuit.
- **Taupe :** passe sous terre sur une partie du chemin, sans pouvoir y être touchée.

## 4. Présentation 💭

- **Nuit :** une ambiance de nuit pour les dernières vagues, avec les fenêtres de la maison qui s'allument.

---

## Comment utiliser ce fichier

- **Nouvelle idée :** l'ajouter dans la bonne section avec le statut 💭.
- **Idée qui avance :** changer son statut ; quand elle est dans le jeu, la passer à ✅ et la décrire dans MECHANICS.md.
