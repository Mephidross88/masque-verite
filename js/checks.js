/* ---------- Checks de 2Ship (page Checks) ----------
   Construits depuis window.CHECKS_DATA (data/checks-data.js, généré par tools/2ship-checks/extract_checks.mjs) :
   scènes du tracker de checks de 2Ship (CHECK_SCENES, dans son ordre), checks (CHECKS, CHECK_BY_ID, CHECKS_BY_SCENE),
   objets (ITEM_DATA), catégories (CHECK_CATS : une par type RCTYPE_ de 2Ship, regroupées). Règle pure : checkShuffled. */
const CHECK_SCENES = CHECKS_DATA.scenes.map(s => ({ id:s.id, label:td(s.fr, s.en) }));
const CHECK_SCENE = Object.fromEntries(CHECK_SCENES.map(s => [s.id, s]));
const ITEM_DATA = Object.fromEntries(CHECKS_DATA.items.map(i => [i.id, { ...i, label:td(i.fr, i.en) }]));

// petites icônes des catégories (trait, comme ICONS)
const CI = {
  chest:  S('<rect x="3.5" y="9" width="17" height="10.5" rx="1.5"/><path d="M3.5 9a8.5 4.5 0 0117 0M3.5 13h17"/><rect x="10.5" y="11.5" width="3" height="3.5" rx=".6" fill="currentColor" stroke="none"/>'),
  heart:  S('<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.5 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/>'),
  npc:    S('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>'),
  game:   S('<path d="M7 4h10v4a5 5 0 01-10 0z"/><path d="M7 5H4.5a2.5 3 0 002.8 4M17 5h2.5a2.5 3 0 01-2.8 4M12 13v4M8.5 20h7"/>'),
  shop:   S('<path d="M4 9l1.5-4.5h13L20 9M4 9h16v10.5H4zM4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9"/>'),
  song:   S('<path d="M9 18V5.5l11-2.5v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
  fairy:  S('<circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><path d="M10.5 10.5C7 6 3.5 6.5 4 9.5s4 3.5 6.5 2.5M13.5 10.5C17 6 20.5 6.5 20 9.5s-4 3.5-6.5 2.5M10.5 13.5C8 17 5 18 5 16s3-3.5 5.5-3M13.5 13.5C16 17 19 18 19 16s-3-3.5-5.5-3"/>'),
  skull:  S('<circle cx="12" cy="11" r="4.5"/><path d="M12 6.5V3M7.8 9L4 6.5M16.2 9L20 6.5M7.5 12.5H3.5M16.5 12.5h4M8 14.5l-3 4M16 14.5l3 4"/>'),
  owl:    S('<path d="M5 4.5l3 2.5h8l3-2.5v9.5a7 7 0 01-14 0z"/><circle cx="9.3" cy="11.2" r="2"/><circle cx="14.7" cy="11.2" r="2"/>'),
  map:    S('<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>'),
  cow:    S('<path d="M7 8.5C5 8.5 3.5 7 3.5 5.5M17 8.5c2 0 3.5-1.5 3.5-3"/><rect x="6.5" y="7.5" width="11" height="9" rx="4.5"/><ellipse cx="12" cy="17" rx="4" ry="3"/><circle cx="10" cy="11" r=".9" fill="currentColor" stroke="none"/><circle cx="14" cy="11" r=".9" fill="currentColor" stroke="none"/>'),
  frog:   S('<path d="M4 15c0-4 3.6-7 8-7s8 3 8 7-3.6 4.5-8 4.5S4 19 4 15z"/><circle cx="8" cy="8" r="2.3"/><circle cx="16" cy="8" r="2.3"/><path d="M9 15.5c1.8 1 4.2 1 6 0"/>'),
  remains:S('<path d="M12 3l3 5.5 6 .8-4.5 4.2 1.2 6L12 16.5 6.3 19.5l1.2-6L3 9.3l6-.8z"/>'),
  enemy:  S('<path d="M5 19L18 6M14.5 5.5L19 5l-.5 4.5M7 13l4 4M4 16l4 4"/>'),
  pot:    S('<path d="M8 4.5h8M9 4.5v2.5c-3 1.3-4.5 4-4.5 7 0 3.6 3.4 6 7.5 6s7.5-2.4 7.5-6c0-3-1.5-5.7-4.5-7V4.5"/>'),
  grass:  S('<path d="M5 20c0-5 1-8 3-11M10 20c0-6 .5-10 2-14M14.5 20c0-5-.5-8-2-10M19 20c0-4-1-7-3-9"/>'),
  crate:  S('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 4l16 16M20 4L4 20"/>'),
  barrel: S('<path d="M7 3.5h10c1.5 2.5 2 5.5 2 8.5s-.5 6-2 8.5H7C5.5 18 5 15 5 12s.5-6 2-8.5zM5.4 8.5h13.2M5.4 15.5h13.2"/>'),
  snow:   S('<circle cx="12" cy="12" r="8"/><path d="M8 9.5l2 1M14 13.5l2 1M9.5 15l.5-2M14 8.5l.5 2"/>'),
  tree:   S('<path d="M12 21v-6M12 3c-4 0-7 3-7 6.5S8 15 12 15s7-2 7-5.5S16 3 12 3z"/>'),
  hive:   S('<path d="M12 3c-4.5 0-7 3-7 7v2c0 4.5 3 8 7 8s7-3.5 7-8v-2c0-4-2.5-7-7-7zM5.5 9h13M5 13h14M6.5 17h11"/>'),
  fly:    S('<path d="M12 7v13M12 9C9 3 3 4 4 8s5 4 8 3M12 9c3-6 9-5 8-1s-5 4-8 3M12 13c-2 4-6 5-6.5 3S9 12.5 12 13M12 13c2 4 6 5 6.5 3S15 12.5 12 13"/>'),
  ground: S('<path d="M12 3.5l5 3.6v7.8l-5 3.6-5-3.6V7.1z"/><path d="M3 21h18"/>'),
  wonder: S('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'),
};
/* Catégories : une par type de check de 2Ship (RCTYPE_…), regroupées en deux familles (principaux / décor et créatures) ;
   chaque catégorie a son option de mélange (opt) quand elle en dépend. */
const CHECK_CATS = tWalk([
  { id:'CHEST', label:'Coffres', icon:CI.chest },
  { id:'NPC', label:'Personnages', icon:CI.npc },
  { id:'MINIGAME', label:'Mini-jeux', icon:CI.game },
  { id:'HEART', label:'Quarts de cœur', icon:CI.heart },
  { id:'SONG', label:'Chants', icon:CI.song },
  { id:'STRAY_FAIRY', label:'Fées perdues', icon:CI.fairy },
  { id:'REMAINS', label:'Restes des boss', icon:CI.remains, opt:'RO_SHUFFLE_BOSS_REMAINS' },
  { id:'SHOP', label:'Boutiques', icon:CI.shop, opt:'RO_SHUFFLE_SHOPS' },
  { id:'TINGLE_SHOP', label:'Cartes de Tingle', icon:CI.map, opt:'RO_SHUFFLE_TINGLE_SHOPS' },
  { id:'OWL', label:'Statues de hibou', icon:CI.owl, opt:'RO_SHUFFLE_OWL_STATUES' },
  { id:'COW', label:'Vaches', icon:CI.cow, opt:'RO_SHUFFLE_COWS' },
  { id:'FROG', label:'Grenouilles', icon:CI.frog, opt:'RO_SHUFFLE_FROGS' },
  { id:'SKULL_TOKEN', label:'Skulltulas d’or', icon:CI.skull, opt:'RO_SHUFFLE_GOLD_SKULLTULAS' },
  { id:'ENEMY_DROP', label:'Ennemis', icon:CI.enemy, opt:'RO_SHUFFLE_ENEMY_DROPS', bulk:true },
  { id:'FREESTANDING', label:'Objets au sol', icon:CI.ground, opt:'RO_SHUFFLE_FREESTANDING_ITEMS', bulk:true },
  { id:'WONDER_ITEM', label:'Objets cachés', icon:CI.wonder, opt:'RO_SHUFFLE_WONDER_ITEMS', bulk:true },
  { id:'BUTTERFLY', label:'Papillons', icon:CI.fly, opt:'RO_SHUFFLE_BUTTERFLIES', bulk:true },
  { id:'POT', label:'Pots', icon:CI.pot, opt:'RO_SHUFFLE_POT_DROPS', bulk:true },
  { id:'CRATE', label:'Caisses', icon:CI.crate, opt:'RO_SHUFFLE_CRATE_DROPS', bulk:true },
  { id:'BARREL', label:'Tonneaux', icon:CI.barrel, opt:'RO_SHUFFLE_BARREL_DROPS', bulk:true },
  { id:'SNOWBALL', label:'Boules de neige', icon:CI.snow, opt:'RO_SHUFFLE_SNOWBALL_DROPS', bulk:true },
  { id:'GRASS', label:'Herbe', icon:CI.grass, opt:'RO_SHUFFLE_GRASS_DROPS', bulk:true },
  { id:'TREE', label:'Arbres', icon:CI.tree, opt:'RO_SHUFFLE_TREE_DROPS', bulk:true },
  { id:'BEEHIVE', label:'Ruches', icon:CI.hive, opt:'RO_SHUFFLE_HIVE_DROPS', bulk:true },
], ['label']);
const CHECK_CAT = Object.fromEntries(CHECK_CATS.map(c => [c.id, c]));

const CHECKS = CHECKS_DATA.checks.map(c => ({ ...c, label:td(c.fr, c.en), cat:c.type }));
const CHECK_BY_ID = Object.fromEntries(CHECKS.map(c => [c.id, c]));
const CHECKS_BY_SCENE = {};
CHECKS.forEach(c => (CHECKS_BY_SCENE[c.scene] = CHECKS_BY_SCENE[c.scene] || []).push(c));

// Contrôle des données : chaque type de check a sa catégorie (affiché dans la Configuration)
const CHECK_ERRORS = [...new Set(CHECKS.map(c => c.cat))].filter(k => !CHECK_CAT[k]).map(k => t('Type de check sans catégorie : {k}', { k }));

// Checks toujours mélangés même sans les boutiques (GeneratePools.cpp)
const ALWAYS_SHUFFLED_SHOP = new Set(['RC_CURIOSITY_SHOP_SPECIAL_ITEM', 'RC_BOMB_SHOP_ITEM_03', 'RC_BOMB_SHOP_ITEM_04_OR_CURIOSITY_SHOP_ITEM']);
/* Check mélangé (présent dans la seed, affiché par le tracker de 2Ship) : liste exacte du spoiler importé (s.pool : ses
   checks, tous « shuffled » — dont les Skulltulas laissées en place et les checks exclus), sinon règles de
   GeneratePools.cpp : option de son type, boutiques toujours mélangées, pas les pots de l'antre de Majora. Les Skulltulas
   d'or laissées en place restent des checks (shuffled, avec leur jeton) : toutes comptent. */
function checkShuffled(c, s){
  if (s.pool && Object.keys(s.pool).length) return !!s.pool[c.id];
  if (c.scene === 'SCENE_LAST_BS') return false;
  if (c.cat === 'SHOP') return !!s.RO_SHUFFLE_SHOPS || ALWAYS_SHUFFLED_SHOP.has(c.id);
  const cat = CHECK_CAT[c.cat];
  return !cat || !cat.opt || !!s[cat.opt];
}
