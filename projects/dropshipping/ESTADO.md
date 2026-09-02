# Estado del proyecto de dropshipping — Avanora Naturals

_Última actualización: 2026-08-14 (segunda revisión)_

Este documento existe para que alguien (o algo) que llega sin contexto pueda entender dónde
está todo sin leer el historial. Si trabajás acá, léelo entero antes de tocar nada.

---

## Qué es esto

Fabián Pizarro está montando una operación de dropshipping en Ecuador con el catálogo de
**DROPI**, separada de su negocio existente (Shotygames, juegos de mesa). La marca nueva se
llama **Avanora Naturals** y vende suplementos.

Modelo: **contra entrega (COD)**. El cliente paga en efectivo cuando el repartidor le entrega.
Eso cambia toda la matemática — ver "Unidad económica" más abajo.

**Contexto que importa:** Fabián tiene ~$100 de caja y deudas con deadline. El objetivo del
primer test NO es ganar plata, es **medir el CPA real de la cuenta publicitaria**, que nunca
se midió.

---

## Identificadores

| Qué | Valor |
|---|---|
| Cuenta publicitaria | `1284579892343452` — "AVANORA NATURALS" (ACTIVE) |
| Portafolio / business | `2102150583288162` — "Avanora" |
| Página de Facebook | `1286826097846865` — "Avanora Naturals" |
| Pixel de Meta | `1049349201145063` — "PIXEL AVANORA" |
| Web | https://avanora.vercel.app |
| Repo de la web | `github.com/fabianpizarro1/avanora` (**privado**, repo aparte de KEPLER) |
| Sheet de investigación | `1RhqJ7sIdYCg21m1JbTBIJ-AZtVdwY7zjon61EjUbKjc` (una pestaña por producto) |
| Sheet de pedidos | variable `SHEETS_ID_DROPSHIPPING` en `.env` |

**Ojo:** las 11 cuentas publicitarias de ShotyGames están todas en `UNSETTLED` (saldo impago) y
no sirven. Solo la de Avanora está activa.

---

## Unidad económica (números verificados, no estimados)

| Dato | Valor | Cómo se supo |
|---|---|---|
| Flete | **$6.36** | Orden real DROPI **6515467** (Machala, 1 unidad) |
| Flete de retorno | **$0** | DROPI no cobra retorno en órdenes CON RECAUDO |
| Tasa de entrega | **70%** | ⚠️ **SUPUESTO.** No hay dato propio todavía |

**El flete NO se cobra por peso.** El campo `weight` de la ficha está en gramos para algunos
productos y en kilos para otros, pero DROPI no lo usa para calcular el envío: $6.36 en la orden
6515467 contra $6.38 en la orden 6500078, que era otro producto con otro peso.

Fórmula (`projects/dropshipping/calculadora.js`):

```
margenEntregado   = precio − costo − flete
perdidaDevuelto   = flete
porPedidoGenerado = (entrega × margenEntregado) − ((1 − entrega) × perdidaDevuelto)
```

Ese último número es el CPA de equilibrio. **Y hay un paso más: dividirlo por 1.2**, porque el
gasto en Meta lleva ~20% de comisión bancaria. Así que el CPA que muestra el administrador tiene
que ser un 20% menor. Para ganar plata, apuntar a la **mitad** del de equilibrio.

**La variable de riesgo ahora es la tasa de entrega.** Para 1 frasco de drenaje a $28:
80% → CPA máx $11.32 · 70% → $9.11 · 60% → $6.90 · 50% → $4.69. Por debajo del 60% casi
ningún anuncio sirve. Se sabrá cuando se entreguen los primeros pedidos reales.

---

## Los 6 productos elegidos

Ver `project_avanora_productos` en la memoria para el detalle. Orden de testeo acordado:

1. **Drenaje Linfático Aurelys** (168103) — ✅ landing y campaña listas
2. **Inositol Multivitamin** (110735) — ✅ landing y campaña listas
3. Clorofila líquida (131953)
4. Glucosamina Forte (118553)
5. FARMAPROX (102479) — riesgo alto en Meta
6. Combo Melaxin (140055) — riesgo alto en Meta

---

## Producto 1 — Drenaje Linfático Aurelys

**DROPI 168103** · proveedor 111202 · costo **$5.90** · bodega DISVAS

### Precio y márgenes

| Combo | Precio | Por pedido generado | CPA máximo |
|---|---|---|---|
| 1 frasco | $28.00 | $9.11 | **$7.59** |
| 2 frascos | $35.00 | $9.86 | **$8.22** |
| 3 frascos | $50.00 | $16.25 | **$13.54** |

_(CPA máximo = por pedido generado ÷ 1.2, por la comisión bancaria del gasto en Meta)_

Precio tachado $39.99. El rango real del mercado ecuatoriano era $23–$28 el frasco suelto.

### Landings (en vivo)

- **A — visual:** https://avanora.vercel.app/p/drenaje-linfatico
- **B — clásica:** `?v=b`
- **C — advertorial:** `?v=c`

### Campaña (EN PAUSA, nunca se activó)

```
Campaña 120251984830830787 · "Avanora · Drenaje Linfático · Sonda CPA"
└── Conjunto 120251984847440787 · EC · Mujeres 28-58 · $10/día · Purchase
    ├── 120251984989610787  A1 · Control            ✅ aprobado
    ├── 120251985000200787  A2 · Reencuadre         ✅ aprobado
    ├── 120251985006680787  A3 · El zapato          ✅ aprobado
    └── 120251985012390787  A4 · Oferta 3x$50       ✅ aprobado
```

