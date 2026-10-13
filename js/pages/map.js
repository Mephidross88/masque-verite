/* ---------- Page Carte : chaque scène vue de dessus ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Cartes : fabriquées depuis la ROM de Majora's Mask du joueur (js/maps-extract.js, chargé à la demande, recette
   data/maps-recipe.js tirée des sources de 2Ship), gardées dans IndexedDB (base masque-verite-maps) ; data/maps-data.js
   (outil en ligne de commande, non versionné), s'il est présent, passe avant. Rien de la ROM n'est publié. */

const MAPS_VER = 9;   // (à augmenter quand le calcul change : les cartes du navigateur sont alors à refaire)
// cartes en service (window.MAPS_DATA du fichier, sinon celles du navigateur) ; infos : source, date, nom de la ROM
const mapsData = Vue.shallowRef(window.MAPS_DATA || null);
const MAPS_INFO = reactive({ source:window.MAPS_DATA ? 'file' : null, at:null, rom:'', old:false });
function mapsIdb(op, value){
  return new Promise((ok, ko) => {
    if (!window.indexedDB) return ko(new Error('indexedDB'));
    const req = indexedDB.open('masque-verite-maps', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('maps');
    req.onerror = () => ko(req.error);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction('maps', op === 'get' ? 'readonly' : 'readwrite'), st = tx.objectStore('maps');
      const r = op === 'get' ? st.get('data') : op === 'put' ? st.put(value, 'data') : st.delete('data');
      tx.oncomplete = () => { db.close(); ok(r.result); };
      tx.onerror = tx.onabort = () => { db.close(); ko(tx.error || new Error('indexedDB')); };
    };
  });
}
if (!mapsData.value) mapsIdb('get').then(e => {
  if (!e || !e.json) return;
  mapsData.value = JSON.parse(e.json);
  Object.assign(MAPS_INFO, { source:'browser', at:e.at, rom:e.rom || '', old:e.ver !== MAPS_VER });
}).catch(err => console.warn('Cartes du navigateur illisibles :', err));
const loadScript = src => new Promise((ok, ko) => {
  const s = document.createElement('script');
  s.src = src; s.onload = ok; s.onerror = () => ko(new Error(src));
  document.head.appendChild(s);
});
// fabrique les cartes depuis la ROM choisie (File) et les garde dans le navigateur. progress(étape, part 0..1).
// Erreurs : 'not-mm', 'no-scene-table' (js/maps-extract.js), 'idb'.
async function mapsBuild(file, progress){
  if (typeof extractMaps === 'undefined') await loadScript('js/maps-extract.js');
  progress('read', 0);
  const rom = new Uint8Array(await file.arrayBuffer());
  const { data, stats } = await extractMaps({ rom, recipe:window.MAPS_RECIPE, progress });
  progress('save', 1);
  const at = Date.now();
  try { await mapsIdb('put', { json:JSON.stringify(data), at, rom:file.name, ver:MAPS_VER }); }
  catch (e){ throw new Error('idb'); }
  mapsData.value = data;
  Object.assign(MAPS_INFO, { source:'browser', at, rom:file.name, old:false });
  return stats;
}
async function mapsForget(){
  await mapsIdb('delete');
  if (MAPS_INFO.source === 'browser'){ mapsData.value = null; Object.assign(MAPS_INFO, { source:null, at:null, rom:'', old:false }); }
}

/* ---------- Scènes ---------- */
// recette (data/maps-recipe.js) : nom français de chaque scène, scène d'arrivée d'un numéro d'entrée
const MAP_SCENE_NAMES = {}, MAP_ENTR_SCENE = {};
for (const x of window.MAPS_RECIPE.scenes) if (x){ MAP_SCENE_NAMES[x[0]] = td(x[2], x[3]); if (!(x[1] in MAP_ENTR_SCENE)) MAP_ENTR_SCENE[x[1]] = x[0]; }
const baseSceneName = id => MAP_SCENE_NAMES[id] || (CHECK_SCENE[id] ? CHECK_SCENE[id].label : id);
// nom d'une carte (lieu, ou grotte : voir GROTTO_MAPS)
const mapSceneName = id => (GROTTO_MAPS.value.byId[id] || {}).label || baseSceneName(id);
// scène d'arrivée d'une entrée (numéro : scène << 9 | apparition << 4)
const entrScene = v => MAP_ENTR_SCENE[v >> 9] || null;

/* ---------- Classement des cartes (liste des lieux) ----------
   Par région, dans l'ordre du chemin (lieu, puis ses intérieurs et ses donjons) ; les grottes rejoignent la région de leur
   trou ; une carte absente de la table va dans « Autres ». */
const MAP_REGIONS = [
  ['centre', t('Centre — Bourg-Clocher et Plaine Termina'), ['CLOCKTOWER', 'TOWN', 'ICHIBA', 'BACKTOWN', 'ALLEY', 'OKUJOU', 'INSIDETOWER',
    'YADOYA', 'MILK_BAR', 'SONCHONOIE', 'TAKARAYA', 'BOWLING', 'SYATEKI_MIZU', 'POSTHOUSE', 'AYASHIISHOP', 'BOMYA', '8ITEMSHOP',
    'TAKARAKUJI', 'DOUJOU', 'DEKUTES', 'TENMON_DAI', '00KEIKOKU', 'ROMANYMAE', 'F01', 'OMOYA', 'F01_B', 'F01C', 'KOEPONARACE']],
  ['sud', t('Sud — Marais et Bois-Cascade'), ['24KEMONOMITI', '20SICHITAI', '20SICHITAI2', 'MAP_SHOP', 'WITCH_SHOP', 'SYATEKI_MORI',
    'KINSTA1', '26SARUNOMORI', '22DEKUCITY', 'DEKU_KING', 'DANPEI', '21MITURINMAE', 'MITURIN', 'MITURIN_BS']],
  ['nord', t('Nord — Montagne et Pic des Neiges'), ['13HUBUKINOMITI', '10YUKIYAMANOMURA', '10YUKIYAMANOMURA2', 'KAJIYA', 'GORON_HAKA',
    '17SETUGEN', '17SETUGEN2', 'GORONRACE', '11GORONNOSATO', '11GORONNOSATO2', '16GORON_HOUSE', 'GORONSHOP', '14YUKIDAMANOMITI',
    '12HAKUGINMAE', 'HAKUGIN', 'HAKUGIN_BS']],
  ['ouest', t('Ouest — Grande Baie'), ['30GYOSON', 'LABO', 'FISHERMAN', 'KINDAN2', '31MISAKI', '33ZORACITY', 'BANDROOM', 'SINKAI',
    '35TAKI', 'TORIDE', 'KAIZOKU', 'PIRATE', 'SEA', 'SEA_BS']],
  ['est', t('Est — Ikana et Forteresse de Pierre'), ['IKANAMAE', 'BOTI', 'HAKASHITA', 'DANPEI2TEST', 'IKANA', 'TOUGITES', 'MUSICHOUSE',
    'SECOM', 'REDEAD', 'RANDOM', 'CASTLE', 'IKNINSIDE', 'F40', 'F41', 'INISIE_N', 'INISIE_R', 'INISIE_BS']],
  ['autres', t('Autres — Lune, fontaines, début du jeu'), ['SOUGEN', 'LAST_DEKU', 'LAST_GORON', 'LAST_ZORA', 'LAST_LINK', 'LAST_BS',
    'KYOJINNOMA', 'YOUSEI_IZUMI', 'OPENINGDAN', 'LOST_WOODS', 'KONPEKI_ENT']],
].map(([id, label, list]) => ({ id, label, list:list.map(x => 'SCENE_' + x) }));
const MAP_REGION_OF = {};
MAP_REGIONS.forEach(r => r.list.forEach(sc => { MAP_REGION_OF[sc] = r.id; }));

/* ---------- Grottes : une carte par grotte ----------
   La scène des grottes (SCENE_KAKUSIANA) est découpée en salles par js/maps-extract.js (« SCENE_KAKUSIANA#n »). Les grottes
   à coffre et à vache partagent une salle : une carte par grotte, « SCENE_KAKUSIANA#n|RC_…_GROTTO » (même terrain, ses
   seuls checks). Trous de grotte des lieux extérieurs (ho) : salle d'arrivée (data.grottoRooms) et grotte (données de
   réapparition → recipe.grottos). Id d'une carte : base (carte dessinée) | clé (grotte). */
