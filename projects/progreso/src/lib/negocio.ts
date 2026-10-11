import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSheets } from './sheets-cliente';
import { hoyEC, lunesDe, sumarDias } from './fecha';

// Dinero y ventas leídos de los Sheets de negocio — SOLO LECTURA. Antes la
// deuda y la utilidad se escribían a mano en CEO y nadie lo hacía.
//
// Las reglas de qué es una venta son las mismas de scripts/analisis-ventas.js
// de KEPLER (el reporte de las 22:00), que dio Fabián:
//   - 2026 REGISTRO DE VENTAS / PEDIDOS → toda fila es venta (salvo CANCELADO).
//     Pero es contra entrega: la plata y la utilidad cuentan recién en
//     ENTREGADO o PAGADO, y un DEVUELTO resta el envío. Misma fórmula que
//     utilidadRealFisica de finanzas-app (adm.shotygames.com), para que las dos
//     apps den el mismo número.
//   - 2026 VENTAS DIGITALES / VENTAS    → solo ESTADO = PAGADO.
//   - DROPSHIPPING / PEDIDOS            → contra entrega: generado (por FECHA)
//     no es plata; cobrado = ESTADO PAGADO (por FECHA PAGO).
// Contabilidad: DEUDAS (pendiente = total − pagado, salvo ESTADO Pagada) y
// SALDOS_REALES (caja por cuenta).
//
// Utilidad REAL del mes = utilidad cobrada − publicidad − gastos (decidido
// por Fabián el 2026-10-10):
//   - Publicidad: lo GASTADO por día (PUBLICIDAD_DATOS de ShotyGames y de
//     dropshipping, columna GASTO REAL con la comisión de Meta; UTILIDADES de
//     digitales, PUBLI + IVA). Las recargas a Meta que se anotan en GASTOS son
//     la misma plata y NO se restan otra vez.
//   - GASTOS del mes: todos (sueldo de Fabián incluido) MENOS las categorías
//     'COSTOS - …': son compras de material y cada pedido ya resta su costo.

export interface Cubo {
  pedidos: number;
  ingreso: number;
  utilidad: number;
}

export interface Ventanas {
  hoy: Cubo;
  semana: Cubo;
  mes: Cubo;
}

export interface Negocio {
  leidoEn: string;
  deuda: { pendiente: number; cantidad: number; ultimaRegistrada: string; items: { negocio: string; acreedor: string; pendiente: number; vence: string }[] } | null;
  caja: { total: number; cuentas: { cuenta: string; saldo: number; fecha: string }[] } | null;
  /** Pedidos vendidos (todo lo no cancelado), por FECHA del pedido. */
  fisicos: Ventanas | null;
  /** Lo ya cobrado: ENTREGADO/PAGADO con su utilidad; los DEVUELTOS restan el envío. Por FECHA del pedido. */
  fisicosCobrados: Ventanas | null;
  /** Pedidos todavía en la calle (sin entregar ni devolver) y el saldo contra entrega que falta cobrar. */
  /** porCobrar = saldo contra entrega pendiente; utilidad = la que dejarían si se entregan todos. */
  enCalle: { pedidos: number; porCobrar: number; utilidad: number; viejos: number } | null;
  digitales: Ventanas | null;
  dropGenerados: Ventanas | null;
  dropCobrados: Ventanas | null;
  /** Utilidad COBRADA del mes: físicos cobrados + digitales pagados + drop cobrado. Antes de publicidad y gastos fijos. */
  utilidadCobradaMes: number | null;
  /** Publicidad gastada en el mes por negocio. */
  publicidadMes: { shotygames: number; drop: number; digitales: number; total: number } | null;
  /** GASTOS del mes que se restan, y los que no (con su motivo). */
  gastosMes: { restados: number; categorias: { categoria: string; monto: number }[]; excluidos: { motivo: string; monto: number }[] } | null;
  /** Utilidad cobrada − publicidad − gastos. null si falta alguna parte. */
  utilidadRealMes: number | null;
  errores: string[];
}

// ── Lectura de celdas ───────────────────────────────────────────────────────

