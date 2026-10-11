import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { CONTEXTO_FABIAN } from './contexto-fabian';
import { IA_ACTIVA, MENSAJE_IA_APAGADA } from './ia-activa';
import { registrarUso, sumarUso, type UsoApi } from './uso';
import { ESCRIBEN, ESTADO_HERRAMIENTA, HERRAMIENTAS, INSTRUCCIONES_CHAT, ejecutar } from './herramientas-chat';
import { agendaDe, bloqueActual } from './agenda';
import { fechaLarga, hoyEC, horaEC, lunesDe, sumarDias, diasEntre } from './fecha';
import {
  alertas,
  cumplimientoSemana,
  fallasDeAyer,
  habitosDelDia,
  productoActivo,
  tareasPendientesOrdenadas,
  ultimaMetrica,
} from './calculos';
import { CLASES_INBOX, NEGOCIOS, labelNegocio, progresoProyecto, type Datos } from './tipos';

const MODELO = 'claude-opus-5-5';
// Si el modelo declina por política, el servidor reintenta con el fallback
// recomendado en la misma llamada — sin lista de modelos que mantener.
const BETAS = ['server-side-fallback-2026-07-01'];

let cliente: Anthropic | null = null;
// La IA de la app está apagada para Fabián, pero el bot de Telegram (que
// sigue con IA por decisión suya) le pide a la app organizar proyectos por
// /api/interno: esos pedidos corren dentro de conIaDelBot y sí pueden usarla.
const permisoBot = new AsyncLocalStorage<true>();

export function conIaDelBot<T>(fn: () => Promise<T>): Promise<T> {
  return permisoBot.run(true, fn);
}

/** ¿Se puede llamar a Claude en este request? */
export function iaDisponible(): boolean {
  return IA_ACTIVA || permisoBot.getStore() === true;
}

function ia(): Anthropic {
  if (!iaDisponible()) throw new Error(MENSAJE_IA_APAGADA);
  cliente ??= new Anthropic();
  return cliente;
}

// ── Foto del momento (lo variable, después del breakpoint de caché) ─────────

