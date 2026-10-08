/* ---------- Page Checks : les checks de la seed, scène par scène (comme le tracker de checks de 2Ship) ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Logique (js/logic.js) : faisable maintenant avec l'inventaire noté ; moments possibles de chaque check (frise des trois
   jours sur chaque ligne, avec tous les objets) ; moment choisi (demi-journée) : faisables à ce moment. */

const CHECKS_SIDE_TPL = `
    <section v-if="shown('checks')" class="side-sec" :style="{order:paneOf('checks')==='side' ? 2 : 1}">
      <div v-if="splitOn" class="side-title side-page">Checks</div>
      <div class="side-row"><button class="side-btn" @click="setAllChecks(false)">Tout déplier</button><button class="side-btn" @click="setAllChecks(true)">Tout replier</button></div>
      <label class="check"><input type="checkbox" v-model="ui.checks.showExcluded">Afficher les checks exclus</label>
      <div class="zone-nav check-nav">
        <button v-for="x in sceneStats" :key="x.scene.id" v-show="x.total" :class="{done:x.complete}" :title="sceneTitle(x)" @click="jumpScene(x.scene.id)">
          <span class="cn-name">{{x.scene.label}}</span>
          <span class="cn-nums"><i>{{x.got}}</i><i class="a">{{x.accessible}}</i><i>{{x.total}}</i></span></button>
      </div>
    </section>
`;

