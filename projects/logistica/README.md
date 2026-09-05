# Logística — Truquito, Avanora y ShotyGames

La cola de trabajo de los pedidos que están **en la calle ahora mismo**, de los tres
negocios en una sola pantalla. Une los Sheets de pedidos con el tracking real de DROPI y
funciona igual en el teléfono y en la computadora.

---

## Los tres negocios

| Tienda | Sheet | Cuenta de DROPI | Rol de Fabián |
|---|---|---|---|
| Truquito | `SHEETS_ID_DROPSHIPPING` | `DROPI2_*` (dropshipper) | compra a otro proveedor |
| Avanora | el mismo, columna `TIENDA` | `DROPI2_*` | compra a otro proveedor |
| ShotyGames | `SHEETS_ID_SHOTYGAMES` | `DROPI_*` | **es** el proveedor |

Todo lo que difiere entre ellos (columnas, locale, literales de estado, cuenta de DROPI)
se resuelve en `src/lib/negocios.ts` y los adaptadores de Sheet. De ahí para arriba los
tres son iguales: la interfaz solo ve pedidos con una `tienda`.

### Esta app reemplazó a la sección de `adm.shotygames.com`

`finanzas-app` tenía su propia `/logistica` sobre el mismo Sheet. Se **borró** el
2026-09-03 (carpetas `src/app/(dashboard)/logistica`, `src/app/api/logistica` y
`src/lib/dropi.ts`, más las dos entradas del menú en `AppShell.tsx`) porque tener dos
lugares donde tocar el mismo pedido es una forma de pisarse solo. Esta es la única.

Lo que quedó compartido son las columnas del Sheet: `LOG`, `LOG WA` y `NOTA LOGISTICA`
las escribe ahora esta app; `finanzas-app` solo las lee.

---

## Qué muestra y qué no

Solo lo que está en movimiento. Los estados de cada Sheet se traducen a **fases**, que es
lo que la app entiende:

**Los estados NO están escritos en el código**: se leen del propio Sheet en cada carga
(`src/lib/estados.ts`) — de `DATOS!C2:C19` en ShotyGames y de la validación de datos de la
columna ESTADO en dropshipping. Lo único fijo son las **fases**, a las que cada literal
cae por patrón:

### Qué estados se ofrecen como botón

No todos. Lo que llega a esta cola **ya está confirmado y despachado**, así que mandarlo
de vuelta a un estado previo no tiene sentido y solo da lugar a equivocarse de botón
(`NO_OFRECIBLES` en `estados.ts`):

| Negocio | Botones | Ocultos |
|---|---|---|
| Truquito / Avanora | `NOVEDAD`, `ENTREGADO`, `PAGADO`, `DEVUELTO` | `PENDIENTE_CONFIRMACION`, `EN_DROPI`, `GUIA_GENERADA`, `CANCELADO` |
| ShotyGames | `NOVEDAD`, `DEVOLUCION`, `ENTREGADO`, `PAGADO` | `PENDIENTE`, `ENVIADO`, `CANCELADO` |

Los ocultos **siguen siendo válidos**: pintan la fase y el color, y el botón de
"DROPI ya lo tiene como X" puede escribirlos igual — ese no inventa nada, sincroniza lo
que DROPI ya reporta.

| Fase | ¿Entra a la cola? | Dropshipping | ShotyGames |
|---|---|---|---|
| Preparando | **no** | — | `PENDIENTE` |
| Sin despachar | sí | `EN_DROPI` | — |
| En camino | sí | `GUIA_GENERADA` | `ENVIADO` |
| Novedad | sí | `NOVEDAD` | `NOVEDAD` |
| Devuelto | **no** | `DEVUELTO` | `DEVOLUCION` |
| Cerrado | no | `PENDIENTE_CONFIRMACION`, `ENTREGADO`, `PAGADO`, `CANCELADO` | `ENTREGADO`, `PAGADO`, `CANCELADO` |

Tres cosas que no son obvias:

- **`PENDIENTE` en ShotyGames es "lo estoy preparando", no "ya salió".** El pedido está
  armado pero todavía **no se entregó a la transportadora**. Que tenga guía y orden de
  DROPI despista —la guía se genera antes de despachar—, pero no es trabajo de logística
  todavía: aparece en la cola recién al pasar a `ENVIADO`.
  Por eso tampoco se le sugiere ningún cambio de estado aunque DROPI ya lo vea viajando.
- **Las devoluciones no se muestran.** Fabián las sacó de la vista el 2026-09-03. Si las
  quiere de vuelta, se saca `'devuelto'` de `FUERA_DE_LA_COLA` en `logica.ts`.
- **`AVISAR`, `NOTIFICADO` y `VERIFICAR` están dados de baja** (2026-09-03) pero **siguen
  en la hoja DATOS de ShotyGames**. Se filtran en `RETIRADOS` (`estados.ts`); si algún día
  se borran del Sheet, esa lista puede quedar vacía y no cambia nada.

⚠️ **La validación de dropshipping está desactualizada**: no incluye `NOVEDAD` y hay
pedidos en ese estado. Por eso la lista final es la UNIÓN de lo que ofrece el desplegable
y lo que de verdad está en uso — si no, un estado real se quedaría sin botón.

Un estado que no esté en la lista se trata como trabajo pendiente, no se esconde:
es preferible que sobre un pedido en la cola a que falte.

---

## De dónde sale cada dato

| Dato | Fuente |
|---|---|
| Pedido, cliente, producto, plata | Hoja `PEDIDOS` del Sheet de cada negocio |
| Estado del envío, guía, transportadora | `GET /orders/myorders/{id}` de DROPI |
| **Recorrido paso a paso** | **Servientrega directo** (`src/lib/servientrega.ts`), con DROPI de respaldo |
| Ciudad de destino | Servientrega — manda sobre la del Sheet |
| Historial del cliente | `client_total_orders*` de DROPI — cuántas veces devolvió antes |

### Por qué el recorrido NO sale de DROPI

DROPI **no se atrasa** —comparadas 18 guías, las marcas de tiempo coinciden al minuto—
pero **recorta el nombre del movimiento**:

| Servientrega | DROPI |
|---|---|
| `Ingresando en Agencia QUITO_CONDADO` | `INGRESANDO EN AGENCIA` + `nom_conc: "cs condando"` |
| `Ingresando a CL SANTO DOMINGO` | `INGRESANDO A` |

Esa poda tenía dos costos medibles:

- El aviso de "llegó a tu ciudad" se disparaba en **1 de 49** pedidos. Con la fuente
  buena: **29 de 49**. La señal siempre estuvo, DROPI se la comía.
- La agencia había que adivinarla desde un campo escrito a mano. Ahora llega en el mismo
  formato que el directorio (`GUAYAQUIL_CITY MALL`), sin adivinar.

Cubre el **98%** de los pedidos (48 de 49 van por Servientrega). Para GINTRACOM y LAAR se
sigue usando lo de DROPI, que ahí es la única fuente. Es una página pública, sin login: si
Servientrega la rediseña, el parser devuelve null y la app **cae sola a DROPI** en vez de
romperse. `tracking.fuente` dice de dónde salió cada recorrido.

### Reglas que no se pueden romper

- **Las columnas se resuelven por título, nunca por letra.** Ya pasó dos veces que agregar
  o borrar una columna corriera todos los índices (2026-08-12 y 2026-08-31). Ver
  `src/lib/sheet.ts`.
- **DROPI quiere `x-authorization`, nunca `authorization`**, y los `sec-fetch-*` en el
  login. Todo el detalle está comentado en `src/lib/dropi.ts` y viene de
  `KEPLER/projects/dropshipping/API-DROPI.md`.
- **Las fechas son de Ecuador (UTC-5).** Con UTC crudo, todo lo posterior a las 19:00 cae
  al día siguiente. Ver `src/lib/fechas.ts`.
- **`status`, no `estatus`.** En las órdenes de GINTRACOM el campo `estatus` queda
  congelado en "EN BODEGA ORIGEN" incluso ya entregadas.
- **PAGADO nunca se deduce del envío.** Sale de que la plata haya caído en la wallet, no
  de que el paquete llegue.
