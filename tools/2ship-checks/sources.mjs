// Lecture des sources de 2Ship téléchargées dans ./src (fetch_sources.mjs) : checks, objets, options, scènes, régions de la
// logique, énumérations. Module commun aux générateurs (extract_checks.mjs ; logique à l'étape 2). Rien n'est exécuté :
// les tables C++ sont lues par expressions régulières, avec contrôles (nombre d'entrées, valeurs connues).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');
export const RANDO = path.join(SRC, '2s2h/Rando');
export const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
if (!fs.existsSync(RANDO)) throw new Error('Sources absentes : lancer d’abord node tools/2ship-checks/fetch_sources.mjs');

// commentaires retirés (// … et /* … */), chaînes gardées
export function stripComments(s){
  return s.replace(/"(?:[^"\\\n]|\\.)*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, m => m[0] === '"' ? m : m[0] === '/' && m[1] === '*' ? ' ' : '');
}
// arguments de premier niveau d'un appel (texte entre parenthèses), séparés par les virgules hors parenthèses / accolades
export function splitArgs(s){
  const out = []; let depth = 0, cur = '', str = false;
  for (let i = 0; i < s.length; i++){
    const c = s[i];
    if (str){ cur += c; if (c === '\\'){ cur += s[++i]; } else if (c === '"') str = false; continue; }
    if (c === '"'){ str = true; cur += c; continue; }
    if ('([{'.includes(c)) depth++;
    if (')]}'.includes(c)) depth--;
    if (c === ',' && depth === 0){ out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
// appels NOM( … ) d'un texte : [{ args, start, end }] (parenthèses équilibrées)
export function calls(s, name){
  const out = [], re = new RegExp('\\b' + name + '\\(', 'g');
  let m;
  while ((m = re.exec(s))){
    let depth = 1, i = m.index + m[0].length;
    for (; i < s.length && depth; i++){ if (s[i] === '(') depth++; else if (s[i] === ')') depth--; }
    out.push({ args:splitArgs(s.slice(m.index + m[0].length, i - 1)), start:m.index, end:i });
    re.lastIndex = i;
  }
  return out;
}
// bloc entre accolades qui commence à l'indice de « { » : texte intérieur et fin
export function braceBlock(s, open){
  let depth = 0;
  for (let i = open; i < s.length; i++){
    if (s[i] === '{') depth++;
    else if (s[i] === '}' && !--depth) return { body:s.slice(open + 1, i), end:i + 1 };
  }
  throw new Error('accolade non fermée à ' + open);
}

// énumération C « typedef enum { A, B = 3, … } Nom; » ou « enum Nom { … } » : { A:0, B:3, … } (valeurs implicites suivies)
export function parseEnum(text, name){
  const s = stripComments(text);
  let m = new RegExp('typedef enum\\s*\\w*\\s*\\{([^}]*)\\}\\s*' + name + '\\s*;').exec(s) || new RegExp('enum\\s+' + name + '\\s*(?::\\s*\\w+\\s*)?\\{([^}]*)\\}').exec(s);
  if (!m) throw new Error('énumération introuvable : ' + name);
  const out = {}; let v = -1;
  for (const part of m[1].split(',').map(x => x.trim()).filter(Boolean)){
    const [k, e] = part.split('=').map(x => x.trim());
    if (e !== undefined){ v = /^-?(0x[0-9a-f]+|\d+)$/i.test(e) ? Number(e) : e in out ? out[e] : NaN; if (Number.isNaN(v)) throw new Error(name + ' : valeur ' + e); }
    else v++;
    out[k] = v;
  }
  return out;
}

// --- Checks (StaticData/Checks.cpp) : RC(id, type, scène, type de drapeau, drapeau, objet d'origine) ---
export function loadChecks(){
  const s = stripComments(fs.readFileSync(path.join(RANDO, 'StaticData/Checks.cpp'), 'utf8'));
  const out = new Map();
  for (const c of calls(s.slice(s.indexOf('Checks = {')), 'RC')){
    if (c.args.length !== 6) continue;
    const [id, type, scene, flagType, flag, item] = c.args;
    if (!/^RC_\w+$/.test(id)) continue;
    out.set(id, { id, type, scene, flagType, flag, item });
  }
  if (out.size < 2000) throw new Error('Checks.cpp : ' + out.size + ' checks seulement');
  return out;
}

// --- Objets (StaticData/Items.cpp) : RI(id, article, nom, type, ItemId, GetItemId, DrawId) ---
export function loadItems(){
  const s = stripComments(fs.readFileSync(path.join(RANDO, 'StaticData/Items.cpp'), 'utf8'));
  const out = new Map();
  for (const c of calls(s.slice(s.indexOf('Items = {')), 'RI')){
    if (c.args.length !== 7) continue;
    const [id, article, name, type, itemId] = c.args;
    if (!/^RI_\w+$/.test(id)) continue;
    out.set(id, { id, article:JSON.parse(article), name:JSON.parse(name), type, itemId });
  }
  if (out.size < 200) throw new Error('Items.cpp : ' + out.size + ' objets seulement');
  return out;
}

// --- Options (StaticData/Options.cpp) : RO(id, défaut) ---
export function loadOptions(){
  const s = stripComments(fs.readFileSync(path.join(RANDO, 'StaticData/Options.cpp'), 'utf8'));
  const out = new Map();
  for (const c of calls(s, 'RO')) if (c.args.length === 2 && /^RO_\w+$/.test(c.args[0])) out.set(c.args[0], { id:c.args[0], def:c.args[1] });
  return out;
}

// --- Scènes (include/tables/scene_table.h) : enum, numéro, titre (message), index du tracker, nom anglais ---
export function loadScenes(){
  const s = read('include/tables/scene_table.h');
  const out = new Map();
  let i = 0;
  for (const line of s.split('\n')){
    let m = /^\/\* 0x\w+ \*\/ DEFINE_SCENE\((.*)\)\s*$/.exec(line.trim());
    if (m){
      const a = splitArgs(m[1]);
      out.set(a[1], { id:a[1], num:i, title:Number(a[2]), entrance:a[6], order:Number(a[7]), en:JSON.parse(a[8]) });
      i++;
    } else if (/^\/\* 0x\w+ \*\/ DEFINE_SCENE_UNSET\(/.test(line.trim())) i++;
  }
  if (out.size < 100) throw new Error('scene_table.h : ' + out.size + ' scènes');
  return out;
}
// variantes d'une scène (z_play.c, Play_GetOriginalSceneId) : { SCENE_variante: SCENE_originale }
export function loadOriginalScenes(){
  const s = read('src/code/z_play.c'), a = s.indexOf('s16 Play_GetOriginalSceneId(');
  const body = braceBlock(s, s.indexOf('{', a)).body, out = {};
  for (const m of body.matchAll(/if\s*\(\s*sceneId\s*==\s*(SCENE_\w+)\s*\)\s*\{\s*return\s+(SCENE_\w+)\s*;/g)) out[m[1]] = m[2];
  if (Object.keys(out).length < 5) throw new Error('Play_GetOriginalSceneId : ' + JSON.stringify(out));
  return out;
}
// numéro d'une entrée : ENTRANCE(scène, n) = (ENTR_SCENE_<scène> << 9) | (n << 4) (z64scene.h)
let ENTR_SCENES = null;
export function entranceValue(scene, spawn){
  ENTR_SCENES ||= parseEnum(read('include/z64scene.h'), 'EntranceSceneId');
  const k = 'ENTR_SCENE_' + scene;
  if (!(k in ENTR_SCENES)) throw new Error('entrée inconnue : ' + k);
  return ((ENTR_SCENES[k] & 0x7F) << 9) | ((Number(spawn) & 0x1F) << 4);
}

// --- Régions de la logique (Logic/Regions/*.cpp, et la région de départ RR_MAX de Logic/Logic.cpp : checks donnés au
// départ, retour au Sud de Bourg-Clocher, Chant de l'Envol) ---
// { id, file, sceneId, name, checks:[[RC, condition]], exits:[{ to:{scene, spawn}, from:{…}|null, cond }],
//   connections:[[RR, condition]], events:[[RE, condition]], oneWay:[{scene, spawn}], stay:[[tranche, condition]], canStayOverTime }
export function loadRegions(){
  const dir = path.join(RANDO, 'Logic/Regions'), out = new Map();
  const entr = a => { const m = /^ENTRANCE\(\s*(\w+)\s*,\s*(\d+)\s*\)$/.exec(a.trim()); return m ? { scene:m[1], spawn:Number(m[2]) } : null; };
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.cpp')).sort().map(f => path.join(dir, f)).concat(path.join(RANDO, 'Logic/Logic.cpp'));
  for (const fp of files){
    const file = path.basename(fp), s = stripComments(fs.readFileSync(fp, 'utf8'));
    for (const m of s.matchAll(/Regions\[(RR_\w+)\]\s*=\s*RandoRegion\s*\{/g)){
      const { body } = braceBlock(s, m.index + m[0].length - 1);
      const r = { id:m[1], file, sceneId:null, name:'', checks:[], exits:[], connections:[], events:[], oneWay:[], stay:[], canStayOverTime:true };
      const field = name => {
        const f = new RegExp('\\.' + name + '\\s*=\\s*').exec(body);
        if (!f) return null;
        const at = f.index + f[0].length;
        if (body[at] === '{') return braceBlock(body, at).body;
        if (body[at] === '"') return /^"(?:[^"\\]|\\.)*"/.exec(body.slice(at))[0];   // chaîne (peut contenir une virgule)
        const end = body.indexOf(',', at);
        return body.slice(at, end >= 0 ? end : undefined);
      };
      r.sceneId = (field('sceneId') || '').trim();
      const nm = field('name'); if (nm) r.name = JSON.parse(nm.trim());
      const cst = field('canStayOverTime'); if (cst) r.canStayOverTime = cst.trim() !== 'false';
      const fx = (name, macro, fn) => { const b = field(name); if (b) for (const c of calls(b, macro)) fn(c.args); };
      fx('checks', 'CHECK', a => r.checks.push([a[0], a.slice(1).join(', ')]));
      fx('exits', 'EXIT', a => {
        const to = entr(a[0]), from = a[1].trim() === 'ONE_WAY_EXIT' ? null : entr(a[1]);
        if (!to || (!from && a[1].trim() !== 'ONE_WAY_EXIT')) throw new Error(file + ' ' + r.id + ' : sortie illisible ' + a.join(' | '));
        r.exits.push({ to, from, cond:a.slice(2).join(', ') });
      });
      fx('connections', 'CONNECTION', a => r.connections.push([a[0], a.slice(1).join(', ')]));
      fx('events', 'EVENT', a => r.events.push([a[0], a.slice(1).join(', ')]));
      fx('timeStayRestrictions', 'STAY', a => r.stay.push([a[0], a.slice(1).join(', ')]));
      const ow = field('oneWayEntrances');
      if (ow) for (const c of calls(ow, 'ENTRANCE')) r.oneWay.push({ scene:c.args[0], spawn:Number(c.args[1]) });
      if (!/^SCENE_\w+$/.test(r.sceneId)) throw new Error(file + ' ' + r.id + ' : scène ' + r.sceneId);
      if (out.has(r.id)) throw new Error('région en double : ' + r.id);
      out.set(r.id, r);
    }
  }
  if (out.size < 300) throw new Error('régions : ' + out.size);
  return out;
}
// ordre des régions (énumération RandoRegionId de Types.h) : les tables std::map de 2Ship sont parcourues dans cet ordre
let RR_ORDER = null;
export const regionOrder = () => (RR_ORDER ||= parseEnum(fs.readFileSync(path.join(RANDO, 'Types.h'), 'utf8'), 'RandoRegionId'));