### Competencia (barrido del 13-ago-2026)

16 anunciantes, ~170 anuncios activos. Los principales: Zalquimartecua (~16 ads), PharmaTodo
(~14, 2x$35), Novamark (~14), Zentro (~12, $27.99). Cinco tienen landing web propia.

Ángulo más usado: "siéntete más ligera". El menos explotado y más fuerte: **"¿Y si no fuera
grasa?"** — la idea de que *la grasa es constante, el agua fluctúa*.

---

## Producto 2 — Inositol Multivitamin (Peach Perfect)

**DROPI 110735** · proveedor 60343 · costo **$5.00** · bodega ECOMARKET QUITO

Producto real: **Peach Perfect Inositol Multivitamin**, sabor fresa/açaí, **polvo** (no
cápsulas), 243.1 g, 30 porciones. Myo-Inositol 4.000 mg + D-Chiro 50 mg + DIM 100 mg +
magnesio glicinato 200 mg + zinc 10 mg + vitamina D3 1.000 UI.

### Precio y márgenes

| Combo | Precio | Por pedido generado | CPA máximo |
|---|---|---|---|
| 1 frasco | $29.99 | $11.13 | **$9.28** |
| 2 frascos | $37.99 | $13.23 | **$11.03** |
| 3 frascos | $49.99 | $18.13 | **$15.11** |

_(CPA máximo = por pedido generado ÷ 1.2, por la comisión bancaria del gasto en Meta)_

El tachado de $49.99 es **real**: es lo que cuesta un frasco en peachperfect.com.

### Landings (en vivo)

- **A — visual:** https://avanora.vercel.app/p/inositol
- **B — clásica:** `?v=b`
- **C — advertorial:** `?v=c`

### Campaña (EN PAUSA)

```
Campaña 120251998583790787 · "Avanora · Inositol · Sonda CPA"
└── Conjunto 120251998586280787 · EC · Mujeres 22-45 · $10/día · Purchase
    ├── 120251998673730787  A1 · Oferta 3x$49.99       ✅ aprobado
    ├── 120251998677350787  A2 · Síntomas              ✅ aprobado
    ├── 120251998680310787  A3 · Mecanismo/azúcar      ✅ aprobado
    ├── 120251998682700787  A4 · 4 cápsulas o un vaso  ❌ RECHAZADO
    └── 120252001767300787  A4b · No es una pastilla   🕐 en revisión
```

**Sobre el rechazo:** el A4 era el único creativo que mostraba **cápsulas sueltas** en la
imagen, y el titular decía "4 CÁPSULAS AL DÍA". Los otros tres, con el mismo producto, la
misma página y la misma landing, pasaron. No se pudo leer el motivo textual de Meta (la API de
errores no cubre rechazos, el navegador interno no tiene sesión y la extensión de Chrome no
respondió), así que es un diagnóstico, no una cita. El reemplazo A4b mantiene el ángulo pero
sin mostrar pastillas.

**El A4 rechazado sigue en la cuenta** — el borrado por API no está habilitado en esta cuenta.
Está en pausa y no gasta, pero conviene eliminarlo a mano.

### Competencia

Muy débil comparada con el drenaje. **Ningún competidor en Ecuador tiene landing web: los tres
mandan a WhatsApp.** Esa es la ventaja estructural del producto.

- **UltraStock** (`1126169770578636`) — vende **exactamente este producto**, 1=$29.99, 2=$37.99
- **VivaShop** (`793023347219920`) — desde el **26-ago-2025**, casi un año al aire. Otra marca
  (Intimate Rose, cápsulas), 2x$28-30
- **ECU Store** (`960397790495352`) — otra marca, 2x$35

Ángulo libre y sin usar por nadie: **el mecanismo** (resistencia a la insulina → andrógenos
altos → ovulación irregular). Todos se quedan en la lista de beneficios.

---

## Arquitectura de la web

Repo aparte: `projects/avanora/` (está en `.gitignore` de KEPLER, es su propio repo git).

```
src/data/productos.ts     ← TODO el contenido vive acá. Agregar un producto = agregar un objeto
src/pages/Landing.tsx     ← shell: resuelve producto y variante, despacha a una estructura
src/layouts/Visual.tsx    ← estructura A: bloques de imagen a ancho completo
src/layouts/Clasica.tsx   ← estructura B: secciones con texto e imágenes
src/layouts/Historia.tsx  ← estructura C: advertorial largo
src/components/Secciones.tsx  ← oferta, casos, reseñas y FAQ (compartidos por las tres)
src/components/CheckoutModal.tsx  ← checkout COD en modal
api/pedido.ts             ← recibe el pedido y lo reenvía al webhook de n8n
```

Las tres variantes se sirven con `?v=b` / `?v=c`. Una `?v=` desconocida cae en la A.
El pixel manda el slug con la variante pegada (`producto|b`) para poder comparar en Meta.

**Reglas de la landing que ya se aprendieron** (están en la skill, no las cambies sin motivo):
los botones muestran el precio de UNA unidad y el checkout abre en la opción más barata; el
upsell va adentro del checkout con el ahorro a la vista; reseñas con foto primero; una reseña
de 4 estrellas con un pero; timeline para BAJAR expectativas; garantía visible; tabla
comparativa con una fila donde gana la alternativa.

