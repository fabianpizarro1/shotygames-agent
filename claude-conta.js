const Anthropic = require('@anthropic-ai/sdk');
const sheets = require('./sheets');
const conta = require('./sheets-conta');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente de contabilidad de Fabián Pizarro, dueño de Shotygames.

## Tu función
Registrar, consultar y analizar las finanzas del negocio. Tienes acceso completo a:
- Movimientos: gastos, ingresos, transferencias
- Gastos fijos mensuales y su impacto
- Deudas y seguimiento de pagos
- Presupuestos por categoría
- Saldos reales de todas las cuentas

## Sé PROACTIVO
Cuando Fabián consulte datos, no te limites a mostrarlos — analiza y dile qué significan:
- Si los saldos están bajos → alerta y qué hacer
- Si hay deudas sin pagar hace tiempo → recordárselo
- Si el gasto en una categoría subió → mencionarlo
- Si pide registrar algo → confirma, registra, y si nota algo raro (ej: gasto muy alto) díselo

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

## Flujo de cierre nocturno (10pm)
Cada noche a las 10pm recibes una notificación automática con el resumen del día y los saldos teóricos.
Después, Fabián te enviará cuánto hay REAL en cada cuenta (en el formato que quiera, ej: "Caja: 20, Pichincha: 300").
Cuando eso pase:
1. Usa `actualizar_saldo` para cada cuenta que mencione
2. Compara el saldo real reportado con el saldo teórico que calculó la notificación
3. Muestra la diferencia por cuenta: ✅ si cuadra (diferencia < $1) o ❌ si hay diferencia con el monto exacto
4. Si hay diferencias, sugiere dónde puede estar el error (movimiento no registrado, etc.)

