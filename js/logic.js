/* ---------- Logique de 2Ship (notre portage de Rando/Logic : Logic.h, Logic.cpp, TimeLogic.cpp, GlitchlessLogic.cpp) ----------
   Données : window.LOGIC_DATA (data/logic-data.js, généré par tools/2ship-logic/extract_logic.mjs) — régions, checks,
   sorties, liaisons, événements, restrictions d'attente, conditions en fonctions sur le contexte global L.
   - Temps : 45 tranches (TimeSlice) en champ de bits (BigInt) ; LT = tranches de la région évaluée (gCurrentRegionTime).
   - État LS (objets, équipement, chants, drapeaux…) : stateFromGame (panneau Objets) ou fullState (tout obtenu).
   - computeLogic(LS, settings) : exploration comme le remplissage de 2Ship (FindReachableRegions, ExpandTimeForward,
     événements jusqu'au point fixe), sans placer d'objets : l'état reste celui donné. → régions et leurs tranches,
     événements, et pour chaque check : en logique (comme 2Ship : condition vraie sur les tranches de la région) et
     moments possibles (condition vraie tranche par tranche).
   Pur (sans Vue) : lit store seulement via ses arguments. */
const LOGIC = window.LOGIC_DATA;
const SLICE_COUNT = LOGIC.slices.length;   // 45
const ALL_SLICES = (1n << BigInt(SLICE_COUNT)) - 1n;
const bitOf = s => 1n << BigInt(s);
// demi-journées : tranches de chacune (HALF_DAY_TIME_RANGES de Logic.h) — J1, N1, J2, N2, J3, N3
const HALF_DAYS = [[0, 6], [7, 15], [16, 22], [23, 30], [31, 36], [37, 44]];
const HALF_MASK = HALF_DAYS.map(([a, b]) => { let m = 0n; for (let s = a; s <= b; s++) m |= bitOf(s); return m; });
const REGION = Object.fromEntries(LOGIC.regions.map(r => [r.id, r]));

// libellé d'une tranche : « TIME_DAY2_AM_11_30 » → { day:2, night:false, h:11, m:30 }
const SLICE_INFO = LOGIC.slices.map(n => {
  const m = /^TIME_(DAY|NIGHT)(\d)_(AM|PM)_(\d\d)_(\d\d)$/.exec(n);
  const h12 = Number(m[4]) % 12, h = m[3] === 'PM' ? h12 + 12 : h12;
  return { day:Number(m[2]), night:m[1] === 'NIGHT', h, m:Number(m[5]) };
});

// chants : index de quête (z64item.h) et chants d'ocarina (z64ocarina.h) ; CAN_PLAY_SONG(X) teste les notes du chant
// d'ocarina (QUEST_SONG_X − QUEST_SONG_SONATA) + OCARINA_SONG_SONATA, comme 2Ship (Intro de la Berceuse : index 18)
const QUEST_SONG_IDX = { SONATA:6, LULLABY:7, BOSSA_NOVA:8, ELEGY:9, OATH:10, SARIA:11, TIME:12, HEALING:13, EPONA:14,
  SOARING:15, STORMS:16, SUN:17, LULLABY_INTRO:24 };
const OCARINA_SONGS = ['SONATA', 'GORON_LULLABY', 'NEW_WAVE', 'ELEGY', 'OATH', 'SARIAS', 'TIME', 'HEALING', 'EPONAS', 'SOARING',
  'STORMS', 'SUNS', 'INVERTED_TIME', 'DOUBLE_TIME', 'GORON_LULLABY_INTRO', 'WIND_FISH_HUMAN', 'WIND_FISH_GORON', 'WIND_FISH_ZORA',
  'WIND_FISH_DEKU', 'EVAN_PART1', 'EVAN_PART2', 'ZELDAS_LULLABY', 'SCARECROW_SPAWN', 'TERMINA_WALL'];
// notes (touches) de chaque chant d'ocarina (canPlaySong de Logic.h) ; absent : jouable
const SONG_BUTTONS = {
  SONATA:['C_UP', 'C_LEFT', 'A', 'C_RIGHT'], GORON_LULLABY:['A', 'C_RIGHT', 'C_LEFT'], GORON_LULLABY_INTRO:['A', 'C_RIGHT', 'C_LEFT'],
  NEW_WAVE:['C_LEFT', 'C_UP', 'C_RIGHT', 'C_DOWN'], ELEGY:['C_LEFT', 'C_UP', 'C_RIGHT', 'C_DOWN'],
  OATH:['C_RIGHT', 'C_LEFT', 'C_DOWN', 'A', 'C_UP'], WIND_FISH_ZORA:['C_RIGHT', 'C_LEFT', 'C_DOWN', 'A', 'C_UP'],
  TIME:['C_RIGHT', 'A', 'C_DOWN'], INVERTED_TIME:['C_RIGHT', 'A', 'C_DOWN'], DOUBLE_TIME:['C_RIGHT', 'A', 'C_DOWN'],
  WIND_FISH_GORON:['C_RIGHT', 'A', 'C_DOWN'], EVAN_PART1:['C_RIGHT', 'A', 'C_DOWN'],
  HEALING:['C_LEFT', 'C_RIGHT', 'C_DOWN'], SARIAS:['C_LEFT', 'C_RIGHT', 'C_DOWN'], EVAN_PART2:['C_LEFT', 'C_RIGHT', 'C_DOWN'],
  EPONAS:['C_UP', 'C_LEFT', 'C_RIGHT'], WIND_FISH_HUMAN:['C_UP', 'C_LEFT', 'C_RIGHT'], SOARING:['C_DOWN', 'C_LEFT', 'C_UP'],
  STORMS:['A', 'C_DOWN', 'C_UP'], SUNS:['C_RIGHT', 'C_DOWN', 'C_UP'], WIND_FISH_DEKU:['C_RIGHT', 'A', 'C_DOWN', 'C_LEFT'],
  TERMINA_WALL:['A', 'C_DOWN', 'C_RIGHT', 'C_LEFT', 'C_UP'],
};
// masques comptés pour la Lune et Majora (ITEM_MASK_TRUTH à ITEM_MASK_GIANT dans l'ordre de z64item.h)
const MOON_MASKS = ['TRUTH', 'KAFEIS_MASK', 'ALL_NIGHT', 'BUNNY', 'KEATON', 'GARO', 'ROMANI', 'CIRCUS_LEADER', 'POSTMAN', 'COUPLE',
  'GREAT_FAIRY', 'GIBDO', 'DON_GERO', 'KAMARO', 'CAPTAIN', 'STONE', 'BREMEN', 'BLAST', 'SCENTS', 'GIANT'].map(m => 'ITEM_MASK_' + m);
