/* Lecteur minimal de PDB (format MSF 7.00 de Microsoft) : identité (GUID + âge, comparés à ceux de l'exécutable), variables
   globales (S_GDATA32 / S_LDATA32 / S_PUB32 → adresse relative, RVA) et types (flux TPI : structures, unions, tableaux,
   pointeurs, énumérations) pour connaître la disposition des champs en mémoire. Juste ce qu'il faut pour les variables C
   du jeu ; références : llvm/docs/PDB, microsoft-pdb (cvinfo.h). */
import fs from 'fs';

const MSF_MAGIC = 'Microsoft C/C++ MSF 7.00\r\n\x1aDS\0\0\0';

// types primitifs (index < 0x1000) : [taille, genre de lecture]
const PRIM = {
  0x03:[0, 'void'], 0x10:[1, 'i8'], 0x20:[1, 'u8'], 0x70:[1, 'i8'], 0x68:[1, 'i8'], 0x69:[1, 'u8'], 0x30:[1, 'bool'],
  0x11:[2, 'i16'], 0x21:[2, 'u16'], 0x72:[2, 'i16'], 0x73:[2, 'u16'], 0x71:[2, 'u16'], 0x7a:[2, 'u16'],
  0x12:[4, 'i32'], 0x22:[4, 'u32'], 0x74:[4, 'i32'], 0x75:[4, 'u32'], 0x40:[4, 'f32'], 0x7b:[4, 'u32'],
  0x13:[8, 'i64'], 0x23:[8, 'u64'], 0x76:[8, 'i64'], 0x77:[8, 'u64'], 0x41:[8, 'f64'],
};

// lecture d'un primitif (genre : PRIM) dans des octets
export function readPrim(buf, off, read){
  switch (read){
    case 'bool': return !!buf[off];
    case 'u8': return buf.readUInt8(off); case 'i8': return buf.readInt8(off);
    case 'u16': return buf.readUInt16LE(off); case 'i16': return buf.readInt16LE(off);
    case 'u32': return buf.readUInt32LE(off); case 'i32': return buf.readInt32LE(off);
    case 'u64': return Number(buf.readBigUInt64LE(off)); case 'i64': return Number(buf.readBigInt64LE(off));
    case 'f32': return buf.readFloatLE(off); case 'f64': return buf.readDoubleLE(off);
  }
  return 0;
}

export class Pdb {
  constructor(file){
    const b = this.buf = fs.readFileSync(file);
    if (b.toString('latin1', 0, 32) !== MSF_MAGIC) throw new Error('pas un PDB (MSF 7.00) : ' + file);
    const bs = this.bs = b.readUInt32LE(32), dirBytes = b.readUInt32LE(44), mapAddr = b.readUInt32LE(52);
    // répertoire des flux : ses blocs sont listés au bloc mapAddr
    const nDir = Math.ceil(dirBytes / bs), dir = this.blocks([...Array(nDir)].map((_, i) => b.readUInt32LE(mapAddr * bs + i * 4)), dirBytes);
    const n = dir.readUInt32LE(0);
    let p = 4 + n * 4;
    this.streams = [];
    for (let i = 0; i < n; i++){
      let size = dir.readUInt32LE(4 + i * 4);
      if (size === 0xFFFFFFFF) size = 0;
      const nb = Math.ceil(size / bs), list = [];
      for (let k = 0; k < nb; k++, p += 4) list.push(dir.readUInt32LE(p));
      this.streams.push({ size, list });
    }
    this.info();
    this.dbi();
    this.tpi();
  }
  blocks(list, size){ return Buffer.concat(list.map(k => this.buf.subarray(k * this.bs, (k + 1) * this.bs))).subarray(0, size); }
  stream(i){ const s = this.streams[i]; return this.blocks(s.list, s.size); }

  // flux 1 : GUID (l'âge qui compte est celui du flux DBI)
  info(){ const s = this.stream(1); this.guid = s.subarray(12, 28); }

