# Proyector Navideño — investigación 2026-10-07

Notas crudas de la Fase 1 (biblioteca de anuncios) y Fase 2 (landings). El informe final es el PDF.

## Producto en DROPI (fotos revisadas una por una)

Los 6 proveedores venden el MISMO cuerpo: cilindro negro 11 × 12 cm, soporte en U, 16 diapositivas
navideñas, cabezal giratorio. **Diferencia que importa: la alimentación.**

| ID | Proveedor | Costo | Stock 07-oct | Alimentación | Nota |
|---|---|---|---|---|---|
| 120477 | Nova (68783) | $6.00 | 133 (250 el 06-oct) | **enchufe 110 V** (foto REAL) | el que más vende: ~58 u/día desde 28-sep, se está vaciando |
| 196071 | Nova (68783) | $6.00 | 100 | enchufe 110 V | "VIP", misma ficha y fotos que 120477 |
| 192919 | Provedix (23538) | $5.99 | 376 | **USB** (foto de caja con cable USB) | 412→376 |
| 192706 | 1001 (Guayaquil) | $6.50 | 462 | USB (foto 18) | |
| 185389 | 1001 (Guayaquil) | $7.00 | 252 | por confirmar | ficha habla de "fachada, intemperie" |
| 185360 | 1001 (Guayaquil) | $7.00 | 236 | por confirmar | |

⚠️ La landing NO puede prometer "enchufe" si se despacha el USB, ni viceversa. Ninguna ficha dice
impermeable para el mini — no prometer lluvia/exterior.

## Fase 1 — biblioteca de anuncios (sin sesión de Facebook)

Método: sin login, `view_all_page_id` devuelve vacío. Se descubrieron anunciantes con 6-7 palabras
clave por país y cortes por `start_date[max]` (el `min` no se respeta, el `max` sí) para sacar los
más viejos, que el orden por impresiones esconde. 250 anuncios únicos en EC/CO/MX.

**Hallazgo central: en Ecuador NINGÚN anuncio de proyector arrancó antes del 16-sep-2026.**
La temporada tiene 3 semanas, no hay ganador asentado. En CO hay dos con historia: Nesimú Shop
(desde 21-nov-2025) y EMI Shop (desde 02-nov-2025) — los dos de la Navidad pasada que nunca apagaron.

### Ecuador (~140 activos)
| Anunciante | page_id | Nº vistos | Más viejo | CTA | Oferta | Landing |
|---|---|---|---|---|---|---|
| Blue HOME | 61574757730764 | 5 | 18-sep | web | — | bh-ecuador.myshopify.com/products/proyector |
| Molly Store Online | 100095145342325 | 20 | 22-sep | WA | — | — |
| Juan Recomienda | 61575094332091 | 2 | 24-sep | web | — | tucompraseguro.com/products/proyector-magico |
| TIGO | 100083168269235 | 1 | 26-sep | WA | $18 | — |
| Findex Market | 61584231076986 | 3 | 27-sep | WA | — | — |
| La Ruta Del Descuento | 61579084300537 | 13 | 28-sep | WA | — | — |
| Mao Importaciones | maodistribuidora | 4 | 30-sep | WA | 2 × $34 | — |
| De TU LADO EC | 61594555010515 | 3 | 30-sep | WA | 1 $24.99 / 2 $39.99 / 3 $49.99 | — |
| Ecu Recomienda | 61577484462760 | 2 | 01-oct | web | 2x1 | casatarefecuador.com/products/proyector-navideno |
| Alcar Store EC | 61593678208097 | 1 | 01-oct | WA | — (USB) | — |
| Dr. Carlos Herrera | 61591730559045 | 7 | 01-oct | WA | — (USB) | — |
| Tienda Virtual Mao | 100067122197182 | 4 | 01-oct | WA | — | — |
| Servicemakar | 61564039873273 | 4 | 01-oct | web | — | comprandoec.com/products/proyector-magico-navideno-a-corriente |
| Marketplace BM | marketplacebm357 | 3 | 02-oct | WA | (otro: lámpara astronauta) | — |
| Bodelink | 61583294261022 | 2 | 03-oct | WA | 1 $29.99 / 2 $39 | — |
| Prime Auto Parts Emirick | 61593912587002 | 5 | 03-oct | WA | 1 $24 / 2 $35 / 3 $45 | — |
| Shopping Agur Ecuador | 61588342975409 | 1 | 03-oct | web | — | shoppingecuadoragur.myshopify.com/products/proyector-navideno |
| Clickazo | 61584260256169 | 8 | 04-oct | web | — (exterior grande) | clickazooo.myshopify.com/products/proyector-navimagic-pro |
| LifeStyle Shop Ec | 61593680685198 | 7 | 04-oct | Messenger | — | — |
| Omegafy Store | 61592856704047 | 1 | 04-oct | WA | $24.99 (USB) | — |
| Ruizé Store | 61591309125497 | 1 | 05-oct | WA | — | — |
| Comprar en Vitrina EC | 61594576474345 | 1 | 06-oct | WA | 1 $29.99 / 2 $38.99 | — |
| Compralo Ecu | 61556135938820 | 2 | 06-oct | WA | — | — |

