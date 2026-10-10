# The Mask of Truth

*[Version française](README.md)*

Tracker for the **2 Ship 2 Harkinian 5.0.1** randomizer (Majora's Mask): items, masks, checks, hints, and what is
doable — and when — given your items, your forms and the time of the three days. A follow-up to
[L'Œil Sheikah](https://github.com/Mephidross88/oeil-sheikah) (Ship of Harkinian). Everything runs in the browser, in
French or English (Configuration › Language).

## Running the app

**Online: https://mephidross88.github.io/masque-verite/** — nothing to install, your game is saved automatically in the
browser (recent Chrome, Edge or Firefox; auto-tracking needs Chrome or Edge).

Or download the repository (Code › Download ZIP) and open `index.html`: the same app, offline. Each version keeps its
own game; to move from one to the other: "Export or import the game" (left bar).

To start a game:
1. **Configuration** › "Import from a 2Ship spoiler…": pick your seed's spoiler log (`.json`). The settings and the
   seed's list of checks are taken; item locations stay hidden (they are only used for the text of hints, once marked
   read). With auto-tracking, no need: the settings come from the save.
2. Note your items in the **Items** panel (right; click: obtained / next level, right-click: the reverse) and your checks
   in **Checks** — or let auto-tracking do it (below).

## The pages

| Page | What for |
|---|---|
| **Checks** | The seed's checks, place by place: done, doable now, not yet — and why (missing items, time). A three-day strip per check; the **Time** selector (D1 to N3) shows what is doable at that time. |
| **Bombers' Notebook** | The whole game on the 72-hour strip: one bar per check, at the hours it is doable, grouped by place; with auto-tracking, the time of the last save (elapsed time is hatched). |
| **Hints** | Gossip stones and the seed's other hints (boss remains, Great Fairies, bank…): their text shows once the hint is marked read, as in the game. |
| **Map** | Each place seen from above: exits, checks, gossip stones, temple floors; interiors and grottos from their door. |
| **Statistics** | The game's timeline (by 2Ship's play time and time of the cycle), checks curve, counters. |
| **Configuration** | The randomizer settings (from the spoiler or the save), the language. |

The **Items** panel follows the pause screen: boss remains, equipment and half-days (shuffled time), masks, items, songs
and ocarina, trade items, owl statues and souls (checklist windows), temples.

## Auto-tracking (optional)

The app follows your game by reading 2Ship's save: the seed's settings, checks done, items found, shop prices, day and
hour of the cycle, play time. It never changes your files, and nothing is sent.

1. In 2Ship, menu Enhancements › Saving: turn on **Autosave** and set the interval to **1 minute** (the game also saves
   on the Song of Time and at owl statues; the app updates on each save, not on each check).
2. In the app, click "Not tracking" at the bottom of the left bar, then "Choose the saves folder…": the `saves` folder
   next to `2ship.exe`. Chrome or Edge only; elsewhere, use "Read a save…" after each in-game save.
3. After reloading the page, "Resume tracking" with one click (the browser asks for permission again).

A save from another seed than the tracked game is ignored and reported ("Reset and follow").

## Maps (optional)

Maps are made from **your own** Majora's Mask ROM (N64, US version — the one 2Ship asked for at installation; `.z64` or
`.v64`, compressed or not); they are not provided. **Map** page: pick your ROM, then "Make the maps". The ROM is read in
the browser, nothing is sent; maps are kept in this browser (to redo in another browser, or between the online and the
downloaded version).

With the downloaded app and [Node.js](https://nodejs.org) (18 or later), you can also make them from the command line
(file `data/maps-data.js`, which takes precedence over the browser's maps):

```
node tools/2ship-maps/extract_maps.mjs <Majora's Mask ROM>
```

## Stream window

"Stream window" button (left bar): a page to capture in OBS ("Window Capture" and a chroma key filter on the green
background), with widgets you lay out freely: items, progress, cycle time, map, hints read, counters, timeline, image,
text… Press **E** (or double-click) for the editor: widget library, snapping, layers, themes, several layouts
(exportable). It follows the main window, which must stay open in the same browser.

## Languages

The interface ships in French and English. To add another language without touching the code:

```
node tools/i18n/check.mjs --template=de --name=Deutsch > de.json
```

Fill in each empty value of `de.json` (English is given for reference), then load it in **Configuration › Language ›
Add…**. Untranslated texts show in English. To ship it with the app, convert it to `data/i18n/de.js` (same format as
`data/i18n/en.js`) and add a `<script>` line in `index.html`.

## For the curious

- `SPEC.md`: the detailed behavior of each page (in French).
- `CLAUDE.md`: how the code is organized (in French).
- `tools/`: the tools that generate the data (checks, three-day logic, map recipe) from 2Ship's sources, and the checks
  (translations, undefined names).