/** "$1.234,56", "1,234.56", "520" → número. */
function monto(val: unknown): number {
  if (val === '' || val == null) return 0;
  let s = String(val).replace(/[$\s]/g, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** Cualquier fecha de los Sheets → 'YYYY-MM-DD' en Ecuador (mismo criterio que fechas.js de KEPLER). */
function aFecha(val: unknown): string | null {
  if (val === '' || val == null) return null;
  const s = String(val).trim();
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  if (/^\d+(\.\d+)?$/.test(s)) {
    return new Date(Date.UTC(1899, 11, 30) + parseFloat(s) * 86_400_000).toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
    }
    return s.slice(0, 10);
  }
  return s.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

async function tabla(spreadsheetId: string | undefined, rango: string) {
  if (!spreadsheetId) throw new Error(`falta el id del Sheet de ${rango.split('!')[0]}`);
  const res = await getSheets().spreadsheets.values.get({ spreadsheetId: spreadsheetId.trim(), range: rango });
  const [cabecera = [], ...filas] = (res.data.values ?? []) as string[][];
  // Columnas por título, nunca por letra: las hojas cambian.
  const col = (nombre: string) => {
    const i = cabecera.indexOf(nombre);
    if (i < 0) throw new Error(`${rango.split('!')[0]}: no existe la columna ${nombre}`);
    return i;
  };
  return { filas, col };
}

function ventanasVacias(): Ventanas {
  return { hoy: { pedidos: 0, ingreso: 0, utilidad: 0 }, semana: { pedidos: 0, ingreso: 0, utilidad: 0 }, mes: { pedidos: 0, ingreso: 0, utilidad: 0 } };
}

function sumador(hoy: string) {
  const lunes = lunesDe(hoy);
  const mes = hoy.slice(0, 7);
  return (v: Ventanas, fecha: string, ingreso: number, utilidad: number) => {
    const en: (keyof Ventanas)[] = [];
    if (fecha === hoy) en.push('hoy');
    if (fecha >= lunes && fecha <= hoy) en.push('semana');
    if (fecha.startsWith(mes) && fecha <= hoy) en.push('mes');
    for (const k of en) {
      v[k].pedidos += 1;
      v[k].ingreso += ingreso;
      v[k].utilidad += utilidad;
    }
  };
}

function redondear(v: Ventanas): Ventanas {
  for (const c of Object.values(v)) {
    c.ingreso = r2(c.ingreso);
    c.utilidad = r2(c.utilidad);
  }
  return v;
}

// ── Fuentes ─────────────────────────────────────────────────────────────────

async function leerDeuda(): Promise<Negocio['deuda']> {
  const { filas, col } = await tabla(process.env.SHEETS_ID_FINANZAS, 'DEUDAS!A1:J300');
  const [iFecha, iNeg, iAcr, iTot, iPag, iVence, iEst] = ['FECHA', 'NEGOCIO', 'ACREEDOR', 'MONTO_TOTAL', 'MONTO_PAGADO', 'FECHA_LIMITE', 'ESTADO'].map(col);
  const items: NonNullable<Negocio['deuda']>['items'] = [];
  let ultima = '';
  for (const f of filas) {
    const fecha = aFecha(f[iFecha]);
    if (fecha && fecha > ultima) ultima = fecha;
    if (String(f[iEst] ?? '').trim().toUpperCase() === 'PAGADA') continue;
    const pendiente = r2(monto(f[iTot]) - monto(f[iPag]));
    if (pendiente <= 0) continue;
    items.push({ negocio: f[iNeg] ?? '', acreedor: f[iAcr] ?? '', pendiente, vence: aFecha(f[iVence]) ?? '' });
  }
  items.sort((a, b) => b.pendiente - a.pendiente);
  return { pendiente: r2(items.reduce((s, i) => s + i.pendiente, 0)), cantidad: items.length, ultimaRegistrada: ultima, items };
}

async function leerCaja(): Promise<Negocio['caja']> {
  const { filas, col } = await tabla(process.env.SHEETS_ID_FINANZAS, 'SALDOS_REALES!A1:C50');
  const [iCta, iSaldo, iFecha] = ['CUENTA', 'SALDO_REAL', 'FECHA_ACTUALIZACION'].map(col);
  const cuentas = filas
    .filter((f) => f[iCta])
    .map((f) => ({ cuenta: f[iCta], saldo: monto(f[iSaldo]), fecha: aFecha(f[iFecha]) ?? '' }));
  return { total: r2(cuentas.reduce((s, c) => s + c.saldo, 0)), cuentas };
}

const normalizar = (x: unknown) =>
  String(x ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

async function leerFisicos(hoy: string) {
  const { filas, col } = await tabla(process.env.SHEETS_ID, 'PEDIDOS!A1:AZ6000');
  const [iNom, iTel, iFecha, iAnt, iSaldo, iCostos, iEnvio, iEst] = ['NOMBRE', 'TELEFONO', 'FECHA', 'ANTICIPO', 'SALDO', 'COSTOS', 'ENVIO', 'ESTADO'].map(col);
  const vendidos = ventanasVacias();
  const cobrados = ventanasVacias();
  const enCalle = { pedidos: 0, porCobrar: 0, utilidad: 0, viejos: 0 };
  const hace15 = sumarDias(hoy, -15);
  const sumar = sumador(hoy);
  for (const f of filas) {
    if (!f[iNom] && !f[iTel]) continue;
    const estado = normalizar(f[iEst]);
    if (estado === 'cancelado') continue;
    const fecha = aFecha(f[iFecha]);
    const venta = monto(f[iAnt]) + monto(f[iSaldo]);
    const envio = monto(f[iEnvio]);
    const entregado = estado === 'pagado' || estado === 'entregado';
    const devuelto = estado.includes('devuelt') || estado.includes('devoluc');
    if (fecha) sumar(vendidos, fecha, venta, 0);
    if (entregado && fecha) sumar(cobrados, fecha, venta, venta - monto(f[iCostos]) - envio);
    else if (devuelto && fecha) {
      // La torre vuelve a bodega y se revende; el flete de ida se pierde.
      // Resta utilidad pero no es un pedido cobrado.
      sumarSoloUtilidad(cobrados, fecha, hoy, -envio);
    } else if (!entregado && !devuelto) {
      enCalle.pedidos += 1;
      enCalle.porCobrar += monto(f[iSaldo]);
      enCalle.utilidad += venta - monto(f[iCostos]) - envio;
      // Más de 15 días sin entregarse ni volver: atascado o con el estado sin actualizar.
      if (fecha && fecha < hace15) enCalle.viejos += 1;
    }
  }
  enCalle.porCobrar = r2(enCalle.porCobrar);
  enCalle.utilidad = r2(enCalle.utilidad);
  return { vendidos: redondear(vendidos), cobrados: redondear(cobrados), enCalle };
}

/** Suma solo utilidad (sin pedido ni ingreso): para los devueltos. */
function sumarSoloUtilidad(v: Ventanas, fecha: string, hoy: string, utilidad: number) {
  const lunes = lunesDe(hoy);
  if (fecha === hoy) v.hoy.utilidad += utilidad;
  if (fecha >= lunes && fecha <= hoy) v.semana.utilidad += utilidad;
  if (fecha.startsWith(hoy.slice(0, 7)) && fecha <= hoy) v.mes.utilidad += utilidad;
}

async function leerDigitales(hoy: string): Promise<Ventanas> {
  const { filas, col } = await tabla(process.env.SHEETS_ID_VENTAS_DIGITALES, 'VENTAS!A1:S6000');
  const [iFecha, iIng, iEst] = ['FECHA', 'INGRESOS', 'ESTADO'].map(col);
  const v = ventanasVacias();
  const sumar = sumador(hoy);
  for (const f of filas) {
    if (String(f[iEst] ?? '').trim().toUpperCase() !== 'PAGADO') continue;
    const fecha = aFecha(f[iFecha]);
    // Producto digital: el ingreso es utilidad (no hay costo por unidad).
    if (fecha) sumar(v, fecha, monto(f[iIng]), monto(f[iIng]));
  }
  return redondear(v);
}

async function leerDrop(hoy: string): Promise<{ generados: Ventanas; cobrados: Ventanas }> {
  const { filas, col } = await tabla(process.env.SHEETS_ID_DROPSHIPPING, 'PEDIDOS!A1:AA6000');
  const [iFecha, iEst, iTotal, iUtil, iPago] = ['FECHA', 'ESTADO', 'TOTAL COBRAR', 'UTILIDAD REAL', 'FECHA PAGO'].map(col);
  const generados = ventanasVacias();
  const cobrados = ventanasVacias();
  const sumar = sumador(hoy);
  for (const f of filas) {
    if (!f[0]) continue;
    const est = String(f[iEst] ?? '').trim().toUpperCase();
    const fecha = aFecha(f[iFecha]);
    if (fecha && est !== 'CANCELADO') sumar(generados, fecha, monto(f[iTotal]), 0);
    if (est === 'PAGADO') {
      const pago = aFecha(f[iPago]) ?? fecha;
      if (pago) sumar(cobrados, pago, monto(f[iTotal]), monto(f[iUtil]));
    }
  }
  return { generados: redondear(generados), cobrados: redondear(cobrados) };
}

async function gastoPublicidad(id: string | undefined, rango: string, cFecha: string, cValor: string, mes: string, hoy: string) {
  const { filas, col } = await tabla(id, rango);
  const [iF, iV] = [cFecha, cValor].map(col);
  let total = 0;
  for (const f of filas) {
    const fecha = aFecha(f[iF]);
    if (fecha && fecha.startsWith(mes) && fecha <= hoy) total += monto(f[iV]);
  }
  return r2(total);
}

async function leerPublicidad(hoy: string): Promise<NonNullable<Negocio['publicidadMes']>> {
  const mes = hoy.slice(0, 7);
  const [shotygames, drop, digitales] = await Promise.all([
    gastoPublicidad(process.env.SHEETS_ID, 'PUBLICIDAD_DATOS!A1:U3000', 'FECHA', 'GASTO REAL', mes, hoy),
    gastoPublicidad(process.env.SHEETS_ID_DROPSHIPPING, 'PUBLICIDAD_DATOS!A1:O6000', 'FECHA', 'GASTO REAL', mes, hoy),
    gastoPublicidad(process.env.SHEETS_ID_VENTAS_DIGITALES, 'UTILIDADES!A1:I3000', 'DIA', 'PUBLI + IVA', mes, hoy),
  ]);
  return { shotygames, drop, digitales, total: r2(shotygames + drop + digitales) };
}

async function leerGastos(hoy: string): Promise<NonNullable<Negocio['gastosMes']>> {
  const { filas, col } = await tabla(process.env.SHEETS_ID_FINANZAS, 'GASTOS!A1:F8000');
  const [iF, iCat, iV] = ['FECHA GAS', 'CATEGORIA', 'VALOR'].map(col);
  const mes = hoy.slice(0, 7);
  const restadas: Record<string, number> = {};
  let materiales = 0;
  let recargasMeta = 0;
  for (const f of filas) {
    const fecha = aFecha(f[iF]);
    if (!fecha || !fecha.startsWith(mes) || fecha > hoy) continue;
    const categoria = String(f[iCat] ?? '').trim().toUpperCase() || 'SIN CATEGORÍA';
    const v = monto(f[iV]);
    if (categoria.startsWith('COSTOS')) materiales += v;
    else if (categoria.includes('PUBLICIDAD META')) recargasMeta += v;
    else restadas[categoria] = (restadas[categoria] ?? 0) + v;
  }
  const categorias = Object.entries(restadas)
    .map(([categoria, m]) => ({ categoria, monto: r2(m) }))
    .sort((a, b) => b.monto - a.monto);
  return {
    restados: r2(categorias.reduce((s, c) => s + c.monto, 0)),
    categorias,
    excluidos: [
      { motivo: 'Materiales (COSTOS - …): ya están en el costo de cada pedido', monto: r2(materiales) },
      { motivo: 'Recargas a Meta: la publicidad se resta por lo gastado cada día', monto: r2(recargasMeta) },
    ].filter((e) => e.monto > 0),
  };
}

async function leerNegocioSinCache(hoy: string): Promise<Negocio> {
  const errores: string[] = [];
  const intentar = async <T,>(nombre: string, fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (e) {
      errores.push(`${nombre}: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  };
  const [deuda, caja, fisicos, digitales, drop, publicidad, gastos] = await Promise.all([
    intentar('Deudas', leerDeuda),
    intentar('Caja', leerCaja),
    intentar('Pedidos ShotyGames', () => leerFisicos(hoy)),
    intentar('Ventas digitales', () => leerDigitales(hoy)),
    intentar('Dropshipping', () => leerDrop(hoy)),
    intentar('Publicidad', () => leerPublicidad(hoy)),
    intentar('Gastos', () => leerGastos(hoy)),
  ]);
  const partes = [fisicos?.cobrados.mes.utilidad, digitales?.mes.utilidad, drop?.cobrados.mes.utilidad];
  // Si falta una fuente no se muestra una utilidad a medias como si fuera el total.
  const cobrada = partes.every((p) => p !== undefined) ? r2(partes.reduce<number>((s, p) => s + (p ?? 0), 0)) : null;
  return {
    leidoEn: new Date().toISOString(),
    deuda,
    caja,
    fisicos: fisicos?.vendidos ?? null,
    fisicosCobrados: fisicos?.cobrados ?? null,
    enCalle: fisicos?.enCalle ?? null,
    digitales,
    dropGenerados: drop?.generados ?? null,
    dropCobrados: drop?.cobrados ?? null,
    utilidadCobradaMes: cobrada,
    publicidadMes: publicidad,
    gastosMes: gastos,
    utilidadRealMes: cobrada !== null && publicidad && gastos ? r2(cobrada - publicidad.total - gastos.restados) : null,
    errores,
  };
}

// Caché compartida entre lambdas de Vercel (un Map en memoria no sirve: cada
// lambda tiene el suyo). 5 minutos: son 5 Sheets y algunos tienen miles de filas.
const leerCacheado = unstable_cache(leerNegocioSinCache, ['negocio-v4'], { revalidate: 300, tags: ['negocio'] });

/** Sin caché de Next: para scripts fuera de la app (scripts/progreso.mjs). */
export function leerNegocioDirecto(): Promise<Negocio> {
  return leerNegocioSinCache(hoyEC());
}

export async function leerNegocio(): Promise<Negocio> {
  // La fecha va en la llave: a medianoche "hoy" cambia aunque la caché siga viva.
  return leerCacheado(hoyEC());
}
