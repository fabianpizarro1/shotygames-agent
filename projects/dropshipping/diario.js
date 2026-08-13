/**
 * Rutina diaria de dropshipping.
 *
 * Corre a las 5 AM de Ecuador, cuando la API de DROPI está vacía y el catálogo
 * completo baja en ~9 minutos. A media tarde la misma descarga tarda 25-30.
 *
 * Qué hace:
 *   1. Snapshot del catálogo (~33.000 productos)
 *   2. Borra snapshots viejos — cada uno pesa 13 MB
 *   3. Compara contra el día anterior y arma el ranking
 *   4. Manda los candidatos por Telegram
 *
 * El delta de stock entre dos snapshots es la única señal honesta de que un
 * producto se vende: no es opinión de nadie ni una tendencia de TikTok, es
 * mercadería que salió de la bodega del proveedor.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { guardarSnapshot } = require('./catalogo');
const { analizar } = require('./ranking');

const DATA_DIR = path.join(__dirname, 'data');
const SNAPSHOTS_A_CONSERVAR = 10;   // 10 días de historial · ~130 MB

const usd = (n) => '$' + (Number(n) || 0).toFixed(2);

/**
 * Deja solo los snapshots recientes. Sin esto el disco del servidor se llena
 * en un mes y el cron empieza a fallar sin que nadie se entere.
 */
function limpiarViejos() {
  if (!fs.existsSync(DATA_DIR)) return 0;

  const archivos = fs.readdirSync(DATA_DIR)
    .filter((f) => /^snapshot-\d{4}-\d{2}-\d{2}(-\d{4})?\.json$/.test(f))
    .sort();

  const sobran = archivos.slice(0, Math.max(0, archivos.length - SNAPSHOTS_A_CONSERVAR));
  for (const f of sobran) {
    try { fs.unlinkSync(path.join(DATA_DIR, f)); } catch (_) {}
  }
  return sobran.length;
}

/** Arma el mensaje de Telegram con los candidatos del día. */
function armarMensaje(a) {
  const d = a.ventana;

  if (!a.viables.length) {
    return `📦 *Catálogo DROPI* · ventana ${d.horas.toFixed(0)}h\n\n` +
           `${a.total} productos con movimiento, pero ninguno pasa los filtros hoy.\n` +
           `Descartados: ${a.descartadosPorStock} sin stock · ${a.descartadosPorPrecio} sin margen posible.`;
  }

  const lineas = a.viables.slice(0, 5).map((p, i) => {
    const riesgo = p.restriccion ? `\n   ⚠️ Meta: ${p.restriccion.motivo}` : '';
    const sobreprecio = p.sobreSugerido && p.sobreSugerido > 2.5
      ? `\n   ⚠️ hay que cobrar ${p.sobreSugerido.toFixed(1)}x el sugerido` : '';
    return `*${i + 1}. ${p.name}*\n` +
           `   ${p.porDia.toFixed(0)} u/día · stock ${p.stock} · id ${p.id}\n` +
           `   costo ${usd(p.sale_price)} → *vender a ${usd(p.precioObjetivo)}*\n` +
           `   utilidad ${usd(p.utilidad)}/pedido · CPA máx ${usd(p.cpaMaximo)}` +
           riesgo + sobreprecio;
  });

  return `📦 *Candidatos del día* · ventana ${d.horas.toFixed(0)}h\n\n` +
         lineas.join('\n\n') +
         `\n\n_${a.total} productos con movimiento · ${d.nuevos.length} nuevos en el catálogo_\n` +
         `_${a.conRiesgoMeta} de los mostrados tienen riesgo en Meta_`;
}

async function avisar(texto) {
  const token = process.env.TELEGRAM_DROPI2_TOKEN;
  const chatIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chatIds.length) {
    console.log('[DIARIO] Sin Telegram configurado — el mensaje solo va a los logs');
    console.log(texto);
    return;
  }
  for (const chatId of chatIds) {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId, text: texto, parse_mode: 'Markdown'
    }).catch((e) => console.error('[DIARIO] Telegram:', e.response?.data?.description || e.message));
  }
}

async function correr({ avisarPorTelegram = true } = {}) {
  console.log('[DIARIO] Bajando catálogo...');
  const snap = await guardarSnapshot();
  console.log(`[DIARIO] Snapshot ${snap.archivo} — ${snap.total} productos`);

  const borrados = limpiarViejos();
  if (borrados) console.log(`[DIARIO] ${borrados} snapshot(s) viejo(s) borrado(s)`);

  let mensaje;
  try {
    const a = analizar({ top: 15 });
    mensaje = armarMensaje(a);
  } catch (e) {
    // El primer día no hay con qué comparar. No es un error.
    mensaje = `📦 Snapshot guardado — ${snap.total} productos.\n\n` +
              `Todavía no hay ranking: ${e.message}`;
  }

  if (avisarPorTelegram) await avisar(mensaje);
  return { snapshot: snap, mensaje };
}

if (require.main === module) {
  const soloLocal = process.argv.includes('--sin-telegram');
  correr({ avisarPorTelegram: !soloLocal })
    .then((r) => { console.log('\n' + r.mensaje); process.exit(0); })
    .catch((e) => { console.error('[DIARIO] Falló:', e.message); process.exit(1); });
}

module.exports = { correr, limpiarViejos, armarMensaje };
