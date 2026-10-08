# The Mask of Truth

*[Version française](README.md)*

Tracker for the **2 Ship 2 Harkinian 5.0.1** randomizer (Majora's Mask): items, masks, checks, hints, and
what you can do — and when — based on your forms and the time of the three days. A follow-up to
[L'Œil Sheikah](https://github.com/Mephidross88/oeil-sheikah) (Ship of Harkinian). Everything runs in the browser, in
French or English (Settings › Language).

**Under construction**: the app shell is in place, pages arrive step by step (see `SPEC.md` › Étapes).

## Running the app
Download the repository and open `index.html` in a recent browser (Chrome, Edge, Firefox). Your game is saved
automatically in the browser.

## Map
The Map page shows every place seen from above, with its exits. The maps are made once from your Majora's Mask ROM (N64,
US version, the one 2Ship asked for at install): choose it on the Map page; it is read in the browser and nothing is sent.

## Auto-tracking
The app follows your game by reading 2Ship's save: checks done, items found, shop prices, day and hour of the cycle. It
never changes your files.
1. In 2Ship, menu Enhancements › Saving: turn on **Autosave** and set the interval to **1 minute** (the game also saves
   on the Song of Time and at owl statues; the app updates on each save, not on each check).
2. In the app, click "Not tracking" at the bottom of the left bar, then "Choose the saves folder…": the `saves` folder
   next to `2ship.exe`. Chrome or Edge only; elsewhere, use "Read a save…" after each in-game save.
3. After reloading the page, "Resume tracking" with one click (the browser asks for permission again).

