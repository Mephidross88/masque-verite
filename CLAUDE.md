# Le Masque de Vérité

Tracker d'objets et de checks, et routeur, pour le randomizer de 2 Ship 2 Harkinian 5.0.1 « Battler Bravo » (commit
`8a24047`), dans la continuité de L'Œil Sheikah (même auteur, `c:/Jeux/Zelda/Ocarina of Time/oeil-sheikah` : la coque,
l'i18n et les outils en viennent). Modules (menu, par groupe) : Progression — Checks, Routeur, Indices (id `hints`) ;
Aperçus — Carte (id `map`), Statistiques (id `stats`) ; Configuration ; plus le panneau Objets.
Application 100 % client, sans build : ouvrir `index.html` dans un navigateur suffit.
Interface et textes en français.
Le comportement attendu est décrit dans `SPEC.md` (dont les étapes du projet) : le lire avant toute évolution
fonctionnelle, et le mettre à jour quand une règle change.

## Fichiers
- `index.html` : squelette, charge Vue 3 (CDN jsDelivr, build global, empreinte `integrity` à recalculer en changeant de
  version), les langues `data/i18n/<code>.js`, puis les fichiers de `js/` **dans l'ordre listé ci-dessous** (scripts
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
  1. `js/icons.js` : destructuration de l'API Vue globale, icônes SVG inline (`ICONS`, dont `mask` : la marque).
  2. `js/state.js` : persistance (`defaults`, `merge`, `load`, `store`, sauvegarde auto, `lastSaved`, `saveError`).
  3. `js/components.js` : composants Vue réutilisables (`Seg`, `ProgressCard`) et `paneTpl(id, en-tête, corps)`,
     gabarit commun d'une page (section, barre du second panneau, en-tête).
  4. `js/pages/*.js` : une page (ou partie d'écran) par fichier — `items` (panneau Objets), `checks`, `router`, `hints`,
     `map`, `stats`, `config`. Chacun : gabarits en constantes `…_TPL` (insérés par `${…}` dans celui d'App) et, si
     besoin, logique en `use…(ctx)` : reçoit dans `ctx` les noms des pages assemblées avant elle, renvoie les siens
     (ordre d'assemblage dans `App.setup`). Page pas encore construite : bloc `.soon` (ce qu'elle fera, à quelle étape).
  5. `js/app.js` : la coque — `useShell` (navigation, panneaux côte à côte, thème), `useShellEnd` (sauvegarde, remise à
     zéro), le composant racine `App` + `createApp(...).mount('#app')`.
- `style.css` : styles (repris de L'Œil Sheikah), variables de thème dans `:root` (clair + sombre). Des règles des pages
  pas encore portées (Checks, Routeur, Carte, stream…) y sont gardées pour la suite ; retirer celles qui ne serviront pas.
- `data/i18n/en.js` : dictionnaire anglais.
- `tools/2ship-checks/fetch_sources.mjs` : télécharge dans `tools/2ship-checks/src/` (non versionné) les sources de 2Ship
  au commit voulu (défaut `8a24047`) : `2s2h/Rando/**` (données, logique, tracker, spoiler), `2s2h/SaveManager`,
  `include/` (objets, sauvegarde, scènes, tables), `src/code/` (table des scènes et entrées, étages des donjons).
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
