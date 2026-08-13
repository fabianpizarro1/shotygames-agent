---
name: investigacion-producto
description: Método completo para lanzar un producto de dropshipping — barrido total de la biblioteca de anuncios, extracción de todo el material de las landings de la competencia (creativos, fotos, testimonios, ofertas) y armado de 3 landings completamente distintas. Usar SIEMPRE que toque investigar o lanzar un producto, aunque Fabián no lo pida.
---

# Método de lanzamiento de producto

Este es EL método. No se improvisa ni se recorta: cada paso existe porque saltárselo
ya costó tiempo una vez.

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

No se entrega una landing "para que la revise y diga qué falta". Se entrega cuando está
**perfecta, clara, vendedora y rápida** — cuando no queda nada que Fabián pueda pedir que yo
hubiera podido hacer solo.

Antes de avisar, la landing tiene que estar:

- **Completa** — todo el material extraído ya incorporado, no la mitad
- **Vendedora** — mecanismo, casos con foto, reseñas, garantía, oferta clara
- **Clara** — se entiende sin leer dos veces; nada repetido en dos secciones
- **Rápida** — imágenes comprimidas, `loading="lazy"` salvo la primera, `fetchPriority` en el hero
- **Verificada** — fase 4 completa, en producción, con los links probados

Si algo quedó afuera a propósito, se dice en la misma entrega y con el motivo — no se espera a
que lo note él.

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

## FASE 3 — Tres landings COMPLETAMENTE distintas

No es la misma página con otro titular. Son tres formatos:

| Variante | URL | Qué es |
|---|---|---|
| **A — visual** | `/p/slug` | Casi puras imágenes apiladas a ancho completo, CTA cada dos bloques. Es lo que están usando los que venden hoy en Ecuador. Si hay que elegir una, es esta |
| **B — clásica** | `?v=b` | Secciones de texto, cada una entra por una imagen |
| **C — advertorial** | `?v=c` | Nota larga: autoridad → confesión → el sistema te falló → mecanismo → producto → garantía. Para tráfico frío |

Cada una puede tener su propio diseño, banner, estructura y ganchos. Si un producto necesita
una sección que la plantilla no tiene, **se agrega**.

El pixel manda el slug con la variante pegada (`producto|b`) — sin eso las tres se ven iguales
en Meta y el test no sirve.

Lo que **no** cambia entre variantes: la oferta, las reseñas y el FAQ. Se testea el camino
hasta la oferta, no el cierre.

### Reglas de la landing, ya aprendidas

- **Precio de mercado**, no el de la calculadora. La calculadora dice si puede ser rentable; el
  mercado dice a cuánto se vende. El primer test mide el CPA real, no busca ganar plata.
- **Los botones muestran el precio de UNA unidad**, y el checkout abre en la opción más barata.
  Pedir la decisión más cara antes de que el cliente confíe es lo que lo espanta. El upsell va
  adentro del checkout, con el ahorro a la vista.
- **Checkout tipo "Selecciona tu oferta"**: tarjetas con foto, precio por unidad, precio de
  lista tachado y el % de descuento. Abajo el desglose y el botón *"Confirmar pedido para pagar
  al recibir — $X"*.
- **Reseñas con foto primero**, y ciudades reales repartidas (Quito, Guayaquil, Cuenca,
  Machala, Ambato, Manta…). Nunca "Ecuador" a secas ni todas de la misma ciudad.
- **Una reseña de 4 estrellas con un pero.** Un muro de 5 perfectas se lee como inventado.
- **Timeline de resultados** para bajar expectativas. En contra entrega el cliente ya pagó
  cuando se decepciona, y una devolución se come el margen de tres ventas buenas.
- **Garantía visible.** Toda la competencia da una.
- **Tabla comparativa con una fila donde gana la alternativa.** Todos los ✓ de un lado no lo
  cree nadie.

---

## FASE 4 — Verificar antes de entregar

### Técnico

- `npx tsc --noEmit` y `npx vite build`
- Las tres variantes cargan y son distintas; una `?v=` desconocida cae en la A
- Todas las imágenes responden 200
- Sin scroll horizontal en móvil (375px)
- El checkout abre en la opción más barata y el total se actualiza al cambiarla
- Después de desplegar: `curl` a las 3 URLs y a los assets nuevos

### Concordancia entre elementos

Esto es lo que más veces hubo que corregir, y siempre lo cazó Fabián, no yo. **Recorrer la
página entera de arriba abajo antes de entregarla**, no revisar sección por sección aislada.

**Nada repetido en dos lugares.**
- La misma foto no puede estar en dos secciones. Pasó: el antes/después de Carmen estaba en
  los casos Y como foto de su reseña.
- La misma sección no puede existir dos veces con contenido distinto. Pasó: un bloque de
  imagen con tres testimonios inventados arriba, y la sección de reseñas reales abajo. El
  lector ve lo mismo dos veces y la segunda le quita credibilidad a la primera.

**Leer el texto DENTRO de cada imagen, no solo mirarla.** Las piezas heredadas de la
competencia traen cosas que no se ven de reojo:
- La marca mal escrita — decía "Aurelis" en vez de "Aurelys" al pie de un bloque.
- Palabras sin sentido — un ícono decía "Support Euthyroy".
- Prueba social de OTRA tienda — "MÁS DE 10.000 CLIENTES SATISFECHOS" en una marca que abre
  hoy. Eso es mentir sobre el propio negocio, y se recorta.
- El precio de otra tienda ($27.99, $25) contradiciendo el nuestro.
- Claims médicos incrustados que el copy evita con cuidado ("REDUCE LA INFLAMACIÓN Y EDEMAS").

**Coherencia de datos en toda la página.**
- El precio de la landing, del checkout y del anuncio dicen lo mismo.
- Ninguna reseña repite nombre. Ninguna ciudad se repite de más. No todas son 5 estrellas.
- El ml del producto es el mismo en las fotos, el copy y la ficha.
- Lo que promete el creativo del anuncio existe en la landing a la que lleva.

**Que cada anuncio apunte a la landing correcta.** Si un anuncio va a `?v=b` y los otros a la
A, el test mezcla creativo con landing y el resultado no dice cuál movió la aguja. Pasó al
armar la campaña.

## Dónde queda todo

Google Sheet del producto, una pestaña por producto: mapa de anunciantes → landings → precios →
ángulos usados → material extraído.

Ver [[project_dropshipping]] y [[project_avanora_productos]].
