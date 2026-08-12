/**
 * Ranking de candidatos a testear.
 *
 * Cruza tres cosas que por separado engañan:
 *   1. Velocidad de venta real (delta de stock entre snapshots)
 *   2. Rentabilidad con los números reales de Fabián (calculadora.js)
 *   3. Riesgo de rechazo en Meta (categorías restringidas)
 *
 * Un producto que se vende muchísimo pero no deja margen es una trampa, y uno
 * rentable que nadie compra es una fantasía. Solo sirve la intersección.
 *
 * Uso:
 *   node projects/dropshipping/ranking.js
 *   node projects/dropshipping/ranking.js --top 20 --solo-seguros
 */

const { delta } = require('./catalogo');
const { evaluar, precioParaMargen } = require('./calculadora');

// Categorías que Meta restringe. NO se usan para esconder productos — Fabián
// quiere verlos todos (decidido el 2026-08-10). Sirven para etiquetar el riesgo:
// un rechazo de anuncio cuesta un día; una cuenta publicitaria caída cuesta el
// negocio. Con la etiqueta a la vista, la decisión es suya y es informada.
const RESTRINGIDO = [
  { patron: /adelgaz|slim|fat ?burn|quema ?grasa|dieta|cleanse|detox|fibra coli/i, motivo: 'pérdida de peso' },
  { patron: /shampoo|capilar|cabello|batana|alopecia|crecimiento de pelo/i, motivo: 'promesa estética' },
  { patron: /suplement|colágeno|colageno|ashwagandha|shilajit|nad ?(\+|for men)|probiotic|bisglicinato|creatina|gomitas|vitamina|omega ?[0-9]|glucosamina|luteína|luteina|zeaxantina|caps\b|cápsulas|capsulas|complex|joint health/i, motivo: 'suplementos' },
  { patron: /vigor|testosterona|libido|erecc|sexual|potencia masculina|mens? cup/i, motivo: 'salud sexual' },
  { patron: /dolor|ortopéd|ortoped|artritis|dermatitis|psoriasis|várice|varice|diabet|blood sugar|presión arterial|vista|audífono para sordera/i, motivo: 'condición médica' },
  { patron: /parche|faja reductora|drenaje linfático|drenaje linfatico|rodillera|estimulador muscular|electroestimulador/i, motivo: 'tratamiento corporal' },
  { patron: /crema (facial|antiarrugas|blanqueadora)|rejuvenec|antiarrugas|esmalte dental|blanqueador dental/i, motivo: 'promesa estética' }
];

function restriccion(p) {
  const texto = [p.name, ...(p.categorias || [])].join(' ');
  return RESTRINGIDO.find(r => r.patron.test(texto)) || null;
}

/** Precio al que hay que venderlo para que deje 25% de margen neto. */
function precioObjetivo(costo) {
  return precioParaMargen({ costo }, 0.25);
}

function analizar({ top = 15, soloSeguros = false } = {}) {
  const d = delta();

  const candidatos = d.movimientos.map(p => {
    const precio = precioObjetivo(p.sale_price);
    const r = evaluar({ precio, costo: p.sale_price });
    return {
      ...p,
      precioObjetivo: precio,
      multiploNecesario: p.sale_price > 0 ? precio / p.sale_price : Infinity,
      // Cuánto hay que cobrar por encima de lo que el propio proveedor sugiere.
      // Si es muy alto, el producto puede ser rentable en la planilla e invendible
      // en la calle — hay que validarlo contra lo que cobran otras tiendas.
      sobreSugerido: p.suggested_price > 0 ? precio / p.suggested_price : null,
      cpaMaximo: r.cpaMaximo,
      utilidad: r.utilidadPorPedido,
      restriccion: restriccion(p)
    };
  });

  // Un producto solo es viable si el precio que necesita para dejar margen
  // sigue siendo un precio al que alguien compra por impulso en COD, Y si
  // todavía queda mercadería para aguantar un test.
  //
  // El filtro de stock no es un detalle: un producto que cayó a 0 puede haberse
  // vendido, pero también puede haber sido dado de baja por el proveedor. Con un
  // solo par de snapshots no hay forma de distinguirlo, y de todos modos no se
  // puede testear algo que no existe.
  const STOCK_MINIMO = 80;

  const viables = candidatos.filter(p =>
    p.sale_price > 0 &&
    (p.stock ?? 0) >= STOCK_MINIMO &&
    p.precioObjetivo <= 60 &&
    (!soloSeguros || !p.restriccion)
  );

  return {
    ventana: d,
    total: candidatos.length,
    viables: viables.slice(0, top),
    descartadosPorStock: candidatos.filter(p => (p.stock ?? 0) < STOCK_MINIMO).length,
    descartadosPorPrecio: candidatos.filter(p => p.precioObjetivo > 60).length,
    conRiesgoMeta: viables.slice(0, top).filter(p => p.restriccion).length,
    stockMinimo: STOCK_MINIMO
  };
}

const usd = n => '$' + (n || 0).toFixed(2);

function imprimir(opts) {
  const a = analizar(opts);
  const d = a.ventana;

  console.log(`\n  CANDIDATOS PARA TESTEAR`);
  console.log(`  Ventana: ${d.horas.toFixed(1)}h · ${a.total} productos con movimiento de stock\n`);

  if (!a.viables.length) {
    console.log('  Ningún producto pasa los filtros. Revisar supuestos de la calculadora.\n');
    return;
  }

  a.viables.forEach((p, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${p.name}` +
                (p.restriccion ? `   [⚠ Meta: ${p.restriccion.motivo}]` : ''));
    console.log(`      id ${p.id} · proveedor ${p.user_id} · stock ${p.stock ?? '—'} · ${p.porDia.toFixed(0)} u/día`);
    console.log(`      costo ${usd(p.sale_price)} · DROPI sugiere ${usd(p.suggested_price)} · ` +
                `VENDER A ${usd(p.precioObjetivo)} (${p.multiploNecesario.toFixed(1)}x)`);
    console.log(`      CPA máximo ${usd(p.cpaMaximo)} · utilidad ${usd(p.utilidad)}/pedido` +
                (p.cambioPrecio ? `  ⚠ el proveedor cambió el costo ${p.cambioPrecio > 0 ? '+' : ''}${p.cambioPrecio.toFixed(2)}` : ''));
    if (p.sobreSugerido && p.sobreSugerido > 2.5) {
      console.log(`      ⚠ hay que cobrar ${p.sobreSugerido.toFixed(1)}x lo que sugiere el proveedor — validar precio de mercado`);
    }
    console.log('');
  });

  console.log('  ' + '─'.repeat(72));
  console.log(`  Descartados por stock bajo ${a.stockMinimo}: ${a.descartadosPorStock}`);
  console.log(`  Descartados porque el precio viable pasa de $60: ${a.descartadosPorPrecio}`);
  console.log(`  De los mostrados, con riesgo en Meta: ${a.conRiesgoMeta} (marcados ⚠, no ocultos)`);
  console.log(`  Productos nuevos en el catálogo: ${d.nuevos.length}\n`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const top = args.includes('--top') ? parseInt(args[args.indexOf('--top') + 1], 10) : 15;
  imprimir({ top, soloSeguros: args.includes('--solo-seguros') });
}

module.exports = { analizar, restriccion, precioObjetivo };
