/* ---------- État persistant ----------
   Sauvegarde automatique dans localStorage (STORE_KEY) à chaque changement de `store`. Tout nouveau champ persistant
   a une valeur dans defaults() : au chargement, merge() complète une partie enregistrée par une version plus ancienne. */
const STORE_KEY = 'masque-verite-v1';
function defaults(){
  // game : la partie en cours — objets du panneau (items : clé → oui/non ou nombre), temples (carte, boussole, petites
  // clés, Clé d'Or, fées perdues), fée perdue de Bourg-Clocher, jetons de Skulltula d'or par maison, checks faits
  // { RC: true }, seed (d'après le spoiler importé : inputSeed, finalSeed, fichier, commit de 2Ship),
  // timeline (chronologie, page Statistiques : à venir)
  const game = { items:{}, dungeons:{}, townFairy:false, tokens:{ swamp:0, ocean:0 }, checks:{},
    seed:{ input:'', final:0, file:'', commit:'' }, timeline:[],
    prices:{},   // prices : prix connus des boutiques et cartes de Tingle mélangées { RC: rubis } (la logique les compare à la bourse)
    found:{} };  // found : objet trouvé dans chaque check fait, d'après la sauvegarde de 2Ship { RC: RI } (auto-tracking)
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
const lastSaved = ref(null);
// échec de l'enregistrement (place insuffisante, navigation privée…) : signalé dans le panneau de gauche
const saveError = ref(false);
watch(store, () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); lastSaved.value = new Date(); saveError.value = false; }
  catch (e){ if (!saveError.value) console.error('Partie non enregistrée :', e); saveError.value = true; }
}, { deep:true });
