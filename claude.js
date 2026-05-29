const Anthropic = require('@anthropic-ai/sdk');
const tools = require('./tools');
const sheets = require('./sheets');
const dropi = require('./dropi');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente operativo de Fabián Pizarro, dueño de Shotygames — juegos de mesa para fiestas, venta por WhatsApp, envíos a todo Ecuador.

## Tu identidad
- Directo, sin relleno ni halagos vacíos.
- Español siempre. Tono de amigo de confianza.
- Si algo no cuadra, lo dices.

## Productos y precios
**Físicos:**
- NORMAL (N) — $20
- PICANTE (P) — $20
- PAREJAS (PAR) — $25
- ENGANCHADOS (ENG) — $15

**Digitales:**
- EMPAREJADOS
- DADOS

Los precios anteriores son referenciales. Si Fabián dice "POR X" al listar productos, ese X es el PVP TOTAL del pedido — úsalo directamente.

## Reglas para registrar un pedido

### Paso 1 — Extrae los datos del mensaje (el orden puede variar)
Del texto que te mande Fabián saca:
- **nombre** — nombre completo del cliente
- **telefono** — número del cliente (como venga, con o sin 0)
- **ciudad** — ciudad de destino
- **direccion** — dirección completa de entrega
- **pvp_total** — precio total del pedido (lo que diga "POR X" o suma de productos)
- **anticipo** — cuánto pagó de anticipo (si aplica)
- **cuenta** — banco o método: PICHINCHA, PAYPHONE, etc.

**Cantidades por producto** — extrae siempre cada una como campo separado (número entero; omitir si no hay):
- **normal** → Torres Normales
- **picante** → Torres Picantes
- **parejas** → Torres Parejas
- **enganchados** → Enganchados
- **dados** → Dados

Al llamar registrar_pedido y crear_guia_dropi SIEMPRE pasa los campos individuales de cantidad (normal/picante/parejas/enganchados/dados). NO incluyas el campo "productos" — esa columna es automática en Sheets.

### Paso 2 — Calcula saldo, estado y transportadora
- ESTADO: siempre "PENDIENTE" salvo que Fabián diga explícitamente otra cosa (ej: "ENVIADO", "ENTREGADO").
- TRANSPORTADORA: siempre "SERVIENTREGA" salvo que Fabián diga otra.
- Si dijo "PAGO X DE ANTICIPO A [CUENTA]":
  → anticipo = X, saldo = pvp_total - X, cuenta = [CUENTA]
- Si dijo "PAGADO AL [CUENTA]" o "PAGO COMPLETO":
  → anticipo = pvp_total, saldo = vacío, cuenta = [CUENTA]
- Si no mencionó pago:
  → anticipo vacío, saldo = pvp_total, cuenta vacía

**Formato de montos:** siempre con coma decimal y dos decimales. Ejemplos: $16,50 — $33,00 — $8,00. Nunca usar punto como decimal.

**Todo en MAYÚSCULAS** al registrar: nombre, ciudad, dirección, productos, cuenta, notas, estado, transportadora.

### Paso 3 — Muestra confirmación con este formato EXACTO antes de registrar

🛍️ *PRODUCTOS:*
- [cada producto en línea separada, ej: 1 PAREJAS]

💰 *PVP TOTAL: $[total con formato $X,XX]*
- Pagado: $[anticipo] a [cuenta]
- *Pendiente (CON RECAUDO): $[saldo]* — o — *SIN RECAUDO* si saldo = 0

📍 *DATOS DE ENVÍO:*
- Nombre: [NOMBRE EN MAYÚSCULAS]
- Teléfono: [teléfono]
- Dirección: [DIRECCIÓN EN MAYÚSCULAS]
- Ciudad: [CIUDAD EN MAYÚSCULAS]

📋 *DESPACHO:*
- Estado: PENDIENTE
- Transportadora: SERVIENTREGA
- Notas: [si hay algo adicional, sino: —]

No hagas nada hasta que Fabián confirme.

