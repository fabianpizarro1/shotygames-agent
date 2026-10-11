import 'server-only';
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { crearEvento, eliminarEvento, eventosEntre } from './calendario';
import { actualizarTarea, completarTarea, leerTodo } from './datos';
import { hoyEC, sumarDias } from './fecha';
import { organizarProyecto } from './organizador';
import { huecosLibres, planificar } from './planificador';
import { DECISIONES, NEGOCIOS, TIPOS_TAREA } from './tipos';

// Lo que el chat puede HACER (antes solo leía): crear y agendar tareas,
// completarlas y manejar el calendario. Misma capacidad que el bot de
// Telegram, con los ids de la app (proyectos, tipo, decisión).

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM 24h');
const negocio = z.enum(NEGOCIOS.map((n) => n.id) as [string, ...string[]]);
const prioridad = z.enum(['ALTA', 'MEDIA', 'BAJA']);

const ESQUEMAS = {
  huecos_libres: z.object({ desde: fecha, hasta: fecha.describe('Máximo 14 días después de desde') }),
  planificar: z.object({
    items: z
      .array(
        z.object({
          tarea: z.string().min(3).describe('Acción concreta: verbo + resultado'),
          negocio,
          prioridad,
          proyecto_id: z.string().optional().describe('Id del proyecto de la foto del momento, si la tarea es de uno'),
          tipo: z.enum(TIPOS_TAREA).optional(),
          decision: z.enum(DECISIONES).optional().describe('DELEGAR o TERCERIZAR si no debería hacerla Fabián'),
          fecha_limite: fecha.optional().describe('Si tiene agenda y no se da, se usa el día agendado'),
          notas: z.string().optional(),
          tarea_existente_id: z.string().optional().describe('Si ya existe pendiente: su id. No se crea otra, solo se agenda'),
          agenda: z
            .object({ fecha, hora, duracion_min: z.number().int().min(15).max(300) })
            .optional()
            .describe('Sin agenda = tarea suelta, sin evento'),
        })
      )
      .min(1),
  }),
  listar_tareas: z.object({ negocio: negocio.optional() }),
  completar_tarea: z.object({ id: z.string() }),
  actualizar_tarea: z.object({
    id: z.string(),
    prioridad: prioridad.optional(),
    fecha_limite: fecha.optional(),
    notas: z.string().optional(),
    proyecto_id: z.string().optional(),
    decision: z.enum(DECISIONES).optional(),
  }),
  listar_eventos: z.object({ desde: fecha.optional(), hasta: fecha.optional() }),
  crear_evento: z.object({
    titulo: z.string(),
    fecha,
    hora: hora.optional(),
    duracion_min: z.number().int().min(5).max(720).optional(),
    todo_el_dia: z.boolean().optional(),
  }),
  eliminar_evento: z.object({ event_id: z.string(), calendario: z.string().describe('El que devolvió listar_eventos') }),
  organizar_proyecto: z.object({ proyecto_id: z.string(), fecha_limite: fecha }),
};

type NombreHerramienta = keyof typeof ESQUEMAS;

const DESCRIPCIONES: Record<NombreHerramienta, string> = {
  huecos_libres:
    'Huecos de trabajo de cada día del rango (según la rutina) con los tramos que siguen libres en el calendario. Usar siempre antes de planificar.',
  planificar:
    'Crea varias tareas y, a las que tienen agenda, su evento en Google Calendar. Valida que cada evento caiga en un hueco de trabajo libre: si alguno no cabe NO crea nada y devuelve los errores con los tramos libres.',
  listar_tareas: 'Todas las tareas PENDIENTES con id (la foto del momento solo trae las 25 de mayor puntaje).',
  completar_tarea: 'Marca una tarea como hecha.',
  actualizar_tarea: 'Cambia prioridad, fecha límite, notas, proyecto o decisión de una tarea.',
  listar_eventos: 'Eventos de Google Calendar entre dos fechas, con id y calendario (necesarios para borrar).',
  crear_evento: 'Evento suelto con hora fija (cita, reunión, pago). Para tareas usar planificar.',
  eliminar_evento: 'Borra un evento de Google Calendar.',
  organizar_proyecto:
    'Parte un proyecto ACTIVO en todas sus tareas hasta la fecha límite (sin repetir las que ya tiene), pone fecha a cada etapa y agenda las próximas 2 semanas. Tarda ~2 min.',
};

