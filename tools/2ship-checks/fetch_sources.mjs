// Télécharge dans ./src les sources de 2 Ship 2 Harkinian nécessaires aux extractions (checks, objets, options, logique,
// sauvegarde, cartes), au commit voulu. Chemins gardés tels quels sous src/ (sans le « mm/ » de tête).
// Usage : node fetch_sources.mjs [commit]   (défaut : 8a24047, 2Ship 5.0.1 « Battler Bravo »)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const COMMIT = process.argv[2] || '8a24047';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'src');
const REPO = 'HarbourMasters/2ship2harkinian';
const RAW = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/`;

const tree = await (await fetch(`https://api.github.com/repos/${REPO}/git/trees/${COMMIT}?recursive=1`)).json();
if (!tree.tree) throw new Error('Arbre introuvable pour ' + COMMIT + ' : ' + JSON.stringify(tree).slice(0, 200));
const wanted = tree.tree.filter(e => e.type === 'blob').map(e => e.path).filter(p =>
  // randomizer : données (StaticData), logique (Logic, Regions), types et énumérations, tracker de checks, spoiler
  /^mm\/2s2h\/Rando\/.*\.(cpp|h|hpp)$/.test(p) ||
  // noms des scènes (tracker de checks), sauvegarde JSON (auto-tracking)
  /^mm\/2s2h\/(ShipUtils\.(cpp|h)|SaveManager\/SaveManager\.(cpp|h))$/.test(p) ||
  // jeu : objets, sauvegarde (drapeaux, RandoSaveCheck), scènes, acteurs, entrées (tables des scènes), étages des donjons
  /^mm\/include\/(z64item|z64save|z64scene)\.h$/.test(p) ||
  /^mm\/include\/tables\/(scene|actor|object)_table\.h$/.test(p) ||
  /^mm\/src\/code\/(z_scene_table|z_map_data)\.c$/.test(p));

// téléchargements en parallèle, par petits paquets
for (let i = 0; i < wanted.length; i += 12) await Promise.all(wanted.slice(i, i + 12).map(async p => {
  const dest = path.join(SRC, p.replace(/^mm\//, ''));
  fs.mkdirSync(path.dirname(dest), { recursive:true });
  const res = await fetch(RAW + p);
  if (!res.ok) throw new Error(`${p} : HTTP ${res.status}`);
  fs.writeFileSync(dest, await res.text());
}));
console.log(`${wanted.length} fichiers de 2Ship (${COMMIT}) téléchargés dans ${SRC}`);
