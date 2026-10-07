/* ---------- Page Indices : pierres à potins et autres indices ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */

const HINTS_TPL = paneTpl('hints', `<h1>Indices</h1><p class="lede">Ce que disent les pierres à potins et les autres indices de la seed.</p>`, `
      <div class="soon"><span class="soon-ic" v-html="ICONS.hint"></span>
        <p>Pierres à potins (lues avec le Masque de Vérité), indices de la banque, des restes de boss, du Chant de Saria…</p>
        <p class="soon-step">Après l'étape 2</p></div>`);
