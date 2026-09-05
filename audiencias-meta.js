/**
 * audiencias-meta.js — Mantener al día las Custom Audiences de ShotyGames.
 *
 * Para qué sirve: excluir de las campañas a quien YA compró. Cada día que un
 * cliente nuevo no entra a la audiencia, Meta le sigue mostrando el anuncio de
 * un producto que ya tiene en la casa — plata tirada, y encima molesta.
 *
 * ── Reglas que NO se pueden cambiar sin romper esto en silencio ──
 *
 * 1. **Los teléfonos van en E.164 (`593` + número sin el 0 inicial).** La API de
 *    Meta NO agrega el código de país ni saca el 0: hashea lo que le mandes. Si
 *    subís `0991431883` crudo, el hash no coincide con el que Meta tiene del
 *    cliente y el registro no matchea a NADIE. No da error — simplemente la
 *    exclusión no funciona. Ya pasó el 2026-08-14 y hubo que resubir 550.
 *
 * 2. **El hash lo hacemos nosotros.** Por Graph API los datos van en SHA-256 del
 *    valor ya normalizado. (El MCP de Meta hashea solo; acá no hay MCP.)
 *
 * 3. **La categoría sale del texto libre de la columna PRODUCTOS**, no de las
 *    columnas de flags numéricos (N/P/PAR/ENG…): el nombre y el significado de
 *    esas columnas cambia entre las hojas de cada año.
 *
 * 4. **Se sube siempre con ADD y sin diffear.** Meta deduplica solo, así que
 *    re-subir a alguien que ya estaba no rompe nada. Eso permite que el cron sea
 *    idempotente: si un día falla, el día siguiente lo recupera solo con una
 *    ventana un poco más ancha.
 *
 * Ver `feedback_meta_audiencia_telefonos` y `project_meta_audiencias_emparejados`
 * en la memoria para el histórico completo.
 */

const crypto = require('crypto');
const https = require('https');
const { google } = require('googleapis');
const { aFechaLocal, hoyEC } = require('./fechas');

const CUENTA = '1451115062090627'; // Cuenta Publicitaria 10 — la única ACTIVE de ShotyGames
const API = 'v21.0';

/** Audiencia general: todo el que compró algo físico. */
const AUD_CLIENTES_FISICOS = '120241499332500352';

/** Audiencias por producto. La clave es la que devuelve `categorizar()`. */
const AUD_POR_PRODUCTO = {
  PAREJAS:     '120249155730520352',
  PICANTE:     '120249155730200352',
  NORMAL:      '120249155729980352',
  ENGANCHADOS: '120249155730890352',
  CARTAS:      '120249155731140352',
  // Emparejados es digital, pero entra en combos físicos ("1 PAREJA, 1 DADO,
  // 1 EMPAREJADOS (combo)"), y esa venta cuenta igual para excluirlo de los
  // anuncios de Emparejados. OJO: acá solo entra la parte FÍSICA. Las ventas
  // 100% digitales viven en las 2 hojas de VENTAS DIGITALES y NO las toca este
  // cron — ver `project_meta_audiencias_emparejados`.
  EMPAREJADOS: '120241344269020352',
};

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

/**
 * Qué productos trae un pedido, leyendo el texto libre de PRODUCTOS.
 * Un pedido puede caer en varias categorías (los combos son la norma).
 */
function categorizar(textoProductos, empa) {
  const t = String(textoProductos || '').toUpperCase();
  const cats = [];
  if (/PAREJA/.test(t)) cats.push('PAREJAS');
  if (/PICANTE/.test(t)) cats.push('PICANTE');
  if (/NORMAL/.test(t)) cats.push('NORMAL');
  if (/ENGANCHADO/.test(t)) cats.push('ENGANCHADOS');
  if (/CARTA/.test(t)) cats.push('CARTAS');
  // Emparejados tiene dos señales y se usan las dos: el texto de PRODUCTOS y la
  // columna EMPA (el bot de Telegram la escribe desde el 2026-08-20). Cualquiera
  // de las dos alcanza — una sola dejaba pedidos afuera según cómo se cargó.
  if (/EMPAREJADO/.test(t) || Number(empa) > 0) cats.push('EMPAREJADOS');
  return cats;
}

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
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/${API}/${ruta}?access_token=${encodeURIComponent(token)}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(datos) },
      timeout: 60000,
    }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(d); } catch {}
        if (res.statusCode >= 400 || json?.error) {
          return reject(new Error(json?.error?.message || `HTTP ${res.statusCode}: ${d.slice(0, 200)}`));
        }
        resolve(json);
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout hablando con Meta')));
    req.on('error', reject);
    req.write(datos); req.end();
  });
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

/**
 * @param {object} opts
 * @param {string} [opts.desde]  "YYYY-MM-DD" inclusive. Por defecto: hoy en Ecuador.
 * @param {string} [opts.hasta]  "YYYY-MM-DD" inclusive. Por defecto: hoy en Ecuador.
 * @param {boolean} [opts.dryRun] Si es true NO llama a Meta. Solo cuenta.
 */
