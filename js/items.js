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
      kind:'count', max:6, label:t('Bouteilles') },
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
      levelOf:{ RI_SWORD_KOKIRI:1, RI_SWORD_RAZOR:2, RI_SWORD_GILDED:3 } },
    B('RI_SHIELD_HERO'), B('RI_SHIELD_MIRROR'),
    { key:'wallet', ri:['RI_PROGRESSIVE_WALLET'], kind:'level', label:t('Bourse'),
      stages:['Bourse (99)', 'Bourse d’Adulte (200)', 'Bourse Géante (500)', 'Bourse de Magnat (5000)'].map(tl), sizes:['99', '200', '500', '5000'],
      levelOf:{ RI_WALLET_ADULT:1, RI_WALLET_GIANT:2, RI_WALLET_TYCOON:3 } },
    { key:'magic', ri:['RI_PROGRESSIVE_MAGIC'], kind:'level', label:t('Magie'), stages:['', nm('RI_SINGLE_MAGIC'), nm('RI_DOUBLE_MAGIC')],
      levelOf:{ RI_SINGLE_MAGIC:1, RI_DOUBLE_MAGIC:2 } },
    B('RI_DOUBLE_DEFENSE'), B('RI_GREAT_SPIN_ATTACK'), B('RI_BOMBERS_NOTEBOOK'),
    { key:'heart_pieces', ri:['RI_HEART_PIECE'], kind:'count', max:52, label:t('Quarts de cœur') },
    { key:'heart_containers', ri:['RI_HEART_CONTAINER'], kind:'count', max:4, label:t('Réceptacles de cœur') },
  ]},
  { id:'songs', title:'Chants', items:[
    B('RI_SONG_TIME'), B('RI_SONG_HEALING'), B('RI_SONG_EPONA'), B('RI_SONG_SOARING'), B('RI_SONG_STORMS'), B('RI_SONG_SONATA'),
    { key:'lullaby', ri:['RI_PROGRESSIVE_LULLABY'], kind:'level', label:nm('RI_SONG_LULLABY'), stages:['', nm('RI_SONG_LULLABY_INTRO'), nm('RI_SONG_LULLABY')],
      levelOf:{ RI_SONG_LULLABY_INTRO:1, RI_SONG_LULLABY:2 } },   // (prélude seul : icône à moitié estompée ; ou badge : sizes:['', '1/2', ''])
    B('RI_SONG_NOVA'), B('RI_SONG_ELEGY'), B('RI_SONG_OATH'),
    B('RI_SONG_SUN'), B('RI_SONG_DOUBLE_TIME'), B('RI_SONG_INVERTED_TIME'), B('RI_SONG_SARIA', { visible:shuffled('RO_SHUFFLE_SONG_SARIA') }),
  ]},
  { id:'remains', title:'Restes des boss', items:[
    B('RI_REMAINS_ODOLWA'), B('RI_REMAINS_GOHT'), B('RI_REMAINS_GYORG'), B('RI_REMAINS_TWINMOLD'),
    { key:'triforce', ri:['RI_TRIFORCE_PIECE', 'RI_TRIFORCE_PIECE_PREVIOUS'], kind:'count', max:s => s.RO_TRIFORCE_PIECES_MAX,
      goal:s => s.RO_TRIFORCE_PIECES_REQUIRED, label:t('Fragments de Triforce'), visible:shuffled('RO_SHUFFLE_TRIFORCE_PIECES') },
  ]},
  { id:'abilities', title:'Capacités', items:[
    B('RI_ABILITY_SWIM', { visible:shuffled('RO_SHUFFLE_SWIM') }),
    ...['A', 'C_UP', 'C_DOWN', 'C_LEFT', 'C_RIGHT'].map(b => B('RI_OCARINA_BUTTON_' + b, { visible:shuffled('RO_SHUFFLE_OCARINA_BUTTONS') })),
    // passe-partout : ajouté au pool (pas à la place des petites clés), sauf petites clés données au départ ; donne d'un coup
    // le maximum de petites clés de chaque temple (GiveItem.cpp) — case sous les temples
    B('RI_SKELETON_KEY', { visible:s => !!s.RO_SHUFFLE_SKELETON_KEY && s.RO_PLACEMENT_SMALL_KEYS !== RO.RO_DUNGEON_ITEM_START_WITH }),
    // demi-journées (temps mélangé) : au hasard, une par une ; progressif : un compteur
    ...['DAY_1', 'NIGHT_1', 'DAY_2', 'NIGHT_2', 'DAY_3', 'NIGHT_3'].map(h => B('RI_TIME_' + h,
      { visible:s => !!s.RO_CLOCK_SHUFFLE && s.RO_CLOCK_SHUFFLE_PROGRESSIVE === RO.RO_CLOCK_SHUFFLE_RANDOM })),
    // stageOf : palier v (1 à 6) → la demi-journée obtenue (dans l'ordre ou à rebours), dont l'objet prête son icône et son
    // nom (chronologie, fenêtre de stream)
    { key:'time_progressive', ri:['RI_TIME_PROGRESSIVE'], kind:'count', max:6, label:nm('RI_TIME_PROGRESSIVE'),
      visible:s => !!s.RO_CLOCK_SHUFFLE && s.RO_CLOCK_SHUFFLE_PROGRESSIVE !== RO.RO_CLOCK_SHUFFLE_RANDOM,
      stageOf:(v, s) => 'time_' + TIME_HALVES[s.RO_CLOCK_SHUFFLE_PROGRESSIVE === RO.RO_CLOCK_SHUFFLE_DESCENDING ? 6 - v : v - 1] },
    // grenouilles et statues de hibou : des objets même sans mélange (la logique en a besoin)
    ...['WHITE', 'BLUE', 'CYAN', 'PINK'].map(c => B('RI_FROG_' + c)),
  ]},
  { id:'owls', title:'Statues de hibou', items:['CLOCK_TOWN_SOUTH', 'MILK_ROAD', 'SOUTHERN_SWAMP', 'WOODFALL', 'MOUNTAIN_VILLAGE', 'SNOWHEAD',
    'GREAT_BAY_COAST', 'ZORA_CAPE', 'IKANA_CANYON', 'STONE_TOWER'].map(o => B('RI_OWL_' + o)) },
  { id:'souls', title:'Âmes des boss', items:['ODOLWA', 'GOHT', 'GYORG', 'TWINMOLD', 'MAJORA'].map(b => B('RI_SOUL_BOSS_' + b, { visible:shuffled('RO_SHUFFLE_BOSS_SOULS') })) },
  { id:'enemySouls', title:'Âmes des ennemis', items:CHECKS_DATA.items.filter(i => /^RI_SOUL_ENEMY_/.test(i.id)).map(i => B(i.id, { visible:shuffled('RO_SHUFFLE_ENEMY_SOULS') })) },
].map(g => ({ ...g, title:t(g.title) }));

