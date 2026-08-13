---
name: investigacion-producto
description: Investigación profunda de un producto antes de testearlo — barrido completo de la biblioteca de anuncios de Meta, extracción de landings de la competencia y armado de la landing propia. Usar SIEMPRE que toque investigar un producto para dropshipping, no solo cuando Fabián lo pida.
---

# Investigación profunda de producto

Esto NO es "buscar el producto en la biblioteca de anuncios y ver qué sale". Es un barrido
exhaustivo. La primera vez que se hizo a medias, Fabián encontró en 30 segundos dos anuncios
que yo había reportado como inexistentes. No se entrega hasta que esté completo.

## Fase 1 — Barrido de anuncios: TODOS, no una muestra

### Por qué la búsqueda simple no sirve

`ads_library_search` por palabra clave devuelve **los 50 más recientes de ~155, sin paginación**.
El navegador tampoco: la biblioteca virtualiza el scroll y solo renderiza ~30.

Las dos vías fallan igual — devuelven lo más NUEVO, que es justo lo contrario de lo que
interesa. Un anuncio que lleva 20 días al aire está validado; uno de ayer no prueba nada.

### La vía que sí funciona: por anunciante

1. Búsqueda por palabra clave (varias variantes: nombre de marca, nombre genérico, el problema
   que resuelve) — sirve **solo para descubrir anunciantes**, no para contarlos.
2. Extraer el `page_id` de cada anunciante que aparezca.
3. Consultar `ads_library_search` con `page_ids` en lotes de ~5. Eso sí devuelve **todos** los
   anuncios activos de esa página, sin recorte.
4. Repetir hasta que ninguna consulta arroje anunciantes nuevos.

Filtrar por activos y **ordenar por antigüedad** — `ad_delivery_start_time` más viejo primero.
El anuncio más viejo de cada anunciante es el que le está dando plata; el resto son pruebas.

### Qué se extrae de cada anunciante

| Dato | Para qué sirve |
|---|---|
| Nombre y `page_id` | Volver a consultarlo después |
| Nº de anuncios activos | Cuánto está invirtiendo de verdad |
| Anuncio más antiguo + fecha | Ese es el ganador, ese se estudia |
| Copys completos | Ángulos, ganchos, estructura |
| Oferta exacta (1/2/3 unidades) | El precio real del mercado |
| Tipo de CTA | WhatsApp vs web — dice cómo cierran |
| URL de landing | Fase 2 |
| Link `view_all_page_id` | Para revisar los creativos a mano |

**Los creativos en imagen no vienen por API.** Guardar siempre el link
`facebook.com/ads/library/?active_status=active&ad_type=all&country=EC&view_all_page_id=<ID>`
para poder verlos en el navegador.

## Fase 2 — Destripar las landings

Para cada landing encontrada. Si es Shopify (la mayoría lo son), hay atajos:

```bash
curl -sL "https://TIENDA/products.json?limit=250"      # catálogo, precios, nº de imágenes
curl -sL "https://TIENDA/products/HANDLE.json"          # copy completo, variantes, imágenes
```

El `body_html` del JSON trae el copy sin el ruido del tema. Si viene vacío, el contenido está
en secciones — bajar el HTML y limpiarlo (quitar `<script>`, `<style>`, tags y la lista de
países del selector de moneda, que se come el 80% del texto).

### Qué se saca de cada landing

- **Precios reales de página** — casi siempre distintos a los del anuncio. Anotar los dos.
- **Precio tachado** — el ancla de descuento que usan
- **Dolores** — cómo nombran el problema con las palabras del cliente
- **Mecanismo** — la explicación de por qué funciona (es lo que convierte)
- **Reseñas y testimonios** — nombre, ciudad, situación concreta
- **Garantía** — días y condiciones
- **FAQ** — cada pregunta es una objeción real que están recibiendo
- **Prueba social** — nº de ventas, estrellas, "X unidades vendidas"
- **Urgencia y escasez** — cómo la plantean
- **Tabla comparativa** — contra qué se comparan
- **Timeline de resultados** — día 1, día 3-5, semana 2…
- **Ingredientes y modo de uso** — datos duros
- **Transportadoras y tiempos de entrega**

### Imágenes

Bajar todas y **mirarlas una por una**. No sirve listar URLs: hay que ver qué tienen.
Clasificar en tres:

| Categoría | Qué hacer |
|---|---|
| Datos factuales (tabla nutricional, ingredientes, modo de uso) | Usar el **contenido**, rediseñar el formato |
| Estructura buena (banner de oferta, íconos de beneficios) | Copiar la **estructura**, generar la nuestra |
| Inservibles | Descartar y decir por qué |

**Descartar siempre:**
- Antes/después de cuerpos — Meta los prohíbe y son resultados fabricados
- Frascos generados con IA con texto ilegible en la etiqueta — el cliente recibe otra cosa
  y devuelve el pedido
- Cualquier imagen con claim médico incrustado

Las fotos reales del producto salen de **DROPI**, no de la competencia. Son las del frasco que
Fabián realmente va a despachar.

**Sobre copiar creativos de la competencia:** los ángulos, la estructura y los datos son
información de mercado y se usan. Los archivos de imagen son trabajo de otro — se toman como
referencia de diseño, no se suben tal cual.

## Fase 3 — Armar las landings

Con todo lo anterior, construir **2 o 3 variaciones** para probar cuál vende mejor. Se cambia
una sola cosa entre variantes, si no el test no dice nada:

- **A** — la estructura que ya funciona en el mercado (la del ganador)
- **B** — otro ángulo o el mecanismo por delante
- **C** — otra oferta / otro combo destacado

Si un producto necesita secciones que la plantilla no tiene (tabla comparativa, timeline,
mecanismo en 3 pasos, tabla de ingredientes), **se agregan**. La plantilla se adapta al
producto, no al revés.

### Precio
Se testea **al precio del mercado**, no al que sale de la calculadora. La calculadora dice si
un producto puede ser rentable; el mercado dice a cuánto se puede vender. Manda el mercado.
El objetivo del primer test es medir el CPA real, no ganar plata.

### Lenguaje
Nada de lo que dice la ficha del proveedor entra en el copy. "Reduce la inflamación",
"trata", "cura", "antiinflamatorio" son claims médicos y Meta los rechaza. El registro que sí
está al aire: "siéntete más ligera", "menos hinchazón", "apoyo natural", "bienestar diario".
La prueba está en la propia biblioteca — lo que llevas 20 días viendo activo es lo que pasa.

## Dónde queda todo

Google Sheet del producto, una pestaña por producto:
mapa de anunciantes → landings → precios → ángulos usados → material extraído.

Ver [[project_dropshipping]] y [[project_avanora_productos]].
