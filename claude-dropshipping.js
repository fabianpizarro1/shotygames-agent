/**
 * Bot de Telegram de DROPSHIPPING (Truquito + Avanora).
 *
 * Separado del bot de Shotygames a propósito: otra cuenta de DROPI, otro Sheet,
 * otros productos. Mezclarlos haría que el bot confunda pedidos de un negocio
 * con los del otro.
 *
 * Qué hace:
 *   1. Cuando el encargado de WhatsApp confirma un pedido → lo crea en DROPI
 *   2. Consulta el estado de los pedidos
 *   3. Sincroniza guías: revisa cuáles ya tiene guía el proveedor y completa
 *      el Sheet con número de guía, flete y estado
 */

const Anthropic = require('@anthropic-ai/sdk');
const pedidosDropi = require('./projects/dropshipping/pedidos');
const hoja = require('./projects/dropshipping/sheets-pedidos');
const { buscar } = require('./projects/dropshipping/catalogo');
const { evaluar, precioParaMargen } = require('./projects/dropshipping/calculadora');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente de operaciones de dropshipping de Fabián Pizarro (tiendas Truquito y Avanora Naturals).

## Tu función
Gestionar los pedidos que llegan de las landings: crearlos en DROPI cuando el cliente confirma, seguir el estado de las guías, y mantener el Sheet al día.

## Flujo de un pedido
1. PENDIENTE_CONFIRMACION — llegó de la web, se le escribió por WhatsApp
2. EN_DROPI — el cliente confirmó, tú creaste el pedido en DROPI, falta que el proveedor genere la guía
3. GUIA_GENERADA — el proveedor generó la guía (hay número y flete)
4. ENTREGADO — se entregó
5. PAGADO — DROPI acreditó la plata
6. CANCELADO — no confirmó o se cayó

## Reglas
- Cuando Fabián diga que un pedido se confirmó, usa confirmar_pedido con el ID (ej. TRQ-12345).
- Antes de crear un pedido en DROPI, verifica que esté en PENDIENTE_CONFIRMACION. Si ya está EN_DROPI, avisa que ya fue creado — no lo dupliques.
- Crear un pedido en DROPI cuesta plata real. Si hay cualquier duda sobre los datos, pregunta antes de crear.
- Responde directo, en español, sin relleno. Tono de colega, no de asistente corporativo.
- Usa montos con $ y dos decimales.
- Si algo falla, di exactamente qué falló y qué hace falta para arreglarlo. No inventes que salió bien.`;

const TOOLS = [
  {
    name: 'confirmar_pedido',
    description: 'Crea en DROPI un pedido que el cliente ya confirmó por WhatsApp, y actualiza el Sheet a EN_DROPI. Úsalo cuando Fabián diga que un pedido se confirmó.',
    input_schema: {
      type: 'object',
      properties: { idPedido: { type: 'string', description: 'ID del pedido, ej. TRQ-12345' } },
      required: ['idPedido']
    }
  },
  {
    name: 'cancelar_pedido',
    description: 'Marca un pedido como CANCELADO en el Sheet (el cliente no contestó o se arrepintió).',
    input_schema: {
      type: 'object',
      properties: {
        idPedido: { type: 'string' },
        motivo: { type: 'string', description: 'Por qué se canceló' }
      },
      required: ['idPedido']
    }
  },
  {
    name: 'estado_pedidos',
    description: 'Muestra el resumen de pedidos por estado, y opcionalmente el detalle de un estado específico.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', description: 'Opcional: PENDIENTE_CONFIRMACION, EN_DROPI, GUIA_GENERADA, ENTREGADO, PAGADO, CANCELADO' }
      }
    }
  },
  {
    name: 'sincronizar_guias',
    description: 'Revisa en DROPI todos los pedidos que están EN_DROPI, detecta cuáles ya tienen guía generada por el proveedor, y actualiza el Sheet con el número de guía, el costo de envío y el estado GUIA_GENERADA. Es lo que corre el cron.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'buscar_producto',
    description: 'Busca productos en el catálogo de DROPI por nombre, con su costo, precio sugerido y stock.',
    input_schema: {
      type: 'object',
      properties: { texto: { type: 'string' } },
      required: ['texto']
    }
  },
  {
    name: 'calcular_precio',
    description: 'Calcula a qué precio hay que vender un producto para que deje margen, con los costos reales de Fabián (flete, retorno, CPA, tasa de entrega).',
    input_schema: {
      type: 'object',
      properties: {
        costo: { type: 'number', description: 'Costo del proveedor por unidad' },
        precio: { type: 'number', description: 'Opcional: precio a evaluar. Si no se da, devuelve el precio recomendado.' }
      },
      required: ['costo']
    }
  }
];

const usd = (n) => '$' + (Number(n) || 0).toFixed(2);

async function executeTool(name, input) {
  switch (name) {
    case 'confirmar_pedido': {
      const p = await hoja.buscarPedido(input.idPedido);
      if (!p) return `No encontré el pedido ${input.idPedido} en el Sheet.`;

      const d = hoja.aObjeto(p);
      if (d.estado === 'EN_DROPI' || d.ordenDropi) {
        return `El pedido ${d.idPedido} YA fue creado en DROPI (orden ${d.ordenDropi}). No lo cree de nuevo.`;
      }
      if (d.estado === 'CANCELADO') {
        return `El pedido ${d.idPedido} está CANCELADO. Si hay que revivirlo, cambia el estado en el Sheet primero.`;
      }

      const r = await pedidosDropi.crearPedido({
        productoId: Number(d.dropiProductId),
        cantidad: d.cantidad,
        precioVenta: d.total,
        cliente: {
          nombre: d.nombre,
          telefono: d.telefono,
          provincia: d.provincia,
          ciudad: d.ciudad,
          direccion: `${d.direccion}${d.referencias ? ' — ' + d.referencias : ''}`
        },
        notas: `${d.idPedido} · ${d.tienda}`
      });

      if (!r.ok) return `Falló la creación en DROPI: ${r.error}`;

      await hoja.actualizarFila(d.fila, {
        ESTADO: 'EN_DROPI',
        ORDEN_DROPI: r.orderId,
        COSTO: r.costoProveedor,
        F_CONFIRM: new Date().toISOString()
      });

      return `Pedido ${d.idPedido} creado en DROPI.
