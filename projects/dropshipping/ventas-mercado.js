/**
 * Ventas REALES de un producto en DROPI — todas, de todos los dropshippers.
 *
 * Por qué existe: `consistencia.js` compara snapshots separados por 1-3 días y
 * mide el delta NETO de stock. Eso se rompe cuando el proveedor resurte: el
 * 2026-08-29 y el 30 la Freidora (133468) figuró con 0 ventas porque IMPORSHOP
 * metió +80 y +887 unidades mientras se vendía. El Sheet de pedidos propios
 * mostraba 17 y 18 unidades esos mismos días — y esas son solo las de Fabián,
 * el mercado entero vendió más.
 *
 * La API no da el dato: el campo `orders` del producto viene siempre null (es
 * una relación de Laravel que nunca se carga) y `/products/index` no acepta
 * orden por más vendidos. Así que la única salida es MEDIRLO.
 *
 * Cómo: el stock del catálogo es un pozo compartido por todos los dropshippers.
 * Muestreado seguido, ventas y restock se separan solos —
 *   stock baja  → alguien vendió (la suma de las bajas = ventas del mercado)
 *   stock sube  → el proveedor resurtió
 * A 1-3 días de distancia los dos efectos se mezclan y el neto miente. Cada 30
 * minutos, un restock ocupa una sola ventana y las ventas de esa ventana son lo
 * único que se pierde.
 *
 * El número que da es un PISO, no un exacto: en una ventana con restock las
 * ventas quedan tapadas. Por eso el reporte marca esas ventanas — a 30 min el
 * piso queda pegado al valor real, a 1 día no.
 *
 * Uso:
 *   node projects/dropshipping/ventas-mercado.js medir          toma una muestra
 *   node projects/dropshipping/ventas-mercado.js reporte         todos los del watchlist
 *   node projects/dropshipping/ventas-mercado.js reporte --id 133468 --dias 10
 *   node projects/dropshipping/ventas-mercado.js sembrar         historia desde los snapshots viejos
 *   node projects/dropshipping/ventas-mercado.js watchlist       qué se está midiendo
 *
 * El watchlist son los productos de `campanas.js` (los que se pautean) más los
 * ids sueltos de `data/watchlist-extra.json` (candidatos en evaluación).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pagina } = require('./catalogo');
const { aFechaLocal } = require('../../fechas');
const campanas = require('./campanas');

const DATA_DIR = path.join(__dirname, 'data');
const MUESTRAS = path.join(DATA_DIR, 'stock-mercado.jsonl');
const EXTRA = path.join(DATA_DIR, 'watchlist-extra.json');
const PAUSA_MS = 350; // no golpear la API del proveedor

// ─── Watchlist ───────────────────────────────────────────────────────────────

/** El snapshot más reciente, para resolver id → nombre (la búsqueda es por nombre). */
function snapshotReciente() {
  const archivos = fs.readdirSync(DATA_DIR)
    .filter(f => /^snapshot-\d{4}-\d{2}-\d{2}(-\d{4})?\.json$/.test(f)).sort();
  if (!archivos.length) throw new Error('No hay snapshots en data/ — correr catalogo.js snapshot primero');
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, archivos[archivos.length - 1]), 'utf8'));
}

function watchlist() {
  const ids = new Set(campanas.map(c => Number(c.idDropi)));
  if (fs.existsSync(EXTRA)) {
    for (const id of JSON.parse(fs.readFileSync(EXTRA, 'utf8'))) ids.add(Number(id));
  }
  const snap = snapshotReciente();
  const porId = new Map(snap.productos.map(p => [p.id, p]));
  return [...ids].map(id => {
    const p = porId.get(id);
    if (!p) return { id, name: null, falta: true };
    return { id, name: p.name, proveedor: p.proveedor, costo: p.sale_price };
  });
}

// ─── Medición ────────────────────────────────────────────────────────────────

