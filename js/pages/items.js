/* ---------- Panneau Objets (droite) : masques, formes, chants, objets, fées errantes, restes de boss ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */

const ITEMS_PANEL_TPL = `
  <aside class="side side-right" :class="{open:itemsOpen}">
    <button type="button" class="items-fold" :class="{folded:ui.itemsFolded || itemsDrawer}" @click="itemsDrawer ? itemsOpen = true : ui.itemsFolded = !ui.itemsFolded"
      :title="ui.itemsFolded || itemsDrawer ? 'Afficher le panneau Objets' : 'Replier le panneau Objets'" :aria-expanded="itemsDrawer ? itemsOpen : !ui.itemsFolded">
      <span v-html="ui.itemsFolded || itemsDrawer ? ICONS.bag : ICONS.chevron"></span><span v-if="ui.itemsFolded || itemsDrawer" class="if-label">Objets</span></button>
    <div class="side-right-head">
      <button @click="itemsOpen=false" aria-label="Fermer" v-html="ICONS.close"></button>
    </div>
    <div class="side-right-body">
      <div class="soon soon-side"><span class="soon-ic" v-html="ICONS.bag"></span>
        <p>Objets, masques et formes, chants, fées errantes, restes de boss et clés de donjon, à noter d'un clic.</p>
        <p class="soon-step">Étape 1 : données de 2Ship</p></div>
    </div>
  </aside>
`;