const DUNGEON_INDEX = { WOODFALL_TEMPLE:'woodfall', SNOWHEAD_TEMPLE:'snowhead', GREAT_BAY_TEMPLE:'greatBay', STONE_TOWER_TEMPLE:'stoneTower' };
const dgOf = idx => DUNGEON_INDEX[String(idx).replace(/^DUNGEON_SCENE_INDEX_/, '')];

/* ---------- Contexte L (lu par les conditions de logic-data.js) ---------- */
let LS = null, LT = 0n;   // état évalué, tranches courantes
const L = {
  // --- temps (Logic.h : TIME OPERATOR FUNCTIONS, COMPOSITE TIME CHECKS) ---
  RawAt:s => (LT & bitOf(s)) !== 0n,
  RawBefore:s => s !== 0 && (LT & (bitOf(s) - 1n)) !== 0n,
  RawAfter:s => (LT & ~(bitOf(s) - 1n) & ALL_SLICES) !== 0n,
  RawBetween:(a, b) => (LT & ((bitOf(b) - 1n) & ~(bitOf(a) - 1n))) !== 0n,
  OwnsHalfDayForMode:i => ownsHalfDayForMode(i),
  CLOCK_DAY1:() => ownsHalfDayForMode(0), CLOCK_NIGHT1:() => ownsHalfDayForMode(1), CLOCK_DAY2:() => ownsHalfDayForMode(2),
  CLOCK_NIGHT2:() => ownsHalfDayForMode(3), CLOCK_DAY3:() => ownsHalfDayForMode(4), CLOCK_NIGHT3:() => ownsHalfDayForMode(5),
  IS_DAY1:() => L.RawBefore(7) && L.CLOCK_DAY1(),
  IS_NIGHT1:() => L.RawBetween(7, 16) && L.CLOCK_NIGHT1(),
  IS_DAY2:() => L.RawBetween(16, 23) && L.CLOCK_DAY2(),
  IS_NIGHT2:() => L.RawBetween(23, 31) && L.CLOCK_NIGHT2(),
  IS_DAY3:() => L.RawBetween(31, 37) && L.CLOCK_DAY3(),
  IS_NIGHT3:() => L.RawAfter(37) && L.CLOCK_NIGHT3(),
  ClockFilter:() => !LS.opt.RO_CLOCK_SHUFFLE || L.IS_DAY1() || L.IS_NIGHT1() || L.IS_DAY2() || L.IS_NIGHT2() || L.IS_DAY3() || L.IS_NIGHT3(),
  IS_DAY:() => L.IS_DAY1() || L.IS_DAY2() || L.IS_DAY3(),
  IS_NIGHT:() => L.IS_NIGHT1() || L.IS_NIGHT2() || L.IS_NIGHT3(),
  FIRST_DAY:() => L.IS_DAY1() || L.IS_NIGHT1(),
  SECOND_DAY:() => L.IS_DAY2() || L.IS_NIGHT2(),
  FINAL_DAY:() => L.IS_DAY3() || L.IS_NIGHT3(),
  AT:s => L.RawAt(s) && L.ClockFilter(),
  BEFORE:s => L.RawBefore(s) && L.ClockFilter(),
  AFTER:s => L.RawAfter(s) && L.ClockFilter(),
  BETWEEN:(a, b) => L.RawBetween(a, b) && L.ClockFilter(),
  MIDNIGHT:() => L.BETWEEN(12, 16) || L.BETWEEN(28, 31) || L.AFTER(42),
  // --- objets, équipement, quête, drapeaux ---
  HAS_ITEM:it => LS.items.has(it),
  GET_CUR_EQUIP_VALUE:type => type === 'EQUIP_TYPE_SWORD' ? LS.sword : type === 'EQUIP_TYPE_SHIELD' ? LS.shield : 0,
  CUR_UPG_VALUE:u => u === 'UPG_WALLET' ? LS.wallet : 0,
  GET_CUR_UPG_VALUE:u => L.CUR_UPG_VALUE(u),
  CHECK_QUEST_ITEM:q => LS.quest.has(q),
  CHECK_DUNGEON_ITEM:(what, idx) => what === 'DUNGEON_BOSS_KEY' && !!LS.bossKey[dgOf(idx)],
  KEY_COUNT:d => LS.keys[DUNGEON_INDEX[d]] || 0,
  HAS_ENOUGH_STRAY_FAIRIES:idx => (LS.fairies[dgOf(idx)] || 0) >= LS.opt.RO_STRAY_FAIRIES_REQUIRED,
  HAS_ENOUGH_SKULLTULA_TOKENS:scene => (LS.tokens[scene] || 0) >= LS.opt.RO_SKULLTULA_TOKENS_REQUIRED,
  CHECK_WEEKEVENTREG:r => LS.week.has(r),
  CHECK_MAX_HP:n => n <= LS.hearts,
  Flags_GetRandoInf:f => LS.inf.has(f),
  get RANDO_EVENTS(){ return LS.events; },
  get RANDO_SAVE_OPTIONS(){ return LS.opt; },
  CAN_ACCESS:a => LS.events['RE_ACCESS_' + a] || 0,
  CAN_PLAY_SONG:song => L.HAS_ITEM('ITEM_OCARINA_OF_TIME') && L.CHECK_QUEST_ITEM('QUEST_SONG_' + song)
    && L.canPlaySong(OCARINA_SONGS[QUEST_SONG_IDX[song] - QUEST_SONG_IDX.SONATA]),
  canPlaySong:song => { const k = String(song).replace(/^OCARINA_SONG_/, '');
    if (k === 'SCARECROW_SPAWN') return LS.buttons.size >= 2;
    return (SONG_BUTTONS[k] || []).every(b => LS.buttons.has(b)); },
  CAN_USE_ABILITY:a => LS.inf.has('RANDO_INF_OBTAINED_' + a),
  CAN_USE_MAGIC_ARROW:t => L.HAS_ITEM('ITEM_BOW') && L.HAS_ITEM('ITEM_ARROW_' + t) && L.HAS_MAGIC,
  CAN_OWL_WARP:o => LS.owls.has(o),
  CanAccessDungeon(idx){
    const d = String(idx).replace(/^DUNGEON_SCENE_INDEX_/, ''), oc = L.HAS_ITEM('ITEM_OCARINA_OF_TIME');
    const [song, form] = d === 'WOODFALL_TEMPLE' ? [L.CAN_PLAY_SONG('SONATA'), L.CAN_BE_DEKU && oc]
      : d === 'SNOWHEAD_TEMPLE' ? [L.CAN_PLAY_SONG('LULLABY'), L.CAN_BE_GORON && oc]
      : d === 'GREAT_BAY_TEMPLE' ? [L.CAN_PLAY_SONG('BOSSA_NOVA'), L.CAN_BE_ZORA && oc] : [false, false];
    switch (LS.opt.RO_ACCESS_DUNGEONS){
      case RO.RO_ACCESS_DUNGEONS_FORM_OR_SONG: return song || form;
      case RO.RO_ACCESS_DUNGEONS_FORM_ONLY: return form;
      case RO.RO_ACCESS_DUNGEONS_SONG_ONLY: return song;
      case RO.RO_ACCESS_DUNGEONS_OPEN: return true;
      default: return song && form;
    }
  },
  MoonMaskCount:() => MOON_MASKS.filter(m => LS.items.has(m)).length,
  RemainsCount:() => ['ODOLWA', 'GOHT', 'GYORG', 'TWINMOLD'].filter(r => LS.quest.has('QUEST_REMAINS_' + r)).length,
  MeetsMoonRequirements:() => L.RemainsCount() >= LS.opt.RO_ACCESS_MOON_REMAINS_COUNT && L.MoonMaskCount() >= LS.opt.RO_ACCESS_MOON_MASKS_COUNT,
  HaveEnemySoul:actor => { const soul = LOGIC.souls[actor]; return !soul || LS.souls.has(soul); },
  CanKillEnemy:actor => {
    if (LS.opt.RO_SHUFFLE_ENEMY_SOULS && !L.HaveEnemySoul(actor)) return false;
    const f = LOGIC.kill[actor];
    if (!f) throw new Error('CanKillEnemy : ' + actor);
    return f();
  },
  // prix d'une boutique : connu (noté ou importé), sinon 0 pour un check pas mélangé, au pire 200 (tirés entre 0 et 200)
  CAN_AFFORD:rc => { const p = LS.price(rc); return p < 100 || (p <= 200 && LS.wallet >= 1) || LS.wallet >= 2; },
  // Regions/South.cpp
  CanGetPastBigOctoWithoutBoat:() => (!!L.RANDO_EVENTS.RE_SOUTHERN_SWAMP_KILL_OCTOROK && L.CAN_BE_DEKU)
    || (!!L.RANDO_EVENTS.RE_CLEARED_WOODFALL_TEMPLE && L.CAN_TRAVERSE_WAIST_DEEP_WATER),
  CanGetPastBigOcto:() => !!L.RANDO_EVENTS.RE_SOUTHERN_SWAMP_RIDE_BOAT || L.CanGetPastBigOctoWithoutBoat(),
};
// macros sans argument de Logic.h (lues comme des valeurs) ; Link est humain (OnFileCreate.cpp : PLAYER_FORM_HUMAN)
const getters = {
  CAN_BE_DEKU:() => L.HAS_ITEM('ITEM_MASK_DEKU'),
  CAN_BE_ZORA:() => L.HAS_ITEM('ITEM_MASK_ZORA'),
  CAN_BE_GORON:() => L.HAS_ITEM('ITEM_MASK_GORON'),
  CAN_BE_DEITY:() => L.HAS_ITEM('ITEM_MASK_FIERCE_DEITY'),
  CAN_BE_HUMAN:() => true,
  HAS_MAGIC:() => LS.magic,
  CAN_HOOK_SCARECROW:() => L.HAS_ITEM('ITEM_OCARINA_OF_TIME') && L.HAS_ITEM('ITEM_HOOKSHOT') && L.canPlaySong('OCARINA_SONG_SCARECROW_SPAWN'),
  CAN_USE_EXPLOSIVE:() => L.HAS_ITEM('ITEM_BOMB') || L.HAS_ITEM('ITEM_BOMBCHU') || (L.HAS_ITEM('ITEM_MASK_BLAST') && LS.shield > 0),
  CAN_USE_HUMAN_SWORD:() => LS.sword >= 1,
  CAN_USE_SWORD:() => L.CAN_USE_HUMAN_SWORD || L.HAS_ITEM('ITEM_SWORD_GREAT_FAIRY') || L.CAN_BE_DEITY,
  CAN_FULLY_CUT_KEATON_GRASS:() => L.HAS_MAGIC && LS.sword >= 2 && L.CHECK_WEEKEVENTREG('WEEKEVENTREG_RECEIVED_GREAT_SPIN_ATTACK'),
  CAN_RIDE_EPONA:() => L.CAN_PLAY_SONG('EPONA'),
  GBT_CAN_REVERSE_WATER_FLOW:() => !!LS.events.RE_GREAT_BAY_RED_SWITCH_1 && !!LS.events.RE_GREAT_BAY_RED_SWITCH_2 && L.HAS_ITEM('ITEM_HOOKSHOT'),
  GBT_GREEN_SWITCH_FLOW:() => !!LS.events.RE_GREAT_BAY_GREEN_SWITCH_1 && !!LS.events.RE_GREAT_BAY_GREEN_SWITCH_2 && !!LS.events.RE_GREAT_BAY_GREEN_SWITCH_3,
  HAS_BOTTLE:() => L.HAS_ITEM('ITEM_BOTTLE'),
  CAN_USE_PROJECTILE:() => L.HAS_ITEM('ITEM_BOW') || L.HAS_ITEM('ITEM_HOOKSHOT') || (L.CAN_BE_DEKU && L.HAS_MAGIC) || L.CAN_BE_ZORA,
  CAN_GROW_BEAN_PLANT:() => L.HAS_ITEM('ITEM_MAGIC_BEANS') && (L.CAN_PLAY_SONG('STORMS') || (L.HAS_BOTTLE && (!!L.CAN_ACCESS('SPRING_WATER') || !!L.CAN_ACCESS('HOT_SPRING_WATER')))),
  CAN_USE_DAY2_RAIN_BEAN:() => L.CAN_GROW_BEAN_PLANT || (L.HAS_ITEM('ITEM_MAGIC_BEANS') && L.CLOCK_DAY2()),
  CAN_LIGHT_TORCH_NEAR_ANOTHER:() => L.HAS_ITEM('ITEM_DEKU_STICK') || L.CAN_USE_MAGIC_ARROW('FIRE'),
  FOUND_ALL_FROGS:() => ['WEEKEVENTREG_33_01', 'WEEKEVENTREG_32_40', 'WEEKEVENTREG_32_80', 'WEEKEVENTREG_33_02'].every(r => LS.week.has(r)),
  ...LOGIC.locals,   // macros locales des fichiers de régions (CAN_TRAVERSE_WAIST_DEEP_WATER…)
};
for (const [k, f] of Object.entries(getters)) Object.defineProperty(L, k, { get:f, enumerable:true });

