/**
 * audiencia-compradores.js — Mantener al día la audiencia de exclusión de
 * Truquito / Avanora en Meta.
 *
 * Para qué sirve: excluir de las campañas a quien YA compró. Cada día que un
 * cliente nuevo no entra a la audiencia, Meta le sigue mostrando el anuncio de
 * un producto que ya tiene en la casa — plata tirada, y encima molesta.
 *
 * Es el equivalente de `audiencias-meta.js` (ShotyGames) para dropshipping. La
 * diferencia es la fuente: acá los pedidos salen del Sheet DROPSHIPPING, que
 * tiene columna TIENDA, y no de las hojas de ShotyGames.
 *
 * ── Reglas que NO se pueden cambiar sin romper esto en silencio ──
 *
 * 1. **Los teléfonos van en E.164 (`593` + número sin el 0 inicial).** La API de
 *    Meta NO agrega el código de país ni saca el 0: hashea lo que le mandes. Si
 *    subís `0991431883` crudo, el hash no coincide con el que Meta tiene del
 *    cliente y el registro no matchea a NADIE. No da error — simplemente la
 *    exclusión no funciona. Ya pasó con ShotyGames el 2026-08-14.
 *
 * 2. **El hash lo hacemos nosotros**, SHA-256 del valor ya normalizado.
 *
 * 3. **Compró = tiene un pedido de verdad.** PENDIENTE_CONFIRMACION y CANCELADO
 *    quedan afuera a propósito: el primero todavía no confirmó y el segundo se
 *    cayó antes de despachar. A esos SÍ conviene seguir mostrándoles el anuncio.
 *    DEVUELTO sí entra: el pedido existió, el cliente ya conoce el producto y
 *    lo rechazó — volver a perseguirlo es la peor plata de todas.
 *
 * 4. **Se sube siempre con ADD y sin diffear.** Meta deduplica solo, así que
 *    re-subir a alguien que ya estaba no rompe nada, y el script es idempotente:
 *    si un día falla, el siguiente lo recupera solo.
 *
 * 5. **Las columnas se resuelven por TÍTULO, nunca por letra fija.** El Sheet
 *    creció de columnas más de una vez.
 *
 * Uso:
 *   node projects/dropshipping/audiencia-compradores.js --dry-run
 *   node projects/dropshipping/audiencia-compradores.js
 *   node projects/dropshipping/audiencia-compradores.js --tienda avanora
 */

require('dotenv').config();
const crypto = require('crypto');
const https = require('https');
const { google } = require('googleapis');

const API = 'v21.0';

/**
 * Audiencias de exclusión por tienda. Las dos viven en la cuenta publicitaria
 * de AVANORA NATURALS (`1284579892343452`), que es la que usan las dos tiendas.
 */
const AUDIENCIAS = {
  truquito: '120252426732750787', // EXCLUIR — Truquito (ya compraron)
};

/** Estados que significan "este cliente ya compró". Ver la regla 3 de arriba. */
const ESTADOS_COMPRARON = new Set([
  'EN_DROPI',
  'GUIA_GENERADA',
  'NOVEDAD',
  'ENTREGADO',
  'PAGADO',
  'DEVUELTO',
]);

/** El número con el que Fabián prueba el checkout. Ninguna fila suya es un cliente. */
const TELEFONO_PRUEBA = '593985366649';

/**
 * Teléfono ecuatoriano → E.164, o null si no sirve para subir.
 * "0991431883" → "593991431883" | "991431883" → "593991431883"
 */
function aE164(valor) {
  let s = String(valor || '').replace(/\D/g, '');
  if (!s) return null;
  if (s.startsWith('593')) s = s.slice(3);
  if (s.startsWith('0')) s = s.replace(/^0+/, '');
  // Un móvil ecuatoriano son 9 dígitos. Más corto es un dato incompleto y más
  // largo es un typo: subirlo igual solo ensucia la audiencia sin matchear.
  if (s.length !== 9) return null;
  return '593' + s;
}

const hash = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

const normalizar = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();

function sheetsCliente() {
  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth: oauth });
}

