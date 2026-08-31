# Candidatos a testear — barrido del 2026-08-25

Fase 0 del método (`.claude/skills/investigacion-producto`): elegir QUÉ producto lanzar.
El barrido total de anunciantes y el destripe de landings se hace sobre el elegido, no sobre los diez.

**Datos:** snapshot fresco de DROPI (34.243 productos) contra los 5 anteriores → 5 ventanas de medición
entre el 8 y el 25 de agosto. Competencia: biblioteca de anuncios de Meta, Ecuador, solo activos.

---

## El cambio de método que hubo que hacer

`ranking.js` compara solo los **dos últimos** snapshots, y eso se deja engañar. El primer resultado de
hoy fue "ASHWAGANDHA KSM 66 + GABA — 222 u/día", que habría sido el #1 indiscutible.

Su stock real:

| 08-ago | 11-ago | 13-ago | 15-ago | 21-ago |
|---|---|---|---|---|
| 2.421 | 2.419 | 2.418 | 2.413 | **1.209** |

Ocho unidades en siete días y después 1.204 de un saque. Eso no es demanda: es una compra mayorista,
una corrección o un traslado de bodega. Lo mismo con el "Super GABA" (1.949 → 800). Los dos
**desaparecieron** al medir sobre las 5 ventanas.

Se agregó `consistencia.js`: mide en cuántas ventanas bajó el stock y qué porcentaje del movimiento
cayó en una sola. Pasa el filtro lo que baja en ≥75% de las ventanas sin que ninguna concentre más
del 60%. La validación del método: con esa métrica el **#1 de Truquito es la Freidora con Canasta**
(81 u/día, 5/5 ventanas) — el producto que ya está en vivo y que se eligió a mano.

También se arregló `catalogo.js`: un 502 suelto de la API tiraba abajo la descarga entera (pasó hoy
en la página 26 de 340). Ahora reintenta con espera creciente.

---

## AVANORA — top 5

| # | Producto | DROPI | Costo | u/día | Ventanas | Stock |
|---|---|---|---|---|---|---|
| 1 | Selerb NAD For Men 60 caps | **148154** | $4.00 | 30.8 | 4/5 | 819 |
| 2 | Reparador de Esmalte Dental | **155190** | $4.99 | 44.2 | 5/5 | 404 |
| 3 | Shilajit Ultra | **144256** | $4.50 | 21.6 | 5/5 | 200 |
| 4 | Ejercitador Pélvico (pantalla digital) | **104158** | $4.60 | 25.6 | 5/5 | 1.419 |
| 5 | Removedor de Lipomas en Spray | **123274** | $3.99 | 20.1 | 5/5 | 574 |

### Unidad económica (flete plano $6.36, entrega 70%, CPA ya dividido por 1.2)

| Producto | 1 unidad | 2 unidades | 3 unidades |
|---|---|---|---|
| NAD+ | $24.99 → **$6.93** | $34.99 → **$10.43** | $44.99 → **$13.93** |
| Esmalte dental | $19.99 → **$3.43** | $27.99 → **$5.19** | $34.99 → **$6.36** |
| Shilajit | $24.99 → **$6.64** | $34.99 → **$9.84** | $44.99 → **$13.05** |
| Ejercitador pélvico | $24.99 → **$6.58** | $34.99 → **$9.73** | $44.99 → **$12.88** |
| Lipomas | $24.99 → **$6.93** | $32.99 → **$9.27** | $39.99 → **$11.03** |

⚠️ **Los precios son estimados, no verificados.** El precio de mercado real sale de las landings y
anuncios de la competencia, y eso es fase 1 del producto elegido. Ninguno de estos números se toca
hasta hacer ese paso.

### Competencia

- **NAD+** — 37 anuncios activos. `Essentialshub` (page `173350219190117`) es el que más invierte,
  con tandas repetidas desde el 16-ago. `Import Vitalis` y `Poli Shop` sueltos. Todo el mercado es
  **de este mes**: nadie lleva tiempo, nadie domina. Ángulo libre y avatar que Avanora nunca atacó
  (hombre 35-55, "energía y enfoque").
- **Esmalte dental** — solo **11 anuncios activos**, pero `Guambra STORE` (page `718728491326783`)
  lo pautea **desde el 6-jul con tandas nuevas cada dos semanas** y `OfertaStore` desde el 19-jun.
  Siete semanas al aire es la señal más fuerte de todo el barrido: eso da plata. Poca competencia
  y demanda probada al mismo tiempo — el combo que casi nunca aparece junto.
- **Shilajit** — mismo avatar y mismo ángulo que el NAD+. Es el plan B del #1, no un producto aparte.
- **Ejercitador pélvico** — el único de la lista **sin etiqueta de riesgo** del clasificador y con
  1.419 de stock. Postparto es un dolor enorme y poco atacado.
- **Lipomas** — el más diferenciado visualmente (el antes/después se vende solo). También el más
  riesgoso: "lipoma" es una condición médica, y ahí no manda Meta sino ARCSA.

**Nota de riesgo:** el clasificador no le pone etiqueta al esmalte dental ni al ejercitador porque
las categorías de DROPI mienten, pero los dos entran en zona gris de Meta con el copy equivocado
(blanqueamiento dental / salud sexual). Ver [[feedback_creativos_meta]].

---

## TRUQUITO — top 5

