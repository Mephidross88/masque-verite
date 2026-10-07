/* ---------- Page Configuration : réglages du randomizer, import d'un spoiler, langue ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */

const CONFIG_TPL = paneTpl('config', `<h1>Configuration</h1><p class="lede">Réglages du randomizer de 2 Ship 2 Harkinian 5.0.1 « Battler Bravo ».</p>
        <div class="import-box">
          <div class="lang-pick"><label title="Langue de l’interface (recharge la page)"><span>Langue</span>
            <select class="sel" :value="LANG" @change="setLang($event.target.value)"><option v-for="l in LANGS" :key="l[0]" :value="l[0]">{{l[1]}}</option></select></label>
            <label class="linklike" title="Ajouter une langue : fichier de traduction (.json : code, nom, dictionnaire), gardé dans ce navigateur">Ajouter…<input type="file" accept=".json,application/json" hidden @change="pickLang"></label>
            <button v-if="I18N_LANGS[LANG] && I18N_LANGS[LANG].imported" type="button" class="linklike" title="Retirer cette langue importée de ce navigateur" @click="removeLang(LANG)">Retirer</button></div>
          <div v-if="langMsg" class="msg ko">{{langMsg}}</div></div>`, `
      <div class="soon"><span class="soon-ic" v-html="ICONS.config"></span>
        <p>Les réglages de la seed (mélanges, accès à la Lune, horloges, indices…), repris d'un clic depuis le spoiler de 2Ship.</p>
        <p class="soon-step">Étape 1 : données de 2Ship</p></div>`);

function useConfigPage(ctx){
  // langue importée (fichier de traduction JSON) : gardée dans le navigateur puis choisie (rechargement)
  const langMsg = ref('');
  function pickLang(ev){
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { langMsg.value = importLang(r.result); };
    r.readAsText(f);
  }
  return { langMsg, pickLang };
}
