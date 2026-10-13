**English below.**

Relais du suivi en direct du [Masque de Vérité](https://mephidross88.github.io/masque-verite/), sans rien installer
(Windows) : il lit votre partie de 2 Ship 2 Harkinian dans la mémoire du jeu, en lecture seule — il ne peut rien y modifier.

1. Téléchargez `masque-verite-relais-windows.exe` (ci-dessous) et ouvrez-le ; gardez sa fenêtre ouverte pendant la partie.
   Au premier lancement, Windows peut afficher « Windows a protégé votre ordinateur » (fichier non signé) : « Informations
   complémentaires », puis « Exécuter quand même ».
2. Lancez 2Ship normalement. Le relais le trouve seul, ainsi que son fichier de symboles (`debug/2ship.pdb`, livré avec
   2Ship), qui lui donne l'emplacement de la partie dans la mémoire.
3. Dans l'appli : bouton Auto-tracking en bas de la barre de gauche, « Suivi en direct ». Si le navigateur demande
   l'autorisation d'accéder aux applications de cet appareil ou au réseau local, acceptez : c'est le relais, sur votre
   ordinateur.

Le relais n'accepte que l'appli (fichier local, version en ligne, `localhost`) ; pour une copie hébergée ailleurs :
`--origin=https://…`.

---

Live tracking relay for [Le Masque de Vérité](https://mephidross88.github.io/masque-verite/), nothing to install
(Windows): it reads your 2 Ship 2 Harkinian game from the game's memory, read-only — it cannot change anything.

1. Download `masque-verite-relais-windows.exe` (below) and open it; keep its window open while you play. On first launch,
   Windows may show “Windows protected your PC” (unsigned file): “More info”, then “Run anyway”.
2. Start 2Ship as usual. The relay finds it on its own, along with its symbol file (`debug/2ship.pdb`, shipped with
   2Ship), which tells it where the game data sits in memory.
3. In the app: Auto-tracking button at the bottom of the left bar, “Live tracking”. If the browser asks for permission to
   access apps on this device or on your local network, allow it: that is the relay, on your computer.

The relay only accepts the app (local file, online version, `localhost`); for a copy hosted elsewhere:
`--origin=https://…`.