| # | Producto | DROPI | Costo | u/día | Ventanas | Stock |
|---|---|---|---|---|---|---|
| 1 | Plancha a vapor portátil | **93462** | $4.90 | 25.0 | 5/5 | 546 |
| 2 | Trapeador 360 + 2 mopas | **114451** | $7.41 | 32.7 | 5/5 | 942 |
| 3 | Gafas Bluetooth con audífono interno | **118920** | $6.25 | 12.5 | 5/5 | 172 |
| 4 | Pistola para soldar | **146308** | $10.08 | 21.2 | 5/5 | 717 |
| 5 | Aire acondicionado + calefactor 2 en 1 | **133935** | $16.00 | 31.1 | 5/5 | 714 |

### Unidad económica

| Producto | 1 unidad | 2 unidades | 3 unidades |
|---|---|---|---|
| Plancha vapor | $22.99 → **$5.24** | $31.99 → **$7.63** | $39.99 → **$9.44** |
| Trapeador 360 | $24.99 → **$4.94** | $34.99 → **$6.45** | $44.99 → **$7.96** |
| Gafas Bluetooth | $29.99 → **$8.53** | $44.99 → **$13.64** | $59.99 → **$18.74** |
| Pistola soldar | $29.99 → **$6.30** | $44.99 → **$9.17** | $59.99 → **$12.04** |
| Aire 2 en 1 | $39.99 → **$8.68** | $59.99 → **$11.01** | $79.99 → **$13.34** |

### Competencia

- **Plancha a vapor** — 21 anuncios. `Guambra Tienda` (page `400571943144555`) desde el 2-ago con
  7 anuncios, `Tana Multishop` con seis creativos titulados *"Más de 2.789 clientes satisfechos"*,
  `ALCANstore` y `Todo en uno` (*"Ropa impecable en segundos, sin tabla de planchar"*). Varios
  vendedores, ninguno dominante, y el movimiento de stock más parejo de todo el catálogo (la ventana
  mayor es apenas el 26% del total).
- **Trapeador 360** — 24 anuncios. `Chulla Tienda Ecuador` con 7 creativos de esta semana
  (*"Trapeador SPIN MOP 360° + 2 Mopas"*) y **`EJ Store` pauteándolo desde febrero de 2026**. Seis
  meses al aire es un ganador probado. El costo de $7.41 se come el margen suelto: el negocio está
  en el combo de 2.
- **Gafas Bluetooth** — el mejor margen de las dos tiendas por lejos. `Vortex Store Ecuador`
  (page `1223255040872256`) tiene 8 anuncios activos y `Impor Go` vende el ángulo *"Gafas Smart
  estilo Meta"*. Stock 172: alcanza para un test, no para escalar.
- **Pistola para soldar** — competencia casi nula en dropshipping; `Dyvelub` y `Soldamundo` son
  ferreterías reales, no tiendas COD. Nicho masculino, ticket alto y nadie peleando el espacio.
- **Aire acondicionado 2 en 1** — buen margen y stock, pero **la señal de Meta es mala**: casi toda
  la pauta activa de "aire acondicionado portátil" en Ecuador son páginas de arbitraje extranjeras
  (`HealthTrack Daily`, `Celeb chronicles`, `Science A2Z Magazine`) con advertoriales de humo. El
  cliente ecuatoriano espera un aire acondicionado y recibe un enfriador de escritorio. **En contra
  entrega eso es devolución**, y una devolución se come el margen de tres ventas buenas. Va quinto
  por eso, no por los números.

---

## Descartados a propósito

| Producto | u/día | Por qué no |
|---|---|---|
| Boquilla de presión (168979) | 35.3 | **183 anuncios activos**, todos de esta semana (ZENTO, TodoClick, Importadora Imperial, La tiendita, Punto Firme, ECUA SHOP…). Se está saturando en tiempo real y a $17.99 el CPA máximo es $2.84 |
| Mini cámara espía A9 (139629) | 18.6 | Meta prohíbe vigilancia encubierta. Es un strike, y el strike se lo come el pixel de Truquito |
| ENVIO PRIORITARIO (108321) | 16.0 | No es un producto, es un cargo de servicio del proveedor |
| Aspiradora inalámbrica (146316) | 13.8 | 3.776 de stock moviéndose a 14 u/día: el proveedor está sentado sobre mercadería parada |
| Ashwagandha + GABA (139602) | — | Un solo movimiento grande, no venta sostenida. Ver arriba |
| Colágeno (varios) | 20-25 | 2.456 anuncios activos en Ecuador y precio anclado por spas y clínicas |
| Parches kinoki / parches para el dolor | 26-43 | Costo de $0.50-0.85: producto de relleno, tasa de devolución alta en COD |

---

## Recomendación

**Truquito → Plancha a vapor portátil (93462).** Mejor relación entre margen validado y competencia
que el trapeador, movimiento de stock más parejo del catálogo, y es el mismo perfil que ya funcionó
con la freidora: producto de cocina/hogar barato, dolor cotidiano evidente, varios vendedores
chicos y ninguno dominante.

**Avanora → Selerb NAD+ (148154).** El mercado tiene un mes de vida y ningún dominante, el margen
es el mejor de la lista y abre un avatar nuevo (hombre 35-55) que el pixel de Avanora todavía no
tiene. El esmalte dental tiene la demanda más probada de todo el barrido, pero con $3.43 de CPA en
la unidad suelta obliga a vender combo desde el día uno — es el segundo test, no el primero.

**Pero antes que cualquiera de los dos:** el Drenaje y el Inositol tienen landings en vivo, campañas
armadas y anuncios aprobados **desde el 14 de agosto, y siguen en pausa**. Once días. Lanzar un
producto número tres mientras dos están listos y sin encender no es investigación, es procrastinar
con datos. La tasa de entrega del 70% sigue siendo un supuesto inventado y ningún número de este
documento vale nada hasta que se mida contra pedidos reales.
