/**
 * Prueba de 1 creativo end-to-end (copy + imagen) sin cron ni Drive.
 * Uso:  node creativos/test.js [productoId] [angulo]
 * Ej:   node creativos/test.js combo-la-previa lifestyle
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PRODUCTOS } = require('./productos');
const { generarCopy } = require('./copy');
const { generarImagen } = require('./imagen');

(async () => {
  const prodId = process.argv[2] || 'combo-la-previa';
  const producto = PRODUCTOS.find((p) => p.id === prodId);
  if (!producto) { console.error('Producto no encontrado:', prodId); process.exit(1); }
  const angulo = process.argv[3] || producto.angulos[0];

  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n🎨 Generando creativo: ${producto.nombre} · ángulo "${angulo}"\n`);

  console.log('1/2 Copy (Claude)...');
  const copy = await generarCopy(producto, angulo);
  console.log(JSON.stringify(copy, null, 2));

  console.log('\n2/2 Imagen (Nano Banana)...');
  const imgPath = path.join(outDir, `${producto.id}-${angulo}.png`);
  await generarImagen(producto.imagen, copy.image_prompt, imgPath);
  console.log('✅ Imagen guardada en:', imgPath);

  fs.writeFileSync(
    path.join(outDir, `${producto.id}-${angulo}.json`),
    JSON.stringify({ producto: producto.id, angulo, ...copy }, null, 2)
  );
  console.log('✅ Copy guardado en:', path.join(outDir, `${producto.id}-${angulo}.json`));
  console.log('\nListo. Abre la imagen y el JSON para revisar.\n');
})().catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });
