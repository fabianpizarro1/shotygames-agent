import { configDeEvento } from '@/lib/config';
import { db } from '@/lib/db';

// "Agregar al calendario": archivo .ics con el evento (iPhone, Android y Outlook lo abren directo).
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const utc = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');

export async function GET(req: Request) {
  // ?t=<token del invitado> o ?e=<slug del evento publicado>
  const q = new URL(req.url).searchParams;
  const inv = q.get('t') ? await db().invitadoPorToken(q.get('t') as string) : null;
  const evento = inv ? await db().eventoPorId(inv.evento_id) : q.get('e') ? await db().eventoPorSlug(q.get('e') as string) : null;
  if (!evento || evento.estado !== 'publicado') return new Response('No encontrado', { status: 404 });
  const c = configDeEvento(evento);
  const inicio = new Date(c.fecha_hora);
  if (Number.isNaN(inicio.getTime())) return new Response('Fecha inválida', { status: 500 });
  const fin = new Date(inicio.getTime() + 5 * 3600_000);
  const cuerpo = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invitacion//ES',
    'BEGIN:VEVENT',
    `UID:${utc(inicio)}@invitacion`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(inicio)}`,
    `DTEND:${utc(fin)}`,
    `SUMMARY:${esc(c.nombre_evento)}`,
    `LOCATION:${esc([c.lugar_nombre, c.lugar_direccion].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${esc(`Dress code: ${c.dresscode_titulo}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="cumpleanos.ics"' },
  });
}
