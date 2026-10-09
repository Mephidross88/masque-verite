/* ---------- Fabrication des cartes (page Carte) depuis la ROM de Majora's Mask du joueur ----------
   Script classique chargé à la demande (pas par index.html) : par l'appli, quand le joueur choisit sa ROM sur la page
   Carte (cartes gardées dans le navigateur, voir mapsBuild de js/pages/map.js), et par tools/2ship-maps/extract_maps.mjs
   (fichier data/maps-data.js). Rien de la ROM ne quitte la machine du joueur.

   extractMaps({ rom, recipe, progress? }) → Promise<{ data, stats }>
   - rom : octets de la ROM (Uint8Array) — Majora's Mask N64 (US), compressée ou non (Yaz0), .z64 ou .v64
   - recipe : window.MAPS_RECIPE (data/maps-recipe.js, tiré des sources de 2Ship)
   - progress(étape, part 0..1) : l'appli rend la main au navigateur entre deux étapes
   - data : contenu de window.MAPS_DATA ; stats : nombres pour le compte rendu

   Données lues (format des scènes de MM, gros-boutiste, comme OoT) : table des fichiers (dmadata), table des scènes (dans
   le code : 16 octets par scène, début et fin du fichier), en-tête de la scène (commandes de 8 octets) : points
   d'apparition (0x00), collision (0x03 : sommets, polygones, types de surface, eau), liste des sorties (0x13 : numéro de
   l'entrée de chaque sortie). Sorties : polygones de collision dont le type de surface porte un numéro de sortie (zones
   de chargement, et derrière les portes des intérieurs).
   data.scenes[SCENE_…] = { b:[x0, z0, x1, z1], f:[x1, z1, x2, z2, x3, z3, hauteur, …] (sols, triangles vus de dessus),
     w:[x1, z1, x2, z2, …] (murs), wy:[ymin, ymax, …], water:[x0, z0, x1, z1, y, …], sp:[[x, y, z], …] (apparitions),
     ex:[[entrée, x, y, z, rayon], …] (sorties), lv:[hauteur, …] (étages, du plus bas au plus haut ; absent : un seul),
     lb:numéro du plus bas (0 : 1er étage, -1 : sous-sol 1…), ho:[[x, y, z, entrée des grottes, données], …] (trous de grotte) }
   Scène des grottes : une carte par salle, « SCENE_KAKUSIANA#n » ; data.grottoRooms : entrée des grottes → salle.
   data.checks[RC_…] = [scène, x, y, z, approchée?] : position de l'acteur du check (règles recipe.loc, tirées des sources de
   2Ship) ; 5e valeur 1 : position approchée (personnage, qui bouge selon l'heure : un même PNJ donne des checks à des
   endroits différents ; voisin de famille ; boss) — à vérifier, et corriger à la main au besoin */