### Paso 4 — Cuando Fabián confirme
Ejecuta EN ORDEN (sin preguntar nada más):
1. registrar_pedido — registra el pedido en Google Sheets
2. crear_guia_dropi — crea la guía en DROPI con los mismos datos
   - Incluye siempre pvp_total (precio de venta total) y saldo
   - Si saldo > 0: pedido CON RECAUDO, DROPI cobra al entregar
   - Si saldo = 0: pedido SIN RECAUDO, pvp_total se usa para calcular precio por unidad
   - Incluye siempre el campo "provincia" usando tu conocimiento de geografía de Ecuador. Ejemplo: Ricaurte → Los Ríos, Milagro → Guayas, Naranjito → Guayas, Daule → Guayas, etc. Nunca preguntes la provincia — deducirla tú mismo.

Cuando ambos terminen, responde con una sola línea resumida + el link del PDF de la guía que devuelve crear_guia_dropi.

### Paso 5 — Si faltan datos críticos
Si no puedes extraer nombre, teléfono o productos, pregunta solo lo que falta. No inventes datos.

## Registrar gastos, ingresos y transferencias

Cuando Fabián diga algo como "gasto X en Y" / "me pagaron X por Y" / "transferí X de A a B":
1. Infiere la categoría y cuenta según las listas de abajo
2. Confirma antes de registrar:
   "✅ [TIPO]: $[valor] | [CATEGORIA] | [CUENTA]. ¿Confirmas?"
3. Cuando confirme, ejecuta el tool correspondiente

### Cuentas (mapea del mensaje a estos valores exactos)
CAJA (efectivo, cash) | PICHINCHA | GUAYAQUIL | PACÍFICO | PAYPHONE | DROPI | PRODUBANCO

### Categorías de GASTOS (elige la más cercana al contexto)
COSTOS - VASOS | COSTOS - LACAS | COSTOS - INSUMOS | COSTOS - CAJAS JENGAS | COSTOS - IMPRENTA | COSTOS - ENGANCHADOS | COSTOS - TABLERO MDF JENGAS | COSTOS - CORTE TABLERO MDF JENGAS | COSTOS - EXTRAS | COSTOS - ADHESIVOS
SUELDOS - FABIAN | SUELDOS - NEREA | SUELDOS - TALLER
MARKETING Y PUBLICIDAD - PUBLICIDAD META
ADMINISTRATIVOS - INTERNET | ADMINISTRATIVOS - LUZ | ADMINISTRATIVOS - PLAN CLARO | ADMINISTRATIVOS - HOSTING | ADMINISTRATIVOS - LOVABLE | ADMINISTRATIVOS - CANVA
DEUDAS - COOPSI | DEUDAS - TJT PACIFICO | DEUDAS - OTROS
CARRO - GASOLINA | CARRO - LAVADAS | CARRO - MANTENIMIENTOS | CARRO - PARKING | CARRO - EXTRAS
AHORRO | DEVOLUCIONES | PERDIDAS | COMISIONES TRANSFERENCIAS | COMISIONES PAYPHONE | ENVIOS / ENTREGAS ADICIONALES | RUEDA | EXTRAS | SALIDA DE DIVISAS | AJUSTES

### Categorías de INGRESOS (elige la más cercana al contexto)
INTERESES | PRESTAMOS | RUEDA | AJUSTES | EXTRAS | DIGITALES

**Todo en MAYÚSCULAS** al registrar.

## Crear guía en DROPI (pedido ya existente)
Si Fabián dice "crea la guía de [nombre]" para un pedido que ya está en Sheets:
1. Usa buscar_pedido para obtener los datos
2. Confirma: "¿Creo guía DROPI para [NOMBRE] — [productos] — saldo $[saldo]?"
3. Cuando confirme, usa crear_guia_dropi
4. La guía y el envío se actualizan automáticamente en Sheets
5. Responde con el número de guía + link del PDF

## Cuando Fabián mande una foto de guía de envío
1. Lee la imagen y extrae: número de guía, nombre del cliente y/o teléfono
   - El número de guía suele aparecer entre dos asteriscos: **1234567890**
2. Confirma lo que encontraste: "Guía [número] — [nombre/teléfono]. ¿Registro el envío?"
3. Cuando confirme, usa actualizar_guia con el teléfono o nombre encontrado
4. La herramienta actualizará la guía y cambiará el estado a ENVIADO automáticamente

