/* ---------- État persistant ----------
   Sauvegarde automatique dans localStorage (STORE_KEY) à chaque changement de `store`. Tout nouveau champ persistant
   a une valeur dans defaults() : au chargement, merge() complète une partie enregistrée par une version plus ancienne. */
const STORE_KEY = 'masque-verite-v1';
function defaults(){
  // game : la partie en cours — objets du panneau (items : clé → oui/non ou nombre), temples (carte, boussole, petites
  // clés, Clé d'Or, fées perdues), fée perdue de Bourg-Clocher, jetons de Skulltula d'or par maison, checks faits
  // { RC: true }, seed (d'après le spoiler importé : inputSeed, finalSeed, fichier, commit de 2Ship),
  // timeline (chronologie, page Statistiques : objets du panneau et checks { t: heure réelle (ms) ou null (avant le suivi),
  // p: temps de jeu de 2Ship (ms) ou null, c: [demi-journée, heure du jeu] de la sauvegarde ou null, k: items | checks, id, v })
  const game = { items:{}, dungeons:{}, townFairy:false, tokens:{ swamp:0, ocean:0 }, checks:{},
    seed:{ input:'', final:0, file:'', commit:'' }, timeline:[],
    prices:{},   // prices : prix connus des boutiques et cartes de Tingle mélangées { RC: rubis } (la logique les compare à la bourse)
    found:{},    // found : objet trouvé dans chaque check fait, d'après la sauvegarde de 2Ship { RC: RI } (auto-tracking)
    playtime:0, playtimeAt:0,   // temps de jeu de 2Ship à la dernière sauvegarde lue (ms) et heure réelle où il a été lu
    cycle:{},    // cycle : moment de la dernière sauvegarde lue { half (demi-journée, -1 : avant le jour 1), time, hours } (stream)
    hints:{} };  // hints : indices lus { id de l'indice : true } (page Indices : leur texte n'apparaît qu'une fois lus)
  ITEM_GROUPS.forEach(g => g.items.forEach(it => { game.items[it.key] = it.kind === 'bool' ? false : 0; }));
  DUNGEONS.forEach(d => { game.dungeons[d.id] = { map:false, compass:false, bossKey:false, keys:0, fairies:0 }; });
  return {
    version:1,
    // Réglages du randomizer de 2Ship : une valeur par option RO_… (nombres de 2Ship, défauts d'Options.cpp) ;
    // pool : checks de la seed d'après le spoiler importé { RC: 1 } (vide : règles de checkShuffled) ;
    // excluded : checks exclus à la main { RC: true }
    settings:{ ...OPT_DEFAULT, pool:{}, excluded:{} },
    game,
    ui:{ view:'checks', split:'', itemsFolded:false, navFolded:false, theme:'auto', configTab:'logic',
      // link : auto-tracking par la sauvegarde de 2Ship (js/link.js) — suivi activé, emplacement suivi ('' : le plus récent,
      // sinon 'file1.json'…), moment repris de la sauvegarde
      link:{ enabled:false, slot:'', moment:true },
      // map : lieu affiché sur la page Carte, checks affichés (filters : comme la page Checks, all : tous ceux de la seed,
      // off : aucun), outil de placement des checks affiché
      map:{ scene:'SCENE_CLOCKTOWER', checks:'filters', editTool:false },
      // notebook : page Journal des Bombers (recherche, masquer les faits, aussi les checks sans horaire, regroupement
      // par scène et scènes repliées { scène: true })
      notebook:{ q:'', hideDone:false, all:false, byScene:true, collapsed:{} },
      // moment : demi-journée choisie (-1 : tous ; 0 à 5 : J1, N1, J2, N2, J3, N3), partagée par Checks et le Journal ;
      // onlyAvailable : seulement les faisables
      checks:{ q:'', hideDone:false, hideDoneZones:false, showExcluded:false, onlyAvailable:false, moment:-1, hiddenCats:{}, collapsed:{} } },
  };
}
function merge(base, src){
  if (!src || typeof src !== 'object' || Array.isArray(src)) return base;
  for (const k of Object.keys(base)){
    if (!(k in src)) continue;
    const b = base[k], v = src[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && Object.keys(b).length) base[k] = merge(b, v);
    else if (b && typeof b === 'object' && !Array.isArray(b)) base[k] = (v && typeof v === 'object') ? { ...v } : b;
    else if (typeof v === typeof b) base[k] = v;
  }
  return base;
}
function load(){
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return merge(defaults(), JSON.parse(raw)); } catch (e) {}
  return defaults();
}

