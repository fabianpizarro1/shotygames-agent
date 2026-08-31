# Cómo se ejecuta — manual operativo

`SKILL.md` dice **qué** hacer y por qué. Este archivo dice **cómo**, con los comandos, los
IDs y los errores que ya se cometieron. Cubre desde la ficha del producto hasta el informe en
PDF — construir la landing es otra skill, ver `armar-landing/EJECUCION.md`.

Estado del proyecto y todos los identificadores: `projects/dropshipping/ESTADO.md`.

---

## 0. Datos fijos que vas a necesitar

| Qué | Valor |
|---|---|
| Cuenta publicitaria | `1284579892343452` |
| Página de Facebook | `1286826097846865` |
| Pixel | `1049349201145063` |
| Dominio de conversión | `avanora.vercel.app` |
| Repo de la web | `projects/avanora/` — **es su propio repo git** |

---

## 1. Sacar la ficha real del producto de DROPI

```bash
cd /Users/user/Projects/KEPLER
node -e "
const { getProductoPorNombre, bodegaDe } = require('./projects/dropshipping/pedidos');
(async () => {
  const p = await getProductoPorNombre('PALABRA', ID);
  console.log('NOMBRE:', p.name, '| costo: \$' + p.sale_price, '| stock:', p.stock);
  console.log('proveedor:', p.user_id, '| bodega:', bodegaDe(p).nombre);
  console.log((p.description||'').replace(/<[^>]+>/g,'\n'));
  (p.gallery||[]).forEach(g => console.log('https://d39ru7awumhhs2.cloudfront.net/' + encodeURI(g.urlS3)));
})();
"
```

Las imágenes vienen en `gallery[].urlS3`, **no** en `url` (que llega en `null`). Hay que
prefijar el CloudFront y pasar por `encodeURI` porque los nombres traen espacios.

**Revisar cada foto antes de usarla.** Muchas del catálogo traen el sello "DROPI CUP" encima o
los claims del proveedor incrustados ("REDUCE LA INFLAMACIÓN Y EDEMAS"). Si el claim está en el
tercio inferior, se recorta con PIL:

```python
from PIL import Image
im = Image.open('foto.jpg').convert('RGB')
w, h = im.size
im.crop((0, 0, w, int(h*0.715))).save('salida.jpg', quality=88, optimize=True)
```

`sips` **no** sirve para recortar con precisión: su `--cropOffset` no ancla arriba y termina
centrando. Usar PIL (está instalado).

---

## 2. Generar creativos para ANUNCIOS con Higgsfield

**Ojo:** esto es solo para creativos de anuncios de Meta, no para el contenido de la
landing — eso ahora lo diseña la IA externa a partir del informe (ver Fase 3 y la skill
`armar-landing`). Si lo único que hace falta es el informe, esta sección no aplica.

Es la parte con más trampas. El orden exacto:

**a) Preparar la imagen de referencia.** El producto REAL, cuadrado, sin sellos ni texto ajeno.

**b) Subirla:**

```
media_upload { filename: "producto.jpg", content_type: "image/jpeg" }
```

Devuelve `upload_url` (gigante y firmada) y `media_id`.

**c) Subir los bytes.** La URL es enorme; meterla en una variable con comillas simples:

```bash
URL='https://upload.higgsfield.ai/...'
curl -s -X PUT -H "Content-Type: image/jpeg" --data-binary @producto.jpg "$URL" -w "HTTP %{http_code}\n"
```

**d) Confirmar:** `media_confirm { type: "image", media_id: "..." }`

**e) Generar:**

```
generate_image_batch → requests[].params:
  model: "marketing_studio_image"
  aspect_ratio: "9:16"  (bloques de landing)  |  "4:5"  (anuncios)
  medias: [{ value: "<media_id>", role: "image" }]
```

⚠️ **`role` tiene que ser `"image"`.** Con `"reference"` falla con `invalid_value`.

**f) Esperar:** `jobs_wait` con los job_ids. Tarda ~1-3 min. Si un job vuelve `failed`,
**reintentar** — pasó una vez y al segundo intento salió.

**g) Bajar** desde `result_url` y **mirar cada imagen**. Nunca darlas por buenas.

### Cómo escribir el prompt (esto es lo que más costó)

Tres instrucciones que hay que poner **siempre**, porque sin ellas falla:

1. **Producto idéntico:**
   > "Use the EXACT product from the reference image without altering it: [descripción]. Do not
   > redesign, retype or change the label text, colors, icons or proportions. Keep the product
   > pixel-faithful."

2. **Tildes.** El modelo las tira si no se lo exigís. Escribir el texto español **con las
   tildes puestas** en el prompt y agregar:
   > "every accent mark rendered exactly as written"

   Sin esto salió "HINCHAZON", "MAS ENERGIA", "ENVIO GRATIS", "fluctua".

