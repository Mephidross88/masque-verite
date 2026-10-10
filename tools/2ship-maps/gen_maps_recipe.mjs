/* Recette des cartes (page Carte) : data/maps-recipe.js, tiré des sources de 2Ship (tools/2ship-checks/src, voir
   fetch_sources.mjs) — rien de la ROM. Lu par js/maps-extract.js, qui fabrique les cartes depuis la ROM du joueur.
   Usage : node tools/2ship-maps/gen_maps_recipe.mjs
   Contenu :
   - scenes : une entrée par scène de la table des scènes (index = numéro de la scène, null : entrée vide) :
              [SCENE_…, numéro d'EntranceSceneId (scène d'arrivée des entrées), nom français, nom anglais de 2Ship]
   - actors : numéro d'acteur → nom (ACTOR_…), pour reconnaître les acteurs des salles (checks, portes)
   - variants : scène d'origine → ses variantes (Marais purifié, printemps…), qui partagent ses checks (z_play.c)
   - loc : où trouver l'acteur de chaque check dans les salles (règles tirées de Rando/ActorBehavior/*.cpp, comme 2Ship
     relie ses acteurs à ses checks), { RC: règle } :
       ['i', scène, salle, n, acteur?]  n-ième acteur de la liste de la salle (tables { scène, salle, n } de 2Ship)
       ['c', scène, drapeau]            coffre ou Skulltula d'or : drapeau de coffre (paramètres de l'acteur)
       ['k', scène, drapeau]            drapeau d'objet (« collectible » : objets posés, pots, fées perdues)
       ['s', scène, drapeau]            drapeau d'interrupteur (fées perdues)
       ['g', scène, salle, n]           n-ième brin d'herbe des touffes (Obj_Grass_Unit) de la salle
       ['a', scène, ACTOR_… | [ACTOR_…]] acteur du personnage ou de l'objet (fichier ActorBehavior qui gère le check ;
                                        PNJ : acteur dont le code lève le drapeau d'événement du check ; boutiques : le
                                        marchand, qui fait apparaître les articles), le premier présent dans la scène
       ['r', scène, salle, ACTOR_…]     premier acteur de ce type dans la salle (coffre des grottes à coffre)
   - grottos : grotte selon ses « données de réapparition » (trou de grotte, Door_Ana) { données: RC_…_GROTTO }, pour les
     grottes qui partagent une salle (chestGrottoMap, cowGrottoMap d'ObjGrass.cpp)
   - exact : checks à règle 'a' dont la position est sûre (statues de hibou, objets fixes) ; les autres règles 'a' (PNJ…)
     donnent une position approchée
   - spawners : acteurs qui en font apparaître un autre { ACTOR_…: [ACTOR_…] } (code des acteurs : Actor_Spawn…), pour
     un acteur absent des salles (créé en cours de partie) : la place de celui qui le crée
   - alt : check voisin de la même famille { RC: RC } (rubis d'un même Guay, articles d'une boutique…) : sa position, à
     défaut de la sienne
   - cs : checks de chaque scène du jeu { SCENE_…: [RC, …] } (Checks.cpp), pour le placement à la main sur la Carte
   - manual : positions placées à la main sur la Carte { RC: [scène, x, y, z] } (tools/2ship-maps/positions-manuelles.json,
     exporté par la Carte ; des coordonnées du jeu, rien de la ROM) — elles passent avant les positions calculées */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { read, RANDO, parseEnum, loadScenes, loadChecks, loadOriginalScenes, stripComments } from '../2ship-checks/sources.mjs';
import { SCENE_FR } from '../2ship-checks/translate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMMIT = '8a24047';

