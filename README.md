# Le Masque de Vérité

*[English version](README.en.md)*

Tracker pour le randomizer de **2 Ship 2 Harkinian 5.0.1** (Majora's Mask) : objets, masques, checks,
indices, et ce qui est faisable — et quand — selon vos formes et le moment des trois jours. Dans la continuité de
[L'Œil Sheikah](https://github.com/Mephidross88/oeil-sheikah) (Ship of Harkinian). Tout se passe dans le navigateur, en
français ou en anglais (Configuration › Langue).

**En construction** : la coque de l'appli est en place, les pages arrivent étape par étape (voir `SPEC.md` › Étapes).

## Lancer l'appli
Téléchargez le dépôt et ouvrez `index.html` dans un navigateur récent (Chrome, Edge, Firefox). La partie est
sauvegardée automatiquement dans le navigateur.

## Auto-tracking
L'appli suit votre partie en lisant la sauvegarde de 2Ship : checks faits, objets trouvés, prix des boutiques, jour et
heure du cycle. Elle ne modifie jamais vos fichiers.
1. Dans 2Ship, menu Enhancements › Saving : activez **Autosave** et réglez l'intervalle sur **1 minute** (le jeu
   sauvegarde aussi au Chant du temps et aux statues de hibou ; l'appli suit à chaque sauvegarde, pas à chaque check).
2. Dans l'appli, cliquez sur « Pas de suivi » en bas de la barre de gauche, puis « Choisir le dossier saves… » : le
   dossier `saves` à côté de `2ship.exe`. Chrome ou Edge seulement ; ailleurs, « Lire une sauvegarde… » après chaque
   sauvegarde du jeu.
3. Après un rechargement de la page, « Reprendre le suivi » d'un clic (le navigateur redemande l'autorisation).
