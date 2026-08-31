/**
 * "Nuevos ganadores" y "producto del mes" — sobre `consistencia.js`, sin duplicar
 * su lógica de filtrado (stock, consistencia, concentración).
 *
 * Ambas funciones aceptan una serie de snapshots inyectada (`snaps`). Por defecto
 * usan `consistencia.series()`, que lee `data/` local — hoy son ~10 días porque
 * `diario.js` borra los viejos para no llenar el disco. `publicar.js` puede pasar
 * una serie más larga reconstruida desde `dropi_historial` en Supabase (90 días)
 * sin tocar nada acá: por eso la inyección, no un import fijo.
 *
 * Uso:
 *   node projects/dropshipping/tendencias.js nuevos [--dias 7] [--top 20]
 *   node projects/dropshipping/tendencias.js mes [--top 10]
 */
const { analizarSerie, series } = require('./consistencia');

/**
 * Compara el top consistente de hoy contra el de hace `diasAtras` días (cortando
 * la serie, no re-descargando nada). Si no hay suficiente historial para llegar
 * tan atrás, se informa la ventana REAL usada — nunca se finge la ventana pedida.
 */
function nuevosGanadores({ diasAtras = 7, top = 20, snaps } = {}) {
  const serie = snaps || series();
  if (serie.length < 2) {
    return { hoy: [], entraron: [], ventanaObjetivoDias: diasAtras, ventanaRealDias: 0, huboSuficienteHistorial: false };
  }

  const fechas = serie.map(s => new Date(s.tomado || s.fecha));
  const ultima = fechas[fechas.length - 1];
  const objetivo = new Date(ultima - diasAtras * 86400000);

  // Último índice cuya fecha es <= objetivo. Si ninguno califica, se usa el
  // corte más chico posible (2 snapshots) para al menos poder comparar algo.
  let corte = -1;
  for (let i = 0; i < fechas.length; i++) {
    if (fechas[i] <= objetivo) corte = i;
  }
  corte = corte + 1; // convertir a "cantidad de snapshots a incluir"

  const huboSuficienteHistorial = corte >= 2;
  const hoy = analizarSerie(serie).slice(0, top);

  let entraron = hoy;
  let ventanaRealDias = 0;
  if (huboSuficienteHistorial) {
    const antes = analizarSerie(serie.slice(0, corte)).slice(0, top);
    const idsAntes = new Set(antes.map(p => p.id));
    entraron = hoy.filter(p => !idsAntes.has(p.id));
    ventanaRealDias = (ultima - fechas[corte - 1]) / 86400000;
  }

  return { hoy, entraron, ventanaObjetivoDias: diasAtras, ventanaRealDias, huboSuficienteHistorial };
}

/**
 * El que más unidades movió en toda la ventana disponible (no unidades/día — el
 * "producto del mes" es el líder acumulado, no el más rápido de un solo día).
 * La ventana real depende de cuánto historial haya — se informa, no se disfraza.
 */
function productoDelMes({ top = 10, snaps } = {}) {
  const serie = snaps || series();
  if (serie.length < 2) return { lista: [], ventanaDiasReal: 0 };

  const fechas = serie.map(s => new Date(s.tomado || s.fecha));
  const ventanaDiasReal = (fechas[fechas.length - 1] - fechas[0]) / 86400000;

  const lista = analizarSerie(serie)
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, top);

  return { lista, ventanaDiasReal };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const num = (flag, def) => args.includes(flag) ? parseFloat(args[args.indexOf(flag) + 1]) : def;

  if (cmd === 'nuevos') {
    const r = nuevosGanadores({ diasAtras: num('--dias', 7), top: num('--top', 20) });
    console.log(`\n  NUEVOS GANADORES — objetivo ${r.ventanaObjetivoDias}d, ventana real ${r.ventanaRealDias.toFixed(1)}d` +
      (r.huboSuficienteHistorial ? '' : '  ⚠ no hay suficiente historial, mostrando todo el top de hoy') + '\n');
    r.entraron.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}  ·  id ${p.id} · ${p.porDia.toFixed(1)} u/día · tienda ${p.tienda || '—'}`));
    console.log('');
  } else if (cmd === 'mes') {
    const r = productoDelMes({ top: num('--top', 10) });
    console.log(`\n  PRODUCTO DEL MES — ventana real ${r.ventanaDiasReal.toFixed(1)} días\n`);
    r.lista.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}  ·  id ${p.id} · ${p.total.toFixed(0)} u totales · ${p.porDia.toFixed(1)} u/día · tienda ${p.tienda || '—'}`));
    console.log('');
  } else {
    console.log('\n  Uso: node projects/dropshipping/tendencias.js nuevos|mes [--dias N] [--top N]\n');
  }
}

module.exports = { nuevosGanadores, productoDelMes };
