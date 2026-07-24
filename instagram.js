/**
 * Conector de Instagram (Graph API) — publicar imágenes y reels en la cuenta de Shotygames.
 *
 * Requiere en .env:
 *   IG_ACCESS_TOKEN — token de larga duración con instagram_business_content_publish
 *   IG_USER_ID      — ID de la cuenta de Instagram Professional (no el @usuario)
 *
 * Flujo de la API (siempre 2 pasos):
 *   1. POST /{ig-user-id}/media          → crea un "container" y devuelve creation_id
 *   2. POST /{ig-user-id}/media_publish  → publica ese container
 * Los videos/reels tardan en procesarse: hay que esperar a que el container quede FINISHED.
 */
const axios = require('axios');

// Si Meta deprecia la versión, se sube aquí o por env sin tocar código.
const API_VERSION = process.env.IG_API_VERSION || 'v21.0';
const API = `https://graph.facebook.com/${API_VERSION}`;

function credenciales() {
  const token  = process.env.IG_ACCESS_TOKEN;
  const userId = process.env.IG_USER_ID;
  if (!token)  throw new Error('Falta IG_ACCESS_TOKEN en .env');
  if (!userId) throw new Error('Falta IG_USER_ID en .env');
  return { token, userId };
}

// Los errores de Meta vienen anidados; sin esto solo se ve "Request failed with status code 400".
function errorMeta(err, contexto) {
  const e = err.response?.data?.error;
  if (!e) return new Error(`${contexto}: ${err.message}`);
  const partes = [e.message];
  if (e.error_user_msg)   partes.push(e.error_user_msg);
  if (e.code)             partes.push(`code=${e.code}`);
  if (e.error_subcode)    partes.push(`subcode=${e.error_subcode}`);
  return new Error(`${contexto}: ${partes.join(' | ')}`);
}

// Crea el container. Devuelve el creation_id.
async function crearContainer(params) {
  const { token, userId } = credenciales();
  try {
    const { data } = await axios.post(
      `${API}/${userId}/media`,
      null,
      { params: { ...params, access_token: token }, timeout: 60000 }
    );
    return data.id;
  } catch (err) {
    throw errorMeta(err, 'Instagram crearContainer');
  }
}

// Espera a que el container esté listo. Las imágenes suelen estar al instante;
// los reels tardan y publicar antes de tiempo falla.
async function esperarContainer(containerId, { intentos = 30, esperaMs = 5000 } = {}) {
  const { token } = credenciales();

  for (let i = 0; i < intentos; i++) {
    let data;
    try {
      ({ data } = await axios.get(`${API}/${containerId}`, {
        params: { fields: 'status_code,status', access_token: token },
        timeout: 30000,
      }));
    } catch (err) {
      throw errorMeta(err, 'Instagram esperarContainer');
    }

    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
      throw new Error(`Instagram: el container quedó en ${data.status_code}. ${data.status || ''}`.trim());
    }
    await new Promise(r => setTimeout(r, esperaMs));
  }

  throw new Error(`Instagram: el container sigue procesando después de ${(intentos * esperaMs) / 1000}s. Intenta publicarlo más tarde.`);
}

// Publica un container ya listo. Devuelve el id del post publicado.
async function publicarContainer(containerId) {
  const { token, userId } = credenciales();
  try {
    const { data } = await axios.post(
      `${API}/${userId}/media_publish`,
      null,
      { params: { creation_id: containerId, access_token: token }, timeout: 60000 }
    );
    return data.id;
  } catch (err) {
    throw errorMeta(err, 'Instagram publicarContainer');
  }
}

/**
 * Publica una imagen en el feed.
 * OJO: imageUrl tiene que ser una URL pública que Meta pueda descargar —
 * no sirve una ruta local ni un link de Drive con permiso restringido.
 * @returns {Promise<{id, permalink}>}
 */
async function publicarImagen(imageUrl, caption) {
  const containerId = await crearContainer({ image_url: imageUrl, caption });
  await esperarContainer(containerId, { intentos: 12, esperaMs: 2000 });
  const mediaId = await publicarContainer(containerId);
  return { id: mediaId, permalink: await permalink(mediaId) };
}

/**
 * Publica un reel. coverUrl es opcional (miniatura).
 * @returns {Promise<{id, permalink}>}
 */
async function publicarReel(videoUrl, caption, coverUrl) {
  const params = { media_type: 'REELS', video_url: videoUrl, caption };
  if (coverUrl) params.cover_url = coverUrl;

  const containerId = await crearContainer(params);
  await esperarContainer(containerId); // los reels sí necesitan la espera larga
  const mediaId = await publicarContainer(containerId);
  return { id: mediaId, permalink: await permalink(mediaId) };
}

// Link público del post. No crítico: si falla, se devuelve null.
async function permalink(mediaId) {
  const { token } = credenciales();
  try {
    const { data } = await axios.get(`${API}/${mediaId}`, {
      params: { fields: 'permalink', access_token: token },
      timeout: 15000,
    });
    return data.permalink || null;
  } catch {
    return null;
  }
}

// Cuántos posts quedan en la ventana de 24h (Instagram permite 50).
async function cuotaRestante() {
  const { token, userId } = credenciales();
  try {
    const { data } = await axios.get(`${API}/${userId}/content_publishing_limit`, {
      params: { fields: 'config,quota_usage', access_token: token },
      timeout: 15000,
    });
    const info  = data.data?.[0] || {};
    const usado = info.quota_usage ?? 0;
    const total = info.config?.quota_total ?? 50;
    return { usado, total, restante: total - usado };
  } catch (err) {
    throw errorMeta(err, 'Instagram cuotaRestante');
  }
}

// Verifica que el token y el IG_USER_ID sirvan. Úsalo antes de confiar en el resto.
async function verificarConexion() {
  const { token, userId } = credenciales();
  try {
    const { data } = await axios.get(`${API}/${userId}`, {
      params: { fields: 'id,username,name,followers_count', access_token: token },
      timeout: 15000,
    });
    return data;
  } catch (err) {
    throw errorMeta(err, 'Instagram verificarConexion');
  }
}

module.exports = {
  publicarImagen,
  publicarReel,
  crearContainer,
  esperarContainer,
  publicarContainer,
  cuotaRestante,
  verificarConexion,
};
