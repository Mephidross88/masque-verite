# Cahier des charges fonctionnel — Le Masque de Vérité

Objectif : suivre une partie du randomizer de **2 Ship 2 Harkinian** (2Ship, portage PC de Majora's Mask) — objets,
masques, checks, indices — et dire où aller : ce qui est faisable maintenant, selon les objets, les formes et le moment
des trois jours, et par quel chemin.

L'appli prend la suite de **L'Œil Sheikah** (même auteur, tracker et routeur du randomizer de Ship of Harkinian pour
Ocarina of Time) : même coque, même façon de faire, même expérience — adaptées à Majora's Mask.

## Version de référence
2Ship **5.0.1 « Battler Bravo »**, commit `8a24047` (2026-08-25). Toutes les données et la logique sont tirées des
sources de 2Ship à ce commit (`tools/2ship-checks/fetch_sources.mjs`), jamais de `develop` ni de suppositions : vérifier
dans le code de 2Ship avant de décider d'une règle. Spoilers de test : générés avec cette version (le spoiler porte son
commit, `commitHash`).

## Principes
- Application légère, 100 % navigateur, sans build ni installation : ouvrir `index.html` suffit (et en ligne, GitHub
  Pages, par `.github/workflows/pages.yml`).
- Sessions transparentes : sauvegarde automatique à chaque modification, reprise à l'ouverture.
- Export / import de la partie par copier-coller (texte JSON) pour changer de navigateur.
- Interface claire, graphique, en français ou en anglais, utilisable sur mobile.
- Seule source de vérité du jeu : les sources de 2Ship (données générées par nos outils, `tools/`).

## Ce qui change par rapport à l'Œil Sheikah
- **Pas d'entrées mélangées** : 2Ship 5.0.1 n'a pas d'entrance randomizer (ni sur `develop`). Pas de pages Entrées ni
  Connexions ; le Routeur suit les liaisons d'origine du jeu. À revoir si 2Ship en ajoute.
- **Formes au lieu des âges** : Humain, Deku, Goron, Zora, Oni (masques de transformation). La logique de 2Ship parle de
  `CAN_BE_DEKU`, `CAN_BE_GORON`… plutôt que d'âge.
- **Le temps** : trois jours découpés en **45 tranches** (`TimeSlice` de `Logic.h` : du jour 1 à 6 h à la nuit 3) ; une
  région est accessible à certaines tranches, certains checks ne se font qu'à certaines heures. Option de 2Ship :
  **horloges mélangées** (`RO_CLOCK_SHUFFLE`), où l'on ne peut être qu'aux demi-journées possédées.
- **Les cycles** : le Chant du temps ramène au premier jour. 2Ship garde pour chaque check `obtained` (obtenu au moins
  une fois) et `cycleObtained` (obtenu dans ce cycle) ; une partie des objets se perd au retour (rubis, munitions,
  clés…). L'appli doit distinguer ce qui est acquis pour toujours de ce qui est à refaire.
- **Pas de réseau** : 2Ship n'a pas d'Anchor. L'auto-tracking passera par la sauvegarde du jeu (`saves/*.json`, voir
  Étapes), donc seulement quand le jeu sauvegarde (statue de hibou, Chant du temps).

## Langue
Comme dans l'Œil Sheikah : interface en français (langue source), anglais livré, autres langues ajoutables sans toucher
au code (`js/i18n.js`, dictionnaires `data/i18n/<code>.js`).
- **Choix** : Configuration, en tête de page (localStorage `masque-verite-lang`), sinon la langue du navigateur si elle
  est disponible, sinon le français si le navigateur est en français, sinon l'anglais. Changer de langue recharge la page.
- **Langues ajoutées par l'utilisateur** : fichier JSON `{ code, name, dict }` (« Ajouter… »), gardé dans le navigateur
  (localStorage `masque-verite-langs`), retirable. **Sécurité** : traductions toujours échappées à l'insertion dans les
  gabarits (`escTplText`, `escTplExpr`), jamais de balisage ni de code exécuté.
- **Dictionnaire** : texte français (clé exacte, espaces internes réduits) → traduction ; repli : langue choisie, anglais,
  français.