/* ---------- Horloges (temps mélangé) ---------- */
function ownsClockHalfDay(i){ return !!LS.clocks[i]; }
function ownsHalfDayForMode(i){
  if (!LS.opt.RO_CLOCK_SHUFFLE || i < 0 || i > 5) return !LS.opt.RO_CLOCK_SHUFFLE;
  const n = LS.clocks.filter(Boolean).length;
  switch (LS.opt.RO_CLOCK_SHUFFLE_PROGRESSIVE){
    case RO.RO_CLOCK_SHUFFLE_RANDOM: return ownsClockHalfDay(i);
    case RO.RO_CLOCK_SHUFFLE_ASCENDING: return n > i;
    case RO.RO_CLOCK_SHUFFLE_DESCENDING: return n > 5 - i;
    default: return false;
  }
}
// tranches possédées (TimeLogic.cpp, GetOwnedTimeSlices) : toutes sans temps mélangé ; aucune → J1 6 h
function ownedTimeSlices(){
  if (!LS.opt.RO_CLOCK_SHUFFLE) return ALL_SLICES;
  let m = 0n;
  for (let i = 0; i < 6; i++) if (ownsClockHalfDay(i)) m |= HALF_MASK[i];
  return m || bitOf(0);
}
const timeSliceOwned = s => !LS.opt.RO_CLOCK_SHUFFLE || HALF_DAYS.some(([a, b], i) => s >= a && s <= b && ownsClockHalfDay(i));
// attente dans une région (ExpandTimeForward) : sans restriction ni temps mélangé, toutes les tranches qui suivent ;
// sinon tranche par tranche, et l'attente s'arrête à la première restriction non remplie (ou tranche non possédée)
function expandTimeForward(time, region){
  if (!region.stay.length && !LS.opt.RO_CLOCK_SHUFFLE){
    if (!time) return 0n;
    let low = 0; while (!(time & bitOf(low))) low++;
    return ALL_SLICES & ~(bitOf(low) - 1n);
  }
  let t = LS.opt.RO_CLOCK_SHUFFLE ? time & ownedTimeSlices() : time, out = t, canWait = false;
  const stay = new Map(region.stay);
  for (let i = 0; i < SLICE_COUNT; i++){
    const b = bitOf(i);
    if (t & b){ canWait = true; out |= b; continue; }
    if (!canWait) continue;
    if (LS.opt.RO_CLOCK_SHUFFLE && !timeSliceOwned(i)){ canWait = false; continue; }
    const f = stay.get(i);
    if (!f){ out |= b; continue; }
    const saved = LT; LT = out;
    const ok = f(); LT = saved;
    if (ok) out |= b; else canWait = false;
  }
  return out;
}

