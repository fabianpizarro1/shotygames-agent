# Estructura — Landing 3 Torres de Shots

**Dónde vive:** web propia (React + Vite), ruta nueva `/landing/3-torres`
**Objetivo:** tráfico frío de Meta Ads → venta con contraentrega o prepago
**Estado:** estructura definida. Contenido NO escrito todavía.

> ❌ Descartado Shopify + Releasit. La web propia ya tiene checkout, upsells y
> pasarela PayPhone funcionando. Migrar costaba ~$588/año y semanas de trabajo.

---

## Decisiones tomadas

| Decisión | Definido |
|---|---|
| Plataforma | **Web propia** (React), no Shopify |
| Ruta | `/landing/3-torres` |
| Checkout | `CheckoutModal` que ya existe |
| Descuento pago anticipado | **10%** |
| Material | Reseñas de WhatsApp + 11 videos verticales |
| Retos de Parejas | **Censura estratégica** (ver sección 5) |

---

## Lo que ya existe y se reutiliza

Auditando el código encontré que `CheckoutModal.tsx` ya soporta todo esto:

```ts
interface CheckoutModalProps {
  productName, productPrice, productImage
  productId?: ... | 'torres' | 'previa' | 'chuchaqui'
  upsells?: UpsellConfig[]          // order bumps ✅
  isCombo?: boolean
  comboIncludes?: string[]
  originalPrice?: number             // precio tachado ✅
  torreSelection?: {                 // selector de torres ✅
    required: boolean
    count: number
  }
}
```

**No hay que construir el checkout.** Ya está. Solo se le pasan props distintas.

### ⚠️ Bug a corregir antes de lanzar
`metodoPago` acepta `"contraentrega"` y la ruta `/confirmacion-contraentrega` existe,
pero **no hay ningún `RadioGroupItem` con `value="contraentrega"`** — el cliente nunca
puede elegirlo. Solo se renderizan transferencia y tarjeta.

Hay que activarlo. Es la opción que más convierte en tráfico frío.

---

## Principio rector

> Nadie busca "torre de shots". Buscan que la reunión no se muera.

Orden: deseo → dolor → solución → cuál me sirve → oferta → cierre.

---

## Estructura de secciones

### 0 · Barra superior
`🚚 Envío GRATIS a todo Ecuador · Pagas cuando lo recibes`

### 1 · HERO
| Elemento | Detalle |
|---|---|
| Visual | **Video vertical** de las torres en uso (tienes 11 sin usar) |
| Titular | Dolor implícito + promesa |
| Precio ancla | "Desde $28, envío incluido" |
| Badges | Contraentrega · Envío gratis · Despacho hoy |
| CTA | Abre `CheckoutModal` |

### 2 · Barra de confianza
**Pagas al recibir** · **Todo Ecuador** · **Sale hoy antes de 15:00**

### 3 · EL DOLOR
3 escenarios reconocibles, sin producto todavía:
- La reunión donde todos terminan en el celular
- "Pongamos música" y nada más pasa
- La previa que nunca arranca

*(Tu landing de Torre Normal ya tiene esta sección y está bien escrita — se reaprovecha el ángulo.)*

### 4 · EL GIRO — qué es y cómo funciona
Cómo se juega en 3 pasos. Visual, numerado.

### 5 · ¿CUÁL ES LA TUYA? — las 3 torres
Corazón de la página. Aquí **no se compra**, se orienta.

3 tarjetas. Cada una: para quién es · tipo de retos · **ejemplo de reto real** · qué incluye.

| Torre | Para quién | Retos de ejemplo (reales, del Word) |
|---|---|---|
| **Normal** | Grupos, romper el hielo | "LLAMA A TU EX" · "TOMA EL MÁS CACHUD@" · "ESCRÍBELE A TU CRUSH" |
| **Picante** | Grupos con confianza | Faltan los reales — solo hay 4 sueltos |
| **Parejas** | Noche de dos | 🔒 **Censurados a propósito** |

