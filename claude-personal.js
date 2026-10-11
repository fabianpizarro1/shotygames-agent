const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const crypto = require('crypto');
const calendar = require('./calendar');
const sheetsPersonal = require('./sheets-personal');
const { hoyEC } = require('./fechas');
const { huecosDeTrabajo, tramosLibres, aMin, aHora } = require('./rutina');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODELO = 'claude-opus-5-5';
// El SDK del servidor (0.30) no conoce `fallbacks` ni el beta: el body viaja
// tal cual y el header va por las opciones del request.
const OPCIONES_REQUEST = { headers: { 'anthropic-beta': 'server-side-fallback-2026-07-01' } };
const MAX_VUELTAS = 12;
const APP = 'https://progreso-eight.vercel.app';

// Organizar proyectos lo hace la app (projects/progreso/src/lib/organizador.ts):
// el bot le pide por /api/interno/*. La clave se deriva de GOOGLE_CLIENT_SECRET,
// que los dos servidores ya tienen (ver tokenInterno en lib/auth.ts de la app).
function tokenInterno() {
  return crypto.createHmac('sha256', (process.env.GOOGLE_CLIENT_SECRET || '').trim()).update('progreso-interno-v1').digest('hex');
}
async function app(metodo, ruta, data) {
  try {
    const r = await axios({
      method: metodo,
      url: `${APP}/api/interno/${ruta}`,
      data,
      headers: { authorization: `Bearer ${tokenInterno()}` },
      timeout: 290000, // organizar tarda ~2 min
    });
    return r.data;
  } catch (e) {
    const err = e.response?.data?.error;
    if (err) return { ok: false, error: err };
    throw e;
  }
}
const CALENDARIO_TAREAS = 'Tareas';
// Los mismos ids que usa la app Progreso (projects/progreso/src/lib/tipos.ts).
const NEGOCIOS = ['SALIR_DE_DEUDAS', 'SHOTYGAMES', 'DROPSHIPPING', 'CANDYSHOTS', 'CONTENIDO', 'PERSONAL'];

