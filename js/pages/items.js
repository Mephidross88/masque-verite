/* ---------- Panneau Objets (droite) : objets, masques, équipement, chants, restes, temples, options de mélange ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Rangé comme l'écran de pause du jeu : objets (6 colonnes), masques (6 × 4, transformations en dernière colonne). */

// Temples : carte, boussole, Clé d'Or, petites clés, fées perdues ; puis fée de Bourg-Clocher et Maisons des Araignées
const DUNGEONS_TPL = `
      <section class="panel-card">
      <div class="dungeon-grid">
        <div v-for="d in DUNGEONS" :key="d.id" class="dungeon-block" :style="{'--dg':d.color}">
          <div class="dg-name">{{d.label}}</div>
          <div class="dg-cells">
            <div class="dg-line">
              <button type="button" class="dg-flag" :class="{on:store.game.dungeons[d.id].map}" title="Carte du Donjon" @click="setDg(d.id,'map',true)" @contextmenu.prevent="setDg(d.id,'map',false)" v-html="ICONS.map"></button>
              <button type="button" class="dg-flag" :class="{on:store.game.dungeons[d.id].compass}" title="Boussole" @click="setDg(d.id,'compass',true)" @contextmenu.prevent="setDg(d.id,'compass',false)" v-html="ICONS.compass"></button>
              <button type="button" class="dg-flag dg-txt" :class="{on:store.game.dungeons[d.id].bossKey}" title="Clé d’Or" @click="setDg(d.id,'bossKey',true)" @contextmenu.prevent="setDg(d.id,'bossKey',false)">CO</button>
            </div>
            <div class="dg-line">
              <button type="button" class="dg-keys" :class="{none:!store.game.dungeons[d.id].keys, done:store.game.dungeons[d.id].keys>=d.keys}"
                :title="t('Petites clés : {n} / {max}', {n:store.game.dungeons[d.id].keys, max:d.keys})" @click="addDg(d.id,'keys',1,d.keys)" @contextmenu.prevent="addDg(d.id,'keys',-1,d.keys)">
                <span class="dg-k">PC</span>{{store.game.dungeons[d.id].keys}}/{{d.keys}}</button>
              <button type="button" class="dg-keys" :class="{none:!store.game.dungeons[d.id].fairies, done:store.game.dungeons[d.id].fairies>=fairyGoal}"
                :title="t('Fées perdues : {n} / {max}', {n:store.game.dungeons[d.id].fairies, max:fairyGoal})" @click="addDg(d.id,'fairies',1,15)" @contextmenu.prevent="addDg(d.id,'fairies',-1,15)">
                <span class="dg-k" v-html="CI.fairy"></span>{{store.game.dungeons[d.id].fairies}}/{{fairyGoal}}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="dg-extra">
        <button type="button" class="dg-keys" :class="{none:!store.game.townFairy, done:store.game.townFairy}" title="Fée perdue de Bourg-Clocher"
          @click="store.game.townFairy=true" @contextmenu.prevent="store.game.townFairy=false"><span class="dg-k" v-html="CI.fairy"></span>Bourg-Clocher</button>
        <button v-for="h in SPIDER_HOUSES" :key="h.id" v-show="s.RO_SHUFFLE_GOLD_SKULLTULAS" type="button" class="dg-keys"
          :class="{none:!store.game.tokens[h.id], done:store.game.tokens[h.id]>=s.RO_SKULLTULA_TOKENS_REQUIRED}"
          :title="t('{house} : {n} / {max} jetons', {house:h.label, n:store.game.tokens[h.id], max:s.RO_SKULLTULA_TOKENS_REQUIRED})"
          @click="addTokens(h.id,1)" @contextmenu.prevent="addTokens(h.id,-1)"><span class="dg-k" v-html="CI.skull"></span>{{store.game.tokens[h.id]}}/{{s.RO_SKULLTULA_TOKENS_REQUIRED}}</button>
      </div>
      </section>
`;
// une carte par groupe d'objets visibles (titre, grille de tuiles)
const ITEMS_TPL = `
      <section v-for="g in itemCards" :key="g.id" class="panel-card" :class="'ig-' + g.id">
        <div class="ip-title">{{g.title}}</div>
        <div class="tile-grid" :style="{'--cols':g.cols}">
          <item-tile v-for="it in g.items" :key="it.key" :k="it.key"></item-tile>
        </div>
      </section>
`;
const ITEMS_PANEL_TPL = `
  <aside class="side side-right" :class="{open:itemsOpen}">
    <button type="button" class="items-fold" :class="{folded:ui.itemsFolded || itemsDrawer}" @click="itemsDrawer ? itemsOpen = true : ui.itemsFolded = !ui.itemsFolded"
      :title="ui.itemsFolded || itemsDrawer ? 'Afficher le panneau Objets' : 'Replier le panneau Objets'" :aria-expanded="itemsDrawer ? itemsOpen : !ui.itemsFolded">
      <span v-html="ui.itemsFolded || itemsDrawer ? ICONS.bag : ICONS.chevron"></span><span v-if="ui.itemsFolded || itemsDrawer" class="if-label">Objets</span></button>
    <div class="side-right-head">
      <button @click="itemsOpen=false" aria-label="Fermer" v-html="ICONS.close"></button>
    </div>
    <div class="side-right-body">
${ITEMS_TPL}${DUNGEONS_TPL}    </div>
  </aside>
`;

function useItemsPanel(ctx){
  const s = store.settings;
  // colonnes par groupe (écran de pause : 6 ; chants : 7 ; listes de mélange : 5)
  const COLS = { items:6, trade:5, masks:6, equipment:6, songs:7, remains:5, abilities:6, owls:5, souls:5, enemySouls:9 };
  const itemCards = computed(() => ITEM_GROUPS.map(g => ({ ...g, cols:COLS[g.id] || 6, items:g.items.filter(itemVisible) })).filter(g => g.items.length));
  // fées perdues demandées par la Grande Fée de chaque temple
  const fairyGoal = computed(() => s.RO_STRAY_FAIRIES_REQUIRED);
  const setDg = (id, f, v) => { store.game.dungeons[id][f] = v; };
  const addDg = (id, f, n, max) => { const d = store.game.dungeons[id]; d[f] = Math.max(0, Math.min(max, d[f] + n)); };
  const addTokens = (id, n) => { store.game.tokens[id] = Math.max(0, Math.min(30, store.game.tokens[id] + n)); };
  return { itemCards, fairyGoal, setDg, addDg, addTokens };
}
