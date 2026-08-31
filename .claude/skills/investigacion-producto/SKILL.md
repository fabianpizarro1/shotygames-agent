---
name: investigacion-producto
description: Método completo para investigar un producto de dropshipping antes de lanzarlo — barrido total de la biblioteca de anuncios, extracción de todo el material de las landings de la competencia (creativos, fotos, testimonios, ofertas) y armado de un informe en PDF con todo lo encontrado. Usar SIEMPRE que toque investigar un producto, aunque Fabián no lo pida. El resultado (el PDF) es el insumo para diseñar la landing — ver la skill `armar-landing` para el paso siguiente.
---

# Método de investigación de producto

Este es EL método. No se improvisa ni se recorta: cada paso existe porque saltárselo
ya costó tiempo una vez.

**Dónde termina esta skill:** en el informe PDF. Diseñar y construir la landing es otro
paso, con otro proceso — ver [`armar-landing`](../armar-landing/SKILL.md). El flujo completo
de Fabián es: dashboard (`dropi-dashboard`) → Fabián elige un producto → esta skill produce
el informe → Fabián se lo manda a una IA externa que diseña la landing → esa IA le devuelve
texto e imágenes → Fabián me los pasa → `armar-landing` construye.

> **Los comandos, los IDs y las trampas concretas están en [`EJECUCION.md`](EJECUCION.md)**,
> en esta misma carpeta. Ese archivo es el manual operativo: cómo sacar la ficha de DROPI y
> cómo armar el informe en PDF paso a paso. Léelo antes de ejecutar.

## Las dos reglas que mandan sobre todo lo demás

### 1. "No se puede" hay que ganárselo

Antes de decir que algo no se puede, hay que **agotar los intentos**. Un intento fallido no es
un límite: es un intento fallido.

El día que se armó el drenaje dije tres veces que algo no se podía y las tres veces sí se
podía:

| Dije | La verdad |
|---|---|
| "No hay antes/después de mujeres" | Estaban en el HTML de Vitaliza, cargadas por JS |
| "Las fotos del widget de reseñas cargan por API y no se pueden bajar" | El widget no había renderizado. Recargando, estaban en el DOM |
| "Los creativos no vienen por la API" | Cierto para la API, pero se ven en el navegador con el link `view_all_page_id` |

Fabián tuvo que mandar pantallazos para demostrar que el material existía. **Eso no se repite.**
Si una vía falla: reintentar, cambiar de herramienta (curl → navegador → API → DOM), buscar por
otro lado. Solo después de agotarlas se informa el límite, y con el detalle de qué se intentó.

### 2. No se avisa hasta que esté terminado

No se entrega un informe "para que la revise y diga qué falta". Se entrega cuando está
**completo** — cuando no queda nada que Fabián pueda pedir que yo hubiera podido hacer solo.

Antes de avisar, el informe tiene que tener:

- **Los tres países barridos** (Ecuador, Colombia, México), no solo el que resultó más fácil
- **Cada anunciante activo real**, no solo los primeros que aparecieron (ver Fase 1: la
  búsqueda simple da lo más nuevo, que es lo contrario de lo que sirve)
- **Todas las landings de la lista, destripadas** — no una lista de URLs sin abrir
- **Las secciones que pide la Fase 3, completas** — si falta un dato real, se dice así, no se
  deja vacío sin explicación ni se inventa

Si algo quedó afuera a propósito (un país sin anunciantes con landing propia, por ejemplo), se
dice en la misma entrega y con el motivo — no se espera a que lo note él.

---

## FASE 1 — Barrido total del administrador de anuncios

### Por qué la búsqueda simple no sirve

`ads_library_search` por palabra clave devuelve **los 50 más recientes de ~155, sin
paginación**. El navegador tampoco sirve: la biblioteca virtualiza el scroll y solo renderiza
~30.

Las dos vías devuelven lo más NUEVO, que es lo contrario de lo que interesa. Un anuncio con
20 días al aire está validado; uno de ayer no prueba nada.

