import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Archivo, CancionDb, Db, Evento, FotoDb, InvitadoDb, LogDb, Usuario } from './types';

// Adaptador local: un archivo JSON en .data/ (fuera de git). Sirve para desarrollar y probar sin
// cuentas externas. Escrituras en cola (una a la vez) y con renombrado atómico.

interface Datos {
  usuarios: Usuario[];
  eventos: Evento[];
  invitados: InvitadoDb[];
  logs: LogDb[];
  fotos: FotoDb[];
  canciones: CancionDb[];
}

const VACIO = (): Datos => ({ usuarios: [], eventos: [], invitados: [], logs: [], fotos: [], canciones: [] });
const ARCHIVO = path.join(process.cwd(), '.data', 'db.json');
const CARPETA_ARCHIVOS = path.join(process.cwd(), '.data', 'files');
const ID_ARCHIVO = /^[A-Za-z0-9-]{8,60}$/;

export function crearAdaptadorLocal(): Db {
  let cache: Datos | null = null;
  let cola: Promise<unknown> = Promise.resolve();

  async function cargar(): Promise<Datos> {
    if (cache) return cache;
    try {
      cache = { ...VACIO(), ...(JSON.parse(await readFile(ARCHIVO, 'utf8')) as Partial<Datos>) };
    } catch {
      cache = VACIO();
    }
    return cache;
  }

  // Cambios en serie: cada mutación espera a la anterior y guarda el archivo completo.
  function mutar<T>(fn: (d: Datos) => T): Promise<T> {
    const paso = cola.then(async () => {
      const d = await cargar();
      const r = fn(d);
      await mkdir(path.dirname(ARCHIVO), { recursive: true });
      const tmp = `${ARCHIVO}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(d, null, 2));
      await rename(tmp, ARCHIVO);
      return r;
    });
    cola = paso.catch(() => undefined);
    return paso;
  }

  const copia = <T,>(x: T): T => structuredClone(x);

  return {
    async usuarioPorEmail(email) {
      return copia((await cargar()).usuarios.find((u) => u.email === email.toLowerCase()) ?? null);
    },
    async usuarioPorId(id) {
      return copia((await cargar()).usuarios.find((u) => u.id === id) ?? null);
    },
    async crearUsuario(u) {
      await mutar((d) => void d.usuarios.push({ ...u, email: u.email.toLowerCase() }));
    },

    async eventoPorId(id) {
      return copia((await cargar()).eventos.find((e) => e.id === id) ?? null);
    },
    async eventoPorSlug(slug) {
      return copia((await cargar()).eventos.find((e) => e.slug === slug) ?? null);
    },
    async eventosDe(duenoId) {
      return copia((await cargar()).eventos.filter((e) => e.dueno_id === duenoId));
    },
    async crearEvento(e) {
      await mutar((d) => {
        if (d.eventos.some((x) => x.slug === e.slug)) throw new Error('Ese enlace ya está en uso');
        d.eventos.push(e);
      });
    },
    async parchearEvento(id, parche) {
      return mutar((d) => {
        const e = d.eventos.find((x) => x.id === id);
        if (!e) return null;
        Object.assign(e, parche);
        return copia(e);
      });
    },

    async invitadosDe(eventoId) {
      return copia((await cargar()).invitados.filter((i) => i.evento_id === eventoId));
    },
    async invitadoPorToken(token) {
      return copia((await cargar()).invitados.find((i) => i.token === token) ?? null);
    },
    async crearInvitados(lista) {
      await mutar((d) => void d.invitados.push(...lista));
    },
    async parchearInvitado(token, parche) {
      return mutar((d) => {
        const i = d.invitados.find((x) => x.token === token);
        if (!i) return null;
        Object.assign(i, parche);
        return copia(i);
      });
    },
    async borrarInvitado(token) {
      return mutar((d) => {
        const n = d.invitados.length;
        d.invitados = d.invitados.filter((i) => i.token !== token);
        return d.invitados.length < n;
      });
    },

    async fotosDe(eventoId) {
      return copia((await cargar()).fotos.filter((f) => f.evento_id === eventoId));
    },
    async crearFoto(f) {
      await mutar((d) => void d.fotos.push(f));
    },
    async parchearFoto(id, parche) {
      return mutar((d) => {
        const f = d.fotos.find((x) => x.id === id);
        if (!f) return false;
        Object.assign(f, parche);
        return true;
      });
    },
    async borrarFoto(id) {
      return mutar((d) => {
        const f = d.fotos.find((x) => x.id === id) ?? null;
        if (f) d.fotos = d.fotos.filter((x) => x.id !== id);
        return f ? copia(f) : null;
      });
    },

    async cancionesDe(eventoId) {
      return copia((await cargar()).canciones.filter((c) => c.evento_id === eventoId));
    },
    async crearCancion(c) {
      await mutar((d) => void d.canciones.push(c));
    },
    async parchearCancion(id, parche) {
      return mutar((d) => {
        const c = d.canciones.find((x) => x.id === id);
        if (!c) return false;
        Object.assign(c, parche);
        return true;
      });
    },
    async borrarCancion(id) {
      return mutar((d) => {
        const n = d.canciones.length;
        d.canciones = d.canciones.filter((c) => c.id !== id);
        return d.canciones.length < n;
      });
    },

    async guardarArchivo(a: Archivo) {
      if (!ID_ARCHIVO.test(a.id)) throw new Error('Id de archivo inválido');
      await mkdir(CARPETA_ARCHIVOS, { recursive: true });
      await writeFile(path.join(CARPETA_ARCHIVOS, `${a.id}.bin`), a.bytes);
      await writeFile(path.join(CARPETA_ARCHIVOS, `${a.id}.json`), JSON.stringify({ evento_id: a.evento_id, mime: a.mime }));
    },
    async leerArchivo(id) {
      if (!ID_ARCHIVO.test(id)) return null;
      try {
        const meta = JSON.parse(await readFile(path.join(CARPETA_ARCHIVOS, `${id}.json`), 'utf8')) as { evento_id: string; mime: string };
        return { id, evento_id: meta.evento_id, mime: meta.mime, bytes: new Uint8Array(await readFile(path.join(CARPETA_ARCHIVOS, `${id}.bin`))) };
      } catch {
        return null;
      }
    },
    async borrarArchivo(id) {
      if (!ID_ARCHIVO.test(id)) return;
      await rm(path.join(CARPETA_ARCHIVOS, `${id}.bin`), { force: true });
      await rm(path.join(CARPETA_ARCHIVOS, `${id}.json`), { force: true });
    },

    async registrar(l) {
      await mutar((d) => void d.logs.push(l));
    },
    async logsDe(eventoId) {
      return copia((await cargar()).logs.filter((l) => l.evento_id === eventoId));
    },
  };
}