Orden: ${r.orderId}
Producto: ${r.producto} x${d.cantidad}
Costo proveedor: ${usd(r.costoProveedor)}
Cobrar al entregar: ${usd(d.total)}
Bodega: ${r.bodega.nombre || r.bodega.id}
Estado: EN_DROPI — esperando que el proveedor genere la guía.`;
    }

    case 'cancelar_pedido': {
      const p = await hoja.buscarPedido(input.idPedido);
      if (!p) return `No encontré el pedido ${input.idPedido}.`;
      const d = hoja.aObjeto(p);

      await hoja.actualizarFila(d.fila, {
        ESTADO: 'CANCELADO',
        NOTAS: input.motivo || 'Cancelado'
      });
      return `Pedido ${d.idPedido} marcado como CANCELADO.${input.motivo ? ' Motivo: ' + input.motivo : ''}`;
    }

    case 'estado_pedidos': {
      const todos = (await hoja.leerPedidos()).map(hoja.aObjeto);
      if (!todos.length) return 'No hay pedidos registrados todavía.';

      if (input.estado) {
        const lista = todos.filter((p) => p.estado === input.estado);
        if (!lista.length) return `No hay pedidos en estado ${input.estado}.`;
        return `${lista.length} pedido(s) en ${input.estado}:\n\n` +
          lista.map((p) =>
            `${p.idPedido} · ${p.nombre} · ${p.ciudad} · ${p.producto} x${p.cantidad} · ${usd(p.total)}` +
            (p.guia ? ` · guía ${p.guia}` : '')
          ).join('\n');
      }

      const conteo = {};
      let cobrar = 0;
      for (const p of todos) {
        conteo[p.estado] = (conteo[p.estado] || 0) + 1;
        if (['EN_DROPI', 'GUIA_GENERADA'].includes(p.estado)) cobrar += p.total;
      }
      return `${todos.length} pedidos en total:\n\n` +
        Object.entries(conteo).map(([e, n]) => `${e}: ${n}`).join('\n') +
        `\n\nEn camino por cobrar: ${usd(cobrar)}`;
    }

    case 'sincronizar_guias': {
      const enDropi = await hoja.pedidosPorEstado('EN_DROPI');
      if (!enDropi.length) return 'No hay pedidos EN_DROPI para revisar.';

      const actualizados = [];
      const sinGuia = [];
      const errores = [];

      for (const p of enDropi) {
        const d = hoja.aObjeto(p);
        if (!d.ordenDropi) { errores.push(`${d.idPedido}: sin ORDEN DROPI en el Sheet`); continue; }

        try {
          const o = await pedidosDropi.getOrden(d.ordenDropi);
          if (o.guia) {
            await hoja.actualizarFila(d.fila, {
              ESTADO: 'GUIA_GENERADA',
              GUIA: o.guia,
              FLETE: o.costoEnvio,
              F_GUIA: new Date().toISOString()
            });
            actualizados.push(`${d.idPedido} → guía ${o.guia} (flete ${usd(o.costoEnvio)})`);
          } else {
            sinGuia.push(`${d.idPedido} (${o.estadoDropi || 'sin estado'})`);
          }
        } catch (e) {
          errores.push(`${d.idPedido}: ${e.response?.status || e.message}`);
        }
      }

      let out = '';
      if (actualizados.length) out += `✅ ${actualizados.length} con guía nueva:\n${actualizados.join('\n')}\n\n`;
      if (sinGuia.length) out += `⏳ ${sinGuia.length} esperando al proveedor:\n${sinGuia.join('\n')}\n\n`;
      if (errores.length) out += `⚠️ ${errores.length} con problema:\n${errores.join('\n')}`;
      return out.trim() || 'Nada que actualizar.';
    }

    case 'buscar_producto': {
      const res = await buscar(input.texto);
      if (!res.length) return `No encontré productos para "${input.texto}".`;
      return res.slice(0, 10).map((p) => {
        const rec = precioParaMargen({ costo: parseFloat(p.sale_price) }, 0.25);
        return `${p.id} · ${p.name}\n   costo ${usd(p.sale_price)} · sugerido ${usd(p.suggested_price)} · vender a ${usd(rec)} · stock ${p.stock ?? '—'}`;
      }).join('\n\n');
    }

    case 'calcular_precio': {
      const costo = Number(input.costo);
      if (input.precio) {
        const r = evaluar({ precio: Number(input.precio), costo });
        return `A ${usd(input.precio)} con costo ${usd(costo)}:
