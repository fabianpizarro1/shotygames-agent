# Análisis a fondo — 5 productos · 2026-08-28

Fase 1 del método (`.claude/skills/investigacion-producto`): barrido por `page_ids` (no por palabra
clave), landings abiertas **en navegador** (no curl), ofertas y tiempos reales.

**Nota de método:** `GET /products/{id}` de DROPI empezó a devolver `400 "No tiene permisos para ver
este producto"` hoy. Las fichas se sacaron por `POST /products/index` con `keywords`, que sí trae el
objeto completo (descripción, galería, proveedor). Queda anotado para no perder tiempo la próxima.

---

## Resumen para decidir

| Producto | Días del competidor más viejo | ¿Alguien tiene landing? | CPA real 1u | CPA real 2u | Stock | Riesgo Meta |
|---|---|---|---|---|---|---|
| **Esmalte dental** 155190 | **50 días** (Ecuamarket) | ❌ **nadie** | $8.69 | $12.19 | 323 | 🟡 |
| **Limpia vidrios** 95921 | **34 días** (Aripai) | ✅ Lovenia (excelente) | **$10.14** | **$16.84** | 218 | 🟢 |
| **Gafas Bluetooth** 118920 | 31 días (NovaeShop) | ✅ NovaeShop (decente) | $8.53 | $10.72 | **159** | 🟢 |
| **Ejercitador pélvico** 104158 | 4 días (Velora) | ✅ Velora (floja) | $8.33 | $12.64 | **1.373** | 🟠 |
| **Manos libres casco** 149592 | 6 días (Mi Tiendita) | ❌ nadie | $7.92 | $12.41 | 253 | 🟢 |

CPA real = CPA de equilibrio ÷ 1.2 (comisión bancaria del gasto en Meta). Flete plano $6.36,
entrega 70%. Para ganar plata hay que apuntar a la **mitad** de esa cifra.

---

# TRUQUITO

## 1. Gafas Bluetooth con audífono interno — DROPI 118920

**Ficha DROPI:** proveedor 9440 IMPORSHOP · costo **$6.25** · sugerido $10 · **stock 159** ·
3 imágenes (2 PNG + 1 GIF) · sin variaciones · categoría Tecnología.
La descripción del proveedor es genérica de tres líneas: audio integrado en la montura, llamadas,
asistente de voz. **No dice que sea fotocromática** — y ese es justo el diferenciador que usa el
único competidor real.

**Velocidad:** 11.8 u/día · 6/6 ventanas · concentración 28%.

**⚠️ Stock 159 alcanza para el test, no para escalar.** Mismo costo, mucho más inventario:

| Alternativa | DROPI | Costo | Stock |
|---|---|---|---|
| Gafas bluetooth táctil | **134062** | $6.25 | **673** |
| GAFAS BLUETOOTH CAJA AZUL | **167974** | $6.25 | **500** |
| Gafas Bluetooth Audífono Interno | 137590 | $5.94 | 190 |

### Anunciantes

**NovaeShop** (`1079471715242137`) — **el único competidor real.**
- 12 anuncios activos, el más viejo **28 jul (31 días)**, todos del mismo producto y mismo copy.
- Landing propia: `enviolisto.shop/LentesInteligentesMT`
- Ángulo: *"¡2 en 1! Lentes Inteligentes con Bluetooth: escucha música, contesta llamadas SIN
  audífonos y además cambian de color con el sol ☀️ Transparentes en interiores, oscuros en
  exteriores"*. El fotocromático es la mitad de la promesa.
- **Oferta exacta:** 1u **$29.99** (tachado $41.99) · **2x1 $39.99** ("PAGA 1 LLEVA 2") ·
  **3x2 $49.99** ("MÁS VENDIDO / MÁS AHORRO") · upsell **Envío Prioritario +$1.99** ·
  contador de escasez ("la oferta termina en 14:16") · "garantía de por vida" · entrega 24-48 h.
- Checkout de 4 pasos en la misma página, contra entrega.
- **Descuidos aprovechables:** el `<title>` de la landing dice **"Irrigador dental"** (plantilla
  reciclada), el `utm_source` es `tiktok` en anuncios de Meta, y el precio tachado del 2x1 ($32.98)
  es MENOR que el precio de venta ($39.99).

**Shopiverso** (`1109929155532842`) — **no es el mismo producto, no cuenta como competencia.**
6 anuncios, todos creados hace 13-14 horas. Venden gafas tipo Ray-Ban Meta con **cámara de 12 MP y
32 GB**, y el copy dice literalmente *"Las Ray-Ban que llevas viendo en todos lados"* → eso es uso
de marca ajena. Landing `shopi-verso.com`.

