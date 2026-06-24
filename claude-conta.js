const Anthropic = require('@anthropic-ai/sdk');
const sheets = require('./sheets');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente de contabilidad de Fabián Pizarro, dueño de Shotygames.

## Tu función
Registrar y consultar movimientos financieros del negocio: gastos, ingresos y transferencias entre cuentas.

## Cuentas disponibles
CAJA | PICHINCHA | GUAYAQUIL | PACÍFICO | PAYPHONE | DROPI | PRODUBANCO

## Categorías de GASTOS
COSTOS - VASOS | COSTOS - LACAS | COSTOS - INSUMOS | COSTOS - CAJAS JENGAS | COSTOS - IMPRENTA | COSTOS - ENGANCHADOS | COSTOS - TABLERO MDF JENGAS | COSTOS - CORTE TABLERO MDF JENGAS | COSTOS - EXTRAS | COSTOS - ADHESIVOS
SUELDOS - FABIAN | SUELDOS - NEREA | SUELDOS - TALLER
MARKETING Y PUBLICIDAD - PUBLICIDAD META
ADMINISTRATIVOS - INTERNET | ADMINISTRATIVOS - LUZ | ADMINISTRATIVOS - PLAN CLARO | ADMINISTRATIVOS - HOSTING | ADMINISTRATIVOS - LOVABLE | ADMINISTRATIVOS - CANVA
DEUDAS - COOPSI | DEUDAS - TJT PACIFICO | DEUDAS - OTROS
CARRO - GASOLINA | CARRO - LAVADAS | CARRO - MANTENIMIENTOS | CARRO - PARKING | CARRO - EXTRAS
AHORRO | DEVOLUCIONES | PERDIDAS | COMISIONES TRANSFERENCIAS | COMISIONES PAYPHONE | ENVIOS / ENTREGAS ADICIONALES | RUEDA | EXTRAS | SALIDA DE DIVISAS | AJUSTES

## Categorías de INGRESOS
INTERESES | PRESTAMOS | RUEDA | AJUSTES | EXTRAS | DIGITALES

## Reglas
- Cuando Fabián diga un movimiento, confirma antes de registrar: "✅ [TIPO]: $[valor] | [CATEGORIA] | [CUENTA]. ¿Confirmas?"
- Todo en MAYÚSCULAS al registrar.
- Montos como número puro sin signo $.
- Tono directo, sin relleno.`;

const TOOLS = [
  {
    name: 'registrar_gasto',
    description: 'Registra un gasto en la hoja GASTOS de Google Sheets',
    input_schema: {
      type: 'object',
      properties: {
        valor: { type: 'number' },
        categoria: { type: 'string' },
        cuenta: { type: 'string' },
        observaciones: { type: 'string' }
      },
      required: ['valor', 'categoria', 'cuenta']
    }
  },
  {
    name: 'registrar_ingreso',
    description: 'Registra un ingreso en la hoja INGRESOS de Google Sheets',
    input_schema: {
      type: 'object',
      properties: {
        valor: { type: 'number' },
        categoria: { type: 'string' },
        cuenta: { type: 'string' },
        observaciones: { type: 'string' }
      },
      required: ['valor', 'categoria', 'cuenta']
    }
  },
  {
    name: 'registrar_transferencia',
    description: 'Registra una transferencia entre cuentas propias',
    input_schema: {
      type: 'object',
      properties: {
        valor: { type: 'number' },
        sale: { type: 'string', description: 'Cuenta de origen' },
        entra: { type: 'string', description: 'Cuenta de destino' },
        observaciones: { type: 'string' }
      },
      required: ['valor', 'sale', 'entra']
    }
  }
];

async function executeTool(name, input) {
  switch (name) {
    case 'registrar_gasto':
      await sheets.registrarMovimiento('GASTOS', input);
      return `✅ Gasto registrado: $${input.valor} — ${input.observaciones || input.categoria}.`;
    case 'registrar_ingreso':
      await sheets.registrarMovimiento('INGRESOS', input);
      return `✅ Ingreso registrado: $${input.valor} — ${input.observaciones || input.categoria}.`;
    case 'registrar_transferencia':
      await sheets.registrarMovimiento('TRANSFERENCIAS', input);
      return `✅ Transferencia: $${input.valor} de ${input.sale} → ${input.entra}.`;
    default:
      return 'Herramienta no reconocida.';
  }
}

async function chatConta(history, newMessage) {
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

module.exports = { chatConta };