export function fotoDelMomento(d: Datos): string {
  const hoy = hoyEC();
  const producto = productoActivo(d);
  const agenda = agendaDe(hoy, producto?.nombre);
  const dia = d.dias.find((x) => x.fecha === hoy);
  const tareas = tareasPendientesOrdenadas(d, hoy);
  const porId = new Map(d.tareas.map((t) => [t.id, t]));
  const c = cumplimientoSemana(d, hoy);
  const hechosHoy = new Set(d.rutina.filter((r) => r.fecha === hoy && r.cumplido).map((r) => r.bloque));
  const hace7 = sumarDias(hoy, -7);

  // La hora y el bloque actual NO van acá: cambian cada minuto y romperían
  // la caché de todo este bloque (ver horaDelMomento).
  const l: string[] = [];
  l.push(`# FOTO DEL MOMENTO (datos reales del Sheet)`);
  l.push(`Hoy: ${fechaLarga(hoy)} ${hoy}.`);
  l.push(`Misión del día: ${dia?.mision || agenda.mision}`);
  if (agenda.recordatorio) l.push(`Recordatorio del día: ${agenda.recordatorio}`);

  l.push(`\n## Top 3 de hoy`);
  if (dia?.top3.length) {
    for (const it of dia.top3) {
      const t = it.id ? porId.get(it.id) : undefined;
      l.push(`- [${t?.estado === 'HECHO' ? 'HECHO' : 'PENDIENTE'}] ${t?.tarea ?? it.texto}${it.id ? ` (id ${it.id})` : ''}`);
    }
  } else l.push('- (no definido)');

  l.push(`\n## Hábitos hoy`);
  l.push(habitosDelDia(hoy).map((h) => `${h.label}: ${hechosHoy.has(h.id) ? 'sí' : 'no'}`).join(' · '));
  const fallas = fallasDeAyer(d, hoy);
  if (fallas.length) l.push(`Fallados ayer (hoy no se puede fallar dos veces): ${fallas.map((h) => h.label).join(', ')}`);

  l.push(`\n## Semana (lun ${c.semana}): cumplimiento ${c.pct}%`);
  l.push(c.items.map((i) => `${i.label} ${i.hecho}/${i.meta} (debería llevar ${i.esperado})`).join(' · '));

  l.push(`\n## Proyectos`);
  for (const p of d.proyectos.filter((x) => x.estado === 'ACTIVO').sort((a, b) => a.orden - b.orden)) {
    const dias = p.actualizado ? diasEntre(p.actualizado.slice(0, 10), hoy) : null;
    l.push(
      `- ACTIVO ${p.nombre} (id ${p.id}, ${labelNegocio(p.negocio)}, ${p.clase}) ${progresoProyecto(p)}% — etapas: ${p.etapas
        .map((e) => `${e.nombre} ${e.pct}%`)
        .join(', ')}${p.siguienteAccion ? ` — siguiente acción: ${p.siguienteAccion}` : ''}${
        dias !== null ? ` — último avance hace ${dias} d` : ''
      }`
    );
  }
  const cola = d.proyectos.filter((x) => x.estado === 'EN_COLA').sort((a, b) => a.orden - b.orden);
  if (cola.length) l.push(`En cola: ${cola.map((p) => `${p.nombre} (id ${p.id})`).join(' → ')}`);
  const pausados = d.proyectos.filter((x) => x.estado === 'PAUSADO');
  if (pausados.length) l.push(`Pausados: ${pausados.map((p) => `${p.nombre} (id ${p.id})`).join(', ')}`);

  l.push(`\n## Tareas pendientes (top 25 por puntaje, de ${tareas.length})`);
  for (const t of tareas.slice(0, 25)) {
    l.push(
      `- id ${t.id} | ${t.tarea} | ${labelNegocio(t.negocio)} | ${t.prioridad}${t.fecha_limite ? ` | vence ${t.fecha_limite}` : ''}${
        t.tipo ? ` | ${t.tipo}` : ''
      }${t.decision ? ` | decisión ${t.decision}` : ''} | puntaje ${t.puntaje} (${t.razones.join(', ')})`
    );
  }

  const hechas = d.tareas.filter((t) => t.estado === 'HECHO' && t.completadaEn.slice(0, 10) >= hace7);
  l.push(`\n## Completadas últimos 7 días: ${hechas.length}`);
  for (const t of hechas.slice(-10)) l.push(`- ${t.completadaEn.slice(0, 10)} ${t.tarea}`);

  const ideas = d.inbox.filter((i) => i.estado === 'IDEA');
  if (ideas.length) {
    l.push(`\n## Banco de ideas (${ideas.length})`);
    for (const i of ideas.slice(-8)) l.push(`- [${i.clase}] ${i.texto}`);
  }

  const n = d.negocio;
  const v = (c: { pedidos: number; ingreso: number; utilidad: number }) => `${c.pedidos} pedidos, $${c.ingreso} ingreso, $${c.utilidad} utilidad`;
  l.push(`\n## Dinero y ventas (leído de los Sheets de negocio; si dice "sin dato", no inventes)`);
  if (n?.deuda) {
    l.push(`- Deuda pendiente: $${n.deuda.pendiente} en ${n.deuda.cantidad} deudas (última anotada ${n.deuda.ultimaRegistrada}; si debe algo que no está ahí, no lo ves)`);
    for (const x of n.deuda.items) l.push(`  - ${x.acreedor || x.negocio}: $${x.pendiente}${x.vence ? ` vence ${x.vence}` : ''}`);
  } else l.push('- Deuda: sin dato');
  l.push(n?.caja ? `- Caja real: $${n.caja.total} (${n.caja.cuentas.map((c) => `${c.cuenta} $${c.saldo} al ${c.fecha}`).join(', ')})` : '- Caja: sin dato');
  const p = (c: { pedidos: number; ingreso: number }) => `${c.pedidos} pedidos ($${c.ingreso})`;
  if (n?.fisicos && n.fisicosCobrados) {
    l.push(`- ShotyGames VENDIDOS (contra entrega, no es plata todavía) — hoy: ${p(n.fisicos.hoy)} · semana: ${p(n.fisicos.semana)} · mes: ${p(n.fisicos.mes)}`);
    l.push(`- ShotyGames COBRADOS (entregados/pagados; devueltos restan envío) — semana: ${v(n.fisicosCobrados.semana)} · mes: ${v(n.fisicosCobrados.mes)}`);
  }
  if (n?.enCalle) l.push(`- En la calle: ${n.enCalle.pedidos} pedidos sin entregar, $${n.enCalle.porCobrar} de saldo por cobrar (${n.enCalle.viejos} con más de 15 días: atascados o estado sin actualizar)`);
  if (n?.digitales) l.push(`- Digitales pagados — semana: ${v(n.digitales.semana)} · mes: ${v(n.digitales.mes)}`);
  if (n?.dropGenerados && n.dropCobrados) {
    l.push(`- Drop (contra entrega) — generados semana: ${n.dropGenerados.semana.pedidos}, mes: ${n.dropGenerados.mes.pedidos} · cobrados semana: ${v(n.dropCobrados.semana)}, mes: ${v(n.dropCobrados.mes)}`);
  }
  l.push(`- Utilidad COBRADA del mes (solo lo entregado/pagado): ${n?.utilidadCobradaMes ?? 'sin dato'}. Nunca presentes lo vendido como si fuera plata: es contra entrega.`);
  if (n?.publicidadMes) l.push(`- Publicidad gastada en el mes: $${n.publicidadMes.total} (ShotyGames $${n.publicidadMes.shotygames}, drop $${n.publicidadMes.drop}, digitales $${n.publicidadMes.digitales})`);
  if (n?.gastosMes) l.push(`- Gastos del mes restados: $${n.gastosMes.restados} (${n.gastosMes.categorias.map((c) => `${c.categoria} $${c.monto}`).join(', ')}). No se restan: ${n.gastosMes.excluidos.map((e) => `${e.motivo} $${e.monto}`).join('; ') || 'nada'}`);
  l.push(`- UTILIDAD REAL del mes = cobrada − publicidad − gastos: ${n?.utilidadRealMes ?? 'sin dato'} — META $5.000. Ojo: la publicidad se paga al día y el contra entrega se cobra después; considera la utilidad en la calle.`);
  if (n?.enCalle) l.push(`- Utilidad en la calle (si se entregan los ${n.enCalle.pedidos}): $${n.enCalle.utilidad}, suele volver ~10%`);
  for (const [clave, label] of [
    ['HORAS_OPERATIVAS', 'Horas operativas semana (a mano)'],
    ['HORAS_ESTRATEGICAS', 'Horas estratégicas semana (a mano)'],
  ]) {
    const m = ultimaMetrica(d, clave);
    l.push(`- ${label}: ${m.actual === null ? 'sin dato' : `${m.actual} (al ${m.fecha}${m.anterior !== null ? `, antes ${m.anterior}` : ''})`}`);
  }
  if (n?.errores.length) l.push(`- No se pudo leer: ${n.errores.join(' · ')}`);

  const al = alertas(d, hoy);
  if (al.length) {
    l.push(`\n## Alertas`);
    for (const a of al) l.push(`- ${a.texto}`);
  }

  const cierres = d.dias.filter((x) => x.cerradoEn && x.fecha >= hace7).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (cierres.length) {
    l.push(`\n## Cierres recientes`);
    for (const x of cierres) {
      l.push(`- ${x.fecha}: terminó "${x.terminado}" · pendiente "${x.pendiente}" · aprendió "${x.aprendido}" · problema "${x.problema}"`);
    }
  }

  const ultSem = d.semanas.filter((s) => s.cerradaEn).sort((a, b) => a.semana.localeCompare(b.semana)).at(-1);
  if (ultSem) {
    l.push(`\n## Última revisión semanal (${ultSem.semana})`);
    l.push(`Cuello de botella: ${ultSem.cuelloBotella || '-'} · Prioridades: ${ultSem.prioridades || '-'} · Dejar de hacer: ${ultSem.dejar || '-'}`);
  }
  const estaSemana = d.semanas.find((s) => s.semana === lunesDe(hoy));
  if (estaSemana?.cuelloBotella) l.push(`Cuello de botella de ESTA semana: ${estaSemana.cuelloBotella}`);

  return l.join('\n');
}

