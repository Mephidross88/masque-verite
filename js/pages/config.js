/* ---------- Page Configuration : réglages du randomizer, import d'un spoiler, langue ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */
const SPOILER_COMMIT = '8a24047';   // version de référence de 2Ship (SPEC.md > Version de référence)

const CONFIG_TPL = paneTpl('config', `<h1>Configuration</h1><p class="lede">Réglages du randomizer de 2 Ship 2 Harkinian 5.0.1 « Battler Bravo ».</p>
        <div class="import-box">
          <div class="lang-pick"><label title="Langue de l’interface (recharge la page)"><span>Langue</span>
            <select class="sel" :value="LANG" @change="setLang($event.target.value)"><option v-for="l in LANGS" :key="l[0]" :value="l[0]">{{l[1]}}</option></select></label>
            <label class="linklike" title="Ajouter une langue : fichier de traduction (.json : code, nom, dictionnaire), gardé dans ce navigateur">Ajouter…<input type="file" accept=".json,application/json" hidden @change="pickLang"></label>
            <button v-if="I18N_LANGS[LANG] && I18N_LANGS[LANG].imported" type="button" class="linklike" title="Retirer cette langue importée de ce navigateur" @click="removeLang(LANG)">Retirer</button></div>
          <div v-if="langMsg" class="msg ko">{{langMsg}}</div>
          <label class="btn primary" title="Spoiler de la seed (randomizer/<seed>.json dans le dossier de 2Ship) : réglages, checks de la seed et objets de départ — l’emplacement des objets n’est jamais lu">
            <span class="btn-ic" v-html="ICONS.file"></span>Importer depuis un spoiler 2Ship…<input type="file" accept=".json,application/json" hidden @change="pickSpoiler"></label>
          <span v-if="store.game.seed.input" class="seed-pill" :title="'Seed de la partie — finalSeed ' + store.game.seed.final + (store.game.seed.file ? ', fichier ' + store.game.seed.file : '')">Seed <b>{{store.game.seed.input}}</b></span>
          <span v-else class="seed-pill none" title="Importez le spoiler de la seed pour la retenir">Seed inconnue</span></div>`, `
      <div v-if="importReport" class="import-report" :class="importReport.ok ? 'ok' : 'ko'">
        <b>{{importReport.title}}</b>
        <ul v-if="importReport.notes.length"><li v-for="(n,i) in importReport.notes" :key="i">{{n}}</li></ul>
        <button type="button" class="link" @click="importReport=null">Fermer</button>
      </div>
      <div v-if="importClash" class="import-report ko">
        <b>Ce spoiler est celui d’une autre seed (seed {{importClash.sp.inputSeed}}, la partie en cours : {{store.game.seed.input}}).</b>
        <p>Pour une nouvelle partie, remettez d’abord la partie à zéro.</p>
        <div class="mactions"><button class="btn" @click="importClash=null">Annuler</button>
          <button class="btn" @click="applySpoiler(importClash.sp, importClash.file)">Importer sans remettre à zéro</button>
          <button class="btn red" @click="resetGame(); applySpoiler(importClash.sp, importClash.file)">Remettre à zéro et importer</button></div>
      </div>
      <div v-if="DATA_ERRORS.length" class="errors"><b>{{tn(DATA_ERRORS.length, '{n} incohérence dans les données', '{n} incohérences dans les données')}}</b>
        <ul><li v-for="(er,i) in DATA_ERRORS" :key="i">{{er}}</li></ul></div>
      <p v-if="poolSize" class="pool-note">Checks de la seed : liste du spoiler importé ({{poolSize}}). Changer un réglage de mélange n’y change rien :
        <button type="button" class="link" @click="clearPool">revenir aux réglages</button>.</p>

      <nav class="config-tabs">
        <button v-for="tab in CONFIG_TABS" :key="tab.id" type="button" :class="{on:ui.configTab===tab.id}" @click="ui.configTab=tab.id">{{tab.label}}</button>
      </nav>
      <div class="cgrid">
        <section v-for="c in configCards" :key="c.id" class="cblock"><h2>{{c.title}}</h2>
          <div v-for="d in c.defs" :key="d.key" class="copt" :title="d.tip || null">
            <div><div class="t">{{d.label}}</div><div v-if="d.tip" class="d">{{d.tip}}</div></div>
            <seg v-if="d.type!=='num' && d.choices.length<=3" v-model="s[d.key]" :options="d.choices"></seg>
            <select v-else-if="d.type!=='num'" class="sel opt-sel" v-model="s[d.key]">
              <option v-for="ch in d.choices" :key="ch[0]" :value="ch[0]">{{ch[1]}}</option></select>
            <span v-else class="opt-numw"><input type="number" class="opt-num" :min="d.min" :max="d.max" step="1" v-model.number="s[d.key]"><small v-if="d.unit">{{d.unit}}</small></span>
          </div>
        </section>
      </div>`);

