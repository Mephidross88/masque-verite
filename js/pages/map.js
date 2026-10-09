/* ---------- Page Carte : chaque scène vue de dessus ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Cartes : fabriquées depuis la ROM de Majora's Mask du joueur (js/maps-extract.js, chargé à la demande, recette
   data/maps-recipe.js tirée des sources de 2Ship), gardées dans IndexedDB (base masque-verite-maps) ; data/maps-data.js
   (outil en ligne de commande, non versionné), s'il est présent, passe avant. Rien de la ROM n'est publié. */

const MAPS_VER = 6;   // (à augmenter quand le calcul change : les cartes du navigateur sont alors à refaire)
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
  out.list.sort((a, b) => a.label.localeCompare(b.label));
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
  return key ? checkGroupOf(c) === key : true;
}

/* Positions des checks : placées à la main dans ce navigateur (mapEdits, localStorage masque-verite-positions, pas encore
   exportées), puis celles de la recette (positions-manuelles.json), sinon celles calculées depuis la ROM. → [scène, x, y, z] */
const POS_KEY = 'masque-verite-positions';
const mapEdits = reactive((() => { try { return JSON.parse(localStorage.getItem(POS_KEY)) || {}; } catch (e) { return {}; } })());
watch(mapEdits, () => { try { localStorage.setItem(POS_KEY, JSON.stringify(mapEdits)); } catch (e) {} }, { deep:true });
function checkPos(id){
  const e = mapEdits[id];
  if (e) return [e.scene, e.x, e.y, e.z];
  return MAPS_RECIPE.manual[id] || (mapsData.value && mapsData.value.checks && mapsData.value.checks[id]) || null;
}

const MAP_BANDS = 10;   // tranches de hauteur (une teinte chacune)
const mapGeoCache = new WeakMap();
/* Étages d'une scène (donjons : carte du menu pause) : étage i = hauteurs de [sol de l'étage − 80, sol du suivant − 80[,
   comme MapDisp_GetStoreyY. Nom : 1, 2… ; sous-sols S1, S2… (étage le plus bas : lb). */
const mapLevelOf = (sc, y) => { const l = sc.lv; if (!l || y == null) return null; let i = 0; while (i + 1 < l.length && y >= l[i + 1] - 80) i++; return i; };
const mapLevelName = (sc, i) => { const n = i + (sc.lb || 0); return n >= 0 ? String(n + 1) : t('S{n}', { n:-n }); };
// géométrie d'une scène (à un étage : li) : sol par tranches de hauteur (quantiles : autant de sol dans chacune), autres
// étages en fond atténué, murs, eau, cadre
function mapGeo(sc, li){
  const key = li == null ? -1 : li, byLevel = mapGeoCache.get(sc) || {};
  if (byLevel[key]) return byLevel[key];
  const f0 = sc.f, paths = Array.from({ length:MAP_BANDS }, () => []), on = y => li == null || mapLevelOf(sc, y) === li;
  const f = [];
  let ghost = '';
  for (let i = 0; i < f0.length; i += 7){
    if (on(f0[i + 6])) f.push(...f0.slice(i, i + 7));
    else ghost += `M${f0[i]} ${f0[i + 1]}L${f0[i + 2]} ${f0[i + 3]}L${f0[i + 4]} ${f0[i + 5]}Z`;
  }
  const hs = []; for (let i = 6; i < f.length; i += 7) hs.push(f[i]);
  hs.sort((x, y) => x - y);
  const cuts = Array.from({ length:MAP_BANDS - 1 }, (_, k) => hs[Math.floor((k + 1) * hs.length / MAP_BANDS)]);
  for (let i = 0; i < f.length; i += 7){
    let b = 0; while (b < cuts.length && f[i + 6] > cuts[b]) b++;
    paths[b].push(`M${f[i]} ${f[i + 1]}L${f[i + 2]} ${f[i + 3]}L${f[i + 4]} ${f[i + 5]}Z`);
  }
  let walls = '';
  for (let i = 0, j = 0; i < sc.w.length; i += 4, j += 2){
    if (li != null && !(mapLevelOf(sc, sc.wy[j + 1]) >= li && mapLevelOf(sc, sc.wy[j]) <= li)) continue;
    walls += `M${sc.w[i]} ${sc.w[i + 1]}L${sc.w[i + 2]} ${sc.w[i + 3]}`;
  }
  let water = '';
  for (let i = 0; i < sc.water.length; i += 5) water += `M${sc.water[i]} ${sc.water[i + 1]}H${sc.water[i + 2]}V${sc.water[i + 3]}H${sc.water[i]}Z`;
  const [x0, z0, x1, z1] = sc.b, pad = Math.max(x1 - x0, z1 - z0) * 0.04;
  const g = { bands:paths.map(p => p.join('')), walls, water, ghost, view:[x0 - pad, z0 - pad, x1 - x0 + 2 * pad, z1 - z0 + 2 * pad],
    unit:Math.max(x1 - x0, z1 - z0) / 110 };
  byLevel[key] = g; mapGeoCache.set(sc, byLevel);
  return g;
}

