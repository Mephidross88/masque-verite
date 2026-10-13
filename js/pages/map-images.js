/* ---------- Carte : fonds en image (export PNG, retouche, import) ----------
   Le fond d'une carte (plan calculé : sol, ombrage, eau, contour, autres étages ; sans les repères, que l'appli dessine
   toujours par-dessus) s'exporte en PNG, un lieu à la fois ou tous dans un .zip. Le joueur peut le retoucher (sans le
   recadrer : la taille peut changer, pas les proportions) et l'importer : l'image remplace alors le plan de ce lieu à cet
   étage (ui.map.img : image ou plan). Chaque PNG porte dans un bloc tEXt « masque-verite » { map, level, view } ; à défaut
   (logiciel qui l'efface), son nom : SCENE_…[-salleN][@étage].png. Images gardées dans ce navigateur (IndexedDB
   masque-verite-map-images), jamais envoyées ni publiées : elles viennent de la ROM du joueur. */

// images importées : « carte|étage » (étage vide : lieu sans étages) → { url (objet blob), view:[x, y, largeur, hauteur], name }
const MAP_IMAGES = reactive({});
const mapImgKey = (base, li) => base + '|' + (li == null ? '' : li);
const MAP_IMG_SIZE = 2048;   // pixels du grand côté à l'export
function mapImgIdb(op, key, value){
  return new Promise((ok, ko) => {
    if (!window.indexedDB) return ko(new Error('indexedDB'));
    const req = indexedDB.open('masque-verite-map-images', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('img');
    req.onerror = () => ko(req.error);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction('img', op === 'all' ? 'readonly' : 'readwrite'), st = tx.objectStore('img');
      let r = null;
      if (op === 'all'){ const out = {}; const cur = st.openCursor(); cur.onsuccess = () => { const c = cur.result; if (c){ out[c.key] = c.value; c.continue(); } }; r = { get result(){ return out; } }; }
      else if (op === 'put') st.put(value, key);
      else if (op === 'delete') st.delete(key);
      else if (op === 'clear') st.clear();
      tx.oncomplete = () => { db.close(); ok(r && r.result); };
      tx.onerror = tx.onabort = () => { db.close(); ko(tx.error || new Error('indexedDB')); };
    };
  });
}
function mapImgSet(key, e){
  if (MAP_IMAGES[key]) URL.revokeObjectURL(MAP_IMAGES[key].url);
  if (e) MAP_IMAGES[key] = { url:URL.createObjectURL(e.blob), view:e.view, name:e.name };
  else delete MAP_IMAGES[key];
}
mapImgIdb('all').then(all => { for (const [k, e] of Object.entries(all || {})) if (e && e.blob) mapImgSet(k, e); })
  .catch(err => console.warn('Images de cartes illisibles :', err));

/* ---------- PNG : bloc tEXt ---------- */
const CRC_TABLE = (() => { const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t; })();
function crc32(bytes, crc = 0xFFFFFFFF){ for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8); return crc; }
const u32be = (b, o, v) => { b[o] = v >>> 24; b[o + 1] = (v >>> 16) & 255; b[o + 2] = (v >>> 8) & 255; b[o + 3] = v & 255; };
// ajoute un bloc tEXt (mot-clé, texte ASCII) juste après l'en-tête IHDR
function pngAddText(png, keyword, text){
  const data = new TextEncoder().encode(keyword + '\0' + text), chunk = new Uint8Array(12 + data.length);
  u32be(chunk, 0, data.length);
  chunk.set([116, 69, 88, 116], 4);   // « tEXt »
  chunk.set(data, 8);
  u32be(chunk, 8 + data.length, (crc32(chunk.subarray(4, 8 + data.length)) ^ 0xFFFFFFFF) >>> 0);
  const at = 33, out = new Uint8Array(png.length + chunk.length);   // signature (8) + IHDR (25)
  out.set(png.subarray(0, at)); out.set(chunk, at); out.set(png.subarray(at), at + chunk.length);
  return out;
}
function pngText(png, keyword){
  if (png.length < 8 || png[1] !== 80 || png[2] !== 78 || png[3] !== 71) return null;
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
  for (let o = 8; o + 12 <= png.length;){
    const len = dv.getUint32(o), type = String.fromCharCode(...png.subarray(o + 4, o + 8));
    if (type === 'tEXt'){ const d = png.subarray(o + 8, o + 8 + len), z = d.indexOf(0);
      if (z > 0 && new TextDecoder().decode(d.subarray(0, z)) === keyword) return new TextDecoder('latin1').decode(d.subarray(z + 1)); }
    if (type === 'IEND') break;
    o += 12 + len;
  }
  return null;
}