/** Lo único que cambia minuto a minuto: va en un bloque aparte, al final. */
export function horaDelMomento(d: Datos): string {
  const hoy = hoyEC();
  const hora = horaEC();
  const agenda = agendaDe(hoy, productoActivo(d)?.nombre);
  const { actual, siguiente } = bloqueActual(agenda, hora);
  const l = [`# AHORA: ${hora} hora de Ecuador`];
  l.push(`Bloque actual: ${actual ? `${actual.inicio}-${actual.fin} ${actual.titulo} [${actual.clase}]` : 'fuera de agenda'}`);
  if (actual?.noHacer) l.push(`Regla del bloque: ${actual.noHacer}`);
  if (siguiente) l.push(`Siguiente: ${siguiente.inicio} ${siguiente.titulo}`);
  return l.join('\n');
}

// Orden pensado para la caché (prefix match): lo fijo primero, la foto (que
// cambia solo cuando cambian los datos) después con su propio breakpoint, y
// la hora al final, sin caché. Así dos mensajes seguidos releen contexto y
// foto a 0,05x en vez de pagarlos completos.
function sistema(d: Datos, instrucciones?: string): Anthropic.Beta.BetaTextBlockParam[] {
  return [
    { type: 'text', text: CONTEXTO_FABIAN, ...(!instrucciones && { cache_control: { type: 'ephemeral' as const } }) },
    ...(instrucciones ? [{ type: 'text' as const, text: instrucciones, cache_control: { type: 'ephemeral' as const } }] : []),
    { type: 'text', text: fotoDelMomento(d), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: horaDelMomento(d) },
  ];
}

