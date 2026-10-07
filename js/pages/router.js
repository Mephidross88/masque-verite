/* ---------- Page Routeur : trajet le plus court entre deux endroits ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */

const ROUTER_TPL = paneTpl('router', `<h1>Routeur</h1><p class="lede">Le trajet le plus court entre deux endroits de Termina.</p>`, `
      <div class="soon"><span class="soon-ic" v-html="ICONS.router"></span>
        <p>À pied, par les statues de hibou (Chant de l'envol), en changeant de forme, et au bon moment des trois jours.</p>
        <p class="soon-step">Étape 3 : Routeur</p></div>`);