async function actualizarAudiencias({ desde, hasta, dryRun = false } = {}) {
  // META_ADS_TOKEN es de otro Business Manager (Avanora) y no ve estas cuentas.
  // META_AUDIENCIAS_TOKEN existe por si hay que darle uno con más permisos que
  // el de CAPI sin tocar el resto de las integraciones que ya usan ese.
  const token = process.env.META_AUDIENCIAS_TOKEN || process.env.META_CAPI_TOKEN;
  if (!token) throw new Error('Falta META_AUDIENCIAS_TOKEN o META_CAPI_TOKEN');
  if (!process.env.SHEETS_ID) throw new Error('Falta SHEETS_ID');

  const hoy = hoyEC();
  const ini = desde || hoy;
  const fin = hasta || hoy;

  const sheets = sheetsCliente();
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEETS_ID,
    range: 'PEDIDOS!A1:AN10000',
  });
  const filas = r.data.values || [];
  const H = filas[0] || [];
  const iFecha = H.indexOf('FECHA');
  const iTel = H.indexOf('TELEFONO');
  const iProd = H.indexOf('PRODUCTOS');
  const iEmpa = H.indexOf('EMPA');
  if (iFecha < 0 || iTel < 0) throw new Error('El Sheet no tiene FECHA o TELEFONO — ¿cambiaron los encabezados?');

  // Set por audiencia: dedupe automático dentro de la corrida.
  const porAudiencia = { CLIENTES_FISICOS: new Set() };
  for (const k of Object.keys(AUD_POR_PRODUCTO)) porAudiencia[k] = new Set();

  let enVentana = 0, sinTelefono = 0, sinProducto = 0;

  for (const fila of filas.slice(1)) {
    if (!fila[iTel] && !fila[iFecha]) continue;
    const fecha = aFechaLocal(fila[iFecha]);
    if (!fecha || fecha < ini || fecha > fin) continue;
    enVentana++;

    const tel = aE164(fila[iTel]);
    if (!tel) { sinTelefono++; continue; }

    porAudiencia.CLIENTES_FISICOS.add(tel);

    const cats = categorizar(iProd >= 0 ? fila[iProd] : '', iEmpa >= 0 ? fila[iEmpa] : 0);
    if (!cats.length) sinProducto++;
    for (const c of cats) porAudiencia[c].add(tel);
  }

  const resultado = {
    ventana: { desde: ini, hasta: fin },
    pedidosEnVentana: enVentana,
    descartadosSinTelefonoValido: sinTelefono,
    sinCategoriaDeProducto: sinProducto,
    dryRun,
    audiencias: {},
  };

  const destinos = [
    ['CLIENTES FISICOS', AUD_CLIENTES_FISICOS, porAudiencia.CLIENTES_FISICOS],
    ...Object.entries(AUD_POR_PRODUCTO).map(([k, id]) => [k, id, porAudiencia[k]]),
  ];

  for (const [nombre, id, set] of destinos) {
    const tels = [...set];
    if (!tels.length) { resultado.audiencias[nombre] = { subidos: 0, nota: 'nada nuevo' }; continue; }
    if (dryRun) { resultado.audiencias[nombre] = { subidos: tels.length, nota: 'DRY RUN — no se llamó a Meta' }; continue; }
    try {
      const { recibidos, invalidos } = await subir(id, tels, token);
      resultado.audiencias[nombre] = { subidos: tels.length, recibidos, invalidos };
    } catch (e) {
      // Que falle una audiencia no puede tumbar las otras.
      resultado.audiencias[nombre] = { subidos: 0, error: e.message };
    }
  }

  return resultado;
}

/** Texto corto para Telegram. Un fallo arranca con ❌, nunca parecido a un éxito. */
function resumen(r) {
  const fallos = Object.entries(r.audiencias).filter(([, v]) => v.error);
  const cabeza = fallos.length
    ? `❌ <b>Audiencias Meta — ${fallos.length} con error</b>`
    : `✅ <b>Audiencias Meta actualizadas</b>`;
  const lineas = Object.entries(r.audiencias)
    .filter(([, v]) => v.subidos > 0 || v.error)
    .map(([n, v]) => v.error ? `• ${n}: ❌ ${v.error}` : `• ${n}: +${v.subidos}`);
  return [
    cabeza,
    `Ventana: ${r.ventana.desde}${r.ventana.hasta !== r.ventana.desde ? ' → ' + r.ventana.hasta : ''}`,
    `Pedidos: ${r.pedidosEnVentana}${r.descartadosSinTelefonoValido ? ` (${r.descartadosSinTelefonoValido} sin teléfono válido)` : ''}`,
    ...(lineas.length ? lineas : ['Sin clientes nuevos hoy.']),
  ].join('\n');
}

module.exports = { actualizarAudiencias, resumen, aE164, categorizar, AUD_POR_PRODUCTO, AUD_CLIENTES_FISICOS };
