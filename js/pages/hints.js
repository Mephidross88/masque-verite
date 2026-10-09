/* ---------- Page Indices : pierres à potins et autres indices de la seed ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Les indices de 2Ship se calculent depuis les objets de la seed (seedItems de js/state.js : sauvegarde suivie ou spoiler) :
   chaque indice reste caché tant qu'il n'est pas marqué « lu » (store.game.hints), comme en jeu. Le Chant de Saria
   (indice vers le prochain check utile, calculé en jeu au moment de l'appel) n'est pas suivi. */

/* ---------- Pierres à potins (Rando/ActorBehavior/EnGs.cpp, GetRandomCheck) ----------
   Tirage pondéré parmi les checks mélangés dont l'objet n'est pas du « junk » (ordre de RandoCheckId) : poids de base du
   check, sinon de son objet, sinon du type d'objet, sinon 1 ; poids effectif 100 + (base − 1) × force (option
   RO_HINTS_GOSSIP_STONE_STRENGTH). Graine : finalSeed + (scène + x + z de la pierre), générateur Ship_Random (PCG32,
   ShipUtils.cpp). Lieu cité : la région du check (précis pour les checks à poids propre). */
const GS_RC_WEIGHT = { RC_PINNACLE_ROCK_REUNITE_SEAHORSE:10, RC_GREAT_BAY_COAST_NEW_WAVE_BOSSA_NOVA:10, RC_MOUNTAIN_VILLAGE_FROG_CHOIR:10,
  RC_STOCK_POT_INN_COUPLES_MASK:10, RC_ROMANI_RANCH_ALIENS:10, RC_WATERFALL_RAPIDS_BEAVER_RACE_01:8, RC_WATERFALL_RAPIDS_BEAVER_RACE_02:8,
  RC_KEATON_QUIZ:8, RC_CURIOSITY_SHOP_SPECIAL_ITEM:8, RC_DEKU_PLAYGROUND_ALL_DAYS:8, RC_MOON_TRIAL_ZORA_PIECE_OF_HEART:6,
  RC_MOON_TRIAL_DEKU_PIECE_OF_HEART:6, RC_MOON_TRIAL_GORON_PIECE_OF_HEART:6 };
const GS_RI_WEIGHT = { RI_SOUL_BOSS_MAJORA:13, RI_MASK_DEKU:12, RI_MASK_GORON:12, RI_MASK_ZORA:12, RI_MASK_BLAST:11, RI_MASK_FIERCE_DEITY:11,
  RI_SOUL_BOSS_GOHT:10, RI_SOUL_BOSS_GYORG:10, RI_SOUL_BOSS_ODOLWA:10, RI_SOUL_BOSS_TWINMOLD:10, RI_REMAINS_GOHT:10, RI_REMAINS_GYORG:10,
  RI_REMAINS_ODOLWA:10, RI_REMAINS_TWINMOLD:10 };