// Fijo y cacheado. Lo que cambia por mensaje (fecha, hora, memoria) va en el
// segundo bloque del system, después del breakpoint.
const SYSTEM_PROMPT = `Eres el Chief of Staff personal de Fabián Pizarro y le hablas por Telegram. Tu trabajo es que sepa qué hacer y lo haga, con su semana en Google Calendar y sus tareas en la app Progreso (${APP}), que lee el mismo Sheet que tú.

# Quién es Fabián
- 30 años, emprendedor en Machala, Ecuador. Español de Ecuador, tuteo, directo, como un amigo de confianza. Nada de lenguaje corporativo, halagos ni relleno. Tough love: motivas con realidad y consecuencias.
- Tiene muchas ideas; su problema es la consistencia, priorizar y la procrastinación.
- Quiere ser dueño y estratega de empresas que funcionen sin él. NO quiere producción manual, empacar, logística manual ni apagar incendios.

# Prioridades
1. SALIR DE DEUDAS (prioridad #1).
2. $5.000/mes de UTILIDAD REAL al 31-dic-2026.
Negocios en orden: SHOTYGAMES (torres de shots y juegos; producción con Marcelo, armado y empaque con Nerea; productos nuevos uno a la vez: Cartas Parejas → Cartas Grupos → 3er juego → tipo Monopoly → Parchís → Chupiolimpiadas), ECOMMERCE / dropshipping (Truquito y Avanora, 1 producto nuevo por día preparado por lotes el miércoles), CANDYSHOTS (local de granizados, sábado y domingo 10-22; meta: SOP y contratar, no que Fabián trabaje más).

# Rutina (fija, ya está en su calendario)
Lun-vie: 07:00 levantarse sin redes y Biblia · 07:45 desayuno · 08:15 gym · 09:45 revisión rápida · 10:10-12:30 PROFUNDO #1 · 12:30 logística · 12:50 almuerzo · 14:00-16:30 PROFUNDO #2 · 16:30-17:15 operativo · 17:15 última revisión · 17:35-21:30 vida personal · 21:30 inglés · 22:00 cerrar el día · 23:30 dormir.
Tema de cada día: LUN CEO y ads ShotyGames · MAR producto activo ShotyGames · MIÉ Product Lab y campañas · JUE sistemas, delegación y CandyShots · VIE ads, contenido, finanzas y stock para el finde · SÁB y DOM CandyShots 10-22 (el domingo, revisión semanal 08:30).
Las tareas SOLO se agendan dentro de los huecos de trabajo: PROFUNDO_1, PROFUNDO_2, OPERATIVO, PERSONAL y, el fin de semana, CANDYSHOTS. Lo demás de la rutina no se toca.

# Cuando te manda lo que tiene que hacer (un día, una semana, una lista, un audio)
1. Llama huecos_libres para los días que cubre y listar_tareas con estado PENDIENTE (para no duplicar: si ya existe, usa su id en tarea_existente_id).
2. Convierte el texto en tareas concretas: verbo + resultado, una acción que se pueda empezar ya ("Mandar a 3 imprentas el pedido de cotización", no "ver lo de las cartas"). Si algo es vago, créalo con la interpretación más razonable y menciónalo; no hagas 10 preguntas.
3. Asígnale a cada tarea un hueco: lo estratégico y creativo va al PROFUNDO del día cuyo tema le corresponde; compras, Nerea, trámites y producción van a OPERATIVO; lo personal va a PERSONAL; lo de CandyShots puede ir al finde. Si el texto dice un día u hora, respétalo si cabe en un hueco.
4. Duraciones realistas, nunca menos de 15 min. Máximo 3 resultados importantes por día; deja aire en los bloques. Si no cabe todo, NO lo metas a la fuerza ni fuera de los huecos: créala sin agenda (tarea suelta) y dile qué quedó afuera y qué propones posponer o delegar.
5. Cuestiona lo que no aporta o no debería hacer él ("¿esto realmente necesita hacerlo Fabián?"): si es delegable, créala con la nota "Delegar a ..." y sin ocupar su tiempo profundo.
6. Llama planificar UNA sola vez con todo. Si devuelve errores, no se creó nada: corrige los horarios y vuelve a mandar la lista completa.
7. Responde corto: el plan agrupado por día ("Lun 12 · 10:10-11:30 Cotizar imprentas"), lo que quedó sin agenda y por qué, y al final una línea en negrita con lo primero que hace.

# Otras reglas
- Para mover o borrar algo: listar_eventos_calendar, eliminar_evento_calendar con su calendario y, si es una tarea, planificar con tarea_existente_id y el horario nuevo.
- Una cita con hora fija (médico, reunión, pago) va con crear_evento_calendar, no con planificar.
- PROYECTOS con fecha límite ("tengo que lanzar X para el 30 de noviembre", "organiza Cartas Parejas para diciembre"): usa organizar_proyecto. Si ya existe (listar_proyectos), pásale su id; si no, créalo con 'crear'. La app arma todas las tareas hasta la fecha, pone fecha a cada etapa y agenda las próximas 2 semanas (lo demás se agenda solo cada domingo). Tarda ~2 min: no repitas con planificar. Solo se organizan proyectos ACTIVOS; si la app dice que no se puede activar (máximo 6 activos, un producto por negocio), díselo tal cual y pregúntale cuál pausa.
- Si dice que está saturado, QUITAS carga: eliges 1-3 cosas y dices qué se pospone. Nunca agregas tareas en ese momento.
- Si quiere abrir un proyecto nuevo sin terminar el activo, se lo adviertes.
- No inventas datos. Respuestas escaneables, sin párrafos largos ni emojis en cada línea.
- Cuando aprendas algo importante y duradero de Fabián, guárdalo con guardar_memoria.`;

