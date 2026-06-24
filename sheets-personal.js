const { google } = require('googleapis');

const SHEET_ID = process.env.SHEETS_ID_PERSONAL;

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

// ── TAREAS ──────────────────────────────────────────────

async function crearTarea({ tarea, prioridad = 'MEDIA', fecha_limite = '', proyecto = '', notas = '' }) {
  const sheets = getSheets();
  const id = Date.now().toString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'TAREAS!A:G',
    valueInputOption: 'RAW',
    requestBody: { values: [[id, tarea.toUpperCase(), 'PENDIENTE', prioridad.toUpperCase(), fecha_limite, proyecto.toUpperCase(), notas]] }
  });
  return { id, tarea };
}

async function listarTareas(filtro_estado = null, proyecto = null) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'TAREAS!A:G' });
  const rows = (res.data.values || []).slice(1).filter(r => r[0]);

  let tareas = rows.map(r => ({
    id: r[0], tarea: r[1], estado: r[2] || 'PENDIENTE',
    prioridad: r[3] || 'MEDIA', fecha_limite: r[4] || '',
    proyecto: r[5] || '', notas: r[6] || '', _row: rows.indexOf(r) + 2
  }));

  if (filtro_estado) tareas = tareas.filter(t => t.estado === filtro_estado.toUpperCase());
  if (proyecto) tareas = tareas.filter(t => t.proyecto.includes(proyecto.toUpperCase()));

  return tareas;
}

async function completarTarea(id_o_texto) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'TAREAS!A:C' });
  const rows = res.data.values || [];

  for (let i = 1; i < rows.length; i++) {
    const [id, tarea] = rows[i];
    if (id === id_o_texto || tarea?.toUpperCase().includes(id_o_texto.toUpperCase())) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `TAREAS!C${i + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['HECHO']] }
      });
      return { tarea, fila: i + 1 };
    }
  }
  return null;
}

// ── MEMORIA del bot ──────────────────────────────────────

async function guardarMemoria({ categoria, nota }) {
  const sheets = getSheets();
  const fecha = new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'MEMORIA!A:C',
    valueInputOption: 'RAW',
    requestBody: { values: [[fecha, categoria.toUpperCase(), nota]] }
  });
}

async function leerMemoria() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'MEMORIA!A:C' });
  const rows = (res.data.values || []).slice(1).filter(r => r[0]);
  return rows.map(r => ({ fecha: r[0], categoria: r[1], nota: r[2] }));
}

module.exports = { crearTarea, listarTareas, completarTarea, guardarMemoria, leerMemoria };