**Import SHINY** (`108731095465023`) — mete "SmartGlasses G58" dentro de un carrusel de 10
productos de contenedor. No pelea el ángulo.

**Mercado Online Ecuador** (`912635135277277`) — el 25-ago figuraba con gafas; hoy sus anuncios
activos son plantillas de gel, semillas de rosas, protector de colchón y gotas para oídos. **Rotó
de producto.**

### Unidad económica (precio anclado al de NovaeShop)

| | Precio | Margen entregado | CPA equilibrio | **CPA real Meta** | Objetivo (mitad) |
|---|---|---|---|---|---|
| 1u | $29.99 | $17.36 | $10.24 | **$8.53** | $4.27 |
| 2u | $39.99 | $21.11 | $12.86 | **$10.72** | $5.36 |
| 3u | $49.99 | $24.86 | $15.49 | **$12.91** | $6.45 |

### Veredicto
Un solo competidor con un mes al aire y landing propia. Margen bueno. **Dos cosas que resolver
antes:** (1) confirmar con el proveedor si el lente es fotocromático — si no lo es, se pierde la
mitad del ángulo que está funcionando; (2) cambiar al SKU 134062 o 167974 por stock.

---

## 2. Manos Libres Bluetooth para Casco — DROPI 149592

**Ficha DROPI:** proveedor 68783 Nova · costo **$7.30** · sugerido $8 · stock 253.
Alternativas: **147395** ($7.80 / 363 u / sugerido $25) · 172721 Intercomunicador K06a ($7.50 /
199 u) · 146918 ($11.00 / 298 u).

**Velocidad:** 8.6 u/día · 6/6 ventanas · concentración 37%. Es el más lento de los cinco.

### Anunciantes

**Mi Tiendita 593** (`884430468096345`) — tienda multiproducto por WhatsApp (perfume con feromonas,
brocas para porcelanato, hebillas de nylon…). El anuncio del casco es del **22 ago (6 días)**:
*"🏍️📱 ¿Manejas en moto y quieres estar conectado? Este Manos Libres Bluetooth para Casco te permite
escuchar música y atender llamadas sin tener que sacar el celular"*. **Sin precio en el copy.**

**Distri Hope** (`1156601450867804`) — 4 anuncios activos, **todos del 26 ago (2 días)** y cada uno
de un producto distinto: casco, tapete de baño, botella térmica, amplificador auditivo. Es un
tester puro, no un vendedor establecido. Va a WhatsApp. El copy del casco es el mejor del barrido:
> *"Si sigues sacando el celular en cada semáforo 🚦, no es que seas precavido, es que tu casco está
> incompleto 😬. Hoy puedes seguir parando, mojándote y perdiéndote... o puedes rodar conectado."*

### Unidad económica

| | Precio | CPA equilibrio | **CPA real Meta** |
|---|---|---|---|
| 1u | $29.99 | $9.50 | **$7.92** |
| 2u | $44.99 | $14.89 | **$12.41** |
| 3u | $54.99 | $16.78 | **$13.99** |

### Veredicto
**Nadie tiene landing, nadie publica precio y nadie lleva más de 6 días al aire.** Eso es un arma
de doble filo: el espacio está libre, pero **no hay ninguna prueba de que el producto venda**. Los
otros cuatro tienen a alguien poniendo plata hace semanas; este no. Además el riesgo de devolución
es real: si el cliente cree que compra un intercomunicador de dos vías y recibe un manos libres
simple, en contra entrega eso se devuelve. La ficha de DROPI es de una línea, no ayuda a definirlo.
**Va último de los cinco.**

---

## 3. Limpia Vidrios Magnético — DROPI 95921

**Ficha DROPI:** proveedor 820 Jorge · costo **$3.50** · sugerido $16 · stock 218 · 5 imágenes.
Descripción del proveedor larga y utilizable: imanes ajustables a distintos grosores de vidrio,
**cuerda de seguridad**, paños de microfibra, pensado para ventanas de difícil acceso y edificios
altos. Es la mejor ficha de los cinco.

**Velocidad:** 10.1 u/día · 6/6 ventanas · concentración 35%. **Múltiplo 8.6x sobre costo.**

### Anunciantes

**Lovenia Ecuador** (`815889488285400`) — **el competidor más profesional de todo el barrido.**
- Shopify propio `loveniaoficial.com`, marca registrada **LumiGlass®**, producto creado el 07-ago,
  anuncios desde el **15 ago (13 días)**, 4 creativos activos.