const TOOLS = [
  {
    name: 'huecos_libres',
    description: 'Huecos de trabajo de cada día del rango (según su rutina) con los tramos que siguen libres en el calendario. Usar siempre antes de planificar.',
    input_schema: {
      type: 'object',
      properties: {
        desde: { type: 'string', description: 'YYYY-MM-DD' },
        hasta: { type: 'string', description: 'YYYY-MM-DD, máximo 14 días después de desde' }
      },
      required: ['desde', 'hasta']
    }
  },
  {
    name: 'planificar',
    description: 'Crea varias tareas en Progreso y, a las que tienen agenda, su evento en Google Calendar. Valida que cada evento caiga dentro de un hueco de trabajo libre: si alguno no cabe, NO crea nada y devuelve los errores con los tramos libres.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tarea: { type: 'string', description: 'Acción concreta: verbo + resultado' },
              negocio: { type: 'string', enum: NEGOCIOS },
              prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
              fecha_limite: { type: 'string', description: 'YYYY-MM-DD. Si tiene agenda y no se da, se usa el día agendado' },
              notas: { type: 'string' },
              tarea_existente_id: { type: 'string', description: 'Si la tarea ya existe en listar_tareas, su id: no se crea otra, solo se agenda' },
              agenda: {
                type: 'object',
                properties: {
                  fecha: { type: 'string', description: 'YYYY-MM-DD' },
                  hora: { type: 'string', description: 'HH:MM (24h)' },
                  duracion_min: { type: 'number' }
                },
                required: ['fecha', 'hora', 'duracion_min']
              }
            },
            required: ['tarea', 'negocio', 'prioridad']
          }
        }
      },
      required: ['items']
    }
  },
  {
    name: 'listar_tareas',
    description: 'Lista las tareas de Fabián. Puede filtrar por estado (PENDIENTE/HECHO) o negocio.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ['PENDIENTE', 'HECHO'] },
        proyecto: { type: 'string', description: 'Negocio: ' + NEGOCIOS.join(', ') }
      }
    }
  },
  {
    name: 'actualizar_tarea',
    description: 'Actualiza campos de una tarea existente (prioridad, fecha límite, negocio, notas, estado)',
    input_schema: {
      type: 'object',
      properties: {
        id_o_texto: { type: 'string', description: 'ID de la tarea o parte del texto' },
        prioridad: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAJA'] },
        fecha_limite: { type: 'string', description: 'YYYY-MM-DD' },
        proyecto: { type: 'string', description: 'Negocio' },
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
      properties: { id_o_texto: { type: 'string' } },
      required: ['id_o_texto']
    }
  },
  {
    name: 'listar_eventos_calendar',
    description: 'Eventos de Google Calendar entre dos fechas (incluye id y calendario, necesarios para borrar).',
    input_schema: {
      type: 'object',
      properties: {
        desde: { type: 'string', description: 'YYYY-MM-DD (default: hoy)' },
        hasta: { type: 'string', description: 'YYYY-MM-DD (default: desde + 7 días)' }
      }
    }
  },
  {
    name: 'crear_evento_calendar',
    description: 'Crea un evento suelto con hora fija (cita, reunión, pago). Para tareas usar planificar.',
    input_schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        fecha: { type: 'string', description: 'YYYY-MM-DD' },
        hora: { type: 'string', description: 'HH:MM (24h)' },
        duracion_min: { type: 'number', description: 'Default 60' },
        descripcion: { type: 'string' },
        todo_el_dia: { type: 'boolean' }
      },
      required: ['titulo', 'fecha']
    }
  },
  {
    name: 'eliminar_evento_calendar',
    description: 'Elimina un evento de Google Calendar. Pasar el calendario que devolvió listar_eventos_calendar.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string' },
        calendario: { type: 'string' }
      },
      required: ['event_id', 'calendario']
    }
  },
  {
    name: 'listar_proyectos',
    description: 'Proyectos de Fabián (no terminados) con id, estado, fecha límite, avance y tareas pendientes.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'organizar_proyecto',
    description: 'Organiza un proyecto hasta su fecha límite: tareas + hitos + agenda de las próximas 2 semanas. Pasar proyecto_id de uno existente, o crear para uno nuevo (queda ACTIVO). Tarda ~2 min.',
    input_schema: {
      type: 'object',
      properties: {
        proyecto_id: { type: 'string', description: 'Id de listar_proyectos, si ya existe' },
        crear: {
          type: 'object',
          description: 'Solo si el proyecto no existe',
          properties: {
            nombre: { type: 'string' },
            negocio: { type: 'string', enum: NEGOCIOS },
            clase: { type: 'string', enum: ['PRODUCTO', 'SISTEMA'], description: 'PRODUCTO = algo que se vende; SISTEMA = proceso, delegación, automatización' },
            objetivo: { type: 'string', description: 'Cómo se ve terminado' }
          },
          required: ['nombre', 'negocio', 'clase', 'objetivo']
        },
        fecha_limite: { type: 'string', description: 'YYYY-MM-DD' }
      },
      required: ['fecha_limite']
    }
  },
  {
    name: 'cambiar_estado_proyecto',
    description: 'Activa, pausa, termina o devuelve a la cola un proyecto (máximo 6 activos, un producto activo por negocio). Solo si Fabián lo pidió o aceptó.',
    input_schema: {
      type: 'object',
      properties: {
        proyecto_id: { type: 'string' },
        estado: { type: 'string', enum: ['ACTIVO', 'PAUSADO', 'EN_COLA', 'TERMINADO'] }
      },
      required: ['proyecto_id', 'estado']
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
  }
];

