# PUBLICIDAD — Shotygames

Hoja `PUBLICIDAD` dentro del Sheet **"2026 REGISTRO DE VENTAS"**. Mismo formato que la de
dropshipping, pero el negocio es distinto y por eso el modelo no es una copia.

```
node projects/publicidad-shotygames/sheet.js   # layout (una vez, o al cambiar columnas)
node projects/publicidad-shotygames/live.js    # datos (cada 15 min)
```

## Las 3 diferencias con dropshipping (verificadas contra datos reales, 2026-09-01)

**1. Otro token.** Las cuentas de Shotygames están en el business `178092136536412`.
`META_ADS_TOKEN` (system user KEPLER, business de Avanora) **no puede leerlas**. El que sirve es
**`META_CAPI_TOKEN`** (system user "Fabian Usuario Sistema", del business correcto). Un token no
cruza entre Business Managers.

**2. No hay desglose por producto.** En dropshipping cada producto tiene su campaña (1 a 1), así
que el gasto se reparte solo. Acá las 2 campañas activas son transversales
(`TORRE PAREJAS`, `WEB PROSPECCION FISICOS`) y el Sheet **no liga pedido → campaña**: la columna
`CUENTA` es el **banco** donde entró la plata (PICHINCHA, PAYPHONE…), no la campaña. Repartir el
gasto por producto sería inventarlo, así que la hoja va a nivel de cuenta.

**3. Selector "Ventas a contar" (celda F2)** — esto no existe en dropshipping.
De los 72 pedidos de agosto, **solo 30 (42%) traen atribución de Meta**; el resto es WhatsApp
orgánico y recompra. Contarlos todos contra el gasto hace ver el CPA mucho mejor de lo que es:

| F2 | Qué cuenta | CPA del período |
|---|---|---|
| `TODAS` | Todos los pedidos del Sheet | **$19.20** |
| `SOLO META` | Solo los que traen `fbc`/`fbp`/`fbclid` | **$44.36** |

Ninguno de los dos es "el correcto" solo: `TODAS` le regala al ads ventas que no generó, y
`SOLO META` se pierde las conversiones de las campañas de WhatsApp (que no dejan `fbc`). La
verdad está en el medio — por eso el selector, en vez de elegir por Fabián.

## Otros detalles que cuestan si se olvidan

- **Locale `es_ES`**: el separador de fórmulas es `;`, no `,`. Ver
  `feedback_locale_formulas_sheets` en memoria.
- **Estados con mayúsculas inconsistentes** en el Sheet (`PAGADO` 518 / `Pagado` 56,
  `DEVOLUCION` 15 / `Devuelto` 1): comparar **siempre** en mayúsculas.
- **La UTILIDAD no se recalcula**: se usa la columna `UTILIDAD` que el Sheet ya trae
  (ingreso − costo − envío, sin publicidad). Es el número de Fabián, no uno mío.
- **Qué cuesta una devolución** (dato de Fabián, 2026-09-02): el **envío de ida** + **$1 por
  caja**, porque la caja vuelve aplastada y se repone antes de revender. El juego NO se pierde
  (es stock propio y vuelve al inventario), así que los COSTOS no se descuentan. Las cantidades
  salen de las columnas `N/P/PAR/ENG/DADOS/EMPA`, que cuadran con el texto de `PRODUCTOS` en 30
  de 32 pedidos.
  Ojo: en la columna `UTILIDAD` del Sheet, las 16 devoluciones de 2026 figuran con **+$315,89**
  como si se hubieran cobrado. Acá se excluyen de la utilidad y se les resta la pérdida real.
- **`time_range` explícito, nunca `date_preset`**: los presets de N días excluyen el día en curso.
