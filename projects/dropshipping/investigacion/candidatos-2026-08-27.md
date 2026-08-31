# Candidatos a lanzar — barrido del 2026-08-27

Fase 0 del método (`.claude/skills/investigacion-producto`). El barrido total de anunciantes y el
destripe de landings se hace sobre el elegido, no sobre los veinte.

**Datos:** snapshot fresco de DROPI bajado hoy (`snapshot-2026-08-28.json`, 34.489 productos) contra
los 6 anteriores → **6 ventanas de medición entre el 8 y el 27 de agosto**. Métrica: `consistencia.js`
(baja en ≥75% de las ventanas, ninguna concentra >60% del movimiento, stock ≥150).
Competencia: biblioteca de anuncios de Meta, Ecuador, solo ACTIVOS, consultada hoy.

---

## ⛔ Dos cosas que hay que resolver antes de elegir producto nuevo

### 1. El Drenaje Aurelys (168103) está en STOCK 0

Es el producto con el que Avanora iba a arrancar: landing en vivo, campaña `120251984830830787`
rearmada el 26-ago con 3 anuncios nuevos aprobados, `location_types` arreglado. **El proveedor se
quedó sin inventario.** Si se enciende esa campaña mañana, se paga tráfico a una página que no
puede despachar.

Reemplazo directo, mismo producto, otro proveedor:

| Producto | DROPI | Proveedor | Costo | Stock | u/día | Ventanas |
|---|---|---|---|---|---|---|
| **Aurelis \| Drenaje Linfático** | **168026** | 127358 Azoria | $5.99 | 367 | 49.4 | 5/6 |
| Weruvia \| Lymphatic | 168015 | 127358 Azoria | $5.99 | 282 | 23.6 | 6/6 |
| DRENAJE LINFATICO | 155616 | 138253 pharma | $6.50 | 871 | 18.9 | 6/6 |

⚠️ Pero el mercado cambió: **435 anuncios activos de drenaje linfático en Ecuador hoy** (el 14-ago
eran ~170 de 16 anunciantes). Y la marca **Aurelys** abrió página propia (`1218779307991410`) y está
pauteando ella misma en Ecuador desde hoy. Ya no es un mercado de tiendas COD chicas.

### 2. La Freidora con Canasta (133468) va en stock 97

Único producto en vivo de Truquito. Estaba en 178 el 25-ago. A 81 u/día de velocidad de catálogo,
eso es un producto que se apaga solo en días. Hay que decidir: conseguir otro proveedor de la misma
freidora, o tener el reemplazo listo.

---

## AVANORA — top 10

| # | Producto | DROPI | Costo | Stock | u/día | Ventanas | Conc. | Riesgo Meta |
|---|---|---|---|---|---|---|---|---|
| 1 | Aurelis \| Drenaje Linfático | **168026** | $5.99 | 367 | 49.4 | 5/6 | 28% | 🔴 tratamiento corporal |
| 2 | FARMAPROX 30 CAPS | **102479** | $3.25 | 1.331 | 48.8 | **6/6** | 24% | 🔴 claim médico |
| 3 | Reparador Esmalte Dental | **155190** | $4.99 | 323 | 43.4 | **6/6** | 29% | 🟡 promesa estética |
| 4 | Selerb NAD For Men 60 caps | **148154** | $4.00 | 760 | 30.4 | 5/6 | 26% | 🔴 suplemento |
| 5 | Nadpromax 60 caps | **139660** | $5.00 | 844 | 28.0 | 5/6 | 34% | 🔴 suplemento |
| 6 | 7 DAYS NAILS Endurecedor de Uñas | **120451** | $2.99 | 2.624 | 25.9 | **6/6** | 26% | 🟢 sin etiqueta |
| 7 | Ejercitador Pélvico (pantalla digital) | **104158** | $4.60 | 1.373 | 25.1 | **6/6** | 32% | 🟢 sin etiqueta |
| 8 | Zamia Elixir Antiedad | **114715** | $3.99 | 1.474 | 20.6 | **6/6** | 27% | 🟢 sin etiqueta |
| 9 | Removedor de Lipomas en Spray | **123274** | $3.99 | 520 | 20.6 | **6/6** | 32% | 🟡 condición médica |
| 10 | Plantillas de crecimiento | **122493** | $2.00 | 6.543 | 21.0 | **6/6** | 46% | 🟢 sin etiqueta |

