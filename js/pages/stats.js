/* ---------- Page Statistiques : chronologie de la partie et temps de jeu ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées). */

const STATS_TPL = paneTpl('stats', `<h1>Statistiques</h1><p class="lede">Chronologie de la partie : objets, masques, chants et checks, à l'heure où ils ont été notés.</p>`, `
      <div class="soon"><span class="soon-ic" v-html="ICONS.stats"></span>
        <p>Avec le temps de jeu et la courbe des checks faits.</p>
        <p class="soon-step">Après l'étape 1</p></div>`);
