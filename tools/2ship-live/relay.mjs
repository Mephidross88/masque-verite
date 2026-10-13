// Relais du suivi en direct : Le Masque de Vérité <-> 2 Ship 2 Harkinian — outil lancé à la main pendant qu'on joue,
// jamais chargé par l'appli. Windows, Bun (https://bun.sh) ou exécutable autonome (tools/2ship-live/build_relay.mjs).
//
// 2Ship n'a pas de réseau : le relais lit la mémoire du jeu (LECTURE SEULE, ReadProcessMemory ; il ne peut rien y écrire)
// quatre fois par seconde. Adresses et disposition des champs : le PDB livré avec 2Ship (debug/2ship.pdb, à côté de
// 2ship.exe), lu au lancement du jeu et vérifié contre l'exécutable (GUID + âge) — une mise à jour de 2Ship est suivie tant
// que les noms des champs ne changent pas.
//
// Vers l'appli (flux SSE, http://127.0.0.1:43391/events) :
//   - state : jeu absent, PDB introuvable ou différent, fichier chargé (numéro, partie du randomizer ou non) ;
//   - save  : la partie en cours sous la forme du JSON de sauvegarde de 2Ship (champs lus par readSave de js/link.js :
//     checks, options, inventaire, drapeaux de scène…), envoyée quand elle change (pas pour l'heure qui avance). Drapeaux de
//     coffre : ceux de la sauvegarde, du cycle (cycleSceneFlags) et de la scène en cours (le jeu ne les recopie qu'en
//     sortant de la scène et en sauvegardant) ;
//   - live  : jour, heure, forme, scène, salle, position et orientation de Link, temps de jeu, quand ils changent.
//
// Usage : bun tools/2ship-live/relay.mjs [--web=43391] [--ms=250] [--pdb=chemin/2ship.pdb] [--exe=2ship.exe]
//   [--origin=https://…[,…]]   (adresse d'une copie de l'appli hébergée ailleurs)
//   (sous Windows : double-clic sur lancer-relais.bat, à la racine du projet ; ou l'exécutable autonome, sans Bun)
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pdb, readPrim } from './pdb.mjs';
import { findPid, Proc } from './memory.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const HOST = '127.0.0.1', WEB_PORT = +(args.web || 43391), MS = +(args.ms || 250), EXE = String(args.exe || '2ship.exe');

const FR = /^fr\b/i.test(process.env.LANG || Intl.DateTimeFormat().resolvedOptions().locale || '');
const m = (fr, en) => FR ? fr : en;
const time = () => new Date().toLocaleTimeString(FR ? 'fr-FR' : 'en-GB');
const log = (...a) => console.log(`[${time()}]`, ...a);
// exécutable autonome (pas lancé par bun) : la fenêtre se ferme à la sortie, on attend Entrée avant
const STANDALONE = !/[\\/](node|bun)(\.exe)?$/i.test(process.execPath);
function fatal(msg){
  console.error('\n' + msg + '\n');
  if (!STANDALONE || !process.stdin.isTTY) process.exit(1);
  console.error(m('Appuyez sur Entrée pour fermer.', 'Press Enter to close.'));
  process.stdin.once('data', () => process.exit(1));
}
if (process.platform !== 'win32') fatal(m('Le suivi en direct ne fonctionne que sous Windows.', 'Live tracking only works on Windows.'));
console.log(m('Le Masque de Vérité — relais du suivi en direct (lecture seule). Gardez cette fenêtre ouverte pendant la partie.',
  'Le Masque de Vérité — live tracking relay (read-only). Keep this window open while you play.'));

/* ---------- Disposition des champs (PDB) ---------- */
// champs de la sauvegarde transmis à l'appli (ceux que lit readSave)
const PICK = { day:1, time:1, isNight:1, playerForm:1,
  saveInfo:{ inventory:{ items:1 }, skullTokenCount:1, permanentSceneFlags:1 },
  shipSaveInfo:{ commitHash:1, filePlaytime:1, saveType:1, rando:{ finalSeed:1, randoSaveChecks:1, randoSaveOptions:1, randoStartingItems:1, randoInf:1 } } };