/* ---------- Carte d'une scène (composant) ----------
   Sol vu de dessus (nord en haut), murs, eau ; un repère par sortie (zone de chargement ou porte), avec le nom de la
   scène d'arrivée ; clic : aller à la carte de cette scène. Molette : zoom autour du curseur ; glisser : déplacer. */
const MapView = {
  // checks : repères des checks de la scène [{ c, x, y, z, st ('done' | 'now' | 'later'), tip }] (calculés par la page) ;
  // placing : mode « Placer les checks » avec des checks choisis (clic sur la carte : 'place' [x, y, z]) ; placed : checks
  // placés à la main dans la scène [{ c, x, y, z, moving }]
  // holes : trous de grotte [{ x, z, to, label }] ; home : lieu extérieur d'une grotte (sa sortie y ramène)
  props:{ scene:{ type:String, required:true }, checks:{ type:Array, default:() => [] }, placing:Boolean, placed:{ type:Array, default:() => [] }, editing:Boolean,
    holes:{ type:Array, default:() => [] }, home:{ type:String, default:null } },
  emits:['goto', 'check', 'place'],
  data:() => ({ view:null, drag:null, hover:null, level:null }),
  computed:{
    sc(){ return mapsData.value && mapsData.value.scenes[this.scene] || null; },
    // étage affiché (donjons) : choisi, sinon celui de l'entrée (premier point d'apparition)
    levels(){ return this.sc && this.sc.lv ? this.sc.lv.map((_, i) => ({ i, name:mapLevelName(this.sc, i),
      todo:this.checks.filter(m => m.st !== 'done' && mapLevelOf(this.sc, m.y) === i).length })).reverse() : null; },
    lvl(){ return !this.levels ? null : this.level != null ? this.level : mapLevelOf(this.sc, this.sc.sp.length ? this.sc.sp[0][1] : this.sc.lv[0]); },
    onLevel(){ return y => this.lvl == null || mapLevelOf(this.sc, y) === this.lvl; },
    geo(){ return this.sc ? mapGeo(this.sc, this.lvl) : null; },
    shown(){ return this.checks.filter(m => this.onLevel(m.y)); },
    placedShown(){ return this.placed.filter(m => this.onLevel(m.y)); },
    vb(){ return this.view || (this.geo ? this.geo.view : [0, 0, 1, 1]); },
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
        out.push({ id:i, to, x, z, label:to ? mapSceneName(to) : t('Destination inconnue'), self:to === this.scene });
      });
      return out;
    },
  },
  watch:{ scene(){ this.view = null; this.hover = null; this.level = null; } },
  methods:{
    bandColor(i){ return 'var(--map-' + i + ')'; },
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
  template:`<div class="zmap">
    <div v-if="!geo" class="zmap-empty">Pas de carte pour cette scène.</div>
    <div v-else class="zmap-frame">
      <svg ref="svg" :viewBox="vb.join(' ')" class="zmap-svg" :class="{dragging:drag && drag.moved, placing}" @wheel.prevent="wheel"
        @pointerdown="down" @pointermove="move" @pointerup="up" @pointerleave="drag=null">
        <path v-if="geo.ghost" :d="geo.ghost" class="zmap-ghost" :stroke-width="geo.unit * 0.12"></path>
        <path v-for="(d,i) in geo.bands" :key="i" :d="d" :fill="bandColor(i)" :stroke="bandColor(i)" :stroke-width="geo.unit * 0.12"></path>
        <path v-if="geo.water" :d="geo.water" class="zmap-water"></path>
        <path :d="geo.walls" class="zmap-walls" :stroke-width="geo.unit * 0.35"></path>
        <g v-for="m in shown" :key="m.c.id" class="zc zc-check" :class="{done:m.st==='done', now:m.st==='now', approx:placing !== undefined && m.approx && editing}" @pointerdown.stop @click.stop="$emit('check', m.c)">
          <circle :cx="m.x" :cy="m.z" :r="unit * (m.st==='done' ? 0.6 : 0.85)"></circle><title>{{m.tip}}</title></g>
        <g v-for="m in placedShown" :key="'e:' + m.c.id" class="ze-mark" :class="{moving:m.moving}">
          <rect :x="m.x - unit * 0.9" :y="m.z - unit * 0.9" :width="unit * 1.8" :height="unit * 1.8" :rx="unit * 0.3"></rect>
          <title>{{m.c.label}} (placé à la main)</title></g>
        <g v-for="(h,i) in holes" :key="'h' + i" v-show="onLevel(h.y)" class="zm zg" @pointerdown.stop @click.stop="$emit('goto', h.to)">
          <rect class="zm-shape" :x="h.x - unit * 1.1" :y="h.z - unit * 1.1" :width="unit * 2.2" :height="unit * 2.2" :transform="'rotate(45 ' + h.x + ' ' + h.z + ')'"></rect>
          <text :x="h.x" :y="h.z - unit * 2" :font-size="unit * 1.7">{{h.label}}</text>
          <title>{{t('Grotte : {lieu} — clic : voir sa carte', {lieu:h.label})}}</title></g>
        <g v-for="m in exits" :key="m.id" class="zm zx" :class="{self:m.self, sel:hover===m.id}" @pointerdown.stop @click.stop="go(m)"
          @mouseenter="hover=m.id" @mouseleave="hover=null">
          <circle class="zm-shape" :cx="m.x" :cy="m.z" :r="unit * (hover===m.id ? 1.6 : 1.2)"></circle>
          <text :x="m.x" :y="m.z - unit * 2" :font-size="unit * (hover===m.id ? 2.3 : 1.8)">{{m.label}}</text>
          <title>{{m.self ? m.label : t('Vers {lieu} — clic : voir sa carte', {lieu:m.label})}}</title>
        </g>
      </svg>
      <div v-if="levels" class="zmap-levels"><button v-for="l in levels" :key="l.i" type="button" :class="{on:l.i===lvl}" @click="level=l.i"
        :title="t('Étage {n}', {n:l.name}) + (l.todo ? ' — ' + tn(l.todo, '{n} check à faire', '{n} checks à faire') : '')">{{l.name}}<i v-if="l.todo">{{l.todo}}</i></button></div>
      <div class="zmap-zoom"><button type="button" title="Zoomer" @click="zoom(1 / 1.5)">+</button><button type="button" title="Dézoomer" @click="zoom(1.5)">−</button>
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
          <span class="map-info">{{mapExitCount}}</span>
          <div class="field map-chk" title="Comme la page Checks : ses filtres (catégories, checks faits masqués, seulement les faisables, moment, recherche). Tous : tous les checks de la seed, faits compris. Les checks exclus n’apparaissent jamais (sauf avec l’outil de placement : tous les checks du jeu)."><span class="lbl">Checks</span>
            <seg v-model="ui.map.checks" :options="[['filters', t('Comme la page Checks')], ['all', t('Tous')], ['off', t('Aucun')]]"></seg></div>
          <button v-if="ui.map.editTool" type="button" class="btn zmap-edit-btn" :class="{on:mapEdit}" @click="mapEdit = !mapEdit; mapPick = {}"
            title="Placer à la main les checks qui n'ont pas de position">✎ Placer les checks</button>
        </div>
        <div v-if="mapGroups.length > 1" class="zmap-tabs map-groups" title="Plusieurs grottes partagent cette salle : choisissez celle dont afficher les checks">
          <button type="button" :class="{on:!mapGroup}" @click="mapGroup = ''">Tous</button>
          <button v-for="g in mapGroups" :key="g.id" type="button" :class="{on:mapGroup===g.id}" @click="mapGroup = g.id">{{g.label}} <small>{{g.n}}</small></button></div>
        <map-view :scene="mapBase" :holes="mapHoles" :home="mapHome" :checks="mapChecks" :placing="mapEdit && mapPicked.length > 0" :editing="mapEdit" :placed="mapEdit ? mapPlacedHere : []"
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
        <div class="zmap-legend"><span><i class="lg-ground"></i>Sol, du plus bas au plus haut</span><span><i class="lg-water"></i>Eau</span>
          <span><i class="lg-exit"></i>Sortie (clic : voir la carte du lieu d’arrivée)</span></div>
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
  const mapHoles = computed(() => (GROTTO_MAPS.value.holes[mapBase.value] || []).map(h => ({ ...h, label:mapSceneName(h.to) })));
  const mapHome = computed(() => (GROTTO_MAPS.value.byId[ui.map.scene] || {}).home || null);
  // choix du lieu : ceux de la page Checks (dans son ordre), puis les autres (intérieurs, variantes)
  const mapSceneGroups = computed(() => {
    const m = mapsData.value;
    if (!m) return [];
    const main = CHECK_SCENES.map(s => s.id).filter(id => m.scenes[id]);
    const seen = new Set(main);
    const other = Object.keys(m.scenes).filter(id => !seen.has(id) && id !== 'SCENE_SPOT00' && !id.startsWith('SCENE_KAKUSIANA')).sort((x, y) => mapSceneName(x).localeCompare(mapSceneName(y)));
    // (provisoire) outil de placement affiché : seulement les lieux qui ont des checks sans position (et le lieu affiché)
    const keep = id => !ui.map.editTool || id === ui.map.scene || mapMissing(id) > 0;
    return [{ label:t('Lieux de la page Checks'), list:main.filter(keep) }, { label:t('Autres lieux'), list:other.filter(keep) },
      { label:t('Grottes'), list:GROTTO_MAPS.value.list.map(x => x.id).filter(keep) }];
  });
  // checks de la scène affichée : ceux de la seed (non exclus) placés sur cette carte, filtrés comme la page Checks
  // (catégories masquées, checks faits masqués, seulement les faisables)
  const { canNow, seedChecks, logicFull } = ctx;
  const normMap = x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mapChecks = computed(() => mapGroup.value ? mapChecksAll.value.filter(m => groupOf(m.c) === mapGroup.value) : mapChecksAll.value);
  const mapChecksAll = computed(() => {
    const out = [];
    if (!mapsData.value) return out;
    /* Checks affichés (ui.map.checks) : « Comme la page Checks » (filters) — ses filtres : catégories, checks faits masqués,
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
      const w = logicFull.value.checks[c.id], when = w && w.ok ? whenText(w.when) : null;
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
  const mapExitCount = computed(() => {
    const sc = mapsData.value && mapsData.value.scenes[mapBase.value];
    if (!sc) return '';
    const n = mapChecks.value.filter(m => m.st !== 'done').length;
    return tn(sc.ex.length, '{n} sortie', '{n} sorties') + ' · ' + tn(n, '{n} check à faire', '{n} checks à faire');
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
  return { mapBase, mapHoles, mapHome, mapValidate, mapApprox, mapGroup, mapGroups, mapCheckHelp, mapMissing, mapEdit, mapPick, mapPicked, mapToPlace, mapPlacedList, mapPlacedHere, mapPlace, mapEditCount, mapExport, mapClearEdits, mapEdits,
    mapChecks, mapsData, MAPS_INFO, mapScene, mapBack, mapGoto, mapGoBack, mapSceneGroups, mapExitCount, mapSceneName, mapsJob, mapsMake, mapsForgetAsk };
}