- **El Sheet de ShotyGames usa coma decimal** (`$29,99`, locale es_ES) y el de
  dropshipping punto (`34.99`, en_US). Los montos se parsean con `aNumero` de
  `src/lib/numeros.ts`; un parser que borre las comas convierte `$29,99` en 2999.
- **La columna ID de ShotyGames vale `"1"` en las 618 filas.** No identifica nada: la
  clave para confirmar una fila antes de escribirla es NOMBRE + TELÉFONO.
- **Cada negocio escribe sus propios literales de estado.** Poner `DEVUELTO` en el Sheet
  de ShotyGames —que usa `DEVOLUCION`— deja la celda fuera del desplegable de la hoja
  DATOS y los filtros del Sheet dejan de verla.

---

### Cuándo la app sugiere cambiar un estado

Solo cuando DROPI y el Sheet están en **fases distintas** — nunca por un literal distinto
dentro de la misma fase. Y con dos frenos:

- **Un pedido en `preparando` no se toca.** La guía se genera antes de despachar, así que
  DROPI lo ve "en camino" desde el día uno.
- **Una novedad no se cierra sola.** Solo se sugiere salir de NOVEDAD hacia entregado o
  devuelto; volver a "en camino" nunca. Caso real: un pedido en NOVEDAD por "DEVOLUCION
  DE DISTRIBUCION" terminó "PARA RETIRO EN AGENCIA" y la app sugería marcarlo ENVIADO —
  sacándolo del filtro de Novedades, que es justo donde se busca el trabajo.

**"PARA RETIRO EN AGENCIA" es un aviso, no un cambio de estado**, y tiene su propio filtro
("En agencia") porque es un corte transversal: un paquete parado en agencia puede estar en
cualquier estado del Sheet. El paquete está parado
esperando al cliente y si no va se devuelve, así que hay que verlo; pero de 14 casos
reales solo 1 decía en la dirección que el retiro era intencional y 4 habían llegado ahí
por una novedad — los otros 9 no se podían distinguir. Marcarlos NOVEDAD en el Sheet
habría sido inventar un dato.

### Cómo pagó el cliente (solo ShotyGames)

No hay columna en el Sheet: se deriva del par ANTICIPO / SALDO con la misma regla que
`src/lib/cod.ts` de finanzas-app — si se cambia una, cambiar la otra.

| Badge | Cuándo | Qué significa para la entrega |
|---|---|---|
| **Pagado** (verde) | anticipo > 0, saldo = 0 | ya está cobrado; si no lo recibe solo se pierde el flete |
| **Mixto** (ámbar) | anticipo > 0, saldo > 0 | adelantó una parte (los $5 de siempre), el resto al recibir |
| **Contraentrega** (azul) | anticipo = 0, saldo > 0 | se cobra todo al entregar — acá está el riesgo real |

En Truquito y Avanora **no se muestra**: ahí todo es contraentrega y el badge sería ruido.

En un pedido anticipado la tarjeta muestra lo que valió el pedido, no el `$0.00` que va a
cobrar el repartidor.

## Lo que se puede hacer desde la app

- Cambiar el estado de un pedido (escribe en el Sheet y sella la fecha que corresponda).
- Guardar una nota de gestión — **se ve en la lista**, no hay que abrir el pedido.
- Aplicar de un toque el estado que DROPI ya tiene, cuando difiere del Sheet.
- Elegir una **plantilla de WhatsApp** y abrir el chat con el mensaje escrito.
- Abrir el rastreo de la transportadora y el PDF de la guía.

### Los disparadores de ShotyGames siguen andando

Pasar un pedido de ShotyGames a `ENTREGADO` o `PAGADO` manda el **WhatsApp de
agradecimiento**, exactamente como lo hacía `adm.shotygames.com`:
`src/lib/whatsapp-shotygames.ts` es un puerto literal de su `/api/whatsapp` — mismo texto,
misma instancia de Evolution (`shotygames`) y **mismo candado**: si la columna `LOG` ya
dice "agradecimiento enviado", no se vuelve a mandar.