const mapBaseOf = id => String(id).split('|')[0];
const mapKeyOf = id => String(id).split('|')[1] || null;
// groupe d'un check : sa grotte (RC_…_GROTTO), sinon son lieu de la page Checks
const checkGroupOf = c => { const m = /^(RC_.*?_GROTTO)(?:_|$)/.exec(c.id); return m ? m[1] : c.scene; };
// nom d'une grotte d'après ses checks : « Plaine Termina · grotte du pilier »
function grottoLabel(key){
  const list = CHECKS.filter(c => checkGroupOf(c) === key);
  if (!list.length) return key;
  let g = null;
  for (const c of list){ const p = /\(([^)]*grotte[^)]*)\)/i.exec(c.label); if (p && !g) g = p[1]; }
  return baseSceneName(list[0].scene) + ' · ' + (g || t('grotte'));
}
const GROTTO_MAPS = computed(() => {
  const m = mapsData.value, out = { list:[], byId:{}, holes:{}, roomKeys:{} };
  if (!m || !m.grottoRooms) return out;
  /* groupes des checks placés dans chaque salle (grotte RC_…_GROTTO, sinon lieu de la page Checks) : une salle est partagée
     si plusieurs grottes y ont au moins 5 checks (grottes à coffre, à vache) ; sinon elle porte le nom de son groupe le
     plus fourni (quelques checks placés d'après un acteur cherché dans toute la scène peuvent tomber dans une autre salle) */
  const counts = {};
  for (const [id, p] of Object.entries(m.checks || {})){
    if (!String(p[0]).startsWith('SCENE_KAKUSIANA#') || !CHECK_BY_ID[id]) continue;
    const k = checkGroupOf(CHECK_BY_ID[id]), c = counts[p[0]] = counts[p[0]] || {};
    c[k] = (c[k] || 0) + 1;
  }
  const mainGroup = {};
  for (const [b, c] of Object.entries(counts)){
    const shared = Object.keys(c).filter(k => /_GROTTO$/.test(k) && c[k] >= 5);
    if (shared.length > 1) out.roomKeys[b] = shared;
    mainGroup[b] = Object.keys(c).sort((x, y) => c[y] - c[x])[0];
  }
  const groupLabel = g => /_GROTTO$/.test(g) ? grottoLabel(g) : baseSceneName(g);
  const add = (id, home) => {
    let e = out.byId[id];
    if (!e){
      const key = mapKeyOf(id), base = mapBaseOf(id);
      const label = key ? grottoLabel(key) : mainGroup[base] ? groupLabel(mainGroup[base])
        : home ? baseSceneName(home) + ' · ' + t('grotte') : t('Grotte {n}', { n:base.split('#')[1] });
      e = out.byId[id] = { id, base, key, home:home || null, label };
      out.list.push(e);
    } else if (home && !e.home) e.home = home;
    return id;
  };
  for (const [scene, sc] of Object.entries(m.scenes)) for (const h of sc.ho || []){
    const base = 'SCENE_KAKUSIANA#' + m.grottoRooms[h[3]];
    if (!m.scenes[base]) continue;
    const keys = out.roomKeys[base], key = keys ? MAPS_RECIPE.grottos[h[4]] : null;
    const id = add(key ? base + '|' + key : base, scene);
    (out.holes[scene] = out.holes[scene] || []).push({ x:h[0], y:h[1], z:h[2], to:id });
  }
  // salles sans trou de grotte (entrées par une sortie ordinaire) ; salles partagées : une carte par grotte de leurs checks
  for (const base of Object.keys(m.scenes).filter(k => k.startsWith('SCENE_KAKUSIANA#'))){
    const keys = out.roomKeys[base];
    if (keys) keys.forEach(k => add(base + '|' + k));
    else if (!out.list.some(x => x.base === base) && counts[base]) add(base);   // (salle sans check ni trou : pas de carte)
  }
  /* lieu extérieur d'une grotte sans trou connu (Autel du Pic Isolé, grotte du vendeur de haricots) : d'après la logique —
     région d'un de ses checks, puis ses sorties et connexions, jusqu'à une région hors de la scène des grottes */
  const regionOfCheck = {};
  for (const r of LOGIC.regions) for (const [rc] of r.checks) regionOfCheck[rc] = r;
  const outside = r0 => {
    const seen = new Set([r0.id]);
    let todo = [r0];
    for (let d = 0; d < 3 && todo.length; d++){
      const next = [];
      for (const r of todo) for (const [to] of [...r.exits, ...r.conns]){
        const t = REGION[to];
        if (!t || seen.has(to)) continue;
        if (t.scene !== 'SCENE_KAKUSIANA' && t.scene) return t.scene;
        seen.add(to); next.push(t);
      }
      todo = next;
    }
    return null;
  };
  for (const e of out.list){
    if (e.home) continue;
    const rc = Object.keys(m.checks || {}).find(id => m.checks[id][0] === e.base && CHECK_BY_ID[id] && (!e.key || checkGroupOf(CHECK_BY_ID[id]) === e.key) && regionOfCheck[id]);
    e.home = rc ? outside(regionOfCheck[rc]) : null;
    if (e.home && /^Grotte /.test(e.label)) e.label = baseSceneName(e.home) + ' · ' + t('grotte');
  }
  // (nommée d'après un lieu seulement : « · grotte » ; homonymes : numérotés)
  for (const e of out.list) if (!e.label.includes(' · ') && e.label === baseSceneName(e.home || '') ) e.label += ' · ' + t('grotte');
  out.list.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  const seenLabel = {};
  for (const e of out.list){
    const n = seenLabel[e.label] = (seenLabel[e.label] || 0) + 1;
    if (n > 1 || out.list.filter(x => x.label === e.label).length > 1) e.labelN = e.label + ' (' + n + ')';
  }
  for (const e of out.list) if (e.labelN){ e.label = e.labelN; delete e.labelN; }
  /* carte d'un check de grotte sans position (sa salle est inconnue) : celle de sa grotte, sinon celle dont c'est le groupe
     principal, sinon une grotte de son lieu extérieur — une seule, pour qu'il ne soit pas proposé dans toutes */
  out.ownerOf = c => {
    const g = checkGroupOf(c);
    const e = out.list.find(x => x.key === g) || out.list.find(x => !x.key && mainGroup[x.base] === g) || out.list.find(x => x.home === c.scene) || out.list[0];
    return e ? e.id : null;
  };
  return out;
});
// un check est-il de cette carte ? (grottes : sa grotte, ou les grottes de la salle)
// check sans position proposé à placer sur cette carte ? (grottes : une seule carte, voir ownerOf)
function ownsUnplaced(c, id){ return !mapBaseOf(id).startsWith('SCENE_KAKUSIANA') || GROTTO_MAPS.value.ownerOf(c) === id; }
function inMap(c, id){
  const base = mapBaseOf(id);
  if (!base.startsWith('SCENE_KAKUSIANA')) return true;
  const key = mapKeyOf(id);
  return key ? grottoKeyIn(c, base) === key : true;
}
/* grotte d'un check dans une salle commune à plusieurs grottes : sa grotte (RC_…_GROTTO), sinon celle de la salle qui est dans
   son lieu (vaches de la Plaine Termina, RC_TERMINA_FIELD_COW_… → grotte aux vaches de la Plaine Termina) */
const GROTTO_SCENE = {};
function grottoKeyIn(c, base){
  const keys = GROTTO_MAPS.value.roomKeys[base], g = checkGroupOf(c);
  if (!keys || keys.includes(g)) return g;
  const sceneOf = k => GROTTO_SCENE[k] ?? (GROTTO_SCENE[k] = (CHECKS.find(x => checkGroupOf(x) === k) || {}).scene || null);
  return keys.find(k => sceneOf(k) === c.scene) || g;
}

/* Positions des checks : placées à la main dans ce navigateur (mapEdits, localStorage masque-verite-positions, pas encore
   exportées), puis celles de la recette (positions-manuelles.json), sinon celles calculées depuis la ROM. → [scène, x, y, z] */
const POS_KEY = 'masque-verite-positions';
const mapEdits = reactive((() => { try { return JSON.parse(localStorage.getItem(POS_KEY)) || {}; } catch (e) { return {}; } })());
watch(mapEdits, () => { try { localStorage.setItem(POS_KEY, JSON.stringify(mapEdits)); } catch (e) {} }, { deep:true });
function checkPos(id){
  const e = mapEdits[id];
  if (e) return [e.scene, e.x, e.y, e.z];
  if (MAPS_RECIPE.manual[id]) return MAPS_RECIPE.manual[id];
  // (même acteur qu'un autre check selon l'entrée empruntée : sa position, même sur des cartes fabriquées avant)
  const a = MAPS_RECIPE.alias && MAPS_RECIPE.alias[id];
  if (a && !mapEdits[a] && checkPos(a)) return checkPos(a);
  return (mapsData.value && mapsData.value.checks && mapsData.value.checks[id]) || null;
}

const mapGeoCache = new WeakMap();
/* Étages d'une scène (donjons : carte du menu pause) : étage i = hauteurs de [sol de l'étage − 80, sol du suivant − 80[,
   comme MapDisp_GetStoreyY. Nom : 1, 2… ; sous-sols S1, S2… (étage le plus bas : lb). */
const mapLevelOf = (sc, y) => { const l = sc.lv; if (!l || y == null) return null; let i = 0; while (i + 1 < l.length && y >= l[i + 1] - 80) i++; return i; };
const mapLevelName = (sc, i) => { const n = i + (sc.lb || 0); return n >= 0 ? String(n + 1) : t('S{n}', { n:-n }); };
/* ---------- Plan d'une scène : sols posés sur une grille ----------
   Les sols (triangles vus de dessus, hauteur moyenne) sont posés sur une grille (au plus PLAN_CELLS cases de côté, cases d'au
   moins PLAN_MIN_CELL unités) : hauteur du sol le plus haut de chaque case. La grille est nettoyée — fermeture (les fentes
   entre deux sols, pentes trop raides que l'extraction écarte, se referment), petits trous bouchés, miettes retirées — puis :
   contour lissé (carrés marchants, puis Chaikin) rempli d'une seule teinte ; relief en ombrage doux (lumière du nord-ouest,
   hauteurs adoucies : les zones plates restent unies, les falaises ressortent) ; eau seulement là où sa surface couvre le
   sol ; autres étages en fond atténué. */