function esquemaJson(s: z.ZodType): Anthropic.Beta.BetaTool['input_schema'] {
  const { $schema, ...resto } = z.toJSONSchema(s) as Record<string, unknown>;
  void $schema;
  return resto as Anthropic.Beta.BetaTool['input_schema'];
}

export const HERRAMIENTAS: Anthropic.Beta.BetaTool[] = (Object.keys(ESQUEMAS) as NombreHerramienta[]).map((name) => ({
  name,
  description: DESCRIPCIONES[name],
  input_schema: esquemaJson(ESQUEMAS[name]),
  // Con streaming las entradas largas (un plan semanal) llegan sin esperar
  // a que el servidor las valide; por eso se validan acá con Zod.
  eager_input_streaming: true,
}));

/** Lo que ve Fabián mientras la herramienta corre (en vez de "Pensando…" por 40 s). */
export const ESTADO_HERRAMIENTA: Record<string, string> = {
  huecos_libres: 'Revisando tu calendario…',
  planificar: 'Armando tareas y eventos…',
  listar_tareas: 'Revisando tus tareas…',
  completar_tarea: 'Marcando como hecha…',
  actualizar_tarea: 'Actualizando la tarea…',
  listar_eventos: 'Mirando tu calendario…',
  crear_evento: 'Agendando…',
  eliminar_evento: 'Borrando el evento…',
  organizar_proyecto: 'Organizando el proyecto (≈2 min)…',
};

/** Herramientas que escriben: si alguna corrió, las pantallas tienen que refrescarse. */
export const ESCRIBEN = new Set<string>(['organizar_proyecto', 'planificar', 'completar_tarea', 'actualizar_tarea', 'crear_evento', 'eliminar_evento']);

// Solo en local (.env.development.local): todo se valida y se lee de verdad,
// pero nada se escribe en el Sheet ni en el calendario.
const SIMULAR = process.env.CHAT_SIMULADO === '1';

export async function ejecutar(nombre: string, entrada: unknown): Promise<{ contenido: string; error?: boolean }> {
  const esquema = ESQUEMAS[nombre as NombreHerramienta];
  if (!esquema) return { contenido: `Herramienta desconocida: ${nombre}`, error: true };
  const r = esquema.safeParse(entrada);
  if (!r.success) {
    return { contenido: JSON.stringify({ INVALID_INPUT: z.prettifyError(r.error), recibido: entrada }), error: true };
  }
  if (SIMULAR && ESCRIBEN.has(nombre) && nombre !== 'planificar' && nombre !== 'organizar_proyecto') {
    return { contenido: `(simulado, no se escribió) ${nombre} ${JSON.stringify(r.data)}` };
  }
  try {
    return { contenido: await correr(nombre as NombreHerramienta, r.data) };
  } catch (e) {
    return { contenido: `❌ ${nombre} falló: ${e instanceof Error ? e.message : String(e)}`, error: true };
  }
}