Ruido descartado: apps de Play Store (App Trend 01, Not Gonna Lie, Trust Me Bro), YouShop (cargador
de carro), MeelTech (difusor de carro), Universo Led (láser de fiesta $10/$16).

### Colombia (~330 activos con "proyector navideño")
Más viejos: EMI Shop (02-nov-2025, WA), Nesimú Shop (21-nov-2025, nesimu.com), Alexa Recomienda
(22-ago-2026, 9 anuncios → nesimu.com), La tiendita (04-sep, 10 anuncios, WA), E market colombia
(05-sep), Infinit Market (07-sep, infinitmarketco.com), ShoppingMas (14-sep), MundoOfertas GT
(18-sep, ofertascoltiendas.online 2x1), Tienda Nova Hogar.co (23-sep, 7 anuncios, novahogar.co —
**mismo mini USB**, "MagicHoliday™"), Encanto Caribe / NovaDescuentos (shopsline.com.co),
Click y Compra (9, WA). Precios COP: $69.900 / 2×$99.900 (J2), $79.900 (RuizShop),
$82.900 (Mercaonline), $99.000 / 2×$169.000 (Nova Esencial).

### México (~95 activos)
Strong lux (28 anuncios desde 24-sep, stronglux.mx — exterior con control remoto), Benefiyou,
Chhtop (USB), Pide Hoy (USB), Tusti, PromoProductos (9, WA), Super Oferta (compralinea.com.mx),
Clicko, Emma Perez (havantienda.shop).

### Dos productos distintos bajo el mismo nombre
- **Mini proyector de interior** (el nuestro): Blue HOME, Alcar, Dr. Carlos Herrera, Omegafy,
  Comprar en Vitrina, Mao, Nova Hogar (CO), Chhtop/Pide Hoy (MX). Ángulos: pared/techo del cuarto,
  los niños, "no lo juzgues apagado".
- **Proyector de exterior de estaca** (10 m, impermeable, fachada): Clickazo, Servicemakar,
  Juan Recomienda, la mayoría de CO y Strong lux (MX). NO copiar sus claims de lluvia/10 m/fachada.

## Fase 2 — landings destripadas (navegador en modo celular)

**Trampa encontrada:** Blue HOME redirige a temu.com a cualquier visitante de computadora
(`matchMedia("(pointer: fine)")` → `location.replace`). Es anti-espía. Se destripa con viewport
móvil emulado.

### EC — Blue HOME · bh-ecuador.myshopify.com/products/proyector (más viejo de EC, 18-sep)
1 u $26.99 (tachado $53.99) · 2 u $43.18 ("ahorra 20%", oferta más vendida). Landing mínima:
una sola foto cuadrada + selector + formulario COD "PIDE AQUÍ / PAGA EN CASA". Sin reseñas, sin
texto. Le funciona por el anuncio ("NO LO JUZGUES APAGADO"), no por la landing.

### EC — Juan Recomienda · tucompraseguro.com/products/proyector-magico
$35.99 sin tachado. Landing hecha con 3 imágenes largas (banner + 2 bloques, uno generado con
Higgsfield `hf_2026...`). Botón "LO QUIERO AHORA", "Envío gratis y pago contra entrega". Vende el
de exterior ("lo enchufas").

### EC — Ecu Recomienda / CasaTaref · casatarefecuador.com → redirige a tarefecu.shop
**Usa DROPI 39323 (IMPORSHOP)** — sus GIF se llaman `gif_39323_*`. Promo 2x1 como oferta base:
2 u $34.99 ($17.50 c/u, tachado $41.99) · 4 u $55.99 · 6 u $73.48. Envío prioritario +$1.99.
Upsell en el checkout: "Lámpara Saturno LED por $8.99". Copy: "¿Otra vez peleando con las luces
enredadas y la escalera?", "En 1 minuto tu sala se ve como vitrina de centro comercial",
"Lo prendes al anochecer y él trabaja toda la noche". Specs: 16 patrones, giro 360°, cabezal 270°,
**USB**, 10.7 × 11 cm, "a prueba de polvo", "interior y exterior". Modo de uso en 4 pasos (a 1-2 m
de la pared). Garantía: cambio por mal estado al recibir, Servientrega 2-5 días. Prueba social:
capturas de WhatsApp falsas (archivo `Fake_Wsp_General.png` — literal) + sellos.

### EC — Servicemakar · comprandoec.com/products/proyector-magico-navideno-a-corriente
$23.99 (tachado $34.99), 5.0 estrellas. Toda la landing son 6 imágenes: hero (ChatGPT), "sin este
proyector", "solución decorar fácil", **comparativa vs láser**, testimonios, FAQ. Reseñas en texto
genéricas de la tienda ("Karla Z", "Carlos Z", "Mercy P"). Garantía 30 días. Entrega 2-3 días.

