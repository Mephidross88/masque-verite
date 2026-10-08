# Données de 2Ship

Scripts Node lancés à la main (jamais chargés par l'appli) qui produisent `data/checks-data.js` depuis les sources de
2 Ship 2 Harkinian, à la version de référence (5.0.1, commit `8a24047`).

```sh
node tools/2ship-checks/fetch_sources.mjs        # sources dans tools/2ship-checks/src (non versionné) ; [commit] en option
node tools/2ship-checks/extract_checks.mjs       # → data/checks-data.js
```

- `sources.mjs` : lecture des tables C++ de 2Ship par expressions régulières (rien n'est exécuté), avec contrôles
  (nombre d'entrées, valeurs connues) ; commun aux générateurs (la logique s'en servira).
- `extract_checks.mjs` : scènes du tracker de checks de 2Ship (regroupements et rattachements de `CheckTracker.cpp`),
  checks présents dans la logique, objets, options et valeurs de leurs choix. Voir `SPEC.md` › Données de 2Ship.
- `translate.mjs` : noms français. Scènes, objets, masques, chants, boss : noms de la version française du jeu. Checks :
  composés depuis l'identifiant (dictionnaire de mots et d'expressions `W`, libellés complets `CHECK_FR` pour les
  personnages, mini-jeux et boutiques). Un mot sans traduction arrête la génération et est listé : l'ajouter à `W`.

À une montée de version de 2Ship : changer le commit par défaut de `fetch_sources.mjs` et `extract_checks.mjs`, relancer,
relire les nouveaux checks (et `SPOILER_COMMIT` de `js/pages/config.js`).
