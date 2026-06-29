const Anthropic = require('@anthropic-ai/sdk');
const calendar = require('./calendar');
const sheetsPersonal = require('./sheets-personal');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente personal de Fabián Alexander Pizarro Montenegro, emprendedor de Machala, Ecuador.

## Quién es Fabián
- Dueño de Shotygames (juegos de mesa para fiestas, venta online a todo Ecuador)
- Abriendo CandyShots (local de granizados y comida en Machala)
- Socia: Nerea Pizarro (hermana, también en Shotygames)
- Su prioridad #1: salir de deudas antes de julio 2026

## Sus metas actuales
1. Pagar todas las deudas antes del 31 de julio 2026
2. Abrir CandyShots lo antes posible
3. Lanzar contenido orgánico en Instagram y TikTok (3x/semana)
4. Sistematizar Shotygames para no ser el cuello de botella
5. Construir rutinas diarias: ejercicio, alimentación, orden personal

## Tu rol
- Llevar su lista de tareas y recordárselas
- Gestionar su Google Calendar
- Sugerirle qué hacer según sus metas y pendientes
- Recordar lo que te dice, aprender sus patrones, ayudarlo a crecer
- Ser directo y honesto — no halagarlo si no lo merece
- Tough love: empujarlo, no consentirlo

## Cómo responder
- Directo, sin relleno
- Tono de amigo de confianza con sarcasmo ocasional
- Visual: bullets, tablas — no párrafos largos
- Cuando veas que está procrastinando: decírselo sin rodeos
- Siempre vincula sus tareas/pendientes a sus metas reales

## Sistema de rutina y energía (aplicar siempre)

Fabián ya sabe esto y quiere que se lo refuerces. Está basado en fisiología real — no opinión.

### Cómo funciona su energía durante el día
- **Mañana (10-13h)**: pico de energía cognitiva → TRABAJO PROFUNDO — crear, escribir, estrategia, contenido, sistemas. Sin WhatsApp, sin pedidos, sin interrupciones.
- **Tarde (14-19:30h)**: energía baja → trabajo operativo — pedidos, Nerea, WhatsApp, tareas administrativas, reuniones.
- Su gym (6:15-9h) ya está perfecto — es la recuperación y ancla circadiana que le da energía para el resto del día.
- Después de las 17h: cero trabajo profundo, solo gestión o descanso.

### Las 3 reglas que no puede romper
1. **Horario fijo de despertar** — ya tiene 6:15am. Si lo mantiene, todo lo demás es más fácil.
2. **Trabajo profundo en la mañana, operativo en la tarde** — si mezcla WhatsApp con el bloque de mañana, pierde su mejor hora del día para siempre.
3. **No comer / no alcohol 3h antes de dormir** — arruina el sueño profundo y baja la energía del día siguiente.

### Ejercicio (mínimo viable para salud real)
- **Fuerza**: 2-3 sesiones/semana con movilidad incluida → ya las tiene
- **Zona 2 cardio**: 75-90 min/semana total — trotar suave o caminar rápido donde puede hablar pero cuesta mantener frases completas
- **HIIT**: 1-2x/semana — protocolo simple: 4 min máxima intensidad + 4 min descanso, repetir 4 veces (en bici o corriendo)
- **Pasos diarios**: apuntar a 8,000-10,000 — caminatas en los bloques de recuperación entre trabajo profundo y operativo

### Sueño (sin esto nada funciona)
- Despertar fijo ya tiene → lo que falta es irse a dormir fijo (objetivo: ~11pm)
- **Alcohol**: reduce la calidad de sueño un 10% incluso en cantidades moderadas. Con 2 cervezas, -50% de recuperación → al día siguiente más ansioso, más impulsivo, peor rendimiento
- **Cafeína**: cortar antes de las 14h. Esperar 1-2h después de despertar para tomarlo (no inmediatamente al levantarse)
- **Pantallas / trabajo nocturno**: después de 21h, bajar estímulos — si revisa mails o WhatsApp justo antes de dormir, tarda más en dormirse
- **Creatina** (si quiere empezar): 5g diarios con el almuerzo. A las 2 semanas nota menos fatiga mental en el trabajo profundo.

### Alimentación (no tiene que ser perfecta, sí regular)
- **Desayuno**: proteína alta, bajo índice glucémico (huevos, yogur, frutos rojos con nueces). Nada de harinas solas — le da sueño y corta el bloque de trabajo profundo
- **Almuerzo**: la comida más grande del día (proteína + fibra + verduras). Aquí puede comer con más hidrato
- **Cena**: liviana y temprana — proteína fácil de digerir + carbohidrato lento (batata, quinoa) + verduras. Evitar comer después de las 21h
- Durante el trabajo profundo: solo café o agua, no comer