3. **Líneas únicas.** El modelo repite renglones:
   > "each line exactly once. Do not repeat any line."

   Sin esto duplicó "La grasa es constante."

Además, para suplementos: **"No people, no bodies"** y **"no pills, no capsules, no tablets"**
(ver la sección de rechazos).

**Revisar el resultado siempre:** tildes, texto duplicado, que el frasco no haya cambiado, y
que el gramaje/precio coincida con el producto real.

---

## 3. Armar el informe (PDF)

Con Fase 1 y Fase 2 ya hechas, se tiene todo lo que pide la estructura del informe (ver
`SKILL.md`, Fase 3). Esto es lo único que agrega esta sección: cómo convertirlo en PDF.

1. Usar la skill `anthropic-skills:pdf` (ya disponible en este entorno) para generar el
   archivo — no armar el PDF a mano con otra herramienta.
2. Redactar primero el contenido en Markdown, con las 6 secciones de `SKILL.md` en ese orden
   exacto: portada, anunciantes por país, copys que funcionan, ofertas del mercado, lista de
   landings por país, material extraído de cada landing.
3. Las tablas de anunciantes y ofertas van como tablas de verdad (no listas con guiones) — es
   lo que hace que se puedan comparar de un vistazo.
4. Nombre del archivo: `informe-<slug-producto>-<fecha>.pdf` (ej.
   `informe-drenaje-linfatico-2026-08-30.pdf`).
5. Entregarlo con `SendUserFile`, `status: "normal"` — es la entrega de la skill, no un
   archivo de trabajo intermedio.

**No completar secciones con relleno si falta información.** Si un país no tiene anunciantes
con landing propia (pasó con el Inositol — todos mandaban a WhatsApp), esa fila del informe
dice eso, no se deja vacía sin explicación ni se inventa una landing que no existe.

---

## 4. Armar la campaña en Meta

Todo se crea **en pausa** automáticamente. Nunca activar: eso lo hace Fabián.

```
1) ads_create_campaign
   ad_account_id: 1284579892343452
   campaign_name: "Avanora · PRODUCTO · Sonda CPA"
   objective: "OUTCOME_SALES"
   buying_type: "AUCTION"
   special_ad_categories: "[]"          ← string, no array

2) ads_create_ad_set
   campaign_id: <el de arriba>
   billing_event: "IMPRESSIONS"
   optimization_goal: "OFFSITE_CONVERSIONS"
   destination_type: "WEBSITE"
   daily_budget: 1000                    ← EN CENTAVOS = $10/día
   promoted_object: '{"pixel_id":"1049349201145063","custom_event_type":"PURCHASE"}'
   targeting: '{"geo_locations":{"countries":["EC"],
                                 "location_types":["home","recent"]},
                "genders":[2],"age_min":XX,"age_max":XX,
                "targeting_automation":{"advantage_audience":0}}'

3) ads_create_creative   (uno por anuncio — SIEMPRE 3)
   page_id: 1286826097846865
   image_url: <la URL de CloudFront que devolvió Higgsfield — se usa directo>
   link_url: https://avanora.vercel.app/p/SLUG
   message / headline / description
   call_to_action_type: "SHOP_NOW"       ← SIEMPRE "Comprar", nunca otro
   self_ai_disclosure: "OPT_IN"          ← las imágenes son generadas
   degrees_of_freedom_spec: '{"creative_features_spec":{
       "text_optimizations":{"enroll_status":"OPT_OUT"},
       "image_touchups":{"enroll_status":"OPT_OUT"},
       "image_brightness_and_contrast":{"enroll_status":"OPT_OUT"},
       "image_templates":{"enroll_status":"OPT_OUT"},
       "enhance_cta":{"enroll_status":"OPT_OUT"},
       "description_automation":{"enroll_status":"OPT_OUT"},
       "add_text_overlay":{"enroll_status":"OPT_OUT"},
       "site_extensions":{"enroll_status":"OPT_OUT"}}}'

4) ads_create_ad         (uno por creativo)
   ad_set_id, creative: '{"creative_id":"..."}'
   conversion_domain: "avanora.vercel.app"
```

**`genders: [2]` = mujeres.** El rango de edad se ajusta al avatar: 28-58 para el drenaje
(piernas hinchadas), 22-45 para el inositol (SOP se diagnostica más joven).

**`advantage_audience: 0` es importante.** Sin eso Meta trata la edad y el género como
sugerencia y le muestra el anuncio a cualquiera. Con $10/día no alcanza para eso.

**Todos los anuncios apuntan a la MISMA landing.** Si uno va a `?v=b` el test mezcla creativo
con landing y el resultado no dice cuál movió la aguja. Ya pasó.