- **Oferta: 1u $27.99 (tachado $48.00) · 2u $34.99 (tachado $59.98, "Ahorras $14.99", MÁS VENDIDO).**
  La segunda unidad cuesta solo $7 más — es una oferta agresiva de volumen.
- **Anatomía completa de su landing** (para copiar la estructura):
  1. Barra corrediza de garantías (compra segura · contra entrega · devolución fácil)
  2. Hero: nombre, promesa de una línea, precio + tachado
  3. 4 tarjetas de beneficio, una de ellas escrita como pregunta: *"¿Hace cuánto que no limpias el
     exterior de tus ventanas?"*
  4. **★ 4.8 / 5 · +1.200 reseñas verificadas**
  5. Bloque de oferta **"COMPRA MÁS, AHORRA MÁS"** con las dos tarjetas
  6. "¿TE IDENTIFICAS?" (problema) → "LA SOLUCIÓN"
  7. Video del producto en acción
  8. FAQ de producto (3 preguntas)
  9. "CÓMO FUNCIONA" en 3 pasos numerados y desplegables
  10. Antes/después con disclaimer *"imágenes ilustrativas, los resultados pueden variar"*
  11. Tres contadores porcentuales (recomiendan / ahorro de tiempo / seguridad)
  12. **Testimonios como capturas de conversación de WhatsApp** con el número difuminado — lo más
      creíble y lo más barato de producir de toda la página
  13. Tabla comparativa LumiGlass® vs "otros productos"
  14. FAQ de compra y envío (4 preguntas)
  15. **Garantía de 30 días** en bloque grande
  16. Reseñas con nombre, ciudad (Quito…) y sello "compra verificada"

**Aripai** (`2021522034605495`) — WhatsApp, **desde el 25 jul (34 días)**, tienda multiproducto
(repelente de cucarachas, kit aguaje, cables). **Publica precio en el anuncio:
1u $30.00 · 2u $45.00.** Ángulo del miedo: *"¿Cansado de arriesgarte o hacer malabares para limpiar
tus ventanas por fuera? Dile adiós al peligro"*.

### Unidad económica

| | Precio | Margen entregado | CPA equilibrio | **CPA real Meta** | Objetivo |
|---|---|---|---|---|---|
| 1u | $29.99 | $20.11 | $12.16 | **$10.14** | $5.07 |
| 2u | $44.99 | $31.61 | $20.21 | **$16.84** | $8.42 |
| 3u | $54.99 | $38.11 | $24.76 | **$20.64** | $10.32 |

### Veredicto
**El mejor margen de los cinco, con diferencia.** Dos competidores independientes, uno con 34 días
y otro con 13, ambos con precio en la misma banda ($28-$30): demanda validada y precio anclado, que
es exactamente lo que se busca. Lovenia ya hizo el trabajo de estructura de landing. La contra es el
stock de 218 y que Lovenia es un rival serio, no una tienda de WhatsApp improvisada.

---

# AVANORA

## 4. Reparador de Esmalte Dental — DROPI 155190

**Ficha DROPI:** proveedor 123951 ALMA FIT · costo **$4.99** · sugerido $12 · stock 323 (era 404 el
25-ago) · 3 imágenes.
Producto real: **"ADVANCED ENAMEL REPAIR"**, fórmula líquida de cuidado oral con
**Nano-Hidroxiapatita + Teobromina**. La ficha promete: remineralización del esmalte, protección
contra sensibilidad al frío/calor, frescura prolongada. **No promete blanqueamiento** — eso es
importante, porque blanquear sí es promesa estética restringida y remineralizar no.

**Velocidad:** 43.4 u/día · **6/6 ventanas** · concentración 29%.

### Anunciantes

**Guambra STORE** (`718728491326783`) — **29 anuncios activos, todos del mismo producto.**
Cadencia de tandas nuevas sin parar: 26-jul, 30-jul, 4-ago, 10-ago, 13-ago, 15-ago, 18-ago, 22-ago,
25-ago, 26-ago. **Un mes largo poniendo plata cada 2-3 días es la señal más fuerte de todo el
barrido.**
- **TODOS sus anuncios van a `API.WHATSAPP.COM`. No tiene landing web.**
- Ángulo: pérdida y costo futuro.
  > *"🚨 ¿Esperarás hasta perder un diente para empezar a cuidarlo? Tus dientes naturales son únicos.
  > Cuidarlos a tiempo siempre será una mejor decisión que esperar a necesitar tratamientos más
  > complejos. Con Dental Cavity Healing Tooth Armor, enriquecido con Nano Hidroxiapatita…"*
