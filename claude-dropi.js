const Anthropic = require('@anthropic-ai/sdk');
const dropi = require('./dropi');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente de logística de Fabián Pizarro, dueño de Shotygames.

## Tu función
Consultar información de DROPI: clientes, pedidos, estado de envíos, saldo y pagos.

## Reglas
- Responde directo con los datos que encuentres.
- Si no encuentras al cliente, dilo claro.
- Tono directo, sin relleno.
- Cuando muestres reputación de cliente, usa: ⭐ EXCELENTE / ✅ BUENO / ⚠️ REGULAR / ❌ MALO según el porcentaje de entrega.`;

const TOOLS = [
  {
    name: 'verificar_cliente_dropi',
    description: 'Verifica la reputación de un cliente en DROPI por su número de teléfono',
    input_schema: {
      type: 'object',
      properties: {
        telefono: { type: 'string', description: 'Número de teléfono del cliente (9 dígitos o con código de país)' }
      },
      required: ['telefono']
    }
  },
  {
    name: 'buscar_pedido_dropi',
    description: 'Busca el estado de un pedido en DROPI por nombre y teléfono del cliente',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        telefono: { type: 'string' }
      },
      required: ['nombre', 'telefono']
    }
  },
  {
    name: 'estado_pedido_por_id',
    description: 'Obtiene el estado de un pedido específico por ID en DROPI',
    input_schema: {
      type: 'object',
      properties: {
        orden_id: { type: 'string' }
      },
      required: ['orden_id']
    }
  }
];

async function executeTool(name, input) {
  switch (name) {
    case 'verificar_cliente_dropi': {
      const result = await dropi.verificarCliente(input.telefono);
      return JSON.stringify(result);
    }
    case 'buscar_pedido_dropi': {
      const result = await dropi.buscarOrden(input.nombre, input.telefono);
      return JSON.stringify(result);
    }
    case 'estado_pedido_por_id': {
      const result = await dropi.getOrdenPorId(input.orden_id);
      return JSON.stringify(result);
    }
    default:
      return 'Herramienta no reconocida.';
  }
}

async function chatDropi(history, newMessage) {
  const messages = [...history, { role: 'user', content: newMessage }];
  let response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages
  });

  while (response.stop_reason === 'tool_use') {
    const assistantMsg = { role: 'assistant', content: response.content };
    const results = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await executeTool(block.name, block.input);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
    }
    messages.push(assistantMsg);
    messages.push({ role: 'user', content: results });
    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    });
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  messages.push({ role: 'assistant', content: response.content });
  return { text, updatedHistory: messages };
}

module.exports = { chatDropi };
