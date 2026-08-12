/**
 * Cliente de la Shopify Admin API — client credentials grant.
 *
 * Desde el 1 de enero 2026 Shopify ya no entrega un Admin API access token
 * estático desde la UI de apps custom. En su lugar se intercambia el
 * Client ID + Client Secret por un token que expira cada 24h. Este archivo
 * hace ese intercambio automáticamente y lo renueva cuando hace falta —
 * no hay que copiar/pegar tokens nunca.
 *
 * Requisito de Shopify: la app y la tienda deben pertenecer a la misma
 * organización en el Dev Dashboard. Si no, el intercambio falla.
 *
 * Verificar la conexión:
 *   node projects/tienda-shopify/shopify.js
 *
 * Usar desde otro script:
 *   const { rest, graphql } = require('./projects/tienda-shopify/shopify');
 *   const { products } = await rest('GET', 'products.json?limit=10');
 *
 * Las credenciales se leen de .env y el token NUNCA se imprime completo.
 */

require('dotenv').config();

const STORE     = (process.env.SHOPIFY_STORE_URL || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const CLIENT_ID = process.env.SHOPIFY_API_KEY || '';
const SECRET    = process.env.SHOPIFY_API_SECRET || '';
const VERSION   = process.env.SHOPIFY_API_VERSION || '2025-07';

function checarConfig() {
  const faltan = [];
  if (!STORE) faltan.push('SHOPIFY_STORE_URL');
  if (!CLIENT_ID) faltan.push('SHOPIFY_API_KEY');
  if (!SECRET) faltan.push('SHOPIFY_API_SECRET');
  if (faltan.length) {
    throw new Error(`Faltan variables en .env: ${faltan.join(', ')}`);
  }
  if (!/\.myshopify\.com$/.test(STORE)) {
    throw new Error(`SHOPIFY_STORE_URL debe terminar en .myshopify.com (recibido: "${STORE}")`);
  }
}

const base = () => `https://${STORE}/admin/api/${VERSION}`;

// ─────────────────────────────────────────────────────────────
// Token cacheado en memoria — se renueva solo antes de expirar

let cache = { token: null, expira: 0, scope: '' };

async function obtenerToken() {
  checarConfig();

  if (cache.token && Date.now() < cache.expira) return cache.token;

  const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: SECRET,
    }),
  });

  const datos = await res.json();
  if (!res.ok || !datos.access_token) {
    const err = new Error(`No se pudo obtener el token (${res.status})`);
    err.status = res.status;
    err.detalle = datos;
    throw err;
  }

  // Margen de 60s para no usar un token que expira en el mismo request
  cache = {
    token: datos.access_token,
    scope: datos.scope || '',
    expira: Date.now() + (datos.expires_in - 60) * 1000,
  };
  return cache.token;
}

async function headers() {
  const token = await obtenerToken();
  return {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/** Llamada REST. ruta ej: 'products.json?limit=5' */
async function rest(metodo, ruta, cuerpo) {
  const res = await fetch(`${base()}/${ruta.replace(/^\//, '')}`, {
    method: metodo,
    headers: await headers(),
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await res.text();
  let datos;
  try { datos = texto ? JSON.parse(texto) : {}; } catch { datos = { raw: texto }; }

  if (!res.ok) {
    const err = new Error(`Shopify REST ${metodo} ${ruta} → ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.detalle = datos;
    throw err;
  }
  return datos;
}

/** Llamada GraphQL a la Admin API. */
async function graphql(query, variables = {}) {
  const res = await fetch(`${base()}/graphql.json`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ query, variables }),
  });
  const datos = await res.json();
  if (datos.errors) {
    const err = new Error('Shopify GraphQL devolvió errores');
    err.detalle = datos.errors;
    throw err;
  }
  return datos.data;
}

// ─────────────────────────────────────────────────────────────
// Verificación de conexión (node projects/tienda-shopify/shopify.js)

async function verificar() {
  checarConfig();
  console.log(`Tienda:  ${STORE}`);
  console.log(`API:     ${VERSION}`);
  console.log(`Client:  ${CLIENT_ID.slice(0, 6)}…\n`);

  await obtenerToken();
  console.log(`✅ Token obtenido (expira en 24h, se renueva solo)`);
  console.log(`   Scopes del token: ${cache.scope}\n`);

  const { shop } = await rest('GET', 'shop.json');
  console.log('✅ Conexión OK');
  console.log(`   Nombre:  ${shop.name}`);
  console.log(`   Dominio: ${shop.domain}`);
  console.log(`   Moneda:  ${shop.currency}`);
  console.log(`   País:    ${shop.country_name}`);
  console.log(`   Plan:    ${shop.plan_display_name}\n`);

  // write_X en Shopify ya incluye lectura de X — no hace falta read_X aparte
  const tiene = cache.scope.split(',').map((s) => s.trim()).filter(Boolean);
  const recursos = ['products', 'orders', 'themes', 'inventory'];
  const faltantes = recursos.filter((r) => !tiene.includes(`write_${r}`) && !tiene.includes(`read_${r}`));
  if (faltantes.length) {
    console.log('⚠️  Recursos sin acceso (ni read ni write):');
    faltantes.forEach((r) => console.log(`   - ${r}`));
    console.log('   Se agregan creando una nueva versión de la app en el Dev Dashboard.\n');
  } else {
    console.log('✅ Acceso confirmado a products, orders, themes e inventory\n');
  }

  // Estado actual del catálogo
  const { count } = await rest('GET', 'products/count.json');
  console.log(`Productos en la tienda: ${count}`);
  if (count > 0) {
    const { products } = await rest('GET', 'products.json?limit=20&fields=id,title,handle,status,variants');
    products.forEach((p) => {
      const precios = [...new Set(p.variants.map((v) => v.price))].join(' / ');
      console.log(`   [${p.status}] ${p.title} — $${precios}`);
    });
  }
}

if (require.main === module) {
  verificar().catch((e) => {
    console.error(`\n❌ ${e.message}`);
    if (e.status === 401 || e.status === 400) {
      console.error('   Client ID / Secret inválidos, o la app no pertenece a la misma organización que la tienda.');
    }
    if (e.status === 403) console.error('   El token no tiene los scopes necesarios para esa llamada.');
    if (e.status === 404) console.error('   Revisa SHOPIFY_STORE_URL — ¿es el dominio .myshopify.com correcto?');
    if (e.detalle) console.error('  ', JSON.stringify(e.detalle));
    process.exit(1);
  });
}

module.exports = { rest, graphql, STORE, VERSION };
