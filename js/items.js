/* ---------- Inventaire (panneau Objets) ----------
   ITEM_GROUPS : catalogue des objets du panneau, rangés comme l'écran de pause du jeu. Chaque objet :
   - key : clé de sauvegarde (store.game.items[key]) ; ri : objet(s) de 2Ship (RI_…) qui le donnent ;
   - kind : 'bool' (possédé ou non), 'level' (paliers : stages, palier 0 = aucun ; un RI progressif monte d'un palier,
     levelOf : RI → palier précis), 'count' (compteur 0..max) ;
   - label : nom de l'objet de 2Ship (ITEM_DATA) sauf libellé propre ; visible(s) : selon la configuration ;
   - icon : image (icons/<chemin>), sinon icons/items/<key>.png ; à défaut, la tuile affiche un sigle (abbr).
   Les fonctions d'affichage et de clic (itemActive, clickItem…) lisent store, défini dans js/state.js (chargé après). */
const nm = ri => ITEM_DATA[ri] ? ITEM_DATA[ri].label : ri;
const B = (ri, more) => ({ key:ri.replace(/^RI_/, '').toLowerCase(), ri:[ri], kind:'bool', label:nm(ri), ...more });
const shuffled = k => s => !!s[k];

const ITEM_GROUPS = [
  { id:'items', title:'Objets', items:[
    B('RI_OCARINA'),
    { key:'bow', ri:['RI_PROGRESSIVE_BOW'], kind:'level', label:t('Arc'), stages:['Aucun', 'Arc du Brave (30)', 'Grand Carquois (40)', 'Carquois Géant (50)'].map(tl),
      sizes:['', '30', '40', '50'], levelOf:{ RI_BOW:1, RI_QUIVER_40:2, RI_QUIVER_50:3 } },
    B('RI_ARROW_FIRE'), B('RI_ARROW_ICE'), B('RI_ARROW_LIGHT'),
    { key:'bomb_bag', ri:['RI_PROGRESSIVE_BOMB_BAG'], kind:'level', label:t('Sac de Bombes'),
      stages:['Aucun', 'Sac de Bombes (20)', 'Grand Sac de Bombes (30)', 'Sac de Bombes Géant (40)'].map(tl), sizes:['', '20', '30', '40'],
      levelOf:{ RI_BOMB_BAG_20:1, RI_BOMB_BAG_30:2, RI_BOMB_BAG_40:3 } },
    B('RI_BOMBCHU', { ri:['RI_BOMBCHU', 'RI_BOMBCHU_5', 'RI_BOMBCHU_10'] }),
    B('RI_DEKU_STICK', { ri:['RI_DEKU_STICK', 'RI_DEKU_STICKS_5'] }), B('RI_DEKU_NUT', { ri:['RI_DEKU_NUT', 'RI_DEKU_NUTS_5', 'RI_DEKU_NUTS_10'] }),
    B('RI_MAGIC_BEAN'), B('RI_POWDER_KEG'), B('RI_PICTOGRAPH_BOX'), B('RI_LENS'), B('RI_HOOKSHOT'), B('RI_GREAT_FAIRY_SWORD'),
    { key:'bottles', ri:['RI_BOTTLE_EMPTY', 'RI_BOTTLE_MILK', 'RI_BOTTLE_GOLD_DUST', 'RI_BOTTLE_CHATEAU_ROMANI', 'RI_BOTTLE_RED_POTION'],
      kind:'count', max:6, label:t('Bouteilles'), icon:'items/bottle_empty.png' },
  ]},
  { id:'trade', title:'Objets d’échange', items:[
    // (objets indépendants dans le randomizer : chacun a son emplacement)
    B('RI_MOONS_TEAR'), B('RI_DEED_LAND'), B('RI_DEED_SWAMP'), B('RI_DEED_MOUNTAIN'), B('RI_DEED_OCEAN'),
    B('RI_ROOM_KEY'), B('RI_LETTER_TO_KAFEI'), B('RI_LETTER_TO_MAMA'), B('RI_PENDANT_OF_MEMORIES'),
  ]},
  { id:'masks', title:'Masques', items:[
    B('RI_MASK_POSTMAN'), B('RI_MASK_ALL_NIGHT'), B('RI_MASK_BLAST'), B('RI_MASK_STONE'), B('RI_MASK_GREAT_FAIRY'), B('RI_MASK_DEKU'),
    B('RI_MASK_KEATON'), B('RI_MASK_BREMEN'), B('RI_MASK_BUNNY'), B('RI_MASK_DON_GERO'), B('RI_MASK_SCENTS'), B('RI_MASK_GORON'),
    B('RI_MASK_ROMANI'), B('RI_MASK_CIRCUS_LEADER'), B('RI_MASK_KAFEIS_MASK'), B('RI_MASK_COUPLE'), B('RI_MASK_TRUTH'), B('RI_MASK_ZORA'),
    B('RI_MASK_KAMARO'), B('RI_MASK_GIBDO'), B('RI_MASK_GARO'), B('RI_MASK_CAPTAIN'), B('RI_MASK_GIANT'), B('RI_MASK_FIERCE_DEITY'),
  ]},
  { id:'equipment', title:'Équipement', items:[
    { key:'sword', ri:['RI_PROGRESSIVE_SWORD'], kind:'level', label:t('Épée'), stages:['', nm('RI_SWORD_KOKIRI'), nm('RI_SWORD_RAZOR'), nm('RI_SWORD_GILDED')],
      levelOf:{ RI_SWORD_KOKIRI:1, RI_SWORD_RAZOR:2, RI_SWORD_GILDED:3 }, icons:['items/sword_kokiri.png', 'items/sword_razor.png', 'items/sword_gilded.png'] },
    B('RI_SHIELD_HERO'), B('RI_SHIELD_MIRROR'),
    { key:'wallet', ri:['RI_PROGRESSIVE_WALLET'], kind:'level', label:t('Bourse'),
      stages:['Bourse (99)', 'Bourse d’Adulte (200)', 'Bourse Géante (500)', 'Bourse de Magnat (5000)'].map(tl), sizes:['99', '200', '500', '5000'],
      levelOf:{ RI_WALLET_ADULT:1, RI_WALLET_GIANT:2, RI_WALLET_TYCOON:3 } },
    { key:'magic', ri:['RI_PROGRESSIVE_MAGIC'], kind:'level', label:t('Magie'), stages:['', nm('RI_SINGLE_MAGIC'), nm('RI_DOUBLE_MAGIC')],
      levelOf:{ RI_SINGLE_MAGIC:1, RI_DOUBLE_MAGIC:2 }, icons:['items/magic_single.png', 'items/magic_double.png'] },
    B('RI_DOUBLE_DEFENSE'), B('RI_GREAT_SPIN_ATTACK'), B('RI_BOMBERS_NOTEBOOK'),
    { key:'heart_pieces', ri:['RI_HEART_PIECE'], kind:'count', max:52, label:t('Quarts de cœur'), icon:'items/heart_piece.png' },
    { key:'heart_containers', ri:['RI_HEART_CONTAINER'], kind:'count', max:4, label:t('Réceptacles de cœur'), icon:'items/heart_container.png' },
  ]},
  { id:'songs', title:'Chants', items:[
    B('RI_SONG_TIME'), B('RI_SONG_HEALING'), B('RI_SONG_EPONA'), B('RI_SONG_SOARING'), B('RI_SONG_STORMS'), B('RI_SONG_SONATA'),
    { key:'lullaby', ri:['RI_PROGRESSIVE_LULLABY'], kind:'level', label:nm('RI_SONG_LULLABY'), stages:['', nm('RI_SONG_LULLABY_INTRO'), nm('RI_SONG_LULLABY')],
      levelOf:{ RI_SONG_LULLABY_INTRO:1, RI_SONG_LULLABY:2 }, icons:['items/song_lullaby_intro.png', 'items/song_lullaby.png'] },
    B('RI_SONG_NOVA'), B('RI_SONG_ELEGY'), B('RI_SONG_OATH'),
    B('RI_SONG_SUN'), B('RI_SONG_DOUBLE_TIME'), B('RI_SONG_INVERTED_TIME'), B('RI_SONG_SARIA', { visible:shuffled('RO_SHUFFLE_SONG_SARIA') }),
  ]},
  { id:'remains', title:'Restes des boss', items:[
    B('RI_REMAINS_ODOLWA'), B('RI_REMAINS_GOHT'), B('RI_REMAINS_GYORG'), B('RI_REMAINS_TWINMOLD'),
    { key:'triforce', ri:['RI_TRIFORCE_PIECE', 'RI_TRIFORCE_PIECE_PREVIOUS'], kind:'count', max:s => s.RO_TRIFORCE_PIECES_MAX,
      goal:s => s.RO_TRIFORCE_PIECES_REQUIRED, label:t('Fragments de Triforce'), visible:shuffled('RO_SHUFFLE_TRIFORCE_PIECES'), icon:'items/triforce_piece.png' },
  ]},
  { id:'abilities', title:'Capacités', items:[
    B('RI_ABILITY_SWIM', { visible:shuffled('RO_SHUFFLE_SWIM') }),
    ...['A', 'C_UP', 'C_DOWN', 'C_LEFT', 'C_RIGHT'].map(b => B('RI_OCARINA_BUTTON_' + b, { visible:shuffled('RO_SHUFFLE_OCARINA_BUTTONS') })),
    B('RI_SKELETON_KEY', { visible:shuffled('RO_SHUFFLE_SKELETON_KEY') }),
    // demi-journées (temps mélangé) : au hasard, une par une ; progressif : un compteur
    ...['DAY_1', 'NIGHT_1', 'DAY_2', 'NIGHT_2', 'DAY_3', 'NIGHT_3'].map(h => B('RI_TIME_' + h,
      { visible:s => !!s.RO_CLOCK_SHUFFLE && s.RO_CLOCK_SHUFFLE_PROGRESSIVE === RO.RO_CLOCK_SHUFFLE_RANDOM })),
    { key:'time_progressive', ri:['RI_TIME_PROGRESSIVE'], kind:'count', max:6, label:nm('RI_TIME_PROGRESSIVE'), icon:'items/time_progressive.png',
      visible:s => !!s.RO_CLOCK_SHUFFLE && s.RO_CLOCK_SHUFFLE_PROGRESSIVE !== RO.RO_CLOCK_SHUFFLE_RANDOM },
    // grenouilles et statues de hibou : des objets même sans mélange (la logique en a besoin)
    ...['WHITE', 'BLUE', 'CYAN', 'PINK'].map(c => B('RI_FROG_' + c)),
  ]},
  { id:'owls', title:'Statues de hibou', items:['CLOCK_TOWN_SOUTH', 'MILK_ROAD', 'SOUTHERN_SWAMP', 'WOODFALL', 'MOUNTAIN_VILLAGE', 'SNOWHEAD',
    'GREAT_BAY_COAST', 'ZORA_CAPE', 'IKANA_CANYON', 'STONE_TOWER'].map(o => B('RI_OWL_' + o)) },
  { id:'souls', title:'Âmes des boss', items:['ODOLWA', 'GOHT', 'GYORG', 'TWINMOLD', 'MAJORA'].map(b => B('RI_SOUL_BOSS_' + b, { visible:shuffled('RO_SHUFFLE_BOSS_SOULS') })) },
  { id:'enemySouls', title:'Âmes des ennemis', items:CHECKS_DATA.items.filter(i => /^RI_SOUL_ENEMY_/.test(i.id)).map(i => B(i.id, { visible:shuffled('RO_SHUFFLE_ENEMY_SOULS') })) },
].map(g => ({ ...g, title:t(g.title) }));

