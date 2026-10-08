// Génère data/checks-data.js (window.CHECKS_DATA) depuis les sources de 2Ship (./src, fetch_sources.mjs) :
//  - scènes du tracker de checks de 2Ship (CheckTracker.cpp) : variantes regroupées (Play_GetOriginalSceneId), intérieurs
//    et grottes rattachés à la scène où l'on ressort (scenesToCheckParent), ordre du tracker (betterMapSelectIndex) ;
//  - checks (StaticData/Checks.cpp) présents dans une région de la logique : type, scène(s), drapeau, objet d'origine ;
//  - objets (StaticData/Items.cpp).
// Libellés : anglais (noms de 2Ship) et français (translate.mjs).
// Usage : node tools/2ship-checks/extract_checks.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RANDO, stripComments, parseEnum, loadChecks, loadItems, loadOptions, loadScenes, loadOriginalScenes, loadRegions, regionOrder, entranceValue } from './sources.mjs';
import { sceneFr, checkLabels, itemFr } from './translate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const COMMIT = '8a24047';
const CHECKS = loadChecks(), ITEMS = loadItems(), SCENES = loadScenes(), ORIG = loadOriginalScenes(), REGIONS = loadRegions();
const RR = regionOrder();

// --- Tracker de checks de 2Ship (CheckTracker.cpp) ---
const tracker = stripComments(fs.readFileSync(path.join(RANDO, 'CheckTracker/CheckTracker.cpp'), 'utf8'));
const toParent = new Set(/scenesToCheckParent\s*=\s*\{([^}]*)\}/.exec(tracker)[1].match(/SCENE_\w+/g));
const nameOverride = Object.fromEntries([.../sCheckTrackerSceneNameOverrides\s*=\s*\{([\s\S]*?)\};/.exec(tracker)[1]
  .matchAll(/\{\s*(SCENE_\w+),\s*"([^"]*)"\s*\}/g)].map(m => [m[1], m[2]]));
const original = sc => ORIG[sc] || sc;

// Région d'arrivée d'une entrée (Logic.cpp, GetRegionIdFromEntrance) : la région dont une sortie a cette entrée pour retour,
// ou qui la déclare comme arrivée à sens unique. Clé : numéro de l'entrée.
const entranceToRegion = new Map();
for (const r of [...REGIONS.values()].sort((a, b) => RR[a.id] - RR[b.id])){
  for (const e of r.exits) if (e.from) entranceToRegion.set(entranceValue(e.from.scene, e.from.spawn), r.id);
  for (const e of r.oneWay) entranceToRegion.set(entranceValue(e.scene, e.spawn), r.id);
}
// Scène affichée d'une région (initializeSceneChecks) : sa scène d'origine, ou pour un intérieur / une grotte celle de la
// région rejointe — la dernière sortie (table triée par numéro d'entrée ; à destination égale, la première déclarée),
// puis la dernière liaison (triée par région).
function displayScene(r){
  const sc = original(r.sceneId);
  if (!toParent.has(sc)) return sc;
  let connected = null;
  if (r.id === 'RR_LONE_PEAK_SHRINE') connected = r.id;
  else {
    const exits = new Map();
    for (const e of r.exits){ const v = entranceValue(e.to.scene, e.to.spawn); if (!exits.has(v)) exits.set(v, e); }
    for (const v of [...exits.keys()].sort((a, b) => a - b)) connected = entranceToRegion.get(v) ?? null;
    for (const [id] of [...r.connections].sort((a, b) => RR[a[0]] - RR[b[0]])) connected = id;
    if (!connected) return null;   // (le tracker ignore la région)
  }
  return REGIONS.get(connected).sceneId;   // (scène brute, comme le tracker)
}

// --- Checks : scènes où le tracker les montre (une par région qui les contient), dans l'ordre des régions ---
const checkScenes = new Map();
for (const r of [...REGIONS.values()].sort((a, b) => RR[a.id] - RR[b.id])){
  const sc = displayScene(r);
  if (!sc || sc === 'SCENE_MAX') continue;   // (région de départ : checks donnés d'office, masqués par le tracker)
  for (const [rc] of r.checks){
    if (!checkScenes.has(rc)) checkScenes.set(rc, []);
    if (!checkScenes.get(rc).includes(sc)) checkScenes.get(rc).push(sc);
  }
}
const sceneIds = [...new Set([...checkScenes.values()].flat())].sort((a, b) => SCENES.get(a).order - SCENES.get(b).order);
const scenes = sceneIds.map(id => ({ id, en:nameOverride[id] || SCENES.get(id).en, fr:sceneFr(id), num:SCENES.get(id).num }));

const labels = checkLabels([...checkScenes.keys()].map(id => ({ id, scene:checkScenes.get(id)[0], type:CHECKS.get(id).type })));
const checks = [...checkScenes.keys()].sort((a, b) =>
  sceneIds.indexOf(checkScenes.get(a)[0]) - sceneIds.indexOf(checkScenes.get(b)[0]) || a.localeCompare(b)).map(id => {
  const c = CHECKS.get(id), l = labels.get(id);
  return { id, en:l.en, fr:l.fr, type:c.type.replace(/^RCTYPE_/, ''), scene:checkScenes.get(id)[0],
    ...(checkScenes.get(id).length > 1 ? { also:checkScenes.get(id).slice(1) } : {}),
    flag:c.flagType.replace(/^FLAG_/, ''), item:c.item };
});
const items = [...ITEMS.values()].map(i => ({ id:i.id, en:i.name, fr:itemFr(i.id, i.name), type:i.type.replace(/^RITYPE_/, '') }));

// --- Options (StaticData/Options.cpp) et valeurs de leurs choix (énumérations RO_… de Types.h) ---
const types = stripComments(fs.readFileSync(path.join(RANDO, 'Types.h'), 'utf8'));
const ro = {};
for (const m of types.matchAll(/typedef enum\s*\{([^}]*)\}\s*(\w+)\s*;/g)){
  if (m[2] === 'RandoOptionId' || !/\bRO_/.test(m[1])) continue;
  Object.assign(ro, parseEnum(m[0], m[2]));
}
// constantes numériques (#define NOM 30) des sources : valeurs par défaut écrites par leur nom
const defines = {};
const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes:true })){
  const p = path.join(d, f.name);
  if (f.isDirectory()) walk(p);
  else if (/\.(h|hpp|cpp|c)$/.test(f.name)) for (const m of fs.readFileSync(p, 'utf8').matchAll(/^#define\s+(\w+)\s+\(?(\d+)\)?\s*(?:\/\/.*)?$/gm)) defines[m[1]] = Number(m[2]);
} };
walk(path.join(RANDO, '..', '..'));
const options = Object.fromEntries([...loadOptions().values()].map(o => {
  const v = /^\d+$/.test(o.def) ? Number(o.def) : ro[o.def] ?? defines[o.def];
  if (v === undefined) throw new Error('défaut inconnu : ' + o.id + ' = ' + o.def);
  return [o.id, v];
}));

// ordre des énumérations (RandoCheckId, RandoItemId, RandoOptionId de Types.h) : la sauvegarde de 2Ship range ses checks
// (randoSaveChecks), objets (randoItemId) et options (randoSaveOptions) par leur numéro
const enumOrder = name => Object.entries(parseEnum(types, name)).sort((a, b) => a[1] - b[1]).map(([k]) => k);
const order = { rc:enumOrder('RandoCheckId'), ri:enumOrder('RandoItemId'), ro:enumOrder('RandoOptionId') };

const out = `/* FICHIER GÉNÉRÉ par tools/2ship-checks/extract_checks.mjs depuis les sources de 2 Ship 2 Harkinian (commit ${COMMIT}) :
   ne pas modifier à la main (libellés français : tools/2ship-checks/translate.mjs). Voir SPEC.md > Checks.
   scenes  : scènes du tracker de checks de 2Ship, dans son ordre { id, en, fr, num }
   checks  : { id, en, fr, type (RCTYPE_…), scene (scène affichée), also (autres scènes), flag (FLAG_… : CYCL_… remis à
             zéro par le Chant du temps), item (objet d'origine) }
   items   : { id, en, fr, type (RITYPE_…) }
   options : options du randomizer (RO_…) et leur valeur par défaut ; ro : valeurs de leurs choix (RO_GENERIC_ON…)
   order   : noms des énumérations dans l'ordre de leurs numéros (rc : checks, ri : objets, ro : options), pour la sauvegarde */
window.CHECKS_DATA = {
scenes:${JSON.stringify(scenes)},
checks:[
${checks.map(c => JSON.stringify(c)).join(',\n')}
],
items:[
${items.map(i => JSON.stringify(i)).join(',\n')}
],
options:${JSON.stringify(options)},
ro:${JSON.stringify(ro)},
order:${JSON.stringify(order)}};
`;
fs.writeFileSync(path.join(ROOT, 'data/checks-data.js'), out);
console.log(`${scenes.length} scènes, ${checks.length} checks, ${items.length} objets, ${Object.keys(options).length} options → data/checks-data.js`);