const pdbCache = new Map();   // chemin → { mtime, pdb, L }
function layout(p){
  const g = n => { const x = p.globals.get(n); if (!x) throw new Error(m('symbole absent du PDB : ', 'symbol missing from the PDB: ') + n); return x; };
  const S = g('gSaveContext'), PL = g('gPlayState'), PT = p.pointee(PL.type), at = (t, f) => p.resolve(t, f);
  const L = { p, S, PL, saveSize:p.size(S.type),
    save:at('SaveContext', 'save'), fileNum:at('SaveContext', 'fileNum'), gameMode:at('SaveContext', 'gameMode'),
    saveType:at('SaveContext', 'save.shipSaveInfo.saveType'), day:at('SaveContext', 'save.day'), time:at('SaveContext', 'save.time'),
    night:at('SaveContext', 'save.isNight'), form:at('SaveContext', 'save.playerForm'), playtime:at('SaveContext', 'save.shipSaveInfo.filePlaytime'),
    rando:at('SaveContext', 'save.shipSaveInfo.rando'), checks:at('SaveContext', 'save.shipSaveInfo.rando.randoSaveChecks'),
    obtained:at('RandoSaveCheck', 'obtained'), item:at('RandoSaveCheck', 'randoItemId'),
    items:at('SaveContext', 'save.saveInfo.inventory.items'), tokens:at('SaveContext', 'save.saveInfo.skullTokenCount'),
    perm:at('SaveContext', 'save.saveInfo.permanentSceneFlags'), cycle:at('SaveContext', 'cycleSceneFlags'),
    permChest:at('SaveContext', 'save.saveInfo.permanentSceneFlags[0].chest'), cycleChest:at('SaveContext', 'cycleSceneFlags[0].chest'),
    scene:at(PT, 'sceneId'), room:at(PT, 'roomCtx.curRoom.num'), player:at(PT, 'actorCtx.actorLists[2].first'), chest:at(PT, 'actorCtx.sceneFlags.chest'),
    pos:at('Actor', 'world.pos'), rot:at('Actor', 'shape.rot.y'), RANDO:p.enumValues('SaveType').SAVETYPE_RANDO };
  L.playSize = Math.max(...[L.scene, L.room, L.player, L.chest].map(f => f.off + f.size));
  L.actorSize = Math.max(L.pos.off + 12, L.rot.off + 2);
  const inv = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
  L.RC = inv(p.enumValues('RandoCheckId')); L.RI = inv(p.enumValues('RandoItemId'));
  try { L.SCENE = inv(p.enumValues('SceneId')); } catch { L.SCENE = {}; }
  return L;
}
function loadPdb(file){
  const st = fs.statSync(file), c = pdbCache.get(file);
  if (c && c.mtime === st.mtimeMs) return c;
  const p = new Pdb(file), e = { mtime:st.mtimeMs, pdb:p, L:layout(p) };
  pdbCache.set(file, e);
  return e;
}