/* Temples : carte, boussole, petites clés (nombre de la version d'origine), Clé d'Or, fées perdues (15), Skulltulas d'or
   pour les deux maisons. ri : objets de 2Ship de chaque case. fairy : icône des fées perdues (icons/dungeons) ; soul : âme
   du boss (objet du panneau, case du temple si les âmes sont mélangées ; celle de Majora, sous les temples). */
const DUNGEONS = [
  { id:'woodfall', label:'Bois-Cascade', keys:1, color:'#4f8a3a', p:'WOODFALL', fairy:'StrayFairyWoodfall', soul:'soul_boss_odolwa' },
  { id:'snowhead', label:'Pic des Neiges', keys:3, color:'#5b8fc7', p:'SNOWHEAD', fairy:'StrayFairySnowhead', soul:'soul_boss_goht' },
  { id:'greatBay', label:'Grande Baie', keys:1, color:'#2f8f99', p:'GREAT_BAY', fairy:'StrayFairyGreatBay', soul:'soul_boss_gyorg' },
  { id:'stoneTower', label:'Forteresse de Pierre', keys:4, color:'#b8892e', p:'STONE_TOWER', fairy:'StrayFairyStoneTower', soul:'soul_boss_twinmold' },
].map(d => ({ ...d, label:tl(d.label) }));
const DUNGEON_BY_ID = Object.fromEntries(DUNGEONS.map(d => [d.id, d]));

/* Icônes (icons/<chemin>, 192 px) rangées par dossier : clé de l'objet → chemin, ou liste (un par palier). Sans entrée :
   icons/items/<clé>.png, à défaut un sigle. */
