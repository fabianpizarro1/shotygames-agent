require('dotenv').config();
const { google } = require('googleapis');
const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const api = google.sheets({ version: 'v4', auth });
const leer = async () => (await api.spreadsheets.values.get({
  spreadsheetId: process.env.SHEETS_ID_DROPSHIPPING, range: 'PUBLICIDAD!H2' })).data.values?.[0]?.[0] || '';
const hora = () => new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil' });

(async () => {
  const base = await leer();
  console.log(`[${hora()}] baseline (escrito por la Mac): "${base}"`);
  console.log('Mac apagada. Si esto cambia, solo pudo ser el servidor.');
  for (let i = 1; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 60000));
    const v = await leer();
    if (v !== base) {
      console.log(`[${hora()}] CAMBIÓ → "${v}"`);
      console.log('✅ EL SERVIDOR ESCRIBIÓ SOLO. Verificado de punta a punta.');
      process.exit(0);
    }
    console.log(`[${hora()}] min ${i}: sin cambios`);
  }
  console.log('❌ 20 min sin cambios — el cron dice ACTIVO pero no escribe.');
  process.exit(1);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