const GS_TYPE_WEIGHT = { MAJOR:9, MASK:9, BOSS_KEY:8, LESSER:6, SMALL_KEY:5, SKULLTULA_TOKEN:3, STRAY_FAIRY:3, HEALTH:2, JUNK:2 };
const ITEM_TYPE = Object.fromEntries(CHECKS_DATA.items.map(i => [i.id, i.type]));
// Ship_Random (PCG32) : seed → tirage(min, max) entier dans [min, max[
function shipRandom(seed){
  const M = 6364136223846793005n, INC = 11634580027462260723n, MASK = (1n << 64n) - 1n;
  let state = BigInt(seed);
  const next32 = () => {
    state = (state * M + INC) & MASK;
    const x = Number((((state >> 18n) ^ state) >> 27n) & 0xFFFFFFFFn) >>> 0, rot = Number(state >> 59n);
    return ((x >>> rot) | (x << ((32 - rot) & 31))) >>> 0;
  };
  return (min, max) => {
    if (min === max) return min;
    const n = max - min, cut = 0xFFFFFFFF - (0xFFFFFFFF % n);
    for (;;){ const r = next32(); if (r <= cut) return min + r % n; }
  };
}
// check désigné par une pierre (scène du jeu, position de départ)
function gossipCheck(items, seed, strength, scene, x, z){
  const list = [];
  let total = 0;
  for (const rc of CHECKS_DATA.order.rc){
    const ri = items[rc];
    if (!ri || !ITEM_TYPE[ri] || ITEM_TYPE[ri] === 'JUNK') continue;
    const base = GS_RC_WEIGHT[rc] || GS_RI_WEIGHT[ri] || GS_TYPE_WEIGHT[ITEM_TYPE[ri]] || 1;
    total += 100 + (base - 1) * strength;
    list.push([rc, total]);
  }
  if (!list.length) return null;
  const num = MAPS_RECIPE.scenes.findIndex(x2 => x2 && x2[0] === scene);
  const roll = shipRandom((seed + (Math.trunc(num + x + z) >>> 0)) >>> 0)(0, total);
  return (list.find(e => roll < e[1]) || list[list.length - 1])[0];
}

/* ---------- Lieu cité par un indice (StaticData/Checks.cpp, GetLocationNameForHint) ----------
   Scène de la région de logique du check (scène d'origine des variantes) ; intérieurs, grottes, boutiques… : celle de la
   région où ils mènent (dernière sortie, sinon dernière connexion) ; précis : le nom du check ; ennemis : « un adversaire ». */
const HINT_PARENT = new Set(['KAKUSIANA', 'TAKARAYA', 'BOWLING', 'SONCHONOIE', 'SYATEKI_MIZU', 'YADOYA', 'MILK_BAR', 'AYASHIISHOP',
  'YOUSEI_IZUMI', 'DOUJOU', '8ITEMSHOP', 'BOMYA', 'POSTHOUSE', 'TAKARAKUJI', 'SYATEKI_MORI', 'MAP_SHOP', 'WITCH_SHOP', 'F01C', 'F01_B',
  'OMOYA', 'GORONSHOP', 'KAJIYA', 'FISHERMAN', 'LABO', 'BANDROOM', 'TOUGITES', 'MUSICHOUSE'].map(x => 'SCENE_' + x));
let HINT_AREA = null;
const originalScene = sc => Object.keys(MAPS_RECIPE.variants).find(o => MAPS_RECIPE.variants[o].includes(sc)) || sc;
function hintArea(rc){
  if (!HINT_AREA){
    HINT_AREA = {};
    for (const r of LOGIC.regions){
      let sc = originalScene(r.scene);
      if (HINT_PARENT.has(sc) && r.id !== 'RR_LONE_PEAK_SHRINE'){
        let to = null;
        for (const [x] of r.exits) to = x;
        for (const [x] of r.conns) to = x;
        if (!to || !REGION[to]) continue;
        sc = originalScene(REGION[to].scene);
      }
      for (const [id] of r.checks) HINT_AREA[id] = sc;
    }
  }
  return HINT_AREA[rc] || null;
}
function hintPlace(rc, exact){
  const c = CHECK_BY_ID[rc];
  if (exact && c) return c.label + ' (' + CHECK_SCENE[c.scene].label + ')';
  if (c && c.cat === 'ENEMY_DROP') return t('dans un adversaire redoutable');
  const sc = hintArea(rc);
  return sc ? baseSceneName(sc) : t('un lieu inconnu');
}
const itemName = ri => ITEM_DATA[ri] ? ITEM_DATA[ri].label : ri;

/* ---------- Autres indices ----------
   where : l'endroit d'un objet (premier check qui l'a, comme FindItemPlacement ; masques de transformation : tous) ;
   what : l'objet d'un check. opt : option du randomizer qui les active (sans : toujours, dialogues de 2Ship). */