function revisarRechazo(stop: string | null) {
  if (stop === 'refusal') throw new Error('La IA no respondió esta consulta. Reformúlala.');
}

// ── Chat (streaming, con herramientas) ─────────────────────────────────────

const MAX_VUELTAS = 10;

export interface ResultadoChat {
  stop: string | null;
  /** Corrió alguna herramienta que escribe: las pantallas tienen datos nuevos. */
  escribio: boolean;
}

/**
 * Loop de herramientas con streaming: cada vuelta emite su texto apenas
 * llega; si la IA pide herramientas, se ejecutan y sigue. Dentro del turno la
 * conversación solo crece (el razonamiento vuelve tal cual).
 */
export async function chat(
  d: Datos,
  mensajes: Anthropic.Beta.BetaMessageParam[],
  alTexto: (t: string) => void,
  alEstado: (estado: string) => void,
  senal?: AbortSignal
): Promise<ResultadoChat> {
  const system = sistema(d, INSTRUCCIONES_CHAT);
  const conversacion = [...mensajes];
  let uso: UsoApi | null = null;
  let escribio = false;
  let emitido = '';
  let reintentosJson = 0;

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const stream = ia().beta.messages.stream(
      {
        model: MODELO,
        max_tokens: 16000,
        betas: BETAS,
        fallbacks: 'default',
        output_config: { effort: 'medium' },
        system,
        tools: HERRAMIENTAS,
        messages: conversacion,
        // Caché automática al final de la conversación: en el loop de
        // herramientas cada vuelta relee lo anterior a 0,05x.
        cache_control: { type: 'ephemeral' },
      },
      { signal: senal }
    );
    let separar = emitido.length > 0 && !emitido.endsWith('\n');
    stream.on('text', (delta) => {
      // Entre vueltas el texto de una y otra no se pega en la misma línea.
      const t = separar ? `\n\n${delta}` : delta;
      separar = false;
      emitido += t;
      alTexto(t);
    });

    // Avisar apenas la IA empieza a pedir una herramienta: armar la entrada
    // de un plan semanal toma más que ejecutarlo.
    stream.on('streamEvent', (ev) => {
      if (ev.type === 'content_block_start' && ev.content_block.type === 'tool_use') {
        alEstado(ESTADO_HERRAMIENTA[ev.content_block.name] ?? 'Trabajando…');
      }
    });

    let msg: Anthropic.Beta.BetaMessage;
    try {
      msg = await stream.finalMessage();
      reintentosJson = 0;
    } catch (e) {
      // Con eager_input_streaming una entrada ilegible rechaza acá: se
      // reintenta esa vuelta. Los errores de la API suben tal cual.
      if (e instanceof Anthropic.APIError || senal?.aborted || reintentosJson++ >= 2) throw e;
      continue;
    }

    uso = sumarUso(uso, msg.usage);
    if (msg.stop_reason === 'refusal') {
      registrarUso('chat', MODELO, uso);
      return { stop: 'refusal', escribio };
    }
    const usos = msg.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
    if (msg.stop_reason !== 'tool_use' || !usos.length) {
      registrarUso('chat', MODELO, uso);
      return { stop: msg.stop_reason, escribio };
    }

    conversacion.push({ role: 'assistant', content: msg.content });
    const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const u of usos) {
      alEstado(ESTADO_HERRAMIENTA[u.name] ?? 'Trabajando…');
      const r = await ejecutar(u.name, u.input);
      if (!r.error && ESCRIBEN.has(u.name)) escribio = true;
      resultados.push({ type: 'tool_result', tool_use_id: u.id, content: r.contenido, ...(r.error && { is_error: true }) });
    }
    conversacion.push({ role: 'user', content: resultados });
  }
  registrarUso('chat', MODELO, uso);
  alTexto('\n\n(Me quedé sin pasos. Revisa la app o pídemelo más corto.)');
  return { stop: 'max_vueltas', escribio };
}

