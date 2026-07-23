/**
 * Prueba SOLO la generación de imagen (Nano Banana) con un prompt fijo.
 * No usa Claude — sirve para validar la key de Gemini y el image-to-image.
 * Uso: node creativos/test-imagen.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PRODUCTOS } = require('./productos');
const { generarImagen } = require('./imagen');

const producto = PRODUCTOS.find((p) => p.id === 'combo-la-previa');
const imagePrompt =
  'Using this product photo as the reference, keep the product (the ShotyGames wooden ' +
  'shot-tower party game and its box) clearly recognizable and prominent. Place it on a ' +
  'table at a lively house party in Ecuador at night: a group of 5-6 young adults in their ' +
  '20s laughing and about to play, warm ambient string lights, drinks and shot glasses on ' +
  'the table, energetic and fun atmosphere. Candid lifestyle advertising photography, high ' +
  'contrast, vibrant warm colors, shallow depth of field, photorealistic. No text or logos ' +
  'overlaid. Square 1:1 composition.';

(async () => {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  console.log('Generando imagen con Nano Banana desde:', producto.imagen);
  const out = path.join(outDir, 'combo-la-previa-lifestyle.png');
  await generarImagen(producto.imagen, imagePrompt, out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`✅ Imagen generada (${kb} KB):`, out);
})().catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });
