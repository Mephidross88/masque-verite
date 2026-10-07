/* ---------- État persistant ----------
   Sauvegarde automatique dans localStorage (STORE_KEY) à chaque changement de `store`. Tout nouveau champ persistant
   a une valeur dans defaults() : au chargement, merge() complète une partie enregistrée par une version plus ancienne. */
const STORE_KEY = 'masque-verite-v1';
function defaults(){
  // game : la partie en cours (objets, checks… : remplis aux étapes suivantes, voir SPEC.md > Étapes)
  const game = { items:{}, checks:{} };
  return {
    version:1,
    // Réglages du randomizer de 2Ship (valeurs des options RO_… du spoiler) : étape 1
    settings:{},
    game,
    ui:{ view:'checks', split:'', itemsFolded:false, navFolded:false, theme:'auto' },
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