### La vía que funciona: por anunciante

1. Búsqueda por palabra clave con varias variantes (marca, nombre genérico, el problema que
   resuelve). Sirve **solo para descubrir anunciantes**, nunca para contarlos.
2. Extraer el `page_id` de cada anunciante.
3. Consultar `ads_library_search` con `page_ids` en lotes de ~5. Eso devuelve **todos** los
   anuncios activos de esa página.
4. Repetir hasta que ninguna consulta arroje anunciantes nuevos.

Filtrar por activos y **ordenar por antigüedad** (`ad_delivery_start_time` más viejo primero).
El anuncio más viejo de cada anunciante es el que le está dando plata.

### Qué se extrae de cada anunciante

| Dato | Para qué |
|---|---|
| Nombre y `page_id` | Volver a consultarlo |
| Nº de anuncios activos | Cuánto invierte de verdad |
| Anuncio más antiguo + fecha | Ese es el ganador |
| Copys completos | Ángulos y ganchos |
| Oferta exacta (1/2/3 unidades) | El precio real del mercado |
| Tipo de CTA | WhatsApp vs web |
| URL de landing | Fase 2 |
| Link `view_all_page_id` | Para ver los creativos a mano |

Los creativos en imagen **no vienen por la API**. Guardar siempre
`facebook.com/ads/library/?active_status=active&ad_type=all&country=EC&view_all_page_id=<ID>`.

---

## FASE 2 — Destripar las landings

### El error que no se repite: curl no alcanza

`curl` trae solo el HTML inicial. **Las mejores imágenes cargan por JavaScript** y no aparecen
ahí: los antes/después, las fotos de los widgets de reseñas, los bloques de sección.

Pasó exactamente eso: reporté "no hay antes/después" y "las fotos del widget no se pueden
bajar" cuando ambas cosas eran falsas. Estaban a un `navigate` de distancia.

**Siempre abrir la landing en el navegador**, esperar a que renderice (verificar que
`document.body.innerText.length` sea razonable — si da 28 caracteres, no cargó: recargar),
scrollear hasta el fondo para disparar el lazy-load, y recién ahí leer el DOM:

```js
[...document.images].map(i => (i.currentSrc || i.src).split('?')[0])
```

Si una imagen viene con parámetros de miniatura (`?x-oss-process=style/..._small`), quitarlos
para bajar el original.

Atajos de Shopify, que siguen sirviendo como complemento:

```bash
curl -sL "https://TIENDA/products.json?limit=250"   # catálogo, precios, nº de imágenes
curl -sL "https://TIENDA/products/HANDLE.json"      # copy completo, variantes, imágenes
```

### Qué se saca de cada landing

- **Precios de página** (casi siempre distintos a los del anuncio — anotar los dos)
- **Precio tachado** y el ancla de descuento
- **Dolores**, con las palabras exactas del cliente
- **Mecanismo**: por qué funciona. Es lo que más convierte
- **Reseñas**: nombre, ciudad, situación, y **sus fotos**
- **Garantía**: días y condiciones
- **FAQ**: cada pregunta es una objeción real que están recibiendo
- **Prueba social**: nº de ventas, estrellas, contadores
- **Urgencia y escasez**
- **Tabla comparativa**: contra qué se comparan
- **Timeline de resultados**
- **Ingredientes, modo de uso, transportadoras, tiempos de entrega**

### Imágenes: bajar TODAS y MIRARLAS una por una

No sirve listar URLs. Hay que abrir cada una. Un archivo llamado `49.jpg` resultó ser el mejor
render del mecanismo, y estuvo dos días sin mirarse.

Buscar específicamente:
- **Bloques de sección** (`bloque_1_hero`, `bloque_2_antes_despues`…) — algunas tiendas tienen
  la landing entera armada como imágenes verticales. Son oro: se usan tal cual.
- **Antes/después** — verificar que sean del avatar correcto. Un producto para mujeres con
  piernas hinchadas no se ilustra con un señor bajando barriga: eso es de otra línea del
  producto.