// noms français des scènes sans check propre (intérieurs, variantes) ; les autres : SCENE_FR (libellés de la page Checks)
const SCENE_FR_MORE = {
  SCENE_20SICHITAI2:'Marais du Sud (purifié)', SCENE_SPOT00:'Scène cinématique', SCENE_WITCH_SHOP:'Boutique de Potions des Sorcières',
  SCENE_AYASHIISHOP:'Bazar', SCENE_OMOYA:'Maison de Romani et étable', SCENE_BOWLING:'Manège des Amoureux',
  SCENE_SONCHONOIE:'Résidence du Maire', SCENE_MILK_BAR:'Lactel', SCENE_TAKARAYA:'Chasse au Trésor',
  SCENE_INISIE_R:'Temple de la Forteresse de Pierre (inversé)', SCENE_OPENINGDAN:'Avant Bourg-Clocher',
  SCENE_SYATEKI_MIZU:'Stand de Tir de Bourg-Clocher', SCENE_SYATEKI_MORI:'Stand de Tir des Marais', SCENE_YOUSEI_IZUMI:'Fontaines des Fées',
  SCENE_KAJIYA:'Forgeron de la Montagne', SCENE_POSTHOUSE:'Bureau de Poste', SCENE_LABO:'Labo de Recherche Océanique',
  SCENE_8ITEMSHOP:'Troc en Trop', SCENE_TAKARAKUJI:'Loterie', SCENE_FISHERMAN:'Hutte du Pêcheur', SCENE_GORONSHOP:'Boutique Goron',
  SCENE_F01_B:'Course pour Chiens', SCENE_F01C:'Hutte des Cocottes', SCENE_11GORONNOSATO2:'Village Goron (printemps)',
  SCENE_BANDROOM:'Loges du Théâtre des Zoras', SCENE_TOUGITES:'Hutte des Fantômes', SCENE_DOUJOU:'Ecole du Maître d’armes',
  SCENE_MUSICHOUSE:'Moulin à Musique', SCENE_MAP_SHOP:'Office du Tourisme', SCENE_F41:'Forteresse de Pierre (inversée)',
  SCENE_10YUKIYAMANOMURA2:'Village dans la Montagne (printemps)', SCENE_17SETUGEN2:'Chemin du Village Goron (printemps)',
  SCENE_YADOYA:'Auberge de Bourg-Clocher', SCENE_KONPEKI_ENT:'Grande Baie (cinématique)', SCENE_INSIDETOWER:'Intérieur de la Tour de l’Horloge',
  SCENE_LOST_WOODS:'Bois Perdus (début)', SCENE_BOMYA:'Boutique de Bombes', SCENE_KYOJINNOMA:'Chambre des Géants',
};

const ENTR = parseEnum(read('include/z64scene.h'), 'EntranceSceneId');
const scenes = [];
for (const s of loadScenes().values()){
  const fr = SCENE_FR[s.id] || SCENE_FR_MORE[s.id];
  if (!fr) throw new Error('scène sans nom français : ' + s.id + ' (' + s.en + ')');
  const e = ENTR['ENTR_SCENE_' + s.entrance];
  if (e === undefined) throw new Error('EntranceSceneId inconnu : ' + s.entrance);
  scenes[s.num] = [s.id, e, fr, s.en];
}
for (let i = 0; i < scenes.length; i++) if (!scenes[i]) scenes[i] = null;

