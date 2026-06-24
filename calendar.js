const { google } = require('googleapis');

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

function getCalendar() {
  return google.calendar({ version: 'v3', auth: getAuth() });
}

// Lista eventos próximos (por defecto los próximos 7 días)
async function listarEventos(dias = 7) {
  const cal = getCalendar();
  const now = new Date();
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + dias);

  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: hasta.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20,
    timeZone: 'America/Guayaquil'
  });

  return (res.data.items || []).map(e => ({
    id: e.id,
    titulo: e.summary || '(sin título)',
    inicio: e.start?.dateTime || e.start?.date,
    fin: e.end?.dateTime || e.end?.date,
    descripcion: e.description || '',
    allDay: !e.start?.dateTime
  }));
}

// Crea un evento en Google Calendar
async function crearEvento({ titulo, fecha, hora, duracion_min = 60, descripcion = '', todo_el_dia = false }) {
  const cal = getCalendar();

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

// Elimina un evento por ID
async function eliminarEvento(eventId) {
  const cal = getCalendar();
  await cal.events.delete({ calendarId: 'primary', eventId });
  return true;
}

module.exports = { listarEventos, crearEvento, eliminarEvento };