Utilidad por pedido: ${usd(r.utilidadPorPedido)}
Margen neto: ${r.margenNeto.toFixed(1)}%
CPA máximo: ${usd(r.cpaMaximo)}
${r.semaforo.color} ${r.semaforo.texto}`;
      }
      const p25 = precioParaMargen({ costo }, 0.25);
      const p15 = precioParaMargen({ costo }, 0.15);
      return `Con costo ${usd(costo)}:
Punto de equilibrio: ${usd(precioParaMargen({ costo }, 0))}
Margen 15%: ${usd(p15)}
Margen 25%: ${usd(p25)}  ← recomendado`;
    }

    default:
      return `Herramienta desconocida: ${name}`;
  }
}

/**
 * Devuelve { text, updatedHistory } — es la forma que espera setupBot en
 * telegram-bot.js. Si se devuelve un string pelado, el bot revienta con
 * "Cannot read properties of undefined (reading 'slice')".
 */
async function chatDropshipping(history, mensaje) {
  const messages = [...(history || []), { role: 'user', content: mensaje }];

  for (let vuelta = 0; vuelta < 6; vuelta++) {
    const res = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    });

    if (res.stop_reason !== 'tool_use') {
      const text = res.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      messages.push({ role: 'assistant', content: res.content });
      return { text: text || 'No supe qué responder a eso.', updatedHistory: messages };
    }

    messages.push({ role: 'assistant', content: res.content });

    const resultados = [];
    for (const bloque of res.content) {
      if (bloque.type !== 'tool_use') continue;
      let salida;
      try {
        salida = await executeTool(bloque.name, bloque.input);
      } catch (e) {
        salida = `Error en ${bloque.name}: ${e.message}`;
      }
      resultados.push({ type: 'tool_result', tool_use_id: bloque.id, content: String(salida) });
    }
    messages.push({ role: 'user', content: resultados });
  }

  return {
    text: 'Se me acabaron los intentos procesando eso. Probá de nuevo o decímelo más simple.',
    updatedHistory: messages
  };
}

module.exports = { chatDropshipping, executeTool };