/* ---------- Exploration (Logic.cpp, FindReachableRegions ; GlitchlessLogic.cpp) ----------
   times : région → { t:tranches, stay:attente possible }. La région rejointe reçoit toutes les tranches de la région de
   départ (comme 2Ship), puis y attend si elle le peut. */
function findReachable(id, reached, times){
  if (!times.has(id)) times.set(id, { t:ownedTimeSlices(), stay:REGION[id].wait });
  const src = REGION[id], st = times.get(id);
  let cur = st.t;
  if (st.stay){ cur = expandTimeForward(cur, src); st.t = cur; }
  const go = to => {
    const target = REGION[to], incoming = { t:cur, stay:target.wait }, ex = times.get(to);
    if (ex){
      if ((ex.t | incoming.t) === ex.t) return;   // déjà couvert
      ex.t |= incoming.t; ex.stay = ex.stay || incoming.stay;
    } else { reached.add(to); times.set(to, incoming); }
    findReachable(to, reached, times);
  };
  for (const [to, f] of src.conns){ LT = cur; if (f()) go(to); }
  for (const [to, f] of src.exits){ LT = cur; if (f()) go(to); }
}
function computeLogic(state){
  LS = state;
  LS.events = {};   // (recalculés à chaque fois)
  const reached = new Set(['RR_MAX']), times = new Map();
  times.set('RR_MAX', { t:LS.opt.RO_CLOCK_SHUFFLE ? ownedTimeSlices() : bitOf(0), stay:false });
  const eventsDone = new Set();
  for (let guard = 0; guard < 500; guard++){
    const before = reached.size;
    for (const id of [...reached]) findReachable(id, reached, times);
    let changed = reached.size !== before;
    for (const id of reached){
      const r = REGION[id];
      LT = times.get(id).t;
      r.events.forEach(([ev, f], i) => {
        const key = id + '#' + i;
        if (!eventsDone.has(key) && f()){ LS.events[ev] = (LS.events[ev] || 0) + 1; eventsDone.add(key); changed = true; }
      });
    }
    if (!changed) break;
  }
  /* Moments (affichage) : un événement de 2Ship, une fois acquis, vaut pour tout le cycle. Pour les moments, on calcule la
     première tranche où chaque événement peut avoir lieu (sa condition, tranche par tranche, avec les événements déjà
     possibles à cette tranche), jusqu'au point fixe ; à une tranche, un événement ne compte que s'il a pu avoir lieu avant
     (tout est remis à zéro à chaque cycle). */
  const allEvents = LS.events, firsts = new Map();   // entrée d'événement → première tranche
  const entries = [];
  for (const id of reached) REGION[id].events.forEach(([ev, f], i) => { if (eventsDone.has(id + '#' + i)) entries.push({ key:id + '#' + i, ev, f, rt:times.get(id).t }); });
  let at = 0;
  const gated = new Proxy({}, { get:(o, ev) => entries.filter(e => e.ev === ev && firsts.get(e.key) <= at).length });
  LS.events = gated;
  for (let round = 0, changed = true; changed && round < 60; round++){
    changed = false;
    for (const e of entries){
      const cur = firsts.get(e.key) ?? Infinity;
      for (let s = 0; s < Math.min(cur, SLICE_COUNT); s++){
        if (!(e.rt & bitOf(s))) continue;
        at = s; LT = bitOf(s);
        if (e.f()){ firsts.set(e.key, s); changed = true; break; }
      }
    }
  }
  // checks : en logique (événements acquis, condition sur toutes les tranches de la région, comme 2Ship) ; moments :
  // tranche par tranche, événements « déjà possibles » (sinon, à défaut, comme en logique)
  const checks = {};
  for (const id of reached){
    const r = REGION[id], rt = times.get(id).t;
    for (const [rc, f] of r.checks){
      const c = checks[rc] || (checks[rc] = { ok:false, when:0n });
      LS.events = allEvents; LT = rt;
      if (!f()) continue;
      c.ok = true;
      let when = 0n;
      LS.events = gated;
      for (let s = 0; s < SLICE_COUNT; s++){ const b = bitOf(s); if (rt & b){ at = s; LT = b; if (f()) when |= b; } }
      if (!when){ LS.events = allEvents; for (let s = 0; s < SLICE_COUNT; s++){ const b = bitOf(s); if (rt & b){ LT = b; if (f()) when |= b; } } }
      c.when |= when || rt;   // (condition vraie seulement sur plusieurs tranches à la fois : celles de la région)
    }
  }
  const evFirst = {};
  for (const e of entries) if (firsts.has(e.key)) evFirst[e.ev] = Math.min(evFirst[e.ev] ?? Infinity, firsts.get(e.key));
  const out = { regions:Object.fromEntries([...times].filter(([id]) => reached.has(id)).map(([id, v]) => [id, v.t])), events:{ ...allEvents }, evFirst, checks };
  LS = null;
  return out;
}

