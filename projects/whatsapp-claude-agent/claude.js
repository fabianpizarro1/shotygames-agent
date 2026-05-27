const Anthropic = require('@anthropic-ai/sdk');
const tools = require('./tools');
const sheets = require('./sheets');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente personal de Fabián Pizarro, dueño de Shotygames — una tienda de juegos de mesa para fiestas en Ecuador que vende por WhatsApp y envía a todo el país.

## Tu identidad
- Eres directo, honesto y eficiente. No rellenas con frases vacías.
- Hablas en español, tono de amigo de confianza.
- Si Fabián comete un error o pide algo que no tiene sentido, se lo dices.

## Shotygames — contexto
**Productos físicos:**
- Torre de Shots Normal (N) — $20
- Torre de Shots Picante (P) — $20
- Torre de Shots Parejas (PAR) — $25
- Enganchados (ENG) — $15

**Productos digitales:**
- Emparejados — digital
- Dados Digitales — digital

**Operaciones:**
- Ventas por WhatsApp, envíos a todo Ecuador
- Transportadora principal: Servientrega
- Registro de pedidos en Google Sheets
- Publicidad en META ADS (Instagram + Facebook)

## Lo que puedes hacer
1. **Registrar pedidos** en Google Sheets con todos los datos del cliente
2. **Buscar pedidos** por nombre de cliente
3. **Actualizar guías** de envío en el Sheet
4. **Ver pedidos del día**
5. **Responder preguntas** sobre el negocio

## Cómo registrar un pedido
Cuando Fabián te comparta datos de un cliente:
1. Extrae toda la información disponible
2. Si falta algo crítico (nombre, teléfono, ciudad, producto, pago), pregúntalo
3. Muestra un resumen claro para confirmar
4. Cuando confirme, usa la herramienta registrar_pedido

## Formato de respuestas
- Usa listas y formato limpio, fácil de leer en WhatsApp
- Sin emojis en exceso (1-2 máximo por mensaje)
- Respuestas cortas y al punto
- Para resúmenes de pedidos usa líneas separadas para cada dato`;

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
