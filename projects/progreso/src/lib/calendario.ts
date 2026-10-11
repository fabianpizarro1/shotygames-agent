import 'server-only';
import { google, calendar_v3 } from 'googleapis';

// Google Calendar de Fabián. Mismo token y mismas reglas que calendar.js del
// bot de Telegram (raíz de KEPLER): los bloques de la rutina donde se agendan
// tareas están como "disponible" (transparent) y no cuentan como ocupados.

const TZ = 'America/Guayaquil';

function cliente(): calendar_v3.Calendar {
  const token = process.env.GOOGLE_CALENDAR_TOKEN;
  if (!token) throw new Error('Falta GOOGLE_CALENDAR_TOKEN en el servidor');
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: token });
  return google.calendar({ version: 'v3', auth });
}

export interface Evento {
  id: string;
  titulo: string;
  inicio: string;
  fin: string;
  calendario: string;
  todoElDia: boolean;
  libre: boolean;
  descripcion: string;
}

let calendarios: { id: string; nombre: string }[] | null = null;
async function listaCalendarios() {
  calendarios ??= ((await cliente().calendarList.list()).data.items ?? []).map((c) => ({ id: c.id!, nombre: c.summary ?? '' }));
  return calendarios;
}

async function idDe(nombre: string | undefined): Promise<string> {
  if (!nombre) return 'primary';
  return (await listaCalendarios()).find((c) => c.nombre === nombre)?.id ?? 'primary';
}

/** Eventos de días completos en Ecuador, `desde` y `hasta` inclusive. */
export async function eventosEntre(desde: string, hasta: string): Promise<Evento[]> {
  const cal = cliente();
  const lista = await listaCalendarios();
  const res = await Promise.allSettled(
    lista.map((c) =>
      cal.events
        .list({
          calendarId: c.id,
          timeMin: `${desde}T00:00:00-05:00`,
          timeMax: `${hasta}T23:59:59-05:00`,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
          timeZone: TZ,
        })
        .then((r) => ({ items: r.data.items ?? [], nombre: c.nombre }))
    )
  );
  const eventos: Evento[] = [];
  for (const r of res) {
    if (r.status !== 'fulfilled') continue;
    for (const e of r.value.items) {
      eventos.push({
        id: e.id!,
        titulo: e.summary || '(sin título)',
        inicio: e.start?.dateTime || e.start?.date || '',
        fin: e.end?.dateTime || e.end?.date || '',
        calendario: r.value.nombre,
        todoElDia: !e.start?.dateTime,
        libre: e.transparency === 'transparent',
        descripcion: e.description ?? '',
      });
    }
  }
  return eventos.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
}

export async function crearEvento(e: {
  titulo: string;
  fecha: string;
  hora?: string;
  duracionMin?: number;
  descripcion?: string;
  todoElDia?: boolean;
  calendario?: string;
}): Promise<string> {
  let start: calendar_v3.Schema$EventDateTime;
  let end: calendar_v3.Schema$EventDateTime;
  if (e.todoElDia || !e.hora) {
    start = { date: e.fecha };
    end = { date: e.fecha };
  } else {
    const ini = new Date(`${e.fecha}T${e.hora}:00-05:00`);
    const fin = new Date(ini.getTime() + (e.duracionMin ?? 60) * 60_000);
    start = { dateTime: ini.toISOString(), timeZone: TZ };
    end = { dateTime: fin.toISOString(), timeZone: TZ };
  }
  const r = await cliente().events.insert({
    calendarId: await idDe(e.calendario),
    requestBody: { summary: e.titulo, description: e.descripcion ?? '', start, end },
  });
  return r.data.id!;
}

export async function eliminarEvento(id: string, calendario: string): Promise<void> {
  await cliente().events.delete({ calendarId: await idDe(calendario), eventId: id });
}