/* ---------- État de la partie ---------- */
// objets du panneau → objets du jeu (HAS_ITEM) ; masques : ITEM_<clé>
const PANEL_ITEM = { ocarina:'ITEM_OCARINA_OF_TIME', arrow_fire:'ITEM_ARROW_FIRE', arrow_ice:'ITEM_ARROW_ICE', arrow_light:'ITEM_ARROW_LIGHT',
  bombchu:'ITEM_BOMBCHU', deku_stick:'ITEM_DEKU_STICK', deku_nut:'ITEM_DEKU_NUT', magic_bean:'ITEM_MAGIC_BEANS', powder_keg:'ITEM_POWDER_KEG',
  pictograph_box:'ITEM_PICTOGRAPH_BOX', lens:'ITEM_LENS_OF_TRUTH', hookshot:'ITEM_HOOKSHOT', great_fairy_sword:'ITEM_SWORD_GREAT_FAIRY',
  room_key:'ITEM_ROOM_KEY', moons_tear:'ITEM_MOONS_TEAR' };
// chants du panneau → quête
const PANEL_SONG = { song_time:'TIME', song_healing:'HEALING', song_epona:'EPONA', song_soaring:'SOARING', song_storms:'STORMS',
  song_sonata:'SONATA', song_nova:'BOSSA_NOVA', song_elegy:'ELEGY', song_oath:'OATH', song_sun:'SUN', song_saria:'SARIA' };
// grenouilles → drapeaux de la chorale (GiveItem.cpp)
const FROG_WEEK = { frog_blue:'WEEKEVENTREG_32_40', frog_cyan:'WEEKEVENTREG_32_80', frog_pink:'WEEKEVENTREG_33_01', frog_white:'WEEKEVENTREG_33_02' };
function emptyState(settings){
  return { opt:settings, items:new Set(), quest:new Set(), inf:new Set(), week:new Set(), owls:new Set(), souls:new Set(),
    buttons:new Set(), clocks:[false, false, false, false, false, false], sword:0, shield:0, wallet:0, magic:false, hearts:3,
    keys:{}, bossKey:{}, fairies:{}, tokens:{}, events:{}, price:() => 0 };
}
/* État d'après le panneau Objets (et les objets donnés d'office : computedStartingItems). prices : prix connus { RC: rubis } ;
   check de boutique mélangé sans prix connu : 200 (au pire). */
