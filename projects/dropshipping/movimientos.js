/**
 * Movimiento REAL de TODOS los productos del catálogo, no solo los que pasan
 * filtros de calidad.
 *
 * Diferencia con los otros dos análisis del repo:
 *   ranking.js      compara los DOS últimos snapshots con el delta NETO — un
 *                   restock del proveedor le borra las ventas del día.
 *   consistencia.js suma solo las bajas (bien) pero exige que el producto esté
 *                   en TODOS los snapshots y que pase filtros de calidad
 *                   (stock ≥150, consistencia ≥75%, concentración ≤60%), así
 *                   que se queda con un puñado y descarta todo lo demás.
 *   movimientos.js  suma solo las bajas y NO filtra nada: devuelve todos los
 *                   productos que se movieron, con el restock a la vista.
 *
 * Por qué suma solo las bajas: el stock del catálogo es un pozo compartido por
 * todos los dropshippers y se mueve en dos direcciones — baja por ventas, sube
 * por restock. El neto miente. El 2026-08-29 y 30 la Freidora (133468) figuró
 * con 0 ventas porque IMPORSHOP resurtió +80 y +887 mientras se vendía.
 *
 * El número es un PISO: las ventas que ocurren en la misma ventana que un
 * restock quedan tapadas. Por eso cada producto reporta `tapado` y cuántas
 * ventanas tuvieron restock — si un producto trae restock, vendió MÁS que lo
 * que dice. Para medición fina de unos pocos productos usar `ventas-mercado.js`,
 * que muestrea cada 30 min en vez de una vez al día.
 *
 * Tolera huecos: un producto que entró al catálogo hace 3 días se mide sobre
 * los días que existió, no se descarta (consistencia.js sí lo descarta).
 *
 * Uso:
 *   node projects/dropshipping/movimientos.js [--top 50] [--tienda avanora|truquito]
 *   node projects/dropshipping/movimientos.js --todos      imprime los que sea
 */

const { series } = require('./consistencia');
const { clasificar } = require('./candidatos-tienda');
const { restriccion } = require('./ranking');

/**
 * Recorre la serie de snapshots y devuelve TODOS los productos con movimiento.
 *
 * A diferencia de consistencia.js no exige presencia en todos los snapshots:
 * se miden solo las ventanas donde se conoce el stock en los dos extremos, y
 * `diasCubiertos` dice sobre cuánto tiempo se midió de verdad — sin eso, un
 * producto nuevo parecería vender poquísimo solo por haber existido 2 días.
 */