// ── Llamadas estructuradas ──────────────────────────────────────────────────

async function estructurado<T extends z.ZodType>(
  d: Datos,
  esquema: T,
  instruccion: string,
  esfuerzo: 'low' | 'medium' = 'medium',
  ruta = 'estructurado'
): Promise<z.infer<T>> {
  const r = await ia().beta.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: esfuerzo, format: betaZodOutputFormat(esquema) },
    system: sistema(d),
    messages: [{ role: 'user', content: instruccion }],
  });
  registrarUso(ruta, MODELO, r.usage);
  revisarRechazo(r.stop_reason);
  if (!r.parsed_output) throw new Error('La IA devolvió una respuesta que no se pudo leer. Intenta de nuevo.');
  return r.parsed_output as z.infer<T>;
}

const IDS_NEGOCIO = NEGOCIOS.map((n) => n.id) as [string, ...string[]];

export const EsquemaInbox = z.object({
  clase: z.enum(CLASES_INBOX),
  titulo: z.string().describe('Texto limpio y accionable, empezando con verbo si es tarea'),
  negocio: z.enum(IDS_NEGOCIO),
  prioridad: z.enum(['ALTA', 'MEDIA', 'BAJA']),
  fecha_limite: z.string().describe('YYYY-MM-DD o cadena vacía si no hay fecha implícita'),
  tipo: z.enum(['ESTRATEGICO', 'CREATIVO', 'OPERATIVO', 'ADMINISTRATIVO']),
  decision: z.enum(['HACER_YO', 'AUTOMATIZAR', 'DELEGAR', 'TERCERIZAR', 'ELIMINAR']),
  responsable: z.string().describe('Quién debería hacerla: Fabián, Nerea, Marcelo, bot… o vacío'),
  proyecto_id: z.string().describe('id de un proyecto de la foto si aplica, o vacío'),
  comentario: z.string().describe('Una línea: por qué así, o una advertencia (ej. "esto lo puede hacer Nerea")'),
});

export function clasificarInbox(d: Datos, texto: string) {
  return estructurado(
    d,
    EsquemaInbox,
    `Clasifica esta captura rápida del inbox de Fabián. Si es algo a hacer → clase TAREA. Si es una idea (anuncio, producto, contenido) → la clase IDEA_* correspondiente aunque empiece con verbo. "Probar producto X" en ecommerce es una IDEA_PRODUCTO para el Product Lab, salvo que diga una fecha. fecha_limite va VACÍA salvo que el texto mencione explícitamente un momento ("hoy", "mañana", "el lunes", una fecha); tu opinión de cuándo hacerlo va en el comentario, no en la fecha (hoy es ${hoyEC()}). Sé honesto con "decision": si una tarea operativa la puede hacer otra persona, márcala DELEGAR o TERCERIZAR.\n\nCaptura: """${texto}"""`,
    'low',
    'inbox'
  );
}

