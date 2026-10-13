/* ---------- Composants ---------- */
const Seg = {
  props:['modelValue','options'], emits:['update:modelValue'],
  template:`<div class="seg" role="radiogroup"><button v-for="o in options" :key="String(o[0])" type="button" role="radio" :aria-checked="modelValue===o[0]"
    :class="{on: modelValue===o[0]}" @click="$emit('update:modelValue', o[0])">{{o[1]}}</button></div>`,
};

// Grand cadre de progression (en tête des pages) : anneau de pourcentage, « faits / total », ligne de détail et
// répartition par groupe. stats = { got, total, sub, groups:[[libellé, faits, total]] }, unit = « checks »…
/* stats.regions (compteur des checks) : rose des vents au lieu de l'anneau — une pointe par région (Nord, Est, Sud, Ouest :
   la géographie de Termina), remplie depuis le bord du cœur selon la part des checks faits (verte : région finie) ; le cœur, le
   Centre (Bourg-Clocher, Plaine Termina), en anneau autour du pourcentage global ; détails au survol */
const ROSE_POINTS = [['nord', 0, 'N'], ['est', 90, t('E')], ['sud', 180, 'S'], ['ouest', 270, t('O')]];
let roseUid = 0;
const ProgressCard = {
  props:{ stats:{ type:Object, required:true }, unit:{ type:String, default:'' }, title:{ type:String, default:'' },
    active:{ type:Boolean, default:false } },
  emits:['open'],
  data:() => ({ uid:'rose' + (++roseUid) }),
  computed:{
    pct(){ return this.stats.total ? Math.floor(100 * this.stats.got / this.stats.total) : 0; },
    // pointes : région, angle, lettre, part faite (0 à 1), finie, bulle
    rose(){
      const R = this.stats.regions;
      if (!R) return null;
      const tip = (r, fallback) => r ? r.title + ' : ' + r.got + ' / ' + r.total : fallback;
      return { points:ROSE_POINTS.map(([id, a, letter]) => { const r = R[id];
          return { id, a, letter, part:r && r.total ? r.got / r.total : 0, full:!!(r && r.total && r.got === r.total), tip:tip(r, letter) }; }),
        centre:R.centre ? { part:R.centre.total ? R.centre.got / R.centre.total : 0, full:R.centre.total && R.centre.got === R.centre.total, tip:tip(R.centre) } : null,
        list:['centre', 'nord', 'sud', 'ouest', 'est', 'autres'].filter(id => R[id] && R[id].total).map(id => ({ id, ...R[id] })) };
    },
  },
  // Cliquable (titre de page) : ouvre la page correspondante.
  template:`<button type="button" class="progress-card" :class="{done:stats.total && stats.got===stats.total, active}"
    :title="title ? 'Ouvrir la page ' + title : null" @click="$emit('open')">
    <svg v-if="rose" class="pc-rose" viewBox="-60 -60 120 120">
      <g class="pr-deco"><path v-for="a in [45, 135, 225, 315]" :key="a" :transform="'rotate(' + a + ')'" d="M0 -31 L5 -12 L0 -9 L-5 -12 Z"></path></g>
      <g v-for="p in rose.points" :key="p.id" :transform="'rotate(' + p.a + ')'" class="pr-point" :class="{full:p.full}">
        <title>{{p.tip}}</title>
        <clipPath :id="uid + p.id"><rect x="-16" :y="-19.5 - p.part * 30.5" width="32" :height="p.part * 30.5 + 0.01"></rect></clipPath>
        <path class="pr-track" d="M0 -50 L13 -15 L0 -8 L-13 -15 Z"></path>
        <path class="pr-fill" :clip-path="'url(#' + uid + p.id + ')'" d="M0 -50 L13 -15 L0 -8 L-13 -15 Z"></path>
        <path class="pr-edge" d="M0 -50 L0 -8"></path>
        <text :transform="'rotate(' + (-p.a) + ' 0 -55)'" x="0" y="-55" dominant-baseline="central">{{p.letter}}</text>
      </g>
      <g class="pr-centre" :class="{full:rose.centre && rose.centre.full}"><title>{{rose.centre ? rose.centre.tip : ''}}</title>
        <circle class="pr-disc" r="17"></circle>
        <circle class="pr-ring" r="17"></circle>
        <circle v-if="rose.centre && rose.centre.part" class="pr-ring-fill" r="17" transform="rotate(-90)" :stroke-dasharray="(106.8 * rose.centre.part) + ' 106.8'"></circle>
        <text class="pr-pct" y="1" dominant-baseline="central">{{pct}}<tspan>%</tspan></text></g>
    </svg>
    <template v-else>
    <svg class="pc-ring" viewBox="0 0 44 44" aria-hidden="true"><circle class="pc-track" cx="22" cy="22" r="18"/>
      <circle v-if="stats.got" class="pc-fill" cx="22" cy="22" r="18" :stroke-dasharray="(113.1*stats.got/(stats.total||1)) + ' 113.1'"/></svg>
    <div class="pc-pct">{{pct}}<small>%</small></div>
    </template>
    <div class="pc-main">
      <div v-if="title" class="pc-title">{{title}}</div>
      <div class="pc-count"><b>{{stats.got}}</b> / {{stats.total}} <span>{{unit}}</span></div>
      <div class="pc-sub">{{stats.sub}}</div>
      <div v-if="stats.groups.length" class="pc-groups"><span v-for="g in stats.groups" :key="g[0]">{{g[0]}} <b>{{g[1]}}/{{g[2]}}</b></span></div>
    </div>
    <!-- par région (rose) : à droite, sur deux colonnes (sous le total si la carte est étroite) -->
    <div v-if="rose" class="pc-regions"><span v-for="r in rose.list" :key="r.id" :title="r.title" :class="{full:r.got === r.total}">{{r.label}}<b>{{r.got}}/{{r.total}}</b></span></div>
  </button>`,
};

