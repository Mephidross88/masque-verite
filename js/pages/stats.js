/* ---------- Page Statistiques : chronologie de la partie et temps de jeu ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Chronologie : game.timeline (js/state.js) ; temps de jeu : celui de 2Ship (filePlaytime de la sauvegarde suivie). */

const STATS_TPL = paneTpl('stats', `<h1>Statistiques</h1><p class="lede">Chronologie de la partie : objets, masques, chants et checks, à l'heure où ils ont été notés.</p>`, `
      <div class="rsum st-tiles">
        <div class="rstat" title="Temps de jeu compté par 2Ship, à la dernière sauvegarde lue (auto-tracking)"><div><b>{{store.game.playtime ? fmtDur(store.game.playtime) : '—'}}</b><span>temps de jeu (2Ship)</span></div></div>
        <div class="rstat"><div><b>{{checkStats.got}} / {{checkStats.total}}</b><span>checks faits</span></div></div>
        <div class="rstat"><div><b>{{statsCounts.masks[0]}} / {{statsCounts.masks[1]}}</b><span>masques</span></div></div>
        <div class="rstat"><div><b>{{statsCounts.hearts}}</b><span>cœurs</span></div></div>
      </div>
      <div v-if="statsC.curve" class="st-chart">
        <div class="st-chart-title">Checks faits au fil du temps de jeu <small>({{statsC.curve.max}} au plus)</small></div>
        <svg viewBox="0 0 600 150" preserveAspectRatio="none"><path class="st-area" :d="statsC.curve.area"></path><path class="st-line" :d="statsC.curve.d"></path></svg>
        <div class="st-axis"><span>0:00:00</span><span>{{statsC.curve.end}}</span></div>
      </div>
      <div class="st-filter"><seg v-model="stFilter" :options="[['items', t('Objets')], ['checks', t('Checks')], ['all', t('Tout')]]"></seg></div>
      <ul v-if="statsRows.length" class="st-list">
        <li v-for="r in statsRows" :key="r.i"><span class="st-at" :class="{real:r.real}" :title="r.real ? t('Heure réelle (pas de temps de jeu connu)') : ''">{{r.at || t('avant le suivi')}}</span>
          <span class="st-when">{{r.when}}</span>
          <span v-if="r.svg" class="st-noic cat-svg" v-html="r.svg"></span>
          <img v-else-if="r.icon && !brokenIcons[r.icon]" :src="r.icon" alt="" @error="brokenIcons[r.icon]=true"><span v-else class="st-noic st-abbr">{{r.abbr}}</span>
          <span class="st-lab">{{r.label}}<small v-if="r.found"> · {{r.found}}</small></span></li>
      </ul>
      <p v-else class="empty">Rien de noté pour l'instant.</p>`);

// icône et libellé d'un objet du panneau à un palier ou un nombre donnés
function itemIconAt(it, v){
  if (it.kind === 'level' && it.icons) return 'icons/' + it.icons[Math.max(1, v) - 1];
  return 'icons/' + (it.icon || 'items/' + it.key + '.png');
}
const itemLabelAt = (it, v) => it.kind === 'level' ? it.stages[v] || it.label : it.kind === 'count' ? it.label + ' : ' + v : it.label;
const fmtDur = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 3600) + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

function useStatsPage(){
  const stFilter = ref('items');
  const fmtReal = ms => new Date(ms).toLocaleString(LANG === 'fr' ? 'fr-FR' : LANG, { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  const statsC = computed(() => {
    const g = store.game, tl = Array.isArray(g.timeline) ? g.timeline : [];
    const rows = tl.map((e, i) => {
      const at = e.p != null ? fmtDur(e.p) : e.t ? fmtReal(e.t) : null, real = e.p == null && !!e.t;
      const when = Array.isArray(e.c) ? halfDayLabel(e.c[0]) + ' · ' + saveClock(e.c[1]) : '';
      if (e.k === 'checks'){
        const c = CHECK_BY_ID[e.id], ri = g.found[e.id];
        return { i, k:e.k, at, real, when, label:c ? c.label + ' · ' + CHECK_SCENE[c.scene].label : e.id, svg:c && CHECK_CAT[c.cat].icon,
          found:ri ? (ITEM_DATA[ri] ? ITEM_DATA[ri].label : ri) : '' };
      }
      const it = ITEM_BY_KEY[e.id];
      return { i, k:e.k, at, real, when, label:it ? itemLabelAt(it, e.v) : e.id, icon:it ? itemIconAt(it, e.v) : null, abbr:it ? itemAbbr(it) : '?', found:'' };
    }).reverse();
    // courbe en escalier : checks faits au fil du temps de jeu de 2Ship (ceux sans temps de jeu au départ)
    const ck = tl.filter(e => e.k === 'checks' && e.p != null).map(e => e.p).sort((a, b) => a - b);
    let curve = null;
    if (ck.length){
      const span = Math.max(1, g.playtime, ck[ck.length - 1]), start = tl.filter(e => e.k === 'checks' && e.p == null).length;
      const max = Math.max(1, start + ck.length), W = 600, H = 150, x = p => p / span * W, y = n => H - n / max * H;
      let d = 'M0,' + y(start).toFixed(1), n = start;
      for (const p of ck) d += ' H' + x(p).toFixed(1) + ' V' + y(++n).toFixed(1);
      curve = { d:d + ' H' + W, area:d + ' H' + W + ' V' + H + ' H0 Z', end:fmtDur(span), max };
    }
    return { rows, curve };
  });
  const statsRows = computed(() => statsC.value.rows.filter(r => stFilter.value === 'all' || (stFilter.value === 'checks' ? r.k === 'checks' : r.k !== 'checks')));
  // compteurs : masques obtenus (sur ceux du panneau), cœurs (3 au départ, réceptacles, quarts)
  const statsCounts = computed(() => {
    const gi = store.game.items, masks = ITEM_GROUPS.find(x => x.id === 'masks').items.filter(itemVisible);
    const hearts = 3 + (gi.heart_containers || 0) + Math.floor((gi.heart_pieces || 0) / 4), part = (gi.heart_pieces || 0) % 4;
    return { masks:[masks.filter(it => gi[it.key]).length, masks.length], hearts:hearts + (part ? ' ' + part + '/4' : '') };
  });
  return { stFilter, statsC, statsRows, statsCounts, fmtDur };
}