function stateFromGame(game, settings, prices){
  const S0 = emptyState(settings), it = game.items;
  const on = k => { const v = it[k]; return typeof v === 'number' ? v > 0 : !!v; };
  for (const [k, item] of Object.entries(PANEL_ITEM)) if (on(k)) S0.items.add(item);
  for (const k of Object.keys(it)) if (/^mask_/.test(k) && on(k)) S0.items.add('ITEM_' + k.toUpperCase());
  if (on('bow')) S0.items.add('ITEM_BOW');
  if (on('bomb_bag')) S0.items.add('ITEM_BOMB'), S0.items.add('ITEM_BOMBCHU');   // (le sac donne aussi les Missiles Teigneux)
  if (on('bottles')) S0.items.add('ITEM_BOTTLE');
  for (const [k, sg] of Object.entries(PANEL_SONG)) if (on(k)) S0.quest.add('QUEST_SONG_' + sg);
  if (it.lullaby >= 1) S0.quest.add('QUEST_SONG_LULLABY_INTRO');
  if (it.lullaby >= 2) S0.quest.add('QUEST_SONG_LULLABY');
  if (on('song_double_time')) S0.inf.add('RANDO_INF_OBTAINED_SONG_DOUBLE_TIME');
  if (on('song_inverted_time')) S0.inf.add('RANDO_INF_OBTAINED_SONG_INVERTED_TIME');
  ['ODOLWA', 'GOHT', 'GYORG', 'TWINMOLD'].forEach(r => { if (on('remains_' + r.toLowerCase())) S0.quest.add('QUEST_REMAINS_' + r); });
  ['moons_tear', 'deed_land', 'deed_swamp', 'deed_mountain', 'deed_ocean', 'room_key', 'letter_to_kafei', 'letter_to_mama', 'pendant_of_memories']
    .forEach(k => { if (on(k)) S0.inf.add('RANDO_INF_OBTAINED_' + k.toUpperCase()); });
  S0.sword = it.sword || 0;
  S0.shield = on('shield_mirror') ? 2 : on('shield_hero') ? 1 : 0;
  S0.wallet = it.wallet || 0;
  S0.magic = (it.magic || 0) >= 1;
  S0.hearts = settings.RO_STARTING_HEALTH + (it.heart_containers || 0) + Math.floor((it.heart_pieces || 0) / 4);
  if (on('great_spin_attack')) S0.week.add('WEEKEVENTREG_RECEIVED_GREAT_SPIN_ATTACK');
  if (game.townFairy) S0.week.add('WEEKEVENTREG_08_80');
  for (const [k, w] of Object.entries(FROG_WEEK)) if (on(k)) S0.week.add(w);
  if (on('ability_swim')) S0.inf.add('RANDO_INF_OBTAINED_SWIM');
  ['A', 'C_UP', 'C_DOWN', 'C_LEFT', 'C_RIGHT'].forEach(b => { if (on('ocarina_button_' + b.toLowerCase())) S0.buttons.add(b); });
  ['day_1', 'night_1', 'day_2', 'night_2', 'day_3', 'night_3'].forEach((h, i) => { if (on('time_' + h)) S0.clocks[i] = true; });
  const prog = Math.min(6, it.time_progressive || 0);   // progressif : dans l'ordre ou à rebours
  for (let i = 0; i < prog; i++) S0.clocks[settings.RO_CLOCK_SHUFFLE_PROGRESSIVE === RO.RO_CLOCK_SHUFFLE_DESCENDING ? 5 - i : i] = true;
  for (const k of Object.keys(it)) if (/^owl_/.test(k) && on(k)) S0.owls.add('OWL_WARP_' + k.slice(4).toUpperCase().replace(/^CLOCK_TOWN_SOUTH$/, 'CLOCK_TOWN'));
  for (const k of Object.keys(it)) if (/^soul_/.test(k) && on(k)) S0.souls.add('RI_' + k.toUpperCase());
  ['ODOLWA', 'GOHT', 'GYORG', 'TWINMOLD', 'MAJORA'].forEach(b => { if (S0.souls.has('RI_SOUL_BOSS_' + b)) S0.inf.add('RANDO_INF_OBTAINED_SOUL_OF_BOSS_' + b); });
  if (S0.souls.has('RI_SOUL_ENEMY_OCTOROK')) S0.inf.add('RANDO_INF_OBTAINED_SOUL_OF_ENEMY_OCTOROKS');
  for (const d of DUNGEONS){ const g = game.dungeons[d.id]; S0.keys[d.id] = g.keys; S0.bossKey[d.id] = g.bossKey; S0.fairies[d.id] = g.fairies; }
  if (on('skeleton_key')) for (const d of DUNGEONS) S0.keys[d.id] = Math.max(S0.keys[d.id], d.keys);
  S0.tokens = { SCENE_KINSTA1:game.tokens.swamp, SCENE_KINDAN2:game.tokens.ocean };
  S0.price = rc => prices && prices[rc] != null ? prices[rc] : checkShuffled(CHECK_BY_ID[rc] || { id:rc, cat:'SHOP' }, settings) ? 200 : 0;
  // objets donnés d'office selon la configuration
  for (const ri of computedStartingItems(settings)) applyRiToState(S0, ri);
  return S0;
}
// demi-journées possédées (temps mélangé ; sinon toutes) : [bool ×6], selon le mode (au hasard, dans l'ordre, à rebours)
function ownedHalfDays(game, settings){
  if (!settings.RO_CLOCK_SHUFFLE) return [true, true, true, true, true, true];
  LS = stateFromGame(game, settings);
  const out = [0, 1, 2, 3, 4, 5].map(ownsHalfDayForMode);
  LS = null;
  return out;
}
// quelques objets donnés d'office (computedStartingItems) appliqués directement à l'état (sans passer par le panneau)
function applyRiToState(S0, ri){
  if (ri === 'RI_ABILITY_SWIM') S0.inf.add('RANDO_INF_OBTAINED_SWIM');
  else if (/^RI_OCARINA_BUTTON_/.test(ri)) S0.buttons.add(ri.slice(18));
  else if (/^RI_SOUL_ENEMY_/.test(ri)){ S0.souls.add(ri); if (ri === 'RI_SOUL_ENEMY_OCTOROK') S0.inf.add('RANDO_INF_OBTAINED_SOUL_OF_ENEMY_OCTOROKS'); }
  else if (ri === 'RI_DEKU_STICK') S0.items.add('ITEM_DEKU_STICK');
  else if (ri === 'RI_DEKU_NUT') S0.items.add('ITEM_DEKU_NUT');
  else if (ri === 'RI_SONG_DOUBLE_TIME' || ri === 'RI_SONG_INVERTED_TIME') S0.inf.add('RANDO_INF_OBTAINED_' + ri.slice(3));
}
/* Objet de 2Ship (RI_…) appliqué à un état (comme GiveItem.cpp, pour ce que lit la logique) : rejeu des spoilers
   (tools/2ship-logic/replay_spoilers.mjs), et auto-tracking ensuite. */
const RI_ITEM = { RI_OCARINA:'OCARINA_OF_TIME', RI_ARROW_FIRE:'ARROW_FIRE', RI_ARROW_ICE:'ARROW_ICE', RI_ARROW_LIGHT:'ARROW_LIGHT',
  RI_MAGIC_BEAN:'MAGIC_BEANS', RI_POWDER_KEG:'POWDER_KEG', RI_PICTOGRAPH_BOX:'PICTOGRAPH_BOX', RI_LENS:'LENS_OF_TRUTH',
  RI_HOOKSHOT:'HOOKSHOT', RI_GREAT_FAIRY_SWORD:'SWORD_GREAT_FAIRY', RI_MUSHROOM:'MUSHROOM' };
const RI_SONG = { RI_SONG_TIME:'TIME', RI_SONG_HEALING:'HEALING', RI_SONG_EPONA:'EPONA', RI_SONG_SOARING:'SOARING', RI_SONG_STORMS:'STORMS',
  RI_SONG_SONATA:'SONATA', RI_SONG_NOVA:'BOSSA_NOVA', RI_SONG_ELEGY:'ELEGY', RI_SONG_OATH:'OATH', RI_SONG_SUN:'SUN', RI_SONG_SARIA:'SARIA',
  RI_SONG_LULLABY_INTRO:'LULLABY_INTRO', RI_SONG_LULLABY:'LULLABY' };
