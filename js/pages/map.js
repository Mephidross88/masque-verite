/* ---------- Page Carte : chaque zone vue de dessus ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */

const MAP_TPL = paneTpl('map', `<h1>Carte</h1><p class="lede">Chaque zone de Termina vue de dessus.</p>`, `
      <div class="soon"><span class="soon-ic" v-html="ICONS.map"></span>
        <p>Sorties, checks et statues de hibou à leur place, fabriqués dans le navigateur depuis votre ROM de Majora's Mask.</p>
        <p class="soon-step">Étape 4 : Carte</p></div>`);
