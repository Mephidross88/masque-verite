/* ---------- Auto-tracking : la sauvegarde de 2Ship ----------
   2Ship écrit sa partie dans saves/file1.json (file2, file3) : au Chant du temps (newCycleSave), aux statues de hibou et
   avec l'option Autosave (owlSave, toutes les 1 à 60 minutes ; Enhancements > Saving). Le fichier contient, pour chaque
   check (randoSaveChecks, rangés par numéro de RandoCheckId) : fait ou non, l'objet qui s'y trouve, son prix ; et les
   options de la seed (randoSaveOptions), les objets de départ (randoStartingItems), le jour et l'heure.
   Lecture : dossier saves choisi par le joueur (File System Access API : Chrome, Edge ; poignée gardée dans IndexedDB,
   permission redemandée d'un clic après rechargement), relu toutes les 2 s s'il a changé ; ou fichier choisi à la main
   (autres navigateurs). Rien n'est jamais écrit dans les fichiers du jeu.
   Report (linkApply) : jamais en arrière — un check fait reste fait, un objet noté reste noté (le panneau peut avoir plus
   que la sauvegarde) ; la partie notée suit une seule seed (finalSeed) : une autre sauvegarde est signalée (link.foreign).
   Seul ce que le jeu a déjà montré est affiché : l'objet trouvé dans un check fait (game.found), les prix des boutiques.
   Suivi en direct (option ui.link.relay) : le relais local tools/2ship-live/relay.mjs lit la mémoire du jeu et transmet la
   partie en cours sous la même forme que la sauvegarde (même lecture, readSave), plus le moment et la position de Link ;
   tant qu'il suit une partie, le dossier saves n'est plus relu (ses sauvegardes sont plus anciennes). */

const LINK_ORDER = CHECKS_DATA.order;
const LINK_COMMIT = '8a24047';
const LINK_SCENE_NUM = Object.fromEntries(CHECKS_DATA.scenes.map(s => [s.id, s.num]));   // scène → numéro (SceneId)
const LINK_CAN = typeof window.showDirectoryPicker === 'function';   // suivi du dossier possible (sinon : fichier à la main)
const SAVE_FILES = ['file1.json', 'file2.json', 'file3.json'];
// link.status : off (pas de suivi), perm (dossier connu, permission à redonner d'un clic), on (dossier suivi), error
// save : moment de la dernière sauvegarde lue { half (0 à 5, -1 : avant le jour 1), clock (« 6 h 01 »), hours (heures depuis le
// jour 1 à 6 h, 0 à 72 : repère du Journal des Bombers) }
const link = reactive({ status:'off', dir:'', file:'', at:null, when:'', save:null, seed:0, foreign:null, warn:'', log:[] });
const LINK_LABEL = { off:t('Pas de suivi'), perm:t('Suivi en pause'), on:t('Suivi de la sauvegarde'), error:t('Dossier illisible'), live:t('Suivi en direct') };
// partie suivie, par la sauvegarde ou en direct (relais)
const linkFollowing = () => link.status === 'on' || link.relay === 'live';
function linkLog(text){
  link.log.unshift({ t:new Date().toLocaleTimeString(LANG === 'fr' ? 'fr-FR' : LANG, { hour:'2-digit', minute:'2-digit', second:'2-digit' }), text });
  if (link.log.length > 60) link.log.length = 60;
}

/* Lecture d'une sauvegarde (JSON déjà analysé) → { seed, commit, options, shuffled, obtained:{ RC: RI }, prices, start,
   day, night, time, playtime } ; null si ce n'est pas une sauvegarde de rando de 2Ship. Les deux parties du fichier
   (newCycleSave, owlSave) sont réunies : checks faits de l'une ou de l'autre ; jour et heure de la plus récente. */
