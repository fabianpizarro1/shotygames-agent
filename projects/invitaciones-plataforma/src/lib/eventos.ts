import { randomUUID } from 'node:crypto';
import { db, type Evento, type Usuario } from './db';
import { plantillaPorSlug } from './plantillas';

const limpiarSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'evento';

export async function crearEvento(u: Usuario, d: { nombre: string; plantilla: string; festejado?: string }): Promise<Evento> {
  const nombre = d.nombre.trim().slice(0, 80);
  if (!nombre) throw new Error('Ponle un nombre a tu evento');
  const plantilla = plantillaPorSlug(d.plantilla);
  const config: Record<string, string> = { nombre_evento: nombre };
  if (d.festejado?.trim()) config.festejado = d.festejado.trim().slice(0, 60);
  // Fechas de ejemplo (en hora de Ecuador) para que la cuenta regresiva y la vista previa se vean bien desde el primer momento.
  const en = (dias: number, hora: number) => {
    const d = new Date(Date.now() + dias * 86400_000 - 5 * 3600_000);
    return `${d.toISOString().slice(0, 10)}T${String(hora).padStart(2, '0')}:00:00-05:00`;
  };
  config.fecha_hora = en(30, 15);
  config.fecha_limite_rsvp = en(24, 23);
  // El enlace público lleva un sufijo corto para que no choquen dos "cumple-de-ana".
  const slug = `${limpiarSlug(nombre)}-${randomUUID().slice(0, 4)}`;
  const e: Evento = {
    id: randomUUID(),
    dueno_id: u.id,
    plantilla: plantilla.slug,
    slug,
    nombre,
    config,
    estado: 'borrador',
    plan: '',
    publicado_at: '',
    expira_at: '',
    creado_at: new Date().toISOString(),
  };
  await db().crearEvento(e);
  return e;
}

// Publicar = la invitación se vuelve visible para los invitados con enlace. El cobro se conecta después
// (PayPhone); mientras tanto cualquier dueño puede publicar y el plan queda anotado.
export async function publicarEvento(id: string, plan: string): Promise<Evento | null> {
  const ahora = new Date();
  const vence = new Date(ahora);
  vence.setMonth(vence.getMonth() + 6);
  return db().parchearEvento(id, { estado: 'publicado', plan, publicado_at: ahora.toISOString(), expira_at: vence.toISOString() });
}

export async function despublicarEvento(id: string): Promise<Evento | null> {
  return db().parchearEvento(id, { estado: 'borrador' });
}

export interface Estadisticas {
  invitados: number;
  personasInvitadas: number;
  enviados: number;
  abiertos: number;
  confirmados: number;
  noAsisten: number;
  pendientes: number;
  asistentes: number;
  tasaApertura: number; // 0-100 sobre los enviados (o sobre todos si aún no se marcó ninguno como enviado)
  tasaConfirmacion: number; // 0-100 sobre los invitados
  dias: { dia: string; abiertos: number; confirmaciones: number }[];
  sinAbrir: { nombre: string; token: string; telefono: string }[];
}

export async function estadisticasDe(eventoId: string): Promise<Estadisticas> {
  const [inv, logs] = await Promise.all([db().invitadosDe(eventoId), db().logsDe(eventoId)]);
  const enviados = inv.filter((i) => i.enviado_at).length;
  const abiertos = inv.filter((i) => i.abierto_at).length;
  const confirmados = inv.filter((i) => i.estado === 'confirmado').length;
  const noAsisten = inv.filter((i) => i.estado === 'no_asiste').length;
  const base = enviados || inv.length;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

  // Últimos 14 días en hora de Ecuador (UTC-5).
  const dia = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600_000).toISOString().slice(0, 10);
  const hoy = dia(new Date().toISOString());
  const dias = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(new Date(hoy + 'T12:00:00Z').getTime() - (13 - k) * 86400_000).toISOString().slice(0, 10);
    return { dia: d, abiertos: 0, confirmaciones: 0 };
  });
  const porDia = new Map(dias.map((d) => [d.dia, d]));
  for (const l of logs) {
    const d = porDia.get(dia(l.at));
    if (!d) continue;
    if (l.tipo === 'abierto') d.abiertos++;
    if (l.tipo === 'confirmo' || l.tipo === 'no_asiste') d.confirmaciones++;
  }

  return {
    invitados: inv.length,
    personasInvitadas: inv.reduce((s, i) => s + Math.max(1, i.cupos), 0),
    enviados,
    abiertos,
    confirmados,
    noAsisten,
    pendientes: inv.length - confirmados - noAsisten,
    asistentes: inv.filter((i) => i.estado === 'confirmado').reduce((s, i) => s + i.asistentes, 0),
    tasaApertura: pct(abiertos, base),
    tasaConfirmacion: pct(confirmados, inv.length),
    dias,
    sinAbrir: inv.filter((i) => i.enviado_at && !i.abierto_at).map((i) => ({ nombre: i.nombre, token: i.token, telefono: i.telefono })),
  };
}
