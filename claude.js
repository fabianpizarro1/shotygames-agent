const Anthropic = require('@anthropic-ai/sdk');
const tools = require('./tools');
const sheets = require('./sheets');
const dropi = require('./dropi');
const { downloadPdf, merge4Up, generateThankyouCards, mergePdfs } = require('./pdf');
const { verificarCliente } = require('./dropi');
const { sendDocument } = require('./evolution');
const { uploadPdf } = require('./drive');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente operativo de Fabián Pizarro, dueño de Shotygames — juegos de mesa para fiestas, venta por WhatsApp, envíos a todo Ecuador.

## Tu identidad
- Directo, sin relleno ni halagos vacíos.
- Español siempre. Tono de amigo de confianza.
- Si algo no cuadra, lo dices.

## Productos y precios
**Físicos:**
- NORMAL (N) — $23
- PICANTE (P) — $23
- PAREJAS (PAR) — $23
- ENGANCHADOS (ENG) — $28

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
- Si no mencionó pago (pedido 100% contraentrega):
  → anticipo vacío, saldo = pvp_total, cuenta = DROPI

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
- Transportadora: [TRANSPORTADORA]
- Notas: [si hay algo adicional, sino: —]
- Guía DROPI: [Solo si es SERVIENTREGA → "Se creará automáticamente". Si es otra → "No aplica (sin guía DROPI)"]

No hagas nada hasta que Fabián confirme.

### Paso 4 — Cuando Fabián confirme
Ejecuta según la transportadora:

**Si transportadora = SERVIENTREGA** (o no se especificó ninguna):
1. registrar_pedido — registra en Google Sheets
2. crear_guia_dropi — crea la guía en DROPI
   - Incluye siempre pvp_total (precio de venta total) y saldo
   - Si saldo > 0: pedido CON RECAUDO, DROPI cobra al entregar
   - Si saldo = 0: pedido SIN RECAUDO, pvp_total se usa para calcular precio por unidad
   - Incluye siempre el campo "provincia" usando tu conocimiento de geografía de Ecuador. Nunca preguntes la provincia — deducirla tú mismo.
Responde con una línea resumida + el link del PDF de la guía.

**Si transportadora = COOPERATIVA, DOMICILIO o cualquier otra distinta de SERVIENTREGA:**
1. registrar_pedido — solo registra en Google Sheets. NO crear guía en DROPI.
Responde confirmando el registro sin mencionar guía ni DROPI.

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

**Paso 1 — Intenta sincronizar primero:**
→ USA sincronizar_guia_dropi con el nombre.
- Si el pedido ya tiene una orden en DROPI (aunque sea sin guía), el tool la intentará generar y actualizar Sheets automáticamente.
- Si sale exitoso: responde con guía + link + envío. No hagas nada más.

**Paso 2 — Solo si sincronizar_guia_dropi dice "No existe una orden en DROPI":**
→ Ahí sí crea la orden desde cero:
1. Usa buscar_pedido para obtener los datos del pedido
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

## REGLA CRÍTICA — Guía de pedido existente
Cuando Fabián diga cualquier variante de "ponle la guía a [nombre]", "sincroniza la guía de [nombre]", "saca la guía de [nombre]", "actualiza la guía de [nombre]":
→ USA INMEDIATAMENTE sincronizar_guia_dropi con solo el nombre.
→ NUNCA pidas teléfono, número de guía ni costo de envío — el tool los busca solo.
→ Si el tool devuelve una lista de candidatos (varios pedidos con ese nombre), muéstrasela a Fabián y pregunta cuál es.
→ Cuando Fabián responda con el nombre completo, llama de nuevo al tool con ese nombre exacto.