const HINT_FIXED = [
  ...[['ODOLWA', 'Odolwa'], ['GOHT', 'Rhork'], ['GYORG', 'Gyorg'], ['TWINMOLD', 'Skorn']].map(([k, n]) =>
    ({ id:'remains_' + k.toLowerCase(), group:'remains', opt:'RO_HINTS_BOSS_REMAINS', title:t('Avis de recherche : {boss}', { boss:n }), where:'RI_REMAINS_' + k })),
  ...['DEKU', 'GORON', 'ZORA'].map(k => ({ id:'transform_' + k.toLowerCase(), group:'transform', opt:'RO_HINTS_TRANSFORMATIONS',
    title:t('Âme en peine : {masque}', { masque:itemName('RI_MASK_' + k) }), where:'RI_MASK_' + k, all:true })),
  { id:'oath', group:'songs', opt:'RO_HINTS_OATH_TO_ORDER', title:t('Skull Kid (Sommet de la Tour de l’Horloge)') + ' : ' + itemName('RI_SONG_OATH'), where:'RI_SONG_OATH' },
  { id:'soaring', group:'songs', opt:'RO_HINTS_SONG_OF_SOARING', title:t('Stèle du Marais du Sud') + ' : ' + itemName('RI_SONG_SOARING'), where:'RI_SONG_SOARING' },
  { id:'hookshot', group:'items', opt:'RO_HINTS_HOOKSHOT', title:t('Zora de la Grande Baie') + ' : ' + itemName('RI_HOOKSHOT'), where:'RI_HOOKSHOT' },
  { id:'gold_dust', group:'items', title:t('Forgeron') + ' : ' + itemName('RI_BOTTLE_GOLD_DUST'), where:'RI_BOTTLE_GOLD_DUST' },
  { id:'bank', group:'rewards', opt:'RO_HINTS_BANK_SIGN', title:t('Pancarte de la banque'), what:'RC_CLOCK_TOWN_WEST_BANK_PIECE_OF_HEART' },
  { id:'spider_swamp', group:'rewards', opt:'RO_HINTS_SPIDER_HOUSES', title:t('Maison des Araignées des Marais : récompense'), what:'RC_SWAMP_SPIDER_HOUSE_MASK_OF_TRUTH' },
  { id:'spider_ocean', group:'rewards', opt:'RO_HINTS_SPIDER_HOUSES', title:t('Maison des Araignées de la Côte : récompense'), what:'RC_OCEAN_SPIDER_HOUSE_WALLET' },
  { id:'smithy_razor', group:'rewards', title:t('Forgeron : première épée'), what:'RC_MOUNTAIN_VILLAGE_SMITHY_RAZOR_SWORD' },
  { id:'smithy_gilded', group:'rewards', title:t('Forgeron : seconde épée'), what:'RC_MOUNTAIN_VILLAGE_SMITHY_GILDED_SWORD' },
  ...[['CLOCK_TOWN', 'Bourg-Clocher'], ['CLOCK_TOWN_ALT', 'Bourg-Clocher (seconde)'], ['WOODFALL', 'Bois-Cascade'], ['SNOWHEAD', 'Pic des Neiges'],
    ['GREAT_BAY', 'Grande Baie'], ['IKANA', 'Ikana']].map(([k, n]) =>
    ({ id:'fairy_' + k.toLowerCase(), group:'rewards', title:t('Grande Fée de {lieu} : récompense', { lieu:n }),
      what:'RC_' + k.replace('_ALT', '') + '_GREAT_FAIRY' + (k.endsWith('_ALT') ? '_ALT' : '') })),
];
const HINT_GROUPS = { gossip:t('Pierres à potins'), remains:t('Restes des boss'), transform:t('Masques de transformation'), songs:t('Chants'),
  items:t('Objets'), rewards:t('Récompenses') };