/* Cadran du cycle (cartes « Dernière sauvegarde » / « En direct », fenêtre de stream) : les six demi-journées en six ronds
   (3 soleils, 3 lunes) qui défilent sur un arc en demi-cercle — 12 h = 34°, le moment présent en haut sous le repère, le
   rond de la demi-journée en cours agrandi, les passés à gauche (estompés), ceux à venir à droite — et l'heure dessous, au
   centre. hours : heures depuis le jour 1 à 6 h (0 à 72) ; clock : heure affichée (« 10 h 59 ») ; before : avant le
   premier jour. */
let dialUid = 0;
const DIAL_R = 52, DIAL_DEG = 34 / 12;   // arc des ronds ; degrés par heure (12 h = 34° : ronds bien espacés)
const dialPt = (r, a) => { const t = a * Math.PI / 180; return [+(r * Math.sin(t)).toFixed(2), +(-r * Math.cos(t)).toFixed(2)]; };
const CycleDial = {
  props:{ hours:{ type:Number, default:0 }, clock:{ type:String, default:'' }, before:Boolean },
  data:() => ({ uid:'dial' + (++dialUid) }),
  computed:{
    now(){ return this.before ? 0 : Math.max(0, Math.min(72, this.hours)); },
    // un rond par demi-journée, au milieu de ses 12 h (angle en degrés, 0 en haut, sens des aiguilles, vu du moment présent)
    halves(){
      return MOMENTS.map((m, i) => {
        const a = (12 * i + 6 - this.now) * DIAL_DEG, cur = !this.before && this.now >= 12 * i && this.now < 12 * i + 12;
        return { i, night:i % 2 === 1, label:m.long, cur, past:!this.before && 12 * i + 12 <= this.now, at:dialPt(DIAL_R, a), show:Math.abs(a) < 105 };
      });
    },
    // (le rond en cours par-dessus les autres)
    order(){ return this.halves.slice().sort((a, b) => a.cur - b.cur); },
    arc(){ return 'M' + -DIAL_R + ' 0A' + DIAL_R + ' ' + DIAL_R + ' 0 0 1 ' + DIAL_R + ' 0'; },
  },
  template:`<svg class="cy-dial" viewBox="-70 -76 140 78" aria-hidden="true">
    <defs><clipPath :id="uid"><rect x="-70" y="-76" width="140" height="78"></rect></clipPath></defs>
    <path class="cy-arc" :d="arc"></path>
    <g :clip-path="'url(#' + uid + ')'">
      <g v-for="h in order" v-show="h.show" :key="h.i" class="cy-ic" :class="[h.night ? 'n' : 'd', {past:h.past, cur:h.cur}]"
        :transform="'translate(' + h.at[0] + ' ' + h.at[1] + ')' + (h.cur ? ' scale(1.3)' : '')"><title>{{h.label}}</title>
        <circle class="cy-disc" r="9.5"></circle>
        <template v-if="!h.night"><circle class="cy-sun" r="3.3"></circle>
          <path class="cy-rays" d="M0 -6.6V-5.2M0 5.2V6.6M-6.6 0H-5.2M5.2 0H6.6M-4.7 -4.7L-3.7 -3.7M3.7 3.7L4.7 4.7M-4.7 4.7L-3.7 3.7M3.7 -3.7L4.7 -4.7"></path></template>
        <path v-else class="cy-moon" d="M1.9 -5.3A5.6 5.6 0 1 0 5.3 1.9A4.3 4.3 0 0 1 1.9 -5.3Z"></path>
      </g>
    </g>
    <path class="cy-needle" d="M0 -${DIAL_R + 14}L-4 -${DIAL_R + 20}H4Z"></path>
    <text class="cy-clock" x="0" y="-6" text-anchor="middle">{{clock}}</text>
  </svg>`,
};

