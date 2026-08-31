/**
 * Ficha rápida de una lista de IDs: velocidad consistente + unidad económica
 * a 1/2/3 unidades. Se usa para armar el informe de candidatos por tienda.
 *
 * Uso: node projects/dropshipping/fichas.js 148154 155190 ...
 */
const { analizar } = require('./consistencia');
const { evaluar, precioParaMargen } = require('./calculadora');

const ids = process.argv.slice(2).map(Number);
const todos = analizar();
const porId = new Map(todos.map(p => [p.id, p]));

const usd = n => '$' + (n ?? 0).toFixed(2);

for (const id of ids) {
  const p = porId.get(id);
  if (!p) { console.log(`${id} — NO pasa el filtro de consistencia (o stock < 150)\n`); continue; }
  console.log(`${p.id} · ${p.name}`);
  console.log(`   ${p.proveedor} · stock ${p.stock} · ${p.porDia.toFixed(1)} u/día · ventanas ${p.ventanas} · concentración ${(p.concentracion*100).toFixed(0)}%`);
  console.log(`   costo ${usd(p.costo)} · sugerido ${usd(p.sugerido)} · precio 25% margen ${usd(precioParaMargen({costo:p.costo}, .25))}`);
  console.log(`   riesgo Meta: ${p.restriccion ? p.restriccion.motivo : 'sin etiqueta'} · tienda ${p.tienda}`);
  // combos: costo x n, flete plano
  for (const n of [1,2,3]) {
    const costo = p.costo * n;
    const pMin = precioParaMargen({ costo }, .25);
    const precio = Math.max(Math.ceil(pMin) - 0.01, 0);
    const r = evaluar({ precio, costo });
    console.log(`   ${n}u → vender ${usd(precio)} · CPA máx ${usd(r.cpaMaximo)} (real Meta ${usd(r.cpaMaximo/1.2)}) · utilidad ${usd(r.utilidadPorPedido)} @CPA10`);
  }
  console.log('');
}