/* ---------- Jeu ---------- */
let proc = null, L = null, state = { game:'wait' }, lastSave = null, lastLive = null, saveKey = null, prevOb = null, prevFile = -2, liveKey = '';
function setState(s){
  const k = JSON.stringify(s);
  if (k === JSON.stringify(state)) return;
  state = s;
  broadcast({ type:'state', ...s });
  const say = {
    wait:() => m(`En attente de ${EXE}…`, `Waiting for ${EXE}…`),
    denied:() => m(`Accès refusé à ${EXE} (lancé en administrateur ? lancez le relais de la même façon).`, `Access denied to ${EXE} (running as administrator? run the relay the same way).`),
    nopdb:() => m(`PDB introuvable : ${s.pdb} (livré avec 2Ship, dossier debug ; sinon --pdb=chemin).`, `PDB not found: ${s.pdb} (shipped with 2Ship, debug folder; otherwise --pdb=path).`),
    mismatch:() => m(`Le PDB ${s.pdb} n'est pas celui de cet exécutable (autre version de 2Ship).`, `The PDB ${s.pdb} does not match this executable (another 2Ship version).`),
    error:() => m(`Disposition de la mémoire illisible : ${s.msg}`, `Unreadable memory layout: ${s.msg}`),
    ok:() => s.file < 0 ? m('Jeu connecté — aucun fichier chargé.', 'Game connected — no file loaded.')
      : s.rando ? m(`Fichier ${s.file + 1} chargé (randomizer).`, `File ${s.file + 1} loaded (randomizer).`)
      : m(`Fichier ${s.file + 1} chargé : pas une partie du randomizer, ignorée.`, `File ${s.file + 1} loaded: not a randomizer save, ignored.`),
  }[s.game];
  if (say) log(say());
}
function detach(){ if (proc) proc.close(); proc = null; L = null; lastSave = lastLive = saveKey = prevOb = null; prevFile = -2; liveKey = ''; }
function attach(){
  const pid = findPid(EXE);
  if (!pid){ setState({ game:'wait' }); return; }
  try { proc = new Proc(pid); } catch (e) { proc = null; setState({ game:'denied' }); return; }
  const dir = path.dirname(proc.path || '.');
  const pdbFile = args.pdb ? String(args.pdb) : [path.join(dir, 'debug', '2ship.pdb'), path.join(dir, '2ship.pdb')].find(f => fs.existsSync(f)) || path.join(dir, 'debug', '2ship.pdb');
  if (!fs.existsSync(pdbFile)){ detach(); setState({ game:'nopdb', pdb:pdbFile }); return; }
  try {
    const c = loadPdb(pdbFile);
    if (c.pdb.id !== proc.pdbId()){ detach(); setState({ game:'mismatch', pdb:pdbFile }); return; }
    L = c.L;
  } catch (e) { detach(); setState({ game:'error', msg:e.message }); return; }
  log(m(`Connecté à ${proc.path} (pid ${pid}).`, `Attached to ${proc.path} (pid ${pid}).`));
}
const rd = (buf, f) => readPrim(buf, f.off, f.read);
function tick(){
  if (proc && !proc.alive()){ log(m('Jeu fermé.', 'Game closed.')); detach(); }
  if (!proc){ attach(); if (!proc) return; }
  const base = proc.base, sc = proc.read(base + BigInt(L.S.rva), L.saveSize);
  if (!sc){ detach(); return; }
  const file = rd(sc, L.fileNum), play = proc.ptr(base + BigInt(L.PL.rva));
  const loaded = play && rd(sc, L.gameMode) === 0 && file >= 0 && file < 3, rando = loaded && rd(sc, L.saveType) === L.RANDO;
  setState({ game:'ok', file:loaded ? file : -1, ...(loaded ? { rando } : {}) });
  if (!rando){ if (lastSave || lastLive){ lastSave = lastLive = saveKey = null; liveKey = ''; } return; }
  const ps = proc.read(play, L.playSize);
  if (!ps) return;
  const scene = ps.readInt16LE(L.scene.off), sceneChest = ps.readUInt32LE(L.chest.off);
  // partie : envoyée quand elle change (checks, inventaire, jetons, drapeaux), pas pour l'heure
  const slice = f => sc.subarray(f.off, f.off + f.size);
  const key = Buffer.concat([slice(L.rando), slice(L.items), slice(L.tokens), slice(L.perm), slice(L.cycle), Buffer.from(new Int32Array([file, scene, sceneChest]).buffer)]);
  if (!saveKey || !key.equals(saveKey)){
    saveKey = key;
    const save = L.p.value(sc, L.save.off, L.save.type, PICK);
    // drapeaux de coffre : sauvegarde | cycle | scène en cours
    const flags = save.saveInfo.permanentSceneFlags, cs = L.cycle.elSize;
    flags.forEach((f, i) => { if (i * cs < L.cycle.size) f.chest = (f.chest | sc.readUInt32LE(L.cycle.off + i * cs + (L.cycleChest.off - L.cycle.off))) >>> 0; });
    if (flags[scene]) flags[scene].chest = (flags[scene].chest | sceneChest) >>> 0;
    lastSave = { type:'save', file, save:{ type:'2S2H_SAVE', newCycleSave:{ save } } };
    broadcast(lastSave);
    // console : checks obtenus
    const n = L.checks.count, es = L.checks.elSize, ob = new Uint8Array(n);
    for (let i = 0; i < n; i++) ob[i] = sc[L.checks.off + i * es + L.obtained.off];
    if (prevOb && prevFile === file){
      for (let i = 0; i < n; i++) if (ob[i] && !prevOb[i])
        log('✓', L.RC[i] || i, '→', L.RI[sc.readInt32LE(L.checks.off + i * es + L.item.off)] || '?');
    } else log(m(`Fichier ${file + 1} : ${ob.reduce((a, x) => a + x, 0)} checks obtenus.`, `File ${file + 1}: ${ob.reduce((a, x) => a + x, 0)} checks obtained.`));
    prevOb = ob; prevFile = file;
  }
  // moment, scène, position
  const pl = ps.readBigUInt64LE(L.player.off), ac = pl ? proc.read(pl, L.actorSize) : null;
  const live = { type:'live', file, day:rd(sc, L.day), time:rd(sc, L.time), night:!!rd(sc, L.night), form:rd(sc, L.form),
    scene:L.SCENE[scene] || null, sceneNum:scene, room:ps.readInt8(L.room.off),
    pos:ac ? [0, 4, 8].map(o => Math.round(ac.readFloatLE(L.pos.off + o))) : null, rot:ac ? ac.readInt16LE(L.rot.off) : 0, playtime:rd(sc, L.playtime) };
  const lk = JSON.stringify({ ...live, playtime:0 });
  if (lk !== liveKey){ liveKey = lk; lastLive = live; broadcast(live); }
}

