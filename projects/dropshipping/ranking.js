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
  // "burn" (sin exigir "fat" antes, sin límite de palabra) atrapa Lemme Burn /
  // Metaburn / Burnify / Heatburn — verificado contra el catálogo del
  // 2026-08-15: las 50 coincidencias de "burn" son quemadores de grasa o
  // acidez (Metaburn y Heatburn van pegados sin espacio, \b los perdía).
  // "burm" es un typo real de 2 fichas de Lemme Burn ("PROMOCION 2 PRODUCTOS
  // LEMME BURM") — único typo de ese tipo en el catálogo, sin falsos positivos.
  { patron: /adelgaz|slim|burn|burm|quema ?grasa|dieta|cleanse|detox|fibra coli/i, motivo: 'pérdida de peso' },
  { patron: /shampoo|capilar|cabello|batana|alopecia|crecimiento de pelo/i, motivo: 'promesa estética' },
  { patron: /suplement|colágeno|colageno|ashwagandha|shilajit|nad ?(\+|for men)|probiotic|bisglicinato|creatina|gomitas|vitamina|omega ?[0-9]|glucosamina|luteína|luteina|zeaxantina|caps\b|cápsulas|capsulas|complex|joint health|inositol|clorofila|multivitamin|turmeric|curcuma|melaxin|forte/i, motivo: 'suplementos' },
  { patron: /vigor|testosterona|testo\w*|libido|erecc|sexual|potencia masculina|mens? cup|retard\w*|macho|prostat/i, motivo: 'salud sexual' },
  { patron: /dolor|ortopéd|ortoped|artritis|dermatitis|psoriasis|várice|varice|diabet|blood sugar|presión arterial|vista|audífono para sordera/i, motivo: 'condición médica' },
  { patron: /parche|faja reductora|rodillera|estimulador muscular|electroestimulador/i, motivo: 'tratamiento corporal' },
  // Entrada aparte (no metida en la de arriba) porque necesita mirar las DOS
  // palabras sin importar el orden: "Aurelys Drenaje Linfatico" vs "Linfatico
  // Drenaje Aurelys" son el mismo producto con el nombre armado al revés. Con
  // "limf" además de "linf" agarra el typo real "DRENAJE LIMFATICO". "drenaje"
  // solo NO sirve — el catálogo tiene escurridores, destapacaños y organizadores
  // de cocina con esa palabra (16 de 23 casos el 2026-08-15).
  { patron: /(?=.*drenaje)(?=.*(linf|limf))/i, motivo: 'tratamiento corporal' },
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

/**
 * Detecta ajustes masivos de inventario disfrazados de ventas.
 *
 * Si un proveedor pone todo su catálogo en 500 unidades, el delta contra el
 * snapshot anterior se lee como "vendió 500 de cada uno". El 2026-08-13 el
 * proveedor 60343 aparecía con 8 productos a ~500 unidades vendidas, todos con
 * stock final exactamente 500 — era un reseteo, y ocupaban los 5 primeros
 * puestos del ranking.
 *
 * La firma es inconfundible: varios productos DEL MISMO proveedor con el mismo
 * delta exacto. Las ventas reales no se reparten así.
 */
function detectarAjustesMasivos(movimientos) {
  const sospechosos = new Set();

  // 1) Delta idéntico repetido en el mismo proveedor.
  const porDelta = new Map();
  for (const p of movimientos) {
    const clave = `${p.user_id}|${p.vendidas}`;
    if (!porDelta.has(clave)) porDelta.set(clave, []);
    porDelta.get(clave).push(p);
  }
  for (const [, lista] of porDelta) {
    if (lista.length >= 3) lista.forEach(p => sospechosos.add(p.id));
  }

  // 2) Grupo de productos del mismo proveedor movidos al mismo ritmo.
  //
  // El reseteo no deja números idénticos ni afecta a todo el catálogo. El
  // proveedor 60343 tenía 13 productos bajando ~500 unidades cada uno (de
  // ~1000 a ~500) y otros 18 con ventas normales de 1 o 2. Mirar al proveedor
  // completo diluía la señal; hay que encontrar el GRUPO.
  //
  // Un producto es sospechoso si otros 2 o más del mismo proveedor se movieron
  // casi exactamente lo mismo. Solo aplica a movimientos grandes: que tres
  // productos vendan 2 unidades el mismo día es normal, que tres vendan 500 no.
  const MOVIMIENTO_GRANDE = 50;
  const TOLERANCIA = 0.10;

  const porProveedor = new Map();
  for (const p of movimientos) {
    if (!porProveedor.has(p.user_id)) porProveedor.set(p.user_id, []);
    porProveedor.get(p.user_id).push(p);
  }

  for (const [, lista] of porProveedor) {
    for (const p of lista) {
      if (p.vendidas < MOVIMIENTO_GRANDE) continue;
      const parecidos = lista.filter(
        (o) => o.id !== p.id && Math.abs(o.vendidas - p.vendidas) / p.vendidas <= TOLERANCIA
      );
      if (parecidos.length >= 2) sospechosos.add(p.id);
    }
  }

  return sospechosos;
}

function analizar({ top = 15, soloSeguros = false } = {}) {
  const d = delta();
  const ajustes = detectarAjustesMasivos(d.movimientos);

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
      restriccion: restriccion(p),
      ajusteMasivo: ajustes.has(p.id)
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
    !p.ajusteMasivo &&                 // no son ventas, es el proveedor recontando
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
    descartadosPorAjuste: candidatos.filter(p => p.ajusteMasivo).length,
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
  console.log(`  Descartados por ajuste masivo de inventario: ${a.descartadosPorAjuste}`);
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

module.exports = { analizar, restriccion, precioObjetivo, detectarAjustesMasivos };