function movimientos(snaps = series()) {
  if (snaps.length < 2) return [];

  const mapas = snaps.map(s => new Map(s.productos.map(p => [p.id, p])));
  const fechas = snaps.map(s => new Date(s.tomado || s.fecha));
  const ultimo = snaps[snaps.length - 1];
  const fin = fechas[fechas.length - 1];

  const out = [];
  for (const p of ultimo.productos) {
    let vendidas = 0, restock = 0;
    let ventanas = 0, ventanasBajada = 0, ventanasRestock = 0;
    let diasCubiertos = 0, mayorBajada = 0;

    // Última muestra conocida: así los huecos no cuentan como ventana medida.
    let prevStock = null, prevFecha = null;
    // Curva de crecimiento para el sparkline de la tabla, y las ventanas
    // fechadas para poder cortar a 7 y 30 días.
    const curva = [];
    for (let i = 0; i < snaps.length; i++) {
      const stock = mapas[i].get(p.id)?.stock;
      if (stock === undefined || stock === null) continue;

      if (prevStock !== null) {
        const delta = prevStock - stock;
        const dias = (fechas[i] - prevFecha) / 86400000;
        ventanas++;
        diasCubiertos += dias;
        const baja = Math.max(0, delta);
        if (delta > 0) {
          vendidas += delta;
          ventanasBajada++;
          if (delta > mayorBajada) mayorBajada = delta;
        } else if (delta < 0) {
          restock += -delta;
          ventanasRestock++;
        }
        // Se guarda la velocidad (u/día), no el total de la ventana: si no,
        // una ventana de 5 días hace un pico falso al lado de una de 1 día.
        curva.push({ hasta: fechas[i], dias, baja, porDia: dias > 0 ? baja / dias : 0 });
      }
      prevStock = stock;
      prevFecha = fechas[i];
    }

    if (vendidas <= 0) continue;

    // Una corrección de inventario del proveedor se ve igual que una venta
    // enorme: el 151897 pasó de 28.005 a 1.000 unidades de un solo golpe, el
    // 174182 de 5.000 a 100. Sin esto encabezan el ranking con decenas de miles
    // de "ventas" y tapan a los productos que de verdad se mueven.
    // La firma es la concentración: casi todo el movimiento en UNA ventana.
    // No se descartan (se pidió ver todo lo que se mueva), se marcan y se
    // ordenan por el movimiento sostenido, sin ese salto.
    // Ventas de los últimos N días. Una ventana que cruza el corte se prorratea
    // por los días que caen dentro — incluirla o descartarla entera desviaría
    // el número justo en los productos con muestreo espaciado.
    const ventasUltimos = (n) => {
      const corte = fin - n * 86400000;
      let total = 0;
      for (const c of curva) {
        const desde = c.hasta - c.dias * 86400000;
        if (c.hasta <= corte) continue;
        const dentro = (c.hasta - Math.max(desde, corte)) / 86400000;
        total += c.dias > 0 ? c.baja * (dentro / c.dias) : 0;
      }
      return Math.round(total);
    };

    const concentracion = mayorBajada / vendidas;
    const sospechoso = ventanas >= 3 && concentracion >= 0.85;
    const pocaHistoria = ventanas < 3;
    const vendidasSostenidas = sospechoso ? vendidas - mayorBajada : vendidas;

    out.push({
      id: p.id,
      name: p.name,
      stock: p.stock,
      costo: p.sale_price,
      sugerido: p.suggested_price,
      proveedor: `${p.user_id} ${p.proveedor || ''}`.trim(),
      categorias: p.categorias || [],
      imagen: p.imagen || null,
      vendidas,
      ventas7: ventasUltimos(7),
      ventas30: ventasUltimos(30),
      // Cuántas veces el proveedor resurtió. En DropKiller es "Veces
      // restockeado": un proveedor que repone es un proveedor que cree en el
      // producto, y además avisa que el número de ventas es un piso.
      vecesRestockeado: ventanasRestock,
      creadoEn: p.created_at || null,
      // Sparkline de la tabla: velocidad de venta por ventana, redondeada a
      // 2 decimales para no inflar el payload de ~5.000 productos.
      curva: curva.map((c) => Math.round(c.porDia * 100) / 100),
      // Lo mismo sin el salto único cuando huele a corrección de inventario.
      // Es el número por el que se ordena: es el que no se deja engañar.
      vendidasSostenidas,
      restock,
      porDia: diasCubiertos > 0 ? vendidas / diasCubiertos : 0,
      porDiaSostenido: diasCubiertos > 0 ? vendidasSostenidas / diasCubiertos : 0,
      diasCubiertos,
      ventanas,
      ventanasBajada,
      ventanasRestock,
      // Consistencia y concentración se calculan igual que en consistencia.js,
      // pero acá son informativas: no se filtra por ellas.
      consistencia: ventanas > 0 ? ventanasBajada / ventanas : 0,
      concentracion,
      mayorBajada,
      // Casi todo el movimiento en una sola ventana: probablemente el proveedor
      // corrigió el inventario, no que se vendió.
      sospechoso,
      // Menos de 3 ventanas medidas: no alcanza para saber si es venta o ajuste.
      pocaHistoria,
      // Si hubo restock, las ventas de esa ventana no se ven: el total es piso.
      tapado: ventanasRestock > 0,
      tienda: clasificar(p),
      restriccion: restriccion(p)
    });
  }

  return out.sort((a, b) => b.porDiaSostenido - a.porDiaSostenido);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const todos = args.includes('--todos');
  const top = args.includes('--top') ? parseInt(args[args.indexOf('--top') + 1], 10) : 40;
  const tienda = args.includes('--tienda') ? args[args.indexOf('--tienda') + 1].toUpperCase() : null;

  let lista = movimientos();
  if (tienda) lista = lista.filter(p => p.tienda === tienda);

  const tapados = lista.filter(p => p.tapado).length;
  const sospechosos = lista.filter(p => p.sospechoso).length;
  console.log(`\n  MOVIMIENTO REAL${tienda ? ' · ' + tienda : ''} — ${lista.length} productos se movieron\n`);
  console.log(`  ${tapados} con restock en alguna ventana → su número es un PISO, vendieron más.`);
  console.log(`  ${sospechosos} con salto único → probable corrección de inventario, van al fondo.\n`);

  (todos ? lista : lista.slice(0, top)).forEach((p, i) => {
    const banderas = [
      p.tapado ? '⚠ piso (hubo restock)' : '',
      p.sospechoso ? '🚩 salto único — probable corrección de inventario' : '',
      p.pocaHistoria ? '· poca historia' : '',
      p.restriccion ? `⚠ Meta: ${p.restriccion.motivo}` : ''
    ].filter(Boolean).join('  ');
    console.log(`  ${String(i + 1).padStart(4)}. ${p.name}`);
    console.log(`        id ${p.id} · ${p.proveedor} · stock ${p.stock} · ${p.tienda}`);
    console.log(`        ${p.porDiaSostenido.toFixed(1)} u/día · ${p.vendidasSostenidas} u en ${p.diasCubiertos.toFixed(1)}d · baja en ${p.ventanasBajada}/${p.ventanas} ventanas`);
    if (p.sospechoso) console.log(`        crudo ${p.vendidas} u, pero ${(p.concentracion * 100).toFixed(0)}% cayó en una sola ventana (${p.mayorBajada} u)`);
    if (p.restock) console.log(`        restock +${p.restock} u en ${p.ventanasRestock} ventana(s)`);
    console.log(`        costo $${p.costo.toFixed(2)} · sugerido $${p.sugerido.toFixed(2)} · ${p.categorias.join('/')}`);
    if (banderas) console.log(`        ${banderas}`);
    console.log('');
  });

  if (!todos && lista.length > top) {
    console.log(`  … y ${lista.length - top} más. Usar --todos para verlos completos.\n`);
  }
}

module.exports = { movimientos };
