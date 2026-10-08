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
     ex:[[entrée, x, y, z, rayon], …] (sorties) } */
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
    for (let i = 0; i < np; i++){
      const o = pp + i * 16, type = u16(o), v = [u16(o + 2) & 0x1FFF, u16(o + 4) & 0x1FFF, u16(o + 6) & 0x1FFF].map(V);
      const ny = s16(o + 10) / 0x7FFF, exit = (u32(pst + type * 8) >> 8) & 0x1F;
      if (exit) (zones[exit] = zones[exit] || []).push(...v);
      if (ny > 0.2){
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
    for (const [k, pts] of Object.entries(zones)){
      if (!cmds[0x13]) break;
      const entr = u16(s + cmds[0x13].addr + (k - 1) * 2);
      const c = [0, 1, 2].map(j => Math.round(pts.reduce((t, p) => t + p[j], 0) / pts.length));
      const r = Math.round(Math.max(...pts.map(p => Math.hypot(p[0] - c[0], p[2] - c[2]))));
      out.ex.push([entr, c[0], c[1], c[2], r]);
    }
    if (!isFinite(x0)) return null;
    out.b = [x0, z0, x1, z1];
    return out;
  }

  const data = { ver:1, scenes:{} }, stats = { scenes:0, floors:0, exits:0 };
  const list = recipe.scenes.map((x, i) => x && [i, x[0]]).filter(Boolean);
  for (let k = 0; k < list.length; k++){
    const [num, name] = list[k];
    if (k % 8 === 0) await step('scenes', 0.2 + 0.8 * k / list.length);
    const sc = readScene(num);
    if (!sc) continue;
    data.scenes[name] = sc;
    stats.scenes++; stats.floors += sc.f.length / 7; stats.exits += sc.ex.length;
  }
  await step('done', 1);
  return { data, stats };
}
