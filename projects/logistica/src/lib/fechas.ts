// ============================================================
// FECHAS EN HORA DE ECUADOR (Quito, UTC-5)
//
// Puerto de `KEPLER/fechas.js`. Ecuador no tiene horario de verano, así que el
// offset es fijo y no hace falta una librería de zonas horarias.
//
// El bug que originó todo esto (2026-08-31): se guardaba con `toISOString()`,
// que es UTC. A las 20:42 de Quito ya son las 01:42 UTC del día siguiente, así
// que TODO lo que entraba después de las 19:00 se contaba al día equivocado —
// el 26% de los pedidos.
// ============================================================

const ZONA = 'America/Guayaquil';
const OFFSET_MS = 5 * 60 * 60 * 1000;

/** Hoy en Ecuador, "YYYY-MM-DD". */
export function hoyEC(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA });
}

/**
 * Timestamp para ESCRIBIR en el Sheet: "2026-08-30T20:42:50.764-05:00".
 * Lleva el offset explícito a propósito — sin él la fecha es ambigua y el
 * próximo que la lea tiene que adivinar la zona, que es como empezó el bug.
 */
export function ahoraEC(d = new Date()): string {
  return new Date(d.getTime() - OFFSET_MS).toISOString().replace('Z', '-05:00');
}

/**
 * Cualquier fecha del Sheet o de DROPI → "YYYY-MM-DD" del día que fue en Ecuador.
 * Tiene que aguantar los formatos que conviven hoy:
 *   "2026-08-31T01:42:50.764Z"       instante UTC (lo que escribe n8n) → se convierte
 *   "2026-08-30T20:42:50.764-05:00"  instante con offset               → se convierte
 *   "2026-08-30 20:42:50"            sin zona: ya es local             → tal cual
 *   "30/08/2026" o serial de Sheets  fecha sin hora                    → tal cual
 */
export function aFechaLocal(val: unknown): string | null {
  if (val === '' || val === null || val === undefined) return null;
  const s = String(val).trim();

  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  // Serial de Sheets (epoch 1899-12-30). Se lee como UTC a propósito: el serial
  // ya está en hora local de la hoja y convertirlo lo correría un día.
  if (/^\d+(\.\d+)?$/.test(s)) {
    return new Date(Date.UTC(1899, 11, 30) + parseFloat(s) * 86_400_000)
      .toISOString()
      .slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(s)) {
    if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-CA', { timeZone: ZONA });
    }
    return s.slice(0, 10);
  }

  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return ymd ? ymd[0] : null;
}

/** Días enteros entre dos "YYYY-MM-DD". Nunca negativo. */
export function diasEntre(desdeISO: string | null, hastaISO: string): number {
  if (!desdeISO) return 0;
  const a = Date.parse(desdeISO + 'T00:00:00Z');
  const b = Date.parse(hastaISO + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** "hoy" · "ayer" · "hace 3 días". Para etiquetas cortas en la interfaz. */
export function haceCuanto(dias: number): string {
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * "1 sep, 14:57" para la línea de tiempo.
 *
 * Las dos fuentes traen la hora en zonas distintas y hay que tratarlas
 * distinto, o el tracking muestra movimientos 5 horas corridos:
 *   · `serv_date` de los movimientos  → "2026-09-01 14:57:00", ya en hora local
 *   · `created_at` del historial      → "2026-09-01T19:57:00.000000Z", UTC
 */
export function fechaCorta(val: string): string {
  const s = String(val ?? '').trim();
  if (!s) return '';

  const esInstante = /^\d{4}-\d{2}-\d{2}T/.test(s) && /(Z|[+-]\d{2}:?\d{2})$/.test(s);
  if (esInstante) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const g = (t: string) => p.find((x) => x.type === t)?.value ?? '';
    return etiqueta(+g('year'), +g('month'), +g('day'), `${g('hour')}:${g('minute')}`);
  }

  const iso = aFechaLocal(s);
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  // La hora solo se muestra si el dato la traía. Inventarle "00:00" a una
  // fecha sin hora haría creer que el movimiento fue a medianoche.
  const hora = s.match(/[T ](\d{2}:\d{2})/)?.[1] ?? null;
  return etiqueta(y, m, d, hora);
}

function etiqueta(y: number, m: number, d: number, hora: string | null): string {
  const anio = y !== new Date().getFullYear() ? ` ${y}` : '';
  return `${d} ${MESES[m - 1]}${anio}${hora ? `, ${hora}` : ''}`;
}