#### Censura estratégica en Parejas
Los retos reales son explícitos ("HAZME SEXO ORAL POR 3 MINUTOS", "MASTURBAME
DURANTE 3 MINUTOS"). Ponerlos visibles arriesga la cuenta de Meta Ads — que es
el 95% de las ventas.

Se muestran **tapados**, y eso vende más:
> *"Hay 14 retos de esta torre que Instagram no nos deja mostrarte 🔒"*

Se pueden mostrar los suaves ("HAZLE UN MASAJE POR 2 MINUTOS", "DILE ALGO SEXY
AL OÍDO", "PLANEEN UN VIAJE JUNTOS") y tapar el resto con blur.

### 6 · LA OFERTA — donde se convierte

| Plan | Precio | Antes | Ahorro | Props del modal |
|---|---|---|---|---|
| 1 Torre | $28 | — | — | `torreSelection {count: 1}` |
| 2 Torres | $39 | $56 | $17 | `torreSelection {count: 2}` |
| **3 Torres** ⭐ | **$49** | **$84** | **$35** | `isCombo`, las 3 incluidas |

El plan de 3 visualmente dominante (badge "MÁS ELEGIDO", borde, escala).

### 7 · LOS REGALOS

| Compra | Regalos |
|---|---|
| Cualquier torre (las 3) | Vaso tequilero + **Guía 25 juegos** |
| 2 o 3 torres | Vaso por torre + Guía 25 juegos + Guía 30 posiciones + **Shot Bidu** |

> **Decidido:** las 3 torres regalan la misma Guía de 25 juegos, incluida Parejas.
> Simplifica el mensaje y evita confundir al cliente. La Guía de 30 posiciones
> queda como diferenciador exclusivo de comprar 2 o 3 torres.

### 8 · CÓMO PAGAS
Dos opciones, explicadas **antes** de abrir el modal:

| Opción | Precio 3 torres |
|---|---|
| **Contraentrega** — pagas al recibir | $49 |
| **Pago anticipado −10%** — transferencia o tarjeta | **$44.10** |

> ✅ **Ventaja sobre Releasit:** en tu web el descuento se puede mostrar en vivo
> dentro del modal al elegir método de pago. Releasit no permitía eso — el cliente
> solo veía el descuento al llegar al checkout.

### 9 · PRUEBA SOCIAL
Sección **maquetada con placeholders** — Fabián pasa las capturas reales después.
Se deja el layout listo (grid de capturas + carrusel) para solo meter las imágenes.
Ya existe componente `Testimonials.tsx` reutilizable.
⚠️ Tapar teléfonos y apellidos antes de publicar — son datos de terceros.

### 10 · FAQ
- ¿De verdad pago cuando me llega?
- ¿Cuánto se demora?
- ¿Puedo pedir 2 torres iguales?
- ¿Cómo me llegan las guías digitales?
- ¿Qué diferencia hay entre las 3?

### 11 · CIERRE
Recap de la oferta + CTA final.

### 12 · Sticky CTA (mobile)
Ya existe el patrón en las landings actuales.

---

## Mapa de CTAs

| # | Ubicación | Abre |
|---|---|---|
| 1 | Hero | Plan 3 torres |
| 2 | Cada tarjeta de la sección 6 | Su plan |
| 3 | Cierre | Plan destacado |
| 4 | Sticky mobile | Plan destacado |

---

## Pendientes

| # | Qué falta | Bloquea |
|---|---|---|
| 1 | Retos completos de **Torre Picante** | Tarjeta Picante (sección 5) |
| 2 | Capturas de reseñas de WhatsApp | Sección 9 (maquetada, falta contenido) |
| 3 | Activar contraentrega en el checkout | Todo el flujo COD |
| 4 | Corregir "Guía de 20 juegos" → **25** | Copy en toda la web + imagen del combo |
| 5 | Comprimir videos para web | Hero |
| 6 | Decidir qué hacer con la escasez falsa ↓ | Riesgo con Meta |

---

## Escasez: "Solo 7 unidades" / "23 viendo ahora"

Confirmado por Fabián: **no son reales**, están puestos para generar urgencia.

**El riesgo concreto:**
- Meta prohíbe claims falsos de escasez. Puede rechazar anuncios y, si reincide,
  restringir la cuenta publicitaria — el 95% de las ventas.
- En Ecuador, la Ley Orgánica de Defensa del Consumidor sanciona publicidad engañosa.
- Un cliente que vuelve y ve "solo 7 unidades" siempre igual, pierde confianza.

**Alternativas que generan la misma urgencia y sí son verdad:**

| Recurso | Por qué funciona |
|---|---|
| ⏰ **"Pedidos antes de las 15:00 salen HOY"** | Urgencia real, ya es tu operativa. Contador en vivo hasta las 15:00 |
| 🎁 **"Los regalos digitales van solo con esta compra"** | Verdad, y es valor percibido |
| 📦 **Stock real desde tu Sheets** | Ya llevas inventario ahí (`leerStock()` existe en el código) |
| 👥 **"+3,500 clientes"** | Si el número es real, es prueba social fuerte |

La del contador hasta las 15:00 es la más potente: es urgencia genuina, se renueva
cada día y nadie te la puede discutir.

**Decisión de Fabián (2026-07-27): se deja como está por ahora.** Riesgo comunicado
y asumido. Revisitar si Meta rechaza algún anuncio.
