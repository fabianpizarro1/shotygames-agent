const https = require('https');
const readline = require('readline');
const querystring = require('querystring');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar',
].join(' ');

const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPES,
  access_type: 'offline',
  prompt: 'consent'
}).toString();

console.log('\n1. Abre esta URL en tu navegador:\n');
console.log(url);
console.log('\n2. Autoriza y pega el codigo aqui:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Codigo: ', (code) => {
  rl.close();
  const postData = new URLSearchParams({
    code: code.trim(),
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  }).toString();

  const req = https.request({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const tokens = JSON.parse(data);
      if (tokens.refresh_token) {
        console.log('\n✅ NUEVO REFRESH TOKEN:\n');
        console.log(tokens.refresh_token);
        console.log('\nActualiza GOOGLE_REFRESH_TOKEN en EasyPanel con este valor.\n');
      } else {
        console.error('\nError:', data);
      }
    });
  });

  req.write(postData);
  req.end();
});
