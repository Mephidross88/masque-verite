// Exécutable autonome du relais du suivi en direct (relay.mjs), pour jouer sans installer Bun : compilé par Bun
// (https://bun.sh, à installer pour lancer ce script), Windows seulement (lecture de la mémoire par kernel32), dans dist/
// (non versionné). Lancé par le workflow GitHub .github/workflows/relay.yml, qui le publie dans une release.
// Usage : node tools/2ship-live/build_relay.mjs
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = 'dist/masque-verite-relais-windows.exe';
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive:true });
console.log('→ ' + OUT);
// x64 « baseline » : processeurs sans AVX2 compris
execFileSync('bun', ['build', '--compile', '--minify', '--target=bun-windows-x64-baseline', 'tools/2ship-live/relay.mjs', '--outfile', OUT],
  { cwd:ROOT, stdio:'inherit' });