### Unidad económica (flete plano $6.36, entrega 70%, CPA ya dividido por 1.2)

| Producto | 1 unidad | 2 unidades | 3 unidades |
|---|---|---|---|
| Drenaje 168026 | $28 → **$7.52** | $35 → **$8.11** | $50 → **$13.37** |
| FARMAPROX | $24.99 → **$7.36** | $34.99 → **$11.30** | $44.99 → **$15.24** |
| Esmalte dental | $19.99 → **$3.43** | $27.99 → **$5.19** | $34.99 → **$6.36** |
| NAD Selerb | $24.99 → **$6.93** | $34.99 → **$10.43** | $44.99 → **$13.93** |
| Nadpromax | $24.99 → **$6.34** | $34.99 → **$9.26** | $44.99 → **$12.18** |
| 7 Days Nails | $19.99 → **$4.60** | $27.99 → **$7.52** | $34.99 → **$9.86** |
| Ejercitador pélvico | $24.99 → **$6.58** | $34.99 → **$9.73** | $44.99 → **$12.88** |
| Zamia Elixir | $24.99 → **$6.93** | $34.99 → **$10.44** | $44.99 → **$13.95** |
| Lipomas | $24.99 → **$6.93** | $32.99 → **$9.27** | $39.99 → **$11.03** |
| Plantillas crecimiento | $19.99 → **$5.18** | $27.99 → **$8.68** | $34.99 → **$11.59** |

⚠️ **Los precios son anclas de mercado tomadas de la competencia, no precios verificados.** El precio
real sale del destripe de landings, que es fase 1 del producto elegido. El `precioObjetivo` de la
calculadora NO sirve para fijar precio (con costo $2.00 devuelve $33.87 = 17x).

### Competencia hoy