---

## Flujo de un pedido

**Actualizado 2026-08-25:** la página `/gracias` ahora hace lo mismo que Truquito — arma un mensaje
con el pedido completo y manda al cliente a WhatsApp (`593985366649`, el mismo número de Truquito)
para que **él** confirme. Antes decía "te escribimos nosotros". El pedido se distingue por su
prefijo: `AVN-` es Avanora, `TRQ-` es Truquito. El redirect es automático a los 1.4 s y además
queda el botón visible. `CheckoutModal.tsx` manda a `/gracias` el pedido entero (producto,
cantidad, total, provincia y ciudad con etiqueta legible, dirección, referencias, idPedido).

```
landing → /api/pedido → n8n → Google Sheet (estado PENDIENTE_CONFIRMACION)
       → Fabián confirma (bot de Telegram) → DROPI crea la orden (estado EN_DROPI)
       → el proveedor genera la guía → entrega → se cobra
```

Validado de punta a punta el 2026-08-13 con el pedido **AVN-71254** → orden DROPI **6515467**.

Scripts relevantes:

| Archivo | Qué hace |
|---|---|
| `catalogo.js` | Escanea el catálogo de DROPI. Exporta `conToken` (login automático) |
| `calculadora.js` | Unidad económica COD. Defaults verificados contra órdenes reales |
| `ranking.js` | Cruza velocidad de venta, rentabilidad y riesgo en Meta |
| `pedidos.js` | Crea órdenes en DROPI. `crearPedido`, `getOrden`, `getMovimientosWallet` |
| `sheets-pedidos.js` | Lee y escribe el Sheet de pedidos **por título de columna**, no por índice |
| `diario.js` | Rutina de las 5 AM: snapshot + ranking + aviso por Telegram + publica el dashboard |
| `crear-sheet-productos.js` | Arma el Sheet de investigación, una hoja por producto |
| `consistencia.js` | Velocidad de venta sostenida (no un solo salto de stock). **Ojo: un restock del proveedor le tapa las ventas del día — para volumen real usar `ventas-mercado.js`** |
| `ventas-mercado.js` | Ventas reales de un producto en DROPI, **de todos los dropshippers**. Muestrea stock cada 30 min (LaunchAgent `com.shotygames.ventas-mercado`) y suma solo las bajas, así el restock no borra las ventas. `medir` / `reporte` / `sembrar` / `watchlist` |
| `candidatos-tienda.js` | Separa candidatos por tienda: Avanora (salud) vs Truquito (Meta-safe) |
| `tendencias.js` | Nuevos ganadores y producto del mes, sobre `consistencia.js` |
| `publicar.js` | Sube todo a Supabase para el dashboard web (`dropi_dashboard`, `dropi_historial`) |
| `campanas.js` | Mapeo ID DROPI → campaña(s) de Meta, a mano. Lo usa `publicidad-live.js` |
| `publicidad-sheet.js` | Arma el layout de la hoja PUBLICIDAD: dropdown de producto y tabla filtrada por fórmula. Re-correrlo es seguro |
| `publicidad-live.js` | Llena `PUBLICIDAD_DATOS` cada 15 min: una fila por **día × producto** (campañas del mismo producto **sumadas**), últimos 30 días. Requiere `META_ADS_TOKEN` en `.env` (pendiente, ver Pendientes) |

### `DEVUELTO` es un estado nuevo del Sheet (2026-08-31)

Antes no existía, y eso era un **bug real, no una omisión cosmética**: cuando una transportadora
reportara una devolución, `sincronizar_guias` no la matcheaba con ningún grupo y el pedido
quedaba clavado en `GUIA_GENERADA` para siempre. Peor: un texto tipo
`DEVOLUCION ENTREGADA AL REMITENTE` contiene la palabra `ENTREGADO` y se habría marcado como
**entrega** — una venta perdida contada como buena, esperando un pago que nunca llega. Por eso la
clasificación de devolución se evalúa **antes** que `ESTADOS_ENTREGADO`.

#### `clasificarDevolucion()` — tres niveles, no un match por raíz

Lo advirtió Fabián: **`DEVOLUCION DE DISTRIBUCION` no es una devolución.** Es un intento de
entrega que falló y el paquete vuelve al centro de distribución — sigue vivo y se puede
reintentar. Un match por raíz (`DEVOLUC`) lo habría marcado `DEVUELTO` y matado un pedido
todavía cobrable. Por eso:

| Nivel | Qué es | Ejemplos | Qué hace |
|---|---|---|---|
| `TRANSITORIA` | Falló el reparto, el paquete sigue en juego | `DEVOLUCION DE DISTRIBUCION`, `DEVOLUCION DE REPARTO`, `…REPROGRAMAD…` | Se trata como tránsito normal |
| `DEFINITIVA` | Volvió al remitente, orden muerta | `DEVUELTO`, `DEVOLUCION`, `RETORNADO` (**igualdad exacta**) · cualquiera con `AL REMITENTE` / `A ORIGEN` | → estado `DEVUELTO` |
| `AMBIGUA` | Habla de devolución pero no dice si volvió | `EN PROCESO DE DEVOLUCION`, `RECHAZADO POR EL CLIENTE` | **No toca el estado.** Lo reporta con el texto exacto para que Fabián lo clasifique |