/* ---------- Zip (sans compression à l'écriture ; « stored » ou « deflate » à la lecture) ---------- */
function zipWrite(files){   // files : [{ name, data:Uint8Array }] → Blob
  const parts = [], central = [], enc = new TextEncoder();
  let off = 0;
  for (const f of files){
    const name = enc.encode(f.name), crc = (crc32(f.data) ^ 0xFFFFFFFF) >>> 0, h = new Uint8Array(30 + name.length), dv = new DataView(h.buffer);
    dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint32(14, crc, true);
    dv.setUint32(18, f.data.length, true); dv.setUint32(22, f.data.length, true); dv.setUint16(26, name.length, true); h.set(name, 30);
    const c = new Uint8Array(46 + name.length), dc = new DataView(c.buffer);
    dc.setUint32(0, 0x02014b50, true); dc.setUint16(4, 20, true); dc.setUint16(6, 20, true); dc.setUint32(16, crc, true);
    dc.setUint32(20, f.data.length, true); dc.setUint32(24, f.data.length, true); dc.setUint16(28, name.length, true); dc.setUint32(42, off, true); c.set(name, 46);
    parts.push(h, f.data); central.push(c); off += h.length + f.data.length;
  }
  const size = central.reduce((s, c) => s + c.length, 0), end = new Uint8Array(22), de = new DataView(end.buffer);
  de.setUint32(0, 0x06054b50, true); de.setUint16(8, files.length, true); de.setUint16(10, files.length, true);
  de.setUint32(12, size, true); de.setUint32(16, off, true);
  return new Blob([...parts, ...central, end], { type:'application/zip' });
}
async function zipRead(bytes){   // → [{ name, data:Uint8Array }]
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), out = [];
  let e = -1;
  for (let o = bytes.length - 22; o >= Math.max(0, bytes.length - 65557); o--) if (dv.getUint32(o, true) === 0x06054b50){ e = o; break; }
  if (e < 0) throw new Error('zip');
  const n = dv.getUint16(e + 10, true);
  for (let i = 0, o = dv.getUint32(e + 16, true); i < n; i++){
    const method = dv.getUint16(o + 10, true), size = dv.getUint32(o + 20, true), nl = dv.getUint16(o + 28, true), xl = dv.getUint16(o + 30, true), cl = dv.getUint16(o + 32, true);
    const name = new TextDecoder().decode(bytes.subarray(o + 46, o + 46 + nl)), lo = dv.getUint32(o + 42, true);
    o += 46 + nl + xl + cl;
    const at = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), raw = bytes.subarray(at, at + size);
    if (method === 0) out.push({ name, data:raw.slice() });
    else if (method === 8 && typeof DecompressionStream !== 'undefined')
      out.push({ name, data:new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) });
  }
  return out;
}

