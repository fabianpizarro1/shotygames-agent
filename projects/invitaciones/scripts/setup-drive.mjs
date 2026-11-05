// Crea (una sola vez) la carpeta de Drive donde el dashboard guarda fotos, stickers y la canción.
// Uso: node --env-file=.env.local scripts/setup-drive.mjs
import { auth as googleAuth } from '@googleapis/sheets';

if (process.env.DRIVE_FOLDER_INVITACIONES) {
  console.error('Ya existe DRIVE_FOLDER_INVITACIONES. No creo otra carpeta.');
  process.exit(1);
}
const a = new googleAuth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
a.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const { token } = await a.getAccessToken();

const r = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'INVITACION CUMPLEAÑOS - ARCHIVOS', mimeType: 'application/vnd.google-apps.folder' }),
});
const j = await r.json();
if (!r.ok) {
  console.error('Drive respondió', r.status, JSON.stringify(j).slice(0, 300));
  process.exit(1);
}
console.log('Carpeta creada:', j.name);
console.log('DRIVE_FOLDER_INVITACIONES=' + j.id);