const PLAN_CELLS = 420, PLAN_MIN_CELL = 6;
function planGrid(sc, on){
  const [x0, z0, x1, z1] = sc.b, cs = Math.max(PLAN_MIN_CELL, Math.max(x1 - x0, z1 - z0) / PLAN_CELLS);
  const gx = x0 - cs * 3, gz = z0 - cs * 3, nx = Math.ceil((x1 - x0) / cs) + 6, nz = Math.ceil((z1 - z0) / cs) + 6;
  // (hauteur des sommets si les cartes l'ont, fy : pentes continues ; sinon la hauteur moyenne du triangle)
  const H = new Float32Array(nx * nz).fill(NaN), f = sc.f, fy = sc.fy && sc.fy.length * 7 === f.length * 3 ? sc.fy : null;
  const put = (k, y) => { if (!(H[k] >= y)) H[k] = y; };
  for (let t = 0; t < f.length; t += 7){
    const y = f[t + 6];
    if (!on(y)) continue;
    const ax = f[t], az = f[t + 1], bx = f[t + 2], bz = f[t + 3], cx = f[t + 4], cz = f[t + 5], v = t / 7 * 3;
    const ya = fy ? fy[v] : y, yb = fy ? fy[v + 1] : y, yc = fy ? fy[v + 2] : y;
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    const ci = v => Math.floor((v - gx) / cs), cj = v => Math.floor((v - gz) / cs);
    let hit = false;
    if (d) for (let j = Math.max(0, cj(Math.min(az, bz, cz))); j <= Math.min(nz - 1, cj(Math.max(az, bz, cz))); j++){
      const pz = gz + (j + 0.5) * cs;
      for (let i = Math.max(0, ci(Math.min(ax, bx, cx))); i <= Math.min(nx - 1, ci(Math.max(ax, bx, cx))); i++){
        const px = gx + (i + 0.5) * cs, l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / d, l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / d;
        if (l1 < -0.05 || l2 < -0.05 || l1 + l2 > 1.05) continue;
        put(j * nx + i, l1 * ya + l2 * yb + (1 - l1 - l2) * yc); hit = true;
      }
    }
    // (triangle plus fin qu'une case : la case de son centre)
    if (!hit){ const i = ci((ax + bx + cx) / 3), j = cj((az + bz + cz) / 3); if (i >= 0 && i < nx && j >= 0 && j < nz) put(j * nx + i, y); }
  }
  return { H, nx, nz, cs, gx, gz };
}
// grille → masque nettoyé : fermeture (dilatation puis érosion, 8 voisins), trous de moins de minHole cases bouchés, morceaux
// de moins de minPart cases retirés ; hauteurs des cases ajoutées : moyenne des voisines
function planMask(G, minHole, minPart){
  const { H, nx, nz } = G, n = nx * nz, M = new Uint8Array(n);
  for (let k = 0; k < n; k++) M[k] = H[k] === H[k] ? 1 : 0;
  const morph = (src, v) => { const out = src.slice();
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++){ const k = j * nx + i; if (src[k] === v) continue;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (src[k + dj * nx + di] === v){ out[k] = v; dj = 2; break; } }
    return out; };
  const C = morph(morph(M, 1), 0);
  // composantes (4 voisins) : trous (fond hors du bord) et morceaux
  const lab = new Int32Array(n).fill(-1), stack = [];
  for (let k0 = 0; k0 < n; k0++){
    if (lab[k0] >= 0) continue;
    const v = C[k0], cells = [];
    let edge = false;
    lab[k0] = k0; stack.push(k0);
    while (stack.length){
      const k = stack.pop(), i = k % nx, j = (k - i) / nx;
      cells.push(k);
      if (i === 0 || j === 0 || i === nx - 1 || j === nz - 1) edge = true;
      for (const q of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, j > 0 ? k - nx : -1, j < nz - 1 ? k + nx : -1])
        if (q >= 0 && lab[q] < 0 && C[q] === v){ lab[q] = k0; stack.push(q); }
    }
    if (v === 0 && !edge && cells.length < minHole) for (const k of cells) C[k] = 1;
    if (v === 1 && cells.length < minPart) for (const k of cells) C[k] = 0;
  }
  // hauteurs des cases ajoutées (de proche en proche)
  for (let pass = 0, left = 1; pass < 8 && left; pass++){
    left = 0;
    for (let k = 0; k < n; k++){
      if (!C[k] || H[k] === H[k]) continue;
      let s = 0, c = 0;
      for (const q of [k - 1, k + 1, k - nx, k + nx]) if (q >= 0 && q < n && H[q] === H[q]){ s += H[q]; c++; }
      if (c) H[k] = s / c; else left++;
    }
  }
  for (let k = 0; k < n; k++) if (!C[k]) H[k] = NaN;
  return C;
}
// contours d'un masque (carrés marchants entre centres de cases, puis deux passes de Chaikin) → chemin SVG (règle evenodd)
function planOutline(M, G){
  const { nx, nz, cs, gx, gz } = G, adj = new Map();
  const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
  // points : milieu d'une arête entre deux centres — horizontale (i, j)–(i+1, j) : 2 × (j × nx + i), verticale (i, j)–(i, j+1) : 2 × (…) + 1
  const hk = (i, j) => 2 * (j * nx + i), vk = (i, j) => 2 * (j * nx + i) + 1;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++){
    const tl = M[j * nx + i], tr = M[j * nx + i + 1], bl = M[(j + 1) * nx + i], br = M[(j + 1) * nx + i + 1];
    if (tl === tr && tr === bl && bl === br) continue;
    const T = hk(i, j), B = hk(i, j + 1), Lf = vk(i, j), R = vk(i + 1, j), e = [];
    if (tl !== tr) e.push(T);
    if (tr !== br) e.push(R);
    if (bl !== br) e.push(B);
    if (tl !== bl) e.push(Lf);
    if (e.length === 2) link(e[0], e[1]);
    else if (tl){ link(T, R); link(Lf, B); }   // (point col : la diagonale pleine reste d'un seul tenant)
    else { link(T, Lf); link(R, B); }
  }
  const pt = p => { const k = p >> 1, i = k % nx, j = (k - i) / nx;
    return p & 1 ? [gx + (i + 0.5) * cs, gz + (j + 1) * cs] : [gx + (i + 1) * cs, gz + (j + 0.5) * cs]; };
  const seen = new Set();
  let d = '';
  for (const start of adj.keys()){
    if (seen.has(start)) continue;
    let loop = [], prev = -1, cur = start;
    while (cur !== undefined && !seen.has(cur)){
      seen.add(cur); loop.push(pt(cur));
      const next = adj.get(cur).find(q => q !== prev && !seen.has(q));
      prev = cur; cur = next;
    }
    if (loop.length < 3) continue;
    for (let pass = 0; pass < 2; pass++){
      const out = [];
      for (let k = 0; k < loop.length; k++){ const a = loop[k], b = loop[(k + 1) % loop.length];
        out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
      loop = out;
    }
    d += 'M' + loop.map(p => Math.round(p[0]) + ' ' + Math.round(p[1])).join('L') + 'Z';
  }
  return d;
}
// ombrage du relief : image de la grille (une case = un pixel ; le navigateur la lisse), transparente hors du sol
function planShade(M, G){
  if (typeof document === 'undefined') return null;
  const { H, nx, nz, cs } = G, n = nx * nz, S = new Float32Array(n);
  // hauteurs adoucies (moyenne sur 5 × 5 cases du sol)
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
    const k = j * nx + i;
    if (!M[k]) continue;
    let s = 0, c = 0;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++){ const ii = i + di, jj = j + dj, q = jj * nx + ii;
      if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && M[q]){ s += H[q]; c++; } }
    S[k] = s / c;
  }
  const cv = document.createElement('canvas');
  cv.width = nx; cv.height = nz;
  const g = cv.getContext('2d'), img = g.createImageData(nx, nz), px = img.data;
  const L = [-0.5, 0.7, -0.5], ln = Math.hypot(...L), flat = L[1] / ln;   // lumière du nord-ouest (−x, −z), en hauteur
  for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++){
    const k = j * nx + i;
    if (!M[k]) continue;
    const h = q => M[q] ? S[q] : S[k], dx = (h(k + 1) - h(k - 1)) / (2 * cs), dz = (h(k + nx) - h(k - nx)) / (2 * cs);
    const nn = Math.hypot(dx, 1, dz), v = ((-dx) * L[0] + L[1] + (-dz) * L[2]) / (nn * ln) - flat;
    if (v < 0){ px[k * 4 + 3] = Math.min(150, -v * 400); }
    else { px[k * 4] = px[k * 4 + 1] = px[k * 4 + 2] = 255; px[k * 4 + 3] = Math.min(110, v * 300); }
  }
  g.putImageData(img, 0, 0);
  return cv.toDataURL();
}
// plan d'une scène (à un étage : li) : sol (contour), ombrage, eau, autres étages, cadre
let planClip = 0;
function mapGeo(sc, li){
  const key = li == null ? -1 : li, byLevel = mapGeoCache.get(sc) || {};
  if (byLevel[key]) return byLevel[key];
  const on = y => li == null || mapLevelOf(sc, y) === li;
  const G = planGrid(sc, on), cs = G.cs, minHole = Math.max(20, Math.round((90 / cs) ** 2));
  const M = planMask(G, minHole, 6);
  // eau : cases du sol sous la surface d'une boîte d'eau
  const W = new Uint8Array(M.length);
  for (let w = 0; w < sc.water.length; w += 5){
    const [wx0, wz0, wx1, wz1, wy] = sc.water.slice(w, w + 5);
    if (li != null && mapLevelOf(sc, wy) !== li && mapLevelOf(sc, wy - 100) !== li) continue;
    for (let j = Math.max(0, Math.floor((wz0 - G.gz) / cs)); j < Math.min(G.nz, Math.ceil((wz1 - G.gz) / cs)); j++)
      for (let i = Math.max(0, Math.floor((wx0 - G.gx) / cs)); i < Math.min(G.nx, Math.ceil((wx1 - G.gx) / cs)); i++){
        const k = j * G.nx + i; if (M[k] && G.H[k] < wy - 4) W[k] = 1; }
  }
  // autres étages
  let ghost = '';
  if (li != null){ const G2 = planGrid(sc, y => !on(y)); ghost = planOutline(planMask(G2, minHole, 6), G2); }
  const [x0, z0, x1, z1] = sc.b, pad = Math.max(x1 - x0, z1 - z0) * 0.04;
  const g = { floor:planOutline(M, G), shade:planShade(M, G), shadeBox:[G.gx, G.gz, G.nx * cs, G.nz * cs], water:planOutline(W, G), ghost,
    clip:'zmap-clip-' + (++planClip), view:[x0 - pad, z0 - pad, x1 - x0 + 2 * pad, z1 - z0 + 2 * pad], unit:Math.max(x1 - x0, z1 - z0) / 110 };
  byLevel[key] = g; mapGeoCache.set(sc, byLevel);
  return g;
}

/* Bois Perdus (SCENE_26SARUNOMORI) : 3 × 3 clairières numérotées de 1 (sud-ouest) à 9 (nord-est), 880 unités d'écart ; on
   entre par le bord est de la 6. Le singe suit un chemin différent chaque jour (clairières successives). */
const WOODS_SCENE = 'SCENE_26SARUNOMORI', WOODS_DOOR = [374, 0];
const WOODS_PATHS = { 1:[6, 3, 2, 5, 8, 7, 4], 2:[6, 9, 8, 7, 4, 5, 2], 3:[6, 5, 2, 1, 4, 7, 8] };
const woodsXZ = n => [-1760 + (n - 1) % 3 * 880, 880 - Math.floor((n - 1) / 3) * 880];