const ITEM_ICONS = {
  ocarina:'items/OcarinaOfTime.png', bomb_bag:'items/Bomb.png', arrow_fire:'items/FireArrow.png', arrow_ice:'items/IceArrow.png',
  arrow_light:'items/LightArrow.png', magic_bean:'items/MagicBeans.png', powder_keg:'items/PowderKeg.png', lens:'items/LensOfTruth.png',
  great_fairy_sword:'equipment/GreatFairysSword.png', bottles:'items/Bottle.png', bow:'items/Bow.png', bombchu:'items/Bombchu.png', deku_stick:'items/DekuStick.png', deku_nut:'items/DekuNut.png',
  hookshot:'items/Hookshot.png', pictograph_box:'items/PictographBox.png',
  moons_tear:'trade_items/MoonsTear.png', deed_land:'trade_items/LandDeed.png', deed_swamp:'trade_items/SwampDeed.png',
  deed_mountain:'trade_items/MountainDeed.png', deed_ocean:'trade_items/OceanDeed.png', room_key:'trade_items/RoomKey.png',
  letter_to_kafei:'trade_items/LetterToKafei.png', letter_to_mama:'trade_items/LetterToMama.png', pendant_of_memories:'trade_items/PendantOfMemories.png',
  mask_postman:'masks/PostmansHat.png', mask_all_night:'masks/AllNightMask.png', mask_blast:'masks/BlastMask.png', mask_stone:'masks/StoneMask.png',
  mask_great_fairy:'masks/GreatFairysMask.png', mask_deku:'masks/DekuMask.png', mask_keaton:'masks/KeatonMask.png', mask_bremen:'masks/BremenMask.png',
  mask_bunny:'masks/BunnyHood.png', mask_don_gero:'masks/DonGerosMask.png', mask_scents:'masks/MaskofScents.png', mask_goron:'masks/GoronMask.png',
  mask_romani:'masks/RomanisMask.png', mask_circus_leader:'masks/TroupeLeaders-Mask.png', mask_kafeis_mask:'masks/KafeisMask.png',
  mask_couple:'masks/CouplesMask.png', mask_truth:'masks/MaskOfTruth.png', mask_zora:'masks/ZoraMask.png', mask_kamaro:'masks/KamarosMask.png',
  mask_gibdo:'masks/GibdoMask.png', mask_garo:'masks/GarosMask.png', mask_captain:'masks/CaptainsHat.png', mask_giant:'masks/GiantsMask.png',
  mask_fierce_deity:'masks/FierceDeitysMask.png',
  sword:['equipment/KokiriSword.png', 'equipment/RazorSword.png', 'equipment/GildedSword.png'], shield_hero:'equipment/HerosShield.png',
  shield_mirror:'equipment/MirrorShield.png', wallet:'equipment/AdultsWallet.png', magic:['equipment/SmallMagicJarTex.png', 'equipment/BigMagicJar.png'],
  bombers_notebook:'equipment/BombersNotebook.png', heart_pieces:'equipment/PieceOfHeart.png', heart_containers:'equipment/HeartContainer.png',
  song_time:'songs/SongOfTime.png', song_healing:'songs/SongOfHealing.png', song_epona:'songs/EponaSong.png', song_soaring:'songs/SongOfSoaring.png',
  song_storms:'songs/SongOfStorms.png', song_sonata:'songs/SonataOfAwakening.png', lullaby:['songs/GoronLullabyIntro.png', 'songs/GoronLullaby.png'],
  song_nova:'songs/BossaNova.png', song_elegy:'songs/ElegyOfEmptiness.png', song_oath:'songs/OathToOrder.png', song_sun:'songs/SunSong.png',
  song_double_time:'songs/SongOfDoubleTime.png', song_inverted_time:'songs/InvertedSongOfTime.png', song_saria:'songs/SariaSong.png',
  remains_odolwa:'boss_remains/OdolwasRemains.png', remains_goht:'boss_remains/GohtsRemains.png', remains_gyorg:'boss_remains/GyorgsRemains.png',
  remains_twinmold:'boss_remains/TwinmoldsRemains.png', triforce:'boss_remains/TriforcePiece.png',
  double_defense:'equipment/DoubleDefense.png', great_spin_attack:'equipment/CycloneAttack.png', ability_swim:'equipment/swim.png',
  ocarina_button_a:'others/OcarinaA.png', ocarina_button_c_up:'others/OcarinaCUp.png', ocarina_button_c_down:'others/OcarinaCDown.png',
  ocarina_button_c_left:'others/OcarinaCLeft.png', ocarina_button_c_right:'others/OcarinaCRight.png', skeleton_key:'others/SkeletonKey.png',
  frog_white:'others/FrogGrey.png', frog_blue:'others/FrogBlue.png', frog_cyan:'others/FrogCyan.png', frog_pink:'others/FrogPink.png',
  time_day_1:'others/Day1.png', time_night_1:'others/Night1.png', time_day_2:'others/Day2.png', time_night_2:'others/Night2.png',
  time_day_3:'others/Day3.png', time_night_3:'others/Night3.png',
  ...Object.fromEntries(['clock_town_south', 'milk_road', 'southern_swamp', 'woodfall', 'mountain_village', 'snowhead', 'great_bay_coast', 'zora_cape',
    'ikana_canyon', 'stone_tower'].map(o => ['owl_' + o, 'others/OwlFace.png'])),
  // âmes : une icône commune aux boss (Majora : la sienne), une aux ennemis (le nom au survol)
  ...Object.fromEntries(CHECKS_DATA.items.filter(i => /^RI_SOUL_(BOSS|ENEMY)_/.test(i.id))
    .map(i => [i.id.replace(/^RI_/, '').toLowerCase(), /BOSS/.test(i.id) ? 'dungeons/soulBoss.png' : 'others/soulEnemy.png'])),
  soul_boss_majora:'others/MajoraSoul.png',
};
const ITEM_BY_KEY = {};
ITEM_GROUPS.forEach(g => g.items.forEach(it => {
  it.group = g.id; ITEM_BY_KEY[it.key] = it;
  const ic = ITEM_ICONS[it.key];
  if (Array.isArray(ic)) it.icons = ic; else if (ic) it.icon = ic;
}));
/* Mise en page du panneau Objets : quels objets dans quel bloc visuel (métadonnées : ITEM_GROUPS). En tête : restes des
   boss en cercle autour de la Triforce, placés comme sur la carte de Termina (Rhork au nord, Skorn à l'est, Odolwa au sud,
   Gyorg à l'ouest). Équipement : grille de lignes (« clé » ou « clé:palier » — une case par palier d'un objet à paliers ;
   cases voisines du même objet reliées, comme la chaîne des épées). Les objets placés ici ne sont plus repris dans les
   cartes par groupe (ITEMS_PLACED). À droite de l'équipement : les six demi-journées (temps mélangé ; js/pages/items.js,
   timeCells). Masques, juste sous l'équipement et sans titre : les masques de transformation en grand sur une ligne,
   reliés, puis les autres (ordre de l'écran de pause). Objets, sous les masques et sans titre : cadres deux par ligne
   (comme l'Œil Sheikah ; sub : petite ligne reliée sous le cadre, les flèches sous l'arc ; cols:2 : 2 × 2). Musique, sous
   les objets et sans titre, en cadres aussi : l'Ocarina (et ses touches en petit à côté, comme sur la manette : pad) et les
   chants du temps, puis ceux des donjons, du scénario, annexes (big : case plus grande ; small : cases un peu plus petites,
   pour tenir sur la ligne). Cases non visibles (Chant de Saria, touches non mélangées) : retirées du cadre. lists : groupes
   longs ramenés à un bouton avec compteur, qui ouvre une fenêtre à cocher (statues de hibou, âmes des ennemis). Âmes des boss : dans leur temple (DUNGEONS, soul). */
