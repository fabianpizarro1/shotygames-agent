import { db, type InvitadoDb } from './db';
import { nuevoToken } from './tokens';

export interface InvitadoAdmin {
  token: string;
  nombre: string;
  telefono: string;
  grupo: string;
  genero: 'F' | 'M';
  cupos: number;
  estado: 'pendiente' | 'confirmado' | 'no_asiste';
  asistentes: number;
  restricciones: string;
  mensaje: string;
  notas: string;
  enviado_at: string;
  abierto_at: string;
  confirmado_at: string;
}

const EDITABLES = ['nombre', 'telefono', 'grupo', 'genero', 'cupos', 'estado', 'asistentes', 'restricciones', 'mensaje', 'notas', 'enviado_at'] as const;

const aAdmin = (i: InvitadoDb): InvitadoAdmin => ({
  token: i.token,
  nombre: i.nombre,
  telefono: i.telefono,
  grupo: i.grupo,
  genero: i.genero,
  cupos: i.cupos,
  estado: i.estado,
  asistentes: i.asistentes,
  restricciones: i.restricciones,
  mensaje: i.mensaje,
  notas: i.notas,
  enviado_at: i.enviado_at,
  abierto_at: i.abierto_at,
  confirmado_at: i.confirmado_at,
});

export async function listarInvitados(eventoId: string): Promise<InvitadoAdmin[]> {
  return (await db().invitadosDe(eventoId)).map(aAdmin);
}

// Teléfono a formato wa.me de Ecuador: 0967600303 -> 593967600303.
export function normalizarTelefono(t: string): string {
  const d = t.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('593')) return d;
  if (d.startsWith('0')) return '593' + d.slice(1);
  if (d.length === 9) return '593' + d;
  return d;
}

function nuevo(eventoId: string, d: Partial<InvitadoAdmin>): InvitadoDb {
  return {
    evento_id: eventoId,
    token: nuevoToken(),
    nombre: String(d.nombre ?? '').trim().slice(0, 120),
    telefono: normalizarTelefono(String(d.telefono ?? '')),
    grupo: String(d.grupo ?? '').trim().slice(0, 60),
    genero: d.genero === 'M' ? 'M' : 'F',
    cupos: Math.min(20, Math.max(1, Number(d.cupos) || 1)),
    estado: 'pendiente',
    asistentes: 0,
    restricciones: '',
    mensaje: '',
    notas: String(d.notas ?? '').slice(0, 300),
    enviado_at: '',
    abierto_at: '',
    confirmado_at: '',
  };
}

export async function crearInvitado(eventoId: string, d: Partial<InvitadoAdmin>): Promise<string> {
  const i = nuevo(eventoId, d);
  if (!i.nombre) throw new Error('El nombre es obligatorio');
  await db().crearInvitados([i]);
  return i.token;
}

// Importación masiva: una persona por línea → nombre, teléfono, cupos, grupo (coma, ; o tabulador).
export async function importarInvitados(eventoId: string, texto: string): Promise<{ creados: number; omitidas: string[] }> {
  const lista: InvitadoDb[] = [];
  const omitidas: string[] = [];
  for (const linea of texto.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const [nombre, telefono, cupos, grupo] = linea.split(/[,;\t]/).map((x) => x.trim());
    if (!nombre) {
      omitidas.push(linea);
      continue;
    }
    lista.push(nuevo(eventoId, { nombre, telefono, cupos: Number(cupos) || 1, grupo }));
  }
  if (lista.length > 300) throw new Error('Máximo 300 invitados por importación');
  await db().crearInvitados(lista);
  return { creados: lista.length, omitidas };
}

// Solo se toca un invitado que pertenezca al evento (nunca por token suelto).
async function delEvento(eventoId: string, token: string): Promise<InvitadoDb | null> {
  const i = await db().invitadoPorToken(token);
  return i && i.evento_id === eventoId ? i : null;
}

export async function actualizarInvitado(eventoId: string, token: string, cambios: Record<string, unknown>): Promise<boolean> {
  if (!(await delEvento(eventoId, token))) return false;
  const out: Record<string, string | number> = {};
  for (const k of EDITABLES) {
    if (!(k in cambios)) continue;
    let v = String(cambios[k] ?? '');
    if (k === 'telefono') v = normalizarTelefono(v);
    if (k === 'cupos') out[k] = Math.min(20, Math.max(1, Number(v) || 1));
    else if (k === 'asistentes') out[k] = Math.max(0, parseInt(v, 10) || 0);
    else if (k === 'genero') out[k] = v === 'M' ? 'M' : 'F';
    else if (k === 'estado') {
      if (['pendiente', 'confirmado', 'no_asiste'].includes(v)) out[k] = v;
    } else out[k] = v.slice(0, 500);
  }
  await db().parchearInvitado(token, out as Partial<InvitadoDb>);
  return true;
}

export async function borrarInvitado(eventoId: string, token: string): Promise<boolean> {
  if (!(await delEvento(eventoId, token))) return false;
  return db().borrarInvitado(token);
}
