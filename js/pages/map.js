/* ---------- Page Carte : chaque scène vue de dessus ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Cartes : fabriquées depuis la ROM de Majora's Mask du joueur (js/maps-extract.js, chargé à la demande, recette
   data/maps-recipe.js tirée des sources de 2Ship), gardées dans IndexedDB (base masque-verite-maps) ; data/maps-data.js
   (outil en ligne de commande, non versionné), s'il est présent, passe avant. Rien de la ROM n'est publié. */

const MAPS_VER = 1;
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
const mapSceneName = id => MAP_SCENE_NAMES[id] || (CHECK_SCENE[id] ? CHECK_SCENE[id].label : id);
// scène d'arrivée d'une entrée (numéro : scène << 9 | apparition << 4)
const entrScene = v => MAP_ENTR_SCENE[v >> 9] || null;

const MAP_BANDS = 10;   // tranches de hauteur (une teinte chacune)
const mapGeoCache = new WeakMap();
// géométrie d'une scène : sol par tranches de hauteur (quantiles : autant de sol dans chacune), murs, eau, cadre
function mapGeo(sc){
  if (mapGeoCache.has(sc)) return mapGeoCache.get(sc);
  const f = sc.f, paths = Array.from({ length:MAP_BANDS }, () => []);
  const hs = []; for (let i = 6; i < f.length; i += 7) hs.push(f[i]);
  hs.sort((x, y) => x - y);
  const cuts = Array.from({ length:MAP_BANDS - 1 }, (_, k) => hs[Math.floor((k + 1) * hs.length / MAP_BANDS)]);
  for (let i = 0; i < f.length; i += 7){
    let b = 0; while (b < cuts.length && f[i + 6] > cuts[b]) b++;
    paths[b].push(`M${f[i]} ${f[i + 1]}L${f[i + 2]} ${f[i + 3]}L${f[i + 4]} ${f[i + 5]}Z`);
  }
  let walls = '';
  for (let i = 0; i < sc.w.length; i += 4) walls += `M${sc.w[i]} ${sc.w[i + 1]}L${sc.w[i + 2]} ${sc.w[i + 3]}`;
  let water = '';
  for (let i = 0; i < sc.water.length; i += 5) water += `M${sc.water[i]} ${sc.water[i + 1]}H${sc.water[i + 2]}V${sc.water[i + 3]}H${sc.water[i]}Z`;
  const [x0, z0, x1, z1] = sc.b, pad = Math.max(x1 - x0, z1 - z0) * 0.04;
  const g = { bands:paths.map(p => p.join('')), walls, water, view:[x0 - pad, z0 - pad, x1 - x0 + 2 * pad, z1 - z0 + 2 * pad],
    unit:Math.max(x1 - x0, z1 - z0) / 110 };
  mapGeoCache.set(sc, g);
  return g;
}

/* ---------- Carte d'une scène (composant) ----------
   Sol vu de dessus (nord en haut), murs, eau ; un repère par sortie (zone de chargement ou porte), avec le nom de la
   scène d'arrivée ; clic : aller à la carte de cette scène. Molette : zoom autour du curseur ; glisser : déplacer. */