const ITEMS_PAGE = {
  quest:{ ring:['remains_goht', 'remains_twinmold', 'remains_odolwa', 'remains_gyorg'], center:'triforce' },
  equipment:[
    ['double_defense', 'heart_containers', 'heart_pieces', 'magic'],
    ['sword:1', 'sword:2', 'sword:3', 'great_spin_attack'],
    ['shield_hero', 'shield_mirror', 'wallet', 'bombers_notebook'],
  ].map(row => row.map(c => { const [k, n] = c.split(':'); return { k, stage:+n || 0 }; })),
  masks:{ big:['mask_deku', 'mask_goron', 'mask_zora', 'mask_fierce_deity'] },
  boxRows:[
    [{ items:['deku_stick', 'deku_nut'] }, { items:['bomb_bag', 'bombchu', 'powder_keg'] }],
    [{ items:['hookshot', 'bow', 'great_fairy_sword'], sub:['arrow_fire', 'arrow_ice', 'arrow_light'] },
     { items:['lens', 'magic_bean', 'pictograph_box', 'bottles'], cols:2 }],
  ],
  songRows:[
    [{ items:['ocarina'], big:'ocarina', pad:true, small:true },
     { items:['song_inverted_time', 'song_time', 'song_double_time'], big:'song_time', small:true }],
    [{ items:['song_sonata', 'lullaby', 'song_nova', 'song_elegy'] }, { items:['song_healing', 'song_oath'] }],
    [{ items:['song_epona', 'song_soaring', 'song_storms', 'song_sun', 'song_saria'] }],
  ],
  lists:[{ id:'owls', icon:'others/OwlFace.png' }, { id:'enemySouls', icon:'others/soulEnemy.png', sort:true }],
  // grenouilles du chœur de Don Gero : dans la carte à part (fée de Bourg-Clocher, Nage, Skulltulas), en dernière ligne
  frogs:['frog_white', 'frog_blue', 'frog_cyan', 'frog_pink'],
  // échanges : Larme de Lune et titres de propriété, puis la quête d'Anju et Kafei
  tradeRows:[
    [{ items:['moons_tear', 'deed_land', 'deed_swamp', 'deed_mountain', 'deed_ocean'] }],
    [{ items:['room_key', 'letter_to_kafei', 'letter_to_mama', 'pendant_of_memories'] }],
  ],
};
const TIME_HALVES = ['day_1', 'night_1', 'day_2', 'night_2', 'day_3', 'night_3'];
const ITEMS_PLACED = new Set([...ITEMS_PAGE.quest.ring, ITEMS_PAGE.quest.center, ...ITEMS_PAGE.equipment.flat().map(c => c.k),
  ...TIME_HALVES.map(h => 'time_' + h), 'time_progressive', ...ITEMS_PAGE.songRows.flat().flatMap(b => b.items),
  ...['a', 'c_up', 'c_down', 'c_left', 'c_right'].map(b => 'ocarina_button_' + b),
  ...ITEM_GROUPS.filter(g => ['owls', 'enemySouls', 'souls'].includes(g.id)).flatMap(g => g.items.map(it => it.key)), 'skeleton_key', 'ability_swim',
  ...ITEMS_PAGE.frogs]);
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
const SPIDER_HOUSES = [{ id:'swamp', label:t('Maison des Araignées des Marais'), short:t('Marais'), icon:'others/SwampSkulltula.png' },
  { id:'ocean', label:t('Maison des Araignées de la Côte'), short:t('Côte'), icon:'others/OceanSkulltula.png' }];

