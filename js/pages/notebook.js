/* ---------- Page Journal des Bombers : frise chronologique des trois jours, une barre par check à horaire limité ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Axe : les 72 heures du cycle (jour 1, 6 h → jour 4, 6 h), bandes jour / nuit. Barres : moments possibles du check avec
   tous les objets (pâles) et avec l'inventaire noté (vives) — mêmes calculs que la frise de la page Checks (logicFull,
   logicNow). Lignes triées par le début de leur première plage. Moment choisi (ui.checks.moment, partagé avec Checks) :
   colonne mise en évidence ; temps mélangé : demi-journées pas encore possédées hachurées. Regroupement par scène
   (ui.notebook.byScene, ordre du tracker) : une ligne d'en-tête repliable par scène ; repliée, sa piste réunit les barres de ses checks. */

// barre de gauche : tout déplier / replier les scènes (regroupement par scène)
const NOTEBOOK_SIDE_TPL = `
    <section v-if="shown('notebook') && ui.notebook.byScene" class="side-sec" :style="{order:paneOf('notebook')==='side' ? 2 : 1}">
      <div v-if="splitOn" class="side-title side-page">Journal des Bombers</div>
      <div class="side-row"><button class="side-btn" @click="setAllNbScenes(false)">Tout déplier</button><button class="side-btn" @click="setAllNbScenes(true)">Tout replier</button></div>
    </section>
`;