### EC — Clickazo · clickazooo.myshopify.com/products/proyector-navimagic-pro
$29.99. Landing = 8 bloques-imagen verticales (decora al instante · ofertas · decora en segundos ·
transforma tu hogar · todo lo que incluye · 4 pasos · **vs luces tradicionales** · clientes felices)
+ cross-sell de reflectores/focos de jardín. Contador "oferta termina en 29 min". Producto de
exterior con estaca.

### EC — Shopping Agur · shoppingecuadoragur.myshopify.com/products/proyector-navideno
$28.60. Landing = 8 bloques-imagen "LUMINAVI_01…08". Barra "ENVÍO GRATIS · 48H · PAGA AL RECIBIR",
contador 3 h, "aliados de envío". Gancho del anuncio: dolor de espalda/escalera.

### CO — Nesimú · nesimu.com (el anunciante con más historia: desde 21-nov-2025)
1 u $89.900 (tachado $140.000, 35% OFF) · 2 u $139.900 "+ bono de $40.000". "(1000+ reseñas)",
"Julia y 1658 personas compraron". Specs del de EXTERIOR: 13 × 15 cm, IP65, AC 85-240 V, 10 m.
**Reseñas con fotos reales en Trustoo fechadas 05-dic-2025** (clientes de la Navidad pasada).
Garantía 60 días. Aviso honesto: "no se puede abrir el paquete antes de pagar".

### CO — Mastyni · ofertascoltiendas.online/products/proyector-navideno-2x1
2x1 a $119.899. "4.9 · 1313 reviews" — inventadas en serie, pero los ÁNGULOS son buenos y nadie
más los usa: **mascotas que juegan con las extensiones**, "me ahorré comprar varias extensiones",
"uno en la sala y otro en el cuarto de los niños", "en la ventana hacia la calle", "apuntando al
techo". "Descuento de pretemporada", "2x1 de liquidación".

### CO — Mundo Store · mundostorecolombia.online/products/proyector-navideno
$74.900 (tachado $149.900), "+100 ventas". Timeline de entrega con fechas (pide hoy → empacado →
entrega estimada). "Oferta especial de preventa: 2 proyectores". Avisan que confirman por WhatsApp.

### CO — Impacto Zone · impactozone.myshopify.com — $89.990, una imagen hero y botón. Nada más.

### CO — Nova Hogar · novahogar.co/products/magicholiday (MISMO mini USB que el nuestro)
$84.900 (tachado $144.900, 41% OFF), "171 valoraciones", "Últimas 16 unidades". Marca inventada
"MagicHoliday™". Specs: LED 4 W, **5 V**, 20.000 h, 16 diseños, plug & play USB. FAQ: ¿difícil de
instalar? / ¿cuántas figuras? / ¿consume mucho? / envío / garantía 30 días.
**Reseñas (traducidas de AliExpress, pero son del producto real) — las objeciones de verdad:**
- "Más pequeño de lo que esperaba, pero sigue siendo lindo" (Roberto A.)
- "Un equipo muy pequeño, pero cumple con su función" (Marilú R.)
- "Son pequeños pero muy hermosos" (Adán P.)
- "Cualquier distancia adicional desde la superficie y la proyección se vuelve…" (borrosa — Felipe V.)
- "Se ve muy padre, claro, más en la noche" (Rocío M.)
- "Se conectan a USB, puede ser una batería, se ven muy bien en la noche" (Sonia T.)
→ **Lección para nuestra landing: decir el tamaño (11 cm) con una foto en la mano, decir que se
luce de noche y a 1-3 m de la pared.** Es la forma de bajar devoluciones en COD.

### CO/MX — textos de descripción (Shopify JSON)
- **All Premium Store (CO)**: el mejor copy de exterior. "La fachada más linda de la cuadra en 2
  minutos". Lista de dolores: subirte al techo, horas desenredando, 4 cajas gigantes en la bodega
  el resto del año, la lluvia daña todo "en plena novena". "Enchufas una cajita de 11 cm".
- **Shopsline (CO)**: "¿Cuánto tiempo vas a perder decorando esta navidad?", "Cambia horas de
  instalación por minutos de magia", escena "Imagina que llega la noche… los niños lo ven".
- **Clicko (MX)**: lista larga de "¿te ha pasado que…?", luces que ya no prenden, ver otras casas
  decoradas y pensar "me encantaría que la mía se viera así".
- **Tusti (MX)**: "¿te da flojera (o miedo) subirte a la escalera?", 50% de descuento.
- **Chhtop (MX)**: el mini USB — 5 V / 1 A, LED 1 W × 4, blanco o negro, "conéctalo a una
  batería externa". $299 MXN (tachado $599).
- **Benefiyou (MX)**: 10.8 cm de alto, 5 W, "USB / conector eléctrico". 1 u $398 · 2 u $628 MXN.