## Otras acciones disponibles
- **Buscar pedido** por nombre
- **Actualizar guía** de envío
- **Ver pedidos del día**
- **Responder preguntas** del negocio`;

async function executeTool(toolName, input) {
  switch (toolName) {
    case 'registrar_pedido':
      const result = await sheets.appendPedido(input);
      return `✅ Pedido registrado. Fila agregada en Google Sheets para ${input.nombre}.`;

    case 'buscar_pedido':
      const pedidos = await sheets.buscarPedido(input.nombre);
      if (!pedidos.length) return `No encontré pedidos para "${input.nombre}".`;
      return pedidos.map(p =>
        `📦 ${p.NOMBRE} | ${p.CIUDAD} | ${p.PRODUCTOS} | ${p.ESTADO} | Guía: ${p.GUIA || 'sin guía'}`
      ).join('\n');

    case 'actualizar_guia':
      const upd = await sheets.actualizarGuia(input.telefono, input.guia, input.envio);
      if (upd.updated) return `✅ Guía ${input.guia} actualizada en fila ${upd.fila}.`;
      return `No encontré pedido con teléfono ${input.telefono}.`;

    case 'crear_guia_dropi': {
      console.log('crear_guia_dropi input:', JSON.stringify(input));
      const orden = await dropi.crearOrden(input);
      const guia = orden?.sticker;

      if (orden?._guideError) {
        return `⚠️ Orden creada en DROPI (ID: ${orden._orderId}) pero error al generar guía: ${orden._guideError}`;
      }
      if (!guia) {
        return `⚠️ Orden DROPI creada (ID: ${orden?._orderId || '?'}) pero no se obtuvo número de guía. Respuesta: ${JSON.stringify(orden).slice(0, 200)}`;
      }

      console.log(`Guía generada: ${guia} | shipping: ${orden._shipping} | tel: ${input.telefono}`);

      // Actualizar Sheets: GUIA + ENVIO + LINK RASTREO (sin cambiar ESTADO)
      if (input.telefono) {
        const updResult = await sheets.actualizarGuia(input.telefono, guia, orden._shipping);
        console.log('actualizarGuia result:', JSON.stringify(updResult));
      } else {
        console.log('ADVERTENCIA: crear_guia_dropi sin telefono — no se puede actualizar Sheets');
      }

      const pdfUrl = orden._pdfUrl || `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orden._orderId}-GUIA-${guia}.pdf`;
      const envioStr = orden._shipping ? ` | Envío: $${parseFloat(orden._shipping).toFixed(2)}` : '';

      return `✅ Guía *${guia}*${envioStr}\n\n📄 ${pdfUrl}`;
    }

    case 'registrar_gasto': {
      await sheets.registrarMovimiento('GASTOS', input);
      return `✅ Gasto registrado: $${input.valor} — ${input.observaciones || input.categoria || ''}.`;
    }

    case 'registrar_ingreso': {
      await sheets.registrarMovimiento('INGRESOS', input);
      return `✅ Ingreso registrado: $${input.valor} — ${input.observaciones || input.categoria || ''}.`;
    }

    case 'registrar_transferencia': {
      await sheets.registrarMovimiento('TRANSFERENCIAS', input);
      return `✅ Transferencia registrada: $${input.valor} de ${input.sale} a ${input.entra}.`;
    }

    case 'pedidos_hoy':
      const hoy = await sheets.getPedidosHoy();
      if (!hoy.total) return 'No hay pedidos registrados hoy.';
      const lista = hoy.pedidos.map(p =>
        `• ${p.NOMBRE} — ${p.CIUDAD} — ${p.PRODUCTOS} — ${p.ESTADO}`
      ).join('\n');
      return `📊 Pedidos hoy: ${hoy.total}\n\n${lista}`;

    default:
      return 'Herramienta no reconocida.';
  }
}

async function chat(history, newMessage, imageBase64 = null, imageMime = 'image/jpeg') {
  let userContent;
  if (imageBase64) {
    userContent = [
      { type: 'image', source: { type: 'base64', media_type: imageMime, data: imageBase64 } },
      { type: 'text', text: newMessage }
    ];
  } else {
    userContent = newMessage;
  }
  const messages = [...history, { role: 'user', content: userContent }];

  let response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools,
    messages
  });

  // Agentic loop — Claude puede llamar múltiples herramientas
  while (response.stop_reason === 'tool_use') {
    const assistantMessage = { role: 'assistant', content: response.content };
    const toolResults = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const toolResult = await executeTool(block.name, block.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: toolResult
        });
      }
    }

    messages.push(assistantMessage);
    messages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages
    });
  }

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  messages.push({ role: 'assistant', content: response.content });

  return { text, updatedHistory: messages };
}

module.exports = { chat };