const PRICED = /_PURCHASE|SHOP_ITEM|TINGLE_MAP|SPECIAL_ITEM/;
function readSave(j){
  if (!j || j.type !== '2S2H_SAVE') return null;
  const parts = ['newCycleSave', 'owlSave'].map(k => j[k] && j[k].save).filter(x => x && x.shipSaveInfo && x.shipSaveInfo.rando
    && Array.isArray(x.shipSaveInfo.rando.randoSaveChecks) && x.shipSaveInfo.rando.randoSaveChecks.length);
  if (!parts.length) return null;
  const last = parts.reduce((a, b) => (b.shipSaveInfo.filePlaytime || 0) >= (a.shipSaveInfo.filePlaytime || 0) ? b : a);
  const R = last.shipSaveInfo.rando;
  const out = { seed:R.finalSeed >>> 0, commit:String.fromCharCode(...(last.shipSaveInfo.commitHash || []).filter(Boolean)),
    options:{}, shuffled:{}, items:{}, obtained:{}, prices:{}, start:[], day:last.day, night:!!last.isNight, time:last.time,
    playtime:last.shipSaveInfo.filePlaytime || 0, size:R.randoSaveChecks.length, clocks:[] };
  LINK_ORDER.ro.forEach((k, i) => { if (k !== 'RO_MAX' && typeof R.randoSaveOptions[i] === 'number') out.options[k] = R.randoSaveOptions[i]; });
  R.randoSaveChecks.forEach((c, i) => {
    const rc = LINK_ORDER.rc[i];
    if (!rc || !c) return;
    if (c.shuffled){ out.shuffled[rc] = 1; out.items[rc] = LINK_ORDER.ri[c.randoItemId] || 'RI_UNKNOWN'; }
    if (c.shuffled && c.price && PRICED.test(rc)) out.prices[rc] = c.price;
  });
  for (const p of parts) p.shipSaveInfo.rando.randoSaveChecks.forEach((c, i) => {
    const rc = LINK_ORDER.rc[i];
    if (rc && c && c.obtained) out.obtained[rc] = LINK_ORDER.ri[c.randoItemId] || 'RI_UNKNOWN';
  });
  out.start = (R.randoStartingItems || []).filter(n => n > 0).map(n => LINK_ORDER.ri[n]).filter(Boolean);
  /* demi-journées possédées (temps mélangé) : drapeaux RANDO_INF_OBTAINED_CLOCK_DAY_1 à NIGHT_3 (66 à 71, dans l'ordre jour 1,
     nuit 1… ; randoInf : mots de 16 bits, bit de poids faible d'abord), départ compris, de l'une ou l'autre partie */
  const inf = n => parts.some(p => ((p.shipSaveInfo.rando.randoInf || [])[n >> 4] >> (n & 15)) & 1);
  out.clocks = [0, 1, 2, 3, 4, 5].map(i => !!inf(66 + i));
  /* objets de l'inventaire qu'on peut avoir hors check (herbe, ennemis, boutiques… quand ils ne sont pas mélangés) :
     Missiles Teigneux, Bâtons et Noix Mojo, Haricots Magiques, Baril de Poudre (emplacement = numéro de l'objet dans
     inventory.items, z64item.h ; l'objet reste après le Chant du temps, sans munitions) */
  const slot = n => parts.some(p => ((p.saveInfo && p.saveInfo.inventory && p.saveInfo.inventory.items) || [])[n] === n);
  /* jetons des Maisons des Araignées (skullTokenCount de la partie la plus récente : Marais sur les 16 bits du haut, Océan
     sur ceux du bas, Inventory_GetSkullTokenCount) — non mélangés, 2Ship les remet à zéro au Chant du temps (OnCycleSave.cpp) */
  const skulls = (last.saveInfo && last.saveInfo.skullTokenCount) >>> 0;
  out.tokens = { swamp:skulls >>> 16, ocean:skulls & 0xFFFF };
  /* Skulltulas d'or non mélangées : 2Ship ne les suit pas (randoSaveChecks) ; jeton ramassé = drapeau de coffre de la scène
     (fi de checks-data.js) dans permanentSceneFlags[numéro de la scène].chest, de l'une ou l'autre partie (remis à zéro au
     Chant du temps : un check coché le reste) */
  out.skulls = [];
  for (const c of CHECKS_DATA.checks){
    if (c.type !== 'SKULL_TOKEN' || c.fi == null || out.shuffled[c.id]) continue;
    const n = LINK_SCENE_NUM[c.scene];
    if (parts.some(p => ((((p.saveInfo && p.saveInfo.permanentSceneFlags) || [])[n] || {}).chest >>> c.fi) & 1)) out.skulls.push(c.id);
  }
  out.inv = [[7, 'RI_BOMBCHU'], [8, 'RI_DEKU_STICK'], [9, 'RI_DEKU_NUT'], [10, 'RI_MAGIC_BEAN'], [12, 'RI_POWDER_KEG']].filter(([n]) => slot(n)).map(([, ri]) => ri);
  return out;
}
// moment de la sauvegarde : demi-journée (0 à 5, -1 : avant le jour 1) et heure (« 6 h 02 » ; heure du jeu sur 16 bits)
const saveHalfDay = sv => sv.day >= 1 && sv.day <= 3 ? (sv.day - 1) * 2 + (sv.night ? 1 : 0) : -1;
function saveClock(time){ const m = Math.floor((time || 0) * 1440 / 65536); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); }
// heures depuis le jour 1 à 6 h (le jour change à 6 h : après minuit, c'est encore la nuit du même jour)
function saveHours(sv){
  if (!(sv.day >= 1 && sv.day <= 3)) return 0;
  const h = (sv.time || 0) * 24 / 65536;
  return Math.min(72, Math.max(0, (sv.day - 1) * 24 + (h < 6 ? h + 24 : h) - 6));
}

