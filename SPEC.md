# Cahier des charges fonctionnel — Le Masque de Vérité

Objectif : suivre une partie du randomizer de **2 Ship 2 Harkinian** (2Ship, portage PC de Majora's Mask) — objets,
masques, checks, indices — et dire où aller : ce qui est faisable maintenant, selon les objets, les formes et le moment
des trois jours, et quand.

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
  Connexions ; pas de Routeur non plus (les trajets sont ceux du jeu d'origine) : il est remplacé par le Journal des
  Bombers, qui dit *quand* faire chaque check. À revoir si 2Ship ajoute des entrées mélangées.
- **Formes au lieu des âges** : Humain, Deku, Goron, Zora, Oni (masques de transformation). La logique de 2Ship parle de
  `CAN_BE_DEKU`, `CAN_BE_GORON`… plutôt que d'âge.
- **Le temps** : trois jours découpés en **45 tranches** (`TimeSlice` de `Logic.h` : du jour 1 à 6 h à la nuit 3) ; une
  région est accessible à certaines tranches, certains checks ne se font qu'à certaines heures. Option de 2Ship :
  **horloges mélangées** (`RO_CLOCK_SHUFFLE`), où l'on ne peut être qu'aux demi-journées possédées.
- **Les cycles** : le Chant du temps ramène au premier jour. 2Ship garde pour chaque check `obtained` (obtenu au moins
  une fois) et `cycleObtained` (obtenu dans ce cycle) ; une partie des objets se perd au retour (rubis, munitions,
  clés…). L'appli doit distinguer ce qui est acquis pour toujours de ce qui est à refaire.
- **Pas de réseau** : 2Ship n'a pas d'Anchor. L'auto-tracking lit la sauvegarde du jeu (`saves/*.json`, voir
  Auto-tracking), donc seulement quand le jeu sauvegarde : Chant du temps, statues de hibou, option Autosave (toutes les
  1 à 60 minutes ; pas à chaque check en 5.0.1).

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
- Pages du menu, en groupes titrés : **Progression** : Checks, Journal des Bombers (id `notebook`), Indices (id `hints`) ; **Aperçus** : Carte
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

## Données de 2Ship (fichier généré)
`data/checks-data.js` (`window.CHECKS_DATA`) est produit par `tools/2ship-checks/extract_checks.mjs` depuis les sources de
2Ship (`fetch_sources.mjs`, lecture commune `sources.mjs`, libellés français `translate.mjs`) :
- **Scènes** : celles du tracker de checks de 2Ship (`CheckTracker.cpp`), dans son ordre (`betterMapSelectIndex` de la
  table des scènes), noms anglais du tracker. Variantes regroupées (`Play_GetOriginalSceneId` : marais purifié, printemps,
  Forteresse de Pierre inversée…). Un intérieur ou une grotte (`scenesToCheckParent`) est rattaché à la scène où l'on
  ressort : la région rejointe par la dernière sortie (dans l'ordre des numéros d'entrée ; à destination égale, la
  première déclarée, comme la table de 2Ship), sinon la dernière liaison ; l'Autel du Pic Isolé garde la sienne.
- **Checks** : ceux de `StaticData/Checks.cpp` présents dans une région de la logique (`Logic/Regions/*.cpp`, et la région
  de départ `RR_MAX` de `Logic.cpp`), avec leur type (`RCTYPE_…`), leur scène (et les autres scènes où le tracker les
  montre : drops d'ennemis surtout), leur type de drapeau (`FLAG_CYCL_…` : remis à zéro par le Chant du temps) et leur
  objet d'origine. Les checks de la région de départ (Masque Mojo, Chant de l'Apaisement donnés d'office) sont masqués,
  comme dans le tracker de 2Ship. 2 639 checks, 64 scènes.
- **Objets** (`StaticData/Items.cpp`, 239) et **options** (`StaticData/Options.cpp`, 66, avec leur valeur par défaut ;
  `ro` : valeurs des choix, énumérations `RO_…` de `Types.h`, constantes `#define` résolues).
- **Libellés français** : noms de la version française du jeu (lieux, objets, masques, chants, boss : Rhork, Skorn…) ;
  checks composés par règles depuis l'identifiant (`translate.mjs`) : préfixe de la scène retiré, objet en tête avec ses
  qualificatifs (« Pot du bas 2 »), lieux entre parenthèses (« (salle principale) ») ; fées perdues et Skulltulas d'or :
  « Fée perdue (salle centrale, tonneau) » ; personnages, mini-jeux, boutiques : libellé complet. Un mot sans traduction
  arrête la génération. En anglais : noms de 2Ship.

## Configuration
- **Langue** (en tête), **import d'un spoiler** de 2Ship (`randomizer/<seed>.json`, `type: 2S2H_RANDO_SPOILER`) :
  - réglages : chaque option `RO_…` du spoiler (nombre) ; options inconnues signalées ;
  - checks de la seed : les clés de `checks` (`settings.pool`), liste exacte de 2Ship (checks exclus à la génération,
    Skulltulas laissées en place). **Le contenu des checks n'est jamais lu.** Avec cette liste, changer un réglage de
    mélange ne change plus les checks (« revenir aux réglages » la vide) ;
  - objets de départ (`startingItems`) notés dans le panneau Objets ;
  - seed (`inputSeed`, affichée ; `finalSeed`, fichier, commit) ; spoiler d'une autre version de 2Ship : avertissement ;
    autre seed qu'une partie en cours (checks cochés) : choix entre remettre à zéro, importer quand même, annuler.
- **Réglages** (`js/config.js`) : onglets et cartes du menu Rando de 2Ship — Logique et accès, Checks mélangés, Objets,
  Départ, Indices —, libellés et infobulles traduits, valeurs de 2Ship (0 / 1, valeurs des énumérations), défauts
  d'`Options.cpp`. Oui / non et choix courts : boutons ; choix longs : liste ; nombres : champ. Un réglage dépendant d'un
  autre n'est affiché qu'avec lui (comme dans 2Ship : nombre de pièges avec les pièges…).
- **Contrôle des données** : une option de 2Ship sans réglage, ou un type de check sans catégorie, est signalé en tête.

## Checks
- **Checks de la seed** (`checkShuffled`) : la liste du spoiler importé ; sinon les règles de `GeneratePools.cpp` :
  l'option de leur type (`RO_SHUFFLE_…`), boutiques (l'article spécial du Bazar et les deux sacs de bombes de la Boutique de
  Bombes toujours), pas les pots de l'antre de Majora. Les Skulltulas d'or laissées en place restent des checks (2Ship les
  marque mélangées, avec leur jeton). Vérifié sur 7 spoilers 5.0.1 : seuls écartent les checks exclus à la génération
  (absents des réglages, connus par le spoiler).
- **Par scène** (cartes repliables, dans l'ordre du tracker) : nom, restants par catégorie, progression (faits / total) ;
  checks sur deux colonnes : icône de catégorie, libellé (nom anglais de 2Ship au survol), coche ; ⊘ / ↺ : exclure /
  réintégrer (un check exclu ne compte plus ; `settings.excluded`).
- **Catégories** : une par type de check de 2Ship (coffres, personnages, mini-jeux, quarts de cœur, chants, fées perdues,
  restes, boutiques, cartes de Tingle, hiboux, vaches, grenouilles, Skulltulas, ennemis, objets au sol, objets cachés,
  papillons, pots, caisses, tonneaux, boules de neige, herbe, arbres, ruches), icône en trait. Pastilles de la barre
  d'outils : restants ; clic : afficher / masquer, clic droit : seulement celle-ci.
- **Filtres** : recherche (check ou scène, sans accents), masquer les checks faits, les scènes terminées ; barre de
  gauche : tout déplier / replier, afficher les exclus, navigation par scène (faits / total).
- Cocher : bandeau « Coché : … » avec Annuler (5 s). **Progression globale** en tête de toutes les pages : checks faits /
  total, restants, scènes terminées.
- **Faisables** (logique, voir Logique de 2Ship) : avec l'inventaire noté. Ligne mise en avant (faisable) ou estompée (pas
  encore) ; dans chaque scène, faisables d'abord, puis pas encore, puis faits ; en-têtes et barre de gauche : faits /
  faisables / total ; progression globale : nombre de faisables.
- **Frise des trois jours** sur chaque check (lignes alignées) : une paire soleil / lune par jour, numéro du jour au-dessus.
  Jour : ambre, nuit : bleu nuit ; couleur vive : faisable avec l'inventaire noté, pâle : faisable avec d'autres objets ;
  case pleine : toute la demi-journée ; une partie seulement : case remplie de gauche à droite aux heures couvertes
  (12 h par case : 6 h → 18 h, 18 h → 6 h) ; pas disponible : case inversée (fond transparent, bord et symbole en couleur). Heures exactes au survol (« Faisable : Jour 3,
  13 h → Nuit 3, 22 h », « Faisable à tout moment »). « — » : jamais faisable avec la configuration (même avec tous les
  objets). Temps mélangé : les demi-journées pas encore possédées (panneau Objets, selon le mode : au hasard, dans
  l’ordre, à rebours) sont barrées sur les frises et dans le sélecteur de moment ; sans aucune, un message rappelle de
  noter celle que 2Ship donne au départ (tirée au sort, absente du spoiler : sinon seul le jour 1 à 6 h compte).
- **Moment** (barre d'outils, `ui.checks.moment`) : Tous, ou une demi-journée (J1 … N3). Avec un moment, « faisable »
  veut dire faisable à ce moment-là ; la case du moment est entourée sur les frises. « Seulement les faisables »
  (`ui.checks.onlyAvailable`) : seulement les checks faisables (au moment choisi) et ceux déjà faits.
- **Pourquoi pas encore ?** (bouton ? sur un check pas encore faisable, au survol ; clic sur sa piste dans le Journal des
  Bombers) : ce qui manque, au moment choisi s'il y en a un (`whyLocked` de `js/logic.js`). Panneau Objets « tout
  obtenu » (objets, temples, fée de Bourg-Clocher, jetons), puis on retire ce qui n'est pas nécessaire : par blocs, un à
  un, puis palier ou nombre au plus bas — un ensemble minimal parmi d'autres, demi-journées comprises en temps mélangé.
  Affiche aussi les moments où le check serait alors faisable ; « jamais à ce moment-là » (avec les moments possibles)
  quand même tout obtenu ne suffit pas au moment choisi. Calcul de 0,1 à 1 s, lancé après l'ouverture de la fenêtre.
- Checks faits d'après la sauvegarde (auto-tracking) : objet trouvé à la suite du libellé (`game.found`), aussi dans le
  Journal des Bombers.

## Journal des Bombers
Remplace le Routeur de l'Œil Sheikah : une frise chronologique des trois jours, une barre par check.
- **Axe** : les 72 heures du cycle (jour 1, 6 h → jour 4, 6 h), en-tête des six demi-journées (soleil / lune) et
  graduations toutes les 6 h ; bandes de fond : jour clair, nuit teintée.
- **Lignes** : les checks de la seed (non exclus, faisables avec la configuration) à horaire limité, triés par heure de
  début (puis de fin, puis libellé) ; « Aussi les checks sans horaire » ajoute les autres (barre sur tout le cycle).
  Libellé : icône de catégorie, nom, scène, coche — un clic coche ou décoche, comme dans Checks, avec le bandeau « Coché :
  … » et Annuler (une seule fois si Checks est ouvert à côté). Faisable : icône cerclée de vert, nom en gras ; pas encore :
  estompé, avec le bouton ? (« Pourquoi pas encore ? ») en bout de ligne, à la place de la case ronde de Checks ; fait : ✓.
  Heures exactes au survol.
- **Barres** : pâles, moments possibles avec tous les objets ; dorées par-dessus, moments possibles avec l'inventaire
  noté (mêmes calculs que la frise de Checks). Ligne faisable mise en avant, check fait estompé. Clic sur la piste d'un
  check pas encore faisable : « Pourquoi pas encore ? » (voir Checks).
- **Moment** : le même que dans Checks (`ui.checks.moment`) : colonne mise en évidence ; « Seulement les faisables »
  partagé aussi. Temps mélangé : demi-journées pas encore possédées hachurées. Recherche et « Masquer les checks faits »
  propres à la page (`ui.notebook`).
- **Grouper par scène** (`ui.notebook.byScene`, coché par défaut) : une section par scène, dans l'ordre du tracker ;
  ligne d'en-tête repliable (`ui.notebook.collapsed`) avec faits / total et, repliée, sur sa piste, la réunion des horaires de ses
  checks (dorée : checks restants faisables avec l'inventaire noté) ; barre de gauche : tout déplier / replier. Checks triés par heure dans chaque section.
  Toute la largeur du panneau (la frise gagne en précision).

## Auto-tracking (js/link.js, js/pages/tracking.js)
- **Source** : la sauvegarde de 2Ship, `saves/file1.json` (2, 3) — `newCycleSave` (Chant du temps) et `owlSave` (statue
  de hibou, Autosave). Chaque check (`randoSaveChecks`, rangé par numéro de `RandoCheckId`) : `obtained`, `randoItemId`,
  `price`, `shuffled` ; options (`randoSaveOptions`, par numéro de `RandoOptionId`), objets de départ
  (`randoStartingItems`), `finalSeed`, jour, heure (`time` sur 16 bits, 0x4000 = 6 h), nuit. Numéros → noms :
  `CHECKS_DATA.order` (énumérations de `Types.h`, générées). Les deux parties sont réunies (checks faits de l'une ou de
  l'autre) ; jour et heure : la plus récente (`filePlaytime`).
- **Lecture** : dossier `saves` choisi par le joueur (File System Access API, Chrome et Edge ; poignée dans IndexedDB
  `masque-verite-link` ; après rechargement, reprise directe si la permission tient, sinon « Reprendre le suivi » d'un
  clic), relu toutes les 2 s quand le fichier change (`ui.link.slot` : le plus récent, ou file1/2/3) ; JSON illisible
  (fichier en cours d'écriture) : relu au tour suivant. Autres navigateurs, ou à la demande : « Lire une sauvegarde… ».
  Jamais d'écriture dans les fichiers du jeu.
- **Report** (`linkApply`), jamais en arrière (un check fait reste fait, un objet noté reste noté) :
  - nouvelle seed (ou liste des checks vide) : réglages et checks de la seed (`shuffled`) repris ;
  - checks faits, et l'objet trouvé dans chacun (`game.found` : seul ce que le jeu a montré) ;
  - prix des boutiques, laiterie, cartes de Tingle mélangées (`game.prices`, lus par la logique) ;
  - panneau Objets : objets de départ (de la seed et donnés d'office) + objets des checks faits (`applyStartingItems`),
    fusionnés au plus haut ;
  - moment : demi-journée de la sauvegarde dans le sélecteur Moment (option `ui.link.moment`) ;
  - temps de jeu de 2Ship (`filePlaytime`, `game.playtime`) et chronologie datée (voir Statistiques).
- **Autre seed** que la partie notée (avec des checks faits) : ignorée et signalée (`link.foreign`), « Remettre à zéro et
  suivre ». Autre version de 2Ship : avertissement (commit) ou refus (nombre de checks différent).
- **Interface** : pastille d'état dans la barre de gauche (pas de suivi, en pause, suivi, dossier illisible) ; fenêtre :
  marche à suivre (Autosave à 1 minute), dossier, fichier suivi, moment, dernière lecture, journal.
- **Suivi en ligne** : carte « Dernière sauvegarde » en tête des pages, à côté du compteur de checks (demi-journée et heure
  du jeu, soleil ou lune, frise des six demi-journées avec un repère ; clic : fenêtre de l'auto-tracking) ; Journal des
  Bombers : trait vertical rouge à cette heure sur toutes les lignes, heure dans l'en-tête (`link.save.hours`) ;
  le temps écoulé avant (depuis le jour 1, 6 h) est assombri et hachuré, barres comprises.

## Indices (js/pages/hints.js)
- **Source** : les objets de la seed — spoiler importé (Configuration) ou sauvegarde suivie (`randoItemId` de chaque check
  mélangé) —, gardés à part de la partie (`seedItems`, localStorage `masque-verite-seed` : { finalSeed, objets par check }).
  Objets d'une autre seed que la partie notée : indices non calculés, signalé.
- **Révélés à la lecture** : chaque indice reste caché (« non lu ») tant que le joueur ne l'a pas marqué lu
  (`game.hints` : { id : true }), comme en jeu ; clic sur la ligne (ou sur la pierre de la Carte) : lu / non lu.
- **Pierres à potins** (`EnGs.cpp`, `GetRandomCheck`) : le check désigné est tiré au sort, pondéré (poids 100 + (base − 1)
  × force de l'option, base par check, sinon par objet, sinon par type d'objet ; objets « JUNK » exclus), avec la graine
  finalSeed + (numéro de scène + x + z de la pierre) et le générateur de 2Ship (PCG32, `Ship_Random` avec rejet). Les
  pierres et leur position viennent des cartes (`stones` de `maps-data`) : sans cartes, pas de pierres. Texte : objet
  et lieu (`GetLocationNameForHint` : scène de la région de logique ; intérieurs et grottes : scène de leur sortie).
  Rangées comme la liste des cartes (régions, lieux, grottes).
- **Autres indices** (selon leurs options) : avis de recherche des restes des boss, masques de transformation (âmes en
  peine), Skull Kid (Hymne du Ciel), stèle du Marais du Sud (Chant de l'Envol), Zora de la Grande Baie (grappin), forgeron
  (poudre d'or), pancarte de la banque, récompenses des Maisons des Araignées, du forgeron et des Grandes Fées.
- **Ignoré** : le Chant de Saria (indice dynamique, vers le prochain check utile : il dépend de la partie en cours).
- **Ailleurs** : page Checks, objet indiqué sur son check (indice précis : récompense, pierre à poids propre) ou en tête du
  lieu (indice de lieu seulement) ; Carte, pierres en losanges (claires : non lues, pleines : lues ; masquées avec les checks).

## Statistiques (js/pages/stats.js)
- **Chronologie** (`game.timeline`, sauvegardée, remise à zéro avec la partie) : chaque hausse d'un objet du panneau
  (`{ k:'items', id, v }`, v = palier ou nombre atteint) et chaque check coché (`{ k:'checks', id }`). Une baisse ou un
  check décoché retire ses entrées. Observateur synchrone (`state.js`) ; objets de départ (spoiler, sauvegarde) non notés
  (`timelineSkip`).
- **Datation** : heure réelle `t` ; temps de jeu `p` de 2Ship (`filePlaytime` de la sauvegarde, en ms, mis à jour à chaque
  sauvegarde : avec l'Autosave, à chaque check) pour ce que rapporte l'auto-tracking, sinon estimé (temps de la dernière
  sauvegarde lue plus le temps écoulé, 10 min au plus, suivi en ligne) ; moment du cycle `c` (demi-journée, heure du jeu)
  de la sauvegarde. Première lecture de la page ou d'une nouvelle seed : ce que la sauvegarde contenait déjà est noté
  sans date (« avant le suivi », `timelineQuiet`).
- **Contenu** : compteurs (temps de jeu de 2Ship à la dernière sauvegarde lue `game.playtime`, checks faits, masques,
  cœurs) ; courbe en escalier des checks faits au fil du temps de jeu ; chronologie (plus récent d'abord) filtrable
  Objets / Checks / Tout : temps de jeu (ou heure réelle, en plus petit), moment du cycle, objet trouvé dans le check.

## Carte (js/pages/map.js, js/maps-extract.js)
- **Fabrication** : depuis la ROM de Majora's Mask du joueur (N64 US, compressée ou non, .z64 / .v64), jamais distribuée :
  choisie sur la page Carte, lue dans le navigateur (`js/maps-extract.js`, chargé à la demande), cartes gardées dans
  IndexedDB (`masque-verite-maps`), « Oublier ces cartes ». En ligne de commande : `tools/2ship-maps/extract_maps.mjs`
  → `data/maps-data.js` (non versionné, passe avant). Recette `data/maps-recipe.js` (`tools/2ship-maps/gen_maps_recipe.mjs`,
  tirée des sources de 2Ship : scènes, noms français, numéro de scène des entrées, acteurs) : rien de la ROM.
- **Lecture de la ROM** : table des fichiers (dmadata), Yaz0, table des scènes du code (16 octets par scène : là où le plus
  de fichiers commencent par un en-tête de scène) ; par scène : collision (sols vus de dessus, murs, eau), points
  d'apparition, sorties (polygones dont le type de surface porte un numéro de sortie, y compris derrière les portes des
  intérieurs ; liste des sorties 0x13 → numéro d'entrée → scène d'arrivée).
- **Page** : choix du lieu (`ui.map.scene`) par région (MAP_REGIONS de js/pages/map.js) : Centre (Bourg-Clocher et Plaine
  Termina, Route du Lait, Ranch), Sud (Marais, Bois-Cascade), Nord (Montagne, Pic des Neiges), Ouest (Grande Baie), Est (Ikana,
  Forteresse de Pierre), Autres (Lune, Chambre des Géants, Fontaines des Fées, début du jeu) ; dans l'ordre du chemin (lieu,
  intérieurs, donjon), puis les grottes de la région (d'après leur trou ; sans trou : leur lieu extérieur d'après la logique),
  homonymes numérotés ; carte absente de la table : Autres ;
  sol en dix teintes de hauteur (quantiles), murs, eau ; un repère par sortie avec le nom du lieu d'arrivée, clic : sa
  carte (← : retour). Molette : zoom ; glisser : déplacer ; + / − / tout le terrain.
- **Checks à leur place** : position de l'acteur de chaque check dans les listes d'acteurs des salles (en-tête principal),
  d'après des règles tirées de `Rando/ActorBehavior/*.cpp` (`recipe.loc`, comme 2Ship relie ses acteurs à ses checks) :
  tables { scène, salle, n-ième acteur } (caisses, tonneaux, arbres, boules de neige, ruches, papillons, objets cachés,
  pots, herbe ; acteurs qui en font apparaître plusieurs : checks de suite de la même famille) ; drapeaux de coffre (coffres,
  Skulltulas d'or), d'objet (objets posés, pots, fées perdues, réceptacles) et d'interrupteur ; brins des touffes d'herbe
  (motifs d'Obj_Grass_Unit, brin gardé si le sol est à moins de 80 unités, numérotés à la suite) ; sinon l'acteur du
  personnage (fichier ActorBehavior qui cite le check) ; statues de hibou. Variantes de scène (Marais purifié, printemps)
  : checks de la scène d'origine. Grottes (SCENE_KAKUSIANA) : une salle commune à toutes les grottes à coffre (salle 4)
  et une aux grottes à vache (salle 10), reconnues par 2Ship à leur entrée (chestGrottoMap, chestGrottoActorIdsToBaseRc,
  cowGrottoMap d'ObjGrass.cpp) : herbes et coffre (créé par En_Torch) placés dans la salle commune. Anneaux d'herbe de
  Keaton, objets cachés (un point libère plusieurs objets : checks de suite), fresque du mur de la Plaine (En_Gakufu),
  gong de l'École d'escrime (Obj_Dora) ; Skulltulas d'or cachées (sol meuble, caisse, ruche, pot : numéro de jeton dans
  leurs paramètres) ; fées dans une bulle (En_Elfbub) ; ruches (drapeau d'objet). À défaut : la position d'un voisin de
  la même famille (rubis d'un Guay, articles d'une boutique) ; salle d'un boss : la place du boss. PNJ : l'acteur dont
  le code (décompilation embarquée par 2Ship, src/overlays/actors, téléchargée par fetch_sources.mjs) lève le drapeau
  d'événement du check (comparé par valeur : WEEKEVENTREG_57_04 = son nom parlant) ; boutiques : le marchand (acteur qui
  fait apparaître les articles) ; acteur créé en cours de partie : celui qui le crée (Actor_Spawn, trois niveaux).
  ~2 550 checks placés, dont ~190 **approchés** (5e valeur) : personnage (il bouge selon l'heure : Anju donne la clé au
  comptoir et la lettre dans la cuisine), voisin de famille, boss ; ~30 sans position (hors ennemis).
- Outil de placement affiché : la carte montre tous les checks du jeu (pas seulement ceux de la seed), sans les filtres.
- Mode placement : liste « À vérifier » (positions approchées du lieu), repères approchés en pointillés ; les placer à la
  main les corrige ; « valider » une position juste la garde telle quelle, comme placée à la main (elle quitte la liste et
  part dans l'export : rien n'est oublié).
- Repères des checks de la seed (non exclus) : faisable (vert), pas encore (rouge), fait (gris), heures au survol ; clic :
  cocher (bandeau Annuler). Réglage « Checks » (`ui.map.checks`, comme l'Œil Sheikah) : « Comme la page Checks » (ses filtres :
  catégories, faits masqués, seulement les faisables au moment choisi, recherche), « Tous » (ceux de la seed non exclus,
  faits compris), « Aucun ».
- **Grottes : une carte par grotte** (liste « Grottes »). La scène des grottes est découpée en salles (`SCENE_KAKUSIANA#n` :
  sols, murs, eau, sorties, checks de la salle la plus proche). Les grottes à coffre (salle 4) et à vache (salle 10)
  partagent une salle : une carte par grotte (`SCENE_KAKUSIANA#n|RC_…_GROTTO` : même terrain, ses seuls checks). Nom : d'après
  ses checks (« Plaine Termina · grotte du pilier ») ; salle non partagée : son groupe de checks le plus fourni. Trous de
  grotte sur les cartes extérieures (Door_Ana : entrée des grottes → salle, données de réapparition → grotte, comme 2Ship ;
  losange brun, clic : la carte de la grotte) ; dans une grotte, la sortie (retour au trou) mène au lieu extérieur.
  Rotations des acteurs des salles : 9 bits du haut, en degrés ou valeur brute selon le drapeau du numéro d'acteur
  (Actor_SpawnEntry). Zones d'une même sortie éloignées de plus de 300 unités : un repère chacune.
- **Étages** (donjons, Château d'Ikana, Village Goron…) : hauteur de sol de référence de chaque salle sur la carte du
  menu pause (commande 0x1C de la scène), hauteurs distinctes à 5 unités près, écarts d'au moins 200 unités (sinon un
  seul niveau : Marais du Sud). Étage d'une hauteur : comme MapDisp_GetStoreyY (sol de l'étage − 80). Noms comme le menu
  pause : 1, 2… et sous-sols S1, S2 (étage le plus bas de z_map_disp.c : Pic des Neiges S1, Grande Baie S2, Forteresse
  de Pierre S1). Boutons à droite de la carte, du plus haut au plus bas, avec le nombre de checks à faire ; étage affiché
  par défaut : celui de l'entrée ; les autres en fond atténué ; sorties et checks de l'étage seulement.
  Lieux sans carte au menu pause (Auberge, Observatoire, intérieur de la Tour de l'Horloge, maison de Romani…) : hauteurs
  de référence de leurs salles quand même, regroupées à 100 unités près, au moins 150 d'écart, gardées seulement si les
  étages se superposent (un sol sur cinq d'un étage au-dessus d'un sol plus bas).
  Maisons des Araignées (aucune donnée, hauteurs continues) : coupe fixée à la main dans js/maps-extract.js (MANUAL_STOREYS)
  à 160 — Marais : 1 (sols) et 2 (passerelles, balcons, ruches) ; Côte : S1 (sous-sol) et 1 (étage de l'entrée).
- **Placement à la main** (« Outil de placement des checks », sous la carte : `ui.map.editTool`) : bouton « ✎ Placer les
  checks » ; liste des checks du lieu sans position (checks de la scène du jeu, `recipe.cs`, ou de sa scène d'origine pour
  une variante), à cocher puis placer d'un clic sur la carte (hauteur : le sol sous le clic, à l'étage affiché) ; liste
  des checks placés à la main (déplacer, retirer). Positions gardées dans le navigateur (localStorage
  `masque-verite-positions`), « Exporter » : `positions-manuelles.json` (avec celles déjà dans la recette), à déposer
  dans `tools/2ship-maps/` puis `gen_maps_recipe.mjs` (`recipe.manual`, sans refaire les cartes). Ordre : placées dans ce
  navigateur, puis celles de la recette, puis celles calculées depuis la ROM (corriger une position calculée : la placer).
  Provisoire : outil affiché, la liste des lieux ne propose que ceux qui ont des checks sans position (et leur nombre).
- À venir : une carte par salle pour les scènes partagées, position
  de la dernière sauvegarde.

## Logique de 2Ship
- **Données** (`data/logic-data.js`, généré par `tools/2ship-logic/extract_logic.mjs`) : les 315 régions de
  `Logic/Regions/*.cpp` et la région de départ `RR_MAX` (`Logic.cpp`), avec checks, sorties (résolues en région d'arrivée
  par `GetRegionIdFromEntrance` ; à destination égale, la première sortie déclarée, comme la table de 2Ship), liaisons,
  événements, restrictions d'attente (`STAY`) ; conditions C++ converties en fonctions JS sur le contexte `L` ; macros
  locales des fichiers de régions ; conditions de `CanKillEnemy` et âme de chaque ennemi (`Souls.cpp`).
- **Moteur** (`js/logic.js`) : portage des macros de `Logic.h` (formes — Link est humain —, chants et touches de l'ocarina,
  y compris la particularité de 2Ship pour l'Intro de la Berceuse, épées, boucliers, bourse, magie, cœurs, clés, fées,
  jetons, drapeaux, prix, temps) et de l'exploration (`FindReachableRegions`, `ExpandTimeForward`, événements jusqu'au
  point fixe), sans placer d'objets. Temps : 45 tranches ; une région reçoit toutes les tranches de la région d'où l'on
  vient (comme 2Ship), puis y attend si elle le peut ; temps mélangé : seulement les demi-journées possédées.
- **En logique** (faisable) : condition vraie sur les tranches de la région, événements acquis valant pour tout le cycle
  (comme 2Ship). **Moments** (frise) : condition tranche par tranche ; un événement n'y compte qu'à partir de la première
  tranche où il peut avoir lieu (tout est remis à zéro à chaque cycle : la vieille dame ne donne son masque qu'après
  avoir été sauvée, nuit 1 à minuit).
- **État** : d'après le panneau Objets, plus les objets donnés d'office selon la configuration (`computedStartingItems` :
  nage, touches, âmes, chants du temps non mélangés, consommables, cartes, clés et fées « au départ ») ; le Sac de Bombes
  donne aussi les Missiles Teigneux. Prix des boutiques mélangées : connus (`game.prices`), sinon 200 rubis au pire.
- **Test** : `node tools/2ship-logic/replay_spoilers.mjs [dossier]` rejoue chaque spoiler sphère par sphère (objets du
  spoiler, objet d'origine pour les checks hors spoiler) : tous ses checks doivent être atteints (2Ship garantit les seeds
  sans glitch). Temps mélangé sans demi-journée de départ notée : 2Ship en tire une ; on essaie les six. À relancer après
  toute modification de `js/logic.js`, de l'extraction ou des objets.

## Panneau Objets (droite)
Rangé comme l'écran de pause du jeu (`js/items.js`, `ITEM_GROUPS`) :
- **Objets** (6 colonnes) : Ocarina, Arc (paliers : 30, 40, 50 flèches), flèches de feu / glace / lumière, Sac de Bombes
  (20, 30, 40), Missiles Teigneux, Bâton et Noix Mojo, Haricot Magique, Baril de Poudre, Boîte à Images, Monocle de Vérité,
  Grappin, Grande Epée des Fées, bouteilles (compteur, 6) ; **objets d'échange** (Larme de Lune et titres en une chaîne,
  Clé de Chambre, lettres, Pendentif).
- **Masques** (6 × 4, ordre du jeu, masques de transformation en dernière colonne).
- **Équipement** : Épée (Kokiri, Rasoir, Dorée), boucliers, Bourse (99 d'office, puis 200, 500, 5000), Magie, Double
  Défense, Attaque Cyclone, Journal des Bombers, quarts et réceptacles de cœur ; **chants** (Berceuse : intro puis
  complète ; Chant de Saria seulement s'il est mélangé) ; **restes des boss** (et fragments de Triforce en chasse).
- **Selon la configuration** : nage, touches de l'ocarina, passe-partout, demi-journées (au hasard : une tuile chacune ;
  progressif : compteur), grenouilles, statues de hibou, âmes des boss, âmes des ennemis.
- **Temples** : carte, boussole, Clé d'Or, petites clés (nombre d'origine), fées perdues (sur le nombre demandé) ; fée
  perdue de Bourg-Clocher ; jetons de Skulltula d'or par maison (si mélangées).
- Chaque objet est relié à ses objets de 2Ship (`ri`, `levelOf` pour un palier précis) : objets de départ du spoiler,
  logique et auto-tracking ensuite. Clic : activer / palier suivant / +1 ; clic droit : l'inverse.
- **Icônes** : PNG 192 px, fond transparent, rangés par dossier dans `icons/` (`items`, `equipment`, `masks`, `songs`,
  `trade_items`, `boss_remains`, `dungeons`, `others`) ; table `ITEM_ICONS` de `js/items.js` (clé → chemin, ou un chemin par
  palier), sinon `icons/items/<clé>.png` ; à défaut, un sigle (initiales). Icônes partagées : statues de hibou, âmes des
  boss, âmes des ennemis. Prélude de la Berceuse : icône à moitié estompée. Temples : carte, boussole, Clé d'Or, petites
  clés, fées perdues de chaque temple et de Bourg-Clocher, Skulltulas de chaque maison.

## Étapes
Même démarche que pour l'Œil Sheikah : chaque étape est utilisable et vérifiée avant la suivante ; la SPEC est complétée
à mesure (une section par page ou règle).

0. **Fondations** — *fait* : dépôt, coque (navigation, côte à côte, panneau Objets, thème, langue, sauvegarde,
   export / import, remise à zéro), pages annoncées (bloc « bientôt » : ce que fera la page, à quelle étape), contrôles
   (syntaxe, noms non définis, traductions), téléchargement des sources de 2Ship.
1. **Données** — *fait, sauf les icônes du panneau Objets* : `data/checks-data.js` (voir Données de 2Ship),
   Configuration et import du spoiler, page Checks, panneau Objets. Statistiques (chronologie) dans la foulée.
2. **Logique** — *fait* : extraction et moteur (voir Logique de 2Ship ; 7 spoilers 5.0.1 finis), checks faisables, frise
   des trois jours et moment dans la page Checks, « pourquoi pas encore ? ».
3. **Journal des Bombers** — *fait* (remplace le Routeur : sans entrées mélangées, les trajets n'apportent guère) :
   frise des trois jours, une barre par check (voir Journal des Bombers).
4. **Carte** — *en cours* : fabrication depuis la ROM du joueur, terrain, sorties et checks faits (voir Carte) ;
   étages, placement à la main, grottes (la position de la dernière sauvegarde est écartée : sans heure réelle, trompeuse).
5. **Auto-tracking** — *fait* : lecture de la sauvegarde de 2Ship dans le navigateur, sans relais (voir Auto-tracking).

6. **Indices** — *fait* (voir Indices ; à valider en jeu sur les pierres à potins).
7. **Statistiques** — *fait* (voir Statistiques).

Ensuite, au fil de l'eau : fenêtre de stream,
README détaillé.
