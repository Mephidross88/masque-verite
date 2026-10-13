# Le Masque de Vérité

*[English version](README.en.md)*

Tracker pour le randomizer de **2 Ship 2 Harkinian 5.0.1** (Majora's Mask) : objets, masques, checks, indices, et ce
qui est faisable — et quand — selon vos objets, vos formes et le moment des trois jours. Dans la continuité de
[L'Œil Sheikah](https://github.com/Mephidross88/oeil-sheikah) (Ship of Harkinian). Tout se passe dans le navigateur, en
français ou en anglais (Configuration › Langue).

## Lancer l'appli

**En ligne : https://mephidross88.github.io/masque-verite/** — rien à installer, la partie est sauvegardée
automatiquement dans le navigateur (Chrome, Edge ou Firefox récent ; l'auto-tracking demande Chrome ou Edge).

Ou téléchargez le dépôt (Code › Download ZIP) et ouvrez `index.html` : même appli, hors ligne. Chaque version garde sa
propre partie ; pour passer de l'une à l'autre : « Exporter ou importer la partie » (barre de gauche).

Pour commencer une partie :
1. **Configuration** › « Importer depuis un spoiler 2Ship… » : choisissez le spoiler log (`.json`) de votre seed. Les
   réglages et la liste des checks de la seed sont repris ; l'emplacement des objets reste caché (il ne sert qu'au texte
   des indices, une fois marqués lus). Avec l'auto-tracking, inutile : les réglages viennent de la sauvegarde.
2. Notez vos objets dans le panneau **Objets** (à droite ; clic : obtenu / palier suivant, clic droit : l'inverse) et vos
   checks dans **Checks** — ou laissez l'auto-tracking le faire (ci-dessous).

## Les pages

| Page | Pour quoi faire |
|---|---|
| **Checks** | Les checks de la seed, lieu par lieu : faits, faisables maintenant, pas encore — et pourquoi (objets manquants, moment). Une frise des trois jours par check ; le sélecteur **Moment** (J1 à N3) montre ce qui est faisable à ce moment-là. Des points de couleur indiquent les formes (humain, Mojo, Goron, Zora) avec lesquelles un check se fait. |
| **Donjons** | Les quatre temples salle par salle, en liste à cocher : une route conseillée, ce qu'il faut avoir à chaque étape, la dynamique de chaque donjon (pilier, vannes, forteresse retournée…) ; les étapes qui sont des checks se cochent avec eux. |
| **Journal des Bombers** | Toute la partie sur la frise des 72 heures : une barre par check, aux heures où il est faisable, regroupés par lieu ; avec l'auto-tracking, l'heure de la dernière sauvegarde (le temps écoulé est hachuré). |
| **Indices** | Les pierres à potins et les autres indices de la seed (restes des boss, Grandes Fées, banque…) : leur texte apparaît une fois l'indice marqué lu, comme en jeu. |
| **Carte** | Chaque lieu vu de dessus : sorties, checks, pierres à potins, étages des temples ; intérieurs et grottes depuis leur porte ; chemin des Bois Perdus selon le jour. |
| **Statistiques** | Chronologie de la partie (au temps de jeu de 2Ship et au moment du cycle), courbe des checks, compteurs. |
| **Configuration** | Les réglages du randomizer (repris du spoiler ou de la sauvegarde), la langue. |

Le panneau **Objets** suit l'écran de pause : restes des boss, équipement et demi-journées (temps mélangé), masques,
objets, chants et ocarina, échanges, statues de hibou et âmes (fenêtres à cocher), temples.

## Auto-tracking (facultatif)

L'appli suit votre partie en lisant la sauvegarde de 2Ship : réglages de la seed, checks faits, objets trouvés, prix des
boutiques, jour et heure du cycle, temps de jeu. Elle ne modifie jamais vos fichiers, et rien n'est envoyé.

1. Dans 2Ship, menu Enhancements › Saving : activez **Autosave** et réglez l'intervalle sur **1 minute** (le jeu
   sauvegarde aussi au Chant du temps et aux statues de hibou ; l'appli suit à chaque sauvegarde, pas à chaque check).
2. Dans l'appli, cliquez sur « Pas de suivi » en bas de la barre de gauche, puis « Choisir le dossier saves… » : le
   dossier `saves` à côté de `2ship.exe`. Chrome ou Edge seulement ; ailleurs, « Lire une sauvegarde… » après chaque
   sauvegarde du jeu.
3. Après un rechargement de la page, « Reprendre le suivi » d'un clic (le navigateur redemande l'autorisation).

Une sauvegarde d'une autre seed que la partie notée est ignorée et signalée (« Remettre à zéro et suivre »).

**En direct (Windows)** : un petit relais lit la partie dans la mémoire du jeu (lecture seule) — chaque check est coché
dès qu'il est fait, sans attendre une sauvegarde, et le Journal suit l'heure du jeu.

1. Lancez le relais : `masque-verite-relais-windows.exe` (releases du projet sur GitHub ; au premier lancement, Windows
   peut afficher « Windows a protégé votre ordinateur » : « Informations complémentaires », puis « Exécuter quand
   même »), ou double-cliquez sur `lancer-relais.bat` si [Bun](https://bun.sh) est installé. Gardez sa fenêtre ouverte.
2. Dans la fenêtre Auto-tracking de l'appli, activez « Suivi en direct ». Le relais trouve seul le jeu et son fichier de
   symboles (`debug/2ship.pdb`, livré avec 2Ship), qui lui indique où se trouve la partie dans la mémoire.

En direct, la page Carte montre aussi Link (flèche de la couleur de sa forme) et suit ses déplacements de lieu en lieu
(« Suivre Link »).

## Cartes (facultatif)

Les cartes sont tirées de **votre propre ROM** de Majora's Mask (N64, version américaine — celle que 2Ship a demandée à
l'installation ; `.z64` ou `.v64`, compressée ou non) ; elles ne sont pas fournies. Page **Carte** : choisissez votre
ROM, puis « Fabriquer les cartes ». La ROM est lue dans le navigateur, rien n'est envoyé ; les cartes sont gardées dans
ce navigateur (à refaire dans un autre navigateur, ou entre la version en ligne et la version téléchargée).

Avec l'appli téléchargée et [Node.js](https://nodejs.org) (18 ou plus), on peut aussi les fabriquer en ligne de commande
(fichier `data/maps-data.js`, qui passe avant les cartes du navigateur) :

```
node tools/2ship-maps/extract_maps.mjs <ROM de Majora's Mask>
```

**Retoucher les cartes** : sous la carte, « Exporter cette carte (PNG) » ou « Exporter toutes les cartes (.zip) » donne le
fond des lieux en images (sans les checks ni les sorties, que l'appli dessine toujours par-dessus). Modifiez-les dans le
logiciel de votre choix — sans les recadrer, ni changer leurs proportions — puis « Importer des images… » (PNG ou .zip) :
chaque image remplace le plan de son lieu (réglage « Fond : Image / Plan »). Gardez le nom des fichiers, il sert à les
reconnaître si votre logiciel efface les informations de l'image. Les images restent dans ce navigateur.

## Fenêtre de stream

Bouton « Fenêtre de stream » (barre de gauche) : une page à capturer dans OBS (« Capture de fenêtre » et filtre
d'incrustation sur le fond vert), avec des widgets à disposer librement : objets, progression, moment du cycle, carte,
indices lus, compteurs, chronologie, image, texte… Touche **E** (ou double-clic) pour l'éditeur : bibliothèque de
widgets, aimantation, calques, thèmes, plusieurs dispositions (exportables). Elle suit la fenêtre principale, qui doit
rester ouverte dans le même navigateur.

## Langues

L'interface est livrée en français et en anglais. Pour ajouter une autre langue sans toucher au code :

```
node tools/i18n/check.mjs --template=de --name=Deutsch > de.json
```

Remplissez chaque valeur vide de `de.json` (l'anglais est donné en référence), puis chargez-le dans **Configuration ›
Langue › Ajouter…**. Les textes non traduits s'affichent en anglais. Pour la livrer avec l'appli, convertissez-la en
`data/i18n/de.js` (même format que `data/i18n/en.js`) et ajoutez une ligne `<script>` dans `index.html`.

## Pour les curieux

- `SPEC.md` : le comportement détaillé de chaque page.
- `CLAUDE.md` : l'organisation du code.
- `tools/` : les outils qui génèrent les données (checks, logique des trois jours, recette des cartes) depuis les
  sources de 2Ship, et les contrôles (traductions, noms non définis).