/* Panneau Objets d'après la sauvegarde : objets de départ (de la seed et donnés d'office, demi-journée de départ comprise)
   et objets des checks faits, objets de l'inventaire qu'on peut avoir hors check (readSave : inv) (start : seulement les objets de départ) ; demi-journées : d'après les drapeaux du jeu */
function saveGame(sv, start){
  const g = defaults().game, s = store.settings;
  applyStartingItems([...sv.start, ...computedStartingItems(s), ...startingTimeItems(s, sv.start, sv.seed),
    ...(start ? [] : [...Object.values(sv.obtained), ...(sv.inv || [])])], g);
  if (!start && s.RO_CLOCK_SHUFFLE){
    if (s.RO_CLOCK_SHUFFLE_PROGRESSIVE === RO.RO_CLOCK_SHUFFLE_RANDOM) TIME_HALVES.forEach((h, i) => { if (sv.clocks[i]) g.items['time_' + h] = true; });
    else g.items.time_progressive = Math.max(g.items.time_progressive, sv.clocks.filter(Boolean).length);
  }
  return g;
}
// report dans la partie notée, sans jamais revenir en arrière → nombre d'objets ajoutés
function mergeGame(src){
  const g = store.game;
  let n = 0;
  const up = (o, k, v) => { const cur = o[k]; if (typeof v === 'boolean' ? v && !cur : v > (cur || 0)){ o[k] = v; n++; } };
  for (const [k, v] of Object.entries(src.items)) up(g.items, k, v);
  for (const [id, d] of Object.entries(src.dungeons)) for (const [k, v] of Object.entries(d)) up(g.dungeons[id], k, v);
  up(g, 'townFairy', src.townFairy);
  for (const [k, v] of Object.entries(src.tokens)) up(g.tokens, k, v);
  return n;
}

/* Sauvegarde lue → partie notée. adopt : suivre cette seed même si la partie notée en suit une autre (après remise à zéro) ;
   live : partie lue en direct (relais : pas de « rien de nouveau » à chaque changement sans intérêt pour le suivi) */