/**
 * Stock actual de un producto. Se busca por NOMBRE y se filtra por id: la ruta
 * directa `GET /products/{id}` devuelve 400 "No tiene permisos para ver este
 * producto" desde el 2026-08-28, aunque el login sea válido.
 */
async function stockActual(item) {
  const objs = await pagina({ keywords: item.name, pageSize: 50 });
  const hit = objs.find(o => o.id === item.id);
  return hit ? hit.stock : null;
}

async function medir() {
  const lista = watchlist().filter(i => !i.falta);
  const ts = new Date().toISOString();
  const lineas = [];

  for (const item of lista) {
    let stock = null, error = null;
    try {
      stock = await stockActual(item);
    } catch (e) {
      error = e.message;
    }
    if (stock === null || stock === undefined) {
      console.log(`  ⚠ ${item.id} ${item.name?.slice(0, 40)} — sin stock leído${error ? ' (' + error + ')' : ''}`);
    } else {
      lineas.push(JSON.stringify({ ts, id: item.id, stock }));
      console.log(`  ${String(item.id).padEnd(8)} stock ${String(stock).padStart(6)}  ${item.name.slice(0, 45)}`);
    }
    await new Promise(r => setTimeout(r, PAUSA_MS));
  }

  if (lineas.length) fs.appendFileSync(MUESTRAS, lineas.join('\n') + '\n');
  console.log(`\n  ${lineas.length} muestras guardadas · ${ts}`);
}

// ─── Siembra desde los snapshots viejos ──────────────────────────────────────

/**
 * Rellena el histórico con lo que ya hay en los snapshots diarios. Son muestras
 * legítimas del mismo stock, solo que espaciadas — el reporte muestra cuántas
 * muestras tuvo cada día para que se vea qué días son confiables y cuáles no.
 */
function sembrar() {
  const archivos = fs.readdirSync(DATA_DIR)
    .filter(f => /^snapshot-\d{4}-\d{2}-\d{2}(-\d{4})?\.json$/.test(f)).sort();
  const ids = new Set(watchlist().map(i => i.id));
  const yaHay = new Set(leerMuestras().map(m => `${m.ts}|${m.id}`));

  const lineas = [];
  for (const f of archivos) {
    const snap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    const ts = new Date(snap.tomado || snap.fecha).toISOString();
    for (const p of snap.productos) {
      if (!ids.has(p.id) || p.stock === null || p.stock === undefined) continue;
      if (yaHay.has(`${ts}|${p.id}`)) continue;
      lineas.push(JSON.stringify({ ts, id: p.id, stock: p.stock }));
    }
  }
  if (lineas.length) fs.appendFileSync(MUESTRAS, lineas.join('\n') + '\n');
  console.log(`  ${lineas.length} muestras sembradas desde ${archivos.length} snapshots`);
}

// ─── Análisis ────────────────────────────────────────────────────────────────

function leerMuestras() {
  if (!fs.existsSync(MUESTRAS)) return [];
  return fs.readFileSync(MUESTRAS, 'utf8').split('\n')
    .filter(Boolean).map(l => JSON.parse(l));
}

/**
 * Ventas por día de un producto: suma SOLO las bajas de stock. Una subida es
 * restock, y su ventana queda marcada porque las ventas de ese rato son
 * invisibles — el total del día pasa a ser un piso, no un dato cerrado.
 */
function ventasPorDia(muestras, id) {
  const serie = muestras.filter(m => m.id === id)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));

  const dias = new Map();
  const dia = (iso) => {
    const d = aFechaLocal(iso).slice(0, 10);
    if (!dias.has(d)) dias.set(d, { vendidas: 0, restock: 0, muestras: 0, tapado: false, horas: 0 });
    return dias.get(d);
  };

  if (serie.length) dia(serie[0].ts).muestras++;

  for (let i = 1; i < serie.length; i++) {
    const delta = serie[i - 1].stock - serie[i].stock;
    const d = dia(serie[i].ts);
    d.muestras++;
    // Cuánto tiempo abarca este delta. Con la historia sembrada desde los
    // snapshots diarios una sola fila puede cubrir 6 días — sin esto, "495
    // vendidas el 21-ago" se lee como si fueran de ese día.
    d.horas += (new Date(serie[i].ts) - new Date(serie[i - 1].ts)) / 3600000;
    if (delta > 0) d.vendidas += delta;
    else if (delta < 0) { d.restock += -delta; d.tapado = true; }
  }
  return { serie, dias: [...dias.entries()].sort((a, b) => a[0].localeCompare(b[0])) };
}