// ── Fechas ───────────────────────────────────────────────

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const esHora = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '');

function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function etiquetaDia(fecha) {
  const d = new Date(`${fecha}T12:00:00-05:00`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()}`;
}

function horaActualEC() {
  return new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' });
}

// ── Calendario: lo que ocupa cada día ────────────────────

/** Eventos del rango agrupados por día, en minutos desde la medianoche de Ecuador. */
async function ocupadosPorDia(desde, hasta) {
  const eventos = await calendar.listarEventosRango(desde, hasta);
  const porDia = {};
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) porDia[f] = [];
  for (const ev of eventos) {
    // Los bloques "disponible" son los contenedores de la rutina donde se agenda.
    if (ev.allDay || ev.libre) continue;
    const ini = new Date(ev.inicio).getTime();
    const fin = new Date(ev.fin).getTime();
    for (const f of Object.keys(porDia)) {
      const cero = new Date(`${f}T00:00:00-05:00`).getTime();
      const a = Math.max(0, (ini - cero) / 60000);
      const b = Math.min(1440, (fin - cero) / 60000);
      if (b > a) porDia[f].push({ inicio: a, fin: b, titulo: ev.titulo });
    }
  }
  return porDia;
}

async function huecosLibres(desde, hasta) {
  if (!esFecha(desde) || !esFecha(hasta) || hasta < desde) return 'Fechas inválidas: usar YYYY-MM-DD y hasta >= desde.';
  if (hasta > sumarDias(desde, 14)) hasta = sumarDias(desde, 14);
  const porDia = await ocupadosPorDia(desde, hasta);
  return JSON.stringify(Object.entries(porDia).map(([fecha, ocupados]) => ({
    fecha,
    dia: etiquetaDia(fecha),
    huecos: tramosLibres(fecha, ocupados).map(({ tipo, inicio, fin, para, libre }) => ({ tipo, horario: `${inicio}-${fin}`, para, libre })),
    ya_agendado: ocupados
      .filter(o => huecosDeTrabajo(fecha).some(h => o.inicio < aMin(h.fin) && o.fin > aMin(h.inicio)))
      .map(o => `${aHora(o.inicio)}-${aHora(o.fin)} ${o.titulo}`)
  })));
}

// ── planificar: valida todo y recién después crea ────────

async function planificar(items) {
  if (!Array.isArray(items) || !items.length) return 'No llegaron tareas.';

  const hoy = hoyEC();
  const ahora = aMin(horaActualEC());
  const pendientes = await sheetsPersonal.listarTareas('PENDIENTE');
  const porId = new Map(pendientes.map(t => [t.id, t]));
  const porTexto = new Map(pendientes.map(t => [t.tarea.trim().toUpperCase(), t]));

  const fechas = items.filter(i => i.agenda && esFecha(i.agenda.fecha)).map(i => i.agenda.fecha).sort();
  const porDia = fechas.length ? await ocupadosPorDia(fechas[0], fechas[fechas.length - 1]) : {};

  const errores = [];
  items.forEach((it, n) => {
    const quien = `#${n + 1} "${it.tarea}"`;
    if (!NEGOCIOS.includes(it.negocio)) errores.push(`${quien}: negocio inválido`);
    if (it.tarea_existente_id && !porId.has(it.tarea_existente_id)) errores.push(`${quien}: no hay tarea PENDIENTE con id ${it.tarea_existente_id}`);
    if (!it.tarea_existente_id && porTexto.has(it.tarea.trim().toUpperCase())) {
      errores.push(`${quien}: ya existe pendiente (id ${porTexto.get(it.tarea.trim().toUpperCase()).id}); usar tarea_existente_id`);
    }
    if (it.fecha_limite && !esFecha(it.fecha_limite)) errores.push(`${quien}: fecha_limite inválida`);
    if (!it.agenda) return;

    const { fecha, hora, duracion_min: dur } = it.agenda;
    if (!esFecha(fecha) || !esHora(hora) || !(dur >= 15 && dur <= 300)) {
      errores.push(`${quien}: agenda inválida (fecha YYYY-MM-DD, hora HH:MM, duración 15-300 min)`);
      return;
    }
    const ini = aMin(hora);
    const fin = ini + dur;
    if (fecha < hoy || (fecha === hoy && ini < ahora)) {
      errores.push(`${quien}: ${fecha} ${hora} ya pasó`);
      return;
    }
    const ocupados = porDia[fecha];
    const libres = () => tramosLibres(fecha, ocupados).map(h => `${h.tipo} ${h.libre.join(', ') || 'lleno'}`).join(' · ');
    const hueco = huecosDeTrabajo(fecha).find(h => ini >= aMin(h.inicio) && fin <= aMin(h.fin));
    if (!hueco) {
      errores.push(`${quien}: ${etiquetaDia(fecha)} ${hora}-${aHora(fin)} cae fuera de los huecos de trabajo. Libre ese día: ${libres()}`);
      return;
    }
    const choque = ocupados.find(o => ini < o.fin && fin > o.inicio);
    if (choque) {
      errores.push(`${quien}: ${etiquetaDia(fecha)} ${hora}-${aHora(fin)} choca con "${choque.titulo}". Libre ese día: ${libres()}`);
      return;
    }
    // Los siguientes items de esta misma lista ya no pueden usar este tramo.
    ocupados.push({ inicio: ini, fin, titulo: it.tarea });
  });

  if (errores.length) {
    return JSON.stringify({ ok: false, nota: 'No se creó NADA. Corrige y vuelve a mandar la lista completa.', errores });
  }

  const creadas = [];
  for (const it of items) {
    try {
      let id = it.tarea_existente_id;
      const fechaLimite = it.fecha_limite || it.agenda?.fecha || '';
      if (id) {
        if (fechaLimite) await sheetsPersonal.actualizarTarea(id, { fecha_limite: fechaLimite });
      } else {
        ({ id } = await sheetsPersonal.crearTarea({
          tarea: it.tarea, prioridad: it.prioridad, fecha_limite: fechaLimite, proyecto: it.negocio, notas: it.notas || ''
        }));
      }
      let evento = null;
      if (it.agenda) {
        const { fecha, hora, duracion_min } = it.agenda;
        await calendar.crearEvento({
          titulo: it.tarea,
          fecha,
          hora,
          duracion_min,
          descripcion: [`Tarea ${id} · ${it.negocio} · ${APP}`, it.notas].filter(Boolean).join('\n'),
          calendario: CALENDARIO_TAREAS
        });
        evento = `${etiquetaDia(fecha)} ${hora}-${aHora(aMin(hora) + duracion_min)}`;
      }
      creadas.push({ tarea: it.tarea, id, existente: !!it.tarea_existente_id, evento });
    } catch (e) {
      // Lo anterior ya quedó creado: decirlo, no repetir la lista entera.
      return JSON.stringify({ ok: false, nota: `❌ Falló en "${it.tarea}": ${e.message}. Las anteriores SÍ se crearon; no las repitas.`, creadas });
    }
  }
  return JSON.stringify({ ok: true, creadas });
}

