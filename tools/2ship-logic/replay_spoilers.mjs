// Test du moteur de logique (js/logic.js) : rejoue des spoilers de 2Ship sphère par sphère. On part des objets de départ
// (spoiler + objets donnés d'office), puis à chaque sphère on prend tous les checks en logique et on donne leur objet
// (celui du spoiler, sinon l'objet d'origine : comme le remplissage de 2Ship). 2Ship garantit qu'une seed sans glitch se
// finit : tous les checks du spoiler doivent être atteints. Temps mélangé sans demi-journée de départ notée : 2Ship en
// tire une au sort (graine de la seed) ; on essaie les six.
// Usage : node tools/2ship-logic/replay_spoilers.mjs [dossier des spoilers] (défaut : ../randomizer à côté du dépôt)
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = process.argv[2] || path.join(ROOT, '../randomizer');
const ctx = { console, localStorage:{ getItem:() => 'fr', setItem(){} }, navigator:{ language:'fr' }, location:{}, Intl, BigInt,
  Vue:{ createApp(){}, reactive:x => x, computed:f => ({ get value(){ return f(); } }), watch(){}, ref:v => ({ value:v }), nextTick(){} } };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data/checks-data.js', 'data/logic-data.js', 'js/i18n.js', 'js/icons.js', 'js/config.js', 'js/checks.js', 'js/items.js', 'js/logic.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename:f });
const { OPT_DEFAULT, emptyState, giveItem, computeLogic, computedStartingItems, CHECKS_DATA } = vm.runInContext(
  '({ OPT_DEFAULT, emptyState, giveItem, computeLogic, computedStartingItems, CHECKS_DATA })', ctx);
const VANILLA = Object.fromEntries(CHECKS_DATA.checks.map(c => [c.id, c.item]));
VANILLA.RC_STARTING_ITEM_DEKU_MASK = 'RI_MASK_DEKU'; VANILLA.RC_STARTING_ITEM_SONG_OF_HEALING = 'RI_SONG_HEALING';

function replay(sp, clock){
  const settings = { ...OPT_DEFAULT, ...sp.options };
  const S = emptyState(settings);
  S.hearts = settings.RO_STARTING_HEALTH;
  const prices = {};
  for (const [rc, v] of Object.entries(sp.checks)) if (v && typeof v === 'object' && v.price != null) prices[rc] = v.price;
  S.price = rc => prices[rc] ?? 0;
  for (const ri of [...(sp.startingItems || []), ...computedStartingItems(settings)]) giveItem(S, ri);
  if (clock !== undefined) giveItem(S, clock);
  const got = new Set();
  let spheres = 0;
  for (;;){
    const res = computeLogic(S), fresh = Object.keys(res.checks).filter(rc => res.checks[rc].ok && !got.has(rc));
    if (!fresh.length) break;
    spheres++;
    for (const rc of fresh){
      got.add(rc);
      const v = sp.checks[rc], ri = v === undefined ? VANILLA[rc] : typeof v === 'string' ? v : v.randoItemId;
      if (ri) giveItem(S, ri);
    }
  }
  const missing = Object.keys(sp.checks).filter(rc => !got.has(rc));
  return { spheres, got:got.size, missing };
}

let fails = 0;
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort();
for (const f of files){
  const sp = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (sp.type !== '2S2H_RANDO_SPOILER') continue;
  if (sp.options.RO_LOGIC !== 0){ console.log(f, ': logique autre que « sans glitch », ignoré'); continue; }
  const hasClock = (sp.startingItems || []).some(ri => /^RI_TIME_/.test(ri));
  const tries = sp.options.RO_CLOCK_SHUFFLE && !hasClock
    ? (sp.options.RO_CLOCK_SHUFFLE_PROGRESSIVE === 0 ? ['RI_TIME_DAY_1', 'RI_TIME_NIGHT_1', 'RI_TIME_DAY_2', 'RI_TIME_NIGHT_2', 'RI_TIME_DAY_3', 'RI_TIME_NIGHT_3'] : ['RI_TIME_PROGRESSIVE'])
    : [undefined];
  const runs = tries.map(c => ({ c, ...replay(sp, c) })).sort((a, b) => a.missing.length - b.missing.length);
  const best = runs[0];
  const ok = !best.missing.length;
  if (!ok) fails++;
  console.log(`${ok ? 'OK ' : 'KO '} ${f} (${sp.commitHash}) : ${best.got} checks atteints en ${best.spheres} sphères`
    + (best.c ? ` (départ ${best.c.replace('RI_TIME_', '')})` : '') + (ok ? '' : ` — ${best.missing.length} non atteints : ${best.missing.slice(0, 12).join(' ')}`));
}
console.log(fails ? `${fails} spoiler(s) en échec` : 'Tous les spoilers sont finis par la logique.');
process.exit(fails ? 1 : 0);