El disparador corre DESPUÉS de escribir el estado y nunca tira: si el WhatsApp falla, el
estado ya quedó guardado y la app lo dice en pantalla en vez de deshacer nada.

`WHATSAPP_SIMULAR=1` en `.env.local` escribe el mensaje en la consola en vez de mandarlo.
**No está en Vercel**: en producción el envío es real.

### Plantillas de WhatsApp

Cinco situaciones + el chat en blanco (`src/lib/plantillas.ts`). La app sugiere la que
encaja con el tracking real, pero abre el chat y **nada se manda solo**.

La plantilla sale del **momento del paquete** (`src/lib/momento.ts`), no de buscar
palabras sueltas en el historial:

| Momento | Plantilla |
|---|---|
| `en-agencia` — "Ingresando en Agencia X" | Está en agencia |
| `hacia-agencia` — "En Distribucion para Entrega en Agencia" | ¿Te contactaron? |
| `en-reparto` — "En Distribucion a Cliente" | Salió a entrega |
| `en-ciudad` — **llegó** a su ciudad y **sin historia previa** | Llegó a tu ciudad |
| `en-gestion` — volvió al acopio después de un intento fallido | ¿Te contactaron? |
| `novedad` — "Devolucion de Distribucion…", "NO HAY QUIEN RECIBA"… | Intentaron entregar |
| `en-transito` · `sin-datos` | ¿Te contactaron? |

El **badge grande de la tarjeta es el momento del paquete**, no el estado del Sheet: el
Sheet se actualiza a mano y queda viejo. Un pedido que dice "Guía generada" pero lleva tres
días en una agencia tiene que gritar "En agencia". El estado del Sheet queda en la línea de
detalle (`· Sheet: Guia generada`).

### Cómo se aprendió el vocabulario

`scripts/analizar-movimientos.js` baja historiales completos de Servientrega y saca dos
cosas: qué movimientos existen y **qué sigue a cuál**. Sobre 239 historiales aparecieron
**64 movimientos distintos**. Lo que enseñó:

| Movimiento | Veces | Qué suele seguir |
|---|---|---|
| `EN DISTRIBUCION A CLIENTE` | 180 | 41% entregado |
| `INGRESANDO EN AGENCIA <X>` | 105 | 52% entregado en agencia |
| `EN DISTRIBUCION PARA ENTREGA EN AGENCIA` | 53 | 84% llega a la agencia |
| `INGRESANDO A CL <X>` | 35 | 52% sale a distribución |
| `DEVOLUCION AL REMITENTE` | 17 | 88% es el final |
| `DEVUELTO DE CS <X>` | 15 | 67% lo recolectan: arrancó la vuelta |
| `NOVEDAD EN CS` | 14 | 46% termina devuelto, 31% entregado ahí |

Esa matriz vive en `src/lib/transiciones.json` y alimenta la línea **"Lo más probable
ahora: …"** del panel. No es una regla escrita a mano: si Servientrega cambia, se vuelve a
correr el script y la tabla se actualiza sola.

### Tres distinciones que costaron un bug cada una

1. **`hacia-agencia` no es `en-agencia`.** "En Distribucion para Entrega en Agencia" es que
   va camino; "Ingresando en Agencia X" es que llegó. Decirle "pasá a retirarlo" antes de
   que llegue lo hace viajar al pedo.

2. **El reparto se escribe "En Distribucion a Cliente"**, no con el nombre de la ciudad.
   Exigir la ciudad hacía que NUNCA se detectara la salida a entrega — daba 0 siempre.

3. **"En Ruta a CL GUAYAQUIL" es que va en camino, no que llegó.** Llegar es "Ingresando
   (Operativo) a CL X". Sin esa distinción se le avisaba al cliente que su paquete ya
   estaba en su ciudad mientras el camión seguía en la carretera: 3 de 4 candidatos.

4. **Un tránsito puede ser la VUELTA.** EDUARDO GAIBOR mostraba "En Ruta a CL MACHALA"
   —su ciudad de ORIGEN— porque el paquete se devuelve después de un "Devuelto de CS
   BUCAY". La devolución es "pegajosa": una vez que aparece en el historial, todo lo que
   sigue es parte de la vuelta.