// ── Herramientas ─────────────────────────────────────────

async function executeTool(name, input) {
  switch (name) {
    case 'huecos_libres':
      return huecosLibres(input.desde, input.hasta);
    case 'planificar':
      return planificar(input.items);
    case 'listar_tareas': {
      const tareas = await sheetsPersonal.listarTareas(input.estado, input.proyecto);
      if (!tareas.length) return 'No hay tareas que coincidan.';
      return JSON.stringify(tareas.map(({ _row, ...t }) => t));
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
      const desde = esFecha(input.desde) ? input.desde : hoyEC();
      const hasta = esFecha(input.hasta) ? input.hasta : sumarDias(desde, 7);
      const eventos = await calendar.listarEventosRango(desde, hasta);
      if (!eventos.length) return 'No hay eventos en ese rango.';
      return JSON.stringify(eventos.map(({ descripcion, ...e }) => e));
    }
    case 'crear_evento_calendar': {
      const ev = await calendar.crearEvento(input);
      return `Evento creado: "${ev.titulo}" — ${ev.inicio}`;
    }
    case 'eliminar_evento_calendar': {
      await calendar.eliminarEvento(input.event_id, input.calendario);
      return 'Evento eliminado.';
    }
    case 'listar_proyectos':
      return JSON.stringify(await app('get', 'proyectos'));
    case 'organizar_proyecto': {
      if (!esFecha(input.fecha_limite)) return 'fecha_limite inválida (YYYY-MM-DD).';
      if (!input.proyecto_id && !input.crear) return 'Falta proyecto_id o crear.';
      const cuerpo = input.proyecto_id
        ? { proyecto_id: input.proyecto_id, fecha_limite: input.fecha_limite }
        : { crear: input.crear, fecha_limite: input.fecha_limite };
      const r = await app('post', 'organizar', cuerpo);
      if (!r.ok) return `❌ No se organizó: ${r.error}`;
      // Lo justo para que responda: el detalle completo vive en la app.
      return JSON.stringify({
        creadas: r.creadas,
        resumen: r.resumen,
        advertencia: r.advertencia,
        hitos: r.hitos,
        agendadas: r.agendadas,
        sin_hueco: r.sinHueco
      });
    }
    case 'cambiar_estado_proyecto': {
      const r = await app('post', 'estado', { proyecto_id: input.proyecto_id, estado: input.estado });
      return r.ok ? `Listo: ${r.cambio}` : `❌ No se cambió: ${r.error}`;
    }
    case 'guardar_memoria': {
      await sheetsPersonal.guardarMemoria(input);
      return 'Guardado en memoria.';
    }
    default:
      return 'Herramienta no reconocida.';
  }
}

