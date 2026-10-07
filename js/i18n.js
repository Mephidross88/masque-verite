/* ---------- Langue de l'interface ----------
   Premier fichier de js/ (les suivants peuvent appeler t()). Le français est la langue source ; chaque autre langue est
   un dictionnaire « texte français → traduction » :
   - livrée avec l'appli : un fichier data/i18n/<code>.js chargé avant ce fichier (index.html), qui s'enregistre dans
     window.I18N_LANGS[code] = { name, dict } ;
   - ou ajoutée par l'utilisateur : fichier JSON { code, name, dict } importé dans la Configuration, gardé dans le
     navigateur (localStorage LANGS_KEY), et retirable.
   LANG : langue choisie dans la Configuration (localStorage LANG_KEY ; changer de langue recharge la page), sinon celle
   du navigateur si elle est disponible, sinon le français si le navigateur est en français, sinon l'anglais.
   Repli d'un texte sans traduction : la langue choisie, puis l'anglais, puis le français (texte source).
   - t(texte, paramètres) : texte traduit ; « {nom} » remplacé par paramètres.nom.
   - tn(n, singulier, pluriel, paramètres) : forme selon n (règles de la langue : Intl.PluralRules), puis t() avec {n}.
   - td(texte français, nom anglais) : libellé de données (checks, objets, options…) : traduction du dictionnaire, sinon
     le nom anglais (noms de 2Ship), sinon le français.
   - tpl(gabarit) : gabarit Vue traduit au chargement — textes entre balises, attributs fixes (title, placeholder,
     aria-label, label, alt), et chaînes entre apostrophes des expressions ({{ }}, attributs liés) qui ont une traduction.
     Une traduction n'est jamais du balisage ni du code (langues importées : fichiers de n'importe qui) : échappée selon
     l'endroit (escTplText, escTplExpr) ; seules les entités HTML (&gt;…) passent telles quelles.
   En français, tout est renvoyé tel quel. Textes sans traduction : I18N_MISSING (contrôle : tools/i18n/check.mjs). */
const LANG_KEY = 'masque-verite-lang', LANGS_KEY = 'masque-verite-langs';
// dictionnaire importé : seulement des textes (clé et traduction), sans clé réservée
function i18nCleanDict(d){
  const out = Object.create(null);
  if (d && typeof d === 'object') for (const [k, v] of Object.entries(d)) if (typeof v === 'string' && k !== '__proto__') out[k] = v;
  return out;
}
window.I18N_LANGS = window.I18N_LANGS || {};
// langues importées par l'utilisateur (ne remplacent pas une langue livrée du même code)
(() => {
  try {
    const extra = JSON.parse(localStorage.getItem(LANGS_KEY) || '{}');
    for (const [code, l] of Object.entries(extra))
      if (!I18N_LANGS[code] && l && l.dict) I18N_LANGS[code] = { name:String(l.name || code), dict:i18nCleanDict(l.dict), imported:true };
  } catch (e) {}
})();
const LANGS = [['fr', 'Français'], ...Object.entries(I18N_LANGS).map(([code, l]) => [code, l.name || code])];
const LANG = (() => {
  const has = c => LANGS.some(l => l[0] === c);
  try { const v = localStorage.getItem(LANG_KEY); if (has(v)) return v; } catch (e) {}
  const nav = ((typeof navigator !== 'undefined' && navigator.language) || '').toLowerCase().split('-')[0];
  return has(nav) ? nav : has('en') ? 'en' : 'fr';
})();
if (typeof document !== 'undefined') document.documentElement.lang = LANG;
// dictionnaires consultés, dans l'ordre (vide en français)
const I18N_CHAIN = LANG === 'fr' ? [] : [I18N_LANGS[LANG]?.dict || {}, ...(LANG !== 'en' && I18N_LANGS.en ? [I18N_LANGS.en.dict] : [])];
const I18N = I18N_CHAIN.length ? I18N_CHAIN[0] : null;   // dictionnaire de la langue choisie (null en français)
const I18N_MISSING = new Set();
// traduction d'un texte français, ou undefined (relevé comme manquant dans la langue choisie)
// textes déjà traduits (gabarits : le texte passé à t() y est traduit par tpl avant l'appel) : pas relevés comme manquants
let I18N_VALUES = null;
function i18nGet(s){
  if (!I18N || !s) return undefined;
  if (I18N[s] == null && !(I18N_VALUES ||= new Set(I18N_CHAIN.flatMap(d => Object.values(d)))).has(s)) I18N_MISSING.add(s);
  for (const d of I18N_CHAIN){ const v = d[s]; if (v != null && v !== '') return v; }
  return undefined;
}
function t(s, p){
  const r = i18nGet(s) ?? s;
  return p ? String(r).replace(/\{(\w+)\}/g, (m, k) => k in p ? p[k] : m) : r;
}
const I18N_PLURAL = typeof Intl !== 'undefined' && Intl.PluralRules ? new Intl.PluralRules(LANG) : null;
function tn(n, one, many, p){
  const plural = I18N_PLURAL ? I18N_PLURAL.select(n) !== 'one' : n > 1;
  return t(plural ? many : one, { n, ...(p || {}) });
}
function td(fr, en){
  if (!I18N) return fr;
  const v = I18N[fr];
  return v != null && v !== '' ? v : en || i18nGet(fr) || fr;
}
/* Libellés d'un tableau de données traduits sur place (au chargement, une fois les identifiants calculés) : champs
   « keys » (texte, ou liste de textes) à toute profondeur ; textes sans lettre (nombres…) laissés tels quels. */