/* ---------- Vers l'appli (SSE) ----------
   Une seule page de l'appli à la fois (la première garde la place ; les autres reçoivent « busy » et réessaient). Origines
   acceptées : l'appli en fichier local, servie en local, ou publiée (GitHub Pages) ; les autres pages ouvertes dans le
   navigateur sont refusées. Accès d'un site public vers cette adresse locale : en-tête Private Network Access de Chrome. */
let client = null;   // { res, token, origin }
function broadcast(ev){ if (client) client.res.write(`data: ${JSON.stringify(ev)}\n\n`); }
const ORIGINS = new Set(['https://mephidross88.github.io', ...String(args.origin === true ? '' : args.origin || '').split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean)]);
const originOk = o => o == null || o === 'null' || o === 'file://' || ORIGINS.has(o) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
const refused = new Set();
const where = o => o === 'null' || o === 'file://' ? m('fichier local', 'local file') : o || m('sans origine', 'no origin');
http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (!originOk(origin)){
    if (!refused.has(origin)){ refused.add(origin); log(m(`Accès refusé à ${origin} (pas l'appli ; sinon : --origin=${origin})`, `Access denied to ${origin} (not the app; otherwise: --origin=${origin})`)); }
    res.writeHead(403); res.end(); return;
  }
  if (origin){ res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS'){ res.writeHead(204); res.end(); return; }
  if (req.url === '/events'){
    res.writeHead(200, { 'Content-Type':'text/event-stream; charset=utf-8', 'Cache-Control':'no-cache', Connection:'keep-alive' });
    if (client){
      if (!client.refusedLogged++) log(m(`Connexion refusée à ${where(origin)} : l'appli est déjà connectée (${where(client.origin)})`,
        `Connection refused to ${where(origin)}: the app is already connected (${where(client.origin)})`));
      res.end(`retry: 5000\n\ndata: ${JSON.stringify({ type:'busy' })}\n\n`);
      return;
    }
    client = { res, token:crypto.randomBytes(16).toString('hex'), origin:origin || '', refusedLogged:0 };
    res.write('retry: 2000\n\n');   // reconnexion de l'appli 2 s après une coupure (relais relancé)
    broadcast({ ...state, type:'hello', token:client.token });
    if (lastSave) broadcast(lastSave);
    if (lastLive) broadcast(lastLive);
    const ka = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => { clearInterval(ka); if (client?.res === res) client = null; log(m('Appli déconnectée', 'App disconnected')); });
    log(m(`Appli connectée (${where(origin)})`, `App connected (${where(origin)})`));
    return;
  }
  res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8' });
  res.end(m(`Relais Le Masque de Vérité — ${state.game === 'ok' ? 'jeu connecté' : 'jeu non connecté'}. Flux : /events`,
    `Le Masque de Vérité relay — game ${state.game === 'ok' ? 'connected' : 'not connected'}. Stream: /events`));
}).on('error', e => fatal(e.code === 'EADDRINUSE'
    ? m(`Le port ${WEB_PORT} est déjà utilisé : le relais tourne sans doute déjà (une autre fenêtre ?).`, `Port ${WEB_PORT} is already in use: the relay is probably already running (another window?).`)
    : m(`Erreur sur le port ${WEB_PORT} : ${e.message}`, `Error on port ${WEB_PORT}: ${e.message}`)))
  .listen(WEB_PORT, HOST, () => log(m(`Appli : adresse du relais http://${HOST}:${WEB_PORT}`, `App: relay address http://${HOST}:${WEB_PORT}`)));

log(m(`En attente de ${EXE}…`, `Waiting for ${EXE}…`));
setInterval(() => { try { tick(); } catch (e) { log(m('Erreur : ', 'Error: ') + e.message); detach(); } }, MS);