- **Fotos de los widgets de reseñas** — paquetes recién llegados, antes/después que subió el
  propio cliente. Son las más creíbles de todas porque no se pueden falsificar.
- **Infografías**: ingredientes, dosis, tabla nutricional, estadísticas.
- **Lifestyle y unboxing.**

Qué se descarta, y **solo por estos motivos**:

| Descartar | Por qué |
|---|---|
| Frascos con IA de etiqueta ilegible | El cliente recibe otro frasco y devuelve el pedido |
| Logos de medios reales (Forbes, Vogue…) | Finge un respaldo que esas empresas nunca dieron |
| Datos personales visibles | Guías de envío con nombre y dirección de terceros → **difuminar, no recortar** |
| La misma imagen en dos secciones | Repetirla resta en los dos lados |

**No se descarta nada "por si Meta lo rechaza".** Fabián lo decidió y tiene razón: si la
competencia lleva semanas al aire con eso, pasa. Las fotos reales del producto pueden salir de
DROPI, pero **revisar que no traigan claims incrustados** — las del drenaje decían "REDUCE LA
INFLAMACIÓN Y EDEMAS" en el tercio inferior y hubo que recortarlas.

---

## FASE 3 — El informe (PDF)

Esto es lo que reemplaza al diseño propio de landings (así se hacía antes — ver
`armar-landing` para cómo se arma la landing ahora). El informe es el único entregable de
esta skill: se lo manda Fabián a una IA externa, que diseña la landing a partir de él.

**Un solo PDF por producto**, con los tres países (Ecuador, Colombia, México) adentro,
organizado por sección — no un PDF por país. Estructura fija:

1. **Portada** — producto, fecha del barrido, resumen de una línea (cuántos anunciantes
   activos en total, el más agresivo, la oferta más común).
2. **Anunciantes activos, por país.** Tabla EC / CO / MX, cada fila:
   - Nombre y `page_id`
   - Cantidad de anuncios activos (cuánto invierte de verdad)
   - Anuncio más antiguo + hace cuántos días está activo (**ese es el que le da plata** — ver
     Fase 1, "la vía que funciona: por anunciante")
   - Oferta exacta: precio 1 unidad / 2 unidades / 3 unidades, tal como la muestra el anuncio
   - Tipo de CTA (WhatsApp vs landing web)
   - URL de la landing, si tiene
3. **Copys que están funcionando.** Los copys completos de los anuncios más viejos de cada
   país (son los validados — Fase 1 ya explica por qué). Agrupados por ángulo/gancho, no por
   anunciante — así se ve qué ángulos se repiten entre varios competidores.
4. **Ofertas del mercado.** Tabla comparativa de precios: 1/2/3 unidades, cada anunciante que
   los muestra, por país. Es el dato que dice a cuánto se vende de verdad (Fase 3 vieja lo
   decía así: "el precio sale del mercado, no de la calculadora" — sigue siendo cierto).
5. **Lista completa de landings extraídas**, agrupada por país (EC / CO / MX), con la URL de
   cada una. Es el índice de todo lo que se destripó en la Fase 2 — la IA externa y quien
   revise el informe tienen que poder ir a cada una.
6. **Material de las landings** (resumen de Fase 2 por cada landing de la lista): mecanismo,
   dolores con las palabras del cliente, garantía, FAQ, prueba social, timeline — lo que se
   extrajo, no copiado literal si es muy largo, con referencia a de qué landing salió.

No hace falta pedir permiso para armar el PDF — se genera con la skill `pdf` (ya disponible)
en cuanto termina la Fase 2. Entregarlo con `SendUserFile`, no solo describirlo en el chat.

---

## Dónde queda todo

Además del PDF entregado, el material crudo (capturas, URLs, copys) queda en el Google Sheet
del producto, una pestaña por producto — igual que antes.

Ver [[project_dropshipping]] y [[project_avanora_productos]].