const HINTS_TPL = paneTpl('hints', `<h1>Indices</h1><p class="lede">Ce que disent les pierres à potins et les autres indices de la seed : marquez un indice lu pour voir son texte.</p>`, `
      <div v-if="!hintsReady.ok" class="empty"><b>{{hintsReady.title}}</b> {{hintsReady.text}}</div>
      <template v-else>
        <div class="hint-sum">
          <span class="hs-card count"><b>{{hintsStats.read}} / {{hintsStats.total}}</b><span>indices lus</span></span>
          <span v-if="!hintsReady.stones && store.settings.RO_HINTS_GOSSIP_STONES" class="hs-note">Pierres à potins : fabriquez les cartes (page Carte)
            pour les calculer — leur indice dépend de leur position.</span>
        </div>
        <section v-if="hintsKnown.length" class="hint-zone hint-known"><h2>Objets indiqués</h2>
          <ul class="hk-list"><li v-for="h in hintsKnown" :key="h.id" :class="{done:h.done}">
            <b>{{h.item}}</b><span class="hk-arrow">→</span><span>{{h.place}}</span><small>{{h.title}}</small></li></ul></section>
        <section v-for="g in hintsGroups" :key="g.id" class="hint-zone">
          <h2>{{g.label}} <small>{{g.read}} / {{g.list.length}}</small></h2>
          <ul class="hint-list">
            <li v-for="h in g.list" :key="h.id" class="hint-row" :class="{read:h.read}">
              <button type="button" class="hr-mark" :title="h.read ? 'Remettre non lu (masquer le texte)' : 'Marquer lu (voir le texte)'" v-html="h.read ? ICONS.check : ICONS.circleO" @click="toggleHint(h.id)"></button>
              <span class="hr-src">{{h.title}}<small v-if="h.sub"> · {{h.sub}}</small></span>
              <span v-if="h.read" class="hr-text">{{h.text}}</span>
              <span v-else class="hr-hidden">non lu</span>
            </li></ul></section>
      </template>`);

