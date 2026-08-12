/**
 * Calculadora de rentabilidad para dropshipping COD (contra entrega) en Ecuador.
 *
 * Es el filtro que decide si un producto se testea o se descarta ANTES de gastar
 * en ads. Modela lo que de verdad mata al COD en Ecuador: las devoluciones (RTO).
 *
 * Diferencia clave con vender producto propio: en dropshipping el producto NO es
 * tuyo. Si el pedido se devuelve no pierdes la mercadería — pierdes el flete de
 * ida, el de retorno y, sobre todo, el CPA que ya pagaste a Meta. El CPA se paga
 * por CADA pedido generado, se entregue o no. Ahí es donde se va la plata.
 *
 * Uso:
 *   node projects/dropshipping/calculadora.js --precio 29.90 --costo 9.50
 *   node projects/dropshipping/calculadora.js --precio 29.90 --costo 9.50 --entrega 0.65 --cpa 9
 *
 * Desde otro script:
 *   const { evaluar, precioMinimo, cpaMaximo } = require('./calculadora');
 */

// Valores por defecto — datos reales de Shotygames (2026-07) más supuestos
// conservadores de dropshipping. Ajustar con --flag cuando tengas tus números.
const DEFAULTS = {
  flete: 5.50,       // flete de ida COD (Shotygames real: $4.63–$6.20)
  retorno: 3.50,     // flete de devolución cuando el cliente no recibe
  entrega: 0.70,     // tasa de entrega efectiva — 70% es lo normal en COD Ecuador
  cpa: 10.00,        // costo por pedido en Meta Ads (Shotygames real: $10–$11)
  comision: 0        // % sobre venta si la plataforma de checkout cobra (0 = propia)
};

/**
 * Evalúa la unidad económica de un producto.
 * Todo se calcula por PEDIDO GENERADO (no por pedido entregado) — es la única
 * base honesta, porque el gasto en ads ocurre en todos los pedidos.
 */
function evaluar({ precio, costo, flete, retorno, entrega, cpa, comision }) {
  const f  = num(flete,    DEFAULTS.flete);
  const r  = num(retorno,  DEFAULTS.retorno);
  const e  = num(entrega,  DEFAULTS.entrega);
  const c  = num(cpa,      DEFAULTS.cpa);
  const co = num(comision, DEFAULTS.comision) / 100;

  // Pedido entregado: cobras el precio, pagas producto + flete + comisión
  const margenEntregado = precio - costo - f - (precio * co);
  // Pedido devuelto: no cobras nada y pagas los dos fletes
  const perdidaDevuelto = f + r;

  // Utilidad esperada por pedido generado
  const utilidadBrutaPorPedido = (e * margenEntregado) - ((1 - e) * perdidaDevuelto);
  const utilidadPorPedido = utilidadBrutaPorPedido - c;

  // Ingreso esperado por pedido generado (solo cobras en los entregados)
  const ingresoPorPedido = e * precio;
  const margenNeto = ingresoPorPedido > 0 ? (utilidadPorPedido / ingresoPorPedido) * 100 : -100;
  const roasBreakeven = utilidadBrutaPorPedido > 0 ? ingresoPorPedido / utilidadBrutaPorPedido : Infinity;

  return {
    entradas: { precio, costo, flete: f, retorno: r, entrega: e, cpa: c, comision: co * 100 },
    margenEntregado,
    perdidaDevuelto,
    utilidadBrutaPorPedido,   // antes de ads — el techo de lo que puedes pagar por pedido
    utilidadPorPedido,        // después de ads — lo que de verdad te queda
    ingresoPorPedido,
    margenNeto,
    roasBreakeven,
    multiplo: costo > 0 ? precio / costo : Infinity,
    cpaMaximo: utilidadBrutaPorPedido,   // pagar más que esto = perder plata en cada pedido
    semaforo: semaforo(margenNeto, costo > 0 ? precio / costo : Infinity)
  };
}

/** Precio de venta mínimo para que la utilidad por pedido sea exactamente 0. */
function precioMinimo(args) {
  const { costo } = args;
  const f  = num(args.flete,    DEFAULTS.flete);
  const r  = num(args.retorno,  DEFAULTS.retorno);
  const e  = num(args.entrega,  DEFAULTS.entrega);
  const c  = num(args.cpa,      DEFAULTS.cpa);
  const co = num(args.comision, DEFAULTS.comision) / 100;

  // 0 = e*(P - costo - f - P*co) - (1-e)*(f+r) - cpa   →   despejar P
  const numerador = c + ((1 - e) * (f + r)) + (e * (costo + f));
  const denominador = e * (1 - co);
  return denominador > 0 ? numerador / denominador : Infinity;
}

/** Precio necesario para alcanzar un margen neto objetivo (ej. 0.25 = 25%). */
function precioParaMargen(args, margenObjetivo) {
  const { costo } = args;
  const f  = num(args.flete,    DEFAULTS.flete);
  const r  = num(args.retorno,  DEFAULTS.retorno);
  const e  = num(args.entrega,  DEFAULTS.entrega);
  const c  = num(args.cpa,      DEFAULTS.cpa);
  const co = num(args.comision, DEFAULTS.comision) / 100;

  // margen = utilidad / (e*P)  →  e*P*margen = e*(P - costo - f - P*co) - (1-e)*(f+r) - cpa
  const numerador = c + ((1 - e) * (f + r)) + (e * (costo + f));
  const denominador = e * (1 - co - margenObjetivo);
  return denominador > 0 ? numerador / denominador : Infinity;
}

