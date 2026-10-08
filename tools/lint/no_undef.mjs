// Noms non définis dans les scripts de l'appli (règle no-undef d'ESLint) : tous les fichiers chargés par index.html partagent
// un seul espace de noms (scripts classiques) ; chaque page (js/pages) reçoit des autres ce qu'elle utilise par ctx — un
// oubli n'apparaîtrait qu'à l'exécution. Globals admis : déclarations de haut niveau de tous ces fichiers, window.X des
// données, navigateur. ESLint n'est pas une dépendance de l'appli : installé à part, dossier donné par LINT_DIR.
// Usage : npm i --prefix <dossier> eslint@9 globals   puis   LINT_DIR=<dossier> node tools/lint/no_undef.mjs
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

if (!process.env.LINT_DIR){ console.error('LINT_DIR : dossier où eslint et globals sont installés (voir l\u2019en-tête)'); process.exit(2); }
const require = createRequire(path.resolve(process.env.LINT_DIR, 'node_modules') + '/');
const { ESLint } = require('eslint'), globals = require('globals');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="((?:js|data)\/[^"]+)"/g)].map(m => m[1]);
// scripts chargés à la demande (pas par index.html : cartes de la page Carte) : leurs noms comptent aussi
files.push('js/maps-extract.js');
const g = { Vue:'readonly' };
for (const f of files){
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/^(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) g[m[1]] = 'readonly';
  for (const m of src.matchAll(/^const\s*\{([^}]*)\}\s*=/gm)) m[1].split(',').map(x => x.split(':').pop().trim()).filter(Boolean).forEach(n => { g[n] = 'readonly'; });
  for (const m of src.matchAll(/^(?:const|let) (.*)$/gm)) for (const mm of m[1].matchAll(/(?:^|,\s*)([A-Za-z_$][\w$]*)\s*=(?!=)/g)) g[mm[1]] = 'readonly';
  for (const m of src.matchAll(/window\.([A-Z][A-Z0-9_]+)\s*=/g)) g[m[1]] = 'readonly';
}
const eslint = new ESLint({ cwd:ROOT, overrideConfigFile:true, overrideConfig:[{
  files:['**/*.js'],
  languageOptions:{ ecmaVersion:2024, sourceType:'script', globals:{ ...globals.browser, ...g } },
  rules:{ 'no-undef':'error' },
}] });
const targets = files.filter(f => f.startsWith('js/'));
let n = 0;
for (const r of await eslint.lintFiles(targets)) for (const m of r.messages){ n++; console.log(`${path.relative(ROOT, r.filePath)}:${m.line}:${m.column} ${m.message}`); }
console.log(`${targets.length} fichiers, ${n} problème(s)`);
process.exit(n ? 1 : 0);
