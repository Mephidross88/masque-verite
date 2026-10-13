/* Lecture de la mémoire d'un processus Windows (kernel32 par le FFI de Bun) : trouver le jeu, son exécutable, son adresse de
   chargement, l'identité du PDB qu'il attend (GUID + âge de l'enregistrement RSDS), lire des octets. Lecture seule : le
   processus est ouvert avec PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, sans aucun droit d'écriture. */
import { dlopen, FFIType } from 'bun:ffi';

const { symbols:K } = dlopen('kernel32.dll', {
  CreateToolhelp32Snapshot:{ args:[FFIType.u32, FFIType.u32], returns:FFIType.ptr },
  Process32FirstW:{ args:[FFIType.ptr, FFIType.ptr], returns:FFIType.i32 },
  Process32NextW:{ args:[FFIType.ptr, FFIType.ptr], returns:FFIType.i32 },
  OpenProcess:{ args:[FFIType.u32, FFIType.i32, FFIType.u32], returns:FFIType.ptr },
  CloseHandle:{ args:[FFIType.ptr], returns:FFIType.i32 },
  K32EnumProcessModules:{ args:[FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns:FFIType.i32 },
  QueryFullProcessImageNameW:{ args:[FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns:FFIType.i32 },
  ReadProcessMemory:{ args:[FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns:FFIType.i32 },
  GetExitCodeProcess:{ args:[FFIType.ptr, FFIType.ptr], returns:FFIType.i32 },
});

// numéro du processus d'un exécutable (PROCESSENTRY32W : th32ProcessID à 8, szExeFile à 44, 568 octets en 64 bits) ; 0 : absent
export function findPid(exe){
  const snap = K.CreateToolhelp32Snapshot(2, 0), e = Buffer.alloc(568);
  e.writeUInt32LE(568, 0);
  let pid = 0;
  for (let ok = K.Process32FirstW(snap, e); ok; ok = K.Process32NextW(snap, e)){
    if (e.toString('utf16le', 44, 44 + 520).replace(/\0.*/s, '').toLowerCase() === exe.toLowerCase()){ pid = e.readUInt32LE(8); break; }
  }
  K.CloseHandle(snap);
  return pid;
}

export class Proc {
  constructor(pid){
    this.pid = pid;
    this.h = K.OpenProcess(0x0410, 0, pid);   // PROCESS_QUERY_INFORMATION | PROCESS_VM_READ
    if (!this.h) throw Object.assign(new Error('accès refusé au processus ' + pid), { code:'denied' });
    const mods = new BigUint64Array(1), need = new Uint32Array(1);
    if (!K.K32EnumProcessModules(this.h, mods, 8, need)) throw Object.assign(new Error('module principal introuvable'), { code:'denied' });
    this.base = mods[0];   // le premier module est l'exécutable
    const name = Buffer.alloc(2 * 1024), len = new Uint32Array([1024]);
    this.path = K.QueryFullProcessImageNameW(this.h, 0, name, len) ? name.toString('utf16le', 0, len[0] * 2) : '';
  }
  close(){ if (this.h){ K.CloseHandle(this.h); this.h = null; } }
  alive(){ const c = new Uint32Array(1); return !!this.h && K.GetExitCodeProcess(this.h, c) && c[0] === 259; }   // STILL_ACTIVE
  // octets à une adresse absolue (BigInt) ; null si la lecture échoue
  read(addr, size){
    const b = Buffer.alloc(size), n = new BigUint64Array(1);
    return K.ReadProcessMemory(this.h, BigInt(addr), b, BigInt(size), n) ? b : null;
  }
  ptr(addr){ const b = this.read(addr, 8); return b ? b.readBigUInt64LE(0) : 0n; }
  // identité du PDB attendu par l'exécutable : enregistrement RSDS du répertoire de débogage (GUID + âge)
  pdbId(){
    const hdr = this.read(this.base, 0x1000);
    if (!hdr) return null;
    const opt = hdr.readUInt32LE(0x3C) + 24, dbgRva = hdr.readUInt32LE(opt + 112 + 6 * 8), dbgSize = hdr.readUInt32LE(opt + 112 + 6 * 8 + 4);
    const dir = this.read(this.base + BigInt(dbgRva), dbgSize);
    for (let o = 0; dir && o + 28 <= dir.length; o += 28) if (dir.readUInt32LE(o + 12) === 2){
      const cv = this.read(this.base + BigInt(dir.readUInt32LE(o + 20)), 24);
      if (cv && cv.toString('latin1', 0, 4) === 'RSDS') return cv.subarray(4, 20).toString('hex') + ':' + cv.readUInt32LE(20);
    }
    return null;
  }
}
