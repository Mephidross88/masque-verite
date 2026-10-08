// Contrôle des traductions (data/i18n/<code>.js) : textes de l'interface sans traduction, et traductions qui ne servent
// plus ; modèle de traduction pour une nouvelle langue. Sources lues sans être exécutées :
//  - gabarits (chaînes `…` contenant des balises) de js/*.js et js/pages/*.js, passés au traducteur tpl() de js/i18n.js ;
//  - appels t('…'), tn(n, '…', '…') et td('…', …) de ces fichiers ;
//  - libellés des données traduits à l'exécution (DYNAMIC ci-dessous : fichiers chargés dans un bac à sable).
// Usage :
//   node tools/i18n/check.mjs [--lang=en] [--missing] [--unused] [--js] [--strict]
//       résumé + textes sans traduction + traductions inutilisées ; --js : les manquants au format du dictionnaire
//   node tools/i18n/check.mjs --template=de [--name=Deutsch] [--data]
//       modèle de traduction (JSON { code, name, dict }) à remplir puis importer dans la Configuration, ou à convertir
//       en data/i18n/<code>.js : chaque texte français, valeur vide ; « _en » : la traduction anglaise en référence.
//       --data : aussi les libellés des données (sinon : noms anglais de 2Ship)
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const opt = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([\w-]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const LANG = opt.template ? 'en' : opt.lang || 'en';

// bac à sable : dictionnaires livrés, puis js/i18n.js dans la langue contrôlée
const ctx = { console, localStorage:{ getItem:k => k === 'masque-verite-lang' ? LANG : null, setItem(){} }, navigator:{ language:LANG }, location:{ reload(){} }, Intl };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ROOT, 'data/i18n')).filter(f => f.endsWith('.js'))) vm.runInContext(read('data/i18n/' + f), ctx);
vm.runInContext(read('js/i18n.js') + '\n;globalThis.__i = { tpl, I18N_MISSING };', ctx);
const DICT = ctx.I18N_LANGS[LANG]?.dict || {}, EN = ctx.I18N_LANGS.en?.dict || {};
const { tpl, I18N_MISSING } = ctx.__i;
const ui = new Set(), data = new Set();

// 1. gabarits et appels t() / tn() / td() des fichiers js/
const lit = s => s.replace(/\\'/g, "'");
for (const f of ['js', 'js/pages'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f))){
  const src = read(f);
  for (const m of src.matchAll(/`([^`]*)`/g)){
    const body = m[1].replace(/\$\{[^}]*\}/g, ' ');
    if (!/<[a-z]/i.test(body)) continue;
    I18N_MISSING.clear();
    tpl(body);
    for (const k of I18N_MISSING) ui.add(k);
    const flat = body.replace(/\s+/g, ' ');   // textes sur plusieurs lignes : espaces réduits, comme tpl()
    for (const k of Object.keys(DICT)) if (flat.includes(k)) ui.add(k);
  }
  for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) ui.add(lit(m[1]));
  for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) ui.add(m[1]);
  for (const m of src.matchAll(/\btn\([^,]+,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'/g)){ ui.add(lit(m[1])); ui.add(lit(m[2])); }
  for (const m of src.matchAll(/\btd\(\s*'((?:[^'\\]|\\.)*)'/g)) data.add(lit(m[1]));
}

// 2. libellés des données, traduits au chargement (tWalk, tl, td) : relevés en français dans un second bac à sable.
//    'ui' : à traduire (dictionnaire) ; 'data' : nom anglais de 2Ship en repli (scènes, checks, objets).
{
  const fr = { console, localStorage:{ getItem:() => 'fr', setItem(){} }, navigator:{ language:'fr' }, location:{ reload(){} }, Intl,
    Vue:{ createApp(){}, reactive:x => x, computed:f => ({ get value(){ return f(); } }), watch(){}, ref:v => ({ value:v }), nextTick(){} } };
  fr.window = fr;
  vm.createContext(fr);
  try {
    for (const f of ['data/checks-data.js', 'js/i18n.js', 'js/icons.js', 'js/config.js', 'js/checks.js', 'js/items.js'])
      vm.runInContext(read(f), fr, { filename:f });
    const run = e => vm.runInContext(e, fr);
    const letters = s => /[A-Za-zÀ-ÿŒœ]/.test(s);
    const add = (set, list) => list.filter(s => typeof s === 'string' && letters(s)).forEach(s => set.add(s));
    const D = run('CHECKS_DATA'), dataFr = new Set([...D.scenes, ...D.checks, ...D.items].map(x => x.fr));
    add(ui, run('CONFIG_TABS').flatMap(tab => [tab.label, ...tab.cards.map(c => c[1])]));
    add(ui, run('SETTINGS_DEF').flatMap(d => [d.label, d.tip, ...(d.choices || []).map(c => c[1])]));
    add(ui, run('CHECK_CATS').map(c => c.label));
    add(ui, run('ITEM_GROUPS').flatMap(g => [g.title, ...g.items.flatMap(it => [it.label, ...(it.stages || [])])]).filter(s => !dataFr.has(s)));
    add(ui, run('DUNGEONS').map(d => d.label));
    add(data, [...dataFr]);
  } catch (e){ console.warn('données : ' + e.message); }
}

const byFr = (a, b) => a.localeCompare(b, 'fr');
if (opt.template){
  const keys = [...ui, ...(opt.data ? data : [])].sort(byFr);
  const dict = {};
  for (const k of keys){ dict[k] = ''; if (EN[k]) dict['_en ' + k] = EN[k]; }
  console.log(JSON.stringify({ code:String(opt.template), name:opt.name || String(opt.template), dict }, null, 1));
  process.exit(0);
}
const used = new Set([...ui, ...data]);
const missing = [...ui].filter(k => !(k in DICT)).sort(byFr);
const unused = Object.keys(DICT).filter(k => !used.has(k)).sort(byFr);
const all = !opt.missing && !opt.unused && !opt.js;
const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
if (opt.js) for (const k of missing) console.log(`  ${q(k)}:${q(k)},`);
if (all || opt.missing){ console.log(`\n# Sans traduction (${missing.length})`); missing.forEach(k => console.log('  ' + k)); }
if (all || opt.unused){ console.log(`\n# Traductions inutilisées (${unused.length})`); unused.forEach(k => console.log('  ' + k)); }
console.log(`\n[${LANG}] ${Object.keys(DICT).length} traductions ; interface : ${ui.size} textes, ${missing.length} sans traduction ; `
  + `données : ${data.size} libellés (${[...data].filter(k => k in DICT).length} traduits, les autres en anglais 2Ship) ; ${unused.length} traductions inutilisées.`);
// --strict (vérifications automatiques) : échec s'il manque une traduction ou s'il en reste d'inutiles
if (opt.strict && (missing.length || unused.length)) process.exit(1);