const NOTEBOOK_TPL = paneTpl('notebook', `<h1>Journal des Bombers</h1><p class="lede">Les trois jours, heure par heure : quand faire chaque check.</p>`, `
      <div class="checks-toolbar nb-tools">
        <input class="checks-search" type="search" v-model="ui.notebook.q" placeholder="Rechercher un check ou une scène…" aria-label="Rechercher un check">
        <div class="ct-row">
          <div class="age-seg moment-seg" title="Moment du cycle (le même que dans la page Checks) : colonne mise en évidence">
            <span class="ct-label">Moment</span>
            <button type="button" :class="{on:ui.checks.moment<0}" @click="ui.checks.moment=-1">Tous</button>
            <button v-for="(m,i) in MOMENTS" :key="i" type="button" :class="['mo-' + (i%2 ? 'night' : 'day'), {on:ui.checks.moment===i, lock:!owned[i]}]"
              :title="owned[i] ? m.long : t('{moment} : demi-journée pas encore possédée (temps mélangé)', {moment:m.long})" @click="ui.checks.moment=i">{{m.short}}</button>
          </div>
          <label class="check" title="N'afficher que les checks faisables avec l'inventaire noté (au moment choisi), et ceux déjà faits"><input type="checkbox" v-model="ui.checks.onlyAvailable">Seulement les faisables</label>
          <label class="check"><input type="checkbox" v-model="ui.notebook.hideDone">Masquer les checks faits</label>
          <label class="check" title="Une section par scène, dans l'ordre du tracker ; la ligne de la scène réunit les horaires de ses checks"><input type="checkbox" v-model="ui.notebook.byScene">Grouper par scène</label>
          <label class="check" title="Lister aussi les checks faisables à toute heure (barre sur tout le cycle)"><input type="checkbox" v-model="ui.notebook.all">Aussi les checks sans horaire</label>
        </div>
      </div>

      <div v-if="!notebookRows.length" class="empty"><b>Aucun check à afficher.</b>
        {{ui.notebook.q ? 'Aucun résultat pour cette recherche.' : 'Vérifiez la Configuration ou les filtres.'}}</div>
      <div v-else class="nb-wrap">
        <div class="nb">
          <!-- en-tête : demi-journées, heures -->
          <div class="nb-row nb-head">
            <div class="nb-lab"><b>{{tn(notebookRows.length, '{n} check', '{n} checks')}}</b></div>
            <div class="nb-track">
              <span v-for="(m,i) in MOMENTS" :key="i" class="nb-half" :class="[i%2 ? 'n' : 'd', {mo:ui.checks.moment===i, lock:!owned[i]}]"
                :style="{left:(i*100/6)+'%', width:(100/6)+'%'}"><span v-html="i%2 ? TL_MOON : TL_SUN"></span>{{m.long}}</span>
              <span v-for="h in NB_TICKS" :key="h.at" class="nb-tick" :style="{left:(h.at*100/72)+'%'}">{{h.label}}</span>
              <span v-if="saveAt !== null" class="nb-save head" :style="{left:(saveAt*100/72)+'%'}" :title="t('Dernière sauvegarde : {when}', {when:link.when})"><b>{{link.save.clock}}</b></span>
            </div>
          </div>
          <template v-for="g in notebookGroups" :key="g.id || '-'">
          <!-- en-tête de scène (regroupement) : nom, faits / total, horaires réunis de ses checks -->
          <div v-if="g.id" class="nb-row nb-scene" :class="{collapsed:ui.notebook.collapsed[g.id], done:g.done===g.rows.length}">
            <button type="button" class="nb-lab" :aria-expanded="!ui.notebook.collapsed[g.id]" @click="toggleNbScene(g.id)">
              <span class="chev" v-html="ICONS.chevron"></span>
              <span class="nb-name">{{g.label}}</span>
              <span class="nb-count" :title="t('{got} faits sur {total}', {got:g.done, total:g.rows.length})">{{g.done}}/{{g.rows.length}}</span></button>
            <div class="nb-track">
              <span v-for="(m,i) in MOMENTS" :key="i" class="nb-bg" :class="[i%2 ? 'n' : 'd', {mo:ui.checks.moment===i, lock:!owned[i]}]"
                :style="{left:(i*100/6)+'%', width:(100/6)+'%'}"></span>
              <span v-for="(b,j) in (ui.notebook.collapsed[g.id] ? g.full : [])" :key="'f'+j" class="nb-bar" :style="{left:(b[0]*100/72)+'%', width:((b[1]-b[0])*100/72)+'%'}"></span>
              <span v-for="(b,j) in (ui.notebook.collapsed[g.id] ? g.now : [])" :key="'n'+j" class="nb-bar now" :style="{left:(b[0]*100/72)+'%', width:((b[1]-b[0])*100/72)+'%'}"></span>
              <span v-if="saveAt !== null" class="nb-past" :style="{width:(saveAt*100/72)+'%'}"></span>
              <span v-if="saveAt !== null" class="nb-save" :style="{left:(saveAt*100/72)+'%'}"></span>
            </div>
          </div>
          <!-- une ligne par check -->
          <div v-for="r in (g.id && ui.notebook.collapsed[g.id] ? [] : g.rows)" :key="r.c.id" class="nb-row"
            :class="{done:store.game.checks[r.c.id], avail:!store.game.checks[r.c.id] && canNow(r.c), locked:!store.game.checks[r.c.id] && !canNow(r.c), sub:g.id}">
            <div class="nb-lab">
              <button type="button" class="nb-main" :title="r.c.label + ' — ' + r.scene + (r.text ? ' · ' + r.text : '')" @click="toggleCheck(r.c)">
                <span class="ci-cat cat-svg" v-html="CHECK_CAT[r.c.cat].icon"></span>
                <span class="nb-name">{{r.c.label}}<i v-if="store.game.checks[r.c.id] && store.game.found[r.c.id]" class="ci-found" title="Objet trouvé (d’après la sauvegarde)">{{foundLabel(r.c.id)}}</i><small v-if="!g.id">{{r.scene}}</small></span>
                <span v-if="store.game.checks[r.c.id]" class="cr-mark" v-html="ICONS.check"></span></button>
              <button v-if="!store.game.checks[r.c.id] && !canNow(r.c)" type="button" class="ci-ex ci-go"
                title="Pourquoi ce check n’est pas encore faisable ?" v-html="ICONS.why" @click="openWhy(r.c)"></button>
            </div>
            <div class="nb-track" :class="{why:!store.game.checks[r.c.id] && !canNow(r.c)}"
              :title="(r.text ? t('Faisable : {when}', {when:r.text}) : t('Faisable à tout moment')) + (!store.game.checks[r.c.id] && !canNow(r.c) ? t(' — clic : pourquoi pas encore ?') : '')"
              @click="!store.game.checks[r.c.id] && !canNow(r.c) && openWhy(r.c)">
              <span v-for="(m,i) in MOMENTS" :key="i" class="nb-bg" :class="[i%2 ? 'n' : 'd', {mo:ui.checks.moment===i, lock:!owned[i]}]"
                :style="{left:(i*100/6)+'%', width:(100/6)+'%'}"></span>
              <span v-for="(b,j) in r.full" :key="'f'+j" class="nb-bar" :style="{left:(b[0]*100/72)+'%', width:((b[1]-b[0])*100/72)+'%'}"></span>
              <span v-for="(b,j) in r.now" :key="'n'+j" class="nb-bar now" :style="{left:(b[0]*100/72)+'%', width:((b[1]-b[0])*100/72)+'%'}"></span>
              <span v-if="saveAt !== null" class="nb-past" :style="{width:(saveAt*100/72)+'%'}"></span>
              <span v-if="saveAt !== null" class="nb-save" :style="{left:(saveAt*100/72)+'%'}"></span>
            </div>
          </div>
          </template>
        </div>
      </div>
      <!-- annuler le dernier check (comme dans Checks ; une seule fois si les deux pages sont côte à côte) -->
      <div v-if="lastCheck && !shown('checks')" class="toast" role="status">{{lastCheck.text}}
        <button type="button" @click="undoCheck"><span v-html="ICONS.undo"></span>Annuler</button></div>`);