/* Indices de certains lieux, sous la barre de la Carte : texte, et notes à jouer (touches de l'ocarina, sOcarinaSongNotes du
   jeu, code_8019AF00.c). Chant d'Evan (z_en_zos.c) : le quart de cœur vient quand on joue ses deux moitiés à la suite près de
   lui, dans son dos (WEEKEVENTREG_52_10 : moins de 100 unités, Evan ne fait pas face au joueur). Puits de Pierre : l'hippocampe
   sorti de la bouteille ne suit pas un chemin de la scène (le chemin 0 est celui de l'autre hippocampe, qui tourne autour du
   rocher, z_en_ot.c) : texte seulement. */
const MAP_HINTS = {
  SCENE_33ZORACITY:[{ title:t('Chant d’Evan (quart de cœur)'),
    text:t('Dans la chambre d’Evan : se placer tout près de lui, dans son dos, pendant qu’il est penché sur son clavier, et jouer à la suite'),
    notes:['C_RIGHT', 'C_RIGHT', 'C_DOWN', 'A', 'A', 'C_DOWN', 'C_RIGHT', 'A', '|', 'C_LEFT', 'C_LEFT', 'C_RIGHT', 'C_DOWN', 'C_DOWN', 'C_RIGHT', 'C_LEFT', 'C_DOWN'] }],
  SCENE_SINKAI:[{ title:t('Hippocampe'),
    text:t('Le libérer de sa bouteille à l’entrée, puis le suivre sous forme Zora') }],
};

// checks mis en lumière sur la Carte (page Donjons) : { scene, pts:[[x, y, z], …], at }
const mapFocus = reactive({ scene:'', pts:[], at:0 });

// forme de Link (save.playerForm, PlayerTransformation) → classe de couleur (fm-…, comme les pastilles des formes)
const LIVE_FORM = ['fierce', 'goron', 'zora', 'deku', 'human'];

/* ---------- Carte d'une scène (composant) ----------
   Sol vu de dessus (nord en haut), murs, eau ; un repère par sortie (zone de chargement ou porte), avec le nom de la
   scène d'arrivée ; clic : aller à la carte de cette scène. Molette : zoom autour du curseur ; glisser : déplacer. */
