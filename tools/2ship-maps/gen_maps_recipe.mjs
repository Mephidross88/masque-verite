/* Recette des cartes (page Carte) : data/maps-recipe.js, tiré des sources de 2Ship (tools/2ship-checks/src, voir
   fetch_sources.mjs) — rien de la ROM. Lu par js/maps-extract.js, qui fabrique les cartes depuis la ROM du joueur.
   Usage : node tools/2ship-maps/gen_maps_recipe.mjs
   Contenu :
   - scenes : une entrée par scène de la table des scènes (index = numéro de la scène, null : entrée vide) :
              [SCENE_…, numéro d'EntranceSceneId (scène d'arrivée des entrées), nom français, nom anglais de 2Ship]
   - actors : numéro d'acteur → nom (ACTOR_…), pour reconnaître les acteurs des salles (checks, portes) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { read, parseEnum, loadScenes } from '../2ship-checks/sources.mjs';
import { SCENE_FR } from '../2ship-checks/translate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMMIT = '8a24047';

// noms français des scènes sans check propre (intérieurs, variantes) ; les autres : SCENE_FR (libellés de la page Checks)
const SCENE_FR_MORE = {
  SCENE_20SICHITAI2:'Marais du Sud (purifié)', SCENE_SPOT00:'Scène cinématique', SCENE_WITCH_SHOP:'Boutique de Potions des Sorcières',
  SCENE_AYASHIISHOP:'Bazar', SCENE_OMOYA:'Maison de Romani et étable', SCENE_BOWLING:'Manège des Amoureux',
  SCENE_SONCHONOIE:'Résidence du Maire', SCENE_MILK_BAR:'Lactel', SCENE_TAKARAYA:'Chasse au Trésor',
  SCENE_INISIE_R:'Temple de la Forteresse de Pierre (inversé)', SCENE_OPENINGDAN:'Avant Bourg-Clocher',
  SCENE_SYATEKI_MIZU:'Stand de Tir de Bourg-Clocher', SCENE_SYATEKI_MORI:'Stand de Tir des Marais', SCENE_YOUSEI_IZUMI:'Fontaine des Fées',
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

const out = `/* FICHIER GÉNÉRÉ par tools/2ship-maps/gen_maps_recipe.mjs depuis les sources de 2 Ship 2 Harkinian (commit ${COMMIT}) :
   ne pas modifier à la main. Aucune donnée de la ROM. Voir l'en-tête du générateur. */
window.MAPS_RECIPE = {
commit:${JSON.stringify(COMMIT)},
scenes:${JSON.stringify(scenes)},
actors:${JSON.stringify(actors)}};
`;
fs.writeFileSync(path.join(ROOT, 'data/maps-recipe.js'), out);
console.log(scenes.filter(Boolean).length + ' scènes, ' + actors.length + ' acteurs → data/maps-recipe.js');
