const { google } = require('googleapis');

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  // GOOGLE_CALENDAR_TOKEN tiene scope calendar+sheets+drive
  // GOOGLE_REFRESH_TOKEN es el token original (solo sheets+drive)
  auth.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_TOKEN || process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getAuth() });
}

async function listarEventos(dias = 7) {
  const cal = getCalendarClient();
  const now = new Date();
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + dias);

  const listRes = await cal.calendarList.list();
  const calendarios = listRes.data.items || [];

  const resultados = await Promise.allSettled(
    calendarios.map(c => cal.events.list({
      calendarId: c.id,
      timeMin: now.toISOString(),
      timeMax: hasta.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
      timeZone: 'America/Guayaquil'
    }).then(r => ({ items: r.data.items || [], calNombre: c.summary })))
  );

  const eventos = [];
  for (const r of resultados) {
    if (r.status !== 'fulfilled') continue;
    for (const e of r.value.items) {
      eventos.push({
        id: e.id,
        titulo: e.summary || '(sin titulo)',
        inicio: e.start?.dateTime || e.start?.date,
        fin: e.end?.dateTime || e.end?.date,
        descripcion: e.description || '',
        calendario: r.value.calNombre,
        allDay: !e.start?.dateTime
      });
    }
  }

  eventos.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  return eventos;
}

async function crearEvento({ titulo, fecha, hora, duracion_min = 60, descripcion = '', todo_el_dia = false }) {
  const cal = getCalendarClient();
  let start, end;
  if (todo_el_dia) {
    start = { date: fecha };
    end = { date: fecha };
  } else {
    const startDt = new Date(`${fecha}T${hora}:00-05:00`);
    const endDt = new Date(startDt.getTime() + duracion_min * 60000);
    start = { dateTime: startDt.toISOString(), timeZone: 'America/Guayaquil' };
    end = { dateTime: endDt.toISOString(), timeZone: 'America/Guayaquil' };
  }
  const res = await cal.events.insert({
    calendarId: 'primary',
    requestBody: { summary: titulo, description: descripcion, start, end }
  });
  return { id: res.data.id, titulo: res.data.summary, inicio: res.data.start?.dateTime || res.data.start?.date };
}

async function eliminarEvento(eventId) {
  const cal = getCalendarClient();
  await cal.events.delete({ calendarId: 'primary', eventId });
  return true;
}

module.exports = { listarEventos, crearEvento, eliminarEvento };