const MapView = {
  // checks : repères des checks de la scène [{ c, x, y, z, st ('done' | 'now' | 'later'), tip }] (calculés par la page) ;
  // placing : mode « Placer les checks » avec des checks choisis (clic sur la carte : 'place' [x, y, z]) ; placed : checks
  // placés à la main dans la scène [{ c, x, y, z, moving }]
  // holes : trous de grotte [{ x, z, to, label }] ; home : lieu extérieur d'une grotte (sa sortie y ramène)
  props:{ scene:{ type:String, required:true }, checks:{ type:Array, default:() => [] }, placing:Boolean, placed:{ type:Array, default:() => [] }, editing:Boolean,
    holes:{ type:Array, default:() => [] }, home:{ type:String, default:null }, stones:{ type:Array, default:() => [] },
    compact:Boolean,   // compact : sans boutons de zoom (fenêtre de stream)
    path:{ type:Object, default:null },   // path : chemin à suivre { pts:[[x, z], …], tip } (Bois Perdus)
    counts:{ type:Object, default:() => ({}) },   // counts : checks restants par carte d'intérieur ou de grotte { todo, total, now }
    focus:{ type:Object, default:null },   // focus : checks mis en lumière { pts:[[x, y, z], …], at } (page Donjons) : étage et cadrage
    live:{ type:Object, default:null },   // live : Link dans cette scène (suivi en direct) { x, y, z, deg, form }
    images:Boolean },   // images : fond en image importée, s'il y en a une pour ce lieu et cet étage (js/pages/map-images.js)
  emits:['goto', 'check', 'place', 'stone', 'level'],   // level : étage affiché (page Carte : export, image du lieu)
  data:() => ({ view:null, drag:null, hover:null, level:null }),
  computed:{
    sc(){ return mapsData.value && mapsData.value.scenes[this.scene] || null; },
    // étage affiché (donjons) : choisi, sinon celui de l'entrée (premier point d'apparition)
    levels(){ return this.sc && this.sc.lv ? this.sc.lv.map((_, i) => ({ i, name:mapLevelName(this.sc, i),
      todo:this.checks.filter(m => m.st !== 'done' && mapLevelOf(this.sc, m.y) === i).length })).reverse() : null; },
    // (Link dans la scène : son étage, tant qu'on n'en choisit pas un autre — jusqu'à ce qu'il change d'étage, voir liveLvl)
    liveLvl(){ return this.levels && this.live ? mapLevelOf(this.sc, this.live.y) : null; },
    lvl(){ return !this.levels ? null : this.level != null ? this.level : this.liveLvl != null ? this.liveLvl
      : mapLevelOf(this.sc, this.sc.sp.length ? this.sc.sp[0][1] : this.sc.lv[0]); },
    liveMark(){ return this.live && this.onLevel(this.live.y) ? this.live : null; },
    img(){ return this.images ? MAP_IMAGES[mapImgKey(this.scene, this.lvl)] || null : null; },
    onLevel(){ return y => this.lvl == null || mapLevelOf(this.sc, y) === this.lvl; },
    geo(){ return this.sc ? mapGeo(this.sc, this.lvl) : null; },
    shown(){ return this.checks.filter(m => this.onLevel(m.y)); },
    placedShown(){ return this.placed.filter(m => this.onLevel(m.y)); },
    vb(){ return this.view || (this.geo ? this.geo.view : [0, 0, 1, 1]); },
    // chemin : ligne brisée, une flèche au milieu de chaque tronçon (sens de la marche)
    pathLine(){ return this.path ? this.path.pts.map(p => p.join(',')).join(' ') : ''; },
    pathArrows(){
      if (!this.path) return [];
      const p = this.path.pts;
      return p.slice(1).map((b, i) => { const a = p[i];
        return { x:(a[0] + b[0]) / 2, z:(a[1] + b[1]) / 2, deg:Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI }; });
    },
    // taille des repères : suit le zoom (sans devenir minuscule)
    unit(){ return this.geo ? this.geo.unit * Math.min(1, Math.max(0.35, this.vb[2] / this.geo.view[2])) : 1; },
    // sorties : une par zone ; même scène d'arrivée et très proches : un seul repère
    exits(){
      if (!this.sc) return [];
      const out = [];
      const m = mapsData.value;
      this.sc.ex.forEach(([entr, x, y, z], i) => {
        let to = entrScene(entr);
        // vers la scène des grottes : la salle de l'entrée ; depuis une grotte, sortie sans destination : son lieu extérieur
        if (to === 'SCENE_KAKUSIANA' && m.grottoRooms) to = 'SCENE_KAKUSIANA#' + m.grottoRooms[(entr >> 4) & 0x1F];
        if ((!to || to === 'SCENE_KAKUSIANA') && this.home) to = this.home;
        if (!this.onLevel(y)) return;
        if (out.some(m => m.to === to && Math.hypot(m.x - x, m.z - z) < 150)) return;
        out.push({ id:i, to, x, z, label:to ? mapSceneName(to) : t('Destination inconnue'), self:to === this.scene, cnt:to && to !== this.scene ? this.counts[to] || null : null });
      });
      return out;
    },
  },
  watch:{
    scene(){ this.view = null; this.hover = null; this.level = null; },
    lvl:{ handler(v){ this.$emit('level', v); }, immediate:true },
    // Link change d'étage : la carte le suit, même si un autre étage avait été choisi (bouton d'étage, page Donjons)
    liveLvl(v, old){ if (v != null && old != null && v !== old) this.level = null; },
    // (après le changement de scène) : étage du premier repère, cadrage sur tous, avec une marge
    'focus.at'(){ this.applyFocus(); },
    // carte zoomée : elle se recentre sur Link quand il approche du bord
    liveMark(m){
      const v = this.view;
      if (!m || !v || this.drag) return;
      if (m.x < v[0] + v[2] * 0.1 || m.x > v[0] + v[2] * 0.9 || m.z < v[1] + v[3] * 0.1 || m.z > v[1] + v[3] * 0.9) this.view = [m.x - v[2] / 2, m.z - v[3] / 2, v[2], v[3]];
    },
  },
  mounted(){ if (this.focus) this.applyFocus(); },   // (carte ouverte à côté par la page Donjons)
  methods:{
    applyFocus(){
      const f = this.focus, pts = f && f.pts;
      if (!pts || !pts.length || !this.sc) return;
      if (this.sc.lv) this.level = mapLevelOf(this.sc, pts[0][1]);
      this.$nextTick(() => {
        if (!this.geo) return;
        const g = this.geo.view, xs = pts.map(p => p[0]), zs = pts.map(p => p[2]), min = Math.max(g[2], g[3]) * 0.3;
        const w = Math.max(min, (Math.max(...xs) - Math.min(...xs)) * 1.6), h = Math.max(min * 0.7, (Math.max(...zs) - Math.min(...zs)) * 1.6);
        const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cz = (Math.max(...zs) + Math.min(...zs)) / 2;
        this.view = [cx - w / 2, cz - h / 2, w, h];
      });
    },
    go(m){ if (m.to && !m.self && mapsData.value.scenes[mapBaseOf(m.to)]) this.$emit('goto', m.to); },
    // zoom à la molette (autour du curseur), déplacement en glissant le fond, boutons + / − / tout voir
    toWorld(ev){ const r = this.$refs.svg.getBoundingClientRect(), v = this.vb, k = Math.max(v[2] / r.width, v[3] / r.height);
      const ox = (r.width - v[2] / k) / 2, oy = (r.height - v[3] / k) / 2;
      return [v[0] + (ev.clientX - r.left - ox) * k, v[1] + (ev.clientY - r.top - oy) * k, k]; },
    zoom(f, at){ const v = this.vb, c = at || [v[0] + v[2] / 2, v[1] + v[3] / 2], g = this.geo.view, max = Math.max(g[2], g[3]) * 1.2;
      const w = Math.min(max, Math.max(150, v[2] * f)), h = v[3] * w / v[2];
      this.view = [c[0] - (c[0] - v[0]) * w / v[2], c[1] - (c[1] - v[1]) * h / v[3], w, h]; },
    wheel(ev){ this.zoom(ev.deltaY > 0 ? 1.2 : 1 / 1.2, this.toWorld(ev)); },
    down(ev){ if (ev.button !== 0) return; const k = this.toWorld(ev)[2]; this.drag = { sx:ev.clientX, sy:ev.clientY, v:[...this.vb], k, moved:false }; },
    move(ev){ const d = this.drag; if (!d) return; const dx = ev.clientX - d.sx, dy = ev.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.moved) this.view = [d.v[0] - dx * d.k, d.v[1] - dy * d.k, d.v[2], d.v[3]]; },
    // clic sans glisser en mode placement : point cliqué, hauteur du sol dessous (étage affiché ; le plus haut)
    up(ev){
      const d = this.drag; this.drag = null;
      if (!d || d.moved || !this.placing) return;
      const [x, z] = this.toWorld(ev);
      this.$emit('place', [Math.round(x), this.floorY(x, z), Math.round(z)]);
    },
    floorY(x, z){
      const f = this.sc.f;
      let best = null;
      for (let i = 0; i < f.length; i += 7){
        const y = f[i + 6];
        if (!this.onLevel(y)) continue;
        const dd = (ax, az, bx, bz) => (x - bx) * (az - bz) - (ax - bx) * (z - bz);
        const d1 = dd(f[i], f[i + 1], f[i + 2], f[i + 3]), d2 = dd(f[i + 2], f[i + 3], f[i + 4], f[i + 5]), d3 = dd(f[i + 4], f[i + 5], f[i], f[i + 1]);
        if ((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)) continue;
        if (best == null || y > best) best = y;
      }
      return best != null ? best : this.lvl != null ? this.sc.lv[this.lvl] : null;
    },
  },
  template:`<div class="zmap" :class="{compact}">
    <div v-if="!geo" class="zmap-empty">Pas de carte pour cette scène.</div>
    <div v-else class="zmap-frame">
      <svg ref="svg" :viewBox="vb.join(' ')" class="zmap-svg" :class="{dragging:drag && drag.moved, placing}" @wheel.prevent="wheel"
        @pointerdown="down" @pointermove="move" @pointerup="up" @pointerleave="drag=null">
        <image v-if="img" class="zmap-img" :href="img.url" :x="img.view[0]" :y="img.view[1]" :width="img.view[2]" :height="img.view[3]" preserveAspectRatio="none"></image>
        <template v-else>
        <defs><clipPath :id="geo.clip"><path :d="geo.floor" clip-rule="evenodd"></path></clipPath></defs>
        <path v-if="geo.ghost" :d="geo.ghost" class="zmap-ghost" fill-rule="evenodd"></path>
        <path :d="geo.floor" class="zmap-floor" fill-rule="evenodd"></path>
        <image v-if="geo.shade" class="zmap-shade" :href="geo.shade" :x="geo.shadeBox[0]" :y="geo.shadeBox[1]" :width="geo.shadeBox[2]" :height="geo.shadeBox[3]"
          preserveAspectRatio="none" :clip-path="'url(#' + geo.clip + ')'"></image>
        <path v-if="geo.water" :d="geo.water" class="zmap-water" fill-rule="evenodd"></path>
        <path :d="geo.floor" class="zmap-edge" :stroke-width="geo.unit * 0.3"></path>
        </template>
        <g v-if="path" class="zmap-path"><title>{{path.tip}}</title>
          <polyline class="zp-under" :points="pathLine" :stroke-width="unit * 1.5"></polyline>
          <polyline :points="pathLine" :stroke-width="unit * 0.8"></polyline>
          <path v-for="(a,i) in pathArrows" :key="i" d="M-1.3 -1.2 L1.3 0 L-1.3 1.2 Z" :transform="'translate(' + a.x + ' ' + a.z + ') rotate(' + a.deg + ') scale(' + unit * 1.3 + ')'"></path>
          <circle :cx="path.pts[path.pts.length - 1][0]" :cy="path.pts[path.pts.length - 1][1]" :r="unit * 1.4"></circle></g>
        <g v-for="m in shown" :key="m.c.id" class="zc zc-check" :class="{done:m.st==='done', now:m.st==='now', approx:placing !== undefined && m.approx && editing}" @pointerdown.stop @click.stop="$emit('check', m.c)">
          <circle :cx="m.x" :cy="m.z" :r="unit * (m.st==='done' ? 0.6 : 0.85)"></circle><title>{{m.tip}}</title></g>
        <g v-for="(p,i) in (focus && focus.pts) || []" :key="'f' + i" v-show="onLevel(p[1])" class="zf"><circle class="zf-ring" :cx="p[0]" :cy="p[2]" :r="unit * 2.4"></circle>
          <circle class="zf-ring zf-in" :cx="p[0]" :cy="p[2]" :r="unit * 1.5"></circle></g>
        <g v-for="m in placedShown" :key="'e:' + m.c.id" class="ze-mark" :class="{moving:m.moving}">
          <rect :x="m.x - unit * 0.9" :y="m.z - unit * 0.9" :width="unit * 1.8" :height="unit * 1.8" :rx="unit * 0.3"></rect>
          <title>{{m.c.label}} (placé à la main)</title></g>
        <g v-for="m in stones" :key="m.id" v-show="onLevel(m.y)" class="zs" :class="{read:m.read}" @pointerdown.stop @click.stop="$emit('stone', m.id)"
          :transform="'translate(' + m.x + ' ' + m.z + ') rotate(45)'">
          <rect :x="-unit * 0.8" :y="-unit * 0.8" :width="unit * 1.6" :height="unit * 1.6"></rect><title>{{m.tip}}</title></g>
        <g v-for="(h,i) in holes" :key="'h' + i" v-show="onLevel(h.y)" class="zm zg" @pointerdown.stop @click.stop="$emit('goto', h.to)">
          <rect class="zm-shape" :x="h.x - unit * 1.1" :y="h.z - unit * 1.1" :width="unit * 2.2" :height="unit * 2.2" :transform="'rotate(45 ' + h.x + ' ' + h.z + ')'"></rect>
          <text :x="h.x" :y="h.z - unit * 2" :font-size="unit * 1.7">{{h.label}}</text>
          <title>{{t('Grotte : {lieu} — clic : voir sa carte', {lieu:h.label})}}</title>
          <g v-if="counts[h.to]" class="zc-place" :class="{now:counts[h.to].now, done:!counts[h.to].todo}">
            <rect :x="h.x + unit * 1.1" :y="h.z + unit * 0.4" :width="unit * 2.4" :height="unit * 2" :rx="unit * 0.4"></rect>
            <text :x="h.x + unit * 2.3" :y="h.z + unit * 1.4" dominant-baseline="central" :font-size="unit * 1.4">{{counts[h.to].todo}}</text></g></g>
        <g v-for="m in exits" :key="m.id" class="zm zx" :class="{self:m.self, sel:hover===m.id}" @pointerdown.stop @click.stop="go(m)"
          @mouseenter="hover=m.id" @mouseleave="hover=null">
          <circle class="zm-shape" :cx="m.x" :cy="m.z" :r="unit * (hover===m.id ? 1.6 : 1.2)"></circle>
          <text :x="m.x" :y="m.z - unit * 2" :font-size="unit * (hover===m.id ? 2.3 : 1.8)">{{m.label}}</text>
          <title>{{m.self ? m.label : t('Vers {lieu} — clic : voir sa carte', {lieu:m.label})}}{{m.cnt ? ' · ' + tn(m.cnt.todo, '{n} check à faire sur {total}', '{n} checks à faire sur {total}', {total:m.cnt.total}) : ''}}</title>
          <g v-if="m.cnt" class="zc-place" :class="{now:m.cnt.now, done:!m.cnt.todo}">
            <rect :x="m.x + unit * 1.1" :y="m.z + unit * 0.4" :width="unit * 2.4" :height="unit * 2" :rx="unit * 0.4"></rect>
            <text :x="m.x + unit * 2.3" :y="m.z + unit * 1.4" dominant-baseline="central" :font-size="unit * 1.4">{{m.cnt.todo}}</text></g>
        </g>
        <g v-if="liveMark" class="zl" :class="'fm-' + liveMark.form" :transform="'translate(' + liveMark.x + ' ' + liveMark.z + ') rotate(' + liveMark.deg + ')'">
          <circle class="zl-halo" :r="unit * 3.6"></circle>
          <path :d="'M0 ' + unit * 3 + 'L' + unit * -2.1 + ' ' + unit * -2 + 'L0 ' + unit * -0.9 + 'L' + unit * 2.1 + ' ' + unit * -2 + 'Z'"></path>
          <title>{{t('Link (en direct)')}}</title></g>
      </svg>
      <div v-if="levels" class="zmap-levels"><button v-for="l in levels" :key="l.i" type="button" :class="{on:l.i===lvl}" @click="level=l.i"
        :title="t('Étage {n}', {n:l.name}) + (l.todo ? ' — ' + tn(l.todo, '{n} check à faire', '{n} checks à faire') : '')">{{l.name}}<i v-if="l.todo">{{l.todo}}</i></button></div>
      <div v-if="!compact" class="zmap-zoom"><button type="button" title="Zoomer" @click="zoom(1 / 1.5)">+</button><button type="button" title="Dézoomer" @click="zoom(1.5)">−</button>
        <button type="button" title="Tout le terrain" @click="view = null">▢</button></div>
    </div>
  </div>`,
};

/* ---------- Page ---------- */
const MAPS_BUILD_TPL = `
        <div class="maps-build">
          <p>Les cartes se fabriquent depuis votre propre ROM de Majora's Mask (N64, version américaine : .z64, .n64, .v64,
            celle que 2Ship a demandée à l’installation). Elle est lue ici, dans le navigateur : rien n’est envoyé. Les
            cartes sont ensuite gardées dans ce navigateur.</p>
          <label class="si-drop" :class="{has:mapsJob.file}" @dragover.prevent @drop.prevent="mapsJob.file = $event.dataTransfer.files[0] || mapsJob.file">
            <input type="file" accept=".z64,.n64,.v64,.rom,.bin" hidden :disabled="mapsJob.busy" @change="mapsJob.file = $event.target.files[0] || null">
            <span class="si-ic" v-html="ICONS.file"></span>
            <span v-if="mapsJob.file" class="si-txt"><b>{{mapsJob.file.name}}</b><small>ROM de Majora's Mask</small></span>
            <span v-else class="si-txt"><b>Choisir la ROM de Majora's Mask…</b><small>ou la glisser ici</small></span>
          </label>
          <div class="maps-build-go"><button type="button" class="btn primary" :disabled="!mapsJob.file || mapsJob.busy" @click="mapsMake">Fabriquer les cartes</button>
            <div v-if="mapsJob.busy" class="maps-progress"><div class="bar"><i :style="{width:Math.round(mapsJob.part * 100) + '%'}"></i></div></div></div>
          <div v-if="mapsJob.err" class="msg ko">{{mapsJob.err}}</div>
        </div>`;