const itemMax = it => typeof it.max === 'function' ? it.max(store.settings) : it.max ?? it.stages?.length - 1;
const itemVisible = it => !it.visible || it.visible(store.settings);
const itemActive = (it, v) => it.kind === 'bool' ? !!v : it.key === 'wallet' ? true : v > 0;
const itemMaxed = it => { const v = store.game.items[it.key]; return it.kind === 'count' ? v >= (it.goal ? it.goal(store.settings) : itemMax(it)) : v >= itemMax(it); };
function iconSrc(it){
  const v = store.game.items[it.key];
  if (it.stageOf) return iconSrc(ITEM_BY_KEY[it.stageOf(Math.min(6, Math.max(1, v)), store.settings)]);   // (temps progressif)
  if (it.kind === 'level' && it.icons) return 'icons/' + it.icons[Math.max(1, v) - 1];
  return 'icons/' + (it.icon || 'items/' + it.key + '.png');
}
// sigle d'une tuile sans image : initiales des mots significatifs
const itemAbbr = it => (it.label.replace(/\(.*?\)/g, '').match(/[A-Za-zÀ-ÿ0-9]+/g) || ['?'])
  .filter(w => !/^(de|du|des|la|le|les|l|d|of|the)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
function itemTitle(it){
  const v = store.game.items[it.key];
  if (it.kind === 'level') return it.label + (it.stages[v] ? ' : ' + it.stages[v] : '');
  if (it.kind === 'count') return it.label + ' : ' + v + ' / ' + itemMax(it) + (it.stageOf && v ? ' — ' + ITEM_BY_KEY[it.stageOf(Math.min(6, v), store.settings)].label : '');
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
/* Demi-journée de départ (StartingItems.cpp) : temps mélangé sans demi-journée parmi les objets de départ choisis (start) —
   au hasard, tirée avec la seed (Ship_Random_Seed(finalSeed) puis Ship_Random(0, 6), dans l'ordre de l'énumération de
   2Ship : jours 1 à 3 puis nuits 1 à 3) ; progressif, un temps progressif. Absente du spoiler et de la sauvegarde. */
function startingTimeItems(s, start, seed){
  if (!s.RO_CLOCK_SHUFFLE || start.some(ri => /^RI_TIME_/.test(ri))) return [];
  if (s.RO_CLOCK_SHUFFLE_PROGRESSIVE !== RO.RO_CLOCK_SHUFFLE_RANDOM) return ['RI_TIME_PROGRESSIVE'];
  return [['RI_TIME_DAY_1', 'RI_TIME_DAY_2', 'RI_TIME_DAY_3', 'RI_TIME_NIGHT_1', 'RI_TIME_NIGHT_2', 'RI_TIME_NIGHT_3'][shipRandom(seed >>> 0)(0, 6)]];
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
