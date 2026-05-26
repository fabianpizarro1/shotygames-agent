# Skill: Registrar Pedido en Google Sheets

## Cuándo usar esta skill
Cuando Fabián diga cualquiera de estas frases (o similares):
- "registra este pedido"
- "nuevo pedido"
- "agrega este pedido"
- "anota esto"
- Cuando pegue una conversación de WhatsApp con un pedido

---

## Hoja de destino
**Spreadsheet ID:** `1w6qtLfh6nwsnQWywW5Rk8cgoVxWFa54BhyemyvxquVY`
**Hoja:** `PEDIDOS`

---

## Productos de Shotygames (columnas en el Sheet)

| Columna | Producto | Precio |
|---|---|---|
| N | Torre de Shots Normal | $20.00 |
| P | Torre de Shots Picante | $20.00 |
| PAR | Torre de Shots Parejas | $25.00 |
| ENG | Enganchados | $15.00 |
| DADOS | Dados Digitales | — |

Valor de la celda: número de unidades (1, 2, etc.) o dejar vacío si no pidió ese producto.

---

## Proceso paso a paso

### Paso 1 — Extraer datos del pedido

Cuando Fabián comparta la info del pedido (conversación de WhatsApp, mensaje de voz transcrito, o datos sueltos), extrae los siguientes campos:

**Datos del cliente:**
- NOMBRE — nombre completo del cliente
- TELEFONO — sin el 0 inicial, con 593 adelante para el link de WhatsApp
- CIUDAD — ciudad de destino
- DIRECCION — dirección exacta de entrega

**Productos pedidos:**
- Identifica qué productos compró y cuántos de cada uno
- Mapea a las columnas N, P, PAR, ENG, DADOS

**Pago:**
- ANTICIPO — cuánto pagó adelantado
- SALDO — cuánto debe todavía (si no dice, calcular: total - anticipo)
- CUENTA — banco o método de pago (PICHINCHA, PAYPHONE, TRANSFERENCIA, etc.)
- ESTADO — PAGADO / PENDIENTE / ANTICIPO

**Envío:**
- TRANSPORTADORA — por defecto SERVIENTREGA (preguntar solo si mencionan otra)
- ENVIO — costo de envío (preguntar a Fabián si no lo sabe)

**Otros:**
- FECHA — fecha del pedido (si no dice, usar hoy)
- NOTAS — cualquier dato adicional relevante

### Paso 2 — Mostrar resumen para confirmar

Antes de registrar, mostrar un resumen visual así:

```
📦 PEDIDO LISTO PARA REGISTRAR
──────────────────────────────
👤 Cliente:     [NOMBRE]
📱 Teléfono:    [TELEFONO]
🏙️ Ciudad:      [CIUDAD]
📍 Dirección:   [DIRECCION]

🎮 Productos:
  • Torre Normal:   [N] unid.
  • Torre Picante:  [P] unid.
  • Torre Parejas:  [PAR] unid.
  • Enganchados:    [ENG] unid.
  • Dados Dig.:     [DADOS] unid.
  → Total productos: [PRODUCTOS texto, ej: "1 NORMAL, 1 PAREJA"]

💰 Pago:
  • Anticipo:    $[ANTICIPO]
  • Saldo:       $[SALDO]
  • Cuenta:      [CUENTA]
  • Estado:      [ESTADO]

🚚 Envío:
  • Transportadora: [TRANSPORTADORA]
  • Costo envío:    $[ENVIO]

📅 Fecha: [FECHA]
📝 Notas: [NOTAS]
──────────────────────────────
¿Confirmas el registro? (sí / corregir [campo])
```

### Paso 3 — Registrar via n8n

Cuando Fabián confirme, ejecutar el siguiente comando con los datos extraídos:

```bash
curl -s -X POST "[WEBHOOK_URL]" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "[NOMBRE]",
    "fecha": "[FECHA en formato DD/MM/YYYY]",
    "mes": "[MES en español, minúsculas]",
    "telefono": "[TELEFONO]",
    "ciudad": "[CIUDAD en mayúsculas]",
    "n": "[cantidad o vacío]",
    "p": "[cantidad o vacío]",
    "par": "[cantidad o vacío]",
    "eng": "[cantidad o vacío]",
    "dados": "[cantidad o vacío]",
    "anticipo": "[monto sin $]",
    "saldo": "[monto sin $ o vacío si ya pagó todo]",
    "cuenta": "[CUENTA]",
    "estado": "[ESTADO]",
    "transportadora": "[TRANSPORTADORA]",
    "envio": "[costo]",
    "direccion": "[DIRECCION]",
    "productos": "[texto descriptivo ej: 1 NORMAL, 1 PAREJA]",
    "notas": "[NOTAS o vacío]"
  }'
```

Reemplaza `[WEBHOOK_URL]` con la URL del webhook de n8n (ver `setup.md`).

### Paso 4 — Confirmar resultado

Si n8n responde con éxito, mostrar:

```
✅ Pedido registrado correctamente en Google Sheets.
Fila agregada para: [NOMBRE] — [PRODUCTOS] — [CIUDAD]
```

Si hay error, mostrar el error y pedir a Fabián que verifique la conexión con n8n.

---

## Campos auto-calculados (los genera n8n, no Claude)

- **MES** — se extrae de la FECHA
- **LINK RASTREO** — se genera cuando se agrega la GUIA
- **LINK WHATSAPP** — `https://wa.me/593[TELEFONO sin 0]`

---

## Manejo de datos incompletos

Si falta información crítica, preguntar solo lo que falta antes de mostrar el resumen:
- **Siempre necesario:** NOMBRE, TELEFONO, CIUDAD, PRODUCTOS, ANTICIPO, CUENTA
- **Puede quedar vacío:** SALDO (si pagó todo), DIRECCION (si retira en oficina), NOTAS, GUIA

Si Fabián dice "ya pago todo" → SALDO = vacío, ESTADO = PAGADO
Si dice "me debe X" → SALDO = X, ESTADO = PENDIENTE o ANTICIPO

---

## Errores comunes

| Situación | Qué hacer |
|---|---|
| No dice la ciudad | Preguntar: "¿A qué ciudad lo enviamos?" |
| No dice el costo de envío | Preguntar: "¿Cuánto cuesta el envío a [CIUDAD]?" |
| Da teléfono con 0 adelante | Quitar el 0 para el link de WhatsApp |
| Da fecha relativa ("ayer") | Convertir a DD/MM/YYYY con la fecha real |
| n8n no responde | Verificar que el webhook esté activo en n8n |