/* Temples : carte, boussole, petites clés (nombre de la version d'origine), Clé d'Or, fées perdues (15), Skulltulas d'or
   pour les deux maisons. ri : objets de 2Ship de chaque case. */
const DUNGEONS = [
  { id:'woodfall', label:'Bois-Cascade', keys:1, color:'#4f8a3a', p:'WOODFALL' },
  { id:'snowhead', label:'Pic des Neiges', keys:3, color:'#5b8fc7', p:'SNOWHEAD' },
  { id:'greatBay', label:'Grande Baie', keys:1, color:'#2f8f99', p:'GREAT_BAY' },
  { id:'stoneTower', label:'Forteresse de Pierre', keys:4, color:'#b8892e', p:'STONE_TOWER' },
].map(d => ({ ...d, label:tl(d.label) }));
const DUNGEON_BY_ID = Object.fromEntries(DUNGEONS.map(d => [d.id, d]));

const ITEM_BY_KEY = {};
ITEM_GROUPS.forEach(g => g.items.forEach(it => { it.group = g.id; ITEM_BY_KEY[it.key] = it; }));
// objet de 2Ship → objet du panneau (et palier précis, pour les objets à paliers)
const ITEM_BY_RI = {};
ITEM_GROUPS.forEach(g => g.items.forEach(it => {
  it.ri.forEach(ri => { ITEM_BY_RI[ri] = { it }; });
  if (it.levelOf) for (const [ri, lv] of Object.entries(it.levelOf)) ITEM_BY_RI[ri] = { it, level:lv };
}));
DUNGEONS.forEach(d => {
  for (const [part, f] of [['MAP', 'map'], ['COMPASS', 'compass'], ['BOSS_KEY', 'bossKey'], ['SMALL_KEY', 'keys'], ['STRAY_FAIRY', 'fairies']])
    ITEM_BY_RI['RI_' + d.p + '_' + part] = { dungeon:d.id, field:f };
});
ITEM_BY_RI.RI_CLOCK_TOWN_STRAY_FAIRY = { townFairy:true };
ITEM_BY_RI.RI_GS_TOKEN_SWAMP = { tokens:'swamp' };
ITEM_BY_RI.RI_GS_TOKEN_OCEAN = { tokens:'ocean' };
const SPIDER_HOUSES = [{ id:'swamp', label:t('Maison des Araignées des Marais') }, { id:'ocean', label:t('Maison des Araignées de la Côte') }];

