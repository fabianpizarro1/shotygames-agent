# Estado del proyecto de dropshipping — Avanora Naturals

_Última actualización: 2026-08-14 (segunda revisión)_

Este documento existe para que alguien (o algo) que llega sin contexto pueda entender dónde
está todo sin leer el historial. Si trabajás acá, léelo entero antes de tocar nada.

---

## Qué es esto

Fabián Pizarro está montando una operación de dropshipping en Ecuador con el catálogo de
**DROPI**, separada de su negocio existente (Shotygames, juegos de mesa). La marca nueva se
llama **Avanora Naturals** y vende suplementos.

Modelo: **contra entrega (COD)**. El cliente paga en efectivo cuando el repartidor le entrega.
Eso cambia toda la matemática — ver "Unidad económica" más abajo.

**Contexto que importa:** Fabián tiene ~$100 de caja y deudas con deadline. El objetivo del
primer test NO es ganar plata, es **medir el CPA real de la cuenta publicitaria**, que nunca
se midió.

---

## Identificadores

| Qué | Valor |
|---|---|
| Cuenta publicitaria | `1284579892343452` — "AVANORA NATURALS" (ACTIVE) |
| Portafolio / business | `2102150583288162` — "Avanora" |
| Página de Facebook | `1286826097846865` — "Avanora Naturals" |
| Pixel de Meta | `1049349201145063` — "PIXEL AVANORA" |
| Web | https://avanora.vercel.app |
| Repo de la web | `github.com/fabianpizarro1/avanora` (**privado**, repo aparte de KEPLER) |
| Sheet de investigación | `1RhqJ7sIdYCg21m1JbTBIJ-AZtVdwY7zjon61EjUbKjc` (una pestaña por producto) |
| Sheet de pedidos | variable `SHEETS_ID_DROPSHIPPING` en `.env` |

**Ojo:** las 11 cuentas publicitarias de ShotyGames están todas en `UNSETTLED` (saldo impago) y
no sirven. Solo la de Avanora está activa.

---

## Unidad económica (números verificados, no estimados)

| Dato | Valor | Cómo se supo |
|---|---|---|
| Flete | **$6.36** | Orden real DROPI **6515467** (Machala, 1 unidad) |
| Flete de retorno | **$0** | DROPI no cobra retorno en órdenes CON RECAUDO |
| Tasa de entrega | **70%** | ⚠️ **SUPUESTO.** No hay dato propio todavía |

**El flete NO se cobra por peso.** El campo `weight` de la ficha está en gramos para algunos
productos y en kilos para otros, pero DROPI no lo usa para calcular el envío: $6.36 en la orden
6515467 contra $6.38 en la orden 6500078, que era otro producto con otro peso.

Fórmula (`projects/dropshipping/calculadora.js`):

```
margenEntregado   = precio − costo − flete
perdidaDevuelto   = flete
porPedidoGenerado = (entrega × margenEntregado) − ((1 − entrega) × perdidaDevuelto)
```

Ese último número es el CPA de equilibrio. **Y hay un paso más: dividirlo por 1.2**, porque el
gasto en Meta lleva ~20% de comisión bancaria. Así que el CPA que muestra el administrador tiene
que ser un 20% menor. Para ganar plata, apuntar a la **mitad** del de equilibrio.

**La variable de riesgo ahora es la tasa de entrega.** Para 1 frasco de drenaje a $28:
80% → CPA máx $11.32 · 70% → $9.11 · 60% → $6.90 · 50% → $4.69. Por debajo del 60% casi
ningún anuncio sirve. Se sabrá cuando se entreguen los primeros pedidos reales.

---

## Los 6 productos elegidos

Ver `project_avanora_productos` en la memoria para el detalle. Orden de testeo acordado:

1. **Drenaje Linfático Aurelys** (168103) — ✅ landing y campaña listas
2. **Inositol Multivitamin** (110735) — ✅ landing y campaña listas
3. Clorofila líquida (131953)
4. Glucosamina Forte (118553)
5. FARMAPROX (102479) — riesgo alto en Meta
6. Combo Melaxin (140055) — riesgo alto en Meta

---

## Producto 1 — Drenaje Linfático Aurelys

**DROPI 168103** · proveedor 111202 · costo **$5.90** · bodega DISVAS

### Precio y márgenes

| Combo | Precio | Por pedido generado | CPA máximo |
|---|---|---|---|
| 1 frasco | $28.00 | $9.11 | **$7.59** |
| 2 frascos | $35.00 | $9.86 | **$8.22** |
| 3 frascos | $50.00 | $16.25 | **$13.54** |

_(CPA máximo = por pedido generado ÷ 1.2, por la comisión bancaria del gasto en Meta)_

Precio tachado $39.99. El rango real del mercado ecuatoriano era $23–$28 el frasco suelto.

### Landings (en vivo)

- **A — visual:** https://avanora.vercel.app/p/drenaje-linfatico
- **B — clásica:** `?v=b`
- **C — advertorial:** `?v=c`

### Campaña (EN PAUSA, nunca se activó)