**`location_types:["home","recent"]` no es opcional.** Meta suprimió la opción de segmentar por
un solo tipo de lugar. Con `["home"]` el conjunto se crea sin quejarse y después **falla al
activarlo** con el error #1870194 ("segmentación por lugar que se ha suprimido"). Pasó en los
dos conjuntos de Avanora. Al corregirlo hay que reenviar el `targeting` **entero** —se reemplaza,
no se hace merge— y sin los campos `effective_*`, que son de solo lectura.

**Nunca activar las automatizaciones de Meta** (regla de Fabián, 2026-08-26): ni el anuncio
multianunciante, ni las "mejoras", ni el público ventajoso. Las mejoras se apagan con el
`degrees_of_freedom_spec` de arriba —ojo, `standard_enhancements` está obsoleto y la API lo
rechaza, hay que listar cada función. **El multianunciante no se puede apagar por la API**: lo
rechaza tanto en `ad_set` como en `ad`, y hay que desmarcarlo a mano en el administrador.

### El formato del copy — igual que Shotygames y Truquito

Siempre **3 anuncios**, cada uno con su propio texto, título y descripción. Nunca varios textos
dentro de un mismo anuncio: eso es la optimización de texto de Meta, que está prohibida.

```
HOOK EN MAYÚSCULAS + emoji          ← pregunta o afirmación que frena el scroll

2-3 líneas de qué es y cómo se usa

🔥 1 por $X
🔥 2 por $Y
🔥 3 por $Z — el tratamiento completo

🚚 Envío GRATIS a todo Ecuador
💵 Pagas en efectivo cuando lo recibes
📦 Te llega en 2 a 4 días

Cierre corto + 👇
```

Título ≤40 caracteres con el gancho o la oferta. Descripción ≤30 con el envío gratis o el
combo. Envío gratis y contra entrega van **siempre**, en su propio bloque.

### Verificar después de crear

```
ads_get_ad_entities  level:"ad"  fields:["id","name","effective_status","delivery","campaign_id"]
```

- `PAUSED` = aprobado, esperando
- `IN_PROCESS` / `PENDING_REVIEW` = en revisión
- `DISAPPROVED` = rechazado

Y sacar la vista previa de al menos uno: `ads_get_ad_preview` con `MOBILE_FEED_STANDARD`.

---

## 5. Lo que NO se puede hacer en esta cuenta

| Herramienta | Estado | Alternativa |
|---|---|---|
| `ads_creative_upload_image` | ❌ no habilitada | Pasar `image_url` directo a `ads_create_creative` |
| `ads_creative_delete` | ❌ no habilitada | Los creativos huérfanos quedan; no molestan |
| Borrar anuncios | ❌ no habilitada | Fabián los borra a mano |
| `ads_get_errors` | ⚠️ **no cubre rechazos** | Lo dice su propia doc |

**El link de un creativo es inmutable.** Si apuntaste mal, hay que crear otro creativo.

Para leer el motivo textual de un rechazo hace falta entrar al Administrador con la sesión de
Fabián. El navegador interno **no** está logueado en Facebook (y no se ponen credenciales).

---

## 6. Rechazos de Meta — lo que ya se aprendió

**No mostrar pastillas, cápsulas ni tabletas sueltas en la imagen.** El 2026-08-14 se subieron
4 anuncios del Inositol al mismo conjunto: tres pasaron y el único que mostraba cápsulas fue
`DISAPPROVED`. Si el ángulo necesita contrastar contra pastillas, hacerlo **verbal**:
"No es una pastilla más, es un vaso que te gusta" — y en el copy "varias tomas al día" en vez
de "4 cápsulas al día".

**Los antes/después de cuerpos van en la landing, nunca en el anuncio.** Los 16 competidores
del drenaje los tienen en su landing y ninguno en sus anuncios.

**Lo que sí pasa:** "siéntete más ligera", "menos hinchazón", "equilibrio hormonal", "ciclos
regulares". Es el registro que la competencia lleva un año usando.

---

## 7. La matemática

`projects/dropshipping/calculadora.js`, con flete **$6.36** y entrega **70%**:

```
margenEntregado   = precio − costo − flete
porPedidoGenerado = (0.70 × margenEntregado) − (0.30 × flete)
```

Ese número es el **CPA de equilibrio**. Y hay un paso más que se olvidó una vez:

> **Dividir por 1.2.** El gasto en Meta lleva ~20% de comisión bancaria, así que el CPA que
> muestra el administrador tiene que ser un 20% menor que el de equilibrio.

Para ganar plata, apuntar a **la mitad** del CPA de equilibrio.

**El precio sale del mercado, no de la calculadora.** La calculadora dice si un producto
*puede* ser rentable; el barrido de la biblioteca dice a cuánto se vende. Manda el mercado.
