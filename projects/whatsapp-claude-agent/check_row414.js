process.chdir('/Users/user/Desktop/KEPLER/projects/whatsapp-claude-agent');
require('dotenv').config();
const {google} = require('googleapis');
const fs = require('fs');
const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({refresh_token: process.env.GOOGLE_REFRESH_TOKEN});
const sheets = google.sheets({version:'v4', auth});
sheets.spreadsheets.values.get({
  spreadsheetId: process.env.SHEETS_ID,
  range: 'V414:Z414'
}).then(r => {
  const row = (r.data.values || [[]])[0];
  const result = { V_GUIA: row[0], W_LINK_RASTREO: row[1], X_RASTREO: row[2], Y_LINK_WA: row[3], Z_WA: row[4] };
  fs.writeFileSync('/private/tmp/row414_check.json', JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(e => { fs.writeFileSync('/private/tmp/row414_check.json', 'ERROR: ' + e.message); process.exit(1); });