La igualdad exacta en el nivel definitivo es lo que evita que `DEVOLUCION DE DISTRIBUCION`
matchee con `DEVOLUCION`. Hay tests de los 17 casos (incluidas las trampas) en el historial de
la sesión del 2026-08-31; ante la duda el sistema **pregunta en vez de adivinar**, porque
equivocarse cuesta plata en las dos direcciones.

Al 2026-08-31 no hay ninguna devolución, así que **el cambio es inerte**: ningún número actual se
movió (verificado — `analisis-ventas.js` sigue dando la misma tasa de cobro, 57.1%). Lo que se
tocó para que quede coherente cuando pase la primera:

| Archivo | Cambio |
|---|---|
| `claude-dropshipping.js` | Grupo `ESTADOS_DEVUELTO` + rama antes de ENTREGADO. No manda WhatsApp de guía a un devuelto |
| `sheets-pedidos.js` | Fórmula de UTILIDAD: un `DEVUELTO` pierde **CPA + flete de ida** (un `CANCELADO` solo el CPA) |
| `crear-sheet-pedidos.js` | Estado en la validación, color propio, y fila "Devuelto" en RESUMEN |
| `scripts/analisis-ventas.js` | Cubo `devueltos` y los suma a `cerrados` — si no, la tasa de cobro se vería mejor de lo que es |
| `publicidad-live.js` | Cuenta `DEVUELTO` (y el `CANCELADO` con guía como respaldo) |

### `NOVEDAD` — estado nuevo (2026-08-31, pedido por Fabián)

`NOVEDAD` en DROPI = la entrega tuvo un problema (dirección mala, nadie en casa, no contesta). **El
paquete sigue vivo**: puede resolverse y entregarse, o terminar en devolución. Es el estado más
accionable de todos — una novedad desatendida termina en devolución.

- `esNovedadAbierta()` en `claude-dropshipping.js`. **`NOVEDAD SOLUCIONADA` contiene `NOVEDAD`** —
  misma trampa que `DEVOLUCION DE DISTRIBUCION`, así que lo resuelto se chequea PRIMERO y vuelve a
  `GUIA_GENERADA`.
- `NOVEDAD` está en `EN_CURSO`, así que el sync la sigue revisando. Sin eso, un pedido con novedad
  quedaría congelado para siempre.
- Cuenta como **en ruta** en `analisis-ventas.js` (no resuelto), y como venta real en PUBLICIDAD.

**⚠️ IMPORTANTE — el origen NO era n8n, era la landing.** n8n solo copia el campo `fecha` tal
cual al Sheet (`FECHA: {{ $json.fecha }}`), sin generar nada — el timestamp lo manda
`api/pedido.ts` en cada landing. **Arreglado y desplegado a producción el 2026-08-31** en los dos
repos (`projects/avanora` y `projects/truquito`, cada uno con su propio `vercel --prod`, ninguno
comparte deploy con KEPLER):

```ts
function fechaHoraEcuador(): string {
  const OFFSET_MS = 5 * 60 * 60 * 1000;
  return new Date(Date.now() - OFFSET_MS).toISOString().replace('Z', '-05:00');
}
```

Verificado con un pedido de prueba real (`TRQ-94976`, borrado después): la landing mandó
`2026-08-31T15:13:39.362-05:00` y n8n lo escribió al Sheet exactamente así — hora de Quito, offset
explícito. **n8n no necesitó ningún cambio.**

### La hoja RESUMEN se parchea con `patch-resumen.js`

`crear-sheet-pedidos.js` **crea un Sheet nuevo** — no sirve para actualizar el que está operando.
Para eso está `node projects/dropshipping/patch-resumen.js` (sin flags simula; con `--aplicar`
escribe). Reaplica `filasResumen()` + `formatosResumen()` sobre la hoja en uso, conservando el
filtro de tienda de B4. Correr después de agregar o renombrar cualquier ESTADO.

⚠️ **Dos trampas que costaron caro el 2026-08-31, las dos ya resueltas — no repetirlas:**

1. **El formato no viaja con el valor.** Al correr el contenido 2 filas hacia abajo, cada celda
   heredó el formato de la fila que ocupaba antes: "Despachados 54" se mostraba como `5400.0%`.
   Por eso `formatosResumen()` se aplica siempre junto con las filas, nunca solo los valores.
2. **Las fórmulas tenían letras de columna escritas a mano** (`N` = TOTAL COBRAR) de cuando se creó
   el Sheet. Después se le agregaron `PRODUCTO2`/`IDDROPI2`/`CANTIDAD2` y todo se corrió: `N` pasó a
   ser IDDROPI2, así que "Cobrado" sumaba **IDs de producto** ($678.696) y "Utilidad" sumaba el
   flete. Ahora las letras se resuelven **por título** con `letrasDesdeEncabezado()`, igual que
   hace `sheets-pedidos.js`. Hoy: `total=P · utilidad=T · fPago=Z`.

### Automatización activa — `META_ADS_TOKEN` resuelto (2026-09-01)

La hoja PUBLICIDAD **ya se actualiza sola cada 15 minutos**. LaunchAgent
`com.shotygames.publicidad-live` cargado en `~/Library/LaunchAgents/`, log en
`~/publicidad-live.log`. Verificado de punta a punta con `launchctl kickstart` → `Salida: 0`.

