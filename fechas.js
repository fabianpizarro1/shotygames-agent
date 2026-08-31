/**
 * Fechas en la zona horaria de Fabián: Quito, Ecuador (UTC-5).
 *
 * ── El bug que originó este archivo (2026-08-31) ──
 * Todo se guardaba con `new Date().toISOString()`, que es UTC. A las 20:42 del
 * 30 de agosto en Quito ya son las 01:42 UTC del 31, así que el pedido
 * TRQ-11624 quedó registrado como del 31. **Todo lo que entra después de las
 * 19:00 se contaba al día siguiente**: los reportes diarios le atribuían las
 * ventas de la noche al día equivocado y el CPA de cada día salía mal.
 *
 * Ecuador NO tiene horario de verano: es UTC-5 todo el año, así que el offset
 * es fijo y no hay que arrastrar una librería de zonas horarias.
 */

const ZONA = 'America/Guayaquil';
const OFFSET_MS = 5 * 60 * 60 * 1000;

/** Hoy en Ecuador, "YYYY-MM-DD". */
function hoyEC() {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA });
}

/**
 * Timestamp para ESCRIBIR en el Sheet, en hora de Ecuador y con el offset
 * explícito: "2026-08-30T20:42:50.764-05:00".
 *
 * Lleva el offset a propósito. Sin él la fecha sería ambigua y el próximo que
 * la lea tendría que adivinar la zona — que es exactamente cómo empezó esto.
 */
function ahoraEC(d = new Date()) {
  return new Date(d.getTime() - OFFSET_MS).toISOString().replace('Z', '-05:00');
}

/**
 * Cualquier fecha del Sheet → "YYYY-MM-DD" del día que fue **en Ecuador**.
 *
 * Tiene que aguantar los cuatro formatos que conviven hoy en las hojas:
 *   "2026-08-31T01:42:50.764Z"        → instante UTC (lo viejo, y lo que sigue
 *                                        escribiendo n8n) → se convierte
 *   "2026-08-30T20:42:50.764-05:00"   → instante con offset → se convierte
 *   "2026-08-30T20:42:50"             → sin zona: ya es local, se usa tal cual
 *   "30/08/2026" o serial de Sheets   → fecha sin hora, no hay nada que convertir
 */
function aFechaLocal(val) {
  if (val === '' || val == null) return null;
  const s = String(val).trim();

  // "05/01/2026" o "1/01/2026" → ya es una fecha local, sin hora
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  // Serial de Sheets (epoch 1899-12-30). El serial ya está en hora local de la
  // hoja, así que se lee como UTC a propósito: convertirlo lo correría un día.
  if (/^\d+(\.\d+)?$/.test(s)) {
    return new Date(Date.UTC(1899, 11, 30) + parseFloat(s) * 86400000)
      .toISOString().slice(0, 10);
  }

  // ISO con hora
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    // ¿Trae zona (Z u offset)? Entonces es un INSTANTE: hay que pasarlo a Ecuador.
    if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      const d = new Date(s);
      return isNaN(d) ? null : d.toLocaleDateString('en-CA', { timeZone: ZONA });
    }
    // Sin zona: se asume que ya viene en hora local.
    return s.slice(0, 10);
  }

  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return ymd ? ymd[0] : null;
}

module.exports = { ZONA, hoyEC, ahoraEC, aFechaLocal };
