/**
 * Scanner del catálogo de DROPI — cuenta de DROPSHIPPER (la segunda cuenta).
 *
 * Por qué existe: la única señal honesta de "producto ganador" no es la opinión
 * de nadie ni un video de TikTok — es cuánto stock se movió de verdad en la
 * plataforma. Este script baja el catálogo completo todos los días y guarda un
 * snapshot. Comparando dos snapshots ves qué productos están saliendo y a qué
 * velocidad. Eso es data real del proveedor, no adivinanza.
 *
 * Requiere en .env (agregarlas a mano, son de la cuenta de dropshipper):
 *   DROPI2_EMAIL, DROPI2_PASSWORD, DROPI2_TOTP_SECRET
 *
 * Comandos:
 *   node projects/dropshipping/catalogo.js login              verifica credenciales
 *   node projects/dropshipping/catalogo.js buscar <texto>     busca en el catálogo
 *   node projects/dropshipping/catalogo.js snapshot           baja el catálogo y lo guarda
 *   node projects/dropshipping/catalogo.js delta              compara los 2 últimos snapshots
 *   node projects/dropshipping/catalogo.js ver <id>           ficha completa de un producto
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { _generateTotp: generateTotp, _makeClient: makeClient } = require('../../dropi');

const BASE = 'https://api.dropi.ec/api';
const TOKEN_FILE = '/tmp/.dropi2_token';
const DATA_DIR = path.join(__dirname, 'data');
const PAGE_SIZE = 100;
const MAX_PAGINAS = 400;          // tope de seguridad: 40.000 productos
                                  // (el catálogo EC medía ~33.000 el 2026-08-08)
const PAUSA_MS = 350;             // no golpear la API del proveedor

// Los sec-fetch-* NO son decorativos: sin ellos DROPI responde 403 "Access denied"
// al login, aunque el correo y la contraseña sean correctos. Copiados tal cual de
// dropi.js. Si se tocan, el login deja de funcionar.
const HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'es-EC,es;q=0.9',
  'content-type': 'application/json',
  'origin': 'https://app.dropi.ec',
  'referer': 'https://app.dropi.ec/login',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site'
};

// ─── Autenticación ───────────────────────────────────────────────────────────

function decodeJwtPayload(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
  } catch (_) { return null; }
}

async function login() {
  const email = process.env.DROPI2_EMAIL;
  const password = process.env.DROPI2_PASSWORD;
  const totpSecret = process.env.DROPI2_TOTP_SECRET;

  if (!email || !password) {
    throw new Error('Faltan DROPI2_EMAIL / DROPI2_PASSWORD en .env (cuenta de dropshipper)');
  }

  // 2FA activo desde el 2026-08-30. El OTP sigue siendo opcional en el código
  // por si alguna vez se desactiva, pero hoy sin DROPI2_TOTP_SECRET no entra.
  const otp = totpSecret ? generateTotp(totpSecret) : undefined;
  const body = { email, password, white_brand_id: 1, brand: '', with_cdc: false };
  if (otp) body.otp = otp;

  const res = await axios.post(`${BASE}/login`, body, { headers: HEADERS, timeout: 30000 });

  let token = res.data?.token;
  if (!token) throw new Error('Login falló: sin token en la respuesta');

  // El token de /login puede ser uno temporal de solo-2FA. Se detecta por su payload.
  if (decodeJwtPayload(token)?.token_type === '2FA') {
    if (!otp) {
      throw new Error(
        'La cuenta pide 2FA pero no hay DROPI2_TOTP_SECRET en .env. ' +
        'Si el 2FA ya está escaneado en Google Authenticator, la clave se recupera sin tocar DROPI: ' +
        'exportá la cuenta desde Authenticator y decodificá el QR con scripts/decodificar-qr-2fa.py'
      );
    }
    const verify = await axios.post(`${BASE}/auth/2fa/verify`, { token, code: otp }, { headers: HEADERS, timeout: 30000 });
    token = verify.data?.token;
  }
  if (!token) throw new Error('Login falló: sin token tras la verificación 2FA');

  fs.writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
  return token;
}

async function getToken() {
  try {
    const saved = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (saved) return saved;
  } catch (_) {}
  return login();
}

/**
 * Cliente autenticado. Reusa el de dropi.js a propósito: DROPI rechaza con
 * 403 "Access denied" si se manda el header `authorization` junto al
 * `x-authorization` — solo acepta este último. Perdimos un rato con eso el
 * 2026-08-08. No agregar `authorization` acá.
 */
function client(token) {
  return makeClient(token);
}