/* ---------- Export ---------- */
const loadImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
// nom de fichier d'une carte : SCENE_…, salle d'une grotte « -salleN », étage « @i » (numéro interne, 0 : le plus bas)
const mapImgFile = (base, li) => base.replace('#', '-salle') + (li == null ? '' : '@' + li) + '.png';
// fond d'une carte en PNG (couleurs du thème affiché ; transparent hors du sol)
async function mapImgRender(base, li){
  const sc = mapsData.value.scenes[base], g = mapGeo(sc, li), [vx, vy, vw, vh] = g.view, k = MAP_IMG_SIZE / Math.max(vw, vh);
  const cv = document.createElement('canvas');
  cv.width = Math.round(vw * k); cv.height = Math.round(vh * k);
  const c = cv.getContext('2d'), css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  c.setTransform(k, 0, 0, k, -vx * k, -vy * k);
  if (g.ghost){ c.globalAlpha = 0.09; c.fillStyle = css('--text'); c.fill(new Path2D(g.ghost), 'evenodd'); c.globalAlpha = 1; }
  const floor = new Path2D(g.floor);
  c.fillStyle = css('--map-5'); c.fill(floor, 'evenodd');
  if (g.shade){ const img = await loadImg(g.shade); c.save(); c.clip(floor, 'evenodd'); c.drawImage(img, ...g.shadeBox); c.restore(); }
  if (g.water){ c.fillStyle = 'rgba(63, 134, 201, 0.35)'; c.fill(new Path2D(g.water), 'evenodd'); }
  c.lineWidth = g.unit * 0.3; c.lineJoin = 'round'; c.globalAlpha = 0.85; c.strokeStyle = css('--map-wall'); c.stroke(floor); c.globalAlpha = 1;
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  return pngAddText(new Uint8Array(await blob.arrayBuffer()), 'masque-verite', JSON.stringify({ map:base, level:li, view:g.view.map(v => Math.round(v * 100) / 100), v:1 }));
}
function mapImgDownload(blob, name){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

/* ---------- Import ---------- */
// carte et étage d'une image : bloc tEXt, sinon le nom du fichier ; → { key, view } ou null
function mapImgIdentify(name, png){
  const m = mapsData.value;
  let base = null, li = null, view = null;
  try { const j = JSON.parse(pngText(png, 'masque-verite') || 'null'); if (j && j.map){ base = j.map; li = j.level ?? null; view = j.view || null; } } catch (e) {}
  if (!base){
    const f = /(SCENE_[A-Z0-9_]*[A-Z0-9])(?:-salle(\d+))?(?:@(\d+))?/.exec(name.split(/[\\/]/).pop());
    if (f){ base = f[1] + (f[2] != null ? '#' + f[2] : ''); li = f[3] != null ? +f[3] : null; }
  }
  const sc = base && m && m.scenes[base];
  if (!sc) return null;
  if (!sc.lv) li = null;
  else if (li == null || li >= sc.lv.length) return null;
  return { key:mapImgKey(base, li), view:view || mapGeo(sc, li).view };
}

function useMapImages(ctx){
  const { ui } = ctx;
  // étage affiché sur la page Carte (MapView, @level)
  const mapLevel = ref(null);
  const mapImgJob = reactive({ busy:false, part:0, msg:'', ko:false });
  const mapImgHere = computed(() => mapsData.value ? MAP_IMAGES[mapImgKey(ctx.mapBase.value, mapLevel.value)] || null : null);
  const mapImgCount = computed(() => Object.keys(MAP_IMAGES).length);
  async function mapImgExportOne(){
    const base = ctx.mapBase.value, li = mapLevel.value;
    try { mapImgDownload(new Blob([await mapImgRender(base, li)], { type:'image/png' }), mapImgFile(base, li)); }
    catch (e){ Object.assign(mapImgJob, { msg:t('Export impossible : {err}', { err:e.message || e }), ko:true }); }
  }
  async function mapImgExportAll(){
    if (mapImgJob.busy) return;
    const m = mapsData.value, list = [];
    for (const [base, sc] of Object.entries(m.scenes)) for (const li of sc.lv ? sc.lv.map((_, i) => i) : [null]) list.push([base, li]);
    Object.assign(mapImgJob, { busy:true, part:0, msg:'', ko:false });
    try {
      const files = [];
      for (let i = 0; i < list.length; i++){
        files.push({ name:mapImgFile(...list[i]), data:await mapImgRender(...list[i]) });
        mapImgJob.part = (i + 1) / list.length;
        await new Promise(r => setTimeout(r, 0));
      }
      mapImgDownload(zipWrite(files), 'cartes-masque-verite.zip');
      mapImgJob.msg = tn(files.length, '{n} carte exportée.', '{n} cartes exportées.');
    } catch (e){ Object.assign(mapImgJob, { msg:t('Export impossible : {err}', { err:e.message || e }), ko:true }); }
    finally { mapImgJob.busy = false; }
  }
  async function mapImgImport(ev){
    const picked = [...ev.target.files];
    ev.target.value = '';
    if (!picked.length || !mapsData.value) return;
    Object.assign(mapImgJob, { busy:true, part:0, msg:'', ko:false });
    let ok = 0;
    const skipped = [];
    try {
      const pngs = [];
      for (const f of picked){
        const bytes = new Uint8Array(await f.arrayBuffer());
        if (/\.zip$/i.test(f.name)) for (const e of await zipRead(bytes)){ if (/\.png$/i.test(e.name)) pngs.push(e); }
        else pngs.push({ name:f.name, data:bytes });
      }
      for (const p of pngs){
        const id = mapImgIdentify(p.name, p.data);
        if (!id){ skipped.push(p.name.split(/[\\/]/).pop()); continue; }
        const e = { blob:new Blob([p.data], { type:'image/png' }), view:id.view, name:p.name.split(/[\\/]/).pop(), at:Date.now() };
        await mapImgIdb('put', id.key, e);
        mapImgSet(id.key, e);
        ok++;
      }
      mapImgJob.msg = tn(ok, '{n} image importée.', '{n} images importées.')
        + (skipped.length ? ' ' + t('Non reconnues : {list}.', { list:skipped.slice(0, 5).join(', ') + (skipped.length > 5 ? '…' : '') }) : '');
      mapImgJob.ko = !ok;
      if (ok) ui.map.img = true;
    } catch (e){ Object.assign(mapImgJob, { msg:t('Import impossible : {err}', { err:e.message || e }), ko:true }); }
    finally { mapImgJob.busy = false; }
  }
  async function mapImgRemoveHere(){
    const key = mapImgKey(ctx.mapBase.value, mapLevel.value);
    try { await mapImgIdb('delete', key); } catch (e) {}
    mapImgSet(key, null);
  }
  async function mapImgClearAsk(){
    if (!confirm(t('Retirer toutes les images de cartes importées ({n}) ?', { n:mapImgCount.value }))) return;
    try { await mapImgIdb('clear'); } catch (e) {}
    for (const k of Object.keys(MAP_IMAGES)) mapImgSet(k, null);
  }
  return { mapLevel, mapImgJob, mapImgHere, mapImgCount, mapImgExportOne, mapImgExportAll, mapImgImport, mapImgRemoveHere, mapImgClearAsk };
}