const actors = [];
let n = 0;
for (const line of read('include/tables/actor_table.h').split('\n')){
  const m = /^\/\* 0x(\w+) \*\/ DEFINE_ACTOR(?:_INTERNAL|_UNSET)?\(\s*(?:\w+\s*,\s*)?(ACTOR_\w+)/.exec(line.trim());
  if (!m) continue;
  if (parseInt(m[1], 16) !== n) throw new Error('actor_table.h : numéro ' + m[1] + ' attendu ' + n);
  actors[n++] = m[2];
}
if (actors.length < 600) throw new Error('acteurs : ' + actors.length);
const ACTOR_SET = new Set(actors);

const variants = {};
for (const [v, o] of Object.entries(loadOriginalScenes())) (variants[o] = variants[o] || []).push(v);

/* ---------- Où trouver les checks ---------- */
const CHECKS = loadChecks();
const RC_ORDER = Object.entries(parseEnum(fs.readFileSync(path.join(RANDO, 'Types.h'), 'utf8'), 'RandoCheckId')).sort((a, b) => a[1] - b[1]).map(([k]) => k);
const num = x => /^(0x[0-9a-f]+|\d+)$/i.test(String(x).trim()) ? Number(String(x).trim()) : null;
const loc = {};
const set = (rc, rule) => { if (CHECKS.has(rc) && !loc[rc]) loc[rc] = rule; };
// famille d'un check : son identifiant sans le numéro final (RC_…_GRASS_03 → RC_…_GRASS)
const family = rc => rc.replace(/_\d+$/, '');
// checks d'une même famille qui suivent rc (ordre de RandoCheckId), jusqu'à count (ou tant que la famille continue)
function following(rc, count){
  const out = [], i0 = RC_ORDER.indexOf(rc);
  for (let i = i0 + 1; i < RC_ORDER.length && (count == null || out.length < count - 1); i++){
    if (family(RC_ORDER[i]) !== family(rc) || loc[RC_ORDER[i]]) break;
    out.push(RC_ORDER[i]);
  }
  return out;
}
const AB = path.join(RANDO, 'ActorBehavior');
const files = fs.readdirSync(AB).filter(f => f.endsWith('.cpp')).sort();
// tables de 2Ship : { { [ACTOR_…,] SCENE_…, salle, n }, RC } ou { …, { RC, nombre } } ; touffes d'herbe { { SCENE_…, salle }, { groupes, RC } }
const ROOM_GRASS = [];
// une entrée = un acteur qui en fait apparaître plusieurs (checks de suite de la même famille) : anneaux d'herbe, objets
// cachés (un point invisible, En_Hit_Tag…, qui libère plusieurs objets : Objet caché 1, 2, 3)
const SPAWNER_MAPS = /objMure2GrassMap|keatonGrassMap|enWonderItemMap/;
const SPAWNED = [];
const grottos = {};   // (après toutes les entrées : une suite s'arrête au check suivant qui a sa propre entrée)
for (const f of files){
  const s = stripComments(fs.readFileSync(path.join(AB, f), 'utf8'));
  for (const m of s.matchAll(/(\w+)\s*=\s*\{([\s\S]*?)\n\s*\};/g)){
    const name = m[1], body = m[2], spawner = SPAWNER_MAPS.test(name);
    for (const e of body.matchAll(/\{\s*\{\s*(?:(ACTOR_\w+)\s*,\s*)?(SCENE_\w+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\}\s*,\s*(?:\{\s*(RC_\w+)\s*,\s*(\d+)\s*\}|(RC_\w+))\s*\}/g)){
      const [, actor, scene, room, idx, rcN, count, rc1] = e, rc = rcN || rc1, rule = ['i', scene, +room, +idx, actor || 0];
      set(rc, rule);
      if (rcN) SPAWNED.push([rc, +count, rule]);
      else if (spawner) SPAWNED.push([rc, null, rule]);
    }
    for (const e of body.matchAll(/\{\s*\{\s*(SCENE_\w+)\s*,\s*(\d+)\s*\}\s*,\s*\{\s*(\d+)\s*,\s*(RC_\w+)\s*\}\s*\}/g)) ROOM_GRASS.push([e[1], +e[2], e[4]]);
  }
}
/* Même acteur, autre check selon l'entrée empruntée : « if (randoCheckId == X && …) { randoCheckId = Y; » (ObjComb.cpp : la
   ruche de la salle des grottes aux vaches, commune à la Plage de la Grande Baie et à la Plaine Termina) → Y à la place de X
   (alias : l'appli s'en sert aussi pour des cartes fabriquées avant). */
const alias = {};
for (const f of files){
  const s = stripComments(fs.readFileSync(path.join(AB, f), 'utf8'));
  for (const m of s.matchAll(/randoCheckId\s*==\s*(RC_\w+)\s*&&[^{;]*\{\s*randoCheckId\s*=\s*(RC_\w+)\s*;/g))
    if (loc[m[1]] && CHECKS.has(m[2])){ set(m[2], loc[m[1]]); alias[m[2]] = m[1]; }
}
/* Grottes (SCENE_KAKUSIANA) : une salle pour toutes les grottes à coffre (salle 4) et une pour les grottes à vache (salle
   10) ; 2Ship reconnaît la grotte à son entrée (données de réapparition) : tables chestGrottoMap (herbe de base de la
   grotte), chestGrottoActorIdsToBaseRc (n-ième acteur de la salle → décalage depuis l'herbe de base), cowGrottoMap
   (touffes de la salle). Anneaux d'herbe de Keaton : keatonGrassMap (acteur de l'anneau → herbe de base, objet caché). */
{
  const g = stripComments(fs.readFileSync(path.join(AB, 'ObjGrass.cpp'), 'utf8'));
  const block = name => { const m = new RegExp(name + '[^=]*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};').exec(g); if (!m) throw new Error('ObjGrass.cpp : ' + name); return m[1]; };
  const offsets = /chestGrottoActorIdsToBaseRc\[\d+\]\s*=\s*\{([^}]*)\}/.exec(g)[1].split(',').map(x => Number(x.trim()));
  if (offsets.some(isNaN)) throw new Error('chestGrottoActorIdsToBaseRc');
  const KAK = 'SCENE_KAKUSIANA';
  for (const e of block('chestGrottoMap').matchAll(/\{\s*(-?\d+)\s*,\s*(RC_\w+)\s*\}/g)){
    const base = e[2], i0 = RC_ORDER.indexOf(base);
    offsets.forEach((off, n) => { if (off >= 0) set(RC_ORDER[i0 + off], ['i', KAK, 4, n, 'ACTOR_EN_KUSA']); });
    // coffre de la grotte (même nom de grotte) : créé dans la salle commune par En_Torch, selon la grotte
    const grotto = base.replace(/_GRASS_\d+$/, '');
    for (const c of CHECKS.values()) if (c.id.startsWith(grotto) && c.type === 'RCTYPE_CHEST') set(c.id, ['r', KAK, 4, 'ACTOR_EN_TORCH']);
  }
  for (const e of block('chestGrottoMap').matchAll(/\{\s*(-?\d+)\s*,\s*(RC_\w+)\s*\}/g)) grottos[e[1]] = e[2].replace(/_GRASS_\d+$/, '');
  for (const e of block('cowGrottoMap').matchAll(/\{\s*(-?\d+)\s*,\s*\{\s*\d+\s*,\s*(RC_\w+)\s*\}\s*\}/g)) grottos[e[1]] = e[2].replace(/_GRASS_\d+$/, '');
  for (const e of block('cowGrottoMap').matchAll(/\{\s*(-?\d+)\s*,\s*\{\s*(\d+)\s*,\s*(RC_\w+)\s*\}\s*\}/g)) ROOM_GRASS.push([KAK, 10, e[3]]);
  for (const e of block('keatonGrassMap').matchAll(/\{\s*\{\s*(SCENE_\w+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\}\s*,\s*\{\s*(RC_\w+)\s*,\s*(RC_\w+)\s*\}\s*\}/g)){
    const rule = ['i', e[1], +e[2], +e[3], 'ACTOR_EN_KUSA2'];
    set(e[4], rule); set(e[5], rule); SPAWNED.push([e[4], null, rule]);
  }
}
for (const [rc, count, rule] of SPAWNED) following(rc, count).forEach(x => set(x, rule));
// brins des touffes d'herbe : à partir du check de base, dans l'ordre (n-ième brin de la salle)
// (toutes les bases d'abord : une salle s'arrête à la base de la suivante)
for (const [scene, room, base] of ROOM_GRASS) if (CHECKS.has(base)) set(base, ['g', scene, room, 0]);
for (const [scene, room, base] of ROOM_GRASS) if (CHECKS.has(base)) following(base).forEach((x, i) => set(x, ['g', scene, room, i + 1]));
// objets cachés libérés par un acteur cité dans WonderItems.cpp (pas un fichier d'acteur) : la fresque du mur de la Plaine
// (En_Gakufu, un objet par heure de la partition), le gong de l'École d'escrime (Obj_Dora)
for (const c of CHECKS.values()){
  if (/^RC_TERMINA_FIELD_WALL_WONDER_ITEM_\d+$/.test(c.id)) set(c.id, ['a', c.scene, 'ACTOR_EN_GAKUFU']);
  if (c.id === 'RC_SWORDSMAN_SCHOOL_WONDER_ITEM') set(c.id, ['a', c.scene, 'ACTOR_OBJ_DORA']);
}
// drapeaux : coffres et jetons de Skulltula (drapeau de coffre), objets (drapeau d'objet), fées perdues (interrupteur)
const FLAG_RULE = { FLAG_CYCL_SCENE_CHEST:'c', FLAG_CYCL_SCENE_COLLECTIBLE:'k', FLAG_CYCL_SCENE_SWITCH:'s' };
for (const c of CHECKS.values()){
  const k = FLAG_RULE[c.flagType], f = num(c.flag);
  if (k && f != null) set(c.id, [k, c.scene, f]);
}
// personnages et objets : acteur du fichier ActorBehavior qui cite le check (EnAkindonuts.cpp → ACTOR_EN_AKINDONUTS)
const actorOf = f => {
  const base = f.replace(/\.cpp$/, '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
  for (const c of ['ACTOR_' + base, 'ACTOR_' + base.replace(/(\D)(\d+)$/, '$1_$2')]) if (ACTOR_SET.has(c)) return c;
  return null;
};
for (const f of files){
  const actor = actorOf(f);
  if (!actor) continue;
  const s = stripComments(fs.readFileSync(path.join(AB, f), 'utf8'));
  for (const m of s.matchAll(/\b(RC_\w+)\b/g)){ const c = CHECKS.get(m[1]); if (c) set(m[1], ['a', c.scene, actor]); }
}
/* Code des acteurs (src/src/overlays/actors, voir fetch_sources.mjs) : drapeaux d'événement levés (SET_WEEKEVENTREG) et
   acteurs qu'ils font apparaître (Actor_Spawn…). Dossier ovl_En_Al → ACTOR_EN_AL. */
const OVL = path.join(RANDO, '..', '..', 'src', 'overlays', 'actors');
const weekSetters = {}, spawnsOf = {};
// drapeaux d'événement par valeur (z64save.h : un même drapeau a un nom brut, WEEKEVENTREG_57_04, et souvent un nom
// parlant dans le code du jeu)
const WEEK = {};
for (const m of read('include/z64save.h').matchAll(/#define\s+(WEEKEVENTREG_\w+)\s+PACK_WEEKEVENTREG_FLAG\(\s*(\d+)\s*,\s*(0x[0-9a-fA-F]+)\s*\)/g))
  WEEK[m[1]] = (Number(m[2]) << 8) | Number(m[3]);
for (const d of fs.readdirSync(OVL)){
  const actor = 'ACTOR_' + d.replace(/^ovl_/, '').toUpperCase();
  if (!ACTOR_SET.has(actor)) continue;
  for (const file of fs.readdirSync(path.join(OVL, d)).filter(x => x.endsWith('.c'))){
    const code = stripComments(fs.readFileSync(path.join(OVL, d, file), 'utf8'));
    for (const m of code.matchAll(/SET_WEEKEVENTREG\(\s*(WEEKEVENTREG_\w+)\s*\)/g)){
      const v = WEEK[m[1]] ?? m[1];
      (weekSetters[v] = weekSetters[v] || new Set()).add(actor);
    }
    for (const m of code.matchAll(/Actor_Spawn\w*\([^;]*?\b(ACTOR_\w+)/g)) if (m[1] !== actor && ACTOR_SET.has(m[1])) (spawnsOf[m[1]] = spawnsOf[m[1]] || new Set()).add(actor);
  }
}
for (const c of CHECKS.values()){
  // PNJ et autres checks à drapeau d'événement : l'acteur qui lève ce drapeau
  const wv = WEEK[c.flag] ?? c.flag;
  if (c.flagType === 'FLAG_WEEK_EVENT_REG' && weekSetters[wv]) set(c.id, ['a', c.scene, [...weekSetters[wv]]]);
  // articles de boutique : le marchand (acteurs qui font apparaître les articles, En_GirlA)
  if (c.type === 'RCTYPE_SHOP' && spawnsOf.ACTOR_EN_GIRLA) set(c.id, ['a', c.scene, [...spawnsOf.ACTOR_EN_GIRLA]]);
}
// statues de hibou : la pierre de hibou de la scène
for (const c of CHECKS.values()) if (c.type === 'RCTYPE_OWL') set(c.id, ['a', c.scene, 'ACTOR_OBJ_WARPSTONE']);
// créateurs des acteurs cités par les règles (et ceux de leurs créateurs, sur trois niveaux)
const spawners = {};
{
  let todo = new Set(Object.values(loc).flatMap(r => r[0] === 'a' ? [].concat(r[2]) : r[0] === 'i' && r[4] ? [r[4]] : []));
  for (let depth = 0; depth < 3 && todo.size; depth++){
    const next = new Set();
    for (const a of todo) if (spawnsOf[a] && !spawners[a]){ spawners[a] = [...spawnsOf[a]]; spawners[a].forEach(x => next.add(x)); }
    todo = next;
  }
}
// checks par scène du jeu, positions placées à la main
const cs = {};
for (const c of CHECKS.values()) if (c.scene !== 'SCENE_MAX') (cs[c.scene] = cs[c.scene] || []).push(c.id);
const MANUAL_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'positions-manuelles.json');
const manual = {};
if (fs.existsSync(MANUAL_FILE)) for (const [rc, p] of Object.entries(JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf8')))){
  if (!CHECKS.has(rc) || !/^SCENE_\w+(#\d+)?$/.test(p.scene)) throw new Error('positions-manuelles.json : ' + rc);
  manual[rc] = [p.scene, p.x, p.y, p.z];
}
// voisin de la même famille (petites familles, hors herbe et pots : ceux-là ont chacun leur place)
const alt = {};
{
  const fams = {};
  for (const id of RC_ORDER) if (CHECKS.has(id)) (fams[family(id)] = fams[family(id)] || []).push(id);
  for (const list of Object.values(fams)){
    if (list.length < 2) continue;
    for (const id of list){
      const t = CHECKS.get(id).type;
      // (herbe, pots, caisses, tonneaux, boules de neige : chacun sa place ; grandes familles : objets posés seulement)
      if (/^RCTYPE_(GRASS|POT|CRATE|BARREL|SNOWBALL)$/.test(t) || (list.length > 12 && t !== 'RCTYPE_FREESTANDING')) continue;
      const sib = list.find(x => x !== id && loc[x]);
      if (sib) alt[id] = sib;
    }
  }
}
const kinds = {};
for (const r of Object.values(loc)) kinds[r[0]] = (kinds[r[0]] || 0) + 1;

const out = `/* FICHIER GÉNÉRÉ par tools/2ship-maps/gen_maps_recipe.mjs depuis les sources de 2 Ship 2 Harkinian (commit ${COMMIT}) :
   ne pas modifier à la main. Aucune donnée de la ROM. Voir l'en-tête du générateur. */
window.MAPS_RECIPE = {
commit:${JSON.stringify(COMMIT)},
scenes:${JSON.stringify(scenes)},
actors:${JSON.stringify(actors)},
variants:${JSON.stringify(variants)},
loc:${JSON.stringify(loc)},
alt:${JSON.stringify(alt)},
alias:${JSON.stringify(alias)},
grottos:${JSON.stringify(grottos)},
exact:${JSON.stringify(Object.keys(loc).filter(id => loc[id][0] === 'a' && /^RCTYPE_(OWL|TREE|BUTTERFLY|BEEHIVE|COW)$/.test(CHECKS.get(id).type)))},
spawners:${JSON.stringify(spawners)},
cs:${JSON.stringify(cs)},
manual:${JSON.stringify(manual)}};
`;
fs.writeFileSync(path.join(ROOT, 'data/maps-recipe.js'), out);
console.log(`${scenes.filter(Boolean).length} scènes, ${actors.length} acteurs, ${Object.keys(loc).length} / ${CHECKS.size} checks à placer (${JSON.stringify(kinds)}), ${Object.keys(manual).length} placés à la main → data/maps-recipe.js`);