- Titular del anuncio: *"Innovación para el cuidado dental 🔴"* · descripción: *"Top Ventas en
  Amazon USA 🇺🇸"* y *"#1 de ventas en Amazon USA"*. **Eso es prueba social prestada de un tercero
  — no se copia.**
- **No publica precio.**

**Ecuamarket** (`756661960866678`) — 21 anuncios activos, tienda multiproducto por WhatsApp.
Su anuncio dental corre **desde el 9 jul: 50 días.** Ángulo distinto, de carencia:
> *"🚨 ¡ATENCIÓN! TU PASTA DENTAL PODRÍA ESTAR HACIENDO SOLO LA MITAD DEL TRABAJO. La mayoría de
> pastas dentales únicamente limpian, pero NO ayudan a fortalecer el esmalte dental. ❌ Sensibilidad
> al frío o al calor ❌ Dientes con apariencia desgastada ❌ Mal aliento constante."*
- **Precio público: $29 la unidad**, envío gratis, paga al recibir.
- Contexto de quién es: la misma página vende un **JBL Boombox 4 falsificado a $78** y **Dr Melaxin
  a $28**. No es una marca, es un revendedor.

**Compra Fácil EC** (`872039429330103`) — entró el **27-ago con 15 creativos de golpe**. Es lo que
llevó el conteo de la categoría de 11 anuncios (25-ago) a 17.

### Unidad económica — CORREGIDA

El informe del 25-ago asumió $19.99 y salía un CPA de $3.43, que hacía inviable la unidad suelta.
**El precio real del mercado es $29.** Cambia todo:

| | Precio | Margen entregado | CPA equilibrio | **CPA real Meta** | Objetivo |
|---|---|---|---|---|---|
| 1u | $29.00 | $17.63 | $10.43 | **$8.69** | $4.34 |
| 2u | $39.99 | $23.63 | $14.63 | **$12.19** | $6.09 |
| 3u | $49.99 | $28.64 | $18.13 | **$15.11** | $7.56 |

### Riesgo de Meta
🟡 manejable. Guambra lleva 50 días diciendo "fortalece el esmalte", "favorece la remineralización",
"ayuda a proteger" — verbos de apoyo, nunca de tratamiento, y nunca "blanquea". Ese es el registro
exacto que hay que usar. Lo que **no** se copia: "Top Ventas en Amazon USA".

### Veredicto
**50 días de pauta continua y los dos anunciantes fuertes mandan a WhatsApp.** Es el mismo hueco que
se detectó con el Inositol en agosto y que sigue sin explotarse: una landing web propia contra
vendedores de WhatsApp es ventaja estructural, no táctica.

---

## 5. Ejercitador Pélvico con pantalla digital — DROPI 104158

**Ficha DROPI:** proveedor 9440 IMPORSHOP · costo **$4.60** · sugerido $5 · **stock 1.373** ·
3 imágenes (2 PNG + 1 GIF).

**⚠️ Lo más importante de todo este informe:** el clasificador de riesgo NO le pone etiqueta porque
mira el nombre, pero **la ficha del proveedor dice textualmente**: *"potenciar el placer sexual"*,
*"mejora la lubricación natural"*, *"potencia el placer y la sensibilidad"*, *"algunos modelos
incluyen vibración con niveles ajustables"*. En Meta eso es salud sexual, que es una de las
categorías donde pega más duro. **Se puede vender, pero solo con el registro de suelo pélvico,
postparto e incontinencia — nunca el de placer.** El único competidor lo entendió y lo hace así.

**Velocidad:** 25.1 u/día · 6/6 ventanas · concentración 32%. **Stock 1.373: el único de los cinco
que aguanta escalar sin cambiar de proveedor.**

### Anunciante (uno solo)

**Velora** (`1170253832847621`) — 9 anuncios, **todos creados el 24 ago: 4 días**. Página de un solo
producto. Landing propia `plusvelora.com/products/ejercitador-pelvico-pantalla-digital` (Shopify con
apenas 2 productos en total).

Copy, quirúrgicamente Meta-safe — vale la pena leerlo entero porque es la plantilla:
> *"¿Y si fortalecer tu suelo pélvico pudiera ser parte de una rutina sencilla? 💜 Los ejercicios
> Kegel son conocidos. El verdadero reto muchas veces está en mantener la constancia y saber cómo
> vas progresando. ✨ Pantalla digital: cuenta tus repeticiones mientras entrenas. 💪 Resistencia
> ajustable. 🏠 Desde casa."*

