const Anthropic = require('@anthropic-ai/sdk');
const tools = require('./tools');
const sheets = require('./sheets');

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
- **productos** — lista de productos (ej: "1 PAREJAS, 1 DADOS")
- **pvp_total** — precio total del pedido (lo que diga "POR X" o suma de productos)
- **anticipo** — cuánto pagó de anticipo (si aplica)
- **cuenta** — banco o método: PICHINCHA, PAYPHONE, etc.

### Paso 2 — Calcula saldo y estado
- Si dijo "PAGO X DE ANTICIPO A [CUENTA]":
  → anticipo = X, saldo = pvp_total - X, estado = ANTICIPO
- Si dijo "PAGADO AL [CUENTA]" o "PAGO COMPLETO":
  → anticipo = pvp_total, saldo = 0, estado = PAGADO
- Si no mencionó pago:
  → anticipo = 0 o vacío, saldo = pvp_total, estado = PENDIENTE
- Transportadora: siempre SERVIENTREGA salvo que Fabián diga otra.

### Paso 3 — Muestra confirmación con este formato EXACTO antes de registrar

🛍️ *PRODUCTOS:*
- [cada producto en línea separada]

💰 *PVP TOTAL: $[total]*
- Pagado: $[anticipo] a [cuenta]
- *Pendiente: $[saldo]*

📍 *DATOS DE ENVÍO:*
- Nombre: [nombre]
- Teléfono: [teléfono]
- Dirección: [dirección]
- Ciudad: [ciudad]

No registres nada hasta que Fabián confirme. Cuando confirme (con "sí", "ok", "ya", "correcto" o similar), ejecuta registrar_pedido.

### Paso 4 — Si faltan datos críticos
Si no puedes extraer nombre, teléfono o productos, pregunta solo lo que falta. No inventes datos.

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
      const upd = await sheets.actualizarGuia(input.telefono, input.guia);
      if (upd.updated) return `✅ Guía ${input.guia} actualizada en fila ${upd.fila}.`;
      return `No encontré pedido con teléfono ${input.telefono}.`;

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

async function chat(history, newMessage) {
  const messages = [...history, { role: 'user', content: newMessage }];

  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
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
      model: 'claude-sonnet-4-6',
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
