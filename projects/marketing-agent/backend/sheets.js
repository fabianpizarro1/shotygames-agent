const { google } = require('googleapis');

const SHEET_ID = process.env.MARKETING_SHEET_ID;

const HEADERS = {
  Estrategias: ['ID', 'Fecha', 'Solicitud', 'Objetivo', 'Producto', 'Audiencia', 'Nivel Consciencia', 'Estrategia', 'Formatos Sugeridos'],
  Prompts: ['ID', 'Fecha', 'Estrategia ID', 'Angulo', 'Formato', 'Headline', 'Prompt Imagen', 'Imagen URL', 'Feedback', 'Aplicado Meta', 'Notas'],
  Investigaciones: ['ID', 'Fecha', 'Solicitud', 'Investigacion Completa'],
  Conocimiento: ['ID', 'Fecha', 'Titulo', 'Tipo', 'Contenido', 'Resumen Aplicacion']
};

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

async function ensureHeaders(sheetName) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1:Z1`
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS[sheetName]] }
    });
  }
}

async function appendRow(sheetName, row) {
  await ensureHeaders(sheetName);
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] }
  });
}

async function getRows(sheetName) {
  await ensureHeaders(sheetName);
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1:Z1000`
  });
  if (!res.data.values || res.data.values.length < 2) return [];
  const [headers, ...rows] = res.data.values;
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  }).reverse();
}

async function updateCell(sheetName, rowId, column, value) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`
  });
  if (!res.data.values) return;
  const rowIndex = res.data.values.findIndex(r => r[0] === rowId);
  if (rowIndex < 0) return;

  const headers = (await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!1:1`
  })).data.values[0];
  const colIndex = headers.indexOf(column);
  if (colIndex < 0) return;

  const colLetter = String.fromCharCode(65 + colIndex);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!${colLetter}${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] }
  });
}

async function saveGeneration(solicitud, agentResponse) {
  const { v4: uuidv4 } = require('uuid');
  const fecha = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
  const estrategiaId = uuidv4().slice(0, 8).toUpperCase();

  const e = agentResponse.estrategia || {};

  await appendRow('Estrategias', [
    estrategiaId,
    fecha,
    solicitud,
    e.objetivo || '',
    e.producto || '',
    e.audiencia || '',
    e.nivel_consciencia || '',
    e.descripcion || '',
    (e.formatos_sugeridos || []).join(', ')
  ]);

  await appendRow('Investigaciones', [
    uuidv4().slice(0, 8).toUpperCase(),
    fecha,
    solicitud,
    agentResponse.investigacion || ''
  ]);

  const promptIds = [];
  for (const p of (agentResponse.prompts || [])) {
    const promptId = uuidv4().slice(0, 8).toUpperCase();
    promptIds.push(promptId);
    await appendRow('Prompts', [
      promptId,
      fecha,
      estrategiaId,
      p.angulo || '',
      p.formato || '',
      p.copy_headline || '',
      p.prompt_imagen || '',
      '',
      '',
      '',
      ''
    ]);
  }

  return { estrategiaId, promptIds, fecha };
}

async function updatePromptImage(promptId, imageUrl) {
  await updateCell('Prompts', promptId, 'Imagen URL', imageUrl);
}

async function updatePromptFeedback(promptId, feedback) {
  await updateCell('Prompts', promptId, 'Feedback', feedback);
}

async function saveKnowledge(titulo, tipo, contenido, resumenAplicacion) {
  const { v4: uuidv4 } = require('uuid');
  const fecha = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
  await appendRow('Conocimiento', [
    uuidv4().slice(0, 8).toUpperCase(),
    fecha,
    titulo,
    tipo,
    contenido.slice(0, 5000),
    resumenAplicacion
  ]);
}

module.exports = { saveGeneration, updatePromptImage, updatePromptFeedback, saveKnowledge, getRows };
