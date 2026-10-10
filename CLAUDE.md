# Le Masque de Vérité

Tracker d'objets et de checks, avec frise des trois jours (Journal des Bombers), pour le randomizer de 2 Ship 2 Harkinian 5.0.1 « Battler Bravo » (commit
`8a24047`), dans la continuité de L'Œil Sheikah (même auteur, `c:/Jeux/Zelda/Ocarina of Time/oeil-sheikah` : la coque,
l'i18n et les outils en viennent). Modules (menu, par groupe) : Progression — Checks, Journal des Bombers (id `notebook`), Indices (id `hints`) ;
Aperçus — Carte (id `map`), Statistiques (id `stats`) ; Configuration ; plus le panneau Objets.
Application 100 % client, sans build : ouvrir `index.html` dans un navigateur suffit.
Interface et textes en français.
Le comportement attendu est décrit dans `SPEC.md` (dont les étapes du projet) : le lire avant toute évolution
fonctionnelle, et le mettre à jour quand une règle change.

## Fichiers
- `index.html` : squelette, charge Vue 3 (CDN jsDelivr, build global, empreinte `integrity` à recalculer en changeant de
  version), les données `data/checks-data.js`, les langues `data/i18n/<code>.js`, puis les fichiers de `js/` **dans l'ordre listé ci-dessous** (scripts
  classiques, pas de modules ES : chaque fichier partage le même scope global de haut niveau, comme s'il s'agissait d'un
  seul fichier — un `const`/`function` déclaré dans un fichier est directement utilisable dans les suivants ; ne pas
  redéclarer un identifiant existant).
  0. `js/i18n.js` : langue de l'interface — `LANG` (localStorage `masque-verite-lang`, sinon le navigateur), langues
     `I18N_LANGS` (livrées : `data/i18n/<code>.js` ; importées : localStorage `masque-verite-langs`, `importLang` /
     `removeLang`), `t(texte, paramètres)`, `tn(n, singulier, pluriel)`, `td(fr, nom anglais 2Ship)` (libellés de
     données), `tWalk(objet, champs)`, `tpl(gabarit)` (gabarits traduits au chargement), `setLang`. Tout nouveau texte de
     l'interface : en français (par `t()` s'il est calculé en JS, `tn()` pour un pluriel ; pas de variable de boucle
     nommée `t` dans les gabarits), puis sa traduction dans `data/i18n/en.js` ; contrôle `node tools/i18n/check.mjs`
     (0 manquant attendu ; `--strict` : échec sinon ; `--js` : les manquants au format du dictionnaire). Le contrôle ne
     repère pas les textes des expressions qui contiennent des parenthèses (`:title="… ? 'Thème clair (…)' : …"`) :
     les ajouter au dictionnaire à la main. Une traduction n'est jamais insérée telle quelle dans un gabarit.
  1. `js/icons.js` : destructuration de l'API Vue globale, icônes SVG inline (`S`, `ICONS`, dont `mask` : la marque).
  2. `js/config.js` : réglages du randomizer — `RO` (valeurs des choix), `OPT_DEFAULT`, `CONFIG_TABS` (onglets et cartes du
     menu Rando de 2Ship), `SETTINGS_DEF` (clé = option `RO_…` du spoiler, libellé, infobulle, type `bool` / `choice` /
     `num`, `show(s)`), `SETTING_BY_KEY`, `CONFIG_ERRORS`. Valeurs stockées = nombres de 2Ship ; tester `s.RO_X === RO.RO_…`.
  3. `js/checks.js` : `CHECK_SCENES`, `ITEM_DATA`, `CI` (icônes de catégorie), `CHECK_CATS` (une par `RCTYPE_`), `CHECKS`,
     `CHECK_BY_ID`, `CHECKS_BY_SCENE`, `checkShuffled(c, s)` (liste du spoiler, sinon règles de `GeneratePools.cpp`).
  4. `js/items.js` : `ITEM_GROUPS` (panneau Objets, comme l'écran de pause ; chaque objet relié à ses `RI_…`),
     `DUNGEONS`, `ITEM_BY_KEY`, `ITEM_BY_RI` (objet de 2Ship → objet, palier, case de temple), `SPIDER_HOUSES`, helpers de
     tuile (`itemActive`, `iconSrc`, `itemAbbr`, `itemTitle`, `clickItem`, `rightClickItem`), `applyStartingItems`,
     `computedStartingItems`, `startingTimeItems` (demi-journée de départ), `shipRandom` (générateur de 2Ship), mise en page
     du panneau `ITEMS_PAGE` / `ITEM_ICONS`.
  4b. `js/logic.js` : moteur de logique (notre portage de `Rando/Logic` de 2Ship) — contexte global `L` lu par les
     conditions de `logic-data.js` (macros de `Logic.h`, temps), état `LS` / tranches `LT` (champs de bits BigInt),
     `computeLogic(état)` → `{ regions, events, evFirst, checks:{ RC:{ ok, when } } }` (`when` : tranches fines,
     `fineRegionTimes` / `CLOSING_STAY`), `stateFromGame(game, settings,
     prices)`, `fullState(settings)`, `giveItem(état, RI)`, `HALF_MASK`, `halfDaysOf`, `halfDayLabel`, `whenText`, `whenRuns`,
     `whyLocked(game, settings, RC, moment)` (« Pourquoi pas encore ? » : objets du panneau au plus juste). Pur.
  5. `js/state.js` : persistance (`defaults`, `merge`, `load`, `store`, sauvegarde auto, `lastSaved`, `saveError`), objets de la
     seed `seedItems` / `setSeedItems` (localStorage `masque-verite-seed`, à part de la partie : indices), chronologie
     (`game.timeline`, observateur synchrone ; `timelineQuiet` / `timelineSkip` / `timelinePlay` / `timelineAt`, posés par `link.js`),
     `STREAM_MODE` (fenêtre de stream : relit le store via l'événement `storage`, ne sauvegarde rien, ne date rien).
  5b. `js/link.js` : auto-tracking par la sauvegarde de 2Ship — `link` (état, journal), `readSave(json)` (sauvegarde →
     checks faits, objets, prix, options, moment), `linkApply` (→ partie notée, jamais en arrière), suivi du dossier `saves`
     (`linkPick`, `linkResume`, `linkStop` ; File System Access API, poignée dans IndexedDB), `linkPickFile`, `linkAdopt`.
  6. `js/components.js` : composants Vue réutilisables (`Seg`, `ProgressCard`, `ItemTile`), `brokenIcons`, et
     `paneTpl(id, en-tête, corps)`, gabarit commun d'une page (section, barre du second panneau, en-tête).
  6b. `js/stream.js` : fenêtre de stream (`index.html?stream`, reprise de L'Œil Sheikah) — types de widgets (`STREAM_TYPES`,
     `STREAM_METRICS`), thèmes, dispositions (localStorage `masque-verite-stream`), gabarit (`streamTemplate(parts)`, appelé
     par `app.js` avec `ITEMS_TPL` / `DUNGEONS_TPL`) et éditeur (`useStream(STREAM_MODE, app)` dans `useShellEnd`).
  7. `js/pages/*.js` : une page (ou partie d'écran) par fichier — `items` (panneau Objets, temples), `checks`, `notebook`, `tracking` (fenêtre de l'auto-tracking)
     (Journal des Bombers : frise des 72 h, une barre par check, d'après `logicFull` / `logicNow` de `checks`), `hints` (Indices : pierres à potins tirées comme `EnGs.cpp`, autres indices,
     révélés à la lecture `game.hints` ; `hintsByCheck` / `hintsByScene` pour Checks, `hintStones` pour la Carte), `map`, `stats` (Statistiques : chronologie, temps de jeu de 2Ship, courbe des checks), `config`. Chacun : gabarits en constantes `…_TPL` (insérés par `${…}` dans celui d'App) et, si
     besoin, logique en `use…(ctx)` : reçoit dans `ctx` les noms des pages assemblées avant elle, renvoie les siens
     (ordre d'assemblage dans `App.setup`). Page pas encore construite : bloc `.soon` (ce qu'elle fera, à quelle étape).
  8. `js/app.js` : la coque — `useShell` (navigation, panneaux côte à côte, thème), `useShellEnd` (sauvegarde, remise à
     zéro `resetGame` / `resetAll`, fenêtre de stream `openStream`), le composant racine `App` (gabarit : `STREAM_TPL` en mode
     stream, sinon la coque) + `createApp(...).mount('#app')`.
- `data/logic-data.js` : **fichier généré** par `tools/2ship-logic/extract_logic.mjs` (régions, conditions en fonctions
  JS, tranches horaires, conditions des ennemis et âmes). `tools/2ship-logic/replay_spoilers.mjs` : test du moteur (rejeu des
  spoilers de `../randomizer`) — à relancer après toute modification de `js/logic.js`, de l'extraction ou de `js/items.js`.
- `data/checks-data.js` : **fichier généré** par `tools/2ship-checks/extract_checks.mjs` (scènes, checks, objets, options
  de 2Ship, libellés anglais et français) ; ne pas l'éditer à la main, relancer le générateur.
- `icons/` : icônes du panneau Objets et des temples (PNG 192 px, un dossier par famille), reliées aux objets par
  `ITEM_ICONS` (`js/items.js`) ; publiées avec l'appli. Sources en 1024 px hors du dépôt (`../raw`).
- `style.css` : styles (repris de L'Œil Sheikah), variables de thème dans `:root` (clair + sombre). Des règles des pages
  pas encore portées (Carte, stream…) y sont gardées pour la suite ; retirer celles qui ne serviront pas.
- `data/i18n/en.js` : dictionnaire anglais.
- `tools/2ship-checks/` : génération des données (mode d'emploi : son `README.md`) — `fetch_sources.mjs` (sources de 2Ship
  au commit voulu dans `src/`, non versionné), `sources.mjs` (lecture commune : checks, objets, options, scènes, régions de
  la logique, énumérations, numéros d'entrée), `extract_checks.mjs` (→ `data/checks-data.js`), `translate.mjs` (noms
  français : scènes, objets, et composition des noms de checks ; un mot inconnu arrête la génération).
- `js/maps-extract.js` : fabrication des cartes depuis la ROM du joueur (`extractMaps`), script **chargé à la demande** (page
  Carte, `mapsBuild` de `js/pages/map.js` ; et `tools/2ship-maps/extract_maps.mjs` → `data/maps-data.js`, **généré, non
  versionné**, tiré de la ROM). `data/maps-recipe.js` : **fichier généré** par `tools/2ship-maps/gen_maps_recipe.mjs` depuis
  les sources de 2Ship (rien de la ROM ; les cartes donnent aussi les pierres à potins, `stones`) et `tools/2ship-maps/positions-manuelles.json` (checks placés à la main sur la Carte,
  exportés par son outil de placement ; à relancer après l'avoir mis à jour). Ne jamais versionner ni publier de données tirées de la ROM.
- `tools/i18n/check.mjs`, `tools/lint/no_undef.mjs` : contrôles (voir leur en-tête).
- `.github/workflows/` : `pages.yml` (appli en ligne, fichiers de l'appli seulement), `checks.yml` (syntaxe, noms non
  définis, traductions `--strict`).

## Contraintes
- Pas d'outil de build, pas de modules ES, pas de dépendance hors CDN. Doit marcher en `file://` et en ligne.
  Ne jamais introduire `import`/`export` dans `js/`, ni changer l'ordre de chargement dans `index.html` sans vérifier
  les dépendances.
- Sauvegarde automatique dans `localStorage` (clé `masque-verite-v1`) à chaque changement de `store`.
  Tout nouveau champ persistant doit avoir une valeur dans `defaults()` (fusion via `merge()` au chargement).
- Données du jeu : uniquement tirées des sources de 2Ship au commit de référence, par des outils de `tools/`
  (fichiers générés, en-tête qui le dit). Rien de la ROM n'est versionné ni publié.
- Noms de nos fichiers de logique sans « 2ship » / « 2s2h » (ce sont nos portages, pas des fichiers de 2Ship) :
  `logic-data.js`, `js/logic.js`.

## Vérifications
Après une modification : `node --check` sur les scripts touchés, `node tools/i18n/check.mjs --strict`, et
`LINT_DIR=<dossier où eslint@9 et globals sont installés> node tools/lint/no_undef.mjs`. Rendu : Chrome headless
(`--screenshot`), thèmes clair et sombre.

## Débogage
`window.__PF` expose `store` et `I18N_MISSING` pour tester dans la console du navigateur.
