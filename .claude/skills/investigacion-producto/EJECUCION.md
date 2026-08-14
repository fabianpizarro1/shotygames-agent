# Cómo se ejecuta — manual operativo

`SKILL.md` dice **qué** hacer y por qué. Este archivo dice **cómo**, con los comandos, los
IDs y los errores que ya se cometieron. Está pensado para que alguien pueda lanzar un producto
de punta a punta sin preguntar nada.

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

## 2. Generar los creativos con Higgsfield

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

## 3. Agregar el producto a la landing

Todo el contenido vive en `projects/avanora/src/data/productos.ts`. Se agrega un objeto al
array y queda publicado en `/p/{slug}`. **No se toca ningún componente.**

Campos, en orden de importancia:

```ts
{
  slug, dropiId, nombre, titular, subtitular,
  costoProveedor, precio, precioTachado,
  imagenes: ['/productos/X/producto.jpg', ...],   // fotos reales, ya limpias
  estilo: 'visual',                                // estructura por defecto
  bloques: [{src, alt}],        // estructura A — imágenes verticales a ancho completo
  galeria: [{src, alt}],        // estructura B — se intercalan; usa índices 0,1,2
  historia: [{tipo:'p'|'h'|'img'|'cita', ...}],   // estructura C — advertorial
  variantes: { b: {nombre, estilo:'clasica', titular, subtitular, comboDestacado},
               c: {nombre, estilo:'historia', ...} },
  combos: [{unidades, precio, etiqueta, destacado}],
  beneficios, comoFunciona,
  mecanismo: {titulo, intro, pasos[]},             // lo que más convierte
  timeline: [{cuando, titulo, texto}],             // BAJA expectativas
  comparativa: {nuestro, alternativa, filas[]},    // `nuestro` = cómo se llama tu columna
  ingredientesIntro, ingredientes: [{nombre, para}],
  garantiaDias,
  casos: [{foto, situacion, antes, resultado}],    // opcional, antes/después
  resenasEjemplo: [{nombre, ciudad, estrellas, texto, foto?}],
  resenasSonReales: true
}
```

**`comparativa.nuestro` e `ingredientesIntro` existen por un error real:** la plantilla tenía
"Estas gotas" y "Fórmula botánica: extractos líquidos de plantas" escritos a mano, y aparecían
en un producto que es polvo. **Nunca escribas copy de producto dentro de un layout.**

### Reglas de la landing que ya están resueltas — no las rompas

- Los botones muestran el precio de **UNA** unidad; el checkout abre en la opción más barata.
- La estructura visual necesita **H1 y CTA arriba del pliegue** (hay una barra de entrada antes
  de los bloques). Verificar en 375px que el CTA quede por debajo de ~300px.
- En móvil el hero de la clásica va **titular → precio → CTA → imagen** (`order-*` invertido
  con `md:order-*`). Si la imagen queda primero, el primer pantallazo no dice nada.
- Reseñas con foto primero. Una de 4 estrellas con un pero.
- Tabla comparativa con **una fila donde gana la alternativa**.

---

## 4. Verificar y desplegar

```bash
cd projects/avanora
npx tsc --noEmit      # el error de pixel.ts es preexistente, ignorarlo
npx vite build
```

Con el navegador (`preview_start {name:"avanora"}`, tabId que devuelva):

```js
// las tres variantes, en 375px
(()=>{const w=document.documentElement.clientWidth, h=window.innerHeight;
 const h1=document.querySelector('h1');
 const cta=[...document.querySelectorAll('button')].find(b=>/Lo quiero|Pedir/.test(b.textContent));
 return JSON.stringify({h1:h1?.textContent.slice(0,40), ctaTop:Math.round(cta.getBoundingClientRect().top),
   enPliegue:cta.getBoundingClientRect().top<h, sinScrollH:document.body.scrollWidth<=w});})()
```

Desplegar:

```bash
git add -A && git commit -F - <<'EOF' ... EOF
git push origin main
npx vercel --prod --yes
```

Y después, `curl` a las 3 URLs y a cada asset nuevo. **Verificar el bundle en vivo**, no el
local:

```bash
JS=$(curl -sL "https://avanora.vercel.app/p/SLUG" | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
curl -sL "https://avanora.vercel.app$JS" -o /tmp/b.js
python3 -c "b=open('/tmp/b.js',encoding='utf-8',errors='replace').read(); print('precio:', b.count('29.99'))"
```

---

## 5. Armar la campaña en Meta

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
   targeting: '{"geo_locations":{"countries":["EC"]},"genders":[2],
                "age_min":XX,"age_max":XX,
                "targeting_automation":{"advantage_audience":0}}'

3) ads_create_creative   (uno por anuncio)
   page_id: 1286826097846865
   image_url: <la URL de CloudFront que devolvió Higgsfield — se usa directo>
   link_url: https://avanora.vercel.app/p/SLUG
   message / headline / description / call_to_action_type
   self_ai_disclosure: "OPT_IN"          ← las imágenes son generadas

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

### Verificar después de crear

```
ads_get_ad_entities  level:"ad"  fields:["id","name","effective_status","delivery","campaign_id"]
```

- `PAUSED` = aprobado, esperando
- `IN_PROCESS` / `PENDING_REVIEW` = en revisión
- `DISAPPROVED` = rechazado

Y sacar la vista previa de al menos uno: `ads_get_ad_preview` con `MOBILE_FEED_STANDARD`.

---

## 6. Lo que NO se puede hacer en esta cuenta

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

## 7. Rechazos de Meta — lo que ya se aprendió

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

## 8. La matemática

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