// graduations de l'axe : toutes les 6 h (6 h, 12 h, 18 h, 0 h…), en heures depuis le jour 1 à 6 h
const NB_TICKS = Array.from({ length:13 }, (_, k) => ({ at:k * 6, label:((6 + k * 6) % 24) + ' h' }));

function useNotebookPage(ctx){
  const { ui, logicNow, logicFull, canNow, seedChecks, owned } = ctx;   // (openWhy : de la page Checks, dans le gabarit)
  const s = store.settings;
  const norm = x => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // lignes : checks de la seed (non exclus) à horaire limité (ou tous avec l'option), triés par heure de début
  const notebookRows = computed(() => {
    const q = norm(ui.notebook.q.trim()), full = logicFull.value.checks, now = logicNow.value.checks, out = [];
    for (const c of seedChecks.value){
      if (s.excluded[c.id]) continue;
      const f = full[c.id];
      if (!f || !f.ok) continue;
      const text = whenText(f.when);
      if (!text && !ui.notebook.all) continue;
      const done = !!store.game.checks[c.id];
      if (ui.notebook.hideDone && done) continue;
      if (ui.checks.onlyAvailable && !done && !canNow(c)) continue;
      const scene = CHECK_SCENE[c.scene].label;
      if (q && !norm(c.label).includes(q) && !norm(scene).includes(q)) continue;
      const n = now[c.id], runs = whenRuns(f.when);
      out.push({ c, scene, text, full:runs, now:n && n.ok ? whenRuns(n.when) : [], start:runs.length ? runs[0][0] : 0 });
    }
    return out.sort((a, b) => a.start - b.start || a.full[0][1] - b.full[0][1] || a.c.label.localeCompare(b.c.label));
  });
  // réunion de plages [début, fin] (en heures) : la piste d'une scène
  const unite = list => {
    const out = [];
    list.slice().sort((a, b) => a[0] - b[0]).forEach(r => {
      const last = out[out.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else out.push([r[0], r[1]]);
    });
    return out;
  };
  // sections : une par scène (ordre du tracker) avec le regroupement, sinon une seule, sans en-tête
  const notebookGroups = computed(() => {
    const rows = notebookRows.value;
    if (!ui.notebook.byScene) return [{ id:'', rows }];
    const by = {};
    rows.forEach(r => (by[r.c.scene] = by[r.c.scene] || []).push(r));
    return CHECK_SCENES.filter(x => by[x.id]).map(x => {
      const list = by[x.id], open = list.filter(r => !store.game.checks[r.c.id]);
      return { id:x.id, label:x.label, rows:list, done:list.length - open.length,
        full:unite(list.flatMap(r => r.full)), now:unite(open.flatMap(r => r.now)) };
    });
  });
  const toggleNbScene = id => { ui.notebook.collapsed[id] = !ui.notebook.collapsed[id]; };
  function setAllNbScenes(collapsed){ CHECK_SCENES.forEach(sc => { ui.notebook.collapsed[sc.id] = collapsed; }); }
  // heure de la dernière sauvegarde lue (suivi en ligne) : repère vertical sur la frise
  const saveAt = computed(() => link.status === 'on' && link.save && link.save.half >= 0 ? link.save.hours : null);
  return { notebookRows, notebookGroups, toggleNbScene, setAllNbScenes, NB_TICKS, saveAt };
}
