/**
 * Sube a Supabase todo lo que el dashboard web necesita mostrar. Corre en la Mac
 * (donde están las credenciales de DROPI) — Vercel solo lee lo que esto deja.
 *
 * Qué hace:
 *   1. Calcula candidatos (ranking.js), consistencia, por tienda y tendencias
 *      (nuevos ganadores, producto del mes) — toda lógica ya existente, sin tocar.
 *   2. Sobrescribe una sola fila en `dropi_dashboard` con ese resultado completo.
 *   3. Agrega a `dropi_historial` las filas del snapshot más reciente y, la
 *      primera vez, hace un backfill con todos los snapshots crudos que ya
 *      existan en `data/` — no inventa historial, aprovecha el que hay.
 *   4. Borra de `dropi_historial` lo que tenga más de 90 días.
 *
 * Requiere en .env: SUPABASE_URL, SUPABASE_ANON_KEY (ya están — ver history.js).
 * Antes de correr esto la primera vez: correr `schema-dashboard.sql` una vez en
 * el SQL Editor de Supabase (crea las tablas, no lo hace este script).
 *
 * Uso:
 *   node projects/dropshipping/publicar.js --dry-run    imprime el payload, no escribe nada
 *   node projects/dropshipping/publicar.js               escribe en Supabase
 *   node projects/dropshipping/publicar.js --sin-backfill   salta el paso 3 (más rápido)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { analizar: analizarRanking } = require('./ranking');
const { analizar: analizarConsistencia, series } = require('./consistencia');
const { analizar: analizarPorTienda } = require('./candidatos-tienda');
const { nuevosGanadores, productoDelMes } = require('./tendencias');
const { pagina, urlImagen } = require('./catalogo');

const DATA_DIR = path.join(__dirname, 'data');
const RETENCION_DIAS = 90;
const LOTE = 1000; // Supabase recomienda no mandar inserts gigantes de una

function cliente() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY en .env');
  }
  const { createClient } = require('@supabase/supabase-js');
  // Node 20 no trae WebSocket nativo — sin esto createClient() tira error duro
  // (afecta a cualquier script del repo que use supabase-js en Node < 22).
  const ws = require('ws');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { transport: ws } });
}

/**
 * Los snapshots viejos no tienen `imagen` (se agregó recién). En vez de esperar
 * a que se renueve todo el historial, busca la imagen puntual de cada producto
 * que aparece en el payload de hoy — son ~50-100 ids, no 34.000, así que es
 * barato. `GET /products/{id}` está bloqueado para esta cuenta ("No tiene
 * permisos para ver este producto", verificado 2026-08-29), pero buscar el id
 * COMO TEXTO por `/products/index` (el mismo endpoint del catálogo completo)
 * sí funciona y da un solo resultado exacto — usa esa puerta.
 * Una vez que los snapshots nuevos ya traigan `imagen` (catalogo.js →
 * resumir()), esto se vuelve una capa de respaldo nada más.
 */
