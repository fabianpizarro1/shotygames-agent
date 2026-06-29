const Anthropic = require('@anthropic-ai/sdk');
const calendar = require('./calendar');
const sheetsPersonal = require('./sheets-personal');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el Chief of Staff personal de Fabián Alexander Pizarro Montenegro, emprendedor de Machala, Ecuador.

## Quién es Fabián
- Dueño de Shotygames (juegos de mesa para fiestas, venta online a todo Ecuador)
- Abriendo CandyShots (local de granizados y comida en Machala)
- Socia: Nerea Pizarro (hermana, también en Shotygames)
- Prioridad #1: salir de deudas antes de julio 2026

## Sus metas actuales
1. Pagar todas las deudas antes del 31 de julio 2026
2. Abrir CandyShots lo antes posible
3. Lanzar contenido orgánico en Instagram y TikTok (3x/semana)
4. Sistematizar Shotygames para no ser el cuello de botella
5. Construir rutinas diarias: ejercicio, alimentación, orden personal

## Tu rol como Chief of Staff
- Gestionar su tiempo y calendario como si fuera tuyo — protegerlo de compromisos innecesarios
- Cuando te cuenten un proyecto, descomponerlo en tareas accionables y distribuirlas en el calendario sin que lo pidan
- Identificar horas libres y sugerir cómo usarlas según prioridades reales
- Llevar registro de compromisos, seguimientos y pendientes
- Guardar en memoria patrones, preferencias, logros y decisiones importantes
- Conectar cada tarea con una de sus metas — si no conecta, cuestionarlo

## Cómo responder
- Directo, sin relleno ni halagos
- Tono: amigo de confianza con autoridad — no solo ejecutas, opinas
- Tough love: si está procrastinando, decírselo sin rodeos
- Visual: bullets y tablas, no párrafos largos
- Si te comparte un proyecto o lista de cosas, organízalas inmediatamente en tareas + calendario
- Cuando veas que algo bloquea sus metas, señálalo aunque no te lo pregunten

