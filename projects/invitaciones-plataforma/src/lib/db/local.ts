import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Db, Evento, InvitadoDb, LogDb, Usuario } from './types';

// Adaptador local: un archivo JSON en .data/ (fuera de git). Sirve para desarrollar y probar sin
// cuentas externas. Escrituras en cola (una a la vez) y con renombrado atómico.

interface Datos {
  usuarios: Usuario[];
  eventos: Evento[];
  invitados: InvitadoDb[];
  logs: LogDb[];
}

const VACIO = (): Datos => ({ usuarios: [], eventos: [], invitados: [], logs: [] });
const ARCHIVO = path.join(process.cwd(), '.data', 'db.json');

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

    async registrar(l) {
      await mutar((d) => void d.logs.push(l));
    },
    async logsDe(eventoId) {
      return copia((await cargar()).logs.filter((l) => l.evento_id === eventoId));
    },
  };
}
