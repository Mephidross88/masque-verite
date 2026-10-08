// Génère data/logic-data.js (window.LOGIC_DATA) depuis la logique de 2Ship (Rando/Logic/Regions/*.cpp, Logic.cpp) :
// régions avec leurs checks, sorties (résolues en région d'arrivée), liaisons, événements et restrictions d'attente
// (STAY), conditions converties en fonctions JS sur le contexte global L (js/logic.js), et les 45 tranches horaires.
// Sources : tools/2ship-checks/fetch_sources.mjs. Usage : node tools/2ship-logic/extract_logic.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RANDO, stripComments, parseEnum, loadRegions, regionOrder, entranceValue } from '../2ship-checks/sources.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const COMMIT = '8a24047';
const REGIONS = loadRegions(), RR = regionOrder();
const logicH = stripComments(fs.readFileSync(path.join(RANDO, 'Logic/Logic.h'), 'utf8'));
const SLICE = parseEnum(logicH, 'TimeSlice');
const SLICES = Object.keys(SLICE).sort((a, b) => SLICE[a] - SLICE[b]);
if (SLICES.length !== 45) throw new Error('tranches horaires : ' + SLICES.length);
const types = stripComments(fs.readFileSync(path.join(RANDO, 'Types.h'), 'utf8'));
const RO_VALUES = {};
for (const m of types.matchAll(/typedef enum\s*\{([^}]*)\}\s*(\w+)\s*;/g))
  if (m[2] !== 'RandoOptionId' && /\bRO_/.test(m[1])) Object.assign(RO_VALUES, parseEnum(m[0], m[2]));

// valeurs d'équipement (z64item.h : EQUIP_VALUE_SWORD_KOKIRI = 1…), comparées en nombres dans les conditions
const EQUIP = {};
for (const m of fs.readFileSync(path.join(RANDO, '../../include/z64item.h'), 'utf8').matchAll(/\/\*\s*(\d+)\s*\*\/\s*(EQUIP_VALUE_\w+)/g)) EQUIP[m[2]] = Number(m[1]);
if (EQUIP.EQUIP_VALUE_SHIELD_MIRROR !== 2 || EQUIP.EQUIP_VALUE_SWORD_KOKIRI !== 1) throw new Error('EQUIP_VALUE : ' + JSON.stringify(EQUIP));

