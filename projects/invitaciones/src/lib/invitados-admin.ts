import { actualizarCeldas, agregarFila, agregarFilas, eliminarFila, leerTabla } from './sheets';
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

function aAdmin(f: Record<string, string>): InvitadoAdmin {
  const estado = (f['estado'] || 'pendiente').trim().toLowerCase();
  return {
    token: f['token'] ?? '',
    nombre: f['nombre'] ?? '',
    telefono: f['telefono'] ?? '',
    grupo: f['grupo'] ?? '',
    genero: (f['genero'] ?? '').trim().toUpperCase() === 'M' ? 'M' : 'F',
    cupos: Math.max(1, parseInt(f['cupos'] || '1', 10) || 1),
    estado: estado === 'confirmado' || estado === 'no_asiste' ? estado : 'pendiente',
    asistentes: parseInt(f['asistentes'] || '0', 10) || 0,
    restricciones: f['restricciones'] ?? '',
    mensaje: f['mensaje'] ?? '',
    notas: f['notas'] ?? '',
    enviado_at: f['enviado_at'] ?? '',
    abierto_at: f['abierto_at'] ?? '',
    confirmado_at: f['confirmado_at'] ?? '',
  };
}

export async function listarInvitados(): Promise<InvitadoAdmin[]> {
  const { filas } = await leerTabla('INVITADOS');
  return filas.filter((f) => (f['token'] ?? '').trim()).map(aAdmin);
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

function datosNuevos(d: Partial<InvitadoAdmin>): Record<string, string> {
  return {
    token: nuevoToken(),
    nombre: String(d.nombre ?? '').trim().slice(0, 120),
    telefono: normalizarTelefono(String(d.telefono ?? '')),
    grupo: String(d.grupo ?? '').trim().slice(0, 60),
    cupos: String(Math.min(20, Math.max(1, Number(d.cupos) || 1))),
    estado: 'pendiente',
    asistentes: '0',
    genero: d.genero === 'M' ? 'M' : 'F',
    notas: String(d.notas ?? '').slice(0, 300),
  };
}

export async function crearInvitado(d: Partial<InvitadoAdmin>): Promise<string> {
  const fila = datosNuevos(d);
  if (!fila.nombre) throw new Error('El nombre es obligatorio');
  await agregarFila('INVITADOS', fila);
  return fila.token;
}

// Importación masiva: una persona por línea → nombre, teléfono, cupos, grupo (coma, ; o tabulador).
export async function importarInvitados(texto: string): Promise<{ creados: number; omitidas: string[] }> {
  const filas: Record<string, string>[] = [];
  const omitidas: string[] = [];
  for (const linea of texto.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const [nombre, telefono, cupos, grupo] = linea.split(/[,;\t]/).map((x) => x.trim());
    if (!nombre) {
      omitidas.push(linea);
      continue;
    }
    filas.push(datosNuevos({ nombre, telefono, cupos: Number(cupos) || 1, grupo }));
  }
  if (filas.length > 300) throw new Error('Máximo 300 invitados por importación');
  await agregarFilas('INVITADOS', filas);
  return { creados: filas.length, omitidas };
}

export async function actualizarInvitado(token: string, cambios: Record<string, unknown>): Promise<boolean> {
  const { encabezados, filas } = await leerTabla('INVITADOS');
  const f = filas.find((x) => x['token'] === token);
  if (!f) return false;
  const out: Record<string, string> = {};
  for (const k of EDITABLES) {
    if (!(k in cambios)) continue;
    let v = String(cambios[k] ?? '');
    if (k === 'telefono') v = normalizarTelefono(v);
    if (k === 'cupos') v = String(Math.min(20, Math.max(1, Number(v) || 1)));
    if (k === 'genero') v = v === 'M' ? 'M' : 'F';
    if (k === 'estado' && !['pendiente', 'confirmado', 'no_asiste'].includes(v)) continue;
    out[k] = v.slice(0, 500);
  }
  await actualizarCeldas('INVITADOS', encabezados, f._fila, out);
  return true;
}

export async function borrarInvitado(token: string): Promise<boolean> {
  const { filas } = await leerTabla('INVITADOS');
  const f = filas.find((x) => x['token'] === token);
  if (!f) return false;
  await eliminarFila('INVITADOS', f._fila);
  return true;
}