- **FARMAPROX (#2)** — el movimiento más parejo de todo el catálogo: 6/6 ventanas y la ventana mayor
  es apenas el 24% del total. En Meta hay **1 solo anuncio activo** de apitoxina en Ecuador
  (`MultiCombo`, "Crema Beevana 2x1"). Demanda real sin nadie peleando el espacio. **El precio que
  pone Meta es el problema**, no el mercado: gel de veneno de abeja vendido como analgésico
  antiinflamatorio es claim médico directo. Se vende como "movilidad y bienestar articular", nunca
  como tratamiento del dolor.
- **Esmalte dental (#3)** — era el hallazgo del 25-ago con 11 anuncios. **Hoy son 17, y 15 de ellos
  los subió `Compra Fácil EC` (page `872039429330103`) HOY**. Alguien está escalando en tiempo real.
  Sigue siendo demanda probada, pero con CPA máx de $3.43 en la unidad suelta obliga combo desde el
  día uno y ya no tiene el espacio que tenía hace dos días.
- **NAD+ (#4)** — 28 anuncios. Lo importante es la permanencia: `Boostiva Hombres` lleva **~4,8
  meses** al aire y `VitaGlow` **~2,2 meses**. Además apareció **`Selerb Men - Complex`**
  (`1160783480460532`), la marca pauteando directo. Mercado probado, avatar (hombre 35-55) que el
  pixel de Avanora todavía no tiene. Ojo: `Shoppi Store` vende **3 por $30**, eso ancla el precio
  hacia abajo.
- **7 Days Nails (#6)** — 6 anuncios. `Beauty Store` lleva ~2,5 meses con el mismo copy
  ("firmeza y brillo en 60 segundos, sin acrílicos") y `Space Shop` entró hoy. Poca competencia,
  demanda sostenida, **y es el mejor del top sin etiqueta de riesgo**. Múltiplo 6.7x sobre costo.
- **Ejercitador pélvico (#7)** — **2 anuncios activos en todo Ecuador** (`Velora`). Stock 1.373.
  Postparto es un dolor enorme y prácticamente sin atacar. Zona gris de Meta con el copy equivocado
  (salud sexual): se vende como recuperación postparto y suelo pélvico, no como rendimiento.
- **Zamia Elixir Antiedad (#8)** — la búsqueda de "elixir antiedad / serum facial" en EC devolvió
  **0 anuncios activos**. Costo $3.99 con 6/6 ventanas y 1.474 de stock. Es el hueco más limpio de
  la lista, con la contra de que no hay competencia de la cual copiar ángulo probado.
- **Lipomas (#9)** — 3 anuncios activos y **los tres en COP** (Colombia), ninguna tienda ecuatoriana.
  El antes/después se vende solo. También el más expuesto: "lipoma" es condición médica y ahí no
  manda Meta, manda ARCSA.
- **Plantillas de crecimiento (#10)** — 5 anuncios (`MegaTrend` hoy, `DSDC` desde ~08-05). Va décimo
  por la concentración de 46%: casi la mitad del movimiento cayó en una sola ventana.

---

## TRUQUITO — top 10 (todos Meta-safe, sin etiqueta de riesgo)

| # | Producto | DROPI | Costo | Stock | u/día | Ventanas | Conc. |
|---|---|---|---|---|---|---|---|
| 1 | Trapeador 360 Reforzado + 2 mopas | **114451** | $7.41 | 904 | 31.0 | **6/6** | 33% |
| 2 | PISTOLA PARA SOLDAR | **146308** | $10.08 | 662 | 21.7 | **6/6** | 36% |
| 3 | CEPILLO DE MASCOTA | **77349** | $2.99 | 996 | 22.2 | 5/6 | 27% |
| 4 | Plancha a vapor portátil | **93462** | $4.90 | 524 | 23.3 | **6/6** | 25% |
| 5 | Linterna táctica recargable | **152230** | $2.73 | 1.547 | 18.3 | 5/6 | 34% |
| 6 | Ropero closet armario 3 cuerpos | **86793** | $11.90 | 3.233 | 15.7 | **6/6** | 31% |
| 7 | Gafas Bluetooth c/ audífono interno | **118920** | $6.25 | 159 | 11.8 | **6/6** | 28% |
| 8 | Manos libres Bluetooth para casco | **149592** | $7.30 | 253 | 8.6 | **6/6** | 37% |
| 9 | Limpia vidrios magnético | **95921** | $3.50 | 218 | 10.1 | **6/6** | 35% |
| 10 | Set 4 Libros Mágicos Caligrafía | **142615** | $2.15 | 296 | 10.3 | 5/6 | 36% |

### Unidad económica

| Producto | 1 unidad | 2 unidades | 3 unidades |
|---|---|---|---|
| Trapeador 360 | $24.99 → **$4.94** | $34.99 → **$6.45** | $44.99 → **$7.96** |
| Pistola soldar | $29.99 → **$6.30** | $44.99 → **$9.17** | $59.99 → **$12.04** |
| Cepillo mascota | $19.99 → **$4.60** | $27.99 → **$7.52** | $34.99 → **$9.86** |
| Plancha vapor | $22.99 → **$5.24** | $31.99 → **$7.63** | $39.99 → **$9.44** |
| Linterna táctica | $19.99 → **$4.75** | $27.99 → **$7.83** | $34.99 → **$10.32** |
| Ropero closet | $34.99 → **$8.15** | $49.99 → **$9.96** | $64.99 → **$11.77** |
| Gafas Bluetooth | $29.99 → **$8.53** | $44.99 → **$13.64** | $59.99 → **$18.74** |
| Manos libres casco | $29.99 → **$7.92** | $44.99 → **$12.41** | $59.99 → **$16.90** |
| Limpia vidrios | $22.99 → **$6.05** | $29.99 → **$8.09** | $36.99 → **$10.14** |
| Libros mágicos | $19.99 → **$5.09** | $27.99 → **$8.50** | $34.99 → **$11.33** |

### Competencia hoy

- **Trapeador 360 (#1)** — el más vendido del catálogo Meta-safe con 6/6 ventanas. `Chulla Tienda
  Ecuador` tiene 7 creativos de esta semana ("Trapeador SPIN MOP 360° + 2 Mopas") y hay ~8 páginas
  más rotando (`Veta Ecuador`, `Drophot`, `AMC Importaciones`, `Multi Hogar`, `Olivia Importadora`).
  Varios chicos, ninguno dominante. **El costo de $7.41 se come el margen suelto: a 1 unidad el CPA
  máx es $4.94.** El negocio está en el combo de 2.
- **Pistola para soldar (#2)** — **5 anuncios activos y 4 son de páginas en BRL** (arbitraje
  brasileño con copy traducido). Competencia ecuatoriana real: ninguna. Ticket alto, nicho masculino,
  espacio libre. El mejor "hueco limpio" de la tienda.
- **Cepillo de mascota (#3)** — **entra nuevo al ranking, no estaba en el barrido del 25-ago.**
  22,2 u/día a costo $2.99 (múltiplo 6.7x) y **solo 2 anuncios activos** (`Fastbuy` hoy,
  `Tienda Punto` desde ~08-12). Demo visual perfecta para el formato "el truquito de hoy": pasas el
  cepillo, sale la bola de pelo. Es el que mejor calza con la razón de ser de Truquito.
- **Plancha a vapor (#4)** — **era LA recomendación del 25-ago y hay que bajarla de puesto.**
  La competencia pasó de **21 a 41 anuncios activos en dos días**: `Visia Agency`, `Nexs Tienda`
  ($29.90), `Marketgo` y `Mi Veci` entraron todos hoy o ayer, sobre los que ya estaban
  (`Tana Multishop`, `Guambra Tienda`, `Import ISMA`). Los números del producto siguen impecables
  (25% de concentración, el movimiento más parejo del catálogo); lo que se rompió es el espacio.
- **Linterna táctica (#5)** — 10 anuncios (`Importadora MyE` hoy, `Tiendaecomerce.digital`,
  `Infinity SHOP`, `Ecuador shopping`, `Tiendaoline` desde ~junio). Costo $2.73 con sugerido $18:
  múltiplo enorme y stock de 1.547.
- **Ropero closet (#6)** — `Veta Ecuador` lleva 9 creativos desde el ~14-ago, es el único fuerte.
  **CPA máx $8.15 en la unidad suelta, el mejor de la tienda a 1 unidad** por el ticket alto.
  El riesgo es el volumen del paquete en contra entrega.
- **Gafas Bluetooth (#7)** — el mejor margen de las dos tiendas (CPA máx $13.64 a 2 unidades).
  8 anuncios: `Shopiverso` entró hoy con buen hook, `NovaeShop` lleva ~2 semanas y
  `Mercado Online Ecuador` ~2,5 meses. **Stock 159: alcanza para el test, no para escalar.**
- **Manos libres para casco (#8)** — 8 anuncios, `Mi Tiendita 593` desde el ~19-ago con 7 creativos
  y `Distri Hope` entró hoy. Avatar motorizado, que en Ecuador es enorme y Truquito no ha tocado.
- **Limpia vidrios magnético (#9)** — 5 anuncios (`Lovenia Ecuador` con 4 creativos de hoy, `Aripai`
  desde ~07-25). Demo visual fuerte, stock corto (218).
- **Libros Mágicos de Caligrafía (#10)** — 10 anuncios, `DSDC Moquetas` desde ~08-05 y `Tinkutienda`
  esta semana. Temporada escolar de la Sierra. Costo $2.15. Stock 296: test, no escala.

**En la banca:** Plantillas Highpads (135500, $4.00, 644 stock, 12.7 u/día, 6/6) — la búsqueda de
"plantillas de altura" devolvió 0 anuncios activos y el CPA máx es $6.93 a 1 unidad. Buen hueco,
queda fuera del top 10 solo por velocidad.

---

## Descartados a propósito

| Producto | u/día | Por qué no |
|---|---|---|
| Aire acondicionado portátil (133935) | 29.4 | Segundo en velocidad, pero la pauta activa de "aire acondicionado portátil" en EC son páginas de arbitraje vendiendo humo. El cliente espera un aire y recibe un enfriador de escritorio: en contra entrega eso es devolución |
| Mini cámara espía A9 (139629) | 19.0 | Meta prohíbe vigilancia encubierta. Un strike se lo come el pixel de Truquito, que existe justamente para no tener strikes |
| PARLANTE CHARGE 5 (143279) | 10.5 | Es una falsificación de JBL. Al riesgo de Meta se le suma denuncia de marca |
| ENVIO PRIORITARIO (108321) | 18.1 | No es un producto, es un cargo de servicio del proveedor |
| ASPIRADORA INALÁMBRICA (146316) | 13.8 | 3.745 de stock moviéndose a 14 u/día: el proveedor está sentado sobre mercadería parada |
| Pets Visión (79722) | 9.4 | 48.893 unidades de stock. Mismo caso, en grande |
| Cuchillo Tazaki (113116) | 9.2 | Ya se usa como regalo del combo de Truquito |
| Glucosamina Forte 10en1 (159590) | 20.4 | Números buenos, pero **155 anuncios activos** en EC, con advertoriales de arbitraje (`piloke Anatole Sigmund 7598`) inflando el CPM de toda la categoría |
| Shilajit (varios) | 14-16 | **303 anuncios activos.** Categoría tomada por vitalidad masculina y testosterona |
| Colágeno / Lemme Burn / retardmacho / Testomax | 16-18 | Pérdida de peso y salud sexual: las dos categorías donde Meta pega más duro, y con la cuenta de Avanora sin historial de Purchase no es el momento |
| Adaptador autodesconexión (172314) | 6.6 | 59% del movimiento en una sola ventana: al borde del filtro |
| Máscara protectora facial (121221) | 10.2 | CPA máx $4.30 en la unidad suelta y stock 173 |

---

## Recomendación

**Truquito → CEPILLO DE MASCOTA (77349).** Múltiplo 6.7x, 22 u/día sostenidos, **2 anuncios activos
en todo Ecuador**, y es demo visual pura, que es exactamente el formato orgánico que Truquito
necesita para bajar dependencia de ads. La plancha a vapor era la recomendación de hace dos días y
hoy tiene 41 anunciantes encima: el producto no cambió, cambió el espacio.

**Avanora → 7 DAYS NAILS (120451) si se quiere jugar seguro, FARMAPROX (102479) si se quiere jugar
fuerte.** El de uñas es el mejor de la lista sin etiqueta de riesgo, con 6 anuncios de competencia y
un anunciante que lleva 2,5 meses probando que el mercado paga. El FARMAPROX tiene el movimiento más
consistente del catálogo entero y 1 solo competidor, pero es apitoxina con claim médico: se gana o se
pierde en cómo esté escrito el copy.

**Pero antes que cualquiera de los veinte:** el Drenaje está en stock 0 con la campaña armada y
lista, la Freidora va en 97 unidades, y el Inositol lleva desde el 14 de agosto con landing, campaña
y anuncios aprobados **sin encenderse**. La tasa de entrega del 70% sigue siendo un supuesto
inventado y **ningún número de este documento vale nada hasta que se mida contra pedidos reales**.