function linkApply(sv, file, adopt, live){
  const g = store.game, s = store.settings, first = !link.at;
  link.file = file; link.at = new Date(); link.seed = sv.seed;
  link.warn = sv.commit && sv.commit !== LINK_COMMIT ? t('Sauvegarde d’une autre version de 2Ship (commit {c}) : l’appli suit la 5.0.1 ({ref}).', { c:sv.commit, ref:LINK_COMMIT })
    : sv.size !== LINK_ORDER.rc.length - 1 ? t('Sauvegarde d’une autre version de 2Ship : les checks ne correspondent pas.') : '';
  if (link.warn && sv.size !== LINK_ORDER.rc.length - 1) return;
  const progress = Object.keys(g.checks).length > 0;
  if (!adopt && g.seed.final && g.seed.final !== sv.seed && progress){ link.foreign = { seed:sv.seed, file, sv:Vue.markRaw(sv) }; return; }
  link.foreign = null;
  const fresh = first || adopt || g.seed.final !== sv.seed;
  // nouvelle seed (ou première lecture) : réglages et liste des checks repris de la sauvegarde
  if (g.seed.final !== sv.seed || !Object.keys(s.pool).length){
    for (const [k, v] of Object.entries(sv.options)) if (k in OPT_DEFAULT) s[k] = v;
    s.pool = Object.fromEntries(Object.keys(sv.shuffled).filter(k => CHECK_BY_ID[k]).map(k => [k, 1]));
    g.seed = { input:g.seed.final === sv.seed ? g.seed.input : '', final:sv.seed, file, commit:sv.commit };
    linkLog(t('Seed suivie : {seed} — réglages et checks repris de la sauvegarde.', { seed:sv.seed }));
  }
  setSeedItems(sv.seed, sv.items);   // (indices : page Indices)
  // chronologie (js/state.js) : objets de départ non notés ; le reste daté du temps de jeu et du moment de la sauvegarde,
  // sauf à la première lecture de la page ou de la seed (ce qui était déjà fait : sans date)
  const half = saveHalfDay(sv);
  link.when = half >= 0 ? halfDayLabel(half) + ', ' + saveClock(sv.time) : t('Avant le premier jour');
  link.save = { half, clock:saveClock(sv.time), hours:saveHours(sv) };
  if (g.cycle.half !== half || g.cycle.time !== sv.time) g.cycle = { half, time:sv.time, hours:link.save.hours };   // (fenêtre de stream)
  timelineSkip = true;
  try { mergeGame(saveGame(sv, true)); } finally { timelineSkip = false; }
  timelineQuiet = fresh; timelinePlay = sv.playtime || null; timelineAt = half >= 0 ? [half, sv.time] : null;
  try { linkReport(sv, live); } finally { timelineQuiet = false; timelinePlay = null; timelineAt = null; }
  if (sv.playtime > g.playtime){ g.playtime = sv.playtime; g.playtimeAt = Date.now(); }
  // moment du cycle
  if (store.ui.link.moment) store.ui.checks.moment = half >= 0 ? half : -1;
}
// checks faits, objets trouvés, prix, panneau Objets
function linkReport(sv, live){
  const g = store.game;
  let checks = 0;
  for (const [rc, ri] of Object.entries(sv.obtained)){
    const c = CHECK_BY_ID[rc];
    if (!c) continue;
    if (g.found[rc] !== ri) g.found[rc] = ri;
    if (!g.checks[rc]){
      g.checks[rc] = true; checks++;
      if (checks <= 8) linkLog(t('Coché : {check} — {item}', { check:c.label, item:ITEM_DATA[ri] ? ITEM_DATA[ri].label : ri }));
    }
  }
  // Skulltulas non mélangées ramassées (drapeaux de la scène) : cochées aussi, listées ou non (Suivre aussi les Skulltulas…)
  for (const rc of sv.skulls || []) if (CHECK_BY_ID[rc] && !g.checks[rc]){
    g.checks[rc] = true; checks++;
    if (checks <= 8) linkLog(t('Coché : {check}', { check:CHECK_BY_ID[rc].label }));
  }
  if (checks > 8) linkLog(tn(checks - 8, '… et {n} autre check', '… et {n} autres checks'));
  for (const [rc, p] of Object.entries(sv.prices)) if (g.prices[rc] !== p) g.prices[rc] = p;
  const items = mergeGame(saveGame(sv));
  // jetons non mélangés : le compte de la sauvegarde tel quel (il retombe à zéro au Chant du temps)
  if (!store.settings.RO_SHUFFLE_GOLD_SKULLTULAS && sv.tokens) for (const [k, v] of Object.entries(sv.tokens)) if (g.tokens[k] !== v) g.tokens[k] = v;
  if (items) linkLog(tn(items, '{n} objet noté', '{n} objets notés'));
  if (!checks && !items && !live) linkLog(t('Sauvegarde relue : rien de nouveau ({when}).', { when:link.when }));
}

/* ---------- Dossier saves (File System Access API) ---------- */
let linkDir = null, linkTimer = null;
const linkSeen = {};    // nom de fichier → date de dernière modification déjà lue
const LINK_DB = 'masque-verite-link';
function linkDb(mode, fn){
  return new Promise((ok, ko) => {
    const rq = indexedDB.open(LINK_DB, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
    rq.onerror = () => ko(rq.error);
    rq.onsuccess = () => { const tx = rq.result.transaction('kv', mode), r = fn(tx.objectStore('kv')); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => ko(tx.error); };
  });
}
// choisir le dossier saves (clic du joueur)
async function linkPick(){
  if (!LINK_CAN) return;
  try { linkDir = await window.showDirectoryPicker({ id:'masque-verite-saves', mode:'read' }); }
  catch (e) { return; }   // (choix annulé)
  try { await linkDb('readwrite', st => st.put(linkDir, 'dir')); } catch (e) {}
  store.ui.link.enabled = true;
  linkStart();
}
// reprendre après rechargement : la permission se redonne d'un clic
async function linkResume(){
  if (!linkDir) return;
  try { if (await linkDir.requestPermission({ mode:'read' }) === 'granted') linkStart(); } catch (e) {}
}
function linkStop(){
  clearInterval(linkTimer); linkTimer = null;
  store.ui.link.enabled = false; link.status = 'off';
  Object.keys(linkSeen).forEach(k => delete linkSeen[k]);
}
function linkStart(){
  link.status = 'on'; link.dir = linkDir.name;
  Object.keys(linkSeen).forEach(k => delete linkSeen[k]);
  clearInterval(linkTimer);
  linkTimer = setInterval(linkPoll, 2000);
  linkPoll();
}
let linkBusy = false;
async function linkPoll(){
  if (linkBusy || !linkDir || link.relay === 'live') return;
  linkBusy = true;
  try {
    // fichier suivi : celui choisi, sinon la sauvegarde modifiée le plus récemment
    const files = [];
    for (const name of SAVE_FILES){
      if (store.ui.link.slot && store.ui.link.slot !== name) continue;
      try { const f = await (await linkDir.getFileHandle(name)).getFile(); files.push(f); } catch (e) {}
    }
    if (link.status === 'error') link.status = 'on';
    const f = files.sort((a, b) => b.lastModified - a.lastModified)[0];
    if (!f || linkSeen[f.name] === f.lastModified) return;
    let j;
    try { j = JSON.parse(await f.text()); }
    catch (e) { return; }   // (fichier en cours d'écriture par le jeu : relu au tour suivant)
    linkSeen[f.name] = f.lastModified;
    const sv = readSave(j);
    if (!sv){ linkLog(t('{file} : pas une partie du randomizer, ignorée.', { file:f.name })); return; }
    linkApply(sv, f.name);
  } catch (e) {
    link.status = 'error';
  } finally { linkBusy = false; }
}
// fichier choisi à la main (navigateurs sans accès au dossier, ou lecture ponctuelle)
function linkPickFile(ev){
  const f = ev.target.files[0]; ev.target.value = '';
  if (!f) return;
  f.text().then(txt => {
    let j;
    try { j = JSON.parse(txt); } catch (e) { linkLog(t('{file} : fichier illisible.', { file:f.name })); return; }
    const sv = readSave(j);
    if (!sv){ linkLog(t('{file} : pas une partie du randomizer, ignorée.', { file:f.name })); return; }
    linkApply(sv, f.name);
  });
}
// suivre la sauvegarde d'une autre seed (après remise à zéro de la partie, faite par l'appelant)
function linkAdopt(){
  const f = link.foreign;
  link.foreign = null;
  if (f) linkApply(f.sv, f.file, true);
}
// au chargement : dossier déjà choisi → reprise directe si la permission tient encore, sinon « Reprendre » d'un clic
if (!STREAM_MODE && LINK_CAN && store.ui.link.enabled && typeof indexedDB !== 'undefined'){
  linkDb('readonly', st => st.get('dir')).then(async d => {
    if (!d) return;
    linkDir = d; link.dir = d.name;
    let p = 'prompt';
    try { p = await d.queryPermission({ mode:'read' }); } catch (e) {}
    if (p === 'granted') linkStart(); else link.status = 'perm';
  }).catch(() => {});
}

/* ---------- Suivi en direct : relais local (tools/2ship-live/relay.mjs) ----------
   Flux SSE du relais (une seule page à la fois : « busy » pour les autres). link.relay : off | connecting (relais injoignable,
   nouvelle tentative auto) | busy | wait (relais lancé, jeu absent) | error (PDB introuvable ou d'une autre version, accès
   refusé : link.relayMsg) | idle (jeu lancé, aucune partie du randomizer chargée) | live. link.live : dernier moment et
   position reçus { day, time, night, form (PlayerTransformation : 0 Oni, 1 Goron, 2 Zora, 3 Mojo, 4 humain), scene, sceneNum,
   room, pos:[x, y, z], rot (orientation, 0x10000 = un tour, 0 : vers +z), playtime }. */
const APP_ONLINE = /^https?:$/.test(globalThis.location?.protocol);
// (tests sur un autre port : index.html?relay=43491, avec relay.mjs --web=43491)
const RELAY_URL = 'http://127.0.0.1:' + ((/[?&]relay=(\d+)/.exec(globalThis.location?.search || '') || [])[1] || 43391);
const RELAY_DL = 'https://github.com/Mephidross88/masque-verite/releases/latest';
const RELAY_LABEL = { off:t('Arrêté'), connecting:t('Relais injoignable'), busy:t('Relais déjà utilisé par une autre page'),
  wait:t('En attente du jeu'), error:t('Jeu illisible'), idle:t('Aucune partie du randomizer chargée'), live:t('En direct') };
Object.assign(link, { relay:'off', relayMsg:'', live:null, blocked:false });
let relaySource = null, relayRetry = null, relayKept = 0;
function relayStart(){
  relayStop();
  link.relay = 'connecting';
  const es = relaySource = new EventSource(RELAY_URL + '/events');
  es.onopen = () => { link.blocked = false; };
  es.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } relayHandle(m); };
  es.onerror = () => {
    // (relais occupé : il ferme aussitôt la connexion, le navigateur réessaie ; l'état « occupé » reste affiché)
    if (link.relay === 'busy' && es.readyState !== 2) return;
    if (link.relay !== 'connecting') linkLog(t('Relais injoignable, nouvelle tentative…'));
    link.relay = 'connecting'; link.live = null;
    relayCheckBlocked();
    // le navigateur réessaie seul après une coupure, mais abandonne sur une réponse anormale : on relance alors
    if (es.readyState === 2 && relaySource === es){ clearTimeout(relayRetry); relayRetry = setTimeout(() => { if (store.ui.link.relay && relaySource === es) relayStart(); }, 5000); }
  };
}
function relayStop(){
  clearTimeout(relayRetry);
  if (relaySource){ relaySource.close(); relaySource = null; }
  link.relay = 'off'; link.relayMsg = ''; link.live = null; link.blocked = false;
}
// Appli en ligne : Chrome demande l'autorisation d'accéder aux adresses locales (permission « loopback-network », ou
// « local-network-access » avant Chrome 145 environ) ; refusée, le relais reste injoignable sans autre indice
function relayCheckBlocked(){
  if (!APP_ONLINE || !navigator.permissions) return;
  const ask = n => navigator.permissions.query({ name:n }).then(r => r.state, () => null);
  Promise.all(['loopback-network', 'local-network-access'].map(ask)).then(st => { link.blocked = st.find(x => x) === 'denied' && link.relay === 'connecting'; });
}
function relayHandle(m){
  if (m.type === 'busy'){
    if (link.relay !== 'busy') linkLog(t('Relais déjà utilisé par une autre page, nouvelle tentative…'));
    link.relay = 'busy'; return;
  }
  if (m.type === 'hello' || m.type === 'state'){
    const was = link.relay;
    link.relayMsg = '';
    if (m.game === 'wait') link.relay = 'wait';
    else if (m.game === 'ok') link.relay = m.file >= 0 && m.rando ? 'live' : 'idle';
    else {
      link.relay = 'error';
      link.relayMsg = m.game === 'nopdb' ? t('Fichier de symboles introuvable : {pdb} (livré avec 2Ship, dossier debug).', { pdb:m.pdb })
        : m.game === 'mismatch' ? t('Le fichier de symboles {pdb} n’est pas celui de cette version de 2Ship.', { pdb:m.pdb })
        : m.game === 'denied' ? t('Accès au jeu refusé : lancez le relais comme le jeu (en administrateur ou non).')
        : t('Mémoire du jeu illisible : {msg}', { msg:m.msg || '' });
    }
    if (link.relay !== 'live') link.live = null;
    if (link.relay !== was) linkLog(m.type === 'hello' ? t('Relais connecté — {etat}', { etat:RELAY_LABEL[link.relay] }) : RELAY_LABEL[link.relay]);
    return;
  }
  if (m.type === 'save'){
    const sv = readSave(m.save);
    if (sv) linkApply(sv, t('fichier {n}, en direct', { n:m.file + 1 }), false, true);
    return;
  }
  if (m.type === 'live') relayLive(m);
}
// moment et position en direct : repère du Journal, carte « En direct » ; dans la partie notée (sauvegardée) au plus toutes
// les 10 s, ou au changement de demi-journée
function relayLive(m){
  link.live = m; link.at = new Date();
  const half = saveHalfDay(m), g = store.game;
  link.when = half >= 0 ? halfDayLabel(half) + ', ' + saveClock(m.time) : t('Avant le premier jour');
  link.save = { half, clock:saveClock(m.time), hours:saveHours(m) };
  const now = Date.now();
  if (g.cycle.half !== half || now - relayKept > 10000){
    relayKept = now;
    g.cycle = { half, time:m.time, hours:link.save.hours };
    if (store.ui.link.moment && store.ui.checks.moment !== half) store.ui.checks.moment = half >= 0 ? half : -1;
    if (m.playtime > g.playtime){ g.playtime = m.playtime; g.playtimeAt = now; }
  }
}
if (!STREAM_MODE && store.ui.link.relay && typeof EventSource !== 'undefined') relayStart();