function postMeta(ruta, cuerpo, token) {
  return new Promise((resolve, reject) => {
    const datos = JSON.stringify(cuerpo);
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/${API}/${ruta}?access_token=${encodeURIComponent(token)}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(datos) },
        timeout: 60000,
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(d); } catch {}
          if (res.statusCode >= 400 || json?.error) {
            return reject(new Error(json?.error?.message || `HTTP ${res.statusCode}: ${d.slice(0, 200)}`));
          }
          resolve(json);
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout hablando con Meta')));
    req.on('error', reject);
    req.write(datos);
    req.end();
  });
}

/** Lee el Sheet y devuelve los teléfonos E.164 únicos de quien ya compró. */
async function telefonosQueCompraron(tienda) {
  const id = process.env.SHEETS_ID_DROPSHIPPING;
  if (!id) throw new Error('Falta SHEETS_ID_DROPSHIPPING en .env');

  const s = sheetsCliente();
  const enc = (await s.spreadsheets.values.get({ spreadsheetId: id, range: 'PEDIDOS!A1:AZ1' }))
    .data.values?.[0] || [];
  const cabeceras = enc.map(normalizar);
  const col = (titulo) => {
    const i = cabeceras.indexOf(normalizar(titulo));
    if (i === -1) throw new Error(`No encuentro la columna "${titulo}". Hay: ${enc.filter(Boolean).join(' | ')}`);
    return i;
  };
  const C = { tienda: col('TIENDA'), estado: col('ESTADO'), tel: col('TELÉFONO') };

  const filas = (await s.spreadsheets.values.get({ spreadsheetId: id, range: 'PEDIDOS!A2:AZ5000' }))
    .data.values || [];

  const vistos = new Set();
  let compraron = 0, invalidos = 0, prueba = 0;

  for (const f of filas) {
    if (!f || !f.some((c) => String(c || '').trim())) continue;
    if (normalizar(f[C.tienda]) !== normalizar(tienda)) continue;
    if (!ESTADOS_COMPRARON.has(normalizar(f[C.estado]))) continue;
    compraron++;
    const tel = aE164(f[C.tel]);
    if (!tel) { invalidos++; continue; }
    if (tel === TELEFONO_PRUEBA) { prueba++; continue; }
    vistos.add(tel);
  }

  return { telefonos: [...vistos], compraron, invalidos, prueba };
}

/** Sube teléfonos a una audiencia, en tandas de 500 (límite seguro de Meta). */
async function subir(audienceId, telefonos, token) {
  let recibidos = 0, invalidos = 0;
  for (let i = 0; i < telefonos.length; i += 500) {
    const tanda = telefonos.slice(i, i + 500);
    const r = await postMeta(`${audienceId}/users`, {
      payload: { schema: ['PHONE'], data: tanda.map((t) => [hash(t)]) },
    }, token);
    recibidos += r?.num_received ?? 0;
    invalidos += r?.num_invalid_entries ?? 0;
  }
  return { recibidos, invalidos };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const iT = args.indexOf('--tienda');
  const tienda = (iT !== -1 ? args[iT + 1] : 'truquito').toLowerCase();

  const audienceId = AUDIENCIAS[tienda];
  if (!audienceId) {
    throw new Error(`No hay audiencia configurada para "${tienda}". Hay: ${Object.keys(AUDIENCIAS).join(', ')}`);
  }

  const { telefonos, compraron, invalidos, prueba } = await telefonosQueCompraron(tienda);

  console.log(`\nTienda: ${tienda.toUpperCase()}  →  audiencia ${audienceId}`);
  console.log(`  pedidos de quien ya compró : ${compraron}`);
  console.log(`  teléfonos únicos a subir   : ${telefonos.length}`);
  if (invalidos) console.log(`  descartados por teléfono malo: ${invalidos}`);
  if (prueba) console.log(`  descartados por ser el número de prueba: ${prueba}`);

  if (dryRun) {
    console.log('\n[DRY RUN] No se subió nada a Meta.\n');
    return;
  }
  if (!telefonos.length) {
    console.log('\nNada que subir.\n');
    return;
  }

  const token = process.env.META_ADS_TOKEN;
  if (!token) throw new Error('Falta META_ADS_TOKEN en .env');

  const r = await subir(audienceId, telefonos, token);
  console.log(`\n✅ Meta recibió ${r.recibidos} registros (inválidos: ${r.invalidos}).\n`);
}

if (require.main === module) {
  main().catch((e) => { console.error('❌', e.message); process.exit(1); });
}

module.exports = { aE164, telefonosQueCompraron, ESTADOS_COMPRARON, AUDIENCIAS };