/** CPA máximo que puedes pagar en Meta sin perder plata, a un precio dado. */
function cpaMaximo(args) {
  return evaluar(args).utilidadBrutaPorPedido;
}

function semaforo(margenNeto, multiplo) {
  if (margenNeto < 5)  return { color: '🔴', texto: 'DESCARTAR — no aguanta un mal día de ads' };
  if (margenNeto < 15) return { color: '🟠', texto: 'RIESGOSO — solo si el CPA baja del estimado' };
  if (margenNeto < 25) return { color: '🟡', texto: 'VIABLE — margen justo, vigilar CPA a diario' };
  if (multiplo < 2.5)  return { color: '🟡', texto: 'VIABLE — buen margen pero múltiplo bajo, poco espacio para descuentos' };
  return { color: '🟢', texto: 'TESTEAR — unidad económica sana' };
}

function num(v, def) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

const usd = n => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);
const pct = n => n.toFixed(1) + '%';

function imprimir(args) {
  const r = evaluar(args);
  const { precio, costo } = r.entradas;

  console.log('\n  CALCULADORA DROPSHIPPING COD — ECUADOR');
  console.log('  ' + '─'.repeat(54));
  console.log(`  Precio de venta        ${usd(precio).padStart(10)}`);
  console.log(`  Costo proveedor        ${usd(costo).padStart(10)}     múltiplo ${r.multiplo.toFixed(2)}x`);
  console.log(`  Flete ida / retorno    ${(usd(r.entradas.flete) + ' / ' + usd(r.entradas.retorno)).padStart(10)}`);
  console.log(`  Tasa de entrega        ${pct(r.entradas.entrega * 100).padStart(10)}`);
  console.log(`  CPA estimado (ads)     ${usd(r.entradas.cpa).padStart(10)}`);

  console.log('\n  POR CADA 100 PEDIDOS GENERADOS');
  console.log('  ' + '─'.repeat(54));
  const entregados = Math.round(r.entradas.entrega * 100);
  console.log(`  ${entregados} entregados      × ${usd(r.margenEntregado).padStart(8)} = ${usd(r.margenEntregado * entregados).padStart(10)}`);
  console.log(`  ${100 - entregados} devueltos       × ${usd(-r.perdidaDevuelto).padStart(8)} = ${usd(-r.perdidaDevuelto * (100 - entregados)).padStart(10)}`);
  console.log(`  100 pedidos en ads × ${usd(-r.entradas.cpa).padStart(8)} = ${usd(-r.entradas.cpa * 100).padStart(10)}`);
  console.log(`  ${' '.repeat(32)}${'─'.repeat(11)}`);
  console.log(`  UTILIDAD NETA                    ${usd(r.utilidadPorPedido * 100).padStart(10)}`);

  console.log('\n  NÚMEROS DE DECISIÓN');
  console.log('  ' + '─'.repeat(54));
  console.log(`  Utilidad por pedido generado     ${usd(r.utilidadPorPedido).padStart(10)}`);
  console.log(`  Margen neto                      ${pct(r.margenNeto).padStart(10)}`);
  console.log(`  ROAS de equilibrio               ${(r.roasBreakeven === Infinity ? 'imposible' : r.roasBreakeven.toFixed(2) + 'x').padStart(10)}`);
  console.log(`  CPA MÁXIMO que puedes pagar      ${usd(r.cpaMaximo).padStart(10)}   ← si Meta supera esto, matar el test`);

  console.log('\n  PRECIOS');
  console.log('  ' + '─'.repeat(54));
  console.log(`  Break-even exacto                ${usd(precioMinimo(r.entradas)).padStart(10)}`);
  console.log(`  Con margen 15%                   ${usd(precioParaMargen(r.entradas, 0.15)).padStart(10)}`);
  console.log(`  Con margen 25%                   ${usd(precioParaMargen(r.entradas, 0.25)).padStart(10)}`);
  console.log(`  Con margen 35%                   ${usd(precioParaMargen(r.entradas, 0.35)).padStart(10)}`);

  console.log(`\n  ${r.semaforo.color}  ${r.semaforo.texto}`);

  // Sensibilidad: el COD se cae o se salva por la tasa de entrega, no por el precio
  console.log('\n  ¿Y SI LA TASA DE ENTREGA ES PEOR?');
  console.log('  ' + '─'.repeat(54));
  for (const e of [0.80, 0.70, 0.60, 0.50]) {
    const s = evaluar({ ...r.entradas, entrega: e, comision: r.entradas.comision });
    console.log(`  entrega ${pct(e * 100).padStart(5)}  →  utilidad/pedido ${usd(s.utilidadPorPedido).padStart(8)}   margen ${pct(s.margenNeto).padStart(7)}  ${s.semaforo.color}`);
  }
  console.log('');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.precio || !args.costo) {
    console.log(`
  Faltan datos. Uso:

    node projects/dropshipping/calculadora.js --precio 29.90 --costo 9.50

  Opcionales (si no los pasas, usa los defaults de Ecuador):
    --flete 5.50      flete de ida COD
    --retorno 3.50    flete de devolución
    --entrega 0.70    tasa de entrega (0.70 = 70%)
    --cpa 10          costo por pedido en Meta Ads
    --comision 0      % de comisión de la plataforma de checkout
`);
    process.exit(1);
  }
  imprimir({ ...args, precio: parseFloat(args.precio), costo: parseFloat(args.costo) });
}

module.exports = { evaluar, precioMinimo, precioParaMargen, cpaMaximo, DEFAULTS };
