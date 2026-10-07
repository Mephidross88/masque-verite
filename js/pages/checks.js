/* ---------- Page Checks : les checks de la seed, scène par scène ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */

const CHECKS_TPL = paneTpl('checks', `<h1>Checks</h1><p class="lede">Les checks de la seed, scène par scène comme dans le tracker de 2Ship.</p>`, `
      <div class="soon"><span class="soon-ic" v-html="ICONS.mask"></span>
        <p>Faits, faisables maintenant, pas encore (et pourquoi) : selon vos objets, vos formes et le moment des trois jours. Les checks à refaire à chaque cycle sont distingués de ceux qu'on garde après le Chant du temps.</p>
        <p class="soon-step">Étape 1 : liste des checks · Étape 2 : logique</p></div>`);
