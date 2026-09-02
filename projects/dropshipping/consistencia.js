/**
 * Velocidad de venta CONSISTENTE, medida sobre todos los snapshots.
 *
 * Por qué existe: `ranking.js` compara solo los DOS últimos snapshots, y eso se
 * deja engañar. El 2026-08-25 el "ASHWAGANDHA KSM 66 + GABA" salió primero con
 * 222 u/día — pero su stock había estado clavado en ~2.420 durante SIETE días y
 * cayó 1.200 de un saque en la última ventana. Un solo movimiento grande no es
 * demanda sostenida: puede ser una compra mayorista, una corrección o un
 * traslado de bodega. El "Trapeador 360", con menos u/día, bajó en las CUATRO
 * ventanas seguidas. Ese sí se está vendiendo.
 *
 * Métrica: de N ventanas entre snapshots, en cuántas bajó el stock, y qué
 * porcentaje del movimiento total cayó en una sola ventana. Un producto sano
 * baja en casi todas y ninguna ventana concentra más del ~60%.
 *
 * ⚠ Esto mide el delta NETO entre snapshots separados por 1-3 días, así que un
 * restock del proveedor tapa las ventas del día entero: el 29 y 30 de agosto la
 * Freidora (133468) figuró con 0 ventas porque IMPORSHOP metió +80 y +887
 * unidades mientras se vendía. Para el volumen REAL de venta de un producto usar
 * `ventas-mercado.js`, que muestrea cada 30 min y suma solo las bajas.
 * Este script sigue sirviendo para lo suyo: barrer los 34.000 del catálogo y
 * detectar candidatos. Aquel mide de cerca unos pocos.
 *
 * Uso: node projects/dropshipping/consistencia.js [--top 15] [--tienda avanora|truquito]
 */

const fs = require('fs');
const path = require('path');
const { clasificar } = require('./candidatos-tienda');
const { restriccion } = require('./ranking');

const DATA_DIR = path.join(__dirname, 'data');

function series() {
  const archivos = fs.readdirSync(DATA_DIR)
    .filter(f => /^snapshot-\d{4}-\d{2}-\d{2}(-\d{4})?\.json$/.test(f)).sort();
  return archivos.map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));
}

/**
 * Igual que `analizar()`, pero sobre una serie de snapshots dada en vez de leer
 * `data/` directo. Existe para que `tendencias.js` pueda calcular "cómo se veía
 * esto hace N días" cortando la serie, sin duplicar la lógica de arriba.
 */
function analizarSerie(snaps) {
  const mapas = snaps.map(s => new Map(s.productos.map(p => [p.id, p])));
  const fechas = snaps.map(s => new Date(s.tomado || s.fecha));
  const ultimo = snaps[snaps.length - 1];

  const out = [];
  for (const p of ultimo.productos) {
    const stocks = mapas.map(m => m.get(p.id)?.stock);
    // Solo productos presentes en TODOS los snapshots: si faltó en alguno, no se
    // puede distinguir "no se vendió" de "no estaba publicado".
    if (stocks.some(s => s === undefined || s === null)) continue;

    const caidas = [];
    for (let i = 1; i < stocks.length; i++) {
      const dias = (fechas[i] - fechas[i - 1]) / 86400000;
      caidas.push({ baja: Math.max(0, stocks[i - 1] - stocks[i]), dias });
    }

    const totalBajado = caidas.reduce((a, c) => a + c.baja, 0);
    if (totalBajado <= 0) continue;

    const diasTotales = (fechas[fechas.length - 1] - fechas[0]) / 86400000;
    const ventanasConVenta = caidas.filter(c => c.baja > 0).length;
    const mayor = Math.max(...caidas.map(c => c.baja));

    out.push({
      id: p.id, name: p.name, stock: p.stock, costo: p.sale_price,
      sugerido: p.suggested_price, proveedor: `${p.user_id} ${p.proveedor || ''}`.trim(),
      categorias: p.categorias || [], imagen: p.imagen || null,
      total: totalBajado,                     // unidades vendidas en toda la ventana
      porDia: totalBajado / diasTotales,
      ventanas: `${ventanasConVenta}/${caidas.length}`,
      consistencia: ventanasConVenta / caidas.length,
      concentracion: mayor / totalBajado,     // 1.00 = todo el movimiento en una sola ventana
      tienda: clasificar(p),
      restriccion: restriccion(p)
    });
  }

  // Sano = baja en al menos 3 de cada 4 ventanas y ninguna concentra más del 60%.
  return out
    .filter(p => p.stock >= 150 && p.costo > 0 && p.consistencia >= 0.75 && p.concentracion <= 0.6)
    .sort((a, b) => b.porDia - a.porDia);
}

function analizar() {
  return analizarSerie(series());
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const top = args.includes('--top') ? parseInt(args[args.indexOf('--top') + 1], 10) : 15;
  const tienda = args.includes('--tienda') ? args[args.indexOf('--tienda') + 1].toUpperCase() : null;

  let lista = analizar();
  if (tienda) lista = lista.filter(p => p.tienda === tienda);
  if (tienda === 'TRUQUITO') lista = lista.filter(p => !p.restriccion);

  console.log(`\n  VELOCIDAD CONSISTENTE${tienda ? ' · ' + tienda : ''} — ${lista.length} productos pasan el filtro\n`);
  lista.slice(0, top).forEach((p, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${p.name}` + (p.restriccion ? `  [⚠ ${p.restriccion.motivo}]` : ''));
    console.log(`      id ${p.id} · ${p.proveedor} · stock ${p.stock} · ${p.porDia.toFixed(1)} u/día`);
    console.log(`      baja en ${p.ventanas} ventanas · mayor ventana = ${(p.concentracion * 100).toFixed(0)}% del movimiento`);
    console.log(`      costo $${p.costo.toFixed(2)} · sugerido $${p.sugerido.toFixed(2)} · ${p.categorias.join('/')}\n`);
  });
}

module.exports = { analizar, analizarSerie, series };