const CHECKS_TPL = paneTpl('checks', `<h1>Checks</h1>`, `
      <div class="checks-toolbar">
        <input class="checks-search" type="search" v-model="ui.checks.q" placeholder="Rechercher un check ou une scène…" aria-label="Rechercher un check">
        <div class="ct-row">
          <div class="age-seg moment-seg" title="Moment du cycle : les checks faisables à ce moment sont mis en avant (frise : la case du moment est entourée)">
            <span class="ct-label">Moment</span>
            <button type="button" :class="{on:ui.checks.moment<0}" @click="ui.checks.moment=-1">Tous</button>
            <button v-for="(m,i) in MOMENTS" :key="i" type="button" :class="['mo-' + (i%2 ? 'night' : 'day'), {on:ui.checks.moment===i, lock:!owned[i]}]" :title="owned[i] ? m.long : t('{moment} : demi-journée pas encore possédée (temps mélangé)', {moment:m.long})" @click="ui.checks.moment=i">{{m.short}}</button>
          </div>
          <label class="check" title="N'afficher que les checks faisables avec l'inventaire noté (au moment choisi), et ceux déjà faits"><input type="checkbox" v-model="ui.checks.onlyAvailable">Seulement les faisables</label>
          <label class="check"><input type="checkbox" v-model="ui.checks.hideDone">Masquer les checks faits</label>
          <label class="check"><input type="checkbox" v-model="ui.checks.hideDoneZones">Masquer les scènes terminées</label>
        </div>
        <div class="cat-chips">
          <button v-for="k in CHECK_CATS" v-show="catCounts[k.id].total" :key="k.id" type="button" class="cat-chip" :class="{off:ui.checks.hiddenCats[k.id]}"
            :title="k.label + ' : ' + catCounts[k.id].left + ' à faire sur ' + catCounts[k.id].total + ' — clic : afficher / masquer, clic droit : seulement cette catégorie'"
            @click="toggleCat(k.id)" @contextmenu.prevent="soloCat(k.id)">
            <span class="cat-svg" v-html="k.icon"></span><span class="cc-label">{{k.label}}</span><b>{{catCounts[k.id].left}}</b></button>
          <button type="button" class="link cat-all" @click="allCats(true)">Tout afficher</button>
        </div>
      </div>

      <p v-if="s.RO_CLOCK_SHUFFLE && !owned.some(Boolean)" class="clock-note"><span v-html="ICONS.clock"></span>Temps mélangé : notez vos demi-journées dans le panneau Objets (Capacités). 2Ship vous en donne une au départ, tirée au sort, que le spoiler n’indique pas ; sans elle, seul le jour 1 à 6 h compte.</p>
      <div v-if="!checkList.length" class="empty"><b>Aucun check à afficher.</b>
        {{ui.checks.q ? 'Aucun résultat pour cette recherche.' : 'Vérifiez la Configuration ou les filtres.'}}</div>
      <article v-for="x in checkList" :key="x.scene.id" class="area check-area" :id="'carea-'+x.scene.id"
        :class="['st-' + x.state, {collapsed:ui.checks.collapsed[x.scene.id], complete:x.complete}]">
        <button class="area-head" @click="toggleScene(x.scene.id)" :aria-expanded="!ui.checks.collapsed[x.scene.id]">
          <span class="chev" v-html="ICONS.chevron"></span>
          <h2>{{x.scene.label}}</h2>
          <span class="zone-cats">
            <span v-for="b in x.byCat" v-show="b.left" :key="b.cat.id" class="zc" :title="b.cat.label + ' : ' + b.left + ' à faire'"><span class="cat-svg" v-html="b.cat.icon"></span>{{b.left}}</span>
          </span>
          <span class="zone-prog" :title="sceneTitle(x)">
            <span class="zbar"><i class="d" :style="{width:(x.total ? 100*x.got/x.total : 0)+'%'}"></i><i class="a" :style="{width:(x.total ? 100*x.accessible/x.total : 0)+'%'}"></i></span>
            <span class="zn"><b>{{x.got}}</b><small>{{tn(x.got, 'fait', 'faits')}}</small></span>
            <span class="zn acc"><b>{{x.accessible}}</b><small>{{tn(x.accessible, 'faisable', 'faisables')}}</small></span>
            <span class="zn"><b>{{x.total}}</b><small>total</small></span></span>
        </button>
        <div v-if="!ui.checks.collapsed[x.scene.id]" class="check-body">
          <ul v-if="x.checks.length" class="check-list-grid">
            <li v-for="c in x.checks" :key="c.id" class="check-item"
              :class="{done:store.game.checks[c.id], excluded:s.excluded[c.id], avail:!store.game.checks[c.id] && canNow(c), locked:!store.game.checks[c.id] && !canNow(c)}">
              <button type="button" class="ci-main" :title="checkTitle(c)" @click="toggleCheck(c)">
                <span class="ci-cat cat-svg" v-html="CHECK_CAT[c.cat].icon"></span>
                <span class="ci-label">{{c.label}}<i v-if="store.game.checks[c.id] && store.game.found[c.id]" class="ci-found" title="Objet trouvé (d’après la sauvegarde)">{{foundLabel(c.id)}}</i></span>
                <span v-if="timeline[c.id]" class="tl3" :title="timeline[c.id].title"><span v-for="d in 3" :key="d" class="tl3-d"><b>{{d}}</b><i
                  v-for="k in 2" :key="k" :class="[timeline[c.id].cells[(d-1)*2+k-1], {mo:ui.checks.moment===(d-1)*2+k-1, ok:nowCells(c)[(d-1)*2+k-1], lock:!owned[(d-1)*2+k-1]}]"
                  :style="timeline[c.id].fill[(d-1)*2+k-1]"
                  v-html="k===1 ? TL_SUN : TL_MOON"></i></span></span>
                <span v-else-if="never[c.id]" class="tl3 never" title="Jamais faisable selon la logique avec la configuration actuelle (même avec tous les objets)">—</span>
                <span class="cr-mark" v-html="store.game.checks[c.id] ? ICONS.check : ICONS.circleO"></span></button>
              <button v-if="!store.game.checks[c.id] && !s.excluded[c.id] && !canNow(c) && !never[c.id]" type="button" class="ci-ex ci-go"
                title="Pourquoi ce check n’est pas encore faisable ?" v-html="ICONS.why" @click="openWhy(c)"></button>
              <button type="button" class="ci-ex" :title="s.excluded[c.id] ? 'Réintégrer ce check' : 'Exclure ce check (ne compte plus)'"
                @click="toggleExcluded(c)">{{s.excluded[c.id] ? '↺' : '⊘'}}</button>
            </li>
          </ul>
          <p v-else class="quest-note">{{x.total ? 'Tous les checks affichés de cette scène sont faits.' : 'Aucun check avec les filtres actuels.'}}</p>
        </div>
      </article>
      <div v-if="lastCheck" class="toast" role="status">{{lastCheck.text}}
        <button type="button" @click="undoCheck"><span v-html="ICONS.undo"></span>Annuler</button></div>`);

