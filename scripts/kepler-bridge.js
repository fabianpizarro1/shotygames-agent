#!/usr/bin/env node
/**
 * kepler-bridge.js — Puente entre Claude Code y los bots de Telegram
 * Usa curl internamente para máxima velocidad (sin overhead de googleapis).
 *
 * Uso: node scripts/kepler-bridge.js <comando> [args...]
 * Output: siempre JSON por stdout
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { execSync } = require('child_process');

const [,, command, ...args] = process.argv;

const ENV = {
  CLIENT_ID:        process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET:    process.env.GOOGLE_CLIENT_SECRET,
  REFRESH_TOKEN:    process.env.GOOGLE_REFRESH_TOKEN,
  CALENDAR_TOKEN:   process.env.GOOGLE_CALENDAR_TOKEN || process.env.GOOGLE_REFRESH_TOKEN,
  SHEETS_PERSONAL:  process.env.SHEETS_ID_PERSONAL,
  SHEETS_OPS:       process.env.SHEETS_ID,
  TG_TOKENS: {
    personal: process.env.TELEGRAM_PERSONAL_TOKEN,
    ops:      process.env.TELEGRAM_BOT_TOKEN,
    conta:    process.env.TELEGRAM_CONTA_TOKEN,
    dropi:    process.env.TELEGRAM_DROPI_TOKEN,
  },
  TG_CHAT_ID: process.env.TELEGRAM_ADMIN_IDS?.split(',')[0],
};

function fetchToken(refreshToken) {
  const res = execSync(
    `curl -s --max-time 10 -X POST "https://oauth2.googleapis.com/token" \
      -d "client_id=${ENV.CLIENT_ID}" \
      -d "client_secret=${ENV.CLIENT_SECRET}" \
      -d "refresh_token=${refreshToken}" \
      -d "grant_type=refresh_token"`
  );
  const data = JSON.parse(res.toString());
  if (!data.access_token) throw new Error('No se pudo obtener access token: ' + JSON.stringify(data));
  return data.access_token;
}

// ── OAuth access tokens (cached per proceso) ─────────────────
let _accessToken = null;
let _calendarToken = null;
function getAccessToken() {
  if (!_accessToken) _accessToken = fetchToken(ENV.REFRESH_TOKEN);
  return _accessToken;
}
function getCalendarToken() {
  if (!_calendarToken) _calendarToken = fetchToken(ENV.CALENDAR_TOKEN);
  return _calendarToken;
}

// ── Sheets helpers ───────────────────────────────────────────
function sheetsGet(sheetId, range) {
  const token = getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = execSync(`curl -s --max-time 10 "${url}" -H "Authorization: Bearer ${token}"`);
  return JSON.parse(res.toString());
}

function sheetsAppend(sheetId, range, values) {
  const token = getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`;
  const body = JSON.stringify({ values });
  const res = execSync(
    `curl -s --max-time 10 -X POST "${url}" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d '${body.replace(/'/g, "'\\''")}'`
  );
  return JSON.parse(res.toString());
}

function sheetsUpdate(sheetId, range, value) {
  const token = getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const body = JSON.stringify({ values: [[value]] });
  const res = execSync(
    `curl -s --max-time 10 -X PUT "${url}" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d '${body}'`
  );
  return JSON.parse(res.toString());
}

// ── Calendar helpers ─────────────────────────────────────────
function calendarGet(params) {
  const token = getCalendarToken();
  const qs = new URLSearchParams(params).toString();
  const res = execSync(
    `curl -s --max-time 10 "https://www.googleapis.com/calendar/v3/calendars/primary/events?${qs}" \
      -H "Authorization: Bearer ${token}"`
  );
  return JSON.parse(res.toString());
}

function calendarPost(body) {
  const token = getCalendarToken();
  const bodyStr = JSON.stringify(body).replace(/'/g, "'\\''");
  const res = execSync(
    `curl -s --max-time 10 -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d '${bodyStr}'`
  );
  return JSON.parse(res.toString());
}

function calendarDelete(eventId) {
  const token = getCalendarToken();
  execSync(
    `curl -s --max-time 10 -X DELETE "https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}" \
      -H "Authorization: Bearer ${token}"`
  );
  return { ok: true };
}

// ── Telegram ─────────────────────────────────────────────────
function tgSend(botName, text) {
  const token = ENV.TG_TOKENS[botName];
  if (!token) throw new Error(`Token no configurado para bot "${botName}"`);
  const chatId = ENV.TG_CHAT_ID;
  if (!chatId) throw new Error('TELEGRAM_ADMIN_IDS no está en el .env');
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }).replace(/'/g, "'\\''");
  const res = execSync(
    `curl -s --max-time 10 -X POST "https://api.telegram.org/bot${token}/sendMessage" \
      -H "Content-Type: application/json" \
      -d '${body}'`
  );
  return JSON.parse(res.toString());
}

// ── Fecha hora Ecuador ───────────────────────────────────────
function ahoraEC() {
  return new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
}
function fechaEC() {
  return new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' });
}

// ── Comandos ─────────────────────────────────────────────────
async function main() {
  let result;

  switch (command) {

    // ── TAREAS ──
    case 'tareas-listar': {
      const filtroEstado = args[0]?.toUpperCase() || null;
      const filtroProyecto = args[1]?.toUpperCase() || null;
      const data = sheetsGet(ENV.SHEETS_PERSONAL, 'TAREAS!A:G');
      const rows = (data.values || []).slice(1).filter(r => r[0]);
      let tareas = rows.map((r, i) => ({
        id: r[0], tarea: r[1], estado: r[2] || 'PENDIENTE',
        prioridad: r[3] || 'MEDIA', fecha_limite: r[4] || '',
        proyecto: r[5] || '', notas: r[6] || ''
      }));
      if (filtroEstado) tareas = tareas.filter(t => t.estado === filtroEstado);
      if (filtroProyecto) tareas = tareas.filter(t => t.proyecto.includes(filtroProyecto));
      result = tareas;
      break;
    }

    case 'tareas-crear': {
      const d = JSON.parse(args[0]);
      const id = Date.now().toString();
      await sheetsAppend(ENV.SHEETS_PERSONAL, 'TAREAS!A:G', [[
        id,
        (d.tarea || '').toUpperCase(),
        'PENDIENTE',
        (d.prioridad || 'MEDIA').toUpperCase(),
        d.fecha_limite || '',
        (d.proyecto || '').toUpperCase(),
        d.notas || ''
      ]]);
      result = { ok: true, id, tarea: d.tarea };
      break;
    }

    case 'tareas-completar': {
      const query = args.join(' ').toUpperCase();
      const data = sheetsGet(ENV.SHEETS_PERSONAL, 'TAREAS!A:C');
      const rows = data.values || [];
      let encontrado = null;
      for (let i = 1; i < rows.length; i++) {
        const [id, tarea] = rows[i];
        if (id === query || (tarea && tarea.toUpperCase().includes(query))) {
          sheetsUpdate(ENV.SHEETS_PERSONAL, `TAREAS!C${i + 1}`, 'HECHO');
          encontrado = { tarea, fila: i + 1 };
          break;
        }
      }
      result = encontrado || { error: 'Tarea no encontrada' };
      break;
    }

    // ── MEMORIA ──
    case 'memoria-leer': {
      const data = sheetsGet(ENV.SHEETS_PERSONAL, 'MEMORIA!A:C');
      const rows = (data.values || []).slice(1).filter(r => r[0]);
      result = rows.map(r => ({ fecha: r[0], categoria: r[1], nota: r[2] }));
      break;
    }

    case 'memoria-guardar': {
      const d = JSON.parse(args[0]);
      await sheetsAppend(ENV.SHEETS_PERSONAL, 'MEMORIA!A:C', [[
        fechaEC(),
        (d.categoria || 'GENERAL').toUpperCase(),
        d.nota
      ]]);
      result = { ok: true };
      break;
    }

    // ── PEDIDOS ──
    case 'pedidos-hoy': {
      const data = sheetsGet(ENV.SHEETS_OPS, 'Pedidos!A:Z');
      const rows = (data.values || []);
      const headers = rows[0] || [];
      const hoy = fechaEC();
      const idxFecha = headers.findIndex(h => h?.toLowerCase().includes('fecha'));
      const pedidos = rows.slice(1).filter(r => r[idxFecha] === hoy);
      result = { total: pedidos.length, hoy, pedidos: pedidos.slice(0, 10) };
      break;
    }

    case 'pedidos-buscar': {
      const query = args.join(' ').toLowerCase();
      const data = sheetsGet(ENV.SHEETS_OPS, 'Pedidos!A:E');
      const rows = (data.values || []).slice(1);
      const encontrados = rows.filter(r => r.some(cell => cell?.toString().toLowerCase().includes(query)));
      result = encontrados.slice(0, 5);
      break;
    }

    // ── CALENDAR ──
    case 'calendar-listar': {
      const dias = parseInt(args[0]) || 7;
      const now = new Date();
      const hasta = new Date();
      hasta.setDate(hasta.getDate() + dias);
      const data = calendarGet({
        timeMin: now.toISOString(),
        timeMax: hasta.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '20',
        timeZone: 'America/Guayaquil'
      });
      result = (data.items || []).map(e => ({
        id: e.id,
        titulo: e.summary || '(sin título)',
        inicio: e.start?.dateTime || e.start?.date,
        fin: e.end?.dateTime || e.end?.date,
        descripcion: e.description || '',
        todo_el_dia: !e.start?.dateTime
      }));
      break;
    }

    case 'calendar-crear': {
      const d = JSON.parse(args[0]);
      let start, end;
      if (d.todo_el_dia) {
        start = { date: d.fecha };
        end = { date: d.fecha };
      } else {
        const startDt = new Date(`${d.fecha}T${d.hora}:00-05:00`);
        const endDt = new Date(startDt.getTime() + (d.duracion_min || 60) * 60000);
        start = { dateTime: startDt.toISOString(), timeZone: 'America/Guayaquil' };
        end = { dateTime: endDt.toISOString(), timeZone: 'America/Guayaquil' };
      }
      const evento = calendarPost({
        summary: d.titulo,
        description: d.descripcion || '',
        start, end
      });
      result = { id: evento.id, titulo: evento.summary, inicio: evento.start?.dateTime || evento.start?.date };
      break;
    }

    case 'calendar-eliminar': {
      result = calendarDelete(args[0]);
      break;
    }

    // ── TELEGRAM SEND ──
    case 'telegram-send': {
      const botName = args[0]?.toLowerCase();
      const mensaje = args.slice(1).join(' ');
      result = tgSend(botName, mensaje);
      break;
    }

    default:
      throw new Error(`Comando desconocido: "${command}". Usa: tareas-listar, tareas-crear, tareas-completar, memoria-leer, memoria-guardar, pedidos-hoy, pedidos-buscar, calendar-listar, calendar-crear, calendar-eliminar, telegram-send`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