export const EsquemaTop3 = z.object({
  ids: z.array(z.string()).describe('Hasta 3 ids de tareas pendientes de la foto, en orden'),
  motivo: z.string().describe('2-4 bullets cortos: por qué estas tres y qué NO hacer hoy'),
});

export function sugerirTop3(d: Datos, paraFecha: string) {
  return estructurado(
    d,
    EsquemaTop3,
    `Elige el Top 3 para ${fechaLarga(paraFecha)} (${paraFecha}). Máximo 3 resultados importantes, usando SOLO ids de la lista de tareas pendientes. Ten en cuenta la misión de ese día de la semana, el producto activo, las deudas, el dinero y lo que desbloquea. Si hay menos de 3 tareas que valgan la pena, devuelve menos.`,
    'medium',
    'top3'
  );
}

export const EsquemaCierre = z.object({
  top3_manana: z.array(z.string()).describe('Hasta 3 ids de tareas pendientes para mañana'),
  mover: z
    .array(z.object({ id: z.string(), nueva_fecha: z.string().describe('YYYY-MM-DD'), motivo: z.string() }))
    .describe('Tareas pendientes vencidas o de hoy que conviene reprogramar. Vacío si no hay.'),
  etapas: z
    .array(z.object({ proyecto_id: z.string(), etapa: z.string(), pct: z.number().int().min(0).max(100) }))
    .describe('Avances de etapa que se deducen de lo que dijo que terminó. Vacío si no hay evidencia.'),
  mensaje: z.string().describe('3-5 bullets: qué avanzó, qué sigue dependiendo de él, qué hacer mañana y una corrección honesta'),
});

export function proponerCierre(
  d: Datos,
  r: { terminado: string; pendiente: string; aprendido: string; problema: string; manana: string }
) {
  const manana = sumarDias(hoyEC(), 1);
  return estructurado(
    d,
    EsquemaCierre,
    `Fabián está cerrando el día. Sus respuestas:\n- ¿Qué terminaste?: ${r.terminado || '-'}\n- ¿Qué quedó pendiente?: ${r.pendiente || '-'}\n- ¿Qué aprendiste?: ${r.aprendido || '-'}\n- ¿Qué problema apareció?: ${r.problema || '-'}\n- ¿Algo importante para mañana?: ${r.manana || '-'}\n\nPropón: el Top 3 de mañana (${fechaLarga(manana)}, ${manana}) con ids reales, qué pendientes reprogramar (fechas desde ${manana}) y qué etapas de proyecto avanzaron (solo con evidencia; usa el nombre exacto de la etapa). Nada se aplica sin su aprobación.`,
    'medium',
    'cierre'
  );
}

export async function redactarRevisionSemanal(d: Datos): Promise<string> {
  const r = await ia().beta.messages.create({
    model: MODELO,
    max_tokens: 4000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: sistema(d),
    messages: [
      {
        role: 'user',
        content:
          'Escribe el resumen de mi revisión semanal (máximo 180 palabras, bullets). Responde con los datos de la foto: ¿voy rumbo a los $5.000?, ¿bajó la deuda?, ¿ShotyGames depende menos de mí?, ¿avanzó el producto?, ¿testeamos, creamos ads y publicamos contenido?, ¿CandyShots está más sistematizado?, ¿entrené y dormí? Si falta un dato, dilo en una línea. Cierra con UNA corrección para la próxima semana.',
      },
    ],
  });
  registrarUso('revision-semanal', MODELO, r.usage);
  revisarRechazo(r.stop_reason);
  return r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
}

// ── Plan de proyecto ────────────────────────────────────────────────────────