```
Campaña 120251984830830787 · "Avanora · Drenaje Linfático · Sonda CPA"
└── Conjunto 120251984847440787 · EC · Mujeres 28-58 · $10/día · Purchase
    ├── 120251984989610787  A1 · Control            ✅ aprobado
    ├── 120251985000200787  A2 · Reencuadre         ✅ aprobado
    ├── 120251985006680787  A3 · El zapato          ✅ aprobado
    └── 120251985012390787  A4 · Oferta 3x$50       ✅ aprobado
```

### Competencia (barrido del 13-ago-2026)

16 anunciantes, ~170 anuncios activos. Los principales: Zalquimartecua (~16 ads), PharmaTodo
(~14, 2x$35), Novamark (~14), Zentro (~12, $27.99). Cinco tienen landing web propia.

Ángulo más usado: "siéntete más ligera". El menos explotado y más fuerte: **"¿Y si no fuera
grasa?"** — la idea de que *la grasa es constante, el agua fluctúa*.

---

## Producto 2 — Inositol Multivitamin (Peach Perfect)

**DROPI 110735** · proveedor 60343 · costo **$5.00** · bodega ECOMARKET QUITO

Producto real: **Peach Perfect Inositol Multivitamin**, sabor fresa/açaí, **polvo** (no
cápsulas), 243.1 g, 30 porciones. Myo-Inositol 4.000 mg + D-Chiro 50 mg + DIM 100 mg +
magnesio glicinato 200 mg + zinc 10 mg + vitamina D3 1.000 UI.

### Precio y márgenes

| Combo | Precio | Por pedido generado | CPA máximo |
|---|---|---|---|
| 1 frasco | $29.99 | $11.13 | **$9.28** |
| 2 frascos | $37.99 | $13.23 | **$11.03** |
| 3 frascos | $49.99 | $18.13 | **$15.11** |

_(CPA máximo = por pedido generado ÷ 1.2, por la comisión bancaria del gasto en Meta)_

El tachado de $49.99 es **real**: es lo que cuesta un frasco en peachperfect.com.

### Landings (en vivo)

- **A — visual:** https://avanora.vercel.app/p/inositol
- **B — clásica:** `?v=b`
- **C — advertorial:** `?v=c`

### Campaña (EN PAUSA)

```
Campaña 120251998583790787 · "Avanora · Inositol · Sonda CPA"
└── Conjunto 120251998586280787 · EC · Mujeres 22-45 · $10/día · Purchase
    ├── 120251998673730787  A1 · Oferta 3x$49.99       ✅ aprobado
    ├── 120251998677350787  A2 · Síntomas              ✅ aprobado
    ├── 120251998680310787  A3 · Mecanismo/azúcar      ✅ aprobado
    ├── 120251998682700787  A4 · 4 cápsulas o un vaso  ❌ RECHAZADO
    └── 120252001767300787  A4b · No es una pastilla   🕐 en revisión
```

**Sobre el rechazo:** el A4 era el único creativo que mostraba **cápsulas sueltas** en la
imagen, y el titular decía "4 CÁPSULAS AL DÍA". Los otros tres, con el mismo producto, la
misma página y la misma landing, pasaron. No se pudo leer el motivo textual de Meta (la API de
errores no cubre rechazos, el navegador interno no tiene sesión y la extensión de Chrome no
respondió), así que es un diagnóstico, no una cita. El reemplazo A4b mantiene el ángulo pero
sin mostrar pastillas.

**El A4 rechazado sigue en la cuenta** — el borrado por API no está habilitado en esta cuenta.
Está en pausa y no gasta, pero conviene eliminarlo a mano.

### Competencia

Muy débil comparada con el drenaje. **Ningún competidor en Ecuador tiene landing web: los tres
mandan a WhatsApp.** Esa es la ventaja estructural del producto.

- **UltraStock** (`1126169770578636`) — vende **exactamente este producto**, 1=$29.99, 2=$37.99
- **VivaShop** (`793023347219920`) — desde el **26-ago-2025**, casi un año al aire. Otra marca
  (Intimate Rose, cápsulas), 2x$28-30
- **ECU Store** (`960397790495352`) — otra marca, 2x$35

Ángulo libre y sin usar por nadie: **el mecanismo** (resistencia a la insulina → andrógenos
altos → ovulación irregular). Todos se quedan en la lista de beneficios.

---

## Arquitectura de la web

Repo aparte: `projects/avanora/` (está en `.gitignore` de KEPLER, es su propio repo git).

```
src/data/productos.ts     ← TODO el contenido vive acá. Agregar un producto = agregar un objeto
src/pages/Landing.tsx     ← shell: resuelve producto y variante, despacha a una estructura
src/layouts/Visual.tsx    ← estructura A: bloques de imagen a ancho completo
src/layouts/Clasica.tsx   ← estructura B: secciones con texto e imágenes
src/layouts/Historia.tsx  ← estructura C: advertorial largo
src/components/Secciones.tsx  ← oferta, casos, reseñas y FAQ (compartidos por las tres)
src/components/CheckoutModal.tsx  ← checkout COD en modal
api/pedido.ts             ← recibe el pedido y lo reenvía al webhook de n8n
```

