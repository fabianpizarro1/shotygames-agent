const Anthropic = require('@anthropic-ai/sdk');
const dropi = require('./dropi');
const sheets = require('./sheets');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente de logística de Fabián Pizarro, dueño de Shotygames.

## Tu función
Consultar información de DROPI: clientes, pedidos, estado de envíos, saldo y pagos recibidos.

## Reglas
- Responde directo con los datos que encuentres.
- Si no encuentras al cliente, dilo claro.
- Tono directo, sin relleno.
- Cuando muestres reputación de cliente: ⭐ EXCELENTE / ✅ BUENO / ⚠️ REGULAR / ❌ MALO según el % de entrega.
- Para saldo DROPI: si es $0, díselo claro — no hay nada pendiente de cobro.
- Para sincronizar pagos: lo que manda es la wallet de DROPI, no el estado de la orden — un pedido solo cuenta como PAGADO cuando DROPI acreditó la ganancia. Mientras tanto, si ya se entregó, se marca ENTREGADO.`;

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
    name: 'saldo_dropi',
    description: 'Consulta el saldo disponible en DROPI — dinero pendiente de pago por entregas realizadas',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'sincronizar_pagos_dropi',
    description: 'Revisa todos los pedidos con orden en DROPI que no están PAGADO ni CANCELADO. Primero chequea la wallet: si DROPI ya acreditó la ganancia de ese pedido, lo marca PAGADO en Sheets (esto es lo que realmente significa "me pagaron"). Si todavía no hay pago pero el estado en DROPI ya es entregado, lo marca ENTREGADO. Úsalo cuando Fabián pregunte "qué me pagaron hoy", "cuáles se entregaron", "sincroniza los pagos de DROPI". Es lo que corre el cron.',
    input_schema: { type: 'object', properties: {} }
  }
];

// Estados de DROPI que indican entrega (no necesariamente pago — la plata se
// acredita después, ver pagoDeOrden contra la wallet más abajo)
const ESTADOS_ENTREGADO = ['ENTREGADO', 'DELIVERED', 'PAGADO', 'PAGADO_PROVEEDOR', 'LIQUIDADO', 'COMPLETADO'];

async function executeTool(name, input) {
  switch (name) {
    case 'verificar_cliente_dropi': {
      const result = await dropi.verificarCliente(input.telefono);
      const obj = result?.raw?.objects ?? result?.raw?.data ?? {};
      if (result.total === null && result.entregados === null) {
        return `Sin datos para ese número en DROPI.`;
      }
      const pct = result.total > 0 ? Math.round((result.entregados / result.total) * 100) : 0;
      const icon = pct >= 90 ? '⭐' : pct >= 70 ? '✅' : pct >= 50 ? '⚠️' : '❌';
      return `${icon} *${result.nombre || input.telefono}*\nTotal: ${result.total} | Entregados: ${result.entregados} | Devoluciones: ${result.devueltos} | ${pct}%${result.clasificacion ? '\nClasificación: ' + result.clasificacion : ''}`;
    }

    case 'buscar_pedido_dropi': {
      const result = await dropi.buscarOrden(input.nombre, input.telefono);
      if (!result) return `No encontré pedido para ${input.nombre} en DROPI.`;
      return `📦 *${result.nombre}*\nGuía: ${result.guia || 'sin guía'}\nEstado: ${result.status || 'desconocido'}\nEnvío: $${result.shipping || 0}${result.pdfUrl ? '\n📄 ' + result.pdfUrl : ''}`;
    }

    case 'saldo_dropi': {
      const { saldo, congelado } = await dropi.getSaldoDropi();
      const congeladoTxt = congelado ? '\n⚠️ Cartera congelada' : '';
      return `💰 Saldo DROPI: *$${saldo.toFixed(2)}*${congeladoTxt}`;
    }

    case 'sincronizar_pagos_dropi': {
      const ordenes = await sheets.getOrdenesConDropi();
      if (ordenes.length === 0) return `No hay pedidos con orden DROPI pendientes de pago para sincronizar.`;

      // Una sola llamada a la wallet para todos los pedidos: dice cuándo la
      // plata entró de verdad, no cuándo DROPI marcó la entrega.
      let movimientos = [];
      try {
        movimientos = await dropi.getMovimientosWallet();
      } catch (e) {
        console.error('sincronizar_pagos: error leyendo wallet:', e.message);
      }

      const pagados = [];
      const entregados = [];
      const pendientes = [];

      for (const orden of ordenes) {
        try {
          const pago = dropi.pagoDeOrden(movimientos, orden.dropiId);
          if (pago) {
            await sheets.marcarPagado(orden.fila);
            pagados.push({ nombre: orden.nombre, guia: orden.guia, monto: pago.total });
            continue;
          }

          const dropiData = await dropi.getOrdenPorId(orden.dropiId);
          const statusDropi = (dropiData.status || '').toUpperCase();
          const esEntregado = ESTADOS_ENTREGADO.some(e => statusDropi.includes(e));
          if (esEntregado && orden.estado !== 'ENTREGADO') {
            await sheets.marcarEntregado(orden.fila);
            entregados.push({ nombre: orden.nombre, guia: orden.guia, status: dropiData.status });
          } else {
            pendientes.push({ nombre: orden.nombre, guia: orden.guia, status: dropiData.status || orden.estado });
          }
        } catch (e) {
          console.error(`sincronizar_pagos: error en orden ${orden.dropiId}:`, e.message);
          pendientes.push({ nombre: orden.nombre, guia: orden.guia, status: 'error consultando' });
        }
      }

      let respuesta = `📦 Revisados ${ordenes.length} pedidos:\n\n`;
      if (pagados.length > 0) {
        respuesta += `💰 *Marcados como PAGADO (${pagados.length}):*\n`;
        respuesta += pagados.map(o => `• ${o.nombre} — Guía ${o.guia} — $${o.monto.toFixed(2)}`).join('\n');
        respuesta += '\n\n';
      }
      if (entregados.length > 0) {
        respuesta += `✅ *Marcados como ENTREGADO, aún sin acreditar (${entregados.length}):*\n`;
        respuesta += entregados.map(o => `• ${o.nombre} — Guía ${o.guia}`).join('\n');
        respuesta += '\n\n';
      }
      if (pendientes.length > 0) {
        respuesta += `⏳ *Aún en tránsito (${pendientes.length}):*\n`;
        respuesta += pendientes.map(o => `• ${o.nombre} — ${o.status}`).join('\n');
      }
      if (pagados.length === 0 && entregados.length === 0) respuesta += `Nada nuevo — ninguno se entregó ni se acreditó todavía.`;
      return respuesta;
    }

    default:
      return 'Herramienta no reconocida.';
  }
}

async function chatDropi(history, newMessage) {
  const messages = [...history, { role: 'user', content: newMessage }];
  let response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 768,
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
      max_tokens: 768,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    });
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  messages.push({ role: 'assistant', content: response.content });
  return { text, updatedHistory: messages };
}

module.exports = { chatDropi, executeTool };