const MAP_TPL = paneTpl('map', `<h1>Carte</h1><p class="lede">Chaque lieu de Termina vu de dessus (nord en haut).</p>`, `
      <div v-if="!mapsData" class="panel-card maps-none"><h3>Pas encore de cartes</h3>${MAPS_BUILD_TPL}</div>
      <template v-else>
        <details v-if="MAPS_INFO.old" class="msg ko maps-old"><summary>Ces cartes ont été fabriquées avec une version précédente de l’appli
          (sans les checks, ou avec des positions moins justes) : refaites-les.</summary>${MAPS_BUILD_TPL}</details>
        <div class="zmap-bar">
          <button v-if="mapBack.length" type="button" class="btn zmap-back" @click="mapGoBack" :title="t('Retour à {lieu}', {lieu:mapSceneName(mapBack[mapBack.length - 1])})">←</button>
          <select class="sel map-scene" v-model="mapScene" aria-label="Lieu">
            <optgroup v-for="g in mapSceneGroups" :key="g.label" :label="g.label">
              <option v-for="s in g.list" :key="s" :value="s">{{mapSceneName(s)}}{{ui.map.editTool ? ' (' + mapMissing(s) + ')' : ''}}</option></optgroup></select>
          <div class="map-opts">
          <div class="field map-chk" title="Checks : comme la page Checks, ses filtres (catégories, checks faits masqués, seulement les faisables, moment, recherche). Tous : tous les checks de la seed, faits compris. Les checks exclus n’apparaissent jamais (sauf avec l’outil de placement : tous les checks du jeu)."><span class="lbl">Checks</span>
            <seg v-model="ui.map.checks" :options="[['filters', t('Checks')], ['all', t('Tous')], ['off', t('Aucun')]]"></seg></div>
          <div class="field map-chk map-stones" title="Pierres à potins sur la carte (clic sur l'une d'elles : lue / non lue)"><span class="lbl">Pierres à potins</span>
            <seg v-model="ui.map.stones" :options="[[true, t('Affichées')], [false, t('Masquées')]]"></seg></div>
          <div v-if="link.relay==='live'" class="field map-chk map-follow" title="Suivi en direct : la carte suit Link de lieu en lieu (on peut en regarder une autre, elle revient à Link quand il change de lieu)">
            <label class="check"><input type="checkbox" v-model="ui.map.follow">Suivre Link</label>
            <button v-if="liveMap && liveMap !== ui.map.scene" type="button" class="btn" @click="mapToLink" :title="t('Afficher la carte du lieu où est Link : {lieu}', {lieu:mapSceneName(liveMap)})">Où est Link ?</button></div>
          <div v-if="mapImgHere" class="field map-chk" :title="t('Fond de ce lieu : votre image ({name}), ou le plan calculé', {name:mapImgHere.name})"><span class="lbl">Fond</span>
            <seg v-model="ui.map.img" :options="[[true, t('Image')], [false, t('Plan')]]"></seg></div>
          <div v-if="woodsHere" class="field map-chk" title="Chemin du singe à travers les Bois Perdus, différent chaque jour. Auto : le jour de la sauvegarde suivie (auto-tracking), sinon celui du moment choisi sur la page Checks, sinon le jour 1."><span class="lbl">Chemin</span>
            <seg v-model="ui.map.woods" :options="[['auto', t('Auto')], ['1', t('Jour {n}', {n:1})], ['2', t('Jour {n}', {n:2})], ['3', t('Jour {n}', {n:3})], ['off', t('Masqué')]]"></seg></div>
          </div>
          <button v-if="ui.map.editTool" type="button" class="btn zmap-edit-btn" :class="{on:mapEdit}" @click="mapEdit = !mapEdit; mapPick = {}"
            title="Placer à la main les checks qui n'ont pas de position">✎ Placer les checks</button>
        </div>
        <div v-if="mapGroups.length > 1" class="zmap-tabs map-groups" title="Plusieurs grottes partagent cette salle : choisissez celle dont afficher les checks">
          <button type="button" :class="{on:!mapGroup}" @click="mapGroup = ''">Tous</button>
          <button v-for="g in mapGroups" :key="g.id" type="button" :class="{on:mapGroup===g.id}" @click="mapGroup = g.id">{{g.label}} <small>{{g.n}}</small></button></div>
        <div v-for="(h,i) in mapHints" :key="'h' + i" class="zmap-hint"><span class="zh-ic" v-html="ICONS.hint"></span>
          <div><b>{{h.title}}</b> — {{h.text}}<span v-if="h.notes" class="zh-notes"><template v-for="(b,j) in h.notes" :key="j"><i v-if="b === '|'" class="zh-sep"></i>
            <img v-else :src="iconSrc(ITEM_BY_KEY['ocarina_button_' + b.toLowerCase()])" :alt="b"></template></span></div></div>
        <map-view :scene="mapBase" :holes="mapHoles" :home="mapHome" :counts="mapPlaceCounts" :stones="ui.map.stones ? hintStones(mapBase) : []" @stone="toggleHint" :path="mapPath" :focus="mapFocus.scene === mapBase ? mapFocus : null" :live="mapLive" :images="ui.map.img" @level="mapLevel = $event" :checks="mapChecks" :placing="mapEdit && mapPicked.length > 0" :editing="mapEdit" :placed="mapEdit ? mapPlacedHere : []"
          @goto="mapGoto" @check="toggleCheck" @place="mapPlace"></map-view>
        <div v-if="mapEdit" class="zmap-edit">
          <div class="ze-head"><b>Placer les checks sans position</b>
            <span class="muted">Cochez un ou plusieurs checks, puis cliquez sur la carte à leur emplacement (à l’étage affiché).</span>
            <span class="ze-btns"><button type="button" class="btn" :disabled="!mapEditCount" @click="mapExport" title="Télécharge positions-manuelles.json, à déposer dans tools/2ship-maps/">{{t('Exporter ({n})', {n:mapEditCount})}}</button>
              <button type="button" class="btn" :disabled="!Object.keys(mapEdits).length" @click="mapClearEdits">Tout effacer</button></span></div>
          <div class="ze-cols">
            <div><h4>À placer <small>{{mapToPlace.length}}</small></h4>
              <p v-if="!mapToPlace.length" class="muted">Rien à placer dans ce lieu.</p>
              <label v-for="c in mapToPlace" :key="c.id" class="check ze-row" :title="mapCheckHelp(c)"><input type="checkbox" v-model="mapPick[c.id]"><span class="ci-cat cat-svg" v-html="CHECK_CAT[c.cat].icon"></span>
                <span>{{c.label}}<small class="ze-id">{{c.id}} · {{c.en}}</small></span></label></div>
            <div v-if="mapApprox.length"><h4 title="Positions déduites du personnage (il bouge selon l'heure), d'un check voisin ou du boss : à vérifier, et à placer à la main si elles sont fausses">À vérifier <small>{{mapApprox.length}}</small></h4>
              <p class="muted ze-note">Juste : « valider » ; fausse : cochez, puis cliquez sur la carte au bon endroit.</p>
              <div v-for="c in mapApprox" :key="c.id" class="ze-row ze-approx" :class="{moving:mapPick[c.id]}" :title="mapCheckHelp(c)">
                <label class="check"><input type="checkbox" v-model="mapPick[c.id]"><span class="ci-cat cat-svg" v-html="CHECK_CAT[c.cat].icon"></span>
                  <span>{{c.label}}<small class="ze-id">{{c.id}} · {{c.en}}</small></span></label>
                <button type="button" class="linklike" @click="mapValidate(c.id)" title="La position est juste : la garder telle quelle (placée à la main, exportée)">valider</button></div></div>
            <div><h4>Placés à la main <small>{{mapPlacedList.length}}</small></h4>
              <p v-if="!mapPlacedList.length" class="muted">Aucun pour l’instant.</p>
              <div v-for="x in mapPlacedList" :key="x.c.id" class="ze-row" :class="{moving:mapPick[x.c.id]}"><span class="ci-cat cat-svg" v-html="CHECK_CAT[x.c.cat].icon"></span>
                <span>{{x.c.label}} <small v-if="x.local">· {{t('pas encore exporté')}}</small></span>
                <button type="button" class="linklike" @click="mapPick = {[x.c.id]:true}">{{mapPick[x.c.id] ? t('cliquez sur la carte') : t('déplacer')}}</button>
                <button v-if="x.local" type="button" class="linklike" @click="delete mapEdits[x.c.id]">retirer</button></div></div>
          </div>
        </div>
        <div class="zmap-legend"><span><i class="lg-chk now"></i>Check faisable</span><span><i class="lg-chk"></i>Pas encore</span><span><i class="lg-chk done"></i>Fait</span>
          <span class="muted">{{ui.map.editTool ? t('(outil de placement : tous les checks du jeu, sans filtres)') : t('(clic : cocher)')}}</span></div>
        <div class="zmap-legend"><span><i class="lg-ground"></i>Sol, ombré selon le relief</span><span><i class="lg-water"></i>Eau</span>
          <span><i class="lg-exit"></i>Sortie (clic : voir la carte du lieu d’arrivée)</span><span><i class="lg-stone"></i>Pierre à potins (clic : lue)</span>
          <span v-if="mapPath"><i class="lg-path"></i>{{mapPath.tip}}</span>
          <span v-if="mapLive"><i class="lg-link" :class="'fm-' + mapLive.form"></i>Link, en direct (couleur de sa forme)</span></div>
        <div class="maps-img">
          <button type="button" class="btn" @click="mapImgExportOne" title="Le fond de ce lieu (à cet étage) en image PNG, sans les repères : à retoucher puis importer">Exporter cette carte (PNG)</button>
          <button type="button" class="btn" :disabled="mapImgJob.busy" @click="mapImgExportAll" title="Le fond de tous les lieux (et de chaque étage) en images PNG, dans un fichier .zip">Exporter toutes les cartes (.zip)</button>
          <label class="btn import-btn" :class="{disabled:mapImgJob.busy}" title="Images PNG (ou .zip) exportées puis retouchées, sans les recadrer : chacune remplace le plan de son lieu (et de son étage)">Importer des images…<input type="file" accept=".png,.zip,image/png,application/zip" multiple hidden :disabled="mapImgJob.busy" @change="mapImgImport"></label>
          <button v-if="mapImgHere" type="button" class="btn" @click="mapImgRemoveHere">Retirer l’image de ce lieu</button>
          <button v-if="mapImgCount" type="button" class="link" @click="mapImgClearAsk">{{t('Retirer toutes les images ({n})', {n:mapImgCount})}}</button>
          <div v-if="mapImgJob.busy && mapImgJob.part" class="maps-progress"><div class="bar"><i :style="{width:Math.round(mapImgJob.part * 100) + '%'}"></i></div></div>
          <span v-if="mapImgJob.msg" class="maps-img-msg" :class="{ko:mapImgJob.ko}">{{mapImgJob.msg}}</span>
        </div>
        <p class="maps-src">{{MAPS_INFO.source === 'file' ? t('Cartes du fichier data/maps-data.js.') : t('Cartes fabriquées dans ce navigateur depuis {rom}.', {rom:MAPS_INFO.rom || 'la ROM'})}}
          <button v-if="MAPS_INFO.source === 'browser'" type="button" class="link" @click="mapsForgetAsk">Oublier ces cartes</button>
          <label class="check maps-tool" title="Outil pour placer à la main les checks sans position, et exporter ces positions (contributeurs)"><input type="checkbox" v-model="ui.map.editTool">Outil de placement des checks</label></p>
      </template>
      <div v-if="lastCheck && !shown('checks') && !shown('notebook')" class="toast" role="status">{{lastCheck.text}}
        <button type="button" @click="undoCheck"><span v-html="ICONS.undo"></span>Annuler</button></div>`);

