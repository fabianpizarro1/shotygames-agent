const { google } = require('googleapis');
const { Readable } = require('stream');

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

// Sube un Buffer PDF a la carpeta de Drive configurada
// Devuelve { id, name, webViewLink } o lanza error
async function uploadPdf(buffer, fileName) {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('DRIVE_FOLDER_ID no configurado');

  const auth  = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: stream,
    },
    fields: 'id,name,webViewLink',
  });

  return res.data;
}

// Manda a la papelera todos los PDFs de la carpeta menos el que se acaba de subir.
// Van a papelera (recuperables 30 días), no se borran definitivamente.
// Devuelve cuántos se mandaron a papelera.
async function trashOtrosPdfs(keepId) {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('DRIVE_FOLDER_ID no configurado');

  const auth  = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType = 'application/pdf'`,
    fields: 'files(id,name)',
    pageSize: 200,
  });

  const viejos = (data.files || []).filter(f => f.id !== keepId);

  await Promise.all(
    viejos.map(f =>
      drive.files.update({ fileId: f.id, requestBody: { trashed: true } })
    )
  );

  return viejos.length;
}

// Sube el PDF y deja solo ese en la carpeta: los PDFs anteriores van a papelera.
// Sube primero y limpia después — si la subida falla, el PDF anterior sigue ahí.
// Devuelve { id, name, webViewLink, borrados }
async function uploadPdfReemplazando(buffer, fileName) {
  const file = await uploadPdf(buffer, fileName);

  let borrados = 0;
  try {
    borrados = await trashOtrosPdfs(file.id);
  } catch (e) {
    console.error('Drive limpieza error (el PDF nuevo sí se subió):', e.message);
  }

  return { ...file, borrados };
}

module.exports = { uploadPdf, trashOtrosPdfs, uploadPdfReemplazando };