/** Ejecuta una llamada y reintenta una vez con login fresco si el token expiró. */
async function conToken(fn) {
  let token = await getToken();
  try {
    return await fn(client(token));
  } catch (e) {
    if (e.response?.status === 401) {
      token = await login();
      return fn(client(token));
    }
    throw e;
  }
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

/**
 * Una página del catálogo. El parámetro de búsqueda es `keywords` — `textToSearch`
 * la API lo acepta pero lo ignora y devuelve todo (verificado el 2026-08-08).
 */
async function pagina({ keywords = '', pageSize = PAGE_SIZE, startData = 0 } = {}) {
  return conToken(async c => {
    const r = await c.post('/products/index', { pageSize, startData, keywords });
    return r.data?.objects || [];
  });
}

async function buscar(texto) {
  return pagina({ keywords: texto, pageSize: 50 });
}

async function verProducto(id) {
  return conToken(async c => (await c.get(`/products/${id}`)).data?.objects);
}

// Mismo CDN que ya usan las guías de envío (ver pedidos.js) — `gallery[].url`
// casi siempre viene null, la ruta real está en `urlS3` y hay que armarla a mano.
const CDN = 'https://d39ru7awumhhs2.cloudfront.net/';

function urlImagen(gallery) {
  for (const g of gallery || []) {
    if (typeof g === 'string') return g;
    if (typeof g?.url === 'string') return g.url;
    if (typeof g?.urlS3 === 'string') return CDN + g.urlS3;
  }
  return null;
}

/** Se queda solo con lo que sirve para decidir — un snapshot completo pesa de más. */
function resumir(p) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    active: p.active,
    stock: p.stock,
    sale_price: parseFloat(p.sale_price) || 0,           // lo que TÚ le pagas al proveedor
    suggested_price: parseFloat(p.suggested_price) || 0, // lo que el proveedor sugiere cobrar
    weight: parseFloat(p.weight) || 0,
    user_id: p.user_id,                                  // proveedor dueño del producto
    proveedor: p.user?.store_name || p.user?.name || null,
    categorias: (p.categories || []).map(c => c.name || c.category?.name).filter(Boolean),
    imagenes: (p.gallery || []).length,
    imagen: urlImagen(p.gallery),
    variaciones: (p.variations || []).length
  };
}

/**
 * Pide una página reintentando los errores pasajeros del servidor.
 *
 * Sin esto, un 502 suelto tira abajo la descarga entera: pasó el 2026-08-25 en
 * la página 26 de ~340 y se perdieron cinco minutos de bajada. La API de DROPI
 * devuelve 502 esporádicos que se resuelven solos al segundo intento.
 */
async function paginaConReintento(opts, intentos = 4) {
  for (let n = 1; ; n++) {
    try {
      return await pagina(opts);
    } catch (e) {
      const status = e.response?.status;
      const pasajero = !status || status >= 500 || status === 429;
      if (!pasajero || n >= intentos) throw e;
      const espera = 2000 * n;
      process.stdout.write(`\n  ⚠ ${status || e.code} en startData ${opts.startData} — reintento ${n}/${intentos - 1} en ${espera / 1000}s\n`);
      await new Promise(r => setTimeout(r, espera));
    }
  }
}

async function descargarCatalogo() {
  const productos = [];
  const vistos = new Set();

  for (let i = 0; i < MAX_PAGINAS; i++) {
    const lote = await paginaConReintento({ startData: i * PAGE_SIZE });
    if (!lote.length) break;

    let nuevos = 0;
    for (const p of lote) {
      if (vistos.has(p.id)) continue;   // si la API ignora la paginación, cortamos
      vistos.add(p.id);
      productos.push(resumir(p));
      nuevos++;
    }
    process.stdout.write(`\r  descargados: ${productos.length}`);
    if (nuevos === 0 || lote.length < PAGE_SIZE) break;
    await new Promise(r => setTimeout(r, PAUSA_MS));
  }
  process.stdout.write('\n');
  return productos;
}

// ─── Snapshots y deltas ──────────────────────────────────────────────────────

function snapshotsExistentes() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR)
    .filter(f => /^snapshot-\d{4}-\d{2}-\d{2}(-\d{4})?\.json$/.test(f))
    .sort();
}

/**
 * Nunca sobrescribe. Si ya hay un snapshot de hoy, el nuevo se guarda con la
 * hora en el nombre — perder la foto base por correr el comando dos veces
 * costaría un día entero de espera.
 */
async function guardarSnapshot() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const productos = await descargarCatalogo();
  if (!productos.length) throw new Error('El catálogo vino vacío — revisar el endpoint o los permisos de la cuenta');

  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  let ruta = path.join(DATA_DIR, `snapshot-${fecha}.json`);

  if (fs.existsSync(ruta)) {
    const hhmm = ahora.toTimeString().slice(0, 5).replace(':', '');
    ruta = path.join(DATA_DIR, `snapshot-${fecha}-${hhmm}.json`);
  }

  fs.writeFileSync(ruta, JSON.stringify({
    fecha,
    tomado: ahora.toISOString(),
    total: productos.length,
    productos
  }, null, 2));

  return { fecha, total: productos.length, archivo: path.basename(ruta) };
}

/**
 * Compara los dos últimos snapshots. La métrica que importa es cuánto stock se
 * movió por día: si un producto bajó 300 unidades en 3 días, se está vendiendo.
 */
