/**
 * Genera el CSV de importación de productos para Shopify.
 *
 * Uso:  node projects/tienda-shopify/catalogo/generar-csv.js
 * Sale: projects/tienda-shopify/catalogo/productos-shopify.csv
 *
 * Cuando cambien precios, se edita PRODUCTOS aquí y se regenera.
 * NO editar el CSV a mano — se sobrescribe.
 */

const fs = require('fs');
const path = require('path');

const IMG = 'https://catalogo.shotygames.com/images/products';
const VENDOR = 'Shotygames';

// Las 2 torres a elección que aplican a los combos configurables
const PARES_TORRES = [
  'Normal + Picante',
  'Normal + Parejas',
  'Picante + Parejas',
  '2 Normales',
  '2 Picantes',
  '2 Parejas',
];

const GARANTIA = `
<h3>Pago contraentrega</h3>
<p>Pagas en efectivo cuando recibes el paquete en tu casa. No necesitas tarjeta ni transferencia.</p>
<h3>Envío gratis a todo Ecuador</h3>
<p>Envío GRATIS a todo Ecuador vía Servientrega, desde Machala. Pedidos antes de las 15:00 salen el mismo día; después de las 15:00 salen al día siguiente.</p>
`.trim();

const PRODUCTOS = [
  // ————————————————————————— COMBOS (los que se empujan primero)
  {
    handle: 'combo-la-previa',
    titulo: 'Combo La Previa — 2 Torres + Dados del Placer',
    tipo: 'Combo',
    tags: 'combo,fiesta,grupos,estrella,envio-gratis,contraentrega',
    precio: 43,
    comparar: 56, // 2 torres a $28 c/u
    gramos: 3200,
    imagen: `${IMG}/combo-la-previa.jpg`,
    alt: 'Combo La Previa: dos torres de shots y dados del placer',
    opcion: { nombre: 'Elige tus 2 torres', valores: PARES_TORRES },
    seoTitulo: 'Combo La Previa | 2 Torres de Shots + Dados | Envío gratis Ecuador',
    seoDesc: '2 torres de shots a elección + Dados del Placer + 3 guías digitales. $43 con envío gratis a todo Ecuador y pago contraentrega.',
    cuerpo: `
<p><strong>El combo que arma la previa completa.</strong> Dos torres a tu elección, los Dados del Placer físicos y tres guías digitales de regalo. Todo por $43 con envío gratis.</p>
<h3>Qué incluye</h3>
<ul>
  <li>2 Torres de Shots a elección (Normal, Picante o Parejas — puedes repetir)</li>
  <li>Dados del Placer físicos <em>(no se venden por separado)</em></li>
  <li>Guía digital: 30 posiciones</li>
  <li>Guía digital: 25 juegos para fiestas</li>
  <li>Guía digital del placer</li>
  <li>1 Shot Bidu de regalo</li>
  <li>Envío gratis a todo Ecuador</li>
</ul>
<h3>Cómo se juega la torre</h3>
<p>Se arma la torre con los 51 bloques. Cada jugador saca un bloque y cumple el reto que dice. Si tumbas la torre, te toca penitencia. Simple, y no falla.</p>
${GARANTIA}`,
  },
  {
    handle: 'combo-2-torres',
    titulo: 'Combo 2 Torres de Shots — Elige tus favoritas',
    tipo: 'Combo',
    tags: 'combo,fiesta,grupos,envio-gratis,contraentrega',
    precio: 39,
    comparar: 56, // 2 torres a $28 c/u
    gramos: 2800,
    imagen: `${IMG}/combo-2-torres.jpg`,
    alt: 'Combo de dos torres de shots Shotygames',
    opcion: { nombre: 'Elige tus 2 torres', valores: PARES_TORRES },
    seoTitulo: 'Combo 2 Torres de Shots | Ahorra $17 | Envío gratis Ecuador',
    seoDesc: 'Elige 2 torres de shots (Normal, Picante o Parejas) por $39 con envío gratis y guías digitales de regalo. Pago contraentrega en todo Ecuador.',
    cuerpo: `
<p><strong>Dos torres por menos que el precio de dos torres.</strong> Eliges las que quieras — incluso dos iguales — y te ahorras $17.</p>
<h3>Qué incluye</h3>
<ul>
  <li>2 Torres de Shots a elección (Normal, Picante o Parejas — puedes repetir)</li>
  <li>Guía digital: 30 posiciones</li>
  <li>Guía digital: 25 juegos para fiestas</li>
  <li>1 Shot Bidu de regalo</li>
  <li>Envío gratis a todo Ecuador</li>
</ul>
<h3>Cómo se juega</h3>
<p>Se arma la torre con los 51 bloques. Cada jugador saca uno y cumple el reto. Si la tumbas, penitencia.</p>
${GARANTIA}`,
  },
  {
    handle: 'combo-parejas-hot',
    titulo: 'Combo Parejas Hot — Torre Parejas + Dados del Placer',
    tipo: 'Combo',
    tags: 'combo,parejas,regalo,envio-gratis,contraentrega',
    precio: 33,
    comparar: null, // los dados no se venden individual: el gancho es que van de regalo
    gramos: 1900,
    imagen: `${IMG}/combo-parejas-hot.jpg`,
    alt: 'Combo Parejas Hot: torre de shots para parejas y dados del placer',
    opcion: null,
    seoTitulo: 'Combo Parejas Hot | Torre + Dados del Placer | Envío gratis Ecuador',
    seoDesc: 'Torre de Shots Parejas + Dados del Placer físicos + guía de 30 posiciones. $33 con envío gratis y pago contraentrega en todo Ecuador.',
    cuerpo: `
<p><strong>Para salir de la rutina del viernes en casa.</strong> La Torre Parejas más los Dados del Placer, que no se venden por separado. Por el precio de la torre sola con envío, te llevas todo el combo.</p>
<h3>Qué incluye</h3>
<ul>
  <li>Torre de Shots Parejas — 51 bloques con retos para dos</li>
  <li>Dados del Placer físicos <em>(no se venden por separado)</em></li>
  <li>Guía digital: 30 posiciones</li>
  <li>Guía digital del placer</li>
  <li>1 Shot Bidu de regalo</li>
  <li>Envío gratis a todo Ecuador</li>
</ul>
${GARANTIA}`,
  },
  {
    handle: 'combo-full-torres',
    titulo: 'Combo Full Torres — Normal + Picante + Parejas',
    tipo: 'Combo',
    tags: 'combo,fiesta,grupos,parejas,envio-gratis,contraentrega',
    precio: 49,
    comparar: 84, // 3 torres a $28 c/u
    gramos: 4200,
    imagen: `${IMG}/combo-full-torres.jpg`,
    alt: 'Combo Full Torres: las tres torres de shots Shotygames',
    opcion: null,
    seoTitulo: 'Combo Full Torres | Las 3 Torres de Shots | Ahorra $35',
    seoDesc: 'Torre Normal + Picante + Parejas por $49 con envío gratis a todo Ecuador. Ahorras $35 y pagas contraentrega.',
    cuerpo: `
<p><strong>Las tres torres, listo para cualquier plan.</strong> Reunión tranquila, previa que se sale de control o noche de pareja — tienes la torre para cada una. Ahorras $35.</p>
<h3>Qué incluye</h3>
<ul>
  <li>Torre de Shots Normal — 51 bloques</li>
  <li>Torre de Shots Picante — 51 bloques atrevidos</li>
  <li>Torre de Shots Parejas — 51 bloques para dos</li>
  <li>Guías digitales de regalo</li>
  <li>1 Shot Bidu de regalo</li>
  <li>Envío gratis a todo Ecuador</li>
</ul>
${GARANTIA}`,
  },
  {
    handle: 'combo-chuchaqui',
    titulo: 'Combo Chuchaqui — Todo el catálogo Shotygames',
    tipo: 'Combo',
    tags: 'combo,fiesta,grupos,parejas,premium,envio-gratis,contraentrega',
    precio: 69,
    comparar: 112, // 4 productos físicos a $28 c/u
    gramos: 6500,
    imagen: `${IMG}/combo-full-torres.jpg`,
    alt: 'Combo Chuchaqui: catálogo completo de Shotygames',
    opcion: null,
    seoTitulo: 'Combo Chuchaqui | Todo Shotygames en un pedido | Ahorra $43',
    seoDesc: 'Las 3 torres + Enganchados + Dados del Placer + todos los juegos y guías digitales. $69 con envío gratis y pago contraentrega.',
    cuerpo: `
<p><strong>Todo. Literal, todo lo que vendemos.</strong> Cuatro juegos físicos, los dados, los dos juegos digitales y todas las guías. Ahorras $43 contra comprarlo suelto.</p>
<h3>Qué incluye</h3>
<ul>
  <li>Torre de Shots Normal</li>
  <li>Torre de Shots Picante</li>
  <li>Torre de Shots Parejas</li>
  <li>Enganchados</li>
  <li>Dados del Placer físicos</li>
  <li>Emparejados (juego digital)</li>
  <li>Dados Digitales</li>
  <li>Todas las guías digitales</li>
  <li>1 Shot Bidu de regalo</li>
  <li>Envío gratis a todo Ecuador</li>
</ul>
${GARANTIA}`,
  },

  // ————————————————————————— FÍSICOS INDIVIDUALES
  {
    handle: 'torre-de-shots-normal',
    titulo: 'Torre de Shots Normal',
    tipo: 'Juego físico',
    tags: 'torre,fiesta,grupos,contraentrega',
    precio: 28,
    comparar: null,
    gramos: 1400,
    imagen: `${IMG}/torre-normal-foto.jpg`,
    alt: 'Torre de Shots Normal de Shotygames',
    opcion: null,
    seoTitulo: 'Torre de Shots Normal | Juego para fiestas | Ecuador',
    seoDesc: '51 bloques de madera con retos y penitencias para prender cualquier reunión. $28 con envío GRATIS a todo Ecuador, pago contraentrega.',
    cuerpo: `
<p><strong>El clásico que prende cualquier reunión.</strong> 51 bloques de madera, cada uno con un reto. Se arma, se juega y la fiesta se arma sola.</p>
<h3>Qué incluye</h3>
<ul>
  <li>51 bloques con retos y penitencias</li>
  <li>Instrucciones</li>
  <li>Guía digital: 25 juegos para fiestas</li>
  <li>1 vaso tequilero</li>
</ul>
<h3>Cómo se juega</h3>
<p>Se arma la torre. Cada jugador saca un bloque y cumple el reto que dice. Si tumbas la torre, penitencia.</p>
<p><em>¿Vas a comprar más de uno? Con el <a href="/products/combo-2-torres">Combo 2 Torres</a> ahorras $17.</em></p>
${GARANTIA}`,
  },
  {
    handle: 'torre-de-shots-picante',
    titulo: 'Torre de Shots Picante',
    tipo: 'Juego físico',
    tags: 'torre,fiesta,grupos,picante,contraentrega',
    precio: 28,
    comparar: null,
    gramos: 1400,
    imagen: `${IMG}/torre-picante-brillo.jpg`,
    alt: 'Torre de Shots Picante de Shotygames',
    opcion: null,
    seoTitulo: 'Torre de Shots Picante | Retos atrevidos | Ecuador',
    seoDesc: '51 bloques con retos picantes para reuniones sin vergüenza. $28 con envío GRATIS a todo Ecuador, pago contraentrega.',
    cuerpo: `
<p><strong>Para las reuniones donde ya nadie se hace el tímido.</strong> Los mismos 51 bloques, pero con retos que rompen el hielo de una.</p>
<h3>Qué incluye</h3>
<ul>
  <li>51 bloques con retos picantes y penitencias</li>
  <li>Instrucciones</li>
  <li>Guía digital: 25 juegos para fiestas</li>
  <li>1 vaso tequilero</li>
</ul>
<p><em>¿Vas a comprar más de uno? Con el <a href="/products/combo-2-torres">Combo 2 Torres</a> ahorras $17.</em></p>
${GARANTIA}`,
  },
  {
    handle: 'torre-de-shots-parejas',
    titulo: 'Torre de Shots Parejas',
    tipo: 'Juego físico',
    tags: 'torre,parejas,regalo,contraentrega',
    precio: 28,
    comparar: null,
    gramos: 1400,
    imagen: `${IMG}/torre-parejas-foto.jpg`,
    alt: 'Torre de Shots Parejas de Shotygames',
    opcion: null,
    seoTitulo: 'Torre de Shots Parejas | Juego para dos | Ecuador',
    seoDesc: '51 bloques con retos para parejas + guía de 30 posiciones de regalo. $28 con envío GRATIS a todo Ecuador, pago contraentrega.',
    cuerpo: `
<p><strong>Para salir de "y qué hacemos hoy".</strong> 51 bloques con retos para dos. Sube la tensión sin que tengan que planear nada.</p>
<h3>Qué incluye</h3>
<ul>
  <li>51 bloques con retos para parejas</li>
  <li>Instrucciones</li>
  <li>Guía digital: 30 posiciones</li>
  <li>1 vaso tequilero</li>
</ul>
<p><em>Con el <a href="/products/combo-parejas-hot">Combo Parejas Hot</a> te llevas además los Dados del Placer por $33.</em></p>
${GARANTIA}`,
  },
  {
    handle: 'enganchados',
    titulo: 'Enganchados — Juego de mesa con tabla de shots',
    tipo: 'Juego físico',
    tags: 'juego,fiesta,grupos,contraentrega',
    precio: 28,
    comparar: null,
    gramos: 1800,
    imagen: `${IMG}/combo-full-torres.jpg`, // TODO: reemplazar por foto propia de Enganchados
    alt: 'Enganchados, juego de mesa de madera de Shotygames',
    opcion: null,
    seoTitulo: 'Enganchados | Juego de madera con tabla de shots | Ecuador',
    seoDesc: 'Juego de madera con tabla de shots, vaso y dado. $28 con envío GRATIS a todo Ecuador, pago contraentrega.',
    cuerpo: `
<p><strong>Otro formato, la misma bulla.</strong> Juego de madera con tabla de shots, vaso y dado. Rápido de entender, difícil de soltar.</p>
<h3>Qué incluye</h3>
<ul>
  <li>Juego de madera</li>
  <li>Tabla de shots</li>
  <li>1 vaso</li>
  <li>1 dado</li>
  <li>Instrucciones</li>
  <li>Guía digital: 25 juegos para fiestas</li>
</ul>
${GARANTIA}`,
  },

  // ————————————————————————— DIGITALES (sin envío — ver nota en README)
  {
    handle: 'emparejados-digital',
    titulo: 'Emparejados — Juego digital de cartas para parejas',
    tipo: 'Juego digital',
    tags: 'digital,parejas,descargable',
    precio: 4.9,
    comparar: null,
    gramos: 0,
    requiereEnvio: false,
    imagen: `${IMG}/torre-parejas-foto.jpg`, // TODO: reemplazar por mockup propio de Emparejados
    alt: 'Emparejados, juego digital de cartas para parejas',
    opcion: null,
    seoTitulo: 'Emparejados | Juego digital para parejas | Descarga inmediata',
    seoDesc: 'Juego digital de cartas para parejas. Descarga inmediata por $4.90.',
    cuerpo: `
<p><strong>Descarga inmediata, sin esperar envío.</strong> Juego de cartas digital para parejas. Lo abres en el celular y ya están jugando.</p>
<ul>
  <li>Descarga inmediata tras la compra</li>
  <li>Se juega desde el celular</li>
  <li>Sin costo de envío</li>
</ul>`,
  },
  {
    handle: 'dados-digitales',
    titulo: 'Dados Digitales — 4 dados para parejas',
    tipo: 'Juego digital',
    tags: 'digital,parejas,descargable',
    precio: 3.9,
    comparar: null,
    gramos: 0,
    requiereEnvio: false,
    imagen: `${IMG}/combo-parejas-hot.jpg`, // TODO: reemplazar por mockup propio de Dados Digitales
    alt: 'Dados digitales de Shotygames',
    opcion: null,
    seoTitulo: 'Dados Digitales | 4 dados para parejas | Descarga inmediata',
    seoDesc: '4 dados digitales: acción, zona, tiempo e intensidad. Descarga inmediata por $3.90.',
    cuerpo: `
<p><strong>Cuatro dados, infinitas combinaciones.</strong> Acción, zona, tiempo e intensidad. Descarga inmediata.</p>
<ul>
  <li>4 dados: acción, zona, tiempo, intensidad</li>
  <li>Descarga inmediata tras la compra</li>
  <li>Sin costo de envío</li>
</ul>`,
  },
];