## Búsqueda de nombres — cómo funciona
Los tools buscan por nombre ignorando tildes, de forma parcial y con tolerancia a typos.
- "FABIAN" encuentra "FABIÁN PIZARRO MONTENEGRO"
- "FABIAN PIZARRO" también lo encuentra
- "FABIANO PIZARRO" (typo) puede devolver candidatos
- Si hay varios posibles → el tool te devuelve la lista y pregunta cuál es

## Consultar guía de un pedido
Cuando Fabián diga "dame la guía de [nombre]", "qué guía tiene [nombre]", "cuál es la guía de [nombre]", "el número de guía de [nombre]":
→ USA obtener_guia_pedido con el nombre.
→ Devuelve el número de guía y el link del PDF directo.
→ Si el pedido no tiene guía aún, díselo.

## Notificar guía a clientes
Cuando Fabián diga algo como "manda las guías a los clientes", "notifica a todos", "avísales a todos", "manda la guía a [nombre]":
→ USA INMEDIATAMENTE notificar_guia_clientes.
→ Con nombre específico: pasa el nombre. Sin nombre o "todos": no pases nombre (batch automático).
→ NUNCA pidas confirmación para esto — ejecuta directo.
→ Sheets se encarga de enviar el WhatsApp automáticamente al marcar la casilla.

## Imprimir guías de envío
Cuando Fabián diga "imprime las guías", "mándame las guías", "necesito las guías para imprimir", "dame el PDF de las guías":
→ USA imprimir_guias INMEDIATAMENTE sin pedir confirmación y sin parámetros.
→ El tool busca TODOS los pedidos en estado PENDIENTE que tengan guía generada y aún no estén marcados como impresos (columna IMPRESO).
→ Descarga los PDFs de DROPI, los combina 4 por hoja A4, te envía el PDF por WhatsApp y marca automáticamente esos pedidos como impresos en Sheets.
→ Si algún PDF falla, avisa cuáles no se pudieron incluir.
→ NUNCA digas que no puedes imprimir — siempre intenta con imprimir_guias.

## Verificar cliente en DROPI
Cuando Fabián mande un número de teléfono preguntando si el cliente es confiable, si acepta contraentrega, o quiera saber su historial en DROPI:
→ USA verificar_cliente_dropi con ese teléfono.
→ Devuelve total de pedidos, entregados y devoluciones en toda la plataforma.
→ Úsalo también cuando diga "verifica este número", "cómo está este cliente en DROPI", "cuántas devoluciones tiene".

## Editar pedidos
Cuando Fabián diga algo como "pon el pedido de X como enviado", "cambia la dirección de X a Y", "marca como entregado el de X":
→ USA actualizar_pedido con el nombre y los cambios.
→ Para cambios de ESTADO (ENVIADO, ENTREGADO, PENDIENTE): ejecuta directo sin pedir confirmación — es rápido y reversible.
→ Para otros campos (dirección, teléfono, etc.): confirma primero: "¿Cambio [CAMPO] de [NOMBRE] a [VALOR]?" y espera confirmación.
→ ESTADO válidos: PENDIENTE (sin enviar) | ENVIADO (despachado) | ENTREGADO (recibido por cliente).
→ Puedes cambiar varios campos a la vez pasando múltiples keys en cambios.

## Consultas y reportes de pedidos
Cuando Fabián haga preguntas sobre el estado general de los pedidos:
→ USA reporte_pedidos. No pidas confirmación — es solo lectura.
→ reporte_pedidos lee TODOS los pedidos de TODAS las fechas — no tiene límite de fecha.
→ NUNCA uses pedidos_hoy para responder consultas generales. pedidos_hoy es SOLO para "qué pedidos entraron hoy".
→ NUNCA digas que no puedes ver pedidos de otras fechas o que necesitas acceder directamente a Sheets — reporte_pedidos ya lo hace.