const itemMax = it => typeof it.max === 'function' ? it.max(store.settings) : it.max ?? it.stages?.length - 1;
const itemVisible = it => !it.visible || it.visible(store.settings);
const itemActive = (it, v) => it.kind === 'bool' ? !!v : it.key === 'wallet' ? true : v > 0;
const itemMaxed = it => { const v = store.game.items[it.key]; return it.kind === 'count' ? v >= (it.goal ? it.goal(store.settings) : itemMax(it)) : v >= itemMax(it); };
function iconSrc(it){
  const v = store.game.items[it.key];
  if (it.kind === 'level' && it.icons) return 'icons/' + it.icons[Math.max(1, v) - 1];
  return 'icons/' + (it.icon || 'items/' + it.key + '.png');
}
// sigle d'une tuile sans image : initiales des mots significatifs
const itemAbbr = it => (it.label.replace(/\(.*?\)/g, '').match(/[A-Za-zÀ-ÿ0-9]+/g) || ['?'])
  .filter(w => !/^(de|du|des|la|le|les|l|d|of|the)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
function itemTitle(it){
  const v = store.game.items[it.key];
  if (it.kind === 'level') return it.label + (it.stages[v] ? ' : ' + it.stages[v] : '');
  if (it.kind === 'count') return it.label + ' : ' + v + ' / ' + itemMax(it);
  return it.label;
}
// clic : active / palier suivant / +1 ; clic droit : désactive / palier précédent / −1 (comme l'Œil Sheikah)
function clickItem(ev, it){
  const g = store.game.items, v = g[it.key];
  if (it.kind === 'bool') g[it.key] = !v;
  else g[it.key] = Math.min(itemMax(it), v + 1);
}
function rightClickItem(ev, it){
  const g = store.game.items, v = g[it.key];
  if (it.kind === 'bool') g[it.key] = false;
  else g[it.key] = Math.max(0, v - 1);
}
/* Objets donnés d'office selon la configuration (StartingItems.cpp, GetComputedStartingItems), absents de la liste du
   spoiler : cartes et boussoles, clés et fées « au départ », nage, âmes des ennemis, touches de l'ocarina et chants du
   temps non mélangés, Bâtons et Noix Mojo (consommables au maximum). Pas la demi-journée tirée au sort (temps mélangé). */
function computedStartingItems(s){
  const out = [], T = ['WOODFALL', 'SNOWHEAD', 'GREAT_BAY', 'STONE_TOWER'];
  if (s.RO_STARTING_MAPS_AND_COMPASSES) T.forEach(d => out.push('RI_' + d + '_MAP', 'RI_' + d + '_COMPASS'));
  if (s.RO_PLACEMENT_SMALL_KEYS === RO.RO_DUNGEON_ITEM_START_WITH) T.forEach(d => { for (let i = 0; i < DUNGEON_BY_ID[DUNGEON_OF[d]].keys; i++) out.push('RI_' + d + '_SMALL_KEY'); });
  if (s.RO_PLACEMENT_BOSS_KEYS === RO.RO_DUNGEON_ITEM_START_WITH) T.forEach(d => out.push('RI_' + d + '_BOSS_KEY'));
  if (s.RO_PLACEMENT_STRAY_FAIRIES === RO.RO_DUNGEON_ITEM_START_WITH) T.forEach(d => { for (let i = 0; i < 15; i++) out.push('RI_' + d + '_STRAY_FAIRY'); });
  if (!s.RO_SHUFFLE_SWIM) out.push('RI_ABILITY_SWIM');
  if (!s.RO_SHUFFLE_ENEMY_SOULS) CHECKS_DATA.items.forEach(i => { if (/^RI_SOUL_ENEMY_/.test(i.id)) out.push(i.id); });
  if (!s.RO_SHUFFLE_OCARINA_BUTTONS) ['A', 'C_UP', 'C_DOWN', 'C_LEFT', 'C_RIGHT'].forEach(b => out.push('RI_OCARINA_BUTTON_' + b));
  if (!s.RO_SHUFFLE_SONG_DOUBLE_TIME) out.push('RI_SONG_DOUBLE_TIME');
  if (!s.RO_SHUFFLE_SONG_INVERTED_TIME) out.push('RI_SONG_INVERTED_TIME');
  if (s.RO_STARTING_CONSUMABLES) out.push('RI_DEKU_STICK', 'RI_DEKU_NUT');
  return out;
}
const DUNGEON_OF = { WOODFALL:'woodfall', SNOWHEAD:'snowhead', GREAT_BAY:'greatBay', STONE_TOWER:'stoneTower' };
// objets (noms RI_…) → panneau Objets (g : la partie, store.game par défaut) : objets de départ du spoiler, objets trouvés
// d'après la sauvegarde (js/link.js). → nombre d'objets notés
function applyStartingItems(list, g = store.game){
  let n = 0;
  for (const ri of list){
    const x = ITEM_BY_RI[ri];
    if (!x) continue;
    if (x.it){
      const it = x.it, v = g.items[it.key];
      if (it.kind === 'bool') g.items[it.key] = true;
      else if (x.level !== undefined) g.items[it.key] = Math.max(v, x.level);
      else g.items[it.key] = Math.min(itemMax(it) ?? Infinity, v + 1);
    } else if (x.dungeon){
      const d = g.dungeons[x.dungeon];
      if (x.field === 'keys' || x.field === 'fairies') d[x.field]++; else d[x.field] = true;
    } else if (x.townFairy) g.townFairy = true;
    else if (x.tokens) g.tokens[x.tokens]++;
    n++;
  }
  return n;
}
