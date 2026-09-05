// ============================================================
// PARSEO DE MONTOS QUE VIENEN DE DOS SHEETS CON LOCALES DISTINTOS
//
// El Sheet de dropshipping está en en_US y escribe "34.99".
// El de ShotyGames está en es_ES y escribe "$29,99" — **coma decimal**.
//
// Un parser que borre las comas (para quitar separadores de miles) convierte
// "$29,99" en 2999: cien veces el valor real. Con eso, "gana si llega" y "en
// riesgo" quedarían inventados en toda la sección de ShotyGames.
//
// Ver `feedback_locale_formulas_sheets` en la memoria: el locale del Sheet ya
// rompió las fórmulas antes por el mismo motivo.
// ============================================================

/**
 * "$29,99" → 29.99 · "1.234,50" → 1234.5 · "34.99" → 34.99 · "1,234.50" → 1234.5
 *
 * La regla: **el último separador que aparece es el decimal**, siempre que le
 * sigan 1 o 2 dígitos. Si le siguen exactamente 3, es separador de miles
 * ("1,234" son mil doscientos treinta y cuatro, no 1.234).
 */
export function aNumero(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;

  // Se conservan dígitos, separadores y el signo. El "$", los espacios (incluido
  // el no-rompible que a veces mete Sheets) y cualquier otra cosa se van.
  const limpio = String(v ?? '')
    .replace(/ /g, '')
    .replace(/[^\d.,-]/g, '')
    .trim();

  if (!limpio || limpio === '-') return 0;

  const negativo = limpio.startsWith('-');
  const cuerpo = limpio.replace(/-/g, '');

  const ultimaComa = cuerpo.lastIndexOf(',');
  const ultimoPunto = cuerpo.lastIndexOf('.');
  const corte = Math.max(ultimaComa, ultimoPunto);

  let normalizado: string;
  if (corte === -1) {
    normalizado = cuerpo;
  } else {
    const decimales = cuerpo.length - corte - 1;
    if (decimales >= 1 && decimales <= 2) {
      // Es el separador decimal: lo de la izquierda son miles y se descarta.
      normalizado = cuerpo.slice(0, corte).replace(/[.,]/g, '') + '.' + cuerpo.slice(corte + 1);
    } else {
      // 3 decimales o más → era separador de miles, no hay parte decimal.
      normalizado = cuerpo.replace(/[.,]/g, '');
    }
  }

  const n = parseFloat(normalizado);
  if (!Number.isFinite(n)) return 0;
  return negativo ? -n : n;
}
