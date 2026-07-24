#!/usr/bin/env node
/**
 * Encuentra tu IG_USER_ID a partir del System User token.
 * Solo lee — no publica ni modifica nada.
 *
 * Uso:
 *   1. Pon IG_ACCESS_TOKEN en el .env
 *   2. node scripts/ig-descubrir-id.js
 *
 * Recorre: token → Páginas de Facebook → cuenta de Instagram vinculada a cada una.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const axios = require('axios');

const API_VERSION = process.env.IG_API_VERSION || 'v21.0';
const API = `https://graph.facebook.com/${API_VERSION}`;

function detalleError(err) {
  const e = err.response?.data?.error;
  return e ? `${e.message}${e.code ? ` (code ${e.code})` : ''}` : err.message;
}

async function main() {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error('Falta IG_ACCESS_TOKEN en .env');

  console.log('Buscando tus Páginas de Facebook...\n');

  let paginas;
  try {
    const { data } = await axios.get(`${API}/me/accounts`, {
      params: { fields: 'id,name', access_token: token },
      timeout: 20000,
    });
    paginas = data.data || [];
  } catch (err) {
    throw new Error(
      `No se pudieron listar las Páginas: ${detalleError(err)}\n` +
      `Revisa que el System User tenga asignada la Página y el permiso pages_show_list.`
    );
  }

  if (paginas.length === 0) {
    throw new Error(
      'El token no ve ninguna Página.\n' +
      'En Business Settings → System Users → tu system user → Assign Assets, agrega la Página de Shotygames.'
    );
  }

  let encontradas = 0;

  for (const pagina of paginas) {
    let ig = null;
    try {
      const { data } = await axios.get(`${API}/${pagina.id}`, {
        params: { fields: 'instagram_business_account{id,username,followers_count}', access_token: token },
        timeout: 20000,
      });
      ig = data.instagram_business_account;
    } catch (err) {
      console.log(`Página "${pagina.name}" (${pagina.id}) → error: ${detalleError(err)}`);
      continue;
    }

    if (!ig) {
      console.log(`Página "${pagina.name}" (${pagina.id}) → sin cuenta de Instagram vinculada`);
      continue;
    }

    encontradas++;
    console.log(`Página "${pagina.name}"`);
    console.log(`   Instagram: @${ig.username}${ig.followers_count != null ? ` · ${ig.followers_count} seguidores` : ''}`);
    console.log(`   IG_USER_ID=${ig.id}\n`);
  }

  if (encontradas === 0) {
    throw new Error(
      'Ninguna de tus Páginas tiene cuenta de Instagram vinculada.\n' +
      'Vincula la cuenta de Shotygames a la Página desde la app de Instagram: Configuración → Cuenta → Compartir en otras apps.'
    );
  }

  console.log('Copia el IG_USER_ID de la cuenta de Shotygames al .env y corre:');
  console.log('   node scripts/test-instagram.js');
}

main().catch(err => {
  console.error(`\nFALLÓ: ${err.message}`);
  process.exit(1);
});