**El token:** system user **KEPLER**, app **DROPI WINNERS**, permiso `ads_read`, **no caduca**.
Lee las 2 cuentas y las 5 campañas mapeadas.

#### Corre en el SERVIDOR, no en la Mac (2026-09-01)

El cron vive en el proceso de EasyPanel que ya ejecuta los otros 12 (`index.js`), **no** en un
launchd local. Así se actualiza aunque la Mac esté apagada. Se puede mover porque
`publicidad-live.js` **no escribe nada en disco** — lee Meta + Sheets y escribe en Sheets. Es la
diferencia con `diario.js`, que sigue en la Mac a propósito (guarda un snapshot de ~18 MB que se
perdería en cada redeploy).

Verificado de punta a punta con el launchd de la Mac **descargado**: el servidor escribió solo en
el tick de las 21:00. Apagable con `PUBLICIDAD_EN_SERVIDOR=0`.

**`/health` ahora reporta el estado de cada cron** (`crons: { publicidad: { activo, motivo } }`).
Nació de este mismo problema: sin logs de EasyPanel a mano, "código viejo" y "falta la env var" se
ven idénticos desde afuera (no pasa nada). Ahora un `curl` los distingue.

#### 🐛 `date_preset=last_30d` EXCLUYE el día de hoy

**Lo cazó Fabián mirando la hoja**, no un test: el 1-sep marcaba $0 de gasto cuando Meta ya
reportaba $43.04. Verificado contra la API — con hoy = 2026-09-01, `last_30d` devolvía hasta el
**31-ago**.

Las actualizaciones manuales nunca lo mostraron porque siempre se hacían **dos** llamadas
(`last_30d` + `today`); el script automático solo hacía la primera. Consecuencia: la fila del día
en curso salía con gasto $0 → **CPA $0 y utilidad inflada, justo el día que más se mira**.

Arreglado usando `time_range={since,until}` explícito con `until = hoyEC()`. **Regla: para
cualquier rango que tenga que incluir el día en curso, no usar `date_preset`.**

#### ⚠️ Por qué costó tanto sacarlo — 3 capas distintas, no una

Generar el token falló varias veces con *"No hay permisos disponibles"*. La causa real solo
apareció al diagnosticar contra la Graph API en vez de adivinar en la interfaz. En Meta hay
**tres capas independientes**, y que falte cualquiera da errores que parecen el mismo:

| Capa | Qué es | Síntoma si falta |
|---|---|---|
| 1. Producto de la app | La app necesita **Marketing API** agregado en developers.facebook.com | *"No hay permisos disponibles"* al generar el token — la lista sale vacía |
| 2. Rol de app | El system user necesita acceso a la app (Business Settings → Aplicaciones → Personas) | Mismo mensaje que arriba |
| 3. Asignación de activos | El system user necesita **cada cuenta publicitaria** asignada | Token válido con `ads_read`, pero `(#200) Ad account owner has NOT grant ads_read permission` |

**El desvío que costó tiempo:** el `META_CAPI_TOKEN` que ya existía *parecía* servir — es SYSTEM_USER,
no caduca y tiene `ads_read` y `ads_management`. Pero pertenece al system user
**"Fabian Usuario Sistema"**, que vive en el business **ShotyGames** (`178092136536412`), y solo
tiene asignada "Cuenta Publicitaria 9". Avanora y Truquito son del business **Avanora**
(`2102150583288162`), otro portafolio. **Un token no se puede reusar entre businesses distintos.**
KEPLER sí es el system user del business correcto — por eso el token salió de ahí.

**Cómo diagnosticar esto rápido la próxima vez** (en vez de probar clics a ciegas):
```
GET /debug_token?input_token=X&access_token=X   → app, tipo, scopes, caducidad
GET /me?fields=id,name                           → qué system user es
GET /{system_user_id}/assigned_ad_accounts       → qué cuentas tiene asignadas ← la capa 3
GET /act_{id}?fields=name,business               → de qué business es cada cuenta
```
El mensaje `(#200) Ad account owner has NOT grant...` **no significa que falte el permiso**:
significa que falta la **asignación del activo**. Son cosas distintas.

### Dos columnas de utilidad, con % de devolución editable (2026-08-31)

A pedido de Fabián: **UTILIDAD SI SE ENTREGA TODO** y **UTILIDAD AJUSTADA (%DEV)**, esta última
recalculándose sola cuando cambia la celda **F2** (0–100%, con validación de rango).

**El modelo es el mismo de `calculadora.js`** (margen si se entrega vs. pérdida de flete si se
devuelve), pero con costo/flete REALES de cada pedido — no los defaults genéricos — y separando
lo que ya se sabe de lo que todavía no:

- Pedidos **ENTREGADO/PAGADO** → resultado conocido, cuenta su margen real. No se toca aunque
  F2 cambie: no tiene sentido "ajustar" un hecho.
- Pedidos **DEVUELTO** (o CANCELADO con guía) → resultado conocido, cuenta su pérdida real
  (el flete de ida, ya gastado). Tampoco se mueve con F2.
- Pedidos todavía en tránsito (**EN_DROPI/GUIA_GENERADA/NOVEDAD**) → resultado desconocido. Acá
  es donde entran las dos columnas:
  - *Si se entrega todo* asume que el 100% de lo pendiente entrega.
  - *Ajustada* reparte lo pendiente según F2: `(1-F2)` entrega, `F2` se devuelve y solo pierde
    el flete.