function useConfigPage(ctx){
  const { ui } = ctx;
  const s = store.settings;
  const DATA_ERRORS = [...CONFIG_ERRORS, ...CHECK_ERRORS];
  // cartes de l'onglet affiché : réglages visibles (show) de chaque carte
  const configCards = computed(() => {
    const tab = CONFIG_TABS.find(x => x.id === ui.configTab) || CONFIG_TABS[0];
    return tab.cards.map(([id, title]) => ({ id, title, defs:SETTINGS_DEF.filter(d => d.tab === tab.id && d.card === id && (!d.show || d.show(s))) }))
      .filter(c => c.defs.length);
  });
  const poolSize = computed(() => Object.keys(s.pool).length);
  const clearPool = () => { s.pool = {}; };

  /* Import d'un spoiler de 2Ship (Spoiler/Generate.cpp) : options (RO_…), checks de la seed (clés de « checks » : leur
     contenu n'est jamais lu), objets de départ (applyStartingItems, panneau Objets), seed. Autre seed qu'une partie en
     cours : on demande. */
  const importReport = ref(null), importClash = ref(null);
  function pickSpoiler(ev){
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let sp;
      try { sp = JSON.parse(r.result); } catch (e) { importReport.value = { ok:false, title:t('Fichier illisible : ce n’est pas un JSON valide.'), notes:[] }; return; }
      if (!sp || sp.type !== '2S2H_RANDO_SPOILER' || !sp.options || !sp.checks){
        importReport.value = { ok:false, title:t('Ce fichier n’est pas un spoiler du randomizer de 2Ship.'), notes:[] }; return;
      }
      const g = store.game;
      if (g.seed.final && sp.finalSeed !== g.seed.final && (Object.keys(g.checks).length || g.timeline.length)){ importClash.value = { sp, file:f.name }; return; }
      applySpoiler(sp, f.name);
    };
    r.readAsText(f);
  }
  function applySpoiler(sp, file){
    importClash.value = null;
    const notes = [];
    let n = 0;
    for (const d of SETTINGS_DEF) if (typeof sp.options[d.key] === 'number'){ s[d.key] = sp.options[d.key]; n++; }
    const unknown = Object.keys(sp.options).filter(k => !SETTING_BY_KEY[k]);
    s.pool = Object.fromEntries(Object.keys(sp.checks).filter(k => CHECK_BY_ID[k]).map(k => [k, 1]));
    // objets de départ du spoiler, et ceux que 2Ship donne d'office selon les réglages (absents du spoiler)
    timelineSkip = true;   // (objets de départ : pas dans la chronologie)
    let start;
    try { start = applyStartingItems([...(Array.isArray(sp.startingItems) ? sp.startingItems : []), ...computedStartingItems(s)]); } finally { timelineSkip = false; }
    store.game.seed = { input:String(sp.inputSeed ?? ''), final:Number(sp.finalSeed) || 0, file:file || '', commit:String(sp.commitHash || '') };
    setSeedItems(Number(sp.finalSeed) || 0, sp.checks);   // (objets de la seed : indices)
    notes.push(tn(n, '{n} réglage repris', '{n} réglages repris'), tn(Object.keys(s.pool).length, '{n} check dans la seed', '{n} checks dans la seed'),
      tn(start, '{n} objet de départ noté', '{n} objets de départ notés'));
    if (sp.commitHash && sp.commitHash !== SPOILER_COMMIT)
      notes.push(t('Spoiler d’une autre version de 2Ship (commit {c}) : l’appli suit la 5.0.1 ({ref}), certains checks ou réglages peuvent différer.', { c:sp.commitHash, ref:SPOILER_COMMIT }));
    if (unknown.length) notes.push(t('Réglages inconnus ignorés : {k}', { k:unknown.join(', ') }));
    importReport.value = { ok:true, title:t('Spoiler importé (seed {seed}).', { seed:sp.inputSeed }), notes };
  }

  // langue importée (fichier de traduction JSON) : gardée dans le navigateur puis choisie (rechargement)
  const langMsg = ref('');
  function pickLang(ev){
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { langMsg.value = importLang(r.result); };
    r.readAsText(f);
  }
  return { DATA_ERRORS, configCards, poolSize, clearPool, importReport, importClash, pickSpoiler, applySpoiler, langMsg, pickLang };
}