const tl = s => typeof s === 'string' && I18N_LETTER.test(s) ? t(s) : s;
function tWalk(o, keys){
  if (!I18N || !o || typeof o !== 'object') return o;
  for (const [k, v] of Object.entries(o)){
    if (keys.includes(k) && typeof v === 'string') o[k] = tl(v);
    else if (keys.includes(k) && Array.isArray(v) && v.every(x => typeof x === 'string')) o[k] = v.map(tl);
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) tWalk(v, keys);
  }
  return o;
}
// changer de langue : gardée à part (lue avant le reste), puis rechargement de la page
function setLang(l){ try { localStorage.setItem(LANG_KEY, l); } catch (e) {} location.reload(); }
/* Langue importée (fichier JSON { code, name, dict }) : gardée dans le navigateur, puis choisie. → message d'erreur ou ''.
   Retirer : seulement une langue importée. */
function importLang(json){
  let l;
  try { l = JSON.parse(json); } catch (e) { return t('Fichier illisible : ce n’est pas un JSON valide.'); }
  const code = String(l?.code || '').toLowerCase();
  if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(code) || !l.dict || typeof l.dict !== 'object' || Array.isArray(l.dict)) return t('Ce fichier n’est pas une traduction (code de langue et dictionnaire attendus).');
  if (code === 'fr' || (I18N_LANGS[code] && !I18N_LANGS[code].imported)) return t('Cette langue est déjà livrée avec l’appli.');
  try {
    const extra = JSON.parse(localStorage.getItem(LANGS_KEY) || '{}');
    extra[code] = { name:String(l.name || code).slice(0, 60), dict:i18nCleanDict(l.dict) };
    localStorage.setItem(LANGS_KEY, JSON.stringify(extra));
  } catch (e) { return t('Impossible de garder cette langue dans le navigateur (place insuffisante ?).'); }
  setLang(code);
  return '';
}
function removeLang(code){
  try { const extra = JSON.parse(localStorage.getItem(LANGS_KEY) || '{}'); delete extra[code]; localStorage.setItem(LANGS_KEY, JSON.stringify(extra)); } catch (e) {}
  // langue affichée retirée : retour à la langue détectée (navigateur)
  if (LANG === code){ try { localStorage.removeItem(LANG_KEY); } catch (e) {} location.reload(); } else setLang(LANG);
}

const I18N_LETTER = /[A-Za-zÀ-ÿŒœ]/;
// traduction placée dans le texte ou un attribut fixe d'un gabarit : caractères de balisage, guillemets et accolades
// (interpolations Vue) en entités ; les entités déjà écrites (&gt;, &#123;…) sont gardées
const escTplText = v => String(v).replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
// traduction placée dans une chaîne entre apostrophes d'une expression (attribut lié ou {{ }}) : rien qui ferme la chaîne,
// l'attribut ou l'interpolation (échappements \x.. de JavaScript)
const escTplExpr = v => String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  .replace(/["{}<>]/g, c => '\\x' + c.charCodeAt(0).toString(16)).replace(/\r?\n|\u2028|\u2029/g, ' ');
function tpl(html){
  if (!I18N) return html;
  // texte (espaces autour gardés) ; seulement s'il a une traduction
  const tr = s => {
    const k = s.trim().replace(/\s+/g, ' ');
    if (!k || !I18N_LETTER.test(k)) return s;
    const v = i18nGet(k);
    if (v == null) return s;
    const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
    return lead + escTplText(v) + tail;
  };
  // chaînes entre apostrophes d'une expression : traduites si un dictionnaire les connaît (les autres sont des clés)
  const trExpr = e => e.replace(/'((?:[^'\\]|\\.)*)'/g, (m, lit) => {
    if (!I18N_LETTER.test(lit)) return m;
    let v; for (const d of I18N_CHAIN){ if (d[lit] != null && d[lit] !== ''){ v = d[lit]; break; } }
    // texte sans traduction relevé (pas les identifiants, clés ni listes de classes : minuscules ASCII, chiffres, - _ : espace)
    if (I18N[lit] == null && !/^[a-z0-9_:.,()%\/#-]*$/.test(lit) && !/^[a-z0-9_ -]*\d/.test(lit) && !/^[a-z0-9_ ,.()-]*[()-]$|[()]/.test(lit) && !/^[A-Z][A-Z0-9_]+$/.test(lit) && !/^[a-z]+[A-Z]\w*$/.test(lit) && !/^[A-Z][0-9 ]*$/.test(lit) && !/^[a-z]+:\w+$/.test(lit)) I18N_MISSING.add(lit);
    return v != null ? "'" + escTplExpr(v) + "'" : m;
  });
  // interpolations et valeurs d'attributs traduites puis mises de côté (leurs « > » et « < » ne sont pas des balises),
  // puis textes entre balises, puis remise en place
  const keep = [], put = s => '\u0001' + (keep.push(s) - 1) + '\u0002';
  let h = html.replace(/\{\{([\s\S]*?)\}\}/g, (m, e) => put('{{' + trExpr(e) + '}}'));
  h = h.replace(/(\s)([:@#]?[\w.:\[\]-]+)="([^"]*)"/g, (m, sp, name, v) =>
    sp + name + '="' + put(/^[:@#]|^v-/.test(name) ? trExpr(v) : I18N_ATTRS.has(name) ? tr(v) : v) + '"');
  h = h.replace(/>([^<>]+)</g, (m, text) => '>' + text.split(/(\u0001\d+\u0002)/).map(p => p[0] === '\u0001' ? p : tr(p)).join('') + '<');
  return h.replace(/\u0001(\d+)\u0002/g, (m, i) => keep[i]);
}
const I18N_ATTRS = new Set(['title', 'placeholder', 'aria-label', 'label', 'alt']);
