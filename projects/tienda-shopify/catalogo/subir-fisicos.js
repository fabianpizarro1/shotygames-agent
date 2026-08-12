/**
 * Sube a Shopify los 4 productos físicos individuales: las 3 torres + Enganchados.
 * NO toca combos ni digitales — eso se sube aparte cuando se confirme.
 *
 * Uso: node projects/tienda-shopify/catalogo/subir-fisicos.js
 *
 * Enganchados no tiene foto propia todavía (el catálogo solo tiene fotos de
 * torres y combos) — se sube como DRAFT para que no sea visible con una
 * imagen que no es del producto real.
 */

require('dotenv').config();
const { rest } = require('../shopify');

const IMG = 'https://catalogo.shotygames.com/images/products';
const VENDOR = 'Shotygames';

const GARANTIA = `
<h3>Pago contraentrega</h3>
<p>Pagas en efectivo cuando recibes el paquete en tu casa. No necesitas tarjeta ni transferencia.</p>
<h3>Envío gratis a todo Ecuador</h3>
<p>Envío GRATIS a todo Ecuador vía Servientrega, desde Machala. Pedidos antes de las 15:00 salen el mismo día; después de las 15:00 salen al día siguiente.</p>
`.trim();

const PRODUCTOS = [
  {
    handle: 'torre-de-shots-normal',
    title: 'Torre de Shots Normal',
    product_type: 'Juego físico',
    tags: 'torre,fiesta,grupos,contraentrega',
    price: '28.00',
    grams: 1400,
    image: `${IMG}/torre-normal-foto.jpg`,
    alt: 'Torre de Shots Normal de Shotygames',
    status: 'active',
    body_html: `
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
${GARANTIA}`,
  },
  {
    handle: 'torre-de-shots-picante',
    title: 'Torre de Shots Picante',
    product_type: 'Juego físico',
    tags: 'torre,fiesta,grupos,picante,contraentrega',
    price: '28.00',
    grams: 1400,
    image: `${IMG}/torre-picante-brillo.jpg`,
    alt: 'Torre de Shots Picante de Shotygames',
    status: 'active',
    body_html: `
<p><strong>Para las reuniones donde ya nadie se hace el tímido.</strong> Los mismos 51 bloques, pero con retos que rompen el hielo de una.</p>
<h3>Qué incluye</h3>
<ul>
  <li>51 bloques con retos picantes y penitencias</li>
  <li>Instrucciones</li>
  <li>Guía digital: 25 juegos para fiestas</li>
  <li>1 vaso tequilero</li>
</ul>
${GARANTIA}`,
  },
  {
    handle: 'torre-de-shots-parejas',
    title: 'Torre de Shots Parejas',
    product_type: 'Juego físico',
    tags: 'torre,parejas,regalo,contraentrega',
    price: '28.00',
    grams: 1400,
    image: `${IMG}/torre-parejas-foto.jpg`,
    alt: 'Torre de Shots Parejas de Shotygames',
    status: 'active',
    body_html: `
<p><strong>Para salir de "y qué hacemos hoy".</strong> 51 bloques con retos para dos. Sube la tensión sin que tengan que planear nada.</p>
<h3>Qué incluye</h3>
<ul>
  <li>51 bloques con retos para parejas</li>
  <li>Instrucciones</li>
  <li>Guía digital: 30 posiciones</li>
  <li>1 vaso tequilero</li>
</ul>
${GARANTIA}`,
  },
  {
    handle: 'enganchados',
    title: 'Enganchados — Juego de mesa con tabla de shots',
    product_type: 'Juego físico',
    tags: 'juego,fiesta,grupos,contraentrega',
    price: '28.00',
    grams: 1800,
    image: null, // sin foto propia todavía — se sube sin imagen, no con una equivocada
    alt: null,
    status: 'draft', // no visible hasta tener foto real y pasar a 'active'
    body_html: `
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
];

async function subir() {
  console.log(`Subiendo ${PRODUCTOS.length} productos físicos...\n`);

  for (const p of PRODUCTOS) {
    const payload = {
      product: {
        title: p.title,
        body_html: p.body_html.trim(),
        vendor: VENDOR,
        product_type: p.product_type,
        tags: p.tags,
        status: p.status,
        variants: [
          {
            price: p.price,
            grams: p.grams,
            requires_shipping: true,
            taxable: true,
            inventory_management: null, // se produce a pedido, sin control de stock
          },
        ],
        images: p.image ? [{ src: p.image, alt: p.alt }] : [],
      },
    };

    try {
      const { product } = await rest('POST', 'products.json', payload);
      const nota = p.status === 'draft' ? '  ⚠️  DRAFT — falta foto real' : '';
      console.log(`✅ ${product.title} (id ${product.id}) — $${p.price}${nota}`);
    } catch (e) {
      console.error(`❌ ${p.title}: ${e.message}`);
      if (e.detalle) console.error('   ', JSON.stringify(e.detalle));
    }
  }

  console.log('\nListo. Combos y digitales quedan pendientes hasta que confirmes.');
}

subir();
