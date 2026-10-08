/* ---------- Application ---------- */
/* Coque de l'appli : menu, barres latérales, fenêtres communes (sauvegarde, remise à zéro), assemblage des pages
   (js/pages/*.js : gabarit et logique de chaque page, chargés avant ce fichier). */

function useShell(ctx){
  const navOpen = ref(false), itemsOpen = ref(false), modal = ref(null);
  const backup = reactive({ text:'', msg:'', ok:true });
  const ui = store.ui;
  // Thème : « auto » suit le système (prefers-color-scheme), sinon data-theme force clair ou sombre (voir style.css).
  watch(() => ui.theme, t => { if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; },
    { immediate:true });
  const setTheme = t => { ui.theme = ui.theme === t ? 'auto' : t; };

  // Pages du menu, par groupe : la partie en cours (Progression), les vues d'ensemble (Aperçus), puis la Configuration à part.
  const views = [
    { id:'checks', label:t('Checks'), icon:ICONS.checks, group:t('Progression') },
    { id:'notebook', label:t('Journal des Bombers'), icon:ICONS.notebook, group:t('Progression') },
    { id:'hints', label:t('Indices'), icon:ICONS.hint, group:t('Progression') },
    { id:'map', label:t('Carte'), icon:ICONS.map, group:t('Aperçus') },
    { id:'stats', label:t('Statistiques'), icon:ICONS.stats, group:t('Aperçus') },
    { id:'config', label:t('Configuration'), icon:ICONS.config, group:'' },
  ];
  const navGroups = [...new Set(views.map(v => v.group))].map(g => ({ title:g, views:views.filter(v => v.group === g) }));
  // Mise en page côte à côte : second panneau (ui.split), seulement sur un écran assez large (sinon page principale
  // seule). go() n'ouvre une page que si elle n'est pas déjà affichée (dans un panneau ou l'autre).
  const SPLIT_MIN = 1500, winW = ref(window.innerWidth);
  window.addEventListener('resize', () => { winW.value = window.innerWidth; });
  const canSplit = computed(() => winW.value >= SPLIT_MIN);
  // écran moyen (901 à 1399 px) : panneau Objets en tiroir (onglet sur le bord droit), la page garde sa largeur
  const itemsDrawer = computed(() => winW.value > 900 && winW.value < 1400);
  watch(itemsDrawer, on => { if (!on) itemsOpen.value = false; });
  const splitOn = computed(() => !!ui.split && ui.split !== ui.view && canSplit.value && views.some(v => v.id === ui.split));
  const shown = v => ui.view === v || (splitOn.value && ui.split === v);
  const paneOf = v => splitOn.value && ui.split === v ? 'side' : 'main';
  function swapPanes(){ if (!ui.split) return; const m = ui.view; ui.view = ui.split; ui.split = m; }
  function openSide(v){ if (v === ui.view){ if (ui.split) swapPanes(); return; } ui.split = v; }
  const closeSide = () => { ui.split = ''; };
  if (!views.some(v => v.id === ui.view)) ui.view = views[0].id;

  function go(v){
    navOpen.value = false;
    if (shown(v)) return;
    ui.view = v;
    if (ui.split === v) ui.split = '';
    window.scrollTo({ top:0 });
  }
  return { navOpen, itemsOpen, modal, backup, ui, setTheme, views, navGroups, SPLIT_MIN, winW, canSplit, itemsDrawer,
    splitOn, shown, paneOf, swapPanes, openSide, closeSide, go };
}