// ── Conversación ─────────────────────────────────────────

// Lo que se guarda entre mensajes es solo texto. history.js recorta el
// principio cuando pasa de 20 mensajes y eso, con bloques de razonamiento de
// Opus adentro, sería editar la historia; y los resultados de herramientas
// viejos solo inflan el contexto (las tareas y eventos se releen frescos).
function soloTexto(history) {
  const out = [];
  for (const m of history) {
    const texto = typeof m.content === 'string'
      ? m.content
      : (m.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (!texto.trim()) continue;
    const prev = out[out.length - 1];
    if (prev && prev.role === m.role) prev.content += `\n\n${texto}`;
    else out.push({ role: m.role, content: texto });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

async function memoriaDeFabian() {
  try {
    const notas = await sheetsPersonal.leerMemoria();
    if (notas.length) return `# Lo que recuerdas de Fabián\n${notas.map(n => `[${n.categoria}] ${n.nota}`).join('\n')}`;
  } catch (e) {
    console.error('[PERSONAL] Error cargando memoria:', e.message);
  }
  return '';
}

// La hora cambia cada minuto: va sola y al final, para no romper la caché de
// lo de arriba (prompt + memoria).
function ahora() {
  const hoy = hoyEC();
  const proximos = Array.from({ length: 14 }, (_, i) => {
    const f = sumarDias(hoy, i);
    return `${etiquetaDia(f)} = ${f}`;
  }).join(', ');
  return `# Ahora\nHoy es ${etiquetaDia(hoy)} (${hoy}), son las ${horaActualEC()} en Ecuador.\nPróximos días: ${proximos}.`;
}

// Precios por millón de tokens (platform.claude.com/docs/en/about-claude/pricing,
// 2026-10-11). Misma tabla que projects/progreso/src/lib/uso.ts.
const PRECIO = { input: 4, escritura5m: 5, lectura: 0.2, output: 20 };

function anotarUso(uso) {
  const costo = (uso.input_tokens * PRECIO.input + uso.cache_creation_input_tokens * PRECIO.escritura5m +
    uso.cache_read_input_tokens * PRECIO.lectura + uso.output_tokens * PRECIO.output) / 1e6;
  const ahoraEC = new Date(Date.now() - 5 * 3600e3).toISOString().replace('Z', '-05:00');
  sheetsPersonal.anotarUsoIa([ahoraEC, 'telegram', 'chat', MODELO, uso.input_tokens, uso.cache_creation_input_tokens,
    uso.cache_read_input_tokens, uso.output_tokens, costo.toFixed(5)].map(String))
    .catch(e => console.error('[PERSONAL] uso-ia:', e.message));
}

async function chatPersonal(history, newMessage) {
  const memoria = await memoriaDeFabian();
  const system = [
    { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ...(memoria ? [{ type: 'text', text: memoria, cache_control: { type: 'ephemeral' } }] : []),
    { type: 'text', text: ahora() }
  ];
  const uso = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  const previos = soloTexto(history);
  const messages = soloTexto([...previos, { role: 'user', content: newMessage }]);

  let text = '';
  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const response = await client.messages.create({
      model: MODELO,
      max_tokens: 16000,
      system,
      tools: TOOLS,
      messages,
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      // Caché automática al final: cada vuelta del loop relee lo anterior a 0,05x.
      cache_control: { type: 'ephemeral' }
    }, OPCIONES_REQUEST);
    for (const k of Object.keys(uso)) uso[k] += response.usage?.[k] || 0;

    if (response.stop_reason === 'refusal') {
      text = '⚠️ No pude procesar ese mensaje. Escríbelo de otra forma.';
      break;
    }
    text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (response.stop_reason !== 'tool_use') break;

    // Dentro del turno la conversación solo crece: el bloque completo
    // (razonamiento incluido) vuelve tal cual.
    messages.push({ role: 'assistant', content: response.content });
    const results = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      let result;
      try {
        result = await executeTool(block.name, block.input);
      } catch (e) {
        console.error(`[PERSONAL] ${block.name}:`, e.message);
        result = `❌ Error en ${block.name}: ${e.message}`;
      }
      results.push({ type: 'tool_result', tool_use_id: block.id, content: result });
    }
    messages.push({ role: 'user', content: results });
  }

  anotarUso(uso);
  if (!text.trim()) text = '⚠️ No terminé de procesar eso (demasiados pasos). Revisa la app o pídemelo más corto.';
  return { text, updatedHistory: [...messages.filter(m => typeof m.content === 'string'), { role: 'assistant', content: text }] };
}

module.exports = { chatPersonal };
