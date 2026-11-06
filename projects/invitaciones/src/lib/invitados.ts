import { unstable_cache } from 'next/cache';
import { actualizarCeldas, leerTabla, type Fila } from './sheets';

export type Estado = 'pendiente' | 'confirmado' | 'no_asiste';

export interface Invitado {
  fila: number;
  token: string;
  nombre: string;
  grupo: string;
  genero: 'F' | 'M';
  cupos: number;
  estado: Estado;
  asistentes: number;
  mensaje: string;
}

function aInvitado(f: Fila): Invitado {
  const estado = (f['estado'] || 'pendiente').trim().toLowerCase();
  return {
    fila: f._fila,
    token: f['token'] ?? '',
    nombre: f['nombre'] ?? '',
    grupo: f['grupo'] ?? '',
    genero: (f['genero'] ?? '').trim().toUpperCase() === 'M' ? 'M' : 'F',
    cupos: Math.max(1, parseInt(f['cupos'] || '1', 10) || 1),
    estado: estado === 'confirmado' || estado === 'no_asiste' ? estado : 'pendiente',
    asistentes: parseInt(f['asistentes'] || '0', 10) || 0,
    mensaje: f['mensaje'] ?? '',
  };
}

// La tabla completa se cachea 30 s: una invitación abierta por 100 personas
// a la vez no puede significar 100 lecturas de la API (límite ~60/min).
const tablaCacheada = unstable_cache(
  async () => {
    const { encabezados, filas } = await leerTabla('INVITADOS');
    return { encabezados, invitados: filas.map(aInvitado) };
  },
  ['invitados'],
  { tags: ['invitados'], revalidate: 30 },
);

export async function invitadoPorToken(token: string): Promise<Invitado | null> {
  if (!/^[A-Za-z0-9]{6,32}$/.test(token)) return null;
  const { invitados } = await tablaCacheada();
  return invitados.find((i) => i.token === token) ?? null;
}

// Para escribir se lee fresco (sin caché): la fila pudo moverse desde la última lectura.
export async function confirmarAsistencia(
  token: string,
  d: { estado: Estado; asistentes: number; mensaje: string },
): Promise<Invitado | null> {
  const { encabezados, filas } = await leerTabla('INVITADOS');
  const f = filas.find((x) => x['token'] === token);
  if (!f) return null;
  const inv = aInvitado(f);
  const asistentes = d.estado === 'confirmado' ? Math.min(Math.max(1, d.asistentes), inv.cupos) : 0;
  await actualizarCeldas('INVITADOS', encabezados, f._fila, {
    estado: d.estado,
    asistentes: String(asistentes),
    mensaje: d.mensaje.slice(0, 500),
    confirmado_at: new Date().toISOString(),
  });
  return { ...inv, estado: d.estado, asistentes, mensaje: d.mensaje };
}

export async function marcarAbierto(token: string): Promise<void> {
  const { encabezados, filas } = await leerTabla('INVITADOS');
  const f = filas.find((x) => x['token'] === token);
  if (!f || (f['abierto_at'] ?? '').trim()) return;
  await actualizarCeldas('INVITADOS', encabezados, f._fila, { abierto_at: new Date().toISOString() });
}