## Memoria y contexto
Tienes notas de conversaciones anteriores inyectadas en este prompt al inicio de cada sesión.
Cuando aprendas algo nuevo e importante sobre Fabián, guárdalo con guardar_memoria.`;

const TOOLS = [
  {
    name: 'listar_tareas',
    description: 'Lista las tareas de Fabián. Puede filtrar por estado (PENDIENTE/HECHO) o proyecto.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ['PENDIENTE', 'HECHO'] },
        proyecto: { type: 'string', description: 'Filtrar por proyecto (CANDYSHOTS, SHOTYGAMES, PERSONAL, etc.)' }
      }
    }
  },
  {
    name: 'crear_tarea',
    description: 'Crea una nueva tarea en la lista de Fabián',
    input_schema: {
      type: 'object',
      properties: {
        tarea: { type: 'string' },
        prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
        fecha_limite: { type: 'string', description: 'Fecha límite en formato YYYY-MM-DD' },
        proyecto: { type: 'string' },
        notas: { type: 'string' }
      },
      required: ['tarea']
    }
  },
  {
    name: 'actualizar_tarea',
    description: 'Actualiza campos de una tarea existente (prioridad, fecha límite, proyecto, notas, estado)',
    input_schema: {
      type: 'object',
      properties: {
        id_o_texto: { type: 'string', description: 'ID de la tarea o parte del texto' },
        prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
        fecha_limite: { type: 'string', description: 'Nueva fecha límite YYYY-MM-DD' },
        proyecto: { type: 'string' },
        notas: { type: 'string' },
        estado: { type: 'string', enum: ['PENDIENTE', 'HECHO'] }
      },
      required: ['id_o_texto']
    }
  },
  {
    name: 'completar_tarea',
    description: 'Marca una tarea como completada',
    input_schema: {
      type: 'object',
      properties: {
        id_o_texto: { type: 'string' }
      },
      required: ['id_o_texto']
    }
  },
  {
    name: 'listar_eventos_calendar',
    description: 'Lista los próximos eventos de Google Calendar de Fabián',
    input_schema: {
      type: 'object',
      properties: {
        dias: { type: 'number', description: 'Cuántos días hacia adelante (default: 7)' }
      }
    }
  },
  {
    name: 'listar_horas_libres',
    description: 'Muestra los bloques de tiempo libre en un día, considerando eventos del calendario. Usar antes de agendar algo para saber cuándo hay espacio.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD. Si no se especifica, usa hoy.' },
        hora_inicio: { type: 'string', description: 'Inicio del día laboral en HH:MM (default: 08:00)' },
        hora_fin: { type: 'string', description: 'Fin del día laboral en HH:MM (default: 21:00)' }
      }
    }
  },
  {
    name: 'crear_evento_calendar',
    description: 'Crea un evento en el Google Calendar de Fabián',
    input_schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        hora: { type: 'string', description: 'Hora en formato HH:MM (24h)' },
        duracion_min: { type: 'number', description: 'Duración en minutos (default: 60)' },
        descripcion: { type: 'string' },
        todo_el_dia: { type: 'boolean' }
      },
      required: ['titulo', 'fecha']
    }
  },
  {
    name: 'crear_multiples_eventos',
    description: 'Crea varios eventos de calendario de una sola vez. Usar cuando se organice un proyecto o plan semanal completo.',
    input_schema: {
      type: 'object',
      properties: {
        eventos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              titulo: { type: 'string' },
              fecha: { type: 'string', description: 'YYYY-MM-DD' },
              hora: { type: 'string', description: 'HH:MM (24h)' },
              duracion_min: { type: 'number' },
              descripcion: { type: 'string' }
            },
            required: ['titulo', 'fecha']
          }
        }
      },
      required: ['eventos']
    }
  },
  {
    name: 'eliminar_evento_calendar',
    description: 'Elimina un evento del Google Calendar por ID',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string' }
      },
      required: ['event_id']
    }
  },
  {
    name: 'guardar_memoria',
    description: 'Guarda una nota persistente sobre Fabián para recordarla en futuras conversaciones',
    input_schema: {
      type: 'object',
      properties: {
        categoria: { type: 'string', description: 'Ej: HABITO, OBJETIVO, PATRON, LOGRO, PREFERENCIA, DECISION, COMPROMISO' },
        nota: { type: 'string' }
      },
      required: ['categoria', 'nota']
    }
  },
  {
    name: 'leer_memoria',
    description: 'Lee las notas guardadas sobre Fabián (también se cargan automáticamente al inicio de la sesión)',
    input_schema: { type: 'object', properties: {} }
  }
];

async function calcularHorasLibres(fecha, horaInicio, horaFin) {
  const fechaStr = fecha || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const hI = horaInicio || '08:00';
  const hF = horaFin || '21:00';

  const todos = await calendar.listarEventos(2);
  const eventosDelDia = todos.filter(ev => {
    if (ev.allDay) return false;
    const d = new Date(ev.inicio);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }) === fechaStr;
  });

  const [hIh, hIm] = hI.split(':').map(Number);
  const [hFh, hFm] = hF.split(':').map(Number);
  const diaBase = new Date(`${fechaStr}T00:00:00-05:00`);

  const diaInicio = new Date(diaBase);
  diaInicio.setHours(hIh, hIm, 0, 0);
  const diaFin = new Date(diaBase);
  diaFin.setHours(hFh, hFm, 0, 0);

  const ocupados = eventosDelDia.map(ev => ({
    start: new Date(ev.inicio),
    end: new Date(ev.fin),
    titulo: ev.titulo
  })).sort((a, b) => a.start - b.start);

  const libres = [];
  let cursor = new Date(diaInicio);

  for (const ev of ocupados) {
    if (ev.start > cursor) {
      const diffMin = (ev.start - cursor) / 60000;
      if (diffMin >= 30) {
        libres.push({
          desde: cursor.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' }),
          hasta: ev.start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' }),
          duracion_min: Math.round(diffMin)
        });
      }
    }
    if (ev.end > cursor) cursor = new Date(ev.end);
  }

  if (cursor < diaFin) {
    const diffMin = (diaFin - cursor) / 60000;
    if (diffMin >= 30) {
      libres.push({
        desde: cursor.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' }),
        hasta: diaFin.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' }),
        duracion_min: Math.round(diffMin)
      });
    }
  }

  return { fecha: fechaStr, eventos_del_dia: ocupados.length, horas_libres: libres };
}

async function executeTool(name, input) {
  switch (name) {
    case 'listar_tareas': {
      const tareas = await sheetsPersonal.listarTareas(input.estado, input.proyecto);
      if (!tareas.length) return 'No hay tareas que coincidan.';
      return JSON.stringify(tareas);
    }
    case 'crear_tarea': {
      const t = await sheetsPersonal.crearTarea(input);
      return `Tarea creada: "${t.tarea}"`;
    }
    case 'actualizar_tarea': {
      const { id_o_texto, ...campos } = input;
      const t = await sheetsPersonal.actualizarTarea(id_o_texto, campos);
      if (!t) return 'No encontré esa tarea.';
      return `Tarea actualizada: "${t.tarea}"`;
    }
    case 'completar_tarea': {
      const t = await sheetsPersonal.completarTarea(input.id_o_texto);
      if (!t) return 'No encontré esa tarea.';
      return `Completada: "${t.tarea}"`;
    }
    case 'listar_eventos_calendar': {
      const eventos = await calendar.listarEventos(input.dias || 7);
      if (!eventos.length) return 'No hay eventos próximos.';
      return JSON.stringify(eventos);
    }
    case 'listar_horas_libres': {
      const result = await calcularHorasLibres(input.fecha, input.hora_inicio, input.hora_fin);
      return JSON.stringify(result);
    }
    case 'crear_evento_calendar': {
      const ev = await calendar.crearEvento(input);
      return `Evento creado: "${ev.titulo}" — ${ev.inicio}`;
    }
    case 'crear_multiples_eventos': {
      const resultados = [];
      for (const ev of input.eventos) {
        const created = await calendar.crearEvento(ev);
        resultados.push(`"${created.titulo}" — ${created.inicio}`);
      }
      return `${resultados.length} eventos creados:\n${resultados.join('\n')}`;
    }
    case 'eliminar_evento_calendar': {
      await calendar.eliminarEvento(input.event_id);
      return 'Evento eliminado.';
    }
    case 'guardar_memoria': {
      await sheetsPersonal.guardarMemoria(input);
      return 'Guardado en memoria.';
    }
    case 'leer_memoria': {
      const notas = await sheetsPersonal.leerMemoria();
      if (!notas.length) return 'Sin notas guardadas aún.';
      return JSON.stringify(notas);
    }
    default:
      return 'Herramienta no reconocida.';
  }
}

async function chatPersonal(history, newMessage) {
  let systemFinal = SYSTEM_PROMPT;

  // Al inicio de sesión, inyectar memoria en el system prompt automáticamente
  if (history.length === 0) {
    try {
      const notas = await sheetsPersonal.leerMemoria();
      if (notas.length > 0) {
        const memoriaTexto = notas.map(n => `[${n.categoria}] ${n.nota}`).join('\n');
        systemFinal = SYSTEM_PROMPT + `\n\n## Lo que recuerdas de conversaciones anteriores\n${memoriaTexto}`;
      }
    } catch (e) {
      console.error('[PERSONAL] Error cargando memoria:', e.message);
    }
  }

  const messages = [...history, { role: 'user', content: newMessage }];
  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemFinal,
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
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemFinal,
      tools: TOOLS,
      messages
    });
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  messages.push({ role: 'assistant', content: response.content });
  return { text, updatedHistory: messages };
}

module.exports = { chatPersonal };
