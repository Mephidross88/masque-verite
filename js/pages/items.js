/* ---------- Panneau Objets (droite) : objets, masques, équipement, chants, restes, temples, options de mélange ----------
   Script classique (pas de module) chargé avant js/app.js : gabarits en constantes, insérés dans celui d'App, et
   logique de la page en fonction use…(ctx) appelée par le setup d'App (ctx : noms des pages déjà assemblées).
   Rangé comme l'écran de pause du jeu : objets (6 colonnes), masques (6 × 4, transformations en dernière colonne). */

// Temples : carte, boussole, Clé d'Or, âme du boss, petites clés, fées perdues ; dessous, passe-partout et âme de Majora
const DUNGEONS_TPL = `
      <section class="panel-card">
      <div class="dungeon-grid">
        <div v-for="d in DUNGEONS" :key="d.id" class="dungeon-block" :style="{'--dg':d.color}">
          <div class="dg-name">{{d.label}}</div>
          <div class="dg-cells">
            <div class="dg-line">
              <button type="button" class="dg-flag" :class="{on:store.game.dungeons[d.id].map}" title="Carte du Donjon" @click="setDg(d.id,'map',true)" @contextmenu.prevent="setDg(d.id,'map',false)"><img src="icons/dungeons/DungeonMap.png" alt=""></button>
              <button type="button" class="dg-flag" :class="{on:store.game.dungeons[d.id].compass}" title="Boussole" @click="setDg(d.id,'compass',true)" @contextmenu.prevent="setDg(d.id,'compass',false)"><img src="icons/dungeons/Compass.png" alt=""></button>
              <button type="button" class="dg-flag" :class="{on:store.game.dungeons[d.id].bossKey}" title="Clé d’Or" @click="setDg(d.id,'bossKey',true)" @contextmenu.prevent="setDg(d.id,'bossKey',false)"><img src="icons/dungeons/BossKey.png" alt=""></button>
              <button v-if="s.RO_SHUFFLE_BOSS_SOULS" type="button" class="dg-flag" :class="{on:store.game.items[d.soul]}" :title="ITEM_BY_KEY[d.soul].label"
                @click="store.game.items[d.soul]=true" @contextmenu.prevent="store.game.items[d.soul]=false"><img src="icons/dungeons/soulBoss.png" alt=""></button>
            </div>
            <div class="dg-line">
              <button type="button" class="dg-keys" :class="{none:!dgKeys(d), done:dgKeys(d)>=d.keys}"
                :title="t('Petites clés : {n} / {max}', {n:dgKeys(d), max:d.keys}) + (skeletonOn ? ' (' + ITEM_BY_KEY.skeleton_key.label + ')' : '')" @click="addDg(d.id,'keys',1,d.keys)" @contextmenu.prevent="addDg(d.id,'keys',-1,d.keys)">
                <img src="icons/dungeons/SmallKey.png" alt="">{{dgKeys(d)}}/{{d.keys}}</button>
              <button type="button" class="dg-keys" :class="{none:!store.game.dungeons[d.id].fairies, done:store.game.dungeons[d.id].fairies>=fairyGoal}"
                :title="t('Fées perdues : {n} / {max}', {n:store.game.dungeons[d.id].fairies, max:fairyGoal})" @click="addDg(d.id,'fairies',1,15)" @contextmenu.prevent="addDg(d.id,'fairies',-1,15)">
                <img :src="'icons/dungeons/' + d.fairy + '.png'" alt="">{{store.game.dungeons[d.id].fairies}}/{{fairyGoal}}</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="itemVisible(ITEM_BY_KEY.skeleton_key) || s.RO_SHUFFLE_BOSS_SOULS" class="dg-extra">
        <button v-if="itemVisible(ITEM_BY_KEY.skeleton_key)" type="button" class="dg-keys" :class="{none:!skeletonOn, done:skeletonOn}"
          :title="ITEM_BY_KEY.skeleton_key.label" @click="store.game.items.skeleton_key=!skeletonOn" @contextmenu.prevent="store.game.items.skeleton_key=false">
          <img :src="iconSrc(ITEM_BY_KEY.skeleton_key)" alt="">{{ITEM_BY_KEY.skeleton_key.label}}</button>
        <button v-if="s.RO_SHUFFLE_BOSS_SOULS" type="button" class="dg-keys" :class="{none:!store.game.items.soul_boss_majora, done:store.game.items.soul_boss_majora}"
          :title="ITEM_BY_KEY.soul_boss_majora.label" @click="store.game.items.soul_boss_majora=true" @contextmenu.prevent="store.game.items.soul_boss_majora=false">
          <img :src="iconSrc(ITEM_BY_KEY.soul_boss_majora)" alt="">Majora</button>
      </div>
      </section>
`;
// en tête : restes des boss en cercle autour de la Triforce ; équipement (grille, épées reliées) ; puis une carte par
// groupe d'objets visibles (titre, grille de tuiles), sans ceux déjà placés
const ITEMS_TPL = `
      <section class="panel-card">
      <div class="quest-row">
        <div class="quest-ring">
          <div v-for="(k,i) in ITEMS_PAGE.quest.ring" :key="k" :class="'ring-node ring-' + (i+1)"><item-tile :k="k"></item-tile></div>
          <div v-if="itemVisible(ITEM_BY_KEY[ITEMS_PAGE.quest.center])" class="hex-center"><item-tile :k="ITEMS_PAGE.quest.center"></item-tile></div>
        </div>
      </div>
      </section>
      <section class="panel-card">
      <div class="equip-wrap">
        <div class="equip-grid">
          <div v-for="(row,ri) in ITEMS_PAGE.equipment" :key="ri" class="equip-line">
            <template v-for="(c,ci) in row" :key="ci">
              <span v-if="ci" class="eq-gap" :class="{link:c.stage > 1 && row[ci-1].k === c.k}"></span>
              <item-tile :k="c.k" :stage="c.stage"></item-tile>
            </template>
          </div>
        </div>
        <template v-if="timeCells">
          <span class="equip-sep"></span>
          <div class="equip-grid" :class="{'time-linked':timeCells.linked}">
            <svg v-if="timeCells.linked" class="time-path" viewBox="0 0 110 164" aria-hidden="true"><polyline points="24,24 86,24 24,82 86,82 24,140 86,140"></polyline></svg>
            <div v-for="(row,ri) in timeCells.rows" :key="ri" class="equip-line">
              <template v-for="(c,ci) in row" :key="ci">
                <span v-if="ci" class="eq-gap"></span>
                <span class="tile-bg"><item-tile :k="c.k" :stage="c.stage" :icon="c.icon" :label="c.label"></item-tile></span>
              </template>
            </div>
          </div>
        </template>
      </div>
      </section>
      <section v-for="g in itemCards" :key="g.id" class="panel-card" :class="'ig-' + g.id">
        <div v-if="!g.big && !g.boxes" class="ip-title">{{g.title}}</div>
        <template v-if="g.boxes">
          <div v-for="(row,ri) in g.boxes" :key="ri" class="box-row">
            <div v-for="(box,bi) in row" :key="bi" class="item-box">
              <div class="oc-row">
                <div class="icon-grid" :class="{cols2:box.cols === 2, free:box.big, small:box.small}">
                  <item-tile v-for="k in box.items" :key="k" :k="k" :class="{big:k === box.big}"></item-tile></div>
                <div v-if="box.pad && itemVisible(ITEM_BY_KEY.ocarina_button_a)" class="oc-pad">
                  <div class="oc-c"><item-tile v-for="b in ['c_up', 'c_left', 'a', 'c_right', 'c_down']" :key="b" :k="'ocarina_button_' + b" :class="'oc-' + b"></item-tile></div>
                </div>
              </div>
              <template v-if="box.sub">
                <div class="sub-link"></div>
                <div class="icon-grid sub"><item-tile v-for="k in box.sub" :key="k" :k="k"></item-tile></div>
              </template>
            </div>
          </div>
        </template>
        <template v-if="g.big">
          <div class="mask-big">
            <template v-for="(k,i) in g.big" :key="k"><span v-if="i" class="eq-gap link"></span><item-tile :k="k"></item-tile></template>
          </div>
          <div class="mask-sep"></div>
        </template>
        <div v-if="!g.boxes" class="tile-grid" :class="{'mask-grid':g.big}" :style="{'--cols':g.cols}">
          <item-tile v-for="it in g.items" :key="it.key" :k="it.key"></item-tile>
        </div>
      </section>
      <section v-if="itemLists.length" class="panel-card list-card">
        <button v-for="l in itemLists" :key="l.id" type="button" class="check-tile" :class="{none:!l.got, done:l.got >= l.total}" :title="l.title"
          @click="modal = 'list-' + l.id"><img :src="'icons/' + l.icon" alt=""><span>{{l.title}}</span><b>{{l.got}}/{{l.total}}</b></button>
      </section>
      <!-- à part (fourre-tout), en 2 colonnes : fée perdue de Bourg-Clocher, Nage (si mélangée) ; jetons des Maisons des
           Araignées (si mélangés) ; grenouilles du chœur, sur toute la largeur -->
      <section class="panel-card list-card grid2">
        <button type="button" class="check-tile" :class="{none:!store.game.townFairy, done:store.game.townFairy}" title="Fée perdue de Bourg-Clocher"
          @click="store.game.townFairy=true" @contextmenu.prevent="store.game.townFairy=false"><img src="icons/others/StrayFairyClockTown.png" alt=""><span>Bourg-Clocher</span></button>
        <button v-if="itemVisible(ITEM_BY_KEY.ability_swim)" type="button" class="check-tile" :class="{none:!store.game.items.ability_swim, done:store.game.items.ability_swim}"
          :title="ITEM_BY_KEY.ability_swim.label" @click="store.game.items.ability_swim=!store.game.items.ability_swim" @contextmenu.prevent="store.game.items.ability_swim=false">
          <img :src="iconSrc(ITEM_BY_KEY.ability_swim)" alt=""><span>{{ITEM_BY_KEY.ability_swim.label}}</span></button>
        <button v-for="h in SPIDER_HOUSES" :key="h.id" v-show="s.RO_SHUFFLE_GOLD_SKULLTULAS" type="button" class="check-tile"
          :class="{none:!store.game.tokens[h.id], done:store.game.tokens[h.id]>=s.RO_SKULLTULA_TOKENS_REQUIRED}"
          :title="t('{house} : {n} / {max} jetons', {house:h.label, n:store.game.tokens[h.id], max:s.RO_SKULLTULA_TOKENS_REQUIRED})"
          @click="addTokens(h.id,1)" @contextmenu.prevent="addTokens(h.id,-1)"><img :src="'icons/' + h.icon" alt=""><span>{{h.short}}</span><b>{{store.game.tokens[h.id]}}/{{s.RO_SKULLTULA_TOKENS_REQUIRED}}</b></button>
        <div class="frog-row"><item-tile v-for="k in ITEMS_PAGE.frogs" :key="k" :k="k"></item-tile></div>
      </section>
`;
// fenêtre d'une liste à cocher du panneau (statues de hibou, âmes des ennemis) : une ligne par objet, icône, nom, coche
const ITEM_LIST_TPL = `
      <template v-else-if="listModal">
        <header><h3>{{listModal.title}} · {{listModal.got}}/{{listModal.total}}</h3><button @click="modal=null" aria-label="Fermer" v-html="ICONS.close"></button></header>
        <div class="body">
          <div class="check-list by-col" :style="{'--rows':Math.ceil(listModal.items.length / 2)}">
            <button v-for="it in listModal.items" :key="it.key" type="button" class="check-row" :class="{on:store.game.items[it.key]}"
              @click="store.game.items[it.key]=!store.game.items[it.key]" @contextmenu.prevent="store.game.items[it.key]=false">
              <img v-if="!brokenIcons[iconSrc(it)]" class="cr-icon" :src="iconSrc(it)" alt="" @error="brokenIcons[iconSrc(it)]=true">
              <span class="cr-label" :title="it.label">{{listLabel(it.label)}}</span><span class="cr-mark" v-html="store.game.items[it.key]?ICONS.check:ICONS.circleO"></span>
            </button>
          </div>
        </div>
      </template>
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
  const s = store.settings, { modal } = ctx;
  // colonnes par groupe (écran de pause : 6 ; chants : 7 ; listes de mélange : 5)
  const COLS = { items:6, trade:5, masks:5, equipment:6, songs:7, remains:5, abilities:6, owls:5, souls:5, enemySouls:9 };
  /* masques : les masques de transformation à part, en grand (big) ; objets, musique (carte des chants) et échanges : en
     cadres (boxes, sans les cases non visibles) ; ces cartes remontées juste sous l'équipement, dans cet ordre, sans titre */
  const BIG = { masks:ITEMS_PAGE.masks.big }, BOXES = { items:ITEMS_PAGE.boxRows, songs:ITEMS_PAGE.songRows, trade:ITEMS_PAGE.tradeRows },
    FIRST = ['masks', 'items', 'songs', 'trade'];
  const rank = id => { const i = FIRST.indexOf(id); return i < 0 ? FIRST.length : i; };
  const seen = k => itemVisible(ITEM_BY_KEY[k]);
  const visibleBoxes = rows => rows.map(row => row.map(b => ({ ...b, items:b.items.filter(seen), sub:b.sub && b.sub.filter(seen) }))
    .filter(b => b.items.length)).filter(row => row.length);
  const itemCards = computed(() => [...ITEM_GROUPS].sort((a, b) => rank(a.id) - rank(b.id))
    .map(g => ({ ...g, cols:COLS[g.id] || 6, big:BIG[g.id] || null, boxes:BOXES[g.id] ? visibleBoxes(BOXES[g.id]) : null,
      items:g.items.filter(it => itemVisible(it) && !ITEMS_PLACED.has(it.key) && !(BIG[g.id] || []).includes(it.key)) }))
    .filter(g => g.items.length || g.boxes));
  // passe-partout : toutes les petites clés de chaque temple (affichage ; le compteur noté est gardé)
  const skeletonOn = computed(() => !!store.game.items.skeleton_key && itemVisible(ITEM_BY_KEY.skeleton_key));
  const dgKeys = d => skeletonOn.value ? Math.max(store.game.dungeons[d.id].keys, d.keys) : store.game.dungeons[d.id].keys;
  // fées perdues demandées par la Grande Fée de chaque temple
  const fairyGoal = computed(() => s.RO_STRAY_FAIRIES_REQUIRED);
  const setDg = (id, f, v) => { store.game.dungeons[id][f] = v; };
  const addDg = (id, f, n, max) => { const d = store.game.dungeons[id]; d[f] = Math.max(0, Math.min(max, d[f] + n)); };
  const addTokens = (id, n) => { store.game.tokens[id] = Math.max(0, Math.min(30, store.game.tokens[id] + n)); };
  /* demi-journées (temps mélangé), deux par ligne : au hasard, un objet chacune (jour 1 en haut à gauche) ; progressif,
     les paliers du compteur dans l'ordre d'obtention, reliés par un trait (dans l'ordre : jour 1 → nuit 3 ; à rebours :
     nuit 3 → jour 1) ; temps non mélangé : rien. → { rows, linked } */
  const timeCells = computed(() => {
    if (!s.RO_CLOCK_SHUFFLE) return null;
    const mode = s.RO_CLOCK_SHUFFLE_PROGRESSIVE, prog = mode !== RO.RO_CLOCK_SHUFFLE_RANDOM, desc = mode === RO.RO_CLOCK_SHUFFLE_DESCENDING;
    const cells = (desc ? [...TIME_HALVES].reverse() : TIME_HALVES).map((h, i) => {
      const it = ITEM_BY_KEY['time_' + h];
      return prog ? { k:'time_progressive', stage:i + 1, icon:it.icon, label:it.label } : { k:it.key, stage:0, icon:'', label:'' };
    });
    return { rows:[0, 2, 4].map(i => cells.slice(i, i + 2)), linked:prog };
  });
  // nom dans la liste, sans ce que le titre dit déjà : « Statue de hibou (Route du Lait) » → « Route du Lait », « Âme : Wolfos »
  // (« Soul of Wolfos ») → « Wolfos »
  const listLabel = l => l.replace(/^[^(]*\(([^)]*)\)$/, '$1').replace(/^[^:]*:\s*/, '').replace(/^Soul of /, '');
  /* listes à cocher (statues de hibou, âmes des ennemis) : bouton avec compteur, fenêtre (modal 'list-<groupe>') ; sort :
     par ordre alphabétique des noms affichés, dans la langue de l'interface (sinon, l'ordre du groupe) */
  const listOf = id => {
    const g = ITEM_GROUPS.find(x => x.id === id), l = ITEMS_PAGE.lists.find(x => x.id === id), items = g.items.filter(itemVisible);
    if (l.sort) items.sort((a, b) => listLabel(a.label).localeCompare(listLabel(b.label), LANG, { sensitivity:'base' }));
    return { id, title:g.title, icon:l.icon, items, got:items.filter(it => store.game.items[it.key]).length, total:items.length };
  };
  const itemLists = computed(() => ITEMS_PAGE.lists.map(l => listOf(l.id)).filter(l => l.total));
  const listModal = computed(() => String(modal.value).startsWith('list-') ? listOf(modal.value.slice(5)) : null);
  return { itemCards, fairyGoal, setDg, addDg, addTokens, ITEMS_PAGE, itemVisible, timeCells, itemLists, listModal, listLabel, iconSrc, skeletonOn, dgKeys };
}