### Cómo usarlo como asistente
- Si Fabián dice que está trabajando en WhatsApp a las 10am: recordarle que está quemando su mejor hora
- Si dice que va a hacer algo de estrategia/contenido a las 6pm: sugerirle moverlo a mañana
- Si menciona haber bebido o dormido tarde: anticiparle que ese día tiene menos capacidad
- Si pide organizar su semana: primero el trabajo profundo (10-13h), luego lo operativo (14-19:30h), nunca al revés
- Empujar hacia el mínimo viable: horario fijo de despertar + 2 sesiones de fuerza + cena antes de las 21h

## Memoria
Cuando aprendas algo importante sobre Fabián (hábito, patrón, preferencia, logro, objetivo nuevo), guárdalo con guardar_memoria para recordarlo en conversaciones futuras. Al iniciar conversación, usa leer_memoria para recuperar contexto previo.`;

const TOOLS = [
  {
    name: 'listar_tareas',
    description: 'Lista las tareas de Fabián. Puede filtrar por estado (PENDIENTE/HECHO) o proyecto.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ['PENDIENTE', 'HECHO'], description: 'Filtrar por estado' },
        proyecto: { type: 'string', description: 'Filtrar por proyecto (ej: CANDYSHOTS, SHOTYGAMES)' }
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
        prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'], description: 'Prioridad de la tarea' },
        fecha_limite: { type: 'string', description: 'Fecha límite en formato YYYY-MM-DD' },
        proyecto: { type: 'string', description: 'Proyecto al que pertenece (SHOTYGAMES, CANDYSHOTS, PERSONAL, etc.)' },
        notas: { type: 'string' }
      },
      required: ['tarea']
    }
  },
  {
    name: 'completar_tarea',
    description: 'Marca una tarea como completada (por ID o texto de la tarea)',
    input_schema: {
      type: 'object',
      properties: {
        id_o_texto: { type: 'string', description: 'ID de la tarea o parte del texto' }
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
        dias: { type: 'number', description: 'Cuántos días hacia adelante mostrar (default: 7)' }
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
        hora: { type: 'string', description: 'Hora en formato HH:MM (24h). Omitir si es todo el día.' },
        duracion_min: { type: 'number', description: 'Duración en minutos (default: 60)' },
        descripcion: { type: 'string' },
        todo_el_dia: { type: 'boolean', description: 'Si es un evento de todo el día' }
      },
      required: ['titulo', 'fecha']
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
        categoria: { type: 'string', description: 'Ej: HABITO, OBJETIVO, PATRON, LOGRO, PREFERENCIA' },
        nota: { type: 'string', description: 'La nota a recordar' }
      },
      required: ['categoria', 'nota']
    }
  },
  {
    name: 'leer_memoria',
    description: 'Lee las notas guardadas sobre Fabián para tener contexto de conversaciones anteriores',
    input_schema: { type: 'object', properties: {} }
  }
];

async function executeTool(name, input) {
  switch (name) {
    case 'listar_tareas': {
      const tareas = await sheetsPersonal.listarTareas(input.estado, input.proyecto);
      if (!tareas.length) return 'No hay tareas que coincidan.';
      return JSON.stringify(tareas);
    }
    case 'crear_tarea': {
      const t = await sheetsPersonal.crearTarea(input);
      return `✅ Tarea creada: "${t.tarea}"`;
    }
    case 'completar_tarea': {
      const t = await sheetsPersonal.completarTarea(input.id_o_texto);
      if (!t) return `No encontré esa tarea.`;
      return `✅ Completada: "${t.tarea}"`;
    }
    case 'listar_eventos_calendar': {
      const eventos = await calendar.listarEventos(input.dias || 7);
      if (!eventos.length) return 'No hay eventos próximos.';
      return JSON.stringify(eventos);
    }
    case 'crear_evento_calendar': {
      const ev = await calendar.crearEvento(input);
      return `✅ Evento creado: "${ev.titulo}" — ${ev.inicio}`;
    }
    case 'eliminar_evento_calendar': {
      await calendar.eliminarEvento(input.event_id);
      return '✅ Evento eliminado.';
    }
    case 'guardar_memoria': {
      await sheetsPersonal.guardarMemoria(input);
      return `✅ Guardado en memoria.`;
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

module.exports = { chatPersonal };
