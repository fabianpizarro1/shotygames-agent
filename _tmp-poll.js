require('dotenv').config();
const { google } = require('googleapis');
const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const api = google.sheets({ version: 'v4', auth });
const BASE = '1/9/2026, 8:10:24 p. m.';
(async () => {
  for (let i = 1; i <= 8; i++) {
    const r = await api.spreadsheets.values.get({ spreadsheetId: process.env.SHEETS_ID_DROPSHIPPING, range: 'PUBLICIDAD!H2' });
    const v = r.data.values?.[0]?.[0] || '';
    const hora = new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil' });
    if (v !== BASE) { console.log(`[${hora}] CAMBIÓ → "${v}"  ✅ ESCRIBIÓ EL SERVIDOR`); process.exit(0); }
    console.log(`[${hora}] sin cambios`);
    if (i < 8) await new Promise(r => setTimeout(r, 20000));
  }
  process.exit(2);
})().catch(e => { console.error(e.message); process.exit(1); });