5. **"Novedad en CS" es una novedad EN LA AGENCIA**, o sea que el paquete está ahí. Va
   como `en-agencia` y no como novedad genérica: lo accionable es avisarle al cliente que
   pase a retirarlo antes de que se devuelva (46% de esos terminan devueltos).

6. **Servientrega registra movimientos FUERA DE ORDEN.** LEANDRO (Babahoyo) entró a la
   agencia a las 09:41 y a las 11:13 registró "En Distribucion para Entrega en Agencia",
   que lógicamente va antes — al cliente ya le habían dicho que su paquete estaba allá.
   Por eso `momentoDelPaquete` no se queda con el último por fecha: si en algún momento
   entró a la agencia y **nada posterior lo sacó de ahí**, está en la agencia.

### Y el historial, no solo el último movimiento

Caso real (JOSE ANDRES, Guayaquil): el último movimiento decía "Ingresando a CL GUAYAQUIL"
y quedaba como "recién llegó a tu ciudad". El historial contaba otra cosa — había llegado
**8 días antes**, le fallaron **dos** entregas, pasó por confirmación y **el propio cliente
ya había pedido retirar en agencia**. Por eso `momentoDelPaquete` mira todos los
movimientos: si antes hubo intento, novedad, confirmación o pedido de retiro, el momento es
`en-gestion` y no se afirma nada — se pregunta.

Distribución real al 2026-09-04 (49 pedidos): 19 en tránsito · 11 en agencia · 8 en gestión
· 6 con novedad · 3 sin movimientos · 1 camino a la agencia · 1 entregado · **1 llegó a su
ciudad**.

**Sin emoji, a propósito.** Los que están fuera del BMP llegan como "�" en `wa.me` en
varios teléfonos (confirmado con captura real el 2026-08-26). Estas plantillas se abren
justamente por `wa.me`.

#### "Está en agencia" distingue cuatro situaciones

Porque no son lo mismo para el cliente:

1. **Nunca hubo intento de entrega** (no existe `EN DISTRIBUCION A CLIENTE` en el
   historial) → *"tu pedido ya llegó a la agencia"*, **sin** mencionar entregas fallidas.
   Lo decide el TRACKING, no la dirección: LUIS (Playas) fue derecho de recolección a la
   agencia, y su dirección —"Servi entrega diagonal a TÍA"— no matcheaba ningún patrón de
   retiro. Decirle "intentaron entregarte" era falso.
2. **El tracking dice `CLIENTE SOLICITA RETIRAR EN CS`** → *"intentaron entregarte y no fue
   posible; tal como solicitaste, quedó en la agencia"*.
3. **Hubo intento y falló** → *"intentaron entregarte y no fue posible, así que lo dejaron
   en agencia"*.
4. **Todavía no está confirmado en la agencia** (cualquier momento que no sea
   `en-agencia`) → *"va en camino a una agencia… apenas llegue te avisamos"*. Se afirma que
   llegó **solo** cuando el tracking lo confirma, incluso si Fabián elige esta plantilla a
   mano en un pedido que sigue viajando.

En los tres casos va la **dirección exacta de la agencia**, su horario y su teléfono, más
el número de guía y el PDF. Y **no se ofrece reprogramar a domicilio**: una vez que
Servientrega deja el paquete en agencia ya no vuelve a salir a reparto.

**Cuarto caso: todavía va en camino.** Si el momento es `hacia-agencia` el texto cambia a
"va en camino a una agencia… apenas llegue te avisamos" y **no** dice que pase a retirarlo:
llegaría a una agencia donde el paquete no está.

La ciudad para buscar la agencia sale del **nombre de la propia sucursal**
(`PLAYAS_AV. 15 DE AGOSTO` → PLAYAS) antes que del Sheet, que las escribe a mano. Con eso
resuelven **13 de 13** de los pedidos en agencia; antes fallaba PLAYAS.

#### El directorio de agencias