export const EsquemaPlan = z.object({
  resumen: z.string().describe('2-3 líneas: cómo se reparte el trabajo hasta la fecha límite'),
  advertencia: z
    .string()
    .describe('Si la fecha es irreal para su capacidad, o algo depende de terceros (proveedor, Marcelo, imprenta): dilo claro. Vacío si no hay.'),
  hitos: z
    .array(z.object({ etapa: z.string().describe('Nombre EXACTO de una etapa del proyecto'), fecha: z.string().describe('YYYY-MM-DD') }))
    .describe('Una fecha por etapa pendiente, en orden, la última en o antes de la fecha límite'),
  tareas: z
    .array(
      z.object({
        tarea: z.string().describe('Acción concreta: verbo + resultado, que se pueda empezar sin pensar'),
        etapa: z.string().describe('Nombre exacto de la etapa a la que pertenece'),
        tipo: z.enum(['ESTRATEGICO', 'CREATIVO', 'OPERATIVO', 'ADMINISTRATIVO']),
        duracion_min: z.number().int().min(15).max(150).describe('Realista. Una tarea de más de 150 min se parte en dos'),
        fecha_objetivo: z.string().describe('YYYY-MM-DD: el día en que debería estar hecha'),
        decision: z.enum(['HACER_YO', 'AUTOMATIZAR', 'DELEGAR', 'TERCERIZAR']),
        responsable: z.string().describe('Fabián, Nerea, Marcelo, proveedor… o vacío'),
        notas: z.string().describe('Contexto útil para hacerla, o vacío'),
      })
    )
    .describe('Todas las tareas que faltan hasta terminar el proyecto, en orden de ejecución'),
});

export function planDeProyecto(
  d: Datos,
  p: { nombre: string; objetivo: string; negocio: string; clase: string; etapas: { nombre: string; pct: number }[] },
  fechaLimite: string,
  existentes: { tarea: string; fecha_limite: string }[]
) {
  const hoy = hoyEC();
  const semanas = Math.max(1, Math.round(diasEntre(hoy, fechaLimite) / 7));
  return estructurado(
    d,
    EsquemaPlan,
    `Organiza el proyecto "${p.nombre}" (${labelNegocio(p.negocio)}, ${p.clase === 'PRODUCTO' ? 'producto' : 'sistema'}) desde hoy ${hoy} hasta la fecha límite ${fechaLimite} (~${semanas} semanas).
Objetivo: ${p.objetivo || '(sin objetivo escrito: dedúcelo del nombre)'}
Etapas y avance: ${p.etapas.map((e) => `${e.nombre} ${e.pct}%`).join(', ')}
${existentes.length ? `Tareas que YA existen para este proyecto (NO las repitas): ${existentes.map((t) => `"${t.tarea}"${t.fecha_limite ? ` (${t.fecha_limite})` : ''}`).join('; ')}` : 'No tiene tareas todavía.'}

Reglas:
- Parte cada etapa pendiente en tareas concretas, en orden real de dependencias (no se diseña el empaque antes de saber el tamaño del producto).
- Capacidad REAL: este proyecto usa sobre todo su día de tema (producto activo ShotyGames = martes, Product Lab = miércoles, sistemas/delegación = jueves, ads/contenido = viernes), 2 bloques profundos de ~2 h 20 min. No asumas que tiene toda la semana para esto: tiene otros proyectos y la operación. Como máximo ~5 horas por semana para este proyecto, salvo que la fecha obligue (y entonces lo adviertes).
- fecha_objetivo entre ${sumarDias(hoy, 1)} y ${fechaLimite}, repartidas por semanas, no todas al final.
- Lo que puede hacer otra persona (Nerea, Marcelo, un proveedor, una imprenta) se marca DELEGAR o TERCERIZAR con su responsable: a Fabián le queda solo coordinarlo.
- Tareas de 15 a 150 minutos. Nada de "ver lo de X" ni "avanzar con X".
- Las esperas de terceros (cotización, muestra, producción) son tiempo de calendario: el hito siguiente no puede caer antes de que razonablemente llegue.
- Si la fecha es imposible con esta capacidad, igual entregas el plan y lo dices en advertencia.`,
    'medium',
    'plan-proyecto'
  );
}
