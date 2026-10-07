/* ---------- Composants ---------- */
const Seg = {
  props:['modelValue','options'], emits:['update:modelValue'],
  template:`<div class="seg" role="radiogroup"><button v-for="o in options" :key="String(o[0])" type="button" role="radio" :aria-checked="modelValue===o[0]"
    :class="{on: modelValue===o[0]}" @click="$emit('update:modelValue', o[0])">{{o[1]}}</button></div>`,
};

// Grand cadre de progression (en tête des pages) : anneau de pourcentage, « faits / total », ligne de détail et
// répartition par groupe. stats = { got, total, sub, groups:[[libellé, faits, total]] }, unit = « checks »…
const ProgressCard = {
  props:{ stats:{ type:Object, required:true }, unit:{ type:String, default:'' }, title:{ type:String, default:'' },
    active:{ type:Boolean, default:false } },
  emits:['open'],
  computed:{ pct(){ return this.stats.total ? Math.floor(100 * this.stats.got / this.stats.total) : 0; } },
  // Cliquable (titre de page) : ouvre la page correspondante.
  template:`<button type="button" class="progress-card" :class="{done:stats.total && stats.got===stats.total, active}"
    :title="title ? 'Ouvrir la page ' + title : null" @click="$emit('open')">
    <svg class="pc-ring" viewBox="0 0 44 44" aria-hidden="true"><circle class="pc-track" cx="22" cy="22" r="18"/>
      <circle v-if="stats.got" class="pc-fill" cx="22" cy="22" r="18" :stroke-dasharray="(113.1*stats.got/(stats.total||1)) + ' 113.1'"/></svg>
    <div class="pc-pct">{{pct}}<small>%</small></div>
    <div class="pc-main">
      <div v-if="title" class="pc-title">{{title}}</div>
      <div class="pc-count"><b>{{stats.got}}</b> / {{stats.total}} <span>{{unit}}</span></div>
      <div class="pc-sub">{{stats.sub}}</div>
      <div class="pc-groups"><span v-for="g in stats.groups" :key="g[0]">{{g[0]}} <b>{{g[1]}}/{{g[2]}}</b></span></div>
    </div>
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