function useShellEnd(ctx){
  const { backup, modal, ui } = ctx;
  // remise à zéro de la partie (la configuration est gardée)
  const resetGame = () => { store.game = defaults().game; };
  /* Sauvegarde */
  function openBackup(){ backup.text = JSON.stringify({ version:1, settings:store.settings, game:store.game }, null, 1); backup.msg = ''; modal.value = 'backup'; }
  async function copyBackup(){
    try { await navigator.clipboard.writeText(backup.text); backup.ok = true; backup.msg = t('Copié dans le presse-papiers.'); }
    catch (e) { backup.ok = false; backup.msg = t('Copie impossible ici : sélectionnez le texte et copiez-le manuellement.'); }
  }
  function importBackup(){
    try {
      const d = JSON.parse(backup.text), base = defaults();
      // Réglages fusionnés sur place : les gabarits gardent une référence directe à store.settings.
      Object.assign(store.settings, merge(base.settings, d.settings));
      store.game = merge(base.game, d.game);
      backup.ok = true; backup.msg = t('Partie importée.');
    } catch (e) { backup.ok = false; backup.msg = t('Texte invalide : collez le contenu complet d’un export.'); }
  }
  function resetAll(){ resetGame(); modal.value = null; }

  function onKey(ev){ if (ev.key === 'Escape') modal.value = null; }
  window.addEventListener('keydown', onKey);

  const savedAt = computed(() => lastSaved.value ? lastSaved.value.toLocaleTimeString(LANG === 'fr' ? 'fr-FR' : LANG, { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : null);
  return { openBackup, copyBackup, importBackup, resetGame, resetAll, onKey, savedAt };
}

const App = {
  components:{ Seg, ProgressCard, ItemTile },
  setup(){
    // pages assemblées dans l'ordre (chacune reçoit ce que les précédentes ont défini ; les rares appels vers une page
    // suivante passent par ctx, voir « défini plus loin »)
    const ctx = {};
    for (const use of [useShell, useItemsPanel, useChecksPage, useNotebookPage, useConfigPage, useShellEnd])
      Object.assign(ctx, use(ctx));
    // (noms globaux utilisés par le gabarit)
    return { LANG, LANGS, I18N_LANGS, setLang, removeLang, store, ICONS, CI, saveError, CHECK_CATS, CHECK_CAT, CONFIG_TABS, DUNGEONS,
      SPIDER_HOUSES, ITEM_BY_KEY, ...ctx };
  },
  template:`
<div class="shell" :class="{'nav-open':navOpen, split:splitOn, 'items-folded':ui.itemsFolded, 'items-drawer':itemsDrawer, 'nav-folded':ui.navFolded}">
  <header class="topbar">
    <button @click="navOpen=!navOpen" aria-label="Menu" v-html="ICONS.menu"></button>
    <span class="brand-mark" v-html="ICONS.mask"></span><span>Le Masque de Vérité</span>
    <button class="topbar-items" @click="itemsOpen=!itemsOpen" aria-label="Objets" v-html="ICONS.bag"></button>
  </header>

  <aside class="side">
    <div class="brand"><span class="brand-mark" v-html="ICONS.mask"></span>
      <div class="brand-text"><div class="brand-name">Le Masque de Vérité</div><div class="brand-sub">Rien ne vous échappe</div></div>
      <button type="button" class="nav-fold" @click="ui.navFolded=!ui.navFolded" :aria-expanded="!ui.navFolded"
        :title="ui.navFolded ? 'Déplier la barre de gauche' : 'Réduire la barre de gauche'" v-html="ICONS.chevron"></button></div>
    <nav class="nav">
      <template v-for="g in navGroups" :key="g.title">
      <div class="nav-group" :class="{sep:!g.title}">{{g.title}}</div>
      <button v-for="v in g.views" :key="v.id" class="nav-item" :class="{active:shown(v.id), 'in-side':paneOf(v.id)==='side' && shown(v.id)}" :title="ui.navFolded ? v.label : null" @click="go(v.id)">
        <span v-html="v.icon"></span><span class="nav-label">{{v.label}}</span>
        <span v-if="canSplit && !shown(v.id)" class="nav-split" role="button" :title="t('Ouvrir {page} à côté', {page:v.label})" v-html="ICONS.split"
          @click.stop="openSide(v.id)"></span></button>
      </template>
    </nav>

${CHECKS_SIDE_TPL}
${NOTEBOOK_SIDE_TPL}

    <div class="side-foot">
      <div class="side-foot-row">
        <div class="saved ko" v-if="saveError" title="Le navigateur refuse d'enregistrer (place insuffisante, navigation privée ?) : exportez la partie (Exporter ou importer la partie) pour ne pas la perdre."><i></i>Partie non enregistrée !</div>
        <div class="saved" v-else-if="savedAt"><i></i>Enregistré à {{savedAt}}</div>
        <div class="saved" v-else><i></i>Sauvegarde automatique active</div>
        <div class="theme-sw" role="group" aria-label="Thème">
          <button type="button" :class="{on:ui.theme==='light'}" :aria-pressed="ui.theme==='light'" v-html="ICONS.sun" @click="setTheme('light')"
            :title="ui.theme==='light' ? 'Thème clair (cliquer pour suivre le système)' : 'Thème clair'"></button>
          <button type="button" :class="{on:ui.theme==='dark'}" :aria-pressed="ui.theme==='dark'" v-html="ICONS.moon" @click="setTheme('dark')"
            :title="ui.theme==='dark' ? 'Thème sombre (cliquer pour suivre le système)' : 'Thème sombre'"></button>
        </div>
      </div>
      <button class="side-btn" @click="openBackup">Exporter ou importer la partie</button>
      <button class="danger-btn" @click="modal='reset'">Tout remettre à zéro</button>
    </div>
  </aside>

  <main class="main">
    <!-- Progression globale, en tête de toutes les pages -->
    <div class="global-progress">
      <progress-card :stats="checkStats" :unit="t('checks')" title="Checks" :active="ui.view==='checks'" @open="go('checks')"></progress-card>
    </div>
    <div class="panes" :class="{split:splitOn}">
${CHECKS_TPL}

${NOTEBOOK_TPL}

${HINTS_TPL}

${MAP_TPL}

${STATS_TPL}

${CONFIG_TPL}
    </div>
  </main>

${ITEMS_PANEL_TPL}

  <div class="scrim" @click="navOpen=false; itemsOpen=false"></div>

  <!-- Modales -->
  <div v-if="modal" class="overlay" @mousedown.self="modal=null">
    <div class="modal" role="dialog" aria-modal="true">
      <template v-if="modal==='backup'">
        <header><h3>Exporter ou importer</h3><button @click="modal=null" aria-label="Fermer" v-html="ICONS.close"></button></header>
        <div class="body">
          <p style="margin-top:0">La partie est enregistrée automatiquement dans ce navigateur. Pour la transférer ailleurs, copiez ce texte puis collez-le dans l'autre navigateur et cliquez sur « Importer ».</p>
          <textarea v-model="backup.text" spellcheck="false" aria-label="Données de la partie"></textarea>
          <div v-if="backup.msg" class="msg" :class="backup.ok?'ok':'ko'">{{backup.msg}}</div>
          <div class="mactions"><button class="btn" @click="copyBackup">Copier</button><button class="btn primary" @click="importBackup">Importer</button></div>
        </div>
      </template>
      <template v-else-if="modal==='reset'">
        <header><h3>Tout remettre à zéro ?</h3><button @click="modal=null" aria-label="Fermer" v-html="ICONS.close"></button></header>
        <div class="body">
          <p style="margin-top:0">L'état de la partie sera effacé. La configuration est conservée. Cette action est définitive.</p>
          <div class="mactions"><button class="btn" @click="modal=null">Annuler</button><button class="btn red" @click="resetAll">Tout effacer</button></div>
        </div>
      </template>
    </div>
  </div>
</div>`,
};

// langue : gabarits traduits au chargement (js/i18n.js), t() et tn() utilisables dans tous les gabarits
[App, Seg, ProgressCard, ItemTile].forEach(c => { c.template = tpl(c.template); });
const app = createApp(App);
app.config.globalProperties.t = t;
app.config.globalProperties.tn = tn;
app.mount('#app');
window.__PF = { I18N_MISSING, store, CHECKS, CHECK_BY_ID, checkShuffled, ITEM_BY_KEY, ITEM_BY_RI, SETTINGS_DEF };