// ————————————————————————————————————————————————————————————
// Generación del CSV

const COLUMNAS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Policy',
  'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
  'Variant Requires Shipping', 'Variant Taxable', 'Variant Weight Unit',
  'Image Src', 'Image Position', 'Image Alt Text',
  'Gift Card', 'SEO Title', 'SEO Description', 'Status',
];

const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const filas = [];

for (const p of PRODUCTOS) {
  const requiereEnvio = p.requiereEnvio !== false;
  const valores = p.opcion ? p.opcion.valores : ['Default Title'];

  valores.forEach((valor, i) => {
    const esPrimera = i === 0;
    filas.push({
      'Handle': p.handle,
      // Solo la primera fila de cada producto lleva los campos a nivel producto
      'Title': esPrimera ? p.titulo : '',
      'Body (HTML)': esPrimera ? p.cuerpo.trim() : '',
      'Vendor': esPrimera ? VENDOR : '',
      'Type': esPrimera ? p.tipo : '',
      'Tags': esPrimera ? p.tags : '',
      'Published': esPrimera ? 'TRUE' : '',
      'Option1 Name': esPrimera ? (p.opcion ? p.opcion.nombre : 'Title') : '',
      'Option1 Value': valor,
      'Variant SKU': p.opcion ? `${p.handle}-${slug(valor)}` : p.handle,
      'Variant Grams': p.gramos,
      'Variant Inventory Tracker': '',            // sin control de stock: se produce a pedido
      'Variant Inventory Policy': 'deny',
      'Variant Fulfillment Service': 'manual',
      'Variant Price': p.precio.toFixed(2),
      'Variant Compare At Price': p.comparar ? p.comparar.toFixed(2) : '',
      'Variant Requires Shipping': requiereEnvio ? 'TRUE' : 'FALSE',
      'Variant Taxable': 'TRUE',
      'Variant Weight Unit': 'g',
      'Image Src': esPrimera ? p.imagen : '',
      'Image Position': esPrimera ? '1' : '',
      'Image Alt Text': esPrimera ? p.alt : '',
      'Gift Card': esPrimera ? 'FALSE' : '',
      'SEO Title': esPrimera ? p.seoTitulo : '',
      'SEO Description': esPrimera ? p.seoDesc : '',
      'Status': esPrimera ? 'active' : '',
    });
  });
}

const csv = [
  COLUMNAS.join(','),
  ...filas.map((f) => COLUMNAS.map((c) => esc(f[c])).join(',')),
].join('\n') + '\n';

const salida = path.join(__dirname, 'productos-shopify.csv');
fs.writeFileSync(salida, csv, 'utf8');

console.log(`✅ ${salida}`);
console.log(`   ${PRODUCTOS.length} productos, ${filas.length} variantes`);
