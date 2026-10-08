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
   Seul ce que le jeu a déjà montré est affiché : l'objet trouvé dans un check fait (game.found), les prix des boutiques. */

const LINK_ORDER = CHECKS_DATA.order;
const LINK_COMMIT = '8a24047';
const LINK_CAN = typeof window.showDirectoryPicker === 'function';   // suivi du dossier possible (sinon : fichier à la main)
const SAVE_FILES = ['file1.json', 'file2.json', 'file3.json'];
// link.status : off (pas de suivi), perm (dossier connu, permission à redonner d'un clic), on (dossier suivi), error
// save : moment de la dernière sauvegarde lue { half (0 à 5, -1 : avant le jour 1), clock (« 6 h 01 »), hours (heures depuis le
// jour 1 à 6 h, 0 à 72 : repère du Journal des Bombers) }
const link = reactive({ status:'off', dir:'', file:'', at:null, when:'', save:null, seed:0, foreign:null, warn:'', log:[] });
const LINK_LABEL = { off:t('Pas de suivi'), perm:t('Suivi en pause'), on:t('Suivi de la sauvegarde'), error:t('Dossier illisible') };
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
    options:{}, shuffled:{}, obtained:{}, prices:{}, start:[], day:last.day, night:!!last.isNight, time:last.time,
    playtime:last.shipSaveInfo.filePlaytime || 0, size:R.randoSaveChecks.length };
  LINK_ORDER.ro.forEach((k, i) => { if (k !== 'RO_MAX' && typeof R.randoSaveOptions[i] === 'number') out.options[k] = R.randoSaveOptions[i]; });
  R.randoSaveChecks.forEach((c, i) => {
    const rc = LINK_ORDER.rc[i];
    if (!rc || !c) return;
    if (c.shuffled) out.shuffled[rc] = 1;
    if (c.shuffled && c.price && PRICED.test(rc)) out.prices[rc] = c.price;
  });
  for (const p of parts) p.shipSaveInfo.rando.randoSaveChecks.forEach((c, i) => {
    const rc = LINK_ORDER.rc[i];
    if (rc && c && c.obtained) out.obtained[rc] = LINK_ORDER.ri[c.randoItemId] || 'RI_UNKNOWN';
  });
  out.start = (R.randoStartingItems || []).filter(n => n > 0).map(n => LINK_ORDER.ri[n]).filter(Boolean);
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

/* Panneau Objets d'après la sauvegarde : objets de départ (de la seed et donnés d'office) et objets des checks faits */
function saveGame(sv){
  const g = defaults().game;
  applyStartingItems([...sv.start, ...computedStartingItems(store.settings), ...Object.values(sv.obtained)], g);
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

/* Sauvegarde lue → partie notée. adopt : suivre cette seed même si la partie notée en suit une autre (après remise à zéro). */
function linkApply(sv, file, adopt){
  const g = store.game, s = store.settings;
  link.file = file; link.at = new Date(); link.seed = sv.seed;
  link.warn = sv.commit && sv.commit !== LINK_COMMIT ? t('Sauvegarde d’une autre version de 2Ship (commit {c}) : l’appli suit la 5.0.1 ({ref}).', { c:sv.commit, ref:LINK_COMMIT })
    : sv.size !== LINK_ORDER.rc.length - 1 ? t('Sauvegarde d’une autre version de 2Ship : les checks ne correspondent pas.') : '';
  if (link.warn && sv.size !== LINK_ORDER.rc.length - 1) return;
  const progress = Object.keys(g.checks).length > 0;
  if (!adopt && g.seed.final && g.seed.final !== sv.seed && progress){ link.foreign = { seed:sv.seed, file, sv:Vue.markRaw(sv) }; return; }
  link.foreign = null;
  // nouvelle seed (ou première lecture) : réglages et liste des checks repris de la sauvegarde
  if (g.seed.final !== sv.seed || !Object.keys(s.pool).length){
    for (const [k, v] of Object.entries(sv.options)) if (k in OPT_DEFAULT) s[k] = v;
    s.pool = Object.fromEntries(Object.keys(sv.shuffled).filter(k => CHECK_BY_ID[k]).map(k => [k, 1]));
    g.seed = { input:g.seed.final === sv.seed ? g.seed.input : '', final:sv.seed, file, commit:sv.commit };
    linkLog(t('Seed suivie : {seed} — réglages et checks repris de la sauvegarde.', { seed:sv.seed }));
  }
  // checks faits et objets trouvés
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
  if (checks > 8) linkLog(tn(checks - 8, '… et {n} autre check', '… et {n} autres checks'));
  for (const [rc, p] of Object.entries(sv.prices)) if (g.prices[rc] !== p) g.prices[rc] = p;
  const items = mergeGame(saveGame(sv));
  if (items) linkLog(tn(items, '{n} objet noté', '{n} objets notés'));
  // moment du cycle
  const half = saveHalfDay(sv);
  link.when = half >= 0 ? halfDayLabel(half) + ', ' + saveClock(sv.time) : t('Avant le premier jour');
  link.save = { half, clock:saveClock(sv.time), hours:saveHours(sv) };
  if (store.ui.link.moment && half >= 0) store.ui.checks.moment = half;
  if (!checks && !items) linkLog(t('Sauvegarde relue : rien de nouveau ({when}).', { when:link.when }));
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
  if (linkBusy || !linkDir) return;
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
if (LINK_CAN && store.ui.link.enabled && typeof indexedDB !== 'undefined'){
  linkDb('readonly', st => st.get('dir')).then(async d => {
    if (!d) return;
    linkDir = d; link.dir = d.name;
    let p = 'prompt';
    try { p = await d.queryPermission({ mode:'read' }); } catch (e) {}
    if (p === 'granted') linkStart(); else link.status = 'perm';
  }).catch(() => {});
}