// fenêtre « Pourquoi pas encore ? » : ce qui manque (whyLocked de logic.js), au moment choisi s'il y en a un
const WHY_TPL = `
      <template v-else-if="modal==='why' && why.check">
        <header><h3>Pourquoi pas encore ?</h3><button @click="modal=null" aria-label="Fermer" v-html="ICONS.close"></button></header>
        <div class="body why-modal">
          <p class="why-check"><b>{{why.check.label}}</b> · {{CHECK_SCENE[why.check.scene].label}}<template v-if="why.moment>=0"> · {{MOMENTS[why.moment].long}}</template></p>
          <p v-if="!why.res" class="why-wait">Calcul en cours…</p>
          <p v-else-if="why.res.never">Jamais faisable selon la logique avec la configuration actuelle (même avec tous les objets).</p>
          <p v-else-if="why.res.neverAt">Jamais faisable à ce moment-là, même avec tous les objets. Possible : {{why.res.when || t('à tout moment')}}.</p>
          <p v-else-if="why.res.panel">Il manque quelque chose que le panneau Objets ne permet pas de noter.</p>
          <template v-else>
            <p v-if="!why.res.items.length">Rien ne manque : il est déjà faisable (l’inventaire a changé entre-temps).</p>
            <template v-else>
              <p>Il suffirait d’avoir :</p>
              <ul class="why-items"><li v-for="(it,i) in why.res.items" :key="i"><img v-if="it.src && !brokenIcons[it.src]" :src="it.src" alt=""
                @error="brokenIcons[it.src]=true"><span v-else class="why-dot"></span>{{it.label}}</li></ul>
            </template>
            <p class="why-note">Ensuite faisable : {{why.res.when || t('à tout moment')}}. C’est un ensemble minimal d’objets parmi d’autres possibles.</p>
          </template>
        </div>
      </template>`;

// icônes des cases de la frise (soleil : jour, lune : nuit)
const TL_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>';
const TL_MOON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>';
// demi-journées du sélecteur de moment
const MOMENTS = [0, 1, 2, 3, 4, 5].map(i => ({ short:(i % 2 ? t('N') : t('J')) + (Math.floor(i / 2) + 1), long:halfDayLabel(i) }));

