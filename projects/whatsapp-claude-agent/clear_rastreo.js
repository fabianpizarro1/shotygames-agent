process.chdir('/Users/user/Desktop/KEPLER/projects/whatsapp-claude-agent');
require('dotenv').config();
const {google} = require('googleapis');
const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({refresh_token: process.env.GOOGLE_REFRESH_TOKEN});
const sheets = google.sheets({version:'v4', auth});
sheets.spreadsheets.values.clear({
  spreadsheetId: process.env.SHEETS_ID,
  range: 'X414'
}).then(() => { console.log('X414 limpiada OK'); process.exit(0); })
.catch(e => { console.error('ERROR:', e.message); process.exit(1); });