Las tres variantes se sirven con `?v=b` / `?v=c`. Una `?v=` desconocida cae en la A.
El pixel manda el slug con la variante pegada (`producto|b`) para poder comparar en Meta.

**Reglas de la landing que ya se aprendieron** (están en la skill, no las cambies sin motivo):
los botones muestran el precio de UNA unidad y el checkout abre en la opción más barata; el
upsell va adentro del checkout con el ahorro a la vista; reseñas con foto primero; una reseña
de 4 estrellas con un pero; timeline para BAJAR expectativas; garantía visible; tabla
comparativa con una fila donde gana la alternativa.

---

## Flujo de un pedido

```
landing → /api/pedido → n8n → Google Sheet (estado PENDIENTE_CONFIRMACION)
       → Fabián confirma (bot de Telegram) → DROPI crea la orden (estado EN_DROPI)
       → el proveedor genera la guía → entrega → se cobra
```

Validado de punta a punta el 2026-08-13 con el pedido **AVN-71254** → orden DROPI **6515467**.

Scripts relevantes:

| Archivo | Qué hace |
|---|---|
| `catalogo.js` | Escanea el catálogo de DROPI. Exporta `conToken` (login automático) |
| `calculadora.js` | Unidad económica COD. Defaults verificados contra órdenes reales |
| `ranking.js` | Cruza velocidad de venta, rentabilidad y riesgo en Meta |
| `pedidos.js` | Crea órdenes en DROPI. `crearPedido`, `getOrden`, `getMovimientosWallet` |
| `sheets-pedidos.js` | Lee y escribe el Sheet de pedidos **por título de columna**, no por índice |
| `diario.js` | Rutina de las 5 AM: snapshot + ranking + aviso por Telegram |
| `crear-sheet-productos.js` | Arma el Sheet de investigación, una hoja por producto |

---

## Correcciones del 2026-08-14

Una revisión externa encontró tres errores. Los tres eran reales y están arreglados y desplegados:

1. **La proporción "40:1" del Inositol estaba mal.** 4.000 mg de Myo entre 50 de D-Chiro dan
   80:1; el 40:1 es del formato en cápsulas. Se quitó el ratio y quedaron las cantidades.
2. **Había copy del drenaje escrito a mano en la estructura clásica** ("Fórmula botánica:
   extractos líquidos de plantas", "Estas gotas") y salía en el Inositol, que es polvo. Ahora
   viene del producto: `ingredientesIntro` y `comparativa.nuestro`.
3. **En móvil el hero apilaba la foto antes del titular**, y la estructura visual no tenía H1 ni
   CTA sobre el pliegue. Corregido con `order-*` / `md:order-*` y una barra de entrada.

Se dejaron a propósito, por decisión de Fabián: la etiqueta "Compra verificada" en las reseñas,
la calificación promedio, el sello "Más pedido" y el pie de página sin RUC ni políticas.

**Queda abierto:** la revisión señaló que ARCSA (el regulador ecuatoriano) prohíbe atribuirle a
un suplemento propiedades de tratamiento. Eso es distinto de una política de Meta — es ley local,
y que la competencia lo haga no protege. Se le planteó y es su decisión.

---

## Método de trabajo

**Está en la skill `.claude/skills/investigacion-producto/SKILL.md` y es obligatorio.** No es
opcional ni se improvisa. Cuatro fases: barrido total de la biblioteca de anuncios por
`page_ids` → destripar las landings de la competencia con navegador → armar 3 landings
distintas → verificar.

Las dos reglas que mandan sobre todo lo demás:

1. **"No se puede" hay que ganárselo.** Un intento fallido no es un límite. Reintentar y
   cambiar de herramienta (curl → navegador → API → DOM) antes de informar nada.
2. **No se avisa hasta que esté terminado.** Nada de entregar para que Fabián diga qué falta.

---

## Pendientes

**Bloqueantes de verdad**

- [ ] **Nadie ha activado ninguna campaña todavía.** Las dos están en pausa esperando a Fabián
- [ ] La **tasa de entrega del 70%** sigue siendo un supuesto. Es la variable que puede tumbar
      toda la matemática
- [ ] Eliminar a mano el anuncio rechazado `120251998682700787`

**Importantes**

- [ ] Las reseñas del Inositol son reales pero de femyverse.com, **sin ciudad**. No hay reseñas
      ecuatorianas públicas porque todos venden por WhatsApp. Reemplazar en cuanto haya
      clientas propias
- [ ] Fotos propias del producto llegando a Machala — valen más que cualquier render
- [ ] Falta medir el flete de un combo de 3 unidades (con 1 ya se sabe que no escala por peso)
- [ ] Fabián tiene que comprar el dominio (hoy la web vive en `avanora.vercel.app`)
- [ ] Revisar las 8 cuentas publicitarias de ShotyGames en UNSETTLED (saldo impago)

**Consejo que se le dio y conviene respetar:** con ~$100 de caja, **no encender las dos
campañas a la vez**. Dos campañas de $10/día se van en cinco días sin que ninguna llegue a
decir nada. Primero el Inositol (mejor margen, competencia más débil, nadie con landing web),
medir el CPA, y recién ahí la segunda.