async function enriquecerImagenes(payload) {
  const listas = ['ranking', 'consistencia', 'avanora', 'truquito', 'nuevos_ganadores', 'producto_del_mes'];
  const faltantes = new Set();
  for (const clave of listas) for (const p of payload[clave]) if (!p.imagen) faltantes.add(p.id);

  const imagenes = new Map();
  for (const id of faltantes) {
    for (let intento = 1; intento <= 4; intento++) {
      try {
        const res = await pagina({ keywords: String(id), pageSize: 5 });
        const match = res.find(p => p.id === id) || res[0];
        const url = match ? urlImagen(match.gallery) : null;
        if (url) imagenes.set(id, url);
        break;
      } catch (e) {
        const status = e.response?.status;
        const pasajero = !status || status === 429 || status >= 500;
        if (!pasajero || intento === 4) break;
        await new Promise(r => setTimeout(r, 1500 * intento));
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`  imágenes: ${imagenes.size}/${faltantes.size} completadas`);
  if (!imagenes.size) return payload;
  for (const clave of listas) {
    payload[clave] = payload[clave].map(p => imagenes.has(p.id) ? { ...p, imagen: imagenes.get(p.id) } : p);
  }
  return payload;
}

async function armarPayload() {
  const ranking = analizarRanking({ top: 30 });
  const consistencia = analizarConsistencia();
  const porTienda = analizarPorTienda({ top: 10 });
  const nuevos = nuevosGanadores({ diasAtras: 7, top: 20 });
  const mes = productoDelMes({ top: 10 });

  const payload = {
    actualizado_en: new Date().toISOString(),
    ventana_ranking_horas: ranking.ventana.horas,
    ranking: ranking.viables,
    consistencia: consistencia.slice(0, 30),
    avanora: porTienda.avanora,
    truquito: porTienda.truquito,
    nuevos_ganadores: nuevos.entraron,
    nuevos_ganadores_ventana_dias: nuevos.ventanaRealDias,
    nuevos_ganadores_historial_suficiente: nuevos.huboSuficienteHistorial,
    producto_del_mes: mes.lista,
    producto_del_mes_ventana_dias: mes.ventanaDiasReal
  };

  return enriquecerImagenes(payload);
}

/** Filas compactas {fecha, id, stock, costo} para dropi_historial, de un snapshot crudo. */
function filasDeSnapshot(snap) {
  const fecha = (snap.fecha || snap.tomado || '').slice(0, 10);
  return snap.productos.map(p => ({ fecha, id: p.id, stock: p.stock ?? null, costo: p.sale_price ?? null }));
}

async function subirLote(supabase, tabla, filas, onConflict) {
  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    // "fetch failed" de red es transitorio — sin reintento, un solo blip corta
    // la subida entera a mitad de camino (pasó de verdad el 2026-08-30).
    let ultimoError;
    for (let intento = 1; intento <= 4; intento++) {
      const { error } = await supabase.from(tabla).upsert(lote, { onConflict });
      if (!error) { ultimoError = null; break; }
      ultimoError = error;
      await new Promise(r => setTimeout(r, 2000 * intento));
    }
    if (ultimoError) throw new Error(`Supabase upsert ${tabla}: ${ultimoError.message}`);
    process.stdout.write(`\r  ${tabla}: ${Math.min(i + LOTE, filas.length)}/${filas.length}`);
  }
  process.stdout.write('\n');
}

async function backfillHistorial(supabase) {
  const archivos = fs.readdirSync(DATA_DIR).filter(f => /^snapshot-\d{4}-\d{2}-\d{2}(-\d{4})?\.json$/.test(f));
  for (const archivo of archivos) {
    const snap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, archivo), 'utf8'));
    console.log(`  backfill ${archivo} (${snap.productos.length} productos)`);
    await subirLote(supabase, 'dropi_historial', filasDeSnapshot(snap), 'fecha,id');
  }
}

async function subirHistorialDeHoy(supabase) {
  const snaps = series();
  if (!snaps.length) return;
  const ultimo = snaps[snaps.length - 1];
  await subirLote(supabase, 'dropi_historial', filasDeSnapshot(ultimo), 'fecha,id');
}

async function limpiarViejos(supabase) {
  const limite = new Date(Date.now() - RETENCION_DIAS * 86400000).toISOString().slice(0, 10);
  const { error, count } = await supabase.from('dropi_historial').delete({ count: 'exact' }).lt('fecha', limite);
  if (error) throw new Error(`Supabase delete dropi_historial: ${error.message}`);
  return count || 0;
}

async function publicar({ dryRun = false, backfill = true } = {}) {
  const payload = await armarPayload();

  if (dryRun) {
    console.log(JSON.stringify({
      ...payload,
      ranking: `[${payload.ranking.length} productos]`,
      consistencia: `[${payload.consistencia.length} productos]`,
      avanora: `[${payload.avanora.length} productos]`,
      truquito: `[${payload.truquito.length} productos]`,
      nuevos_ganadores: `[${payload.nuevos_ganadores.length} productos]`,
      producto_del_mes: `[${payload.producto_del_mes.length} productos]`
    }, null, 2));
    console.log('\n  --dry-run: nada se escribió en Supabase.\n');
    return payload;
  }

  const supabase = cliente();

  const { error } = await supabase.from('dropi_dashboard').upsert(
    { id: 'latest', payload, actualizado_en: payload.actualizado_en },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`Supabase upsert dropi_dashboard: ${error.message}`);
  console.log('  dropi_dashboard actualizado');

  if (backfill) await backfillHistorial(supabase);
  else await subirHistorialDeHoy(supabase);

  const borrados = await limpiarViejos(supabase);
  if (borrados) console.log(`  dropi_historial: ${borrados} filas viejas (>${RETENCION_DIAS}d) borradas`);

  return payload;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  publicar({ dryRun: args.includes('--dry-run'), backfill: !args.includes('--sin-backfill') })
    .then(() => console.log('\n✅ Listo'))
    .catch(e => { console.error('❌', e.message); process.exit(1); });
}

module.exports = { publicar, armarPayload };