// Tuile d'objet (panneau Objets) : clic gauche / droit pour augmenter / diminuer / activer. Icône seule (nom au survol) ;
// sans image (icons/items/<clé>.png), un sigle. Badge : taille (paliers), nombre (compteurs).
// stage : une case par palier d'un objet à paliers ou d'un compteur (chaîne des épées, temps progressif) — allumée à partir
// de ce palier ; clic : monter jusqu'à lui, ou redescendre juste en dessous s'il est déjà atteint ; clic droit :
// redescendre en dessous. icon / label : image (sous icons/) et nom propres à la case.
const brokenIcons = reactive({});
const ItemTile = {
  props:{ k:{ type:String, required:true }, stage:{ type:Number, default:0 }, icon:{ type:String, default:'' }, label:{ type:String, default:'' } },
  data:() => ({ brokenIcons }),
  computed:{
    item(){ return ITEM_BY_KEY[this.k]; },
    value(){ return store.game.items[this.k]; },
    src(){ return this.icon ? 'icons/' + this.icon : this.stage && this.item.icons ? 'icons/' + this.item.icons[this.stage - 1] : iconSrc(this.item); },
    // Chant du temps inversé / accéléré non mélangé : lié au Chant du temps (allumé et cliqué avec lui)
    linked(){ return timeSongLinked(this.k); },
    on(){ return this.linked ? itemActive(ITEM_BY_KEY.song_time, store.game.items.song_time)
      : this.stage ? this.value >= this.stage : itemActive(this.item, this.value); },
    // chant obtenu mais injouable : touches de l'ocarina manquantes (barré, et nommées au survol)
    missing(){ const m = this.on && songMissing(this.item); return m && m.length ? m : null; },
    title(){
      const base = this.label || (!this.stage ? itemTitle(this.item) : this.item.stages ? this.item.stages[this.stage] : this.item.label + ' : ' + this.stage);
      const more = this.linked ? ' — ' + t('vient avec le Chant du temps') : '';
      return !this.missing ? base + more : base + more + ' — ' + t('touches manquantes : {touches}', { touches:this.missing.map(b => ITEM_BY_KEY['ocarina_button_' + b.toLowerCase()].label).join(', ') });
    },
    abbr(){ return itemAbbr(this.item); },
  },
  methods:{
    onClick(ev){
      if (this.linked) clickItem(ev, ITEM_BY_KEY.song_time);
      else if (this.stage) store.game.items[this.k] = this.value >= this.stage ? this.stage - 1 : this.stage;
      else clickItem(ev, this.item);
    },
    onRight(ev){
      if (this.linked) rightClickItem(ev, ITEM_BY_KEY.song_time);
      else if (this.stage) store.game.items[this.k] = Math.min(this.value, this.stage - 1);
      else rightClickItem(ev, this.item);
    },
    itemMaxed,
  },
  template:`<button type="button" class="icon-tile" :class="{off:!on, unplayable:missing, sat:linked}" :aria-label="item.label" :title="title"
    @click="onClick" @contextmenu.prevent="onRight">
    <img v-if="!brokenIcons[src]" :src="src" :alt="item.label" @error="brokenIcons[src]=true">
    <span v-else class="icon-abbr">{{abbr}}</span>
    <span v-if="stage"></span>
    <span v-else-if="item.kind==='count'" class="icon-badge" :class="{maxed:itemMaxed(item)}">{{value}}</span>
    <span v-else-if="item.sizes && item.sizes[value]" class="icon-badge" :class="{maxed:itemMaxed(item)}">{{item.sizes[value]}}</span>
  </button>`,
};

/* Gabarit commun des pages (js/pages) : section du panneau principal ou du second panneau (côte à côte), barre du second
   panneau (échanger, fermer), en-tête. body : contenu de la page. */
const paneTpl = (id, head, body) => `
    <section v-if="shown('${id}')" class="pane" :class="'pane-' + paneOf('${id}')">
      <div v-if="paneOf('${id}')==='side'" class="pane-bar">
        <button type="button" title="Échanger les deux panneaux" v-html="ICONS.swapH" @click="swapPanes"></button>
        <button type="button" title="Fermer ce panneau" v-html="ICONS.close" @click="closeSide"></button></div>
      <div class="page-head">${head}</div>
${body}
    </section>
`;