  // flux 3 (DBI) : âge, flux des symboles, en-têtes de sections (RVA)
  dbi(){
    const s = this.stream(3);
    this.age = s.readUInt32LE(8);
    const symStream = s.readUInt16LE(20);
    const sizes = [24, 28, 32, 36, 40].map(o => s.readInt32LE(o)), ec = s.readInt32LE(52), dbgSize = s.readInt32LE(48);
    const dbgAt = 64 + sizes.reduce((a, x) => a + x, 0) + ec;
    const dbg = [...Array(dbgSize >> 1)].map((_, i) => s.readUInt16LE(dbgAt + i * 2));
    const sh = this.stream(dbg[5]);
    this.sections = [...Array(sh.length / 40 | 0)].map((_, i) => ({ name:sh.toString('latin1', i * 40, i * 40 + 8).replace(/\0.*/, ''), va:sh.readUInt32LE(i * 40 + 12) }));
    // symboles : variables globales (avec leur type) et symboles publics
    const r = this.stream(symStream);
    this.globals = new Map();
    for (let o = 0; o + 4 <= r.length;){
      const len = r.readUInt16LE(o), kind = r.readUInt16LE(o + 2);
      if (kind === 0x110D || kind === 0x110C || kind === 0x110E){
        const pub = kind === 0x110E, type = pub ? 0 : r.readUInt32LE(o + 4), off = r.readUInt32LE(o + 8), seg = r.readUInt16LE(o + 12);
        const name = r.toString('latin1', o + 14, r.indexOf(0, o + 14));
        const sec = this.sections[seg - 1];
        if (sec && (!this.globals.has(name) || !pub)) this.globals.set(name, { rva:sec.va + off, type, kind });
      }
      o += 2 + len;
    }
  }

  // flux 2 (TPI) : position de chaque enregistrement de type, et définitions complètes par nom
  tpi(){
    const s = this.tpiBuf = this.stream(2);
    const hdr = s.readUInt32LE(4);
    this.tiBegin = s.readUInt32LE(8);
    const end = s.readUInt32LE(12);
    this.recs = new Uint32Array(end - this.tiBegin);
    this.byName = new Map();
    let o = hdr;
    for (let ti = this.tiBegin; ti < end; ti++){
      this.recs[ti - this.tiBegin] = o;
      const kind = s.readUInt16LE(o + 2);
      if (kind === 0x1505 || kind === 0x1504 || kind === 0x1506 || kind === 0x1507){
        const t = this.rawType(ti);
        if (!t.fwd && t.name && !this.byName.has(t.name)) this.byName.set(t.name, ti);
      }
      o += 2 + s.readUInt16LE(o);
    }
  }
  num(o){
    const s = this.tpiBuf, v = s.readUInt16LE(o);
    if (v < 0x8000) return [v, o + 2];
    switch (v){
      case 0x8000: return [s.readInt8(o + 2), o + 3];
      case 0x8001: return [s.readInt16LE(o + 2), o + 4];
      case 0x8002: return [s.readUInt16LE(o + 2), o + 4];
      case 0x8003: return [s.readInt32LE(o + 2), o + 6];
      case 0x8004: return [s.readUInt32LE(o + 2), o + 6];
      case 0x8009: return [Number(s.readBigInt64LE(o + 2)), o + 10];
      case 0x800a: return [Number(s.readBigUInt64LE(o + 2)), o + 10];
    }
    throw new Error('valeur numérique inconnue 0x' + v.toString(16));
  }
  str(o){ const s = this.tpiBuf, e = s.indexOf(0, o); return [s.toString('utf8', o, e), e + 1]; }