async function correr(nombre: NombreHerramienta, x: Record<string, unknown>): Promise<string> {
  switch (nombre) {
    case 'huecos_libres': {
      const i = x as z.infer<typeof ESQUEMAS.huecos_libres>;
      return huecosLibres(i.desde, i.hasta);
    }
    case 'planificar':
      return planificar((x as z.infer<typeof ESQUEMAS.planificar>).items, { simular: SIMULAR });
    case 'listar_tareas': {
      const i = x as z.infer<typeof ESQUEMAS.listar_tareas>;
      const d = await leerTodo();
      const tareas = d.tareas.filter((t) => t.estado === 'PENDIENTE' && (!i.negocio || t.negocio === i.negocio));
      if (!tareas.length) return 'No hay tareas pendientes que coincidan.';
      return JSON.stringify(
        tareas.map((t) => ({ id: t.id, tarea: t.tarea, negocio: t.negocio, prioridad: t.prioridad, vence: t.fecha_limite, proyecto: t.proyectoId }))
      );
    }
    case 'completar_tarea':
      await completarTarea((x as z.infer<typeof ESQUEMAS.completar_tarea>).id);
      return 'Hecha.';
    case 'actualizar_tarea': {
      const { id, proyecto_id, ...resto } = x as z.infer<typeof ESQUEMAS.actualizar_tarea>;
      await actualizarTarea(id, { ...resto, ...(proyecto_id && { proyectoId: proyecto_id }) });
      return 'Actualizada.';
    }
    case 'listar_eventos': {
      const i = x as z.infer<typeof ESQUEMAS.listar_eventos>;
      const desde = i.desde ?? hoyEC();
      const eventos = await eventosEntre(desde, i.hasta ?? sumarDias(desde, 7));
      return eventos.length ? JSON.stringify(eventos.map(({ descripcion, ...e }) => ({ ...e, tarea: /Tarea (\d+)/.exec(descripcion)?.[1] }))) : 'No hay eventos en ese rango.';
    }
    case 'crear_evento': {
      const i = x as z.infer<typeof ESQUEMAS.crear_evento>;
      const id = await crearEvento({ titulo: i.titulo, fecha: i.fecha, hora: i.hora, duracionMin: i.duracion_min, todoElDia: i.todo_el_dia });
      return `Evento creado (id ${id}).`;
    }
    case 'organizar_proyecto': {
      const i = x as z.infer<typeof ESQUEMAS.organizar_proyecto>;
      return JSON.stringify(await organizarProyecto(i.proyecto_id, i.fecha_limite));
    }
    case 'eliminar_evento': {
      const i = x as z.infer<typeof ESQUEMAS.eliminar_evento>;
      await eliminarEvento(i.event_id, i.calendario);
      return 'Evento eliminado.';
    }
  }
}

export const INSTRUCCIONES_CHAT = `# Lo que puedes hacer en este chat
Además de responder, puedes crear y agendar tareas, completarlas y manejar su Google Calendar. Las tareas aparecen en la app y los eventos en su calendario (las tareas van al calendario "Tareas").
SOLO actúas cuando Fabián lo pide o te manda cosas por hacer ("esta semana tengo que…", "agéndame…", "ya terminé X", "borra…"). Si solo pregunta ("¿qué hago?", "¿cómo voy?"), respondes sin tocar nada.

## Cuando te manda lo que tiene que hacer (un día, una semana, una lista, un audio, una foto de su libreta)
1. Llama huecos_libres para los días que cubre. Para no duplicar, revisa las pendientes de la foto del momento (o listar_tareas): si ya existe, usa su id en tarea_existente_id.
2. Convierte el texto en tareas concretas: verbo + resultado, que se pueda empezar ya. Si algo es vago, créalo con la interpretación más razonable y menciónalo; no hagas 10 preguntas.
3. Ponle a cada tarea su hueco: lo estratégico y creativo va al PROFUNDO del día cuyo tema le corresponde; compras, Nerea, trámites y producción van a OPERATIVO; lo personal a PERSONAL; lo de CandyShots puede ir al finde. Si dice día u hora, respétalo si cabe. Liga la tarea a su proyecto (proyecto_id) cuando es de uno.
4. Duraciones realistas (mínimo 15 min). Máximo 3 resultados importantes por día; deja aire. Si no cabe todo, NO lo fuerces ni lo pongas fuera de los huecos: créala sin agenda y dile qué quedó afuera y qué propones posponer o delegar.
5. Si algo no debería hacerlo él, créalo con decision DELEGAR y la nota "Delegar a …", sin ocupar su tiempo profundo.
6. Llama planificar UNA sola vez con todo. Si devuelve errores no se creó nada: corrige y vuelve a mandar la lista completa.
7. Responde corto: el plan por día ("Lun 12 · 10:10-11:30 Cotizar imprentas"), lo que quedó sin agenda y por qué, y al final en negrita lo primero que hace.

Si crea o menciona un proyecto con fecha límite ("tengo que lanzar X para el 30 de noviembre"), usa organizar_proyecto (el proyecto tiene que estar ACTIVO; si no lo está, díselo). Esa herramienta ya crea las tareas y agenda las 2 primeras semanas: no repitas con planificar.

Para mover algo: listar_eventos, eliminar_evento y planificar con tarea_existente_id y el horario nuevo. Una cita con hora fija (médico, reunión, pago) va con crear_evento. Si está saturado, quitas carga: no agregas tareas en ese momento.`;