const MapView = {
  props:{ scene:{ type:String, required:true } },
  emits:['goto'],
  data:() => ({ view:null, drag:null, hover:null }),
  computed:{
    sc(){ return mapsData.value && mapsData.value.scenes[this.scene] || null; },
    geo(){ return this.sc ? mapGeo(this.sc) : null; },
    vb(){ return this.view || (this.geo ? this.geo.view : [0, 0, 1, 1]); },
    // taille des repères : suit le zoom (sans devenir minuscule)
    unit(){ return this.geo ? this.geo.unit * Math.min(1, Math.max(0.35, this.vb[2] / this.geo.view[2])) : 1; },
    // sorties : une par zone ; même scène d'arrivée et très proches : un seul repère
    exits(){
      if (!this.sc) return [];
      const out = [];
      this.sc.ex.forEach(([entr, x, , z], i) => {
        const to = entrScene(entr);
        if (out.some(m => m.to === to && Math.hypot(m.x - x, m.z - z) < 150)) return;
        out.push({ id:i, to, x, z, label:to ? mapSceneName(to) : t('Destination inconnue'), self:to === this.scene });
      });
      return out;
    },
  },
  watch:{ scene(){ this.view = null; this.hover = null; } },
  methods:{
    bandColor(i){ return 'var(--map-' + i + ')'; },
    go(m){ if (m.to && !m.self && mapsData.value.scenes[m.to]) this.$emit('goto', m.to); },
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
  },
  template:`<div class="zmap">
    <div v-if="!geo" class="zmap-empty">Pas de carte pour cette scène.</div>
    <div v-else class="zmap-frame">
      <svg ref="svg" :viewBox="vb.join(' ')" class="zmap-svg" :class="{dragging:drag && drag.moved}" @wheel.prevent="wheel"
        @pointerdown="down" @pointermove="move" @pointerup="drag=null" @pointerleave="drag=null">
        <path v-for="(d,i) in geo.bands" :key="i" :d="d" :fill="bandColor(i)" :stroke="bandColor(i)" :stroke-width="geo.unit * 0.12"></path>
        <path v-if="geo.water" :d="geo.water" class="zmap-water"></path>
        <path :d="geo.walls" class="zmap-walls" :stroke-width="geo.unit * 0.35"></path>
        <g v-for="m in exits" :key="m.id" class="zm zx" :class="{self:m.self, sel:hover===m.id}" @pointerdown.stop @click.stop="go(m)"
          @mouseenter="hover=m.id" @mouseleave="hover=null">
          <circle class="zm-shape" :cx="m.x" :cy="m.z" :r="unit * (hover===m.id ? 1.6 : 1.2)"></circle>
          <text :x="m.x" :y="m.z - unit * 2" :font-size="unit * (hover===m.id ? 2.3 : 1.8)">{{m.label}}</text>
          <title>{{m.self ? m.label : t('Vers {lieu} — clic : voir sa carte', {lieu:m.label})}}</title>
        </g>
      </svg>
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
        <div class="zmap-bar">
          <button v-if="mapBack.length" type="button" class="btn zmap-back" @click="mapGoBack" :title="t('Retour à {lieu}', {lieu:mapSceneName(mapBack[mapBack.length - 1])})">←</button>
          <select class="sel map-scene" v-model="mapScene" aria-label="Lieu">
            <optgroup v-for="g in mapSceneGroups" :key="g.label" :label="g.label">
              <option v-for="s in g.list" :key="s" :value="s">{{mapSceneName(s)}}</option></optgroup></select>
          <span class="map-info">{{mapExitCount}}</span>
        </div>
        <map-view :scene="mapScene" @goto="mapGoto"></map-view>
        <div class="zmap-legend"><span><i class="lg-ground"></i>Sol, du plus bas au plus haut</span><span><i class="lg-water"></i>Eau</span>
          <span><i class="lg-exit"></i>Sortie (clic : voir la carte du lieu d’arrivée)</span></div>
        <p class="maps-src">{{MAPS_INFO.source === 'file' ? t('Cartes du fichier data/maps-data.js.') : t('Cartes fabriquées dans ce navigateur depuis {rom}.', {rom:MAPS_INFO.rom || 'la ROM'})}}
          <button v-if="MAPS_INFO.source === 'browser'" type="button" class="link" @click="mapsForgetAsk">Oublier ces cartes</button></p>
      </template>`);

function useMapPage(ctx){
  const { ui } = ctx;
  // lieu affiché (ui.map.scene) et retour (lieux précédents, le temps de la session)
  const mapBack = ref([]);
  const mapScene = computed({ get:() => ui.map.scene, set:v => { if (v !== ui.map.scene){ mapBack.value.push(ui.map.scene); ui.map.scene = v; } } });
  const mapGoto = s => { mapScene.value = s; };
  const mapGoBack = () => { const s = mapBack.value.pop(); if (s) ui.map.scene = s; };
  // choix du lieu : ceux de la page Checks (dans son ordre), puis les autres (intérieurs, variantes)
  const mapSceneGroups = computed(() => {
    const m = mapsData.value;
    if (!m) return [];
    const main = CHECK_SCENES.map(s => s.id).filter(id => m.scenes[id]);
    const seen = new Set(main);
    const other = Object.keys(m.scenes).filter(id => !seen.has(id) && id !== 'SCENE_SPOT00').sort((x, y) => mapSceneName(x).localeCompare(mapSceneName(y)));
    return [{ label:t('Lieux de la page Checks'), list:main }, { label:t('Autres lieux'), list:other }];
  });
  const mapExitCount = computed(() => { const sc = mapsData.value && mapsData.value.scenes[ui.map.scene]; return sc ? tn(sc.ex.length, '{n} sortie', '{n} sorties') : ''; });
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
  return { mapsData, MAPS_INFO, mapScene, mapBack, mapGoto, mapGoBack, mapSceneGroups, mapExitCount, mapSceneName, mapsJob, mapsMake, mapsForgetAsk };
}