## Reglas operativas
- Confirma antes de registrar: "✅ [TIPO]: $[valor] | [CATEGORIA] | [CUENTA]. ¿Confirmas?"
- Todo en MAYÚSCULAS al registrar.
- Montos como número puro sin signo $.
- Tono directo, sin relleno. Respuestas cortas y accionables.`;

const TOOLS = [
  // ── Movimientos ──
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
  },

  // ── Gastos Fijos ──
  {
    name: 'consultar_gastos_fijos',
    description: 'Lee todos los gastos fijos mensuales y el total. Útil para ver cuánto cuesta el negocio por mes.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'actualizar_gasto_fijo',
    description: 'Actualiza el monto mensual de un gasto fijo existente (ej: cambió el precio del alquiler)',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Nombre del gasto fijo exacto (ej: ALQUILER, NEREA, CARRO GASOLINA)' },
        nuevo_mensual: { type: 'number', description: 'Nuevo monto mensual en USD' }
      },
      required: ['descripcion', 'nuevo_mensual']
    }
  },
  {
    name: 'agregar_gasto_fijo',
    description: 'Agrega un nuevo gasto fijo que se repite cada mes',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string' },
        categoria: { type: 'string', description: 'Categoría del gasto (usar las categorías de gastos disponibles)' },
        mensual: { type: 'number' }
      },
      required: ['descripcion', 'categoria', 'mensual']
    }
  },

  // ── Deudas ──
  {
    name: 'consultar_deudas',
    description: 'Muestra todas las deudas con su saldo pendiente actual',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'registrar_pago_deuda',
    description: 'Registra un pago parcial o total de una deuda',
    input_schema: {
      type: 'object',
      properties: {
        acreedor: { type: 'string', description: 'Nombre del acreedor (ej: MAMA, BANCO PACIFICO)' },
        monto_pago: { type: 'number' }
      },
      required: ['acreedor', 'monto_pago']
    }
  },
  {
    name: 'agregar_deuda',
    description: 'Registra una nueva deuda',
    input_schema: {
      type: 'object',
      properties: {
        negocio: { type: 'string' },
        acreedor: { type: 'string' },
        descripcion: { type: 'string' },
        monto_total: { type: 'number' }
      },
      required: ['negocio', 'acreedor', 'descripcion', 'monto_total']
    }
  },

  // ── Saldos ──
  {
    name: 'consultar_saldos',
    description: 'Muestra los saldos reales actuales de todas las cuentas y el total de liquidez',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'actualizar_saldo',
    description: 'Actualiza el saldo real de una cuenta bancaria o caja',
    input_schema: {
      type: 'object',
      properties: {
        cuenta: { type: 'string' },
        saldo: { type: 'number' }
      },
      required: ['cuenta', 'saldo']
    }
  },

  // ── Presupuestos ──
  {
    name: 'consultar_presupuesto',
    description: 'Muestra el presupuesto del mes. Si no se especifica mes/año, usa el mes actual.',
    input_schema: {
      type: 'object',
      properties: {
        mes: { type: 'number', description: 'Mes (1-12). Opcional.' },
        anio: { type: 'number', description: 'Año (ej: 2026). Opcional.' }
      }
    }
  },
  {
    name: 'agregar_presupuesto',
    description: 'Agrega una línea de presupuesto para el mes actual o uno específico',
    input_schema: {
      type: 'object',
      properties: {
        mes: { type: 'number' },
        anio: { type: 'number' },
        negocio: { type: 'string' },
        categoria: { type: 'string' },
        monto: { type: 'number' },
        cuenta: { type: 'string' }
      },
      required: ['mes', 'anio', 'negocio', 'categoria', 'monto']
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

    case 'consultar_gastos_fijos': {
      const { items, totalMensual } = await conta.leerGastosFijos();
      const lista = items.map(i => `• ${i.descripcion}: $${i.mensual.toFixed(2)}/mes`).join('\n');
      return `💸 GASTOS FIJOS MENSUALES\n${lista}\n\nTOTAL: $${totalMensual.toFixed(2)}/mes ($${(totalMensual/4.6).toFixed(2)}/sem)`;
    }

    case 'actualizar_gasto_fijo': {
      const r = await conta.actualizarGastoFijo(input.descripcion, input.nuevo_mensual);
      if (!r) return `❌ No encontré "${input.descripcion}" en gastos fijos.`;
      return `✅ ${r.descripcion} actualizado a $${r.nuevoMensual}/mes ($${r.semanal}/sem)`;
    }

    case 'agregar_gasto_fijo': {
      const r = await conta.agregarGastoFijo(input);
      return `✅ Gasto fijo agregado: ${r.descripcion} — $${r.mensual}/mes`;
    }

    case 'consultar_deudas': {
      const deudas = await conta.leerDeudas();
      if (!deudas.length) return 'No hay deudas registradas.';
      const lista = deudas.map(d =>
        `• ${d.acreedor}: $${d.saldo_pendiente.toFixed(2)} pendiente de $${d.monto_total} (pagado: $${d.monto_pagado})`
      ).join('\n');
      const totalPendiente = deudas.reduce((s, d) => s + d.saldo_pendiente, 0);
      return `🔴 DEUDAS\n${lista}\n\nTOTAL PENDIENTE: $${totalPendiente.toFixed(2)}`;
    }

    case 'registrar_pago_deuda': {
      const r = await conta.registrarPagoDeuda(input.acreedor, input.monto_pago);
      if (!r) return `❌ No encontré deuda con "${input.acreedor}".`;
      return `✅ Pago registrado: $${input.monto_pago} a ${r.acreedor}. Pendiente: $${r.pendiente.toFixed(2)} de $${r.total}`;
    }

    case 'agregar_deuda': {
      const r = await conta.agregarDeuda(input);
      return `✅ Deuda registrada: $${r.monto_total} con ${r.acreedor}`;
    }

    case 'consultar_saldos': {
      const { saldos, total } = await conta.leerSaldosReales();
      const lista = saldos.map(s => `• ${s.cuenta}: $${s.saldo.toFixed(2)} (al ${s.actualizado})`).join('\n');
      const alerta = total < 200 ? '\n\n⚠️ Liquidez crítica — menos de $200 en total.' : '';
      return `💰 SALDOS REALES\n${lista}\n\nTOTAL LIQUIDEZ: $${total.toFixed(2)}${alerta}`;
    }

    case 'actualizar_saldo': {
      const r = await conta.actualizarSaldo(input.cuenta, input.saldo);
      return `✅ Saldo ${r.cuenta} actualizado a $${r.saldo} (${r.fecha})`;
    }

    case 'consultar_presupuesto': {
      const hoy = new Date();
      const mes = input.mes || (hoy.getMonth() + 1);
      const anio = input.anio || hoy.getFullYear();
      const { items, total } = await conta.leerPresupuestos(mes, anio);
      if (!items.length) return `No hay presupuesto registrado para ${mes}/${anio}.`;
      const lista = items.map(i => `• ${i.categoria}: $${i.monto}`).join('\n');
      return `📊 PRESUPUESTO ${mes}/${anio}\n${lista}\n\nTOTAL: $${total.toFixed(2)}`;
    }

    case 'agregar_presupuesto': {
      const r = await conta.agregarPresupuesto(input);
      return `✅ Presupuesto agregado: ${r.categoria} $${r.monto} para ${r.mes}/${r.anio}`;
    }

    default:
      return 'Herramienta no reconocida.';
  }
}

async function chatConta(history, newMessage) {
  const messages = [...history, { role: 'user', content: newMessage }];
  let response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
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
      max_tokens: 1024,
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