844 agencias en 242 ciudades, bajadas del Centro de Soluciones del sitio oficial con
`scripts/bajar-agencias.js` y guardadas en `src/lib/agencias.json`. Se commitean: cambian
pocas veces al año y así la app no depende de que el sitio de Servientrega esté arriba.

El nombre que da DROPI viene sucio ("cs condando" por CONDADO), así que el emparejado
tolera un typo — pero **solo devuelve algo si está seguro** (acota por ciudad y exige que
la mejor candidata sea única). Si no, manda solo el nombre de la agencia: una dirección
equivocada hace que el cliente viaje al otro lado de la ciudad.

#### "Llegó a tu ciudad" y la trampa del centro logístico

El tracking dice cosas como *"En Ruta a Centro Logistico CL GUAYAQUIL"* para un pedido que
va a **BUCAY** — Guayaquil es el acopio por el que pasa, no el destino. Por eso
`llegoALaCiudad()` exige que el movimiento nombre **la ciudad del pedido**; si no, el aviso
no sale. Prefiere quedarse corto a decirle al cliente algo falso.

Cuál se mandó queda registrado en la columna `LOG WA` (formato `id|fecha ; id|fecha`, el
mismo de antes). **Solo en ShotyGames**: el Sheet de dropshipping no tiene esa columna y
agregarla toca su encabezado, que no se hace sin preguntar.

Toda escritura pasa por `POST /api/pedidos/actualizar`, que antes de escribir relee la
fila y compara el `ID PEDIDO`: si la fila se movió, responde 409 en vez de cambiarle el
estado a otro pedido.

---

## Rendimiento

Consultar las ~50 órdenes en movimiento tarda unos 15 segundos, así que el tracking se
cachea 10 minutos en la **Data Cache de Next** (`unstable_cache`). Con eso la app abre en
menos de un segundo; solo la primera carga después de que vence la caché paga los 15 s.

No cuesta frescura: DROPI se actualiza con unas 5 horas de retraso respecto a la
transportadora, así que un dato de hace 10 minutos y uno de hace 10 segundos son el mismo.

Dos cosas que ya se probaron y **no** hay que volver a hacer:

- **No usar un `Map` en memoria.** Anda perfecto en local, pero Vercel levanta varias
  instancias del lambda y cada una arranca con su Map vacío: en producción la misma
  pantalla tardaba 13 s, 18 s y 5 s en tres cargas seguidas.
- **No agregar un `?fresco=1` que llame a `revalidateTag`.** Invalidar y repoblar en el
  mismo request hace que Next descarte lo que se acaba de escribir, y la carga
  **siguiente** tardaba 34 segundos. El botón Refrescar relee el Sheet, que es lo que
  cambia de verdad.

Solo se cachea el resultado bueno: un `fallo` (429) o un `no-existe` se reconsultan
siempre, para que un corte de un segundo no quede pegado 10 minutos.

### El ritmo hacia DROPI es global, no por cuenta

DROPI responde **429** si se le piden muchas órdenes de corrido, y **el límite lo pone el
host, no la cuenta**. Con un solo negocio, espaciar de a 6 por cliente alcanzaba; al sumar
ShotyGames, las dos cuentas disparaban a la vez, el ritmo se duplicó y **19 de 82 pedidos
se quedaron sin tracking**. Ahora el control vive en `conRitmo` (`src/lib/dropi.ts`): como
mucho 6 llamadas en vuelo y 150 ms entre arranques, sin importar cuántas cuentas pidan.
Resultado: 82/82 con tracking y la carga fría bajó de 44 s a 8 s.

**El login también es single-flight.** Con la caché vacía salían ~30 consultas juntas, las
30 veían `token: null` y disparaban 30 logins simultáneos de la misma cuenta; DROPI los
rechazaba y el resto moría por timeout. Ahora todas esperan el mismo login.

Un 429 **no** se muestra como "orden no encontrada" — son cosas distintas y confundirlas
mandaba a revisar a mano pedidos que estaban perfectos.

---

## Se instala como app en el iPhone

Fabián la guarda en la pantalla de inicio y tiene que abrirse como app, no como una web
dentro de Safari. Lo que hace eso posible:

