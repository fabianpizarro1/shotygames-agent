/**
 * Re-autorizar Google OAuth con scopes de Sheets + Drive
 *
 * Paso 1: node scripts/reauth-google.js url
 *   → genera la URL de autorización, ábrela en el browser
 *
 * Paso 2: node scripts/reauth-google.js code TU_CODIGO_AQUI
 *   → intercambia el código y muestra el nuevo refresh token
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

function getClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
}

const [,, action, code] = process.argv;

if (action === 'url') {
  const url = getClient().generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',   // fuerza a que Google emita un nuevo refresh_token
  });
  console.log('\n📋 Abre esta URL en el browser:\n');
  console.log(url);
  console.log('\nDespués copia el código y ejecuta:');
  console.log('node scripts/reauth-google.js code PEGA_EL_CODIGO_AQUI\n');

} else if (action === 'code' && code) {
  (async () => {
    const client = getClient();
    const { tokens } = await client.getToken(code);
    console.log('\n✅ Tokens obtenidos:\n');
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\nActualiza esta variable en EasyPanel y listo.');
  })().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });

} else {
  console.log('Uso:');
  console.log('  node scripts/reauth-google.js url');
  console.log('  node scripts/reauth-google.js code TU_CODIGO');
}
