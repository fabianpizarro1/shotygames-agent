import { db, type InvitadoDb } from './db';

export type Estado = 'pendiente' | 'confirmado' | 'no_asiste';

// Lo que la página pública necesita saber de un invitado.
export interface Invitado {
  evento_id: string;
  token: string;
  nombre: string;
  grupo: string;
  genero: 'F' | 'M';
  cupos: number;
  estado: Estado;
  asistentes: number;
  mensaje: string;
}

const aPublico = (i: InvitadoDb): Invitado => ({
  evento_id: i.evento_id,
  token: i.token,
  nombre: i.nombre,
  grupo: i.grupo,
  genero: i.genero,
  cupos: Math.max(1, i.cupos),
  estado: i.estado,
  asistentes: i.asistentes,
  mensaje: i.mensaje,
});

export async function invitadoPorToken(token: string): Promise<Invitado | null> {
  if (!/^[A-Za-z0-9]{6,32}$/.test(token)) return null;
  const i = await db().invitadoPorToken(token);
  return i ? aPublico(i) : null;
}

export async function confirmarAsistencia(
  token: string,
  d: { estado: Estado; asistentes: number; mensaje: string },
): Promise<Invitado | null> {
  const inv = await db().invitadoPorToken(token);
  if (!inv) return null;
  const asistentes = d.estado === 'confirmado' ? Math.min(Math.max(1, d.asistentes), Math.max(1, inv.cupos)) : 0;
  const nuevo = await db().parchearInvitado(token, {
    estado: d.estado,
    asistentes,
    mensaje: d.mensaje.slice(0, 500),
    confirmado_at: new Date().toISOString(),
  });
  await db().registrar({ evento_id: inv.evento_id, token, tipo: d.estado === 'confirmado' ? 'confirmo' : 'no_asiste', at: new Date().toISOString() });
  return nuevo ? aPublico(nuevo) : null;
}

export async function marcarAbierto(token: string): Promise<void> {
  const inv = await db().invitadoPorToken(token);
  if (!inv) return;
  // Se registra cada apertura (para estadísticas); la primera además queda en abierto_at.
  await db().registrar({ evento_id: inv.evento_id, token, tipo: 'abierto', at: new Date().toISOString() });
  if (!inv.abierto_at) await db().parchearInvitado(token, { abierto_at: new Date().toISOString() });
}