const RI_DUNGEON = { WOODFALL:'woodfall', SNOWHEAD:'snowhead', GREAT_BAY:'greatBay', STONE_TOWER:'stoneTower' };
function giveItem(S0, ri){
  let m;
  if (RI_ITEM[ri]) S0.items.add('ITEM_' + RI_ITEM[ri]);
  else if ((m = /^RI_MASK_(\w+)$/.exec(ri))) S0.items.add('ITEM_MASK_' + m[1]);
  else if (ri === 'RI_BOW' || ri === 'RI_PROGRESSIVE_BOW') S0.items.add('ITEM_BOW');
  else if (/^RI_(PROGRESSIVE_BOMB_BAG|BOMB_BAG_\d+)$/.test(ri)) S0.items.add('ITEM_BOMB').add('ITEM_BOMBCHU');
  else if (/^RI_BOMBCHU/.test(ri)) S0.items.add('ITEM_BOMBCHU');
  else if (/^RI_DEKU_STICK/.test(ri)) S0.items.add('ITEM_DEKU_STICK');
  else if (/^RI_DEKU_NUT/.test(ri)) S0.items.add('ITEM_DEKU_NUT');
  else if (/^RI_BOTTLE_/.test(ri)) S0.items.add('ITEM_BOTTLE');
  else if (/^RI_(MOONS_TEAR|DEED_\w+|ROOM_KEY|LETTER_TO_KAFEI|LETTER_TO_MAMA|PENDANT_OF_MEMORIES)$/.test(ri)){
    S0.inf.add('RANDO_INF_OBTAINED_' + ri.slice(3));
    if (ri === 'RI_ROOM_KEY') S0.items.add('ITEM_ROOM_KEY');
    if (ri === 'RI_MOONS_TEAR') S0.items.add('ITEM_MOONS_TEAR');
  }
  else if (ri === 'RI_PROGRESSIVE_SWORD') S0.sword = Math.min(3, S0.sword + 1);
  else if ((m = /^RI_SWORD_(KOKIRI|RAZOR|GILDED)$/.exec(ri))) S0.sword = Math.max(S0.sword, { KOKIRI:1, RAZOR:2, GILDED:3 }[m[1]]);
  else if (ri === 'RI_SHIELD_HERO') S0.shield = Math.max(S0.shield, 1);
  else if (ri === 'RI_SHIELD_MIRROR') S0.shield = 2;
  else if (ri === 'RI_PROGRESSIVE_WALLET') S0.wallet = Math.min(3, S0.wallet + 1);
  else if ((m = /^RI_WALLET_(ADULT|GIANT|TYCOON)$/.exec(ri))) S0.wallet = Math.max(S0.wallet, { ADULT:1, GIANT:2, TYCOON:3 }[m[1]]);
  else if (/^RI_(PROGRESSIVE_MAGIC|SINGLE_MAGIC|DOUBLE_MAGIC)$/.test(ri)) S0.magic = true;
  else if (ri === 'RI_GREAT_SPIN_ATTACK') S0.week.add('WEEKEVENTREG_RECEIVED_GREAT_SPIN_ATTACK');
  else if (ri === 'RI_HEART_PIECE'){ S0.pieces = (S0.pieces || 0) + 1; if (S0.pieces % 4 === 0) S0.hearts++; }
  else if (ri === 'RI_HEART_CONTAINER') S0.hearts++;
  else if (RI_SONG[ri]) S0.quest.add('QUEST_SONG_' + RI_SONG[ri]);
  else if (ri === 'RI_PROGRESSIVE_LULLABY') S0.quest.add(S0.quest.has('QUEST_SONG_LULLABY_INTRO') ? 'QUEST_SONG_LULLABY' : 'QUEST_SONG_LULLABY_INTRO');
  else if (ri === 'RI_SONG_DOUBLE_TIME' || ri === 'RI_SONG_INVERTED_TIME') S0.inf.add('RANDO_INF_OBTAINED_' + ri.slice(3));
  else if ((m = /^RI_REMAINS_(\w+)$/.exec(ri))) S0.quest.add('QUEST_REMAINS_' + m[1]);
  else if (ri === 'RI_ABILITY_SWIM') S0.inf.add('RANDO_INF_OBTAINED_SWIM');
  else if ((m = /^RI_OCARINA_BUTTON_(\w+)$/.exec(ri))) S0.buttons.add(m[1]);
  else if ((m = /^RI_TIME_(DAY|NIGHT)_(\d)$/.exec(ri))) S0.clocks[(Number(m[2]) - 1) * 2 + (m[1] === 'NIGHT' ? 1 : 0)] = true;
  else if (ri === 'RI_TIME_PROGRESSIVE'){
    const order = S0.opt.RO_CLOCK_SHUFFLE_PROGRESSIVE === RO.RO_CLOCK_SHUFFLE_DESCENDING ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
    const next = order.find(i => !S0.clocks[i]); if (next !== undefined) S0.clocks[next] = true;
  }
  else if ((m = /^RI_OWL_(\w+)$/.exec(ri))) S0.owls.add('OWL_WARP_' + m[1].replace(/^CLOCK_TOWN_SOUTH$/, 'CLOCK_TOWN'));
  else if ((m = /^RI_SOUL_BOSS_(\w+)$/.exec(ri))){ S0.souls.add(ri); S0.inf.add('RANDO_INF_OBTAINED_SOUL_OF_BOSS_' + m[1]); }
  else if (/^RI_SOUL_ENEMY_/.test(ri)){ S0.souls.add(ri); if (ri === 'RI_SOUL_ENEMY_OCTOROK') S0.inf.add('RANDO_INF_OBTAINED_SOUL_OF_ENEMY_OCTOROKS'); }
  else if ((m = /^RI_FROG_(\w+)$/.exec(ri))) S0.week.add(FROG_WEEK['frog_' + m[1].toLowerCase()]);
  else if (ri === 'RI_CLOCK_TOWN_STRAY_FAIRY') S0.week.add('WEEKEVENTREG_08_80');
  else if ((m = /^RI_(WOODFALL|SNOWHEAD|GREAT_BAY|STONE_TOWER)_(SMALL_KEY|BOSS_KEY|STRAY_FAIRY)$/.exec(ri))){
    const d = RI_DUNGEON[m[1]];
    if (m[2] === 'SMALL_KEY') S0.keys[d] = (S0.keys[d] || 0) + 1;
    else if (m[2] === 'BOSS_KEY') S0.bossKey[d] = true;
    else S0.fairies[d] = (S0.fairies[d] || 0) + 1;
  }
  else if (ri === 'RI_SKELETON_KEY') for (const d of DUNGEONS) S0.keys[d.id] = Math.max(S0.keys[d.id] || 0, d.keys);
  else if (ri === 'RI_GS_TOKEN_SWAMP') S0.tokens.SCENE_KINSTA1 = (S0.tokens.SCENE_KINSTA1 || 0) + 1;
  else if (ri === 'RI_GS_TOKEN_OCEAN') S0.tokens.SCENE_KINDAN2 = (S0.tokens.SCENE_KINDAN2 || 0) + 1;
  else if (ri === 'RI_TRIFORCE_PIECE' || ri === 'RI_TRIFORCE_PIECE_PREVIOUS'){
    S0.triforce = (S0.triforce || 0) + 1;
    if (S0.triforce === S0.opt.RO_TRIFORCE_PIECES_REQUIRED){ S0.souls.add('RI_SOUL_BOSS_MAJORA'); S0.inf.add('RANDO_INF_OBTAINED_SOUL_OF_BOSS_MAJORA'); }
  }
}
// tout obtenu (moments possibles de chaque check, quel que soit l'inventaire)
function fullState(settings){
  const S0 = emptyState(settings);
  ['OCARINA_OF_TIME', 'BOW', 'ARROW_FIRE', 'ARROW_ICE', 'ARROW_LIGHT', 'BOMB', 'BOMBCHU', 'DEKU_STICK', 'DEKU_NUT', 'MAGIC_BEANS',
    'POWDER_KEG', 'PICTOGRAPH_BOX', 'LENS_OF_TRUTH', 'HOOKSHOT', 'SWORD_GREAT_FAIRY', 'BOTTLE', 'ROOM_KEY', 'MOONS_TEAR',
    'MASK_DEKU', 'MASK_GORON', 'MASK_ZORA', 'MASK_FIERCE_DEITY'].forEach(i => S0.items.add('ITEM_' + i));
  MOON_MASKS.forEach(m => S0.items.add(m));
  Object.keys(QUEST_SONG_IDX).forEach(sg => S0.quest.add('QUEST_SONG_' + sg));
  ['ODOLWA', 'GOHT', 'GYORG', 'TWINMOLD'].forEach(r => S0.quest.add('QUEST_REMAINS_' + r));
  ['MOONS_TEAR', 'DEED_LAND', 'DEED_SWAMP', 'DEED_MOUNTAIN', 'DEED_OCEAN', 'ROOM_KEY', 'LETTER_TO_KAFEI', 'LETTER_TO_MAMA',
    'PENDANT_OF_MEMORIES', 'SWIM', 'SONG_DOUBLE_TIME', 'SONG_INVERTED_TIME', 'SOUL_OF_ENEMY_OCTOROKS'].forEach(f => S0.inf.add('RANDO_INF_OBTAINED_' + f));
  ['ODOLWA', 'GOHT', 'GYORG', 'TWINMOLD', 'MAJORA'].forEach(b => { S0.inf.add('RANDO_INF_OBTAINED_SOUL_OF_BOSS_' + b); S0.souls.add('RI_SOUL_BOSS_' + b); });
  CHECKS_DATA.items.forEach(i => { if (/^RI_SOUL_ENEMY_/.test(i.id)) S0.souls.add(i.id); });
  ['A', 'C_UP', 'C_DOWN', 'C_LEFT', 'C_RIGHT'].forEach(b => S0.buttons.add(b));
  S0.clocks = [true, true, true, true, true, true];
  ['WEEKEVENTREG_RECEIVED_GREAT_SPIN_ATTACK', 'WEEKEVENTREG_08_80', ...Object.values(FROG_WEEK)].forEach(w => S0.week.add(w));
  ['CLOCK_TOWN', 'MILK_ROAD', 'SOUTHERN_SWAMP', 'WOODFALL', 'MOUNTAIN_VILLAGE', 'SNOWHEAD', 'GREAT_BAY_COAST', 'ZORA_CAPE',
    'IKANA_CANYON', 'STONE_TOWER'].forEach(o => S0.owls.add('OWL_WARP_' + o));
  S0.sword = 3; S0.shield = 2; S0.wallet = 3; S0.magic = true; S0.hearts = 20;
  for (const d of DUNGEONS){ S0.keys[d.id] = d.keys; S0.bossKey[d.id] = true; S0.fairies[d.id] = 15; }
  S0.tokens = { SCENE_KINSTA1:30, SCENE_KINDAN2:30 };
  return S0;
}