- **Données** (`td(texte français, nom anglais)`) : noms anglais de 2Ship par défaut dans les autres langues.
- **Contrôle** : `node tools/i18n/check.mjs [--lang=en] [--strict]` (0 manquant attendu) ; `--template=<code>` : modèle
  d'une nouvelle langue.

## Navigation (panneau de gauche)
- Pages du menu, en groupes titrés : **Progression** : Checks, Routeur, Indices (id `hints`) ; **Aperçus** : Carte
  (id `map`), Statistiques (id `stats`) ; puis Configuration à part, sous un trait. Page ouverte au premier lancement :
  Checks ; ensuite, la dernière page consultée (`ui.view`).
- **Côte à côte** (écran d'au moins 1500 px) : icône « ouvrir à côté » au survol d'un élément du menu, second panneau
  (`ui.split`) avec ⇄ (échanger) et ✕ (fermer) ; chaque panneau défile seul.
- **Panneau Objets** (droite) : repliable sur écran large (`ui.itemsFolded`) ; tiroir sur écran moyen (901 à 1399 px,
  onglet « Objets ») ; en dessous de 901 px, mise en page mobile (barre de gauche et panneau Objets en tiroirs).
- **Barre de gauche réduite** (`ui.navFolded`) : icônes seules.
- Pied du panneau : état de la sauvegarde (« Partie non enregistrée ! » si le navigateur refuse, `saveError`),
  thème (soleil / lune, recliquer : suit le système ; `ui.theme` `auto` / `light` / `dark`, attribut `data-theme`),
  export / import de la partie, « Tout remettre à zéro » (avec confirmation : efface la partie, garde la configuration).
- Teintes : celles de l'Œil Sheikah (parchemin, or), barre de gauche prune nocturne (nuit de Termina) ; thème sombre
  teinté de prune.

## Étapes
Même démarche que pour l'Œil Sheikah : chaque étape est utilisable et vérifiée avant la suivante ; la SPEC est complétée
à mesure (une section par page ou règle).

0. **Fondations** — *fait* : dépôt, coque (navigation, côte à côte, panneau Objets, thème, langue, sauvegarde,
   export / import, remise à zéro), pages annoncées (bloc « bientôt » : ce que fera la page, à quelle étape), contrôles
   (syntaxe, noms non définis, traductions), téléchargement des sources de 2Ship.
1. **Données** — extraction depuis `Rando/StaticData/` (checks : `Checks.cpp`, 2 642 checks, type `RCTYPE_…`, scène,
   drapeau, cycle ou permanent ; objets : `Items.cpp`, 239 ; options : `Options.cpp`) vers `data/` (fichiers générés).
   Pages : **panneau Objets** (masques, formes, chants, objets, fées errantes, restes de boss, clés), **Configuration**
   (options `RO_…`, import du spoiler 2Ship : `options`, `startingItems`, seed), **Checks** (par scène comme le tracker
   de 2Ship, intérieurs rattachés à leur scène parente ; mélanges optionnels — herbe, pots, boules de neige… — selon la
   configuration). Statistiques (chronologie) dans la foulée.
2. **Logique** — extraction de `Rando/Logic/` (régions, checks et sorties de `Regions/*.cpp`, événements, fonctions de
   `Logic.h`, tranches de temps de `TimeLogic.cpp`) vers `data/logic-data.js`, moteur `js/logic.js` ; checks faisables
   maintenant, « pourquoi pas encore ? ». Test : rejeu des spoilers sphère par sphère.
3. **Routeur** — trajets à pied, statues de hibou (Chant de l'envol), changements de forme, moment des trois jours
   (Chant du temps inversé / accéléré) ; bandeau « Où aller maintenant ? ».
4. **Carte** — fabriquée dans le navigateur depuis la ROM de Majora's Mask du joueur (jamais distribuée) : terrain vu
   de dessus, sorties, checks, statues de hibou, étages des donjons.
5. **Auto-tracking** — relais local qui surveille la sauvegarde de 2Ship (`randoSaveChecks` : `obtained`,
   `cycleObtained`, `eligible`, `skipped` ; `randoInf`, inventaire), à chaque sauvegarde du jeu.

Ensuite, au fil de l'eau : Indices (pierres à potins, banque, restes de boss, Chant de Saria…), fenêtre de stream,
README détaillé.