async function extractMaps({ rom:bytes, recipe, progress }){
  const step = async (text, part) => { if (progress){ progress(text, part); await new Promise(r => setTimeout(r, 0)); } };
  const NOT_MM = 'not-mm', NO_TABLE = 'no-scene-table';

  /* ---------- ROM : ordre des octets, table des fichiers, décompression ---------- */
  const be32 = (x, o) => (x[o] << 24 >>> 0) + (x[o + 1] << 16) + (x[o + 2] << 8) + x[o + 3];
  function yaz0(src, at, out, to){
    const end = to + be32(src, at + 4);
    let i = at + 16, o = to;
    while (o < end){
      const code = src[i++];
      for (let b = 7; b >= 0 && o < end; b--){
        if (code & (1 << b)) out[o++] = src[i++];
        else {
          const b1 = src[i++], b2 = src[i++], dist = ((b1 & 0x0F) << 8 | b2) + 1;
          let n = b1 >> 4; if (!n) n = src[i++] + 0x12; else n += 2;
          for (let k = 0; k < n; k++, o++) out[o] = out[o - dist];
        }
      }
    }
  }
  await step('rom', 0);
  let a = bytes;
  if (be32(a, 0) === 0x37804012){ a = a.slice(); for (let i = 0; i + 1 < a.length; i += 2){ const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; } }   // .v64
  // table des fichiers : ses deux premières entrées (0, 0x1060, 0, 0) puis (0x1060, …)
  const sig = [0, 0, 0, 0, 0, 0, 0x10, 0x60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10, 0x60];
  let dma = -1;
  for (let o = 0; o + sig.length <= a.length && dma < 0; o += 16){ let k = 0; while (k < sig.length && a[o + k] === sig[k]) k++; if (k === sig.length) dma = o; }
  if (dma < 0) throw new Error(NOT_MM);
  const files = [];
  for (let o = dma; o + 16 <= a.length; o += 16){ const vs = be32(a, o), ve = be32(a, o + 4), ps = be32(a, o + 8), pe = be32(a, o + 12); if (!ve) break; files.push({ vs, ve, ps, pe }); }
  if (files.some(f => f.pe && f.ps !== 0xFFFFFFFF)){
    await step('unpack', 0.05);
    const out = new Uint8Array(Math.max(...files.map(f => f.ve)));
    for (const f of files){ if (f.ps === 0xFFFFFFFF) continue; if (f.pe) yaz0(a, f.ps, out, f.vs); else out.set(a.subarray(f.ps, f.ps + (f.ve - f.vs)), f.vs); }
    a = out;
  }
  const dv = new DataView(a.buffer, a.byteOffset, a.byteLength);
  const u8 = o => a[o], u16 = o => dv.getUint16(o), s16 = o => dv.getInt16(o), u32 = o => dv.getUint32(o), seg = x => x & 0x00FFFFFF;
  const isFile = new Map(files.map(f => [f.vs, f.ve]));
  // fichier qui commence par un en-tête de scène : commandes connues jusqu'à la fin (0x14), avec une collision (0x03)
  const sceneHeader = (s, e) => {
    if (!(e > s)) return false;
    let col = false;
    for (let o = 0; o < 0x200 && s + o + 8 <= e; o += 8){ const c = a[s + o]; if (c === 0x03) col = true; if (c === 0x14) return col; if (c > 0x1F) return false; }
    return false;
  };
  // table des scènes (16 octets par entrée, entrées vides à zéro) : là où le plus de fichiers commencent par un en-tête de scène
  await step('table', 0.15);
  const NS = recipe.scenes.length;
  let TABLE = null, best = 0;
  for (let o = dma + files.length * 16 + 16; o + 16 * NS < a.length; o += 4){
    if (!isFile.has(u32(o)) || !u32(o)) continue;
    let k = 0, ns = 0;
    for (; k < NS; k++){
      const vs = u32(o + k * 16), ve = u32(o + k * 16 + 4);
      if (!vs && !ve) continue;
      if (isFile.get(vs) !== ve) break;
      if (sceneHeader(vs, ve)) ns++;
    }
    if (k === NS && ns > best){ best = ns; TABLE = o; }
  }
  if (TABLE == null || best < NS * 0.8) throw new Error(NO_TABLE);

  /* ---------- Scènes ---------- */
  // étage le plus bas affiché par le menu pause (sCustomBottomStorey de z_map_disp.c) : -1 → le premier étage est S1
  const BOTTOM_STOREY = { SCENE_HAKUGIN:-1, SCENE_HAKUGIN_BS:-1, SCENE_SEA:-2, SCENE_SEA_BS:-2, SCENE_INISIE_N:-1 };
  /* étages fixés à la main, faute de données dans le jeu (pas de carte au menu pause, hauteurs de sol continues) : coupe
     choisie d'après les sols et les acteurs — Maisons des Araignées : sols sous 160, passerelles, balcons et ruches au-dessus
     (Marais : 1 et 2) ; étage de l'entrée au-dessus de 160, sous-sol en dessous (Côte : S1 et 1). lv : comme ci-dessus
     (étage i à partir de lv[i] − 80). */
  const MANUAL_STOREYS = { SCENE_KINSTA1:{ lv:[0, 240], lb:0 }, SCENE_KINDAN2:{ lv:[-120, 240], lb:-1 } };
  const header = base => { const c = {}; for (let o = 0; o < 0x200; o += 8){ const k = u8(base + o); c[k] = { n:u8(base + o + 1), addr:seg(u32(base + o + 4)) }; if (k === 0x14) break; } return c; };
  function readScene(num){
    const s = u32(TABLE + num * 16), e = u32(TABLE + num * 16 + 4);
    if (!sceneHeader(s, e)) return null;
    const cmds = header(s);
    const out = { b:null, f:[], w:[], wy:[], water:[], sp:[], ex:[] };
    // points d'apparition : acteurs de 16 octets (numéro, x, y, z, rotations, paramètres)
    if (cmds[0x00]) for (let i = 0; i < cmds[0x00].n; i++){ const o = s + cmds[0x00].addr + i * 16; out.sp.push([s16(o + 2), s16(o + 4), s16(o + 6)]); }
    // collision
    const ch = s + cmds[0x03].addr;
    const pv = s + seg(u32(ch + 16)), np = u16(ch + 20), pp = s + seg(u32(ch + 24)), pst = s + seg(u32(ch + 28));
    const nw = u16(ch + 36), pw = s + seg(u32(ch + 40));
    const V = k => [s16(pv + k * 6), s16(pv + k * 6 + 2), s16(pv + k * 6 + 4)];
    const zones = {};
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    const tri = [];   // sols avec leurs trois sommets (hauteur exacte d'un point : brins d'herbe), gardés pour le calcul

    for (let i = 0; i < np; i++){
      const o = pp + i * 16, type = u16(o), v = [u16(o + 2) & 0x1FFF, u16(o + 4) & 0x1FFF, u16(o + 6) & 0x1FFF].map(V);
      const ny = s16(o + 10) / 0x7FFF, exit = (u32(pst + type * 8) >> 8) & 0x1F;
      if (exit) (zones[exit] = zones[exit] || []).push(...v);
      if (ny > 0.2){
        tri.push(v);
        out.f.push(v[0][0], v[0][2], v[1][0], v[1][2], v[2][0], v[2][2], Math.round((v[0][1] + v[1][1] + v[2][1]) / 3));
        for (const p of v){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); }
      } else if (Math.abs(ny) < 0.05){
        // mur : trait de son étendue vue de dessus, seulement les vrais murs (au moins 60 unités de haut et de long)
        const ys = v.map(p => p[1]), h = Math.max(...ys) - Math.min(...ys);
        const d = (p, q) => Math.hypot(p[0] - q[0], p[2] - q[2]), pairs = [[v[0], v[1]], [v[1], v[2]], [v[2], v[0]]].sort((p, q) => d(q[0], q[1]) - d(p[0], p[1]));
        if (h >= 60 && d(...pairs[0]) >= 60){ out.w.push(pairs[0][0][0], pairs[0][0][2], pairs[0][1][0], pairs[0][1][2]); out.wy.push(Math.min(...ys), Math.max(...ys)); }
      }
    }
    // eau : boîtes (x, surface, z, longueurs)
    for (let i = 0; i < nw && i < 64; i++){
      const o = pw + i * 16, wx = s16(o), wyy = s16(o + 2), wz = s16(o + 4), lx = s16(o + 6), lz = s16(o + 8);
      if (lx > 0 && lz > 0) out.water.push(wx, wz, wx + lx, wz + lz, wyy);
    }
    // sorties : zones de collision (index de sortie, à partir de 1) → numéro d'entrée dans la liste des sorties
    // (une même sortie à plusieurs endroits éloignés — retour au trou de chaque grotte — : un repère par endroit ; polygones
    // groupés de proche en proche, à moins de 300 unités)
    for (const [k, pts] of Object.entries(zones)){
      if (!cmds[0x13]) break;
      const entr = u16(s + cmds[0x13].addr + (k - 1) * 2), groups = [];
      for (let i = 0; i < pts.length; i += 3){
        const tri = pts.slice(i, i + 3), near = groups.filter(g => g.some(p => tri.some(q => Math.hypot(p[0] - q[0], p[2] - q[2]) < 300)));
        const g = near.length ? near[0] : (groups.push([]), groups[groups.length - 1]);
        g.push(...tri);
        for (const o of near.slice(1)){ g.push(...o); groups.splice(groups.indexOf(o), 1); }
      }
      for (const g of groups){
        const c = [0, 1, 2].map(j => Math.round(g.reduce((t, p) => t + p[j], 0) / g.length));
        const r = Math.round(Math.max(...g.map(p => Math.hypot(p[0] - c[0], p[2] - c[2]))));
        out.ex.push([entr, c[0], c[1], c[2], r]);
      }
    }
    if (!isFinite(x0)) return null;
    out.b = [x0, z0, x1, z1];
    // étages (donjons) : hauteur de sol de référence de chaque salle sur la carte du menu pause (commande 0x1C : salles de
    // 10 octets, carte, x, sol, z, options ; sans carte : 0xFFFF), hauteurs distinctes à 5 unités près (z_map_disp.c)
    const manual = MANUAL_STOREYS[recipe.scenes[num][0]];
    if (manual){ out.lv = manual.lv; out.lb = manual.lb; }
    else if (cmds[0x1C] && cmds[0x04]){
      const ms = s + cmds[0x1C].addr, rp = s + seg(u32(ms)), ys = [], all = [];
      for (let i = 0; i < cmds[0x04].n; i++){
        const o = rp + i * 10;
        if (o + 10 > e) continue;
        const y = s16(o + 4);
        all.push(y);
        if (u16(o) !== 0xFFFF && !ys.some(v => Math.abs(v - y) < 5)) ys.push(y);
      }
      ys.sort((p, q) => p - q);
      // (écarts de moins de 200 unités : un seul niveau de terrain, pas des étages — Marais du Sud)
      if (ys.length > 1 && ys.every((y, i) => !i || y - ys[i - 1] >= 200)){ out.lv = ys; out.lb = BOTTOM_STOREY[recipe.scenes[num][0]] || 0; }
      else {
        /* lieu sans carte au menu pause (Auberge…) : hauteurs de référence de ses salles quand même (regroupées à 100
           unités près), gardées seulement si les étages se superposent vraiment (au moins un sol sur cinq d'un étage a un
           sol d'un étage plus bas sous lui) — pas des salles à des hauteurs différentes côte à côte */
        const lv = [];
        for (const y of all.sort((p, q) => p - q)) if (!lv.length || y - lv[lv.length - 1] >= 100) lv.push(y);
        // (étages d'au moins 150 unités d'écart : sinon des niveaux de terrain, pas des étages — Marais du Sud)
        if (lv.some((y, i) => i && y - lv[i - 1] < 150)) lv.length = 0;
        const levelOf = y => { let i = 0; while (i + 1 < lv.length && y >= lv[i + 1] - 80) i++; return i; };
        const inside = (t, x, z) => { const [[ax, , az], [bx, , bz], [cx, , cz]] = t, d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
          if (!d) return false; const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
          return l1 >= 0 && l2 >= 0 && l1 + l2 <= 1; };
        const stacked = lv.length > 1 && lv.slice(1).every((_, k) => {
          const up = tri.filter(t => levelOf((t[0][1] + t[1][1] + t[2][1]) / 3) === k + 1), low = tri.filter(t => levelOf((t[0][1] + t[1][1] + t[2][1]) / 3) <= k);
          if (!up.length) return false;
          const over = up.filter(t => { const x = (t[0][0] + t[1][0] + t[2][0]) / 3, z = (t[0][2] + t[1][2] + t[2][2]) / 3; return low.some(l => inside(l, x, z)); }).length;
          return over / up.length >= 0.2;
        });
        if (stacked){ out.lv = lv; out.lb = 0; }
      }
    }
    // salles : liste des acteurs de chacune (16 octets : numéro, position, rotations, paramètres), en-tête principal
    const rooms = [];
    if (cmds[0x04]) for (let i = 0; i < cmds[0x04].n; i++){
      const ro = s + cmds[0x04].addr + i * 8, rs = u32(ro), re = u32(ro + 4), list = [];
      if (re > rs && re <= a.length){
        const rc = header(rs);
        if (rc[0x01]) for (let j = 0; j < rc[0x01].n; j++){
          const o = rs + rc[0x01].addr + j * 16;
          // rotations (Actor_SpawnEntry de z_actor.c) : 9 bits du haut, en degrés ; drapeau du numéro d'acteur (0x8000 pour y,
          // 0x2000 pour z) : valeur brute (un paramètre, pas un angle). Angles : 0x10000 = un tour.
          const id = u16(o), rot = (v, flag) => { const r = (v >> 7) & 0x1FF; return id & flag ? (r > 180 ? r - 360 : r) : Math.round(r * 0x10000 / 360); };
          list.push({ id:id & 0x1FFF, x:s16(o + 2), y:s16(o + 4), z:s16(o + 6), ry:rot(u16(o + 10), 0x8000), rz:rot(u16(o + 12), 0x2000), p:u16(o + 14) });
        }
      }
      rooms.push(list);
    }
    // entrées de la scène (commande 0x06 : apparition et salle de chaque numéro d'entrée)
    const ent = [];
    if (cmds[0x06]) for (let i = 0; i < out.sp.length; i++) ent.push([u8(s + cmds[0x06].addr + i * 2), u8(s + cmds[0x06].addr + i * 2 + 1)]);
    /* trous de grotte (Door_Ana, z_door_ana.c) : vers une sortie de la scène (type 0x300 : liste des sorties), sinon vers une
       entrée de la scène des grottes (((params >> 12) & 7) − 1, à défaut rotation z + 1 ; puis − 1) avec ses « données de
       réapparition » (params & 0xFF, octet signé), par lesquelles 2Ship reconnaît la grotte. ho : [x, y, z, entrée, données] */
    const DOOR_ANA = recipe.actors.indexOf('ACTOR_DOOR_ANA');
    for (const list of rooms) for (const ac of list){
      if (ac.id !== DOOR_ANA) continue;
      if ((ac.p & 0x300) === 0x300){
        if (cmds[0x13]) out.ex.push([u16(s + cmds[0x13].addr + (ac.p & 0x1F) * 2), ac.x, ac.y, ac.z, 0]);
        continue;
      }
      let d = ((ac.p >> 12) & 7) - 1;
      if (d < 0) d = ac.rz + 1;
      if (d >= 1) (out.ho = out.ho || []).push([ac.x, ac.y, ac.z, d - 1, (ac.p & 0xFF) << 24 >> 24]);
    }
    return { out, rooms, tri, ent };
  }

  /* ---------- Checks : acteur de chaque check dans les salles (règles de recipe.loc, voir gen_maps_recipe.mjs) ---------- */
  const ACTOR_ID = {};
  recipe.actors.forEach((n, i) => { ACTOR_ID[n] = i; });
  /* drapeau d'un acteur selon son type (paramètres, décompilation de MM, comme ActorBehavior de 2Ship), par ordre de
     préférence (un drapeau peut revenir chez plusieurs acteurs). Skulltulas d'or cachées : le sol meuble, la caisse, la
     ruche ou le pot passe son numéro de jeton au Skulltula (paramètres « (n << 2) | 0xFF01 ») ; fées dans une bulle :
     drapeau de la bulle (En_Elfbub). */
  const FLAGS = {
    c:{ ACTOR_EN_BOX:p => p & 0x1F, ACTOR_EN_SW:p => (p & 0xFC) >> 2, ACTOR_OBJ_MAKEKINSUTA:p => (p >> 8) & 0x1F,
      ACTOR_OBJ_KIBAKO2:p => (p >> 15) & 1 ? p & 0x1F : -1, ACTOR_OBJ_COMB:p => p & 0x1F, ACTOR_OBJ_TSUBO:p => p & 0x1F },
    k:{ ACTOR_EN_ITEM00:p => (p >> 8) & 0x7F, ACTOR_OBJ_TSUBO:p => (p >> 9) & 0x7F, ACTOR_EN_ELFORG:p => (p & 0xFE00) >> 9,
      ACTOR_ITEM_B_HEART:() => 0x1F, ACTOR_OBJ_KIBAKO:p => (p >> 8) & 0x7F, ACTOR_OBJ_KIBAKO2:p => (p >> 8) & 0x7F,
      ACTOR_OBJ_TARU:p => (p >> 8) & 0x7F, ACTOR_EN_KUSA:p => (p >> 8) & 0x7F, ACTOR_OBJ_FLOWERPOT:p => (p >> 8) & 0x7F,
      ACTOR_OBJ_COMB:p => (p >> 8) & 0x7F },
    s:{ ACTOR_EN_ELFORG:p => (p & 0xFE00) >> 9, ACTOR_EN_ELFBUB:p => (p & 0xFE00) >> 9 },
  };
  const FLAG_ID = {};   // genre → [[numéro d'acteur, fonction], …] (ordre de préférence)
  for (const [k, m] of Object.entries(FLAGS)) FLAG_ID[k] = Object.entries(m).filter(([n]) => ACTOR_ID[n] != null).map(([n, fn]) => [ACTOR_ID[n], fn]);
  // brins d'herbe des touffes (Obj_Grass_Unit, z_obj_grass_unit.c) : motifs (distance, angle), brin gardé si le sol sous lui
  // est à moins de 80 unités de la touffe
  const GRASS_PATTERNS = [
    [[0, 0], [80, 0], [80, 0x2000], [80, 0x4000], [80, 0x6000], [80, 0x8000], [80, 0xA000], [80, 0xC000], [80, 0xE000]],
    [[40, 0x0666], [40, 0x2CCC], [40, 0x5999], [40, 0x8667], [20, 0xC000], [80, 0x1333], [80, 0x4000], [80, 0x6CCC], [80, 0x9334],
      [80, 0xACCD], [80, 0xC667], [60, 0xE000]],
  ];
  // sol le plus haut sous (x, y) à la verticale de (x, z) (comme BgCheck_EntityRaycastFloor) : hauteur exacte sur le triangle
  function floorAt(tri, x, y, z){
    let best = null;
    for (const [[ax, ay, az], [bx, by, bz], [cx, cy, cz]] of tri){
      const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (!d) continue;
      const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
      if (l1 < -1e-6 || l2 < -1e-6 || l1 + l2 > 1 + 1e-6) continue;
      const h = l1 * ay + l2 * by + (1 - l1 - l2) * cy;
      if (h <= y + 1 && (best == null || h > best)) best = h;
    }
    return best;
  }
  const grassCache = {};
  function grassOf(scene, room){
    const key = scene + '#' + room;
    if (grassCache[key]) return grassCache[key];
    const R = RAW[scene], out = [], unit = ACTOR_ID.ACTOR_OBJ_GRASS_UNIT;
    for (const ac of (R && R.rooms[room]) || []){
      if (ac.id !== unit) continue;
      for (const [dist, ang] of GRASS_PATTERNS[ac.p & 1]){
        const t = (ac.ry + ang) * Math.PI / 0x8000, x = ac.x + Math.cos(t) * dist, z = ac.z + Math.sin(t) * dist;
        const fy = floorAt(R.tri, x, ac.y + 100, z);
        if (fy != null && Math.abs(fy - ac.y) < 80) out.push([Math.round(x), Math.round(fy), Math.round(z)]);
      }
    }
    return (grassCache[key] = out);
  }
  // scène et ses variantes (les variantes partagent les checks de la scène d'origine)
  const withVariants = scene => [scene, ...(recipe.variants[scene] || [])];
  function locate(rule){
    const [k, scene] = rule;
    if (k === 'i'){
      const [, , room, n, actor] = rule, ac = RAW[scene] && RAW[scene].rooms[room] && RAW[scene].rooms[room][n];
      if (!ac || (actor && ac.id !== ACTOR_ID[actor])) return null;
      return [scene, ac.x, ac.y, ac.z];
    }
    if (k === 'g'){ const g = grassOf(scene, rule[2])[rule[3]]; return g ? [scene, g[0], g[1], g[2]] : null; }
    if (k === 'r'){ const ac = RAW[scene] && (RAW[scene].rooms[rule[2]] || []).find(x => x.id === ACTOR_ID[rule[3]]); return ac ? [scene, ac.x, ac.y, ac.z] : null; }
    const find = tests => {
      for (const [id, ok] of tests) for (const sc of withVariants(scene)){
        const R = RAW[sc];
        if (!R) continue;
        for (const list of R.rooms) for (const ac of list) if (ac.id === id && ok(ac.p)) return [sc, ac.x, ac.y, ac.z];
      }
      return null;
    };
    if (k !== 'a') return find(FLAG_ID[k].map(([id, fn]) => [id, p => fn(p) === rule[2]]));
    // acteur (un parmi plusieurs) ; absent des salles (créé en cours de partie) : celui qui le crée, sur trois niveaux
    let names = [].concat(rule[2]);
    const seen = new Set(names);
    for (let depth = 0; depth < 4 && names.length; depth++){
      const p = find(names.filter(n => ACTOR_ID[n] != null).map(n => [ACTOR_ID[n], () => true]));
      if (p) return p;
      names = names.flatMap(n => (recipe.spawners || {})[n] || []).filter(n => !seen.has(n) && seen.add(n));
    }
    return null;
  }

  const data = { ver:1, scenes:{}, checks:{} }, stats = { scenes:0, floors:0, exits:0, checks:0 };
  const RAW = {};
  const list = recipe.scenes.map((x, i) => x && [i, x[0]]).filter(Boolean);
  for (let k = 0; k < list.length; k++){
    const [num, name] = list[k];
    if (k % 8 === 0) await step('scenes', 0.2 + 0.8 * k / list.length);
    const r = readScene(num);
    if (!r) continue;
    RAW[name] = r;
    data.scenes[name] = r.out;
    stats.scenes++; stats.floors += r.out.f.length / 7; stats.exits += r.out.ex.length;
  }
  // checks : [scène, x, y, z]
  for (const [rc, rule] of Object.entries(recipe.loc || {})){
    const p = locate(rule);
    if (p){ data.checks[rc] = rule[0] === 'a' && !(recipe.exact || []).includes(rc) ? [...p, 1] : p; stats.checks++; }
  }
  // à défaut : la position d'un voisin de la même famille
  for (const [rc, sib] of Object.entries(recipe.alt || {})) if (!data.checks[rc] && data.checks[sib]){ data.checks[rc] = [...data.checks[sib].slice(0, 4), 1]; stats.checks++; }
  // salle d'un boss (réceptacle, restes : ils n'apparaissent qu'après le combat) : la place du boss
  for (const [rc, rule] of Object.entries(recipe.loc || {})){
    const sc = rule[1];
    if (data.checks[rc] || !/_BS$/.test(sc) || !RAW[sc]) continue;
    const boss = RAW[sc].rooms.flat().find(ac => /^ACTOR_BOSS_/.test(recipe.actors[ac.id]));
    if (boss){ data.checks[rc] = [sc, boss.x, boss.y, boss.z, 1]; stats.checks++; }
  }
  /* Grottes (SCENE_KAKUSIANA) : une carte par salle (les salles sont côte à côte, loin les unes des autres) —
     « SCENE_KAKUSIANA#n » : sols, murs, eau, sorties et checks de la salle (la plus proche : boîte de ses acteurs et de ses
     apparitions). grottoRooms : numéro d'entrée de la scène des grottes → salle (trous de grotte des lieux extérieurs). */
  const KAK = RAW.SCENE_KAKUSIANA;
  if (KAK){
    const sp = KAK.out.sp, boxes = KAK.rooms.map((list, r) => {
      const pts = list.map(ac => [ac.x, ac.z]).concat(KAK.ent.filter(e => e[1] === r && sp[e[0]]).map(e => [sp[e[0]][0], sp[e[0]][2]]));
      return pts.length ? [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))] : null;
    });
    const roomOf = (x, z) => {
      let best = -1, bd = Infinity;
      boxes.forEach((b, r) => { if (!b) return; const d = Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - z, 0, z - b[3])); if (d < bd){ bd = d; best = r; } });
      return best;
    };
    const subs = {}, sub = r => subs[r] = subs[r] || { b:null, f:[], w:[], wy:[], water:[], sp:[], ex:[] }, o = KAK.out;
    for (let i = 0; i < o.f.length; i += 7) sub(roomOf((o.f[i] + o.f[i + 2] + o.f[i + 4]) / 3, (o.f[i + 1] + o.f[i + 3] + o.f[i + 5]) / 3)).f.push(...o.f.slice(i, i + 7));
    for (let i = 0, j = 0; i < o.w.length; i += 4, j += 2){ const t = sub(roomOf((o.w[i] + o.w[i + 2]) / 2, (o.w[i + 1] + o.w[i + 3]) / 2)); t.w.push(...o.w.slice(i, i + 4)); t.wy.push(o.wy[j], o.wy[j + 1]); }
    for (let i = 0; i < o.water.length; i += 5) sub(roomOf((o.water[i] + o.water[i + 2]) / 2, (o.water[i + 1] + o.water[i + 3]) / 2)).water.push(...o.water.slice(i, i + 5));
    for (const e of o.ex) sub(roomOf(e[1], e[3])).ex.push(e);
    for (const p of o.sp) sub(roomOf(p[0], p[2])).sp.push(p);
    delete data.scenes.SCENE_KAKUSIANA;
    for (const [r, t] of Object.entries(subs)){
      if (!t.f.length) continue;
      const xs = [], zs = [];
      for (let i = 0; i < t.f.length; i += 7) xs.push(t.f[i], t.f[i + 2], t.f[i + 4]), zs.push(t.f[i + 1], t.f[i + 3], t.f[i + 5]);
      t.b = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
      data.scenes['SCENE_KAKUSIANA#' + r] = t;
    }
    for (const p of Object.values(data.checks)) if (p[0] === 'SCENE_KAKUSIANA') p[0] = 'SCENE_KAKUSIANA#' + roomOf(p[1], p[3]);
    data.grottoRooms = KAK.ent.map(e => e[1]);
  }
  await step('done', 1);
  return { data, stats };
}