Fórmula exacta: `utilidad = margenEntregados − pérdidaDevueltos + [(1-F2)×margenPendientes −
F2×fletePendientes] − gastoReal`. Con F2=0% las dos columnas coinciden exactamente (verificado);
con F2=100% la ajustada cae a lo más negativo posible.

**El flete usa el real de la columna FLETE del Sheet cuando ya existe** (se llena al generar la
guía); antes de eso cae al default verificado de `calculadora.js` ($6.38) — es la mejor
estimación disponible, no un invento.

⚠️ **Bug propio detectado y corregido en la misma sesión:** al insertar el grupo de columnas
nuevas en el bloque oculto del QUERY, todo se corrió una posición y la fórmula del **ROAS REAL
total** quedó apuntando a la columna vieja (sumaba VENTAS en vez de INGRESO — daba 0.13x en vez
de 3.78x). Se cazó comparando contra el número de la sesión anterior, no leyendo el código. Ver
[[feedback_letras_de_columna_hardcodeadas]] — es el mismo tipo de error, ahora en fórmulas de
Sheets en lugar de en JS.

### PUBLICIDAD — Inositol fuera, Reparador de Esmalte Dental adentro (2026-08-31)

Fabián decidió no testear Inositol (110735) — sale del mapeo de `campanas.js`. Su campaña
(`120251998583790787`) ya no aparece ni siquiera al listar campañas de la cuenta, probablemente
archivada.

**Reparador de Esmalte Dental / Tooth Armor (155190) entra con campaña real, verificada en Meta el
mismo día:** `120252312991320787` — "TOOTH ARMOR | TEST VIDEOS | ABO | 31-08", ACTIVE, lanzada
hoy. Gastó $21.25 el primer día.

⚠️ **Ejercitador Pélvico pasó a PAUSED** entre la sesión anterior y esta (Fabián no avisó, se
detectó consultando Meta en vivo). Se dejó igual en `campanas.js` — una campaña pausada
simplemente no suma gasto nuevo, no hace falta sacarla del mapeo. Si la reactiva, sigue funcionando
sin tocar nada.

### Zona horaria: todo va en hora de Ecuador (2026-08-31)

**El bug:** todo se guardaba con `new Date().toISOString()`, que es **UTC**. Ecuador es UTC-5, así
que a las 20:42 del 30 de agosto en Quito ya son las 01:42 UTC del 31 — y el pedido quedaba
registrado como del 31. **Todo lo que entraba después de las 19:00 se contaba al día siguiente.**

Lo reportó Fabián y se midió: **31 de 120 pedidos (26%) estaban en el día equivocado.** No era
cosmético — corría las ventas de la noche al día siguiente, así que el CPA y el ROAS de cada día
salían mal en los dos sentidos (un día perdía ventas que sí generó, el siguiente se las quedaba).
Ejemplo: el 23-ago tenía 5 ventas y CPA $6.61; en realidad eran **8 ventas y CPA $4.13**.

**El arreglo** vive en `fechas.js` (raíz del repo, junto a `sheets.js`):

| Función | Para qué |
|---|---|
| `ahoraEC()` | Timestamp para **escribir**: `2026-08-30T20:42:50.764-05:00`, con el offset explícito para que nunca más haya que adivinar la zona |
| `aFechaLocal(v)` | Cualquier fecha del Sheet → `YYYY-MM-DD` del día que fue **en Ecuador** |
| `hoyEC()` | Hoy en Ecuador |

`aFechaLocal()` aguanta los cuatro formatos que hoy conviven en las hojas: instante UTC con `Z`
(lo viejo, y lo que **sigue escribiendo n8n**), instante con offset `-05:00` (lo nuevo), ISO sin
zona (se asume local) y `dd/mm/yyyy` o serial de Sheets (fechas sin hora, no hay nada que
convertir — así el Sheet de Shotygames sigue leyéndose igual).

Aplicado en: `sheets-pedidos.js` y `claude-dropshipping.js` (escriben), `publicidad-live.js` y
`scripts/analisis-ventas.js` (leen).

⚠️ **n8n sigue escribiendo UTC** — eso no se toca desde este repo. No hace falta para que los
números salgan bien, porque la corrección está del lado de la LECTURA y funciona igual con los
datos viejos. Pero si Fabián quiere que el Sheet **muestre** la hora local, hay que cambiarlo
también en n8n.

**Cómo está armada la hoja PUBLICIDAD** (rediseñada 2026-08-31 a pedido de Fabián: la primera
versión, por campaña y con 16 columnas, era confusa):

- **9 columnas:** FECHA · GASTO · GASTO REAL (+20%) · VENTAS REALES · ENTREGADOS · DEVUELTOS ·
  % DEVOLUCIONES · CPA REAL · ROAS REAL.
- **Qué cuenta como DEVUELTO.** DROPI **sí** marca devoluciones, con el texto que use cada
  transportadora (`DEVUELTO`, `DEVOLUCION`, `DEVUELTO AL REMITENTE`, `RETORNADO`…). Al 2026-08-31
  todavía **no se generó ninguna**, por eso no aparecen en el barrido de las 91 órdenes de la
  cuenta — no porque el estado no exista (ese error se cometió y lo corrigió Fabián).
  - `sincronizar_guias` las traduce al estado `DEVUELTO` del Sheet
    (`clasificarDevolucion()` en `claude-dropshipping.js`).
  - Respaldo para lo viejo: un `CANCELADO` **que ya tenía guía** también cuenta como devolución.
    Un `CANCELADO` sin guía nunca se despachó — no es venta ni devolución.
