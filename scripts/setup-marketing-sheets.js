require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { google } = require('googleapis');

const MARKETING_SHEET_ID = '113kZ3iB9cD8o8OzonVRLENnwVC1se2UXjfkWIpmXgMI';

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
}

const SHEETS_CONFIG = [
  {
    name: 'Estrategias',
    headers: ['ID', 'Fecha', 'Objetivo', 'Producto', 'Audiencia', 'Nivel Consciencia', 'Estrategia Completa', 'Formatos Sugeridos', 'Estado', 'Resultado']
  },
  {
    name: 'Prompts',
    headers: ['ID', 'Fecha', 'Estrategia ID', 'Angulo de Venta', 'Formato', 'Prompt', 'Imagen URL', 'Feedback', 'Aplicado en Meta', 'CTR', 'Notas']
  },
  {
    name: 'Investigaciones',
    headers: ['ID', 'Fecha', 'Tema', 'Competidores Analizados', 'Insights Clave', 'Gaps Detectados', 'Como Aplicar a Shotygames', 'Prioridad']
  },
  {
    name: 'Conocimiento',
    headers: ['ID', 'Fecha', 'Titulo', 'Tipo', 'Fuente', 'Resumen', 'Puntos Clave', 'Como Aplicar', 'Etiquetas']
  }
];

async function setup() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Obtener hojas existentes
  const meta = await sheets.spreadsheets.get({ spreadsheetId: MARKETING_SHEET_ID });
  const existingSheets = meta.data.sheets.map(s => s.properties.title);
  console.log('Hojas existentes:', existingSheets);

  const requests = [];

  // Crear hojas nuevas que no existen
  for (const sheet of SHEETS_CONFIG) {
    if (!existingSheets.includes(sheet.name)) {
      requests.push({
        addSheet: {
          properties: { title: sheet.name }
        }
      });
    }
  }

  // Eliminar la hoja por defecto "Hoja 1" si existe
  const defaultSheet = meta.data.sheets.find(s =>
    s.properties.title === 'Hoja 1' || s.properties.title === 'Sheet1'
  );
  if (defaultSheet) {
    requests.push({
      deleteSheet: { sheetId: defaultSheet.properties.sheetId }
    });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: MARKETING_SHEET_ID,
      requestBody: { requests }
    });
    console.log('Hojas creadas.');
  }

  // Obtener IDs de hojas actualizados
  const updated = await sheets.spreadsheets.get({ spreadsheetId: MARKETING_SHEET_ID });
  const sheetMap = {};
  updated.data.sheets.forEach(s => {
    sheetMap[s.properties.title] = s.properties.sheetId;
  });

  // Escribir headers en cada hoja
  for (const sheet of SHEETS_CONFIG) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MARKETING_SHEET_ID,
      range: `${sheet.name}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [sheet.headers] }
    });
    console.log(`Headers escritos en: ${sheet.name}`);
  }

  // Formatear headers (negrita + fondo oscuro)
  const formatRequests = [];
  for (const sheet of SHEETS_CONFIG) {
    const sheetId = sheetMap[sheet.name];
    if (sheetId === undefined) continue;
    formatRequests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
            textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 10 },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    });
    // Congelar primera fila
    formatRequests.push({
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount'
      }
    });
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: MARKETING_SHEET_ID,
    requestBody: { requests: formatRequests }
  });

  console.log('\n✅ Google Sheets de Marketing configurado correctamente.');
  console.log(`URL: https://docs.google.com/spreadsheets/d/${MARKETING_SHEET_ID}/edit`);
}

setup().catch(console.error);