| Lo que dice Fabián | tipo | filtro_estado |
|---|---|---|
| "cuántos pedidos pendientes hay" / "qué falta enviar" | PENDIENTES | PENDIENTE |
| "qué productos faltan enviar" / "qué tengo que armar" | PRODUCTOS_PENDIENTES | PENDIENTE |
| "resumen de pedidos" / "cómo van los pedidos" | RESUMEN | — |
| "pedidos enviados" / "qué está en camino" | POR_ESTADO | ENVIADO |
| "pedidos entregados" | POR_ESTADO | ENTREGADO |

Al responder PRODUCTOS_PENDIENTES, lista solo los productos con cantidad > 0 y muestra el total de unidades.
Al responder PENDIENTES o POR_ESTADO, lista nombre, ciudad, productos y fecha.

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
        // Guardar el order ID en Sheets aunque la guía haya fallado — permite reintentar después
        if (input.telefono && orden._orderId) {
          try {
            await sheets.actualizarGuia(input.telefono, null, null, orden._orderId);
            console.log(`crear_guia_dropi: DROPI order ID ${orden._orderId} guardado en Sheets para reintento`);
          } catch (e) {
            console.error('Error guardando DROPI ID en Sheets:', e.message);
          }
        }
        return `⚠️ Orden creada en DROPI (ID: ${orden._orderId}) pero DROPI no generó la guía: ${orden._guideError}\n\nEl ID de la orden quedó guardado en Sheets. Cuando DROPI esté disponible, di *"ponle la guía a ${input.nombre}"* para reintentarlo.`;
      }
      if (!guia) {
        if (input.telefono && orden?._orderId) {
          try { await sheets.actualizarGuia(input.telefono, null, null, orden._orderId); } catch (_) {}
        }
        return `⚠️ Orden DROPI creada (ID: ${orden?._orderId || '?'}) pero no se obtuvo número de guía. Di *"ponle la guía a ${input.nombre}"* para reintentarlo.`;
      }

      console.log(`Guía generada: ${guia} | shipping: ${orden._shipping} | tel: ${input.telefono}`);

      // Actualizar Sheets: GUIA + ENVIO + LINK RASTREO + DROPI order ID
      if (input.telefono) {
        const updResult = await sheets.actualizarGuia(input.telefono, guia, orden._shipping, orden._orderId);
        console.log('actualizarGuia result:', JSON.stringify(updResult));
      } else {
        console.log('ADVERTENCIA: crear_guia_dropi sin telefono — no se puede actualizar Sheets');
      }

      const pdfUrl = orden._pdfUrl || `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${orden._orderId}-GUIA-${guia}.pdf`;
      const envioStr = orden._shipping ? ` | Envío: $${parseFloat(orden._shipping).toFixed(2)}` : '';

      return `✅ Guía *${guia}*${envioStr}\n\n📄 ${pdfUrl}`;
    }

    case 'sincronizar_guia_dropi': {
      // Paso 1: buscar el pedido en Sheets (obtiene teléfono + DROPI order ID guardado)
      const sheetData = await sheets.getDropiOrderId(input.nombre);
      if (!sheetData) {
        return `No encontré ningún pedido para "${input.nombre}" en Sheets.`;
      }
      // Si hay múltiples coincidencias, preguntar cuál es
      if (sheetData.candidatos) {
        const lista = sheetData.candidatos.map((c, i) =>
          `${i + 1}. ${c.nombre} — ${c.fecha}${c.guia ? ' — Guía: ' + c.guia : ''}`
        ).join('\n');
        return `Encontré varios pedidos para "${input.nombre}":\n${lista}\n\n¿Cuál es? Dime el nombre completo.`;
      }
      const { dropiOrderId, telefono, nombre: nombreReal } = sheetData;
      console.log(`sincronizar_guia: ${nombreReal} | tel:${telefono} | dropiId:${dropiOrderId}`);

      let found = null;

      // Paso 2a: si tenemos el order ID, buscar directamente (más confiable)
      if (dropiOrderId) {
        try {
          found = await dropi.getOrdenPorId(dropiOrderId);
          console.log(`sincronizar_guia: obtenida por ID — guia=${found?.guia}`);
        } catch (e) {
          console.error('Error obteniendo por ID:', e.message);
        }

        // La orden existe en DROPI pero la guía nunca se generó → intentar generarla ahora
        if (!found?.guia) {
          console.log(`sincronizar_guia: sin guía, intentando generarla para orden ${dropiOrderId}...`);
          try {
            const generated = await dropi.generarGuia(dropiOrderId);
            if (generated?.guia) {
              found = generated;
              console.log(`sincronizar_guia: guía generada en reintento — ${found.guia}`);
            }
          } catch (e) {
            console.error('Error generando guía en reintento:', e.message);
          }
        }
      }

      // Paso 2b: fallback — búsqueda por nombre/teléfono
      if (!found || !found.guia) {
        found = await dropi.buscarOrden(input.nombre, telefono);
        console.log(`sincronizar_guia: búsqueda fallback — ${JSON.stringify(found)}`);
      }

      if (!found || !found.guia) {
        const noOrderMsg = dropiOrderId
          ? `La orden de ${nombreReal} existe en DROPI (ID: ${dropiOrderId}) pero DROPI sigue sin generar la guía. Intenta de nuevo más tarde o revisa el panel de DROPI.`
          : `No existe una orden en DROPI para ${nombreReal}. Usa "crea la guía de ${nombreReal}" para crear la orden completa.`;
        return noOrderMsg;
      }

      // Paso 3: actualizar Sheets
      const upd = await sheets.actualizarGuia(telefono, found.guia, found.shipping, found.orderId);
      if (!upd.updated) {
        return `Guía *${found.guia}* encontrada en DROPI (envío: $${parseFloat(found.shipping||0).toFixed(2)}) pero no pude actualizar Sheets para ${nombreReal}. Tel: ${telefono}`;
      }
      const envioStr = found.shipping ? ` | Envío: $${parseFloat(found.shipping).toFixed(2)}` : '';
      const pdfStr = found.pdfUrl ? `\n\n📄 ${found.pdfUrl}` : '';
      return `✅ ${nombreReal} — Guía *${found.guia}*${envioStr}${pdfStr}`;
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

    case 'obtener_guia_pedido': {
      const res = await sheets.obtenerGuiaPedido(input.nombre);
      if (!res) return `No encontré ningún pedido para "${input.nombre}".`;
      if (res.candidatos) {
        const lista = res.candidatos.map((c, i) =>
          `${i + 1}. ${c.nombre} — ${c.fecha}${c.guia ? ' — Guía: ' + c.guia : ' — sin guía'}`
        ).join('\n');
        return `Encontré varios pedidos para "${input.nombre}":\n${lista}\n\n¿De cuál quieres la guía?`;
      }
      if (!res.guia) {
        return `El pedido de ${res.nombre} (${res.fecha}) aún no tiene guía generada.`;
      }
      const pdfPart = res.pdfUrl ? `\n\n📄 ${res.pdfUrl}` : '';
      return `📦 *${res.nombre}* — ${res.fecha}\nGuía: *${res.guia}*${pdfPart}`;
    }

    case 'notificar_guia_clientes': {
      const res = await sheets.marcarNotificacionWA(input.nombre || null);
      // Múltiples coincidencias → preguntar cuál
      if (res.candidatos) {
        const lista = res.candidatos.map((c, i) =>
          `${i + 1}. ${c.nombre} — ${c.fecha}`
        ).join('\n');
        return `Encontré varios pedidos para "${input.nombre}":\n${lista}\n\n¿A cuál le mando la notificación? Dime el nombre completo.`;
      }
      if (res.yaNotificado) {
        return `El pedido de ${res.yaNotificado} ya fue notificado antes (casilla ya marcada).`;
      }
      if (res.marcados === 0) {
        return input.nombre
          ? `No encontré pedido para "${input.nombre}".`
          : `No hay pedidos de hoy con guía pendientes de notificar (todos ya están marcados o sin guía).`;
      }
      const lista = res.nombres.join(', ');
      return `✅ Notificación activada para ${res.marcados} pedido(s): ${lista}. Sheets enviará el mensaje automáticamente.`;
    }

    case 'imprimir_guias': {
      const { guias, impresoIdx } = await sheets.getGuiasParaImprimir();

      if (guias.length === 0) {
        return `No hay guías pendientes de imprimir. Todos los pedidos PENDIENTES con guía ya están marcados como impresos, o aún no tienen guía generada.`;
      }

      // Descargar PDFs en paralelo, saltando los que fallen
      const resultados = await Promise.allSettled(
        guias.map(g => downloadPdf(g.pdfUrl).then(buf => ({ ...g, buf })))
      );

      const descargados = resultados
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      const fallidos = guias.filter((_, i) => resultados[i].status === 'rejected');

      if (descargados.length === 0) {
        return `No se pudo descargar ningún PDF. Puede que las guías aún no estén listas en DROPI. Intenta en unos minutos.`;
      }

      // Combinar guías 4 por hoja
      const pdfGuias = await merge4Up(descargados.map(d => d.buf));

      // Tarjetas: si falla por cualquier razón, se envían solo las guías
      let pdfFinal = pdfGuias;
      try {
        const pdfTarjetas = await generateThankyouCards(descargados.map(d => ({ nombre: d.nombre })));
        pdfFinal = await mergePdfs(pdfGuias, pdfTarjetas);
      } catch (e) {
        console.error('generateThankyouCards error (se omiten tarjetas):', e.message);
      }

      // Nombre del archivo
      const hoy = new Date().toLocaleDateString('es-EC', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        timeZone: 'America/Guayaquil'
      });
      const fileName = `guias-${hoy.replace(/\//g, '-')}.pdf`;

      // Enviar el PDF — usa callback de Telegram si está disponible, si no manda por WhatsApp
      if (input._sendDocument) {
        await input._sendDocument(pdfFinal, fileName);
      } else {
        await sendDocument(input._from, pdfFinal, fileName);
      }

      // Marcar como impresas en Sheets
      await sheets.marcarGuiasImpresas(descargados.map(d => d.rowNum), impresoIdx);

      // Subir a Drive — no crítico, no bloquea la respuesta
      let driveMsg = '';
      try {
        const driveFile = await uploadPdf(pdfFinal, fileName);
        driveMsg = `\n📁 Drive: ${driveFile.name}`;
      } catch (e) {
        console.error('Drive upload error:', e.message);
        driveMsg = `\n⚠️ Drive: no se pudo subir`;
      }

      const nombresStr = descargados.map(d => `• ${d.nombre} — Guía ${d.guia}`).join('\n');
      const fallMsg = fallidos.length > 0
        ? `\n\n⚠️ No se pudo descargar (${fallidos.length}): ${fallidos.map(f => f.nombre).join(', ')}`
        : '';

      return `✅ PDF enviado — ${descargados.length} guía(s) en ${Math.ceil(descargados.length / 4)} hoja(s):\n\n${nombresStr}${fallMsg}${driveMsg}`;
    }

    case 'actualizar_pedido': {
      const res = await sheets.actualizarPedido(input.nombre, input.cambios);
      if (!res.found) return `No encontré ningún pedido para "${input.nombre}".`;
      if (res.candidatos) {
        const lista = res.candidatos.map((c, i) =>
          `${i + 1}. ${c.nombre} — ${c.fecha}${c.estado ? ' — ' + c.estado : ''}`
        ).join('\n');
        return `Encontré varios pedidos para "${input.nombre}":\n${lista}\n\n¿Cuál quieres actualizar? Dime el nombre completo.`;
      }
      if (!res.updated) return `No hay campos válidos para actualizar en el pedido de ${res.nombre}.`;
      const camposStr = Object.entries(input.cambios)
        .map(([k, v]) => `${k.toUpperCase()}: ${String(v).toUpperCase()}`)
        .join(' | ');
      return `✅ Pedido de *${res.nombre}* (${res.fecha}) actualizado — ${camposStr}.`;
    }

    case 'reporte_pedidos': {
      const res = await sheets.reportePedidos(input.tipo, input.filtro_estado);
      if (res.error) return res.error;

      const tipoBig = (input.tipo || '').toUpperCase();

      if (tipoBig === 'PRODUCTOS_PENDIENTES') {
        const p = res.productos;
        const lineas = [];
        if (p.normal > 0)       lineas.push(`• ${p.normal} NORMAL`);
        if (p.picante > 0)      lineas.push(`• ${p.picante} PICANTE`);
        if (p.parejas > 0)      lineas.push(`• ${p.parejas} PAREJAS`);
        if (p.enganchados > 0)  lineas.push(`• ${p.enganchados} ENGANCHADOS`);
        if (p.dados > 0)        lineas.push(`• ${p.dados} DADOS`);
        if (lineas.length === 0) return `No hay productos pendientes de envío.`;
        const total = p.normal + p.picante + p.parejas + p.enganchados + p.dados;
        return `📦 Productos por enviar — ${res.totalPedidos} pedido(s) pendiente(s):\n\n${lineas.join('\n')}\n\nTotal: *${total} unidades*`;
      }

      if (tipoBig === 'RESUMEN') {
        const lineas = Object.entries(res.resumen)
          .sort((a, b) => b[1] - a[1])
          .map(([e, c]) => `• ${e}: ${c}`)
          .join('\n');
        return `📊 Resumen de pedidos (${res.total} en total):\n\n${lineas}`;
      }

      // PENDIENTES / POR_ESTADO
      if (!res.total) return `No hay pedidos en estado ${res.estado}.`;
      const lista = res.pedidos.map(p =>
        `• *${p.nombre}* — ${p.ciudad} — ${p.productos} — ${p.fecha}`
      ).join('\n');
      return `📋 Pedidos ${res.estado}: *${res.total}*\n\n${lista}`;
    }

    case 'verificar_cliente_dropi': {
      const tel = input.telefono;
      const data = await verificarCliente(tel);

      // Si la respuesta tiene todos nulos, mostrar raw para debug
      if (data.total === null && data.entregados === null && data.devueltos === null) {
        const keys = data._keys?.length ? `Keys: ${data._keys.join(', ')}` : '';
        const resumen = JSON.stringify(data.raw)?.slice(0, 600);
        return `📋 DROPI no devolvió datos para *${tel}*.\n${keys}\nRaw: ${resumen}`;
      }

      const clasificacion = data.clasificacion ? `\n🏷️ Clasificación: *${data.clasificacion}*` : '';
      const nombre = data.nombre ? `\n👤 ${data.nombre}` : '';
      const pendientes = data.pendientes !== null ? `\n⏳ Pendientes: ${data.pendientes}` : '';

      return `📊 Reputación DROPI para *${tel}*${nombre}

📦 Total pedidos: *${data.total ?? '?'}*
✅ Entregados: *${data.entregados ?? '?'}*
↩️ Devoluciones: *${data.devueltos ?? '?'}*${pendientes}${clasificacion}`;
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

async function chat(history, newMessage, imageBase64 = null, imageMime = 'image/jpeg', fromPhone = null, sendDocumentCallback = null) {
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
        // Inyectar _from para tools que necesiten enviar archivos de vuelta
        const inputConFrom = {
          ...block.input,
          _from: fromPhone,
          ...(sendDocumentCallback ? { _sendDocument: sendDocumentCallback } : {})
        };
        const toolResult = await executeTool(block.name, inputConFrom);
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
