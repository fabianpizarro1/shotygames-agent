# Dropshipping con catálogo DROPI

**Descripción:** Sistema para testear productos del catálogo de DROPI de forma sistemática — detectar ganadores con data real, filtrar por rentabilidad antes de gastar, generar landing y campaña, decidir en 72h si vive o muere.
**Estado:** En construcción — iniciado 2026-08-08
**Marca:** Nueva, separada de Shotygames (dominio propio, pixel propio)

---

## Regla de oro

**Ningún producto llega a Meta Ads sin pasar por la calculadora.** Si el semáforo sale 🔴, el producto muere ahí y no gastaste un dólar. Esta regla existe porque el sprint de deudas de julio 2026 no se cumplió — no hay colchón para tests corazonados.

---

## El hallazgo que cambia el criterio de selección (2026-08-08)

Con los números reales de Fabián (CPA $10, flete $5.50, retorno $3.50, entrega 70%):

| Precio | Costo | Múltiplo | Utilidad/pedido | Veredicto |
|---|---|---|---|---|
| $29.90 | $9.50 | 3.15x | **−$2.27** | 🔴 pierde plata |
| $39.90 | $9.50 | 4.20x | +$5.23 | 🟡 viable |
| $44.90 | $9.50 | 4.73x | +$8.23 | 🟢 testear |

**El múltiplo 3x que recomienda todo el mundo en dropshipping no funciona con un CPA de $10.** Hace falta **4.5x o más**. Ese es el filtro de entrada al catálogo: si el producto no soporta venderse a 4.5x su costo de proveedor, ni se mira.

La otra palanca, más fuerte que el precio: **la tasa de entrega**. A 80% de entrega el mismo producto de $29.90 pasa de −$2.27 a $0.12. Cada punto de entrega vale más que un punto de precio. Por eso el filtro de pedidos (confirmar por WhatsApp antes de despachar) no es opcional en COD.

---

## Radiografía del catálogo (snapshot #1, 2026-08-08)

| | |
|---|---|
| Productos en el catálogo EC | 32.939 |
| Con stock disponible | 26.337 (80%) |
| Con costo entre $2 y $20 (rango COD sano) | 21.127 |
| **Rentables al precio sugerido por el proveedor** | **67 — el 0,3%** |
| Soportan un precio a 4.5x bajo $60 | 16.651 |

Ese 0,3% es el dato que define el negocio: **de cada 300 productos del catálogo, 299 pierden plata si los vendes al precio que sugiere el proveedor.** El margen no viene dado, se construye poniendo el precio uno mismo. Quien entra a DROPI, elige un producto bonito y publica al precio sugerido, está financiando a Meta con su propio bolsillo.

Al mismo tiempo hay 16.651 productos que sí soportan un precio a 4.5x por debajo de $60 — así que material sobra. El cuello de botella nunca fue encontrar productos, es filtrarlos.

## Módulos

| # | Módulo | Estado | Archivo |
|---|---|---|---|
| 1 | Scanner de catálogo (snapshots + delta de stock) | ✅ funcionando — snapshot #1 el 2026-08-08, 32.939 productos | `catalogo.js` |
| 2 | Ranking semanal de ganadores | ⬜ pendiente | — |
| 3 | Calculadora de rentabilidad COD | ✅ funcionando | `calculadora.js` |
| 4 | Generador de landing | ⬜ pendiente | — |
| 5 | Campaña Meta por API | ⬜ bloqueado por token | — |
| 6 | Panel diario en Telegram | ⬜ pendiente | — |

### Módulo 1 — Scanner
La señal de "producto ganador" no es opinión: es **cuánto stock se movió en el catálogo del proveedor**. Un snapshot diario, comparado contra el del día anterior, muestra qué se está vendiendo y a qué velocidad. Nadie más en el mercado ecuatoriano está mirando esto.

```bash
node projects/dropshipping/catalogo.js snapshot   # correr a diario
node projects/dropshipping/catalogo.js delta      # qué se movió
```

### Módulo 3 — Calculadora
```bash
node projects/dropshipping/calculadora.js --precio 39.90 --costo 9.50
```
Modela lo que de verdad mata al COD: el CPA se paga en **todos** los pedidos, se entreguen o no. El número más accionable que devuelve es el **CPA máximo** — el techo que puedes pagar en Meta antes de perder plata en cada venta.

---

## Setup pendiente (bloquea el arranque)

### 1. Credenciales de la cuenta dropshipper
En `.env` (líneas 49-51), llenar a mano:
```
DROPI2_EMAIL=
DROPI2_PASSWORD=
DROPI2_TOTP_SECRET=     # opcional — esta cuenta no tiene 2FA activo
```
Verificar con `node projects/dropshipping/catalogo.js login`.

Si algún día se activa 2FA en esa cuenta, solo hay que pegar el secreto TOTP (la cadena larga detrás del QR, no el código de 6 dígitos) y el código lo maneja solo.

### 2. Token de Meta Marketing API
Para que las campañas se creen solas:
1. developers.facebook.com → crear app tipo **Business**
2. Agregar producto **Marketing API**
3. Business Settings → Users → **System Users** → crear uno con rol Admin
4. Asignar la cuenta publicitaria y la página al system user
5. Generate Token con permisos `ads_management`, `ads_read`, `business_management`
6. Agregar a `.env`: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`, `META_PIXEL_ID`

Nota: las campañas se crean **en PAUSA**. Fabián revisa y activa. Nunca se activa gasto de forma automática.

---

## Protocolo de test (72 horas)

| Día | Presupuesto | Qué se mira |
|---|---|---|
| 1 | $10 | Nada. Meta está aprendiendo — mirar el día 1 y apagar es el error más caro del dropshipping |
| 2 | $10 | CPC y CTR. Si el CTR < 1%, el creativo no sirve — cambiar creativo, no producto |
| 3 | $10 | CPA real vs CPA máximo de la calculadora |

**Decisión al día 3:**
- CPA real < CPA máximo → **escalar**, subir a $20/día
- CPA real entre 1x y 1.5x el máximo → **iterar creativo**, un intento más
- CPA real > 1.5x el máximo, o cero pedidos con $30 gastados → **matar**

**Cadencia realista: 2-3 productos por semana**, no uno diario. Un test de 1 día no sale de la fase de aprendizaje de Meta y no dice nada — es plata tirada. Presupuesto semanal: **$60-90**.

---

## Lo que no se hace

**Reseñas inventadas.** No se escriben testimonios de clientes que no existen. La sección de reseñas se construye vacía y conectada, y se llena con clientes reales. La prueba social de arranque es la que es verdad: pago contra entrega, garantía, envío a todo Ecuador.

---

## Decisiones registradas
- **2026-08-08** — Marca y dominio nuevos, separados de Shotygames. Meter productos genéricos bajo la marca de juegos de fiesta confunde al cliente y ensucia el aprendizaje del píxel.
- **2026-08-08** — Campañas por Meta API (elegido sobre brief manual), creadas siempre en pausa.
- **2026-08-08** — Filtro de entrada: múltiplo mínimo 4.5x sobre costo de proveedor.
