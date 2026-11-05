// Crea el Google Sheet de la invitación (una sola vez) con sus hojas y encabezados.
// Uso: npm run setup-sheet   (necesita GOOGLE_* en .env.local)
// Imprime el ID: pegarlo en .env.local como SHEETS_ID_INVITACIONES.
import { auth as googleAuth, sheets } from '@googleapis/sheets';

if (process.env.SHEETS_ID_INVITACIONES) {
  console.error('Ya existe SHEETS_ID_INVITACIONES. No creo otro Sheet.');
  process.exit(1);
}

const auth = new googleAuth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const api = sheets({ version: 'v4', auth });

const HOJAS = {
  INVITADOS: ['token', 'nombre', 'telefono', 'grupo', 'cupos', 'estado', 'asistentes', 'restricciones', 'mensaje', 'enviado_at', 'abierto_at', 'confirmado_at', 'notas', 'genero'],
  CONFIG: ['clave', 'valor', 'descripcion'],
  CANCIONES: ['id', 'spotify_uri', 'cancion', 'artista', 'pedida_por', 'estado', 'creada_at', 'deezer_id', 'isrc', 'portada', 'token'],
  MENSAJES: ['id', 'nombre', 'mensaje', 'creado_at'],
};

const r = await api.spreadsheets.create({
  requestBody: {
    properties: { title: 'INVITACION CUMPLEAÑOS - INVITADOS', locale: 'en_US', timeZone: 'America/Guayaquil' },
    sheets: Object.keys(HOJAS).map((title) => ({ properties: { title, gridProperties: { frozenRowCount: 1 } } })),
  },
});
const id = r.data.spreadsheetId;

const { CONFIG_DEFAULTS: defaults } = await import('../src/lib/config-defaults.mjs');

await api.spreadsheets.values.batchUpdate({
  spreadsheetId: id,
  requestBody: {
    valueInputOption: 'RAW',
    data: [
      ...Object.entries(HOJAS).map(([hoja, cab]) => ({ range: `${hoja}!A1`, values: [cab] })),
      { range: 'CONFIG!A2', values: Object.entries(defaults).map(([k, v]) => [k, v.valor, v.descripcion]) },
    ],
  },
});

console.log('Sheet creado:', r.data.spreadsheetUrl);
console.log('SHEETS_ID_INVITACIONES=' + id);