function reporte({ id = null, dias = 14 } = {}) {
  const muestras = leerMuestras();
  if (!muestras.length) {
    console.log('\n  No hay muestras todavía. Correr `sembrar` y después `medir`.\n');
    return;
  }
  const lista = watchlist().filter(i => !i.falta && (id === null || i.id === id));
  const desde = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);

  for (const item of lista) {
    const { serie, dias: porDia } = ventasPorDia(muestras, item.id);
    if (!serie.length) continue;
    const filas = porDia.filter(([d]) => d >= desde);

    console.log(`\n  ${item.name}  (${item.id})`);
    console.log(`  stock actual ${serie[serie.length - 1].stock} · proveedor ${item.proveedor || '?'}\n`);
    console.log('   fecha        vendidas   restock   muestras   abarca');
    let total = 0, algunTapado = false;
    for (const [d, v] of filas) {
      total += v.vendidas;
      if (v.tapado) algunTapado = true;
      // "abarca" es el tiempo real que cubren los deltas de esa fila. Si dice
      // 130h, esas unidades son de 5 días, no del día que encabeza la fila.
      const abarca = v.horas >= 48 ? `${(v.horas / 24).toFixed(1)}d` : `${v.horas.toFixed(1)}h`;
      const nota = v.tapado ? '  ⚠ restock — las ventas de esa ventana no se ven' : '';
      console.log(`   ${d}   ${String(v.vendidas).padStart(7)}   ${String(v.restock).padStart(7)}   ${String(v.muestras).padStart(6)}   ${abarca.padStart(6)}${nota}`);
    }
    // El promedio se calcula sobre el tiempo transcurrido de verdad, no sobre
    // el número de filas: con muestreo irregular las filas no son días.
    const enVentana = serie.filter(m => aFechaLocal(m.ts).slice(0, 10) >= desde);
    const span = enVentana.length > 1
      ? (new Date(enVentana[enVentana.length - 1].ts) - new Date(enVentana[0].ts)) / 86400000
      : 0;
    console.log(`   ${'─'.repeat(52)}`);
    console.log(`   TOTAL      ${String(total).padStart(7)} u en ${span.toFixed(1)} días  ·  ${span > 0 ? (total / span).toFixed(1) : '—'} u/día`);
    if (algunTapado) {
      console.log('   ⚠ Hay ventanas con restock: el total es un PISO, el real es mayor.');
      console.log('     La brecha se cierra midiendo más seguido (`medir` cada 30 min).');
    }
  }
  console.log('');
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'reporte';
  const arg = (f, d) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : d; };

  const acciones = {
    medir,
    sembrar: async () => sembrar(),
    watchlist: async () => {
      console.log('\n  Midiendo estos productos:\n');
      for (const i of watchlist()) {
        console.log(`   ${String(i.id).padEnd(8)} ${i.falta ? '⚠ no está en el snapshot' : i.name}`);
      }
      console.log('');
    },
    reporte: async () => reporte({
      id: arg('--id') ? Number(arg('--id')) : null,
      dias: Number(arg('--dias', 14)),
    }),
  };

  if (!acciones[cmd]) {
    console.error(`Comando desconocido: ${cmd}. Usar: medir | reporte | sembrar | watchlist`);
    process.exit(1);
  }
  acciones[cmd]().catch(e => { console.error('❌', e.message); process.exit(1); });
}

module.exports = { watchlist, medir, sembrar, ventasPorDia, leerMuestras };