/* ---------- Moments ---------- */
// heure de début d'une tranche, en heures depuis le jour 1 à 6 h (0 à 72 ; fin du cycle : 72)
const sliceStart = s => { if (s >= SLICE_COUNT) return 72; const x = SLICE_INFO[s]; return (x.day - 1) * 24 + (x.h < 6 ? x.h + 24 : x.h) + x.m / 60 - 6; };
/* parties d'une demi-journée (0 à 5, 12 h chacune) couvertes par un champ de tranches : [[début, fin]] en fractions de la
   demi-journée (0 à 1), plages consécutives fusionnées */
function halfDayParts(when, i){
  const out = [], [a, b] = HALF_DAYS[i], base = i * 12;
  for (let s = a; s <= b; s++){
    if (!(when & bitOf(s))) continue;
    const from = (sliceStart(s) - base) / 12, to = (sliceStart(s + 1) - base) / 12, last = out[out.length - 1];
    if (last && Math.abs(last[1] - from) < 1e-9) last[1] = to; else out.push([from, to]);
  }
  return out;
}
// plages horaires d'un champ de tranches : [[début, fin]] en heures depuis le jour 1 à 6 h (0 à 72), consécutives fusionnées
function whenRuns(when){
  const out = [];
  for (let s = 0; s < SLICE_COUNT; s++){
    if (!(when & bitOf(s))) continue;
    let e = s; while (e + 1 < SLICE_COUNT && (when & bitOf(e + 1))) e++;
    out.push([sliceStart(s), sliceStart(e + 1)]);
    s = e;
  }
  return out;
}
// tranches → demi-journées touchées (J1…N3) : [bool ×6]
const halfDaysOf = when => HALF_MASK.map(m => (when & m) !== 0n);
const halfDayLabel = i => (i % 2 ? t('Nuit') : t('Jour')) + ' ' + (Math.floor(i / 2) + 1);
// heure d'une tranche « 13 h 45 »
const sliceTime = s => { const x = SLICE_INFO[s]; return x.h + ' h' + (x.m ? ' ' + String(x.m).padStart(2, '0') : ''); };
/* plages de tranches consécutives d'un champ, en texte : « jour 3, 13 h → nuit 3, 22 h » (fin = début de la tranche
   suivante) ; tout le temps : null */
function whenText(when){
  if (!when || when === ALL_SLICES) return null;
  const parts = [];
  for (let s = 0; s < SLICE_COUNT; s++){
    if (!(when & bitOf(s))) continue;
    let e = s; while (e + 1 < SLICE_COUNT && (when & bitOf(e + 1))) e++;
    const a = SLICE_INFO[s], hdA = (a.day - 1) * 2 + (a.night ? 1 : 0);
    const end = e + 1 < SLICE_COUNT ? SLICE_INFO[e + 1] : null;
    // demi-journées entières : « Jour 1 », « Nuit 1 → Jour 2 »
    const whole = HALF_DAYS.findIndex(([x, y]) => x === s && (e === y || (e > y && HALF_DAYS.some(([, y2]) => y2 === e))));
    if (whole >= 0){
      const last = HALF_DAYS.findIndex(([, y]) => y === e);
      parts.push(halfDayLabel(whole) + (last > whole ? ' → ' + halfDayLabel(last) : ''));
    } else parts.push(halfDayLabel(hdA) + ', ' + sliceTime(s) + ' → ' + (end ? (end.day !== a.day || end.night !== a.night
      ? halfDayLabel((end.day - 1) * 2 + (end.night ? 1 : 0)) + ', ' : '') + sliceTime(e + 1) : '6 h'));
    s = e;
  }
  return parts.join(' ; ');
}
