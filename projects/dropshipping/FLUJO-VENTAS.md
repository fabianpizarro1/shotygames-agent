# Flujo de venta y arquitectura del sistema

_Definido el 2026-08-11. Aplica a las dos tiendas (Hogar & Gadgets primero, Salud & Bienestar después). La máquina es la misma; cada tienda solo cambia dominio, marca y pixel._

---

## Decisiones de estructura (2026-08-11)

- **Dos tiendas separadas por riesgo de Meta**, no por gusto:
  - **Tienda B — Hogar & Gadgets** (físicos, cocina, tecnología, novedades). Meta-safe. **Se construye primero.**
  - **Tienda A — Salud & Bienestar** (suplementos, vitaminas, cuidado). Alto riesgo de ban. Se activa cuando el pipeline esté probado.
- Business, página y pixel **separados** entre las dos, para que un strike de salud no tumbe la de gadgets.
- La máquina (generador de landings, Sheet, flujo DROPI, bot, cron) es **compartida**. Dos tiendas ≠ doble ingeniería: es la misma landing con otra piel.

---

## Recorrido del cliente (lo que ve y hace)

```
1. Ve el anuncio en Instagram/Facebook (Meta Ads)
2. Click → llega a la landing del producto (dominio de la tienda)
3. Recorre la landing:
      hero con demo/beneficio  →  prueba social  →  oferta (precio + combos)  →  formulario
4. Llena el formulario COD: nombre, teléfono, ciudad, dirección
   Botón: "Pedir contra entrega — pagas cuando lo recibes"
5. Envía → ve pantalla de confirmación ("te llamamos para confirmar")
6. Recibe llamada/mensaje de WhatsApp para CONFIRMAR el pedido
7. Recibe el producto y paga al repartidor (contra entrega)
```

El paso 6 no es opcional. La tasa de entrega es la variable que más margen destruye en COD, y confirmar por WhatsApp antes de despachar es lo que la sube. Ver la calculadora: cada punto de entrega pesa más que un punto de precio.

---

## Flujo del sistema (qué se conecta con qué)

```
  [ Landing en Vercel ]
        │  cliente envía formulario
        ▼
  [ Endpoint de pedido (API) ]
        ├──► Google Sheet de la tienda        (registro del pedido)
        ├──► Meta Pixel                        (evento de conversión → alimenta el algoritmo)
        └──► Bot de Telegram                   (aviso instantáneo a Fabián)
        │
        ▼
  [ Confirmación por WhatsApp ]                (agente / manual — filtra pedidos falsos)
        │  confirmado
        ▼
  [ Crear guía en DROPI ]                      (dropi.js — con el producto del PROVEEDOR)
        │
        ▼
  [ Transportadora entrega y cobra ]  →  DROPI paga a Fabián (~4 días desde el pedido)
        │
        ▼
  [ Estado del pedido se actualiza en el Sheet ]
```

### En paralelo, el loop de selección de productos
```
  Cron diario 5:00 AM
        ├──► snapshot del catálogo DROPI          (catalogo.js)
        ├──► ranking por movimiento + rentabilidad (ranking.js)
        └──► propuesta por Telegram               (top candidatos del día)
                │  Fabián aprueba
                ▼
        landing generada → campaña Meta creada EN PAUSA → Fabián enciende a las 6 AM
```

---

## Piezas a construir (todas compartidas entre las dos tiendas)

| Pieza | Estado | Nota |
|---|---|---|
| Catálogo + snapshots | ✅ | `catalogo.js` |
| Ranking + filtro rentabilidad | ✅ | `ranking.js` |
| Calculadora COD | ✅ | `calculadora.js` |
| Conexión Meta Ads (API) | ✅ | conectada por MCP — sin token manual |
| **Plantilla de landing + checkout COD** | ⬜ | clonar de web-shotygames, quitar lo específico de Shotygames |
| **Endpoint de pedido** (Sheet + Pixel + Telegram) | ⬜ | uno por tienda, config distinta |
| **Google Sheet de pedidos** | ⬜ | uno por tienda |
| **Flujo DROPI con productos dinámicos** | ⬜ | adaptar `crearOrden`: hoy tiene 5 productos de Shotygames fijos; el dropshipping necesita pasar cualquier producto del catálogo por su ID |
| **Bot de Telegram dropshipping** | ⬜ | separado del de Shotygames |
| **Pixel de Meta por tienda** | ⬜ | crear dataset/pixel por business |
| **Cron diario** | ⬜ | snapshot 5 AM en el servidor |
| **Deploy Vercel** | ⬜ | Fabián compra el dominio |

### La diferencia técnica clave con Shotygames
En Shotygames, `dropi.js` tiene **5 productos hardcodeados** (torres, enganchados, dados). En dropshipping el producto cambia en cada test, así que el flujo de guía tiene que aceptar **cualquier producto del catálogo por su ID DROPI**, con su costo y peso reales. Es el ajuste central del backend.

---

## Lo que falta decidir / que depende de Fabián
- **Nombre y dominio de la tienda de Hogar & Gadgets** (bloquea el proyecto de landing)
- Comprar el dominio (~$12/año)
- Confirmar qué cuenta publicitaria de Meta se usa para dropshipping (mantenerla separada del pixel de Shotygames)
