import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSheets } from './sheets-cliente';
import { hoyEC, lunesDe } from './fecha';

// Dinero y ventas leídos de los Sheets de negocio — SOLO LECTURA. Antes la
// deuda y la utilidad se escribían a mano en CEO y nadie lo hacía.
//
// Las reglas de qué es una venta son las mismas de scripts/analisis-ventas.js
// de KEPLER (el reporte de las 22:00), que dio Fabián:
//   - 2026 REGISTRO DE VENTAS / PEDIDOS → toda fila es venta real.
//   - 2026 VENTAS DIGITALES / VENTAS    → solo ESTADO = PAGADO.
//   - DROPSHIPPING / PEDIDOS            → contra entrega: generado (por FECHA)
//     no es plata; cobrado = ESTADO PAGADO (por FECHA PAGO).
// Contabilidad: DEUDAS (pendiente = total − pagado, salvo ESTADO Pagada) y
// SALDOS_REALES (caja por cuenta).

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
  fisicos: Ventanas | null;
  digitales: Ventanas | null;
  dropGenerados: Ventanas | null;
  dropCobrados: Ventanas | null;
  /** Utilidad de pedidos del mes: físicos + digitales + drop cobrado. Antes de publicidad y gastos fijos. */
  utilidadPedidosMes: number | null;
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

async function leerFisicos(hoy: string): Promise<Ventanas> {
  const { filas, col } = await tabla(process.env.SHEETS_ID, 'PEDIDOS!A1:AZ6000');
  const [iNom, iTel, iFecha, iAnt, iSaldo, iUtil] = ['NOMBRE', 'TELEFONO', 'FECHA', 'ANTICIPO', 'SALDO', 'UTILIDAD'].map(col);
  const v = ventanasVacias();
  const sumar = sumador(hoy);
  for (const f of filas) {
    if (!f[iNom] && !f[iTel]) continue;
    const fecha = aFecha(f[iFecha]);
    if (fecha) sumar(v, fecha, monto(f[iAnt]) + monto(f[iSaldo]), monto(f[iUtil]));
  }
  return redondear(v);
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
  const [deuda, caja, fisicos, digitales, drop] = await Promise.all([
    intentar('Deudas', leerDeuda),
    intentar('Caja', leerCaja),
    intentar('Pedidos ShotyGames', () => leerFisicos(hoy)),
    intentar('Ventas digitales', () => leerDigitales(hoy)),
    intentar('Dropshipping', () => leerDrop(hoy)),
  ]);
  const partes = [fisicos?.mes.utilidad, digitales?.mes.utilidad, drop?.cobrados.mes.utilidad];
  return {
    leidoEn: new Date().toISOString(),
    deuda,
    caja,
    fisicos,
    digitales,
    dropGenerados: drop?.generados ?? null,
    dropCobrados: drop?.cobrados ?? null,
    // Si falta una fuente no se muestra una utilidad a medias como si fuera el total.
    utilidadPedidosMes: partes.every((p) => p !== undefined) ? r2(partes.reduce<number>((s, p) => s + (p ?? 0), 0)) : null,
    errores,
  };
}

// Caché compartida entre lambdas de Vercel (un Map en memoria no sirve: cada
// lambda tiene el suyo). 5 minutos: son 5 Sheets y algunos tienen miles de filas.
const leerCacheado = unstable_cache(leerNegocioSinCache, ['negocio-v1'], { revalidate: 300, tags: ['negocio'] });

export async function leerNegocio(): Promise<Negocio> {
  // La fecha va en la llave: a medianoche "hoy" cambia aunque la caché siga viva.
  return leerCacheado(hoyEC());
}