function useHintsPage(){
  const s = store.settings;
  const opt = k => !!s[k];
  // prêt ? objets de la seed connus, et ceux de la partie notée
  const hintsReady = computed(() => {
    const si = seedItems.value, seed = store.game.seed.final;
    if (!si) return { ok:false, title:t('Indices pas encore calculables.'), text:t('Importez le spoiler de la seed (Configuration) ou suivez la sauvegarde de 2Ship (auto-tracking).') };
    if (seed && si.seed !== seed) return { ok:false, title:t('Objets d’une autre seed.'), text:t('Les objets connus ne sont pas ceux de la partie notée : réimportez son spoiler ou relisez sa sauvegarde.') };
    return { ok:true, stones:!!(mapsData.value && mapsData.value.stones) };
  });
  // tous les indices de la seed (texte calculé ; affiché seulement une fois lu)
  const hintsAll = computed(() => {
    if (!hintsReady.value.ok) return [];
    const { items, seed } = seedItems.value, out = [];
    const placements = ri => CHECKS_DATA.order.rc.filter(rc => items[rc] === ri);
    // pierres à potins (option RO_HINTS_GOSSIP_STONES), numérotées par carte
    if (opt('RO_HINTS_GOSSIP_STONES')){
      const n = {};
      for (const [scene, x, y, z, map] of (mapsData.value && mapsData.value.stones) || []){
        const rc = gossipCheck(items, seed, s.RO_HINTS_GOSSIP_STONE_STRENGTH, scene, x, z);
        if (!rc) continue;
        const k = n[map] = (n[map] || 0) + 1;
        out.push({ id:'gs:' + map + ':' + x + ':' + z, group:'gossip', title:mapSceneName(map), sub:t('pierre {n}', { n:k }), map, x, y, z,
          rc, item:itemName(items[rc]), place:hintPlace(rc, !!GS_RC_WEIGHT[rc]) });
      }
    }
    // (pierres dans l'ordre de la liste des cartes : régions, lieux, puis grottes)
    const order = {};
    let k = 0;
    for (const r of MAP_REGIONS) for (const sc of r.list) order[sc] = k++;
    for (const g of GROTTO_MAPS.value.list) order[g.base] = order[g.base] ?? (order[g.home] ?? 999) + 0.5;
    out.sort((a, b) => (order[a.map] ?? 999) - (order[b.map] ?? 999) || a.title.localeCompare(b.title) || a.sub.localeCompare(b.sub, undefined, { numeric:true }));
    for (const h of HINT_FIXED){
      if (h.opt && !opt(h.opt)) continue;
      if (h.where){
        const rcs = h.all ? placements(h.where) : placements(h.where).slice(0, 1);
        out.push({ ...h, rc:rcs[0], rcs, item:itemName(h.where),
          place:rcs.length ? [...new Set(rcs.map(rc => hintPlace(rc)))].join(' · ') : t('déjà en votre possession') });
      } else out.push({ ...h, rc:h.what, item:itemName(items[h.what] || (CHECK_BY_ID[h.what] || {}).item), place:CHECK_BY_ID[h.what] ? CHECK_BY_ID[h.what].label : h.what });
    }
    return out.map(h => ({ ...h, read:!!store.game.hints[h.id], done:!!(h.rc && store.game.checks[h.rc]),
      text:h.what ? h.item : h.item + ' — ' + h.place }));
  });
  const hintsGroups = computed(() => Object.entries(HINT_GROUPS).map(([id, label]) => {
    const list = hintsAll.value.filter(h => h.group === id);
    return { id, label, list, read:list.filter(h => h.read).length };
  }).filter(g => g.list.length));
  const hintsStats = computed(() => ({ total:hintsAll.value.length, read:hintsAll.value.filter(h => h.read).length }));
  // objets indiqués par les indices lus (synthèse, triée par objet)
  const hintsKnown = computed(() => hintsAll.value.filter(h => h.read)
    .map(h => ({ id:h.id, item:h.item, place:h.place, title:h.title + (h.sub ? ' · ' + h.sub : ''), done:h.done }))
    .sort((a, b) => a.item.localeCompare(b.item)));
  const toggleHint = id => { if (store.game.hints[id]) delete store.game.hints[id]; else store.game.hints[id] = true; };
  /* page Checks : indices lus — précis (l'objet d'un check : récompenses, pierres à poids propre) sur le check ; sinon
     (un lieu seulement, comme en jeu) en tête du lieu de la page Checks du check désigné */
  const hintsByCheck = computed(() => {
    const out = {};
    for (const h of hintsAll.value) if (h.read && h.rc && (h.what || GS_RC_WEIGHT[h.rc] && h.group === 'gossip')) (out[h.rc] = out[h.rc] || []).push(h.item);
    return out;
  });
  const hintsByScene = computed(() => {
    const out = {};
    for (const h of hintsAll.value){
      if (!h.read || h.what || (h.group === 'gossip' && GS_RC_WEIGHT[h.rc])) continue;
      for (const rc of h.rcs || (h.rc ? [h.rc] : [])){ const c = CHECK_BY_ID[rc]; if (c) (out[c.scene] = out[c.scene] || []).push(h.item); }
    }
    return out;
  });
  // carte : pierres à potins de la carte affichée { x, y, z, id, read, tip }
  const hintStones = map => hintsAll.value.filter(h => h.group === 'gossip' && h.map === map)
    .map(h => ({ id:h.id, x:h.x, y:h.y, z:h.z, read:h.read, tip:t('Pierre à potins') + (h.read ? ' : ' + h.text : ' — ' + t('clic : marquer lue')) }));
  return { hintsReady, hintsAll, hintsGroups, hintsStats, hintsKnown, toggleHint, hintsByCheck, hintsByScene, hintStones };
}