Cero mención de placer, cero mención de sexo. Todo el peso está en **constancia + medición**.

**Oferta: $28, una sola opción. Sin combos.**

### Su landing, y dónde está floja

Lo que tiene: escasez (*"ATENCIÓN: SOLO 7 unidades quedan en stock"*), 3 testimonios cortos arriba,
sección "Fortalece desde casa", 5 testimonios largos con nombre, tres tarjetas de mecanismo,
tabla comparativa, tres porcentajes (90% / 88% / 91%) con disclaimer, "¿Cómo usarlo?" en 4 pasos,
y un widget de reseñas 4.8 con 5 opiniones.

Dónde está floja — y todo esto es terreno libre:
- **Sin combos.** Una sola unidad a $28. No hay 2x ni 3x.
- **Las 5 reseñas del widget están traducidas y son de otro producto**: hablan de *"músculos
  aductores de las piernas, nalgas laterales y abductores"*, *"bíceps internos y externos, hombros
  y pectorales"*. Son de un ejercitador de muslos de AliExpress. Un lector atento las descarta.
- **Sin garantía visible.**
- **Sin FAQ** — y este producto tiene objeciones obvias (higiene, tallas, si duele, si sirve
  después de cesárea).
- **Sin antes/después ni timeline de resultados.**
- La home del sitio todavía dice *"Ninguna tienda te vende como **EcomGame**"* — nombre de la
  plantilla que no borraron.

### Unidad económica

| | Precio | Margen entregado | CPA equilibrio | **CPA real Meta** | Objetivo |
|---|---|---|---|---|---|
| 1u | $28.00 | $17.02 | $10.00 | **$8.33** | $4.17 |
| 2u | $39.99 | $24.41 | $15.17 | **$12.64** | $6.32 |
| 3u | $49.99 | $29.81 | $18.95 | **$15.79** | $7.90 |

### Veredicto
Stock enorme, competencia de un solo anunciante con 4 días de vida, dolor real y poco atacado
(incontinencia postparto), y una landing rival con agujeros grandes. **Pero 4 días no prueban nada:**
nadie ha demostrado todavía que este producto venda en Ecuador. Es la apuesta de mayor techo y menor
evidencia de los cinco.

---

# Recomendación

### Primero: **TRUQUITO → Limpia Vidrios Magnético (95921)**
Mejor margen de los cinco por lejos ($10.14 en la unidad suelta, $16.84 en el combo de 2), múltiplo
8.6x, y **dos competidores independientes con 34 y 13 días** que fijaron el precio en $28-$30. La
demanda está probada y el precio está anclado — es la combinación que casi nunca aparece junta.
Lovenia ya te armó la estructura de landing completa, incluidos los testimonios en formato captura
de WhatsApp, que son baratos de producir y muy creíbles.
**Lo que hay que resolver:** stock 218. Antes de lanzar, preguntar reposición al proveedor 820.

### Segundo: **AVANORA → Reparador de Esmalte Dental (155190)**
**50 días de pauta continua** y ninguno de los dos anunciantes con dinero tiene landing web: los dos
mandan a WhatsApp. Ese es el hueco. Además corrige el error del informe de ayer: el precio real es
$29, no $19.99, y el CPA real de la unidad suelta es **$8.69**, no $3.43 — o sea que **sí aguanta
vender de a una**, no obliga combo desde el día uno.
**Lo que hay que resolver:** el copy vive o muere en el registro. Verbos de apoyo (fortalece,
favorece, ayuda a proteger), nunca de tratamiento, nunca "blanquea", nunca "Amazon USA".

### Después, en este orden
3. **Gafas Bluetooth** — buen margen y un solo rival, pero hay que cambiar de SKU por stock (134062
   o 167974) y confirmar si el lente es fotocromático, que es la mitad del ángulo que funciona.
4. **Ejercitador pélvico** — el de mayor techo (1.373 de stock, competencia de 4 días, landing rival
   con agujeros) y el de menor evidencia. Y la ficha del proveedor obliga a un copy muy cuidado.
5. **Manos libres para casco** — nadie tiene landing, pero tampoco nadie lleva más de 6 días.
   Espacio libre sin prueba de demanda, y con riesgo de devolución si el cliente espera un
   intercomunicador de dos vías.

**Y sigue en pie lo de ayer:** el Drenaje está en stock 0 con la campaña armada, la Freidora va en
97 unidades y el Inositol lleva 14 días con todo listo y en pausa. Estos cinco productos no valen
nada mientras no haya un CPA real medido contra pedidos reales.