- **ENTREGADOS = `ENTREGADO` + `PAGADO`**, y **% DEVOLUCIONES = devueltos / (entregados + devueltos)**
  — sobre lo ya resuelto, no sobre el total: los pedidos en tránsito todavía no votaron. Por eso
  en los días recientes ENTREGADOS sale 0 y el % sale vacío: la entrega tarda días. **Esa columna
  solo dice algo en las filas viejas.**
- **Orden ASCENDENTE**: el día más nuevo se agrega abajo. Arriba queda fija la fila TOTAL PERÍODO.
- **Dos filtros, los dos por fórmula** (`QUERY` sobre la hoja oculta) — **responden al instante**,
  no hay que esperar al cron:
  - **B2 — Producto:** `TODOS` + cada producto.
  - **D2 — Ver por:** `DÍA` / `SEMANA` / `MES`. La semana es **lunes-domingo** (misma regla que
    `analisis-ventas.js`, ver `feedback_metricas_reales_ads` en memoria). Las columnas de
    agrupación (`SEMANA`, `MES`) las precalcula `publicidad-live.js` en `PUBLICIDAD_DATOS`;
    la celda oculta `H2` traduce el dropdown a la letra de columna que usa el `QUERY`.
  - Ojo: CPA y ROAS se **recalculan** sobre el total agrupado, nunca se promedian los diarios.
- **Campañas unificadas por producto.** No hay fila por campaña: si un producto tiene 2 campañas
  activas se suma el gasto. Además de ser lo pedido, es lo único honesto — el Sheet de pedidos no
  guarda de qué campaña vino cada pedido, así que repartir el CPA entre campañas sería inventado.
- `PUBLICIDAD_DATOS` es una hoja **oculta** con los datos crudos; no se mira ni se edita a mano.

---

## Dashboard web — "DROPI Winners" (2026-08-29)

Clon liviano de DropKiller/DropData sobre datos reales de DROPI EC. Repo aparte
`projects/dropi-dashboard/` (Next.js, gitignorado en KEPLER, mismo criterio que
`avanora`/`truquito`). Lee de solo lectura lo que `publicar.js` sube a Supabase — toda la
lógica de negocio se queda en JS corriendo en la Mac, el dashboard no recalcula nada.

- Tablas Avanora / Truquito / Nuevos ganadores / Producto del mes / Consistencia completa.
- Click en un producto abre el gráfico de stock en el tiempo (Recharts, datos reales).
- Login simple por password (`APP_PASSWORD`) — expone costo y stock del proveedor.
- Fuera de esta fase, documentado en el plan: cruce con Meta Ads Library (fase 2),
  multi-país (bloqueado por credenciales — `catalogo.js` solo tiene login de DROPI EC),
  y automatizar el lanzamiento completo (landing + campaña) con un botón (fase 3, a
  futuro — requiere primero convertir la skill `investigacion-producto` en pasos
  invocables por código, no solo instrucciones para que un agente las siga).

**Deployado 2026-08-29:** https://dropi-dashboard-sepia.vercel.app (Vercel, cuenta
`contacto-5987`, proyecto `fabian-pizarro-s-projects/dropi-dashboard`). Password en el
gestor de Fabián / env vars de Vercel, no acá.

**Disparador diario armado:** `scripts/dropi-diario.sh` + `~/Library/LaunchAgents/com.shotygames.dropi-diario.plist`,
mismo patrón que `dropi-refresh.sh`. Corre `diario.js` todos los días a las 5 AM — snapshot,
ranking, Telegram y publicación del dashboard, todo en un solo paso.

**2026-08-29 (tarde) — decisión de Fabián:** Truquito deja de ocultar productos con riesgo
Meta (antes era un filtro duro, ver `candidatos-tienda.js`). Se siguen mostrando con la
etiqueta ⚠ — la decisión de testear ahí es suya, informada. Se agregó también: imagen real
del producto (`catalogo.js` → `resumir()` + `publicar.js` enriquece los ids viejos que no la
tenían buscando por id como texto, porque `GET /products/{id}` está bloqueado para la cuenta
dropshipper), proveedor visible en la tabla, y un modal por producto con selector de período
(7/14/30/60/90 días), total/promedio/máximo/días activos, gráfico ventas-o-stock, y detalle
diario — todo calculado en vivo desde `dropi_historial` en Supabase (`/api/producto/[id]`).

**2026-08-30 — bug real encontrado y arreglado:** el cliente de DROPI (`dropi.js` →
`makeClient`) no tenía `timeout`. Una conexión colgada (sin error, sin respuesta) hacía que
el proceso esperara para siempre — la corrida de las 5 AM del 30-ago quedó viva **6+ horas**
sin terminar. Se agregó `timeout: 30000` al cliente axios (afecta a todo lo que lo usa, no
solo el dashboard) y a los dos `axios.post` sueltos del login en `catalogo.js`. Se corrigió
además que `diario.js` re-subía el backfill COMPLETO de historial todos los días en vez de
solo el snapshot del día — trabajo redundante que además abría más superficie de fallo. Y se
le agregó reintento con espera creciente a `subirLote()` en `publicar.js` para que un `fetch
failed` transitorio de red no corte la subida a mitad de camino.

