/* Cartes de la page Carte en ligne de commande : la même fabrication que dans l'appli (js/maps-extract.js, ici dans un
   bac à sable), depuis la ROM de Majora's Mask de l'utilisateur (hors dépôt) → data/maps-data.js (généré, non versionné :
   tiré de la ROM ; s'il est présent, il passe avant les cartes fabriquées dans le navigateur).
   Usage : node tools/2ship-maps/extract_maps.mjs <ROM de Majora's Mask> */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const romPath = process.argv[2];
if (!romPath){ console.error('Usage : node tools/2ship-maps/extract_maps.mjs <ROM de Majora\'s Mask>'); process.exit(1); }
const ctx = { window:{}, console, setTimeout };
vm.createContext(ctx);
for (const f of ['data/maps-recipe.js', 'js/maps-extract.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename:f });
const t0 = Date.now();
const { data, stats } = await ctx.extractMaps({ rom:new Uint8Array(fs.readFileSync(romPath)), recipe:ctx.window.MAPS_RECIPE });
const out = `/* FICHIER GÉNÉRÉ par tools/2ship-maps/extract_maps.mjs depuis la ROM de l'utilisateur : ne pas versionner ni publier.
   Format : voir l'en-tête de js/maps-extract.js. */
window.MAPS_DATA = ${JSON.stringify(data)};
`;
fs.writeFileSync(path.join(ROOT, 'data/maps-data.js'), out);
console.log(`${stats.scenes} scènes, ${stats.floors} triangles de sol, ${stats.exits} sorties → data/maps-data.js (${Math.round(out.length / 1024)} Ko, ${Date.now() - t0} ms)`);