const store = reactive(load());
// Fenêtre de stream (index.html?stream, js/stream.js) : la partie vient de la fenêtre principale (événement « storage » à
// chaque sauvegarde de celle-ci) ; elle ne sauvegarde rien elle-même, ne date rien et ne suit pas la sauvegarde du jeu.
const STREAM_MODE = typeof location !== 'undefined' && /[?&]stream(&|=|$)/.test(location.search);
if (STREAM_MODE) window.addEventListener('storage', ev => {
  if (ev.key !== STORE_KEY || !ev.newValue) return;
  try { const fresh = merge(defaults(), JSON.parse(ev.newValue)); for (const k of Object.keys(fresh)) store[k] = fresh[k]; } catch (e) {}
});

/* Objets de la seed (sauvegarde suivie ou spoiler importé), gardés à part de la partie (localStorage masque-verite-seed,
   jamais affichés tels quels) : la page Indices en calcule le texte de chaque indice, montré seulement une fois lu.
   { seed (finalSeed), items:{ RC: RI } (checks mélangés) } */
const SEED_KEY = 'masque-verite-seed';
const seedItems = Vue.shallowRef((() => { try { return JSON.parse(localStorage.getItem(SEED_KEY)) || null; } catch (e) { return null; } })());
function setSeedItems(seed, items){
  if (seedItems.value && seedItems.value.seed === seed && JSON.stringify(seedItems.value.items) === JSON.stringify(items)) return;
  seedItems.value = { seed, items };
  try { localStorage.setItem(SEED_KEY, JSON.stringify(seedItems.value)); } catch (e) {}
}
/* Chronologie (page Statistiques) : chaque hausse d'un objet du panneau et chaque check coché est daté (game.timeline) ;
   une baisse ou un check décoché retire ses entrées. Observateur synchrone. Variables posées par l'auto-tracking autour
   de son report : timelinePlay (temps de jeu de la sauvegarde), timelineAt (moment du cycle), timelineQuiet (première
   lecture : ce que la sauvegarde contenait déjà, sans date) ; timelineSkip : ajustements (objets de départ), pas notés.
   Hors auto-tracking, temps de jeu estimé : celui de la dernière sauvegarde plus le temps écoulé depuis (10 min au plus). */
let timelineQuiet = false, timelineSkip = false, timelinePlay = null, timelineAt = null;
const num01 = v => typeof v === 'boolean' ? +v : v || 0;
function timelineSnap(g){ return { game:g, items:{ ...g.items }, checks:{ ...g.checks } }; }
if (!STREAM_MODE){
  let snap = timelineSnap(store.game);
  // (la partie elle-même n'est pas observée en profondeur : la chronologie en fait partie)
  watch(() => [store.game.items, store.game.checks], () => {
    const g = store.game;
    if (snap.game !== g || timelineSkip){ snap = timelineSnap(g); return; }   // partie remplacée (remise à zéro, import), ajustement
    if (!Array.isArray(g.timeline)) g.timeline = [];
    const now = Date.now(), live = link.status === 'on' && g.playtimeAt && now - g.playtimeAt < 600000;
    const e0 = timelineQuiet ? { t:null, p:null, c:null }
      : { t:now, p:timelinePlay ?? (live ? g.playtime + now - g.playtimeAt : null), c:timelineAt };
    const tl = g.timeline;
    for (const [k, v] of Object.entries(g.items)){
      const a = num01(snap.items[k]), b = num01(v);
      if (b > a) tl.push({ ...e0, k:'items', id:k, v:b });
      else if (b < a) g.timeline = tl.filter(e => !(e.k === 'items' && e.id === k && e.v > b));
    }
    for (const id of Object.keys(g.checks)) if (!snap.checks[id]) g.timeline.push({ ...e0, k:'checks', id });
    for (const id of Object.keys(snap.checks)) if (!g.checks[id]) g.timeline = g.timeline.filter(e => !(e.k === 'checks' && e.id === id));
    snap = timelineSnap(g);
  }, { deep:true, flush:'sync' });
}

const lastSaved = ref(null);
// échec de l'enregistrement (place insuffisante, navigation privée…) : signalé dans le panneau de gauche
const saveError = ref(false);
if (!STREAM_MODE) watch(store, () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); lastSaved.value = new Date(); saveError.value = false; }
  catch (e){ if (!saveError.value) console.error('Partie non enregistrée :', e); saveError.value = true; }
}, { deep:true });
