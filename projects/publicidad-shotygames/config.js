/**
 * Config de la hoja PUBLICIDAD de SHOTYGAMES.
 *
 * ── Por qué esto NO es una copia de dropshipping ──
 * Se verificó contra los datos reales el 2026-09-01 y el negocio es distinto en
 * tres cosas que cambian el modelo:
 *
 * 1. **Otro Business Manager, otro token.** Las cuentas de Shotygames viven en
 *    el business `178092136536412` (ShotyGames). `META_ADS_TOKEN` es del system
 *    user KEPLER, que está en el business de Avanora, y NO puede leerlas. El que
 *    sí puede es `META_CAPI_TOKEN` (system user "Fabian Usuario Sistema", del
 *    business de ShotyGames). Un token no cruza entre businesses — ver
 *    `feedback_meta_token_tres_capas` en memoria.
 *
 * 2. **NO se puede desglosar por producto.** En dropshipping cada producto tiene
 *    su campaña (1 a 1), así que el gasto se reparte solo. Acá las 2 campañas
 *    activas son transversales ("TORRE PAREJAS", "WEB PROSPECCION FISICOS") y el
 *    Sheet no guarda de qué campaña vino cada pedido: la columna CUENTA es el
 *    BANCO donde entró la plata (PICHINCHA, PAYPHONE...), no la campaña.
 *    Repartir el gasto por producto sería inventado, así que la hoja va a nivel
 *    de cuenta y punto.
 *
 * 3. **La mayoría de las ventas NO vienen de ads.** De los 72 pedidos de agosto,
 *    solo 30 (42%) traen atribución de Meta (fbc/fbp/fbclid); el resto es
 *    WhatsApp orgánico, recompra, etc. Contarlos todos contra el gasto hace que
 *    el CPA se vea mucho mejor de lo que es. Por eso la hoja tiene el selector
 *    "Ventas a contar" — ver abajo.
 */

/**
 * TODAS las cuentas de Shotygames que tuvieron gasto en 2026. El gasto se SUMA.
 *
 * No es una sola: Fabián fue rotando de cuenta a medida que se le iban
 * bloqueando por saldo impago. Verificado el 2026-09-02 barriendo las 11 cuentas
 * del business — solo estas dos tienen gasto, y son secuenciales (no se pisan):
 *
 *   Cuenta Publicitaria 9  → 2026-01-01 a 2026-04-10   $4.032,57   (UNSETTLED hoy)
 *   Cuenta Publicitaria 10 → 2026-04-13 a hoy          $4.519,25   (ACTIVE)
 *
 * ⚠️ Que una cuenta esté UNSETTLED NO impide leer su historial de gasto: sigue
 * siendo consultable por API. Si se leyera solo la ACTIVE, enero-abril saldría
 * con ventas y $0 de gasto — o sea, ROAS infinito y CPA $0. Falso y peligroso.
 *
 * Al agregar una cuenta nueva acá, el gasto entra solo: no hay que tocar nada más.
 */
const CUENTAS_ADS = [
  { id: '1451115062090627', nombre: 'Cuenta Publicitaria 10' },
  { id: '1849155598787278', nombre: 'Cuenta Publicitaria 9' },
];

/**
 * Estados del Sheet de Shotygames, normalizados en MAYÚSCULAS.
 * El Sheet los tiene con mayúsculas inconsistentes ("PAGADO" 518 vs "Pagado" 56,
 * "DEVOLUCION" 15 vs "Devuelto" 1), así que SIEMPRE comparar case-insensitive.
 */
const ESTADOS = {
  entregados: ['PAGADO', 'ENTREGADO'],          // plata cobrada
  devueltos:  ['DEVOLUCION', 'DEVUELTO'],       // salió y volvió: se pierde el envío
  pendientes: ['PENDIENTE', 'ENVIADO', 'NOVEDAD'], // todavía no se sabe
};

module.exports = { CUENTAS_ADS, ESTADOS };