function useMapPage(ctx){
  const { ui } = ctx;
  // lieu affiché (ui.map.scene) et retour (lieux précédents, le temps de la session)
  const mapBack = ref([]);
  const mapScene = computed({ get:() => ui.map.scene, set:v => { if (v !== ui.map.scene){ mapBack.value.push(ui.map.scene); ui.map.scene = v; } } });
  const mapGoto = s => { mapScene.value = s; };
  const mapGoBack = () => { const s = mapBack.value.pop(); if (s) ui.map.scene = s; };
  // carte dessinée (grotte : sa salle) et grotte affichée ; trous de grotte de la carte ; lieu extérieur d'une grotte
  const mapBase = computed(() => mapBaseOf(ui.map.scene));
  /* Bois Perdus : chemin du singe selon le jour (ui.map.woods ; auto : jour de la sauvegarde suivie, sinon du moment de la
     page Checks, sinon jour 1). Depuis la sortie est de la clairière 6 (l'entrée), puis le centre de chaque clairière. */
  const woodsHere = computed(() => mapBase.value === WOODS_SCENE);
  // chemin tracé sur la carte : Bois Perdus (selon le jour)
  const mapPath = computed(() => woodsHere.value ? woodsPath.value : null);
  const mapHints = computed(() => MAP_HINTS[mapBase.value] || []);
  const woodsPath = computed(() => {
    if (!woodsHere.value || ui.map.woods === 'off') return null;
    const half = store.game.cycle.half, m = ui.checks.moment;
    const day = ui.map.woods !== 'auto' ? +ui.map.woods : half >= 0 ? Math.floor(half / 2) + 1 : half === -1 ? 1 : m >= 0 ? Math.floor(m / 2) + 1 : 1;
    return { day, pts:[WOODS_DOOR, ...WOODS_PATHS[day].map(woodsXZ)], tip:t('Chemin du jour {n}', { n:day }) };
  });
  /* Link en direct (relais, link.live) : sa carte — sa scène ; grotte : sa salle (salle partagée par plusieurs grottes : celle
     affichée, sinon la première) — et son repère sur la carte affichée, orienté, de la couleur de sa forme. La carte suit Link
     de lieu en lieu (ui.map.follow) : on peut en regarder une autre, elle revient à Link quand il change de lieu. */
  const liveMap = computed(() => {
    const L = link.live, m = mapsData.value;
    if (!L || !L.scene || !m) return null;
    const base = L.scene === 'SCENE_KAKUSIANA' ? L.scene + '#' + L.room : L.scene;
    if (!m.scenes[base]) return null;
    const keys = GROTTO_MAPS.value.roomKeys[base];
    return !keys ? base : mapBaseOf(ui.map.scene) === base ? ui.map.scene : base + '|' + keys[0];
  });
  const mapLive = computed(() => {
    const L = link.live;
    if (!L || !L.pos || !liveMap.value || mapBaseOf(liveMap.value) !== mapBase.value) return null;
    return { x:L.pos[0], y:L.pos[1], z:L.pos[2], deg:-(L.rot || 0) * 360 / 65536, form:LIVE_FORM[L.form] || 'human' };
  });
  const liveBase = computed(() => liveMap.value && mapBaseOf(liveMap.value));
  const mapToLink = () => { if (liveMap.value) mapScene.value = liveMap.value; };
  watch(liveBase, b => { if (b && ui.map.follow && b !== mapBase.value) mapToLink(); });
  watch(() => ui.map.follow, on => { if (on && liveBase.value && liveBase.value !== mapBase.value) mapToLink(); });
  const mapHoles = computed(() => (GROTTO_MAPS.value.holes[mapBase.value] || []).map(h => ({ ...h, label:mapSceneName(h.to) })));
  const mapHome = computed(() => (GROTTO_MAPS.value.byId[ui.map.scene] || {}).home || null);
  // choix du lieu : par région (MAP_REGIONS), lieux dans l'ordre du chemin puis grottes de la région (d'après leur trou)
  const mapSceneGroups = computed(() => {
    const m = mapsData.value;
    if (!m) return [];
    // (provisoire) outil de placement affiché : seulement les lieux qui ont des checks sans position (et le lieu affiché)
    const keep = id => !ui.map.editTool || id === ui.map.scene || mapMissing(id) > 0;
    const groups = MAP_REGIONS.map(r => ({ id:r.id, label:r.label, list:r.list.filter(id => m.scenes[id]) }));
    const byId = Object.fromEntries(groups.map(g => [g.id, g])), other = byId.autres;
    for (const id of Object.keys(m.scenes).sort((x, y) => mapSceneName(x).localeCompare(mapSceneName(y))))
      if (!MAP_REGION_OF[id] && id !== 'SCENE_SPOT00' && !id.startsWith('SCENE_KAKUSIANA')) other.list.push(id);
    for (const g of GROTTO_MAPS.value.list) (byId[MAP_REGION_OF[g.home]] || other).list.push(g.id);
    return groups.map(g => ({ label:g.label, list:g.list.filter(keep) })).filter(g => g.list.length);
  });
  // checks de la scène affichée : ceux de la seed (non exclus) placés sur cette carte, filtrés comme la page Checks
  // (catégories masquées, checks faits masqués, seulement les faisables)
  const { canNow, seedChecks, logicFull } = ctx;
  /* Badges des portes : checks restants de chaque intérieur (scènes rattachées à leur extérieur par 2Ship : boutiques,
     maisons, fontaines… — HINT_PARENT) et de chaque grotte, mêmes checks que les repères (réglage Checks) ; vert : un
     faisable, rouge : aucun, gris : tout fait. Salle commune à plusieurs grottes : par grotte (sur leurs trous) seulement. */
  const mapPlaceCounts = computed(() => {
    const out = {};
    if (!mapsData.value || ui.map.checks === 'off' || ui.map.editTool) return out;
    const f = ui.checks, filters = ui.map.checks === 'filters', rooms = GROTTO_MAPS.value.roomKeys;
    for (const c of seedChecks.value){
      const p = checkPos(c.id);
      if (!p || store.settings.excluded[c.id]) continue;
      const base = p[0], grotto = String(base).startsWith('SCENE_KAKUSIANA');
      if (!grotto && !HINT_PARENT.has(base)) continue;
      const done = !!store.game.checks[c.id], now = !done && canNow(c);
      if (filters && (f.hiddenCats[c.cat] || (f.hideDone && done) || (f.onlyAvailable && !done && !now))) continue;
      const k = grotto && rooms[base] ? base + '|' + grottoKeyIn(c, base) : base, o = out[k] = out[k] || { todo:0, total:0, now:false };
      o.total++;
      if (!done){ o.todo++; if (now) o.now = true; }
    }
    return out;
  });
  // carte d'un lieu de la page Checks (bouton des pages Checks et Journal) : sa scène, si elle a une carte
  const mapOfScene = id => mapsData.value && mapsData.value.scenes[id] ? id : null;
  /* checks mis en lumière (page Donjons) : leurs positions, dans la carte où il y en a le plus ; la Carte s'ouvre à côté si
     l'écran le permet, sinon à la place de la page. → false si aucun n'a de position (cartes pas fabriquées…) */
  function focusMap(ids){
    const at = ids.map(checkPos).filter(p => p && mapOfScene(mapBaseOf(p[0])));
    if (!at.length) return false;
    const by = {};
    for (const p of at) (by[p[0]] = by[p[0]] || []).push(p);
    const scene = Object.keys(by).sort((a, b) => by[b].length - by[a].length)[0];
    Object.assign(mapFocus, { scene:mapBaseOf(scene), pts:by[scene].map(p => [p[1], p[2], p[3]]), at:Date.now() });
    ui.map.scene = scene;
    if (!ctx.shown('map')){ if (ctx.canSplit.value) ctx.openSide('map'); else ctx.go('map'); }
    return true;
  }
  function openMapOf(id){ if (!mapOfScene(id)) return; ui.map.scene = id; ctx.go('map'); }
  const normMap = x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mapChecks = computed(() => mapGroup.value ? mapChecksAll.value.filter(m => groupOf(m.c) === mapGroup.value) : mapChecksAll.value);
  const mapChecksAll = computed(() => {
    const out = [];
    if (!mapsData.value) return out;
    /* Checks affichés (ui.map.checks) : « Checks » (filters), comme la page Checks — ses filtres : catégories, checks faits masqués,
       seulement les faisables (au moment choisi), recherche ; « Tous » (all) : tous ceux de la seed non exclus, faits
       compris ; « Aucun » (off). Outil de placement affiché : tous les checks du jeu, sans filtres (vérifier les positions). */
    const f = ui.checks, s = store.settings, game = ui.map.editTool, mode = ui.map.checks;
    if (mode === 'off' && !game) return out;
    const filters = !game && mode === 'filters', q = filters && f.q.trim() ? normMap(f.q.trim()) : '';
    for (const c of game ? CHECKS : seedChecks.value){
      const p = checkPos(c.id);
      if (!p || p[0] !== mapBase.value || (!game && s.excluded[c.id]) || !inMap(c, ui.map.scene)) continue;
      const done = !!store.game.checks[c.id], now = !done && canNow(c);
      if (filters && (f.hiddenCats[c.cat] || (f.hideDone && done) || (f.onlyAvailable && !done && !now))) continue;
      if (q && !normMap(c.label).includes(q) && !normMap(CHECK_SCENE[c.scene] ? CHECK_SCENE[c.scene].label : '').includes(q)) continue;
      const w = logicFull.value.checks[c.id], when = w && w.ok ? whenText(w.when, c.id) : null;
      out.push({ c, x:p[1], y:p[2], z:p[3], approx:!!p[4] && !mapEdits[c.id] && !MAPS_RECIPE.manual[c.id], st:done ? 'done' : now ? 'now' : 'later',
        tip:c.label + ' — ' + (done ? t('fait') : now ? t('faisable') : t('pas encore faisable')) + (when ? ' · ' + when : '') });
    }
    // (faits dessous, faisables dessus)
    const rank = { done:0, later:1, now:2 };
    return out.sort((a, b) => rank[a.st] - rank[b.st]);
  });
  /* Lieux de la page Checks des checks affichés : grottes (une salle commune à plusieurs grottes : leurs checks au même
     endroit) ; boutons pour n'afficher que ceux d'un lieu (mapGroup, remis à zéro en changeant de lieu) */
  const mapGroup = ref('');
  watch(() => ui.map.scene, () => { mapGroup.value = ''; });
  // groupe d'un check : sa grotte (RC_…_GROTTO, nommée d'après ses libellés « (grotte du pilier) »), sinon son lieu
  const groupOf = checkGroupOf;
  const mapGroups = computed(() => {
    const g = {};
    for (const m of mapChecksAll.value){
      const k = groupOf(m.c), x = g[k] = g[k] || { id:k, n:0, label:CHECK_SCENE[m.c.scene] ? CHECK_SCENE[m.c.scene].label : m.c.scene, grotto:k !== m.c.scene ? '' : null };
      x.n++;
      if (x.grotto === '' || x.grotto === t('grotte')){ const p = /\(([^)]*grotte[^)]*)\)/i.exec(m.c.label); x.grotto = p ? p[1] : t('grotte'); }
    }
    // (seulement là où des grottes partagent la salle : ailleurs, un check classé sous un lieu voisin ne justifie pas de choix)
    if (!Object.values(g).some(x => x.grotto)) return [];
    return Object.values(g).map(x => ({ id:x.id, n:x.n, label:x.label + (x.grotto ? ' · ' + x.grotto : '') })).sort((a, b) => a.label.localeCompare(b.label));
  });
  /* Placement à la main (ui.map.editTool : outil affiché) : checks du lieu sans position, choisis puis placés d'un clic ;
     positions gardées dans le navigateur (mapEdits), exportées en positions-manuelles.json (avec celles de la recette) */
  const mapEdit = ref(false), mapPick = ref({});
  const mapPicked = computed(() => Object.keys(mapPick.value).filter(id => mapPick.value[id]));
  // scène d'origine du lieu affiché (variantes : celle dont elles partagent les checks)
  const origScene = sc => sc.startsWith('SCENE_KAKUSIANA') ? 'SCENE_KAKUSIANA' : Object.keys(MAPS_RECIPE.variants).find(o => MAPS_RECIPE.variants[o].includes(sc)) || sc;
  // nombre de checks sans position d'un lieu (outil de placement)
  // (ennemis : n'importe quel ennemi de ce type, pas d'emplacement)
  const placeable = id => CHECK_BY_ID[id] && CHECK_BY_ID[id].cat !== 'ENEMY_DROP' && !checkPos(id);
  // (checks sans position du lieu, et positions approchées à vérifier sur sa carte)
  const mapMissing = sc => { const auto = (mapsData.value && mapsData.value.checks) || {};
    return (MAPS_RECIPE.cs[origScene(sc)] || []).filter(id => placeable(id) && ownsUnplaced(CHECK_BY_ID[id], sc)).length
      + Object.keys(auto).filter(id => auto[id][4] && auto[id][0] === mapBaseOf(sc) && !mapEdits[id] && !MAPS_RECIPE.manual[id] && CHECK_BY_ID[id] && inMap(CHECK_BY_ID[id], sc)).length; };
  // aide pour identifier un check à placer : catégorie, nom anglais de 2Ship, pourquoi il n'a pas de position
  const mapCheckHelp = c => CHECK_CAT[c.cat].label + ' — ' + c.en + ' (' + c.id + ')\n' + (MAPS_RECIPE.loc[c.id]
    ? t('Son acteur n’est pas dans les salles du jeu (il apparaît en cours de partie) : à placer à la main.')
    : t('Pas de règle de placement dans les sources de 2Ship : à placer à la main.'));
  const mapToPlace = computed(() => (MAPS_RECIPE.cs[origScene(ui.map.scene)] || []).filter(id => placeable(id) && ownsUnplaced(CHECK_BY_ID[id], ui.map.scene)).map(id => CHECK_BY_ID[id]));
  // positions approchées du lieu (personnages, voisins, boss), pas encore placées à la main : à vérifier
  const mapApprox = computed(() => {
    const auto = mapsData.value && mapsData.value.checks;
    if (!auto) return [];
    return Object.keys(auto).filter(id => auto[id][4] && auto[id][0] === mapBase.value && !mapEdits[id] && !MAPS_RECIPE.manual[id] && CHECK_BY_ID[id] && inMap(CHECK_BY_ID[id], ui.map.scene))
      .map(id => CHECK_BY_ID[id]).sort((a, b) => a.label.localeCompare(b.label));
  });
  const mapPlacedList = computed(() => {
    const out = [];
    for (const [id, p] of Object.entries({ ...MAPS_RECIPE.manual, ...mapEdits })){
      const sc = Array.isArray(p) ? p[0] : p.scene;
      if (sc === mapBase.value && CHECK_BY_ID[id] && inMap(CHECK_BY_ID[id], ui.map.scene)) out.push({ c:CHECK_BY_ID[id], local:!!mapEdits[id] });
    }
    return out.sort((x, y) => x.c.label.localeCompare(y.c.label));
  });
  const mapPlacedHere = computed(() => mapPlacedList.value.map(x => { const p = checkPos(x.c.id); return { c:x.c, x:p[1], y:p[2], z:p[3], moving:!!mapPick.value[x.c.id] }; }));
  // position approchée juste : la garder telle quelle, comme placée à la main (elle quitte « À vérifier », part dans l'export)
  function mapValidate(id){
    const p = mapsData.value && mapsData.value.checks[id];
    if (p) mapEdits[id] = { scene:p[0], x:p[1], y:p[2], z:p[3] };
    delete mapPick.value[id];
  }
  function mapPlace([x, y, z]){
    for (const id of mapPicked.value) mapEdits[id] = { scene:mapBase.value, x, y, z };
    mapPick.value = {};
  }
  const mapEditCount = computed(() => Object.keys({ ...MAPS_RECIPE.manual, ...mapEdits }).length);
  function mapExport(){
    const out = {}, all = { ...MAPS_RECIPE.manual, ...mapEdits };
    for (const id of Object.keys(all).sort()){ const p = all[id]; out[id] = Array.isArray(p) ? { scene:p[0], x:p[1], y:p[2], z:p[3] } : p; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1) + '\n'], { type:'application/json' }));
    a.download = 'positions-manuelles.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function mapClearEdits(){ if (confirm(t('Effacer les positions placées à la main pas encore exportées (tous lieux) ?'))) for (const k of Object.keys(mapEdits)) delete mapEdits[k]; }
  // fabrication depuis la ROM
  const mapsJob = reactive({ file:null, busy:false, part:0, err:'' });
  const MAPS_ERR = { 'not-mm':t('Ce fichier n’est pas une ROM de Majora’s Mask.'), 'no-scene-table':t('Version de la ROM non reconnue (attendu : Majora’s Mask N64, version américaine).'),
    idb:t('Le navigateur refuse de garder les cartes (navigation privée ?).') };
  async function mapsMake(){
    mapsJob.busy = true; mapsJob.err = ''; mapsJob.part = 0;
    try { await mapsBuild(mapsJob.file, (s, p) => { mapsJob.part = p; }); }
    catch (e){ console.error(e); mapsJob.err = MAPS_ERR[e.message] || t('Fabrication impossible : {err}', { err:e.message }); }
    mapsJob.busy = false;
  }
  function mapsForgetAsk(){ if (confirm(t('Oublier les cartes gardées dans ce navigateur ?'))) mapsForget(); }
  return { mapLive, liveMap, mapToLink, mapFocus, focusMap, mapPlaceCounts, mapOfScene, openMapOf, mapBase, mapHoles, mapHome, mapValidate, mapApprox, mapGroup, mapGroups, mapCheckHelp, mapMissing, mapEdit, mapPick, mapPicked, mapToPlace, mapPlacedList, mapPlacedHere, mapPlace, mapEditCount, mapExport, mapClearEdits, mapEdits,
    mapChecks, mapsData, MAPS_INFO, woodsHere, woodsPath, mapPath, mapHints, mapScene, mapBack, mapGoto, mapGoBack, mapSceneGroups, mapSceneName, mapsJob, mapsMake, mapsForgetAsk };
}