// macros locales des fichiers de régions (#define NOM (expression)) : converties comme les conditions
const LOCAL = {};
for (const f of fs.readdirSync(path.join(RANDO, 'Logic/Regions'))){
  const s = stripComments(fs.readFileSync(path.join(RANDO, 'Logic/Regions', f), 'utf8')).replace(/\\\n/g, ' ');
  for (const m of s.matchAll(/^#define\s+([A-Z_][A-Z0-9_]*)\s+(.+)$/gm)) LOCAL[m[1]] = m[2].trim();
}

/* Condition C++ → expression JS :
   - tranches TIME_… → numéro ; valeurs d'options (RO_GENERIC_ON…) → nombre ; identifiants d'option RO_… → chaîne ;
   - constantes du jeu (RC_, RE_, ITEM_, ACTOR_, OCARINA_SONG_, QUEST_, RANDO_INF_, SCENE_, OWL_WARP_, EQUIP_, DUNGEON_,
     WEEKEVENTREG_, UPG_) et arguments collés par les macros (CAN_PLAY_SONG(SONATA)…) → chaîne ;
   - le reste (macros, fonctions, tableaux) → L.NOM. */
const CONST = /^(RC|RE|ITEM|ACTOR|OCARINA_SONG|QUEST|RANDO_INF|SCENE|OWL_WARP|EQUIP_TYPE|EQUIP_VALUE|DUNGEON_SCENE_INDEX|DUNGEON|WEEKEVENTREG|UPG)_/;
const PASTE = new Set(['CAN_PLAY_SONG', 'CAN_USE_ABILITY', 'CAN_USE_MAGIC_ARROW', 'CAN_ACCESS', 'KEY_COUNT']);
const used = new Set();
function toJS(expr){
  const src = expr.replace(/\bRando::Logic::/g, '').replace(/\s+/g, ' ').trim();
  let out = '', prev = '';
  for (const m of src.matchAll(/([A-Za-z_][A-Za-z0-9_]*)|(\d+)|('(?:[^'\\]|\\.)*')|(\s+)|(.)/g)){
    const [tok, id] = m;
    if (!id){ out += tok; if (!/^\s+$/.test(tok)) prev = tok; continue; }
    let r;
    if (id === 'true' || id === 'false') r = id;
    else if (id in SLICE) r = String(SLICE[id]);
    else if (id in RO_VALUES) r = String(RO_VALUES[id]);
    else if (id in EQUIP) r = String(EQUIP[id]);
    else if (/^RO_/.test(id) || CONST.test(id) || (prev === '(' && PASTE.has(lastCall(out)))) r = "'" + id + "'";
    else { r = 'L.' + id; used.add(id); }
    out += r; prev = id;
  }
  return out;
}
// nom de la fonction dont la parenthèse ouvrante termine `s` (« L.CAN_PLAY_SONG( » → CAN_PLAY_SONG)
function lastCall(s){ const m = /L\.([A-Za-z_]\w*)\($/.exec(s); return m ? m[1] : ''; }
const fn = expr => { const js = toJS(expr); return js === 'true' ? 'T' : '()=>' + (/^[\w.'"]+$/.test(js) ? js : '(' + js + ')'); };

// Région d'arrivée d'une entrée (Logic.cpp, GetRegionIdFromEntrance) : inconnue → RR_MAX
const entranceToRegion = new Map();
for (const r of [...REGIONS.values()].sort((a, b) => RR[a.id] - RR[b.id])){
  for (const e of r.exits) if (e.from) entranceToRegion.set(entranceValue(e.from.scene, e.from.spawn), r.id);
  for (const e of r.oneWay) entranceToRegion.set(entranceValue(e.scene, e.spawn), r.id);
}
const regions = [...REGIONS.values()].sort((a, b) => RR[a.id] - RR[b.id]).map(r => {
  // sorties : table de 2Ship indexée par l'entrée de destination (à clé égale, la première déclarée), parcourue dans l'ordre
  const exits = new Map();
  for (const e of r.exits){ const v = entranceValue(e.to.scene, e.to.spawn); if (!exits.has(v)) exits.set(v, e); }
  const ex = [...exits.keys()].sort((a, b) => a - b).map(v => [entranceToRegion.get(v) || 'RR_MAX', fn(exits.get(v).cond)]);
  const cn = [...r.connections].sort((a, b) => RR[a[0]] - RR[b[0]]).map(([id, c]) => [id, fn(c)]);
  // checks (table indexée par check : à clé égale, la première déclarée) ; événements dans l'ordre ; attente par tranche
  const ck = new Map(); for (const [id, c] of r.checks) if (!ck.has(id)) ck.set(id, fn(c));
  const st = new Map(); for (const [sl, c] of r.stay) if (!st.has(sl)) st.set(SLICE[sl], fn(c));
  return { id:r.id, scene:r.sceneId, name:r.name, checks:[...ck], exits:ex, conns:cn, events:r.events.map(([e, c]) => [e, fn(c)]),
    stay:[...st], wait:r.canStayOverTime };
});
const locals = Object.entries(LOCAL).map(([k, v]) => '  ' + k + ':' + fn(v));

// CanKillEnemy (Logic.h) : condition de chaque ennemi (cas groupés), sans le test d'âme (fait par L.CanKillEnemy)
const ckBody = (() => { const a = logicH.indexOf('inline bool CanKillEnemy('); return logicH.slice(logicH.indexOf('switch', a), logicH.indexOf('default:', a)); })();
const kill = [];
for (const m of ckBody.matchAll(/((?:case\s+ACTOR_\w+\s*:\s*)+)return\s+([\s\S]*?);/g))
  for (const a of m[1].match(/ACTOR_\w+/g)) kill.push([a, fn(m[2])]);
if (kill.length < 50) throw new Error('CanKillEnemy : ' + kill.length + ' ennemis');
// âme de chaque ennemi (ActorBehavior/Souls.cpp, enemySoulMap) ; ennemi sans âme : toujours tuable
const souls = fs.readFileSync(path.join(RANDO, 'ActorBehavior/Souls.cpp'), 'utf8');
const soulMap = Object.fromEntries([...souls.matchAll(/\{\s*(ACTOR_\w+),\s*(RI_SOUL_ENEMY_\w+)\s*\}/g)].map(m => [m[1], m[2]]));
if (Object.keys(soulMap).length < 50) throw new Error('enemySoulMap : ' + Object.keys(soulMap).length);

const q = JSON.stringify;
const out = `/* FICHIER GÉNÉRÉ par tools/2ship-logic/extract_logic.mjs depuis la logique de 2 Ship 2 Harkinian (commit ${COMMIT}) :
   ne pas modifier à la main. Conditions : fonctions sur le contexte global L (js/logic.js) ; T = toujours vrai.
   regions : [{ id, scene, name, checks:[[RC, f]], exits:[[région d'arrivée, f]], conns:[[RR, f]], events:[[RE, f]],
             stay:[[tranche, f]] (attente au-delà de cette tranche), wait (attente possible) }] dans l'ordre de RandoRegionId
   slices : les 45 tranches horaires (TimeSlice de Logic.h) ; locals : macros locales des fichiers de régions
   kill : condition pour vaincre chaque ennemi (CanKillEnemy, sans l'âme) ; souls : âme de chaque ennemi (Souls.cpp) */
(() => {
const T = () => true;
window.LOGIC_DATA = {
slices:${q(SLICES)},
locals:{
${locals.join(',\n')}
},
kill:{
${kill.map(([k, f]) => '  ' + k + ':' + f).join(',\n')}
},
souls:${q(soulMap)},
regions:[
${regions.map(r => `{id:${q(r.id)},scene:${q(r.scene)},name:${q(r.name)},wait:${r.wait},
 checks:[${r.checks.map(([k, f]) => `[${q(k)},${f}]`).join(',')}],
 exits:[${r.exits.map(([k, f]) => `[${q(k)},${f}]`).join(',')}],
 conns:[${r.conns.map(([k, f]) => `[${q(k)},${f}]`).join(',')}],
 events:[${r.events.map(([k, f]) => `[${q(k)},${f}]`).join(',')}],
 stay:[${r.stay.map(([k, f]) => `[${k},${f}]`).join(',')}]}`).join(',\n')}
]};
})();
`;
fs.writeFileSync(path.join(ROOT, 'data/logic-data.js'), out);
console.log(`${regions.length} régions → data/logic-data.js ; macros et fonctions utilisées (à fournir par L) :`);
console.log([...used].sort().join(' '));