function useChecksPage(ctx){
  const { ui, navOpen } = ctx;
  const s = store.settings;
  // logique : maintenant (inventaire noté) et tout obtenu (moments possibles de chaque check, selon la configuration)
  const logicNow = computed(() => computeLogic(stateFromGame(store.game, s, store.game.prices)));
  const logicFull = computed(() => computeLogic(fullState(s)));
  // faisable maintenant (au moment choisi, s'il y en a un)
  function canNow(c){
    const x = logicNow.value.checks[c.id];
    if (!x || !x.ok) return false;
    const m = ui.checks.moment;
    return m < 0 || (x.when & HALF_MASK[m]) !== 0n;
  }
  // demi-journées où le check est faisable maintenant (cases de la frise mises en valeur)
  const nowCells = c => { const x = logicNow.value.checks[c.id]; return x && x.ok ? halfDaysOf(x.when) : [false, false, false, false, false, false]; };
  // frise de chaque check : cases pleines / partielles / vides, heures au survol
  const timeline = computed(() => {
    const out = {}, full = logicFull.value.checks;
    for (const c of CHECKS){
      const x = full[c.id];
      if (!x || !x.ok) continue;
      const text = whenText(x.when);
      out[c.id] = { title:text ? t('Faisable : {when}', { when:text }) : t('Faisable à tout moment'),
        cells:HALF_MASK.map(m => (x.when & m) === m ? 'full' : (x.when & m) ? 'part' : ''),
        // case partielle : remplie de gauche à droite aux heures couvertes (12 h par case)
        fill:HALF_MASK.map((m, i) => (x.when & m) && (x.when & m) !== m ? partFill(halfDayParts(x.when, i)) : null) };
    }
    return out;
  });
  const pct = f => Math.round(f * 1000) / 10 + '%';
  const partFill = parts => ({ background:'linear-gradient(to right, ' + parts.map(([a, b]) => 'transparent ' + pct(a) + ', var(--c) ' + pct(a) + ' ' + pct(b) + ', transparent ' + pct(b)).join(', ') + ')' });
  // demi-journées possédées (temps mélangé) : les autres sont barrées sur les frises et dans le sélecteur de moment
  const owned = computed(() => ownedHalfDays(store.game, s));
  const never = computed(() => Object.fromEntries(CHECKS.filter(c => !logicFull.value.checks[c.id]?.ok).map(c => [c.id, true])));

  // checks de la seed (mélangés selon la configuration ou le spoiler) ; exclus : comptent à part
  const seedChecks = computed(() => CHECKS.filter(c => checkShuffled(c, s)));
  const counted = c => !s.excluded[c.id];
  // par scène : faits / faisables / total (sans les exclus), restants par catégorie, état (terminée, faisable, bloquée)
  const sceneStats = computed(() => {
    const by = {};
    for (const c of seedChecks.value) (by[c.scene] = by[c.scene] || []).push(c);
    return CHECK_SCENES.map(scene => {
      const list = by[scene.id] || [], live = list.filter(counted);
      const got = live.filter(c => store.game.checks[c.id]).length;
      const accessible = live.filter(c => !store.game.checks[c.id] && canNow(c)).length;
      const complete = live.length > 0 && got === live.length;
      return { scene, list, total:live.length, got, accessible, excluded:list.length - live.length, complete,
        state:complete ? 'done' : accessible ? 'open' : 'blocked' };
    });
  });
  // progression globale (cadre en tête des pages)
  const checkStats = computed(() => {
    const all = sceneStats.value, total = all.reduce((n, x) => n + x.total, 0), got = all.reduce((n, x) => n + x.got, 0);
    const acc = all.reduce((n, x) => n + x.accessible, 0);
    const done = all.filter(x => x.complete).length, scenes = all.filter(x => x.total).length;
    return { got, total, sub:tn(total - got, '{n} restant', '{n} restants') + ' · ' + tn(acc, '{n} faisable', '{n} faisables')
      + ' · ' + t('{a} / {b} scènes terminées', { a:done, b:scenes }), groups:[] };
  });
  const catCounts = computed(() => {
    const out = Object.fromEntries(CHECK_CATS.map(k => [k.id, { total:0, left:0 }]));
    for (const c of seedChecks.value) if (counted(c)){ const o = out[c.cat]; o.total++; if (!store.game.checks[c.id]) o.left++; }
    return out;
  });
  const norm = x => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const checkList = computed(() => {
    const q = norm(ui.checks.q.trim());
    return sceneStats.value.map(x => {
      if (!x.list.length) return null;
      if (ui.checks.hideDoneZones && x.complete) return null;
      const sceneHit = q && norm(x.scene.label).includes(q);
      const checks = x.list.filter(c => (ui.checks.showExcluded || counted(c)) && !ui.checks.hiddenCats[c.cat]
        && !(ui.checks.hideDone && store.game.checks[c.id]) && (!ui.checks.onlyAvailable || store.game.checks[c.id] || canNow(c))
        && (!q || sceneHit || norm(c.label).includes(q)));
      if ((q || ui.checks.onlyAvailable) && !checks.length) return null;
      // faisables d'abord, puis pas encore, puis faits
      const rank = c => store.game.checks[c.id] ? 2 : canNow(c) ? 0 : 1;
      checks.sort((a, b) => rank(a) - rank(b));
      const byCat = CHECK_CATS.map(cat => ({ cat, left:x.list.filter(c => c.cat === cat.id && counted(c) && !store.game.checks[c.id]).length }));
      return { ...x, checks, byCat };
    }).filter(Boolean);
  });
  const sceneTitle = x => t('{got} faits, {acc} faisables, sur {total}', { got:x.got, acc:x.accessible, total:x.total })
    + (x.excluded ? ' · ' + tn(x.excluded, '{n} exclu', '{n} exclus') : '');
  const checkTitle = c => c.label + ' — ' + CHECK_CAT[c.cat].label + (LANG !== 'en' ? ' · ' + c.en : '');

  // cocher / décocher, avec annulation du dernier changement
  const lastCheck = ref(null);
  let lastTimer = null;
  function toggleCheck(c){
    const was = !!store.game.checks[c.id];
    if (was) delete store.game.checks[c.id]; else store.game.checks[c.id] = true;
    lastCheck.value = { id:c.id, was, text:(was ? t('Décoché : ') : t('Coché : ')) + c.label };
    clearTimeout(lastTimer); lastTimer = setTimeout(() => { lastCheck.value = null; }, 5000);
  }
  function undoCheck(){
    const l = lastCheck.value;
    if (!l) return;
    if (l.was) store.game.checks[l.id] = true; else delete store.game.checks[l.id];
    lastCheck.value = null;
  }
  // « Pourquoi pas encore ? » : calcul de quelques centaines de millisecondes, lancé après l'ouverture de la fenêtre
  const why = reactive({ check:null, moment:-1, res:null });
  function openWhy(c){
    why.check = c; why.moment = ui.checks.moment; why.res = null; ctx.modal.value = 'why';
    setTimeout(() => { if (why.check?.id === c.id) why.res = whyLocked(store.game, s, c.id, why.moment); }, 30);
  }
  function toggleExcluded(c){ if (s.excluded[c.id]) delete s.excluded[c.id]; else s.excluded[c.id] = true; }
  const toggleScene = id => { ui.checks.collapsed[id] = !ui.checks.collapsed[id]; };
  function setAllChecks(collapsed){ CHECK_SCENES.forEach(sc => { ui.checks.collapsed[sc.id] = collapsed; }); }
  function jumpScene(id){
    ui.checks.collapsed[id] = false; navOpen.value = false;
    nextTick(() => { document.getElementById('carea-' + id)?.scrollIntoView({ behavior:'smooth', block:'start' }); });
  }
  // catégories : clic = afficher / masquer, clic droit = seulement celle-ci
  const toggleCat = id => { ui.checks.hiddenCats[id] = !ui.checks.hiddenCats[id]; };
  const soloCat = id => { CHECK_CATS.forEach(k => { ui.checks.hiddenCats[k.id] = k.id !== id; }); };
  const allCats = () => { CHECK_CATS.forEach(k => { ui.checks.hiddenCats[k.id] = false; }); };
  return { s, logicNow, logicFull, canNow, nowCells, timeline, never, seedChecks, sceneStats, checkStats, catCounts, checkList,
    sceneTitle, checkTitle, lastCheck, toggleCheck, undoCheck, toggleExcluded, toggleScene, setAllChecks, jumpScene, toggleCat,
    soloCat, allCats, MOMENTS, TL_SUN, TL_MOON, owned, why, openWhy };
}
