#!/usr/bin/env node
/**
 * Diagnóstico de la conexión con Instagram.
 *
 * Uso:
 *   node scripts/test-instagram.js                    → solo verifica (no publica nada)
 *   node scripts/test-instagram.js --publicar <url>   → publica un post de prueba REAL
 *
 * El modo por defecto no publica. Hay que pedirlo explícitamente con --publicar,
 * porque eso sube un post de verdad a la cuenta de Shotygames.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const ig = require('../instagram');

async function main() {
  const args     = process.argv.slice(2);
  const publicar = args.includes('--publicar');
  const imageUrl = args[args.indexOf('--publicar') + 1];

  console.log('1) Verificando token y cuenta...');
  const cuenta = await ig.verificarConexion();
  console.log(`   OK → @${cuenta.username} (id ${cuenta.id})${cuenta.followers_count != null ? ` · ${cuenta.followers_count} seguidores` : ''}`);

  console.log('2) Consultando cuota de publicación (24h)...');
  const cuota = await ig.cuotaRestante();
  console.log(`   OK → ${cuota.usado}/${cuota.total} usados · quedan ${cuota.restante}`);

  if (!publicar) {
    console.log('\nConexión funcionando. No se publicó nada.');
    console.log('Para probar una publicación real:');
    console.log('   node scripts/test-instagram.js --publicar https://url-publica/imagen.jpg');
    return;
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error('--publicar necesita una URL pública de imagen. Ej: --publicar https://.../foto.jpg');
  }

  console.log(`3) Publicando post de prueba con ${imageUrl} ...`);
  const post = await ig.publicarImagen(imageUrl, 'Prueba de conexión — Shotygames 🎲');
  console.log(`   PUBLICADO → id ${post.id}`);
  if (post.permalink) console.log(`   ${post.permalink}`);
  console.log('\nBorra el post desde la app si era solo prueba.');
}

main().catch(err => {
  console.error(`\nFALLÓ: ${err.message}`);
  process.exit(1);
});
