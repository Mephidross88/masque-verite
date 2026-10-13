/* ---------- Page Donjons : walkthrough des quatre temples (data/walkthroughs.js) ----------
   Un onglet par temple (ui.dungeons.tab), les salles dans l'ordre de la route conseillée, les étapes à cocher. Étape d'un
   check de la seed (rc) : cochée avec lui (toggleCheck de la page Checks : bandeau Annuler ; auto-tracking), faisable mise
   en avant, pas encore faisable estompée. Autre étape (ou check hors de la seed) : à cocher à la main (game.walk) ; « Tout
   décocher » (nouveau cycle : les énigmes sont à refaire) ne touche qu'à celles-ci, jamais aux checks. */
const WALK = WALKTHROUGHS.map(w => ({ id:w.id, label:td(w.fr, w.en),
  sections:w.sections.map(s => ({ label:td(s.fr, s.en), steps:s.steps.map(st => ({ id:st.id, rc:st.rc || null, text:td(st.fr, st.en) })) })) }));
const WALK_BY_ID = Object.fromEntries(WALK.map(w => [w.id, w]));

const WALK_TPL = paneTpl('dungeons', `<h1>Donjons</h1><p class="lede">Les quatre temples, salle par salle : une route conseillée, et ce qu’il faut avoir à chaque étape.</p>`, `
      <div class="dg-tabs" role="tablist">
        <button v-for="w in WALK" :key="w.id" type="button" role="tab" :class="{on:walkCur.id===w.id}" :style="{'--dg':DUNGEON_BY_ID[w.id].color}" @click="ui.dungeons.tab=w.id">
          <img :src="'icons/dungeons/' + DUNGEON_BY_ID[w.id].fairy + '.png'" alt="">{{w.label}}<small>{{walkStats[w.id].done}} / {{walkStats[w.id].total}}</small></button>
      </div>
      <div class="dg-bar">
        <label class="check"><input type="checkbox" v-model="ui.dungeons.hideDone">Masquer les étapes faites</label>
        <span class="dg-legend"><i class="dg-dot now"></i>check faisable <i class="dg-dot later"></i>pas encore <i class="dg-dot manual"></i>à cocher à la main</span>
        <button type="button" class="btn" title="Décoche les étapes cochées à la main de ce temple (énigmes à refaire après le Chant du temps) ; les checks restent faits" @click="walkReset(walkCur.id)">Tout décocher (nouveau cycle)</button>
      </div>
      <p class="dg-note">Route du jeu de base : dans le randomizer, les coffres contiennent d’autres objets, et l’on peut arriver avec des clés ou des objets d’avance — suivez les conditions entre parenthèses.</p>
      <template v-for="(sec,i) in walkCur.sections" :key="walkCur.id + i">
        <section v-if="walkShown(sec).length" class="dg-sec">
          <h2>{{sec.label}} <small>{{sec.steps.filter(walkDone).length}} / {{sec.steps.length}}</small>
            <button v-if="mapsData && walkIds(sec).length" type="button" class="go-map" :title="t('Voir les checks de la salle sur la carte')" v-html="ICONS.map" @click="walkFocus(sec)"></button></h2>
          <ul class="dg-steps">
            <li v-for="st in walkShown(sec)" :key="st.id" class="dg-step" :class="walkClass(st)">
              <button type="button" class="dg-mark" :title="walkCheck(st) ? t('Check : {check} — clic : le cocher', {check:walkCheck(st).label}) : t('Étape à cocher à la main')"
                v-html="walkDone(st) ? ICONS.check : ICONS.circleO" @click="walkToggle(st)"></button>
              <span class="dg-text" :class="{sel:ui.dungeons.sel===st.id, link:mapsData}" :title="mapsData ? t('Clic : voir sur la carte') : null" @click="walkFocus(sec, st)">{{st.text}}</span>
              <span v-if="walkCheck(st)" class="dg-check" :title="t('Check de la seed')"><span class="cat-svg" v-html="CHECK_CAT[walkCheck(st).cat].icon"></span>{{walkCheck(st).label}}</span>
            </li></ul>
        </section>
      </template>
      <div v-if="lastCheck && !shown('checks') && !shown('notebook') && !shown('map')" class="toast" role="status">{{lastCheck.text}}
        <button type="button" @click="undoCheck"><span v-html="ICONS.undo"></span>Annuler</button></div>`);

function useDungeonsPage(ctx){
  const { ui, canNow, seedChecks, toggleCheck } = ctx;
  const g = () => store.game;
  const walkCur = computed(() => WALK_BY_ID[ui.dungeons.tab] || WALK[0]);
  const inSeed = computed(() => new Set(seedChecks.value.map(c => c.id)));
  // check de la seed d'une étape (null : étape à la main)
  const walkCheck = st => st.rc && inSeed.value.has(st.rc) ? CHECK_BY_ID[st.rc] : null;
  const walkDone = st => { const c = walkCheck(st); return c ? !!g().checks[c.id] : !!g().walk[st.id]; };
  const walkShown = sec => ui.dungeons.hideDone ? sec.steps.filter(st => !walkDone(st)) : sec.steps;
  const walkClass = st => { const c = walkCheck(st), done = walkDone(st);
    return { done, manual:!c, now:c && !done && canNow(c), later:c && !done && !canNow(c) }; };
  function walkToggle(st){
    const c = walkCheck(st);
    if (c) toggleCheck(c);
    else if (g().walk[st.id]) delete g().walk[st.id];
    else g().walk[st.id] = true;
  }
  // checks d'une étape (le sien) ou de sa salle (étape sans check) à mettre en lumière sur la Carte (l'Ode de l'Appel n'a pas
  // de place dans le temple)
  const walkIds = (sec, st) => st && st.rc ? [st.rc] : sec.steps.map(x => x.rc).filter(rc => rc && rc !== 'RC_GIANTS_CHAMBER_OATH_TO_ORDER');
  function walkFocus(sec, st){
    if (st) ui.dungeons.sel = st.id;
    let ids = walkIds(sec, st);
    if (st && ids[0] === 'RC_GIANTS_CHAMBER_OATH_TO_ORDER') ids = walkIds(sec);
    ctx.focusMap(ids) || (st && st.rc && ctx.focusMap(walkIds(sec)));
  }
  function walkReset(id){ for (const s of WALK_BY_ID[id].sections) for (const st of s.steps) delete g().walk[st.id]; }
  // étapes faites / total par temple (onglets)
  const walkStats = computed(() => Object.fromEntries(WALK.map(w => {
    const all = w.sections.flatMap(s => s.steps);
    return [w.id, { done:all.filter(walkDone).length, total:all.length }];
  })));
  return { WALK, walkIds, walkFocus, walkCur, walkCheck, walkDone, walkShown, walkClass, walkToggle, walkReset, walkStats };
}