| Qué | Dónde |
|---|---|
| Icono de la pantalla de inicio | `src/app/apple-icon.png` (180×180) — lo enlaza Next solo |
| Icono de Android / escritorio | `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| Manifest (`display: standalone`, vertical) | `src/app/manifest.ts` |
| Sin barra de Safari en iOS < 16.4 | `apple-mobile-web-app-capable` en `layout.tsx` |
| Sin zoom con doble toque | `maximumScale: 1, userScalable: false` |
| Sin zoom al tocar un campo | `input, textarea, select { font-size: 16px }` — iOS agranda solo si es menor |
| Sin rebote ni "tirar para recargar" | `overscroll-behavior: none` |
| Sin destello gris al tocar | `-webkit-tap-highlight-color: transparent` |
| Contenido fuera del notch | `viewportFit: 'cover'` + las utilidades `.pad-arriba` / `.pad-abajo` |
| Barras de scroll ocultas al deslizar | clase `.tira` bajo `@media (pointer: coarse)` |
| La lista no se mueve con la hoja abierta | `HojaMovil` pone el body en `position: fixed` y devuelve el scroll exacto al cerrar |
| Cerrar la hoja deslizando hacia abajo | arrastre desde el asa o la cabecera, con umbral y "flick" |
| Filtros siempre a mano | van DENTRO de la cabecera fija |
| Buscar sin tildes | "jose" encuentra a "JOSÉ" |

⚠️ **El bloqueo del body es solo para móvil.** `HojaMovil` se monta también en escritorio
—ahí lo tapa `lg:hidden`, que es CSS y no impide que el efecto corra—, así que sin el
chequeo de `matchMedia` abrir un pedido dejaba la página de escritorio sin poder scrollear.

El gesto usa **pointer events** y no touch events a propósito: el navegador los emite igual
para dedo y para mouse, así que se puede probar de verdad en desarrollo.

Los iconos se generan con `scripts/icono.py` (PIL): se dibujan a 4× y se reducen. **No
llevan transparencia** — iOS pone el fondo en negro si el PNG tiene alpha — ni esquinas
redondeadas, que las aplica el sistema.

El `manifest.webmanifest` se sirve **sin sesión** (`PUBLICAS` en `proxy.ts`): iOS lo pide
al agregar la app a la pantalla de inicio y no lleva nada sensible.

⚠️ El texto de las tarjetas y del detalle **sigue siendo seleccionable**: los teléfonos,
direcciones y guías hay que poder copiarlos. `user-select: none` va solo en los controles.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con los valores reales
npm run dev
```

O desde KEPLER, `preview_start` con el nombre `logistica` (puerto 3077).

## Variables de entorno

| Variable | De dónde sale |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | Las mismas del `.env` de KEPLER |
| `SHEETS_ID_DROPSHIPPING` | El Sheet de pedidos de Truquito y Avanora |
| `SHEETS_ID_SHOTYGAMES` | El Sheet REAL de pedidos de ShotyGames (el mismo `GOOGLE_SHEETS_PEDIDOS_ID` de `adm.shotygames.com`, no el espejo IMPORTRANGE) |
| `DROPI2_EMAIL`, `DROPI2_PASSWORD`, `DROPI2_TOTP_SECRET` | Cuenta **dropshipper** de DROPI (la segunda), con 2FA |
| `DROPI_EMAIL`, `DROPI_PASSWORD`, `DROPI_TOTP_SECRET` | Cuenta de **ShotyGames**, donde Fabián es el proveedor |
| `APP_PASSWORD` | La inventás — es el login de la app |

Un token de una cuenta **no sirve** para consultar órdenes de la otra: da 403 sin mensaje
útil.

Si se pierde un `*_TOTP_SECRET` y el 2FA ya está escaneado en Google Authenticator, se
recupera sin desactivar nada: exportar la cuenta desde Authenticator y decodificar el QR
con `KEPLER/scripts/decodificar-qr-2fa.py`.

## Deploy

Vercel, mismo flujo que `avanora` / `dropi-dashboard`: conectar el repo, cargar las ocho
variables de arriba en el proyecto y deployar.