function delta() {
  const archivos = snapshotsExistentes();
  if (archivos.length < 2) {
    throw new Error(`Hacen falta al menos 2 snapshots para comparar (hay ${archivos.length}). Corré "snapshot" un día más.`);
  }

  const antes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, archivos[archivos.length - 2]), 'utf8'));
  const ahora = JSON.parse(fs.readFileSync(path.join(DATA_DIR, archivos[archivos.length - 1]), 'utf8'));

  // Se mide con la hora real de cada toma, no con la fecha: dos snapshots del
  // mismo día separados por minutos darían un delta engañoso si se asumiera 1 día.
  const horas = (new Date(ahora.tomado || ahora.fecha) - new Date(antes.tomado || antes.fecha)) / 3600000;
  const dias = horas / 24;
  const previos = new Map(antes.productos.map(p => [p.id, p]));

  const movimientos = [];
  const nuevos = [];

  for (const p of ahora.productos) {
    const prev = previos.get(p.id);
    if (!prev) { nuevos.push(p); continue; }

    const vendidas = (prev.stock ?? 0) - (p.stock ?? 0);
    if (vendidas > 0) {
      movimientos.push({
        ...p,
        vendidas,
        porDia: vendidas / dias,
        cambioPrecio: p.sale_price - prev.sale_price
      });
    }
  }

  movimientos.sort((a, b) => b.porDia - a.porDia);
  return { desde: antes.fecha, hasta: ahora.fecha, horas, dias, movimientos, nuevos };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const usd = n => '$' + (n || 0).toFixed(2);

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case 'login': {
      const token = await login();
      const claims = decodeJwtPayload(token);
      console.log('✅ Login OK — cuenta de dropshipper conectada');
      console.log('   user_id:', claims?.sub || claims?.user_id || '(no visible en el token)');
      const muestra = await pagina({ pageSize: 5 });
      console.log(`   catálogo accesible: ${muestra.length ? 'sí' : 'no — revisar permisos'}`);
      muestra.slice(0, 5).forEach(p => console.log(`   ${p.id} | ${(p.name || '').slice(0, 40)} | proveedor ${p.user_id}`));
      break;
    }

    case 'buscar': {
      const texto = args.join(' ');
      if (!texto) return console.log('Uso: node projects/dropshipping/catalogo.js buscar <texto>');
      const res = (await buscar(texto)).map(resumir);
      console.log(`\n  ${res.length} resultados para "${texto}"\n`);
      res.forEach(p => console.log(
        `  ${String(p.id).padStart(7)} | ${(p.name || '').slice(0, 38).padEnd(38)} | costo ${usd(p.sale_price).padStart(8)} | sugerido ${usd(p.suggested_price).padStart(8)} | stock ${String(p.stock ?? '-').padStart(5)}`
      ));
      console.log('');
      break;
    }

    case 'snapshot': {
      const r = await guardarSnapshot();
      console.log(`✅ Snapshot ${r.fecha} guardado — ${r.total} productos`);
      const n = snapshotsExistentes().length;
      if (n < 2) console.log('   Corré esto de nuevo mañana: con 2 snapshots ya se puede medir qué se está vendiendo.');
      break;
    }

    case 'delta': {
      const d = delta();
      console.log(`\n  MOVIMIENTO DE STOCK — ${d.desde} → ${d.hasta} (${d.horas.toFixed(1)}h entre tomas)\n`);
      if (d.horas < 6) {
        console.log('  ⚠️  Menos de 6 horas entre snapshots: el ritmo por día es una extrapolación');
        console.log('      de una ventana muy corta. Tómalo como señal débil, no como dato.\n');
      }
      console.log('  ' + '─'.repeat(90));
      d.movimientos.slice(0, 25).forEach((p, i) => console.log(
        `  ${String(i + 1).padStart(2)}. ${(p.name || '').slice(0, 34).padEnd(34)} ` +
        `${p.porDia.toFixed(1).padStart(7)}/día  costo ${usd(p.sale_price).padStart(7)}  ` +
        `sug ${usd(p.suggested_price).padStart(7)}  ${p.cambioPrecio ? '⚠ precio ' + (p.cambioPrecio > 0 ? '+' : '') + p.cambioPrecio.toFixed(2) : ''}`
      ));
      console.log('  ' + '─'.repeat(90));
      console.log(`  ${d.movimientos.length} productos con movimiento · ${d.nuevos.length} productos nuevos en el catálogo\n`);
      break;
    }

    case 'ver': {
      const p = await verProducto(args[0]);
      if (!p) return console.log('No encontrado');
      console.log(JSON.stringify(resumir(p), null, 2));
      console.log('\nGalería:', (p.gallery || []).map(g => g.url || g.urlS3).filter(Boolean).join('\n         '));
      break;
    }

    default:
      console.log(`
  Scanner de catálogo DROPI — cuenta dropshipper

    login              verifica credenciales y acceso al catálogo
    buscar <texto>     busca productos
    snapshot           baja el catálogo completo y lo guarda
    delta              compara los 2 últimos snapshots (qué se está vendiendo)
    ver <id>           ficha completa de un producto
`);
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error('❌ ' + (e.response?.data?.message || e.message));
    process.exit(1);
  });
}

module.exports = { login, buscar, verProducto, pagina, descargarCatalogo, guardarSnapshot, delta, conToken, urlImagen };
