import { getConfig } from '@/lib/config';

// "Agregar al calendario": archivo .ics con el evento (iPhone, Android y Outlook lo abren directo).
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const utc = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');

export async function GET() {
  const c = await getConfig();
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