  // enregistrement brut d'un type (sans résoudre les déclarations anticipées)
  rawType(ti){
    if (ti < 0x1000){
      const mode = (ti >> 8) & 0xF, base = ti & 0xFF;
      if (mode) return { kind:'pointer', size:mode === 6 ? 8 : 4, to:base };
      const p = PRIM[base];
      return { kind:'prim', size:p ? p[0] : 0, read:p ? p[1] : '?', ti };
    }
    const s = this.tpiBuf, o = this.recs[ti - this.tiBegin], len = s.readUInt16LE(o), kind = s.readUInt16LE(o + 2), d = o + 4;
    switch (kind){
      case 0x1504: case 0x1505: {   // LF_CLASS / LF_STRUCTURE
        const prop = s.readUInt16LE(d + 2), fl = s.readUInt32LE(d + 4);
        const [size, q] = this.num(d + 16), [name] = this.str(q);
        return { kind:'struct', fwd:!!(prop & 0x80), fl, size, name };
      }
      case 0x1506: {                 // LF_UNION
        const prop = s.readUInt16LE(d + 2), fl = s.readUInt32LE(d + 4);
        const [size, q] = this.num(d + 8), [name] = this.str(q);
        return { kind:'union', fwd:!!(prop & 0x80), fl, size, name };
      }
      case 0x1507: {                 // LF_ENUM
        const prop = s.readUInt16LE(d + 2), ut = s.readUInt32LE(d + 4), fl = s.readUInt32LE(d + 8), [name] = this.str(d + 12);
        return { kind:'enum', fwd:!!(prop & 0x80), ut, fl, name };
      }
      case 0x1503: {                 // LF_ARRAY
        const el = s.readUInt32LE(d), [size] = this.num(d + 8);
        return { kind:'array', el, size };
      }
      case 0x1002: return { kind:'pointer', to:s.readUInt32LE(d), size:(s.readUInt32LE(d + 4) >> 13) & 0x3F };
      case 0x1001: return { kind:'modifier', to:s.readUInt32LE(d) };
      case 0x1205: return { kind:'bitfield', to:s.readUInt32LE(d), bits:s[d + 4], pos:s[d + 5] };
      case 0x1203: return { kind:'fieldlist', start:d, end:o + 2 + len };
    }
    return { kind:'other', code:kind };
  }
  // type résolu : modificateurs (const, volatile) retirés, déclaration anticipée remplacée par la définition
  type(ti){
    let t = this.rawType(ti);
    while (t.kind === 'modifier') t = this.rawType(t.to);
    if (t.fwd && this.byName.has(t.name)) t = this.rawType(this.byName.get(t.name));
    return t;
  }
  size(ti){
    const t = this.type(ti);
    if (t.kind === 'enum') return this.size(t.ut);
    if (t.kind === 'bitfield') return this.size(t.to);
    return t.size;
  }
  // champs d'une structure ou d'une union : [{ name, off, type }] (suit LF_INDEX, la suite d'une longue liste)
  fields(ti){
    const t = this.type(ti), out = [];
    for (let fl = t.fl; fl;){
      const L = this.rawType(fl), s = this.tpiBuf;
      fl = 0;
      for (let o = L.start; o < L.end;){
        const k = s.readUInt16LE(o);
        if (k === 0x150D){ const ty = s.readUInt32LE(o + 4), [off, q] = this.num(o + 8), [name, e] = this.str(q); out.push({ name, off, type:ty }); o = e; }
        else if (k === 0x1502){ const [val, q] = this.num(o + 4), [name, e] = this.str(q); out.push({ name, val }); o = e; }
        else if (k === 0x1404){ fl = s.readUInt32LE(o + 4); o += 8; }
        else if (k === 0x150E || k === 0x1510){ const [, e] = this.str(o + 8); o = e; }
        else if (k === 0x1400){ const [, q] = this.num(o + 8); o = q; }
        else throw new Error('membre inconnu 0x' + k.toString(16) + ' dans ' + t.name);
        while (o < L.end && s[o] >= 0xF0) o++;   // bourrage (LF_PAD)
      }
    }
    return out;
  }
  // valeurs d'une énumération : { NOM: valeur }
  enumValues(name){
    const ti = this.byName.get(name);
    if (ti === undefined) throw new Error('énumération introuvable : ' + name);
    return Object.fromEntries(this.fields(ti).map(f => [f.name, f.val]));
  }
  /* position d'un chemin dans un type : 'save.saveInfo.inventory.items[3]' depuis SaveContext → { off, type, size, read }
     (read : genre de lecture du primitif, ou de l'énumération) */
  resolve(typeName, path){
    let ti = typeof typeName === 'number' ? typeName : this.byName.get(typeName), off = 0;
    if (ti === undefined) throw new Error('type introuvable : ' + typeName);
    for (const part of path ? path.match(/[^.[\]]+|\[\d+\]/g) : []){
      const t = this.type(ti);
      if (part[0] === '['){
        if (t.kind !== 'array') throw new Error(path + ' : ' + part + ' sur un non-tableau');
        off += +part.slice(1, -1) * this.size(t.el); ti = t.el;
      } else {
        const f = this.fields(ti).find(x => x.name === part);
        if (!f) throw new Error(path + ' : pas de champ ' + part + ' dans ' + (t.name || t.kind));
        off += f.off; ti = f.type;
      }
    }
    return { off, type:ti, ...this.describe(ti) };
  }
  // description courte d'un type, pour la lecture en mémoire
  describe(ti){
    const t = this.type(ti);
    switch (t.kind){
      case 'prim': return { kind:'prim', size:t.size, read:t.read };
      case 'enum': return { kind:'enum', size:this.size(t.ut), read:this.type(t.ut).read, name:t.name };
      case 'pointer': return { kind:'pointer', size:t.size };
      case 'array': { const es = this.size(t.el); return { kind:'array', size:t.size, count:es ? t.size / es : 0, elSize:es }; }
      case 'bitfield': return { kind:'bitfield', size:this.size(t.to), read:this.type(t.to).read, bits:t.bits, pos:t.pos };
      default: return { kind:t.kind, size:t.size, name:t.name };
    }
  }
  /* valeur d'un type lue dans des octets (comme la sérialisation JSON des sauvegardes de 2Ship) : structure → objet, tableau
     → liste, booléen → true/false, énumération et nombres → nombre ; pick : seulement ces champs ({ champ:1 } ou sous-choix) */
  value(buf, off, ti, pick){
    const t = this.type(ti);
    switch (t.kind){
      case 'prim': return readPrim(buf, off, t.read);
      case 'enum': return readPrim(buf, off, this.type(t.ut).read);
      case 'pointer': return null;
      case 'array': { const es = this.size(t.el), n = es ? t.size / es : 0, out = new Array(n);
        for (let i = 0; i < n; i++) out[i] = this.value(buf, off + i * es, t.el); return out; }
      case 'bitfield': { const v = readPrim(buf, off, this.type(t.to).read); return Number((BigInt(v) >> BigInt(t.pos)) & ((1n << BigInt(t.bits)) - 1n)); }
      case 'struct': case 'union': {
        const out = {};
        for (const f of this.fieldsCached(ti)){
          if (pick && !pick[f.name]) continue;
          out[f.name] = this.value(buf, off + f.off, f.type, pick && pick[f.name] !== 1 ? pick[f.name] : undefined);
        }
        return out;
      }
    }
    return null;
  }
  fieldsCached(ti){ (this.fc ||= new Map()).has(ti) || this.fc.set(ti, this.fields(ti)); return this.fc.get(ti); }
  // type pointé par un pointeur
  pointee(ti){ const t = this.type(ti); if (t.kind !== 'pointer') throw new Error('pas un pointeur'); return t.to; }
  // identité « GUID + âge », comme dans l'enregistrement RSDS de l'exécutable
  get id(){ return this.guid.toString('hex') + ':' + this.age; }
}