**2026-08-30 (tarde) — análisis de ads por producto: intentado y revertido.** Se armó una
sección en el modal (término de búsqueda editable, resultados EC/CO/MX, anunciantes únicos,
días activo, link al anuncio) que llamaba a la Ad Library de Meta vía Graph API con un token
de usuario. **No funciona:** Meta exige verificación de identidad (subir cédula/pasaporte,
vinculada a un Business Portfolio) para que cualquier app pueda consultar la Ad Library API,
sin importar el tipo de anuncio — confirmado con un token real, error
`OAuthException subcode 2332002`. No es un permiso que se activa solo.

**Decisión de Fabián:** no hacer el trámite de verificación. La sección se sacó del dashboard
(código revertido, no queda a medias mostrando un error permanente). **El análisis de ads se
pide por chat** — Claude ya tiene acceso a la Ad Library a través de la herramienta de Meta
Ads conectada (probado con "Drenaje Linfático" en Ecuador: 1.378 anuncios activos, anunciante,
texto del anuncio, tiempo activo, link al anuncio). Pedir "analizame los ads de X producto"
en la conversación en vez de esperarlo en la web.

**No expone sitio web / landing page del anunciante** — la Ad Library no da ese dato para
anuncios comerciales normales (solo para político/de interés público), ni por chat ni por
API. No inventar esa columna si se pide "toda la info" — no está disponible, punto.

---

## Correcciones del 2026-08-14

Una revisión externa encontró tres errores. Los tres eran reales y están arreglados y desplegados:

1. **La proporción "40:1" del Inositol estaba mal.** 4.000 mg de Myo entre 50 de D-Chiro dan
   80:1; el 40:1 es del formato en cápsulas. Se quitó el ratio y quedaron las cantidades.
2. **Había copy del drenaje escrito a mano en la estructura clásica** ("Fórmula botánica:
   extractos líquidos de plantas", "Estas gotas") y salía en el Inositol, que es polvo. Ahora
   viene del producto: `ingredientesIntro` y `comparativa.nuestro`.
3. **En móvil el hero apilaba la foto antes del titular**, y la estructura visual no tenía H1 ni
   CTA sobre el pliegue. Corregido con `order-*` / `md:order-*` y una barra de entrada.

Se dejaron a propósito, por decisión de Fabián: la etiqueta "Compra verificada" en las reseñas,
la calificación promedio, el sello "Más pedido" y el pie de página sin RUC ni políticas.

**Queda abierto:** la revisión señaló que ARCSA (el regulador ecuatoriano) prohíbe atribuirle a
un suplemento propiedades de tratamiento. Eso es distinto de una política de Meta — es ley local,
y que la competencia lo haga no protege. Se le planteó y es su decisión.

---

## Método de trabajo

**Está en la skill `.claude/skills/investigacion-producto/SKILL.md` y es obligatorio.** No es
opcional ni se improvisa. Cuatro fases: barrido total de la biblioteca de anuncios por
`page_ids` → destripar las landings de la competencia con navegador → armar 3 landings
distintas → verificar.

Las dos reglas que mandan sobre todo lo demás:

1. **"No se puede" hay que ganárselo.** Un intento fallido no es un límite. Reintentar y
   cambiar de herramienta (curl → navegador → API → DOM) antes de informar nada.
2. **No se avisa hasta que esté terminado.** Nada de entregar para que Fabián diga qué falta.

---

## Pendientes

**Bloqueantes de verdad**

- [x] ~~Generar `META_ADS_TOKEN`~~ — **HECHO 2026-09-01.** La hoja PUBLICIDAD ya se actualiza
      sola cada 15 min (ver "Automatización" más abajo)
- [ ] Eliminar a mano el anuncio rechazado `120251998682700787`

**Corregido 2026-08-30:** esta sección decía "nadie ha activado ninguna campaña todavía" y que la
tasa de entrega del 70% seguía siendo un supuesto. **Ya no es cierto** — verificado en vivo contra
Meta: la campaña del Drenaje (`120251984830830787`) está **ACTIVE** y gastando ($24.11 el
2026-08-30, CPA real $14.47 — casi el doble del CPA máximo $7.59 de la tabla de arriba, con
muestra chica de 2 pedidos). Confirmar con Fabián si la activó a propósito sabiendo que el
producto 168103 estaba en stock 0 al 27-ago, y si la tasa de entrega real ya se puede medir con
pedidos propios en vez del supuesto.

**Importantes**

- [ ] Las reseñas del Inositol son reales pero de femyverse.com, **sin ciudad**. No hay reseñas
      ecuatorianas públicas porque todos venden por WhatsApp. Reemplazar en cuanto haya
      clientas propias
- [ ] Fotos propias del producto llegando a Machala — valen más que cualquier render
- [ ] Falta medir el flete de un combo de 3 unidades (con 1 ya se sabe que no escala por peso)
- [ ] Fabián tiene que comprar el dominio (hoy la web vive en `avanora.vercel.app`)
- [ ] Revisar las 8 cuentas publicitarias de ShotyGames en UNSETTLED (saldo impago)

**Consejo que se le dio y conviene respetar:** con ~$100 de caja, **no encender las dos
campañas a la vez**. Dos campañas de $10/día se van en cinco días sin que ninguna llegue a
decir nada. Primero el Inositol (mejor margen, competencia más débil, nadie con landing web),
medir el CPA, y recién ahí la segunda.
