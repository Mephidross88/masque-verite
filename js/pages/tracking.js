/* ---------- Auto-tracking : bouton de la barre de gauche et fenêtre (lecture de la sauvegarde de 2Ship, js/link.js) ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App. */

// barre de gauche : état du suivi, ouvre la fenêtre
const LINK_BTN_TPL = `
      <button type="button" class="link-btn" :class="LINK_CLASS[link.status]" @click="modal='link'" :title="t('Auto-tracking : {etat}', {etat:LINK_LABEL[link.status]})">
        <span class="link-ic" v-html="ICONS.live"></span><i></i><span class="link-label">{{LINK_LABEL[link.status]}}</span></button>`;

// en tête des pages, à côté du compteur de checks (suivi en ligne) : jour et heure de la dernière sauvegarde, frise des
// trois jours avec son repère ; clic : fenêtre de l'auto-tracking
const SAVE_CARD_TPL = `
      <button v-if="link.status==='on' && link.save" type="button" class="progress-card save-card" :class="link.save.half % 2 ? 'night' : 'day'"
        :title="t('Dernière sauvegarde lue : {file} à {at}', {file:link.file, at:linkAt})" @click="modal='link'">
        <span class="sc-ic" v-html="link.save.half % 2 ? ICONS.moon : ICONS.sun"></span>
        <div class="pc-main">
          <div class="pc-title">Dernière sauvegarde</div>
          <div class="pc-count"><b>{{link.save.half >= 0 ? MOMENTS[link.save.half].long : t('Avant le premier jour')}}</b>
            <span v-if="link.save.half >= 0">{{link.save.clock}}</span></div>
          <div class="sc-bar"><i v-for="(m,i) in MOMENTS" :key="i" :class="[i%2 ? 'n' : 'd', {past:i < link.save.half, cur:i === link.save.half}]"></i>
            <b :style="{left:(link.save.hours*100/72)+'%'}"></b></div>
          <div class="pc-sub">{{t('lue à {at}', {at:linkAt})}} · {{link.file}}</div>
        </div>
      </button>`;

const LINK_MODAL_TPL = `
      <template v-else-if="modal==='link'">
        <header><h3>Auto-tracking</h3><button @click="modal=null" aria-label="Fermer" v-html="ICONS.close"></button></header>
        <div class="body link-modal">
          <p style="margin-top:0">Suit votre partie en lisant la sauvegarde de 2Ship : checks faits, objets trouvés, prix des
            boutiques, moment du cycle. Lecture seule : l’appli ne modifie jamais vos fichiers.</p>
          <ol class="link-steps">
            <li>Dans 2Ship, menu Enhancements &gt; Saving : activez <b>Autosave</b> et réglez l’intervalle sur <b>1 minute</b>.
              Le jeu sauvegarde aussi au Chant du temps et aux statues de hibou.</li>
            <li>Choisissez le dossier <code>saves</code> de 2Ship (à côté de <code>2ship.exe</code>) : l’appli le relit dès qu’il change.</li>
          </ol>
          <div v-if="LINK_CAN" class="link-status" :class="LINK_CLASS[link.status]"><i></i><b>{{LINK_LABEL[link.status]}}</b>
            <span v-if="link.dir && link.status!=='off'">— dossier {{link.dir}}</span>
            <button v-if="link.status==='off'" type="button" class="btn primary" @click="linkPick">Choisir le dossier saves…</button>
            <template v-else-if="link.status==='perm'">
              <button type="button" class="btn primary" @click="linkResume">Reprendre le suivi</button>
              <button type="button" class="btn" @click="linkPick">Changer de dossier…</button></template>
            <template v-else><button type="button" class="btn" @click="linkPick">Changer de dossier…</button>
              <button type="button" class="btn" @click="linkStop">Arrêter</button></template>
          </div>
          <div v-else class="msg ko">Ce navigateur ne peut pas suivre un dossier (Firefox, Safari) : utilisez Chrome ou Edge,
            ou lisez la sauvegarde à la main après chaque sauvegarde du jeu.</div>
          <div class="link-opts">
            <label v-if="LINK_CAN">Fichier suivi
              <select class="sel" v-model="ui.link.slot"><option value="">le plus récent</option>
                <option v-for="f in SAVE_FILES" :key="f" :value="f">{{f}}</option></select></label>
            <label class="check" title="Le sélecteur Moment (Checks, Journal des Bombers) suit le jour et l’heure de la sauvegarde">
              <input type="checkbox" v-model="ui.link.moment">Le moment du cycle suit la sauvegarde</label>
            <label class="btn import-btn">Lire une sauvegarde…<input type="file" accept=".json,application/json" @change="linkPickFile" hidden></label>
          </div>
          <div v-if="link.file" class="link-pos">Dernière lecture : <b>{{link.file}}</b> à {{linkAt}} · seed {{link.seed}}
            <template v-if="link.when"> · {{link.when}}</template></div>
          <div v-if="link.warn" class="msg ko">{{link.warn}}</div>
          <div v-if="link.foreign" class="msg ko link-foreign">Cette sauvegarde est celle d’une autre seed ({{link.foreign.seed}}) que la
            partie notée ({{store.game.seed.final}}) : elle est ignorée. Pour la suivre, la partie notée sera remise à zéro.
            <button type="button" class="btn red" @click="linkAdoptReset">Remettre à zéro et suivre</button></div>
          <div class="link-log">
            <div v-for="(l, i) in link.log" :key="i"><span>{{l.t}}</span>{{l.text}}</div>
            <div v-if="!link.log.length" class="muted">Aucune lecture pour l’instant.</div>
          </div>
        </div>
      </template>
`;

// pastille de l'état (couleurs de style.css)
const LINK_CLASS = { off:'', perm:'relay', on:'game', error:'busy' };
// objet trouvé dans un check fait (d'après la sauvegarde)
const foundLabel = id => { const ri = store.game.found[id]; return ri ? (ITEM_DATA[ri] ? ITEM_DATA[ri].label : ri) : ''; };

function useTracking(ctx){
  const linkAt = computed(() => link.at ? link.at.toLocaleTimeString(LANG === 'fr' ? 'fr-FR' : LANG, { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '');
  // autre seed : remise à zéro (resetGame, défini plus loin dans useShellEnd) puis lecture de cette sauvegarde
  function linkAdoptReset(){ ctx.resetGame(); linkAdopt(); }
  return { link, LINK_LABEL, LINK_CLASS, LINK_CAN, SAVE_FILES, linkAt, linkPick, linkResume, linkStop, linkPickFile, linkAdoptReset, foundLabel };
}
