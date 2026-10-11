import 'server-only';
import { huecosDeTrabajo } from './agenda';
import { crearEvento, eventosEntre } from './calendario';
import { actualizarTarea, crearTarea, leerTodo } from './datos';
import { diaSemana, hoyEC, horaEC, sumarDias } from './fecha';
import type { Decision, Prioridad, TipoTarea } from './tipos';

// Lo que hace el chat con "esta semana tengo que…": tareas en el Sheet y
// eventos en Google Calendar dentro de los huecos de la rutina. La misma
// lógica que `planificar` del bot de Telegram (claude-personal.js en la raíz
// de KEPLER); acá además cada tarea se puede ligar a un proyecto.

const CALENDARIO_TAREAS = 'Tareas';
const APP = 'https://progreso-eight.vercel.app';
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const etiqueta = (fecha: string) => `${DIAS[diaSemana(fecha)]} ${Number(fecha.slice(8))}`;

interface Ocupado {
  inicio: number;
  fin: number;
  titulo: string;
}

/** Lo que ocupa cada día del rango, en minutos desde la medianoche de Ecuador. */
async function ocupadosPorDia(desde: string, hasta: string): Promise<Record<string, Ocupado[]>> {
  const eventos = await eventosEntre(desde, hasta);
  const porDia: Record<string, Ocupado[]> = {};
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) porDia[f] = [];
  for (const ev of eventos) {
    if (ev.todoElDia || ev.libre) continue;
    const ini = new Date(ev.inicio).getTime();
    const fin = new Date(ev.fin).getTime();
    for (const f of Object.keys(porDia)) {
      const cero = new Date(`${f}T00:00:00-05:00`).getTime();
      const a = Math.max(0, (ini - cero) / 60_000);
      const b = Math.min(1440, (fin - cero) / 60_000);
      if (b > a) porDia[f].push({ inicio: a, fin: b, titulo: ev.titulo });
    }
  }
  return porDia;
}

function tramosLibres(fecha: string, ocupados: Ocupado[]) {
  return huecosDeTrabajo(fecha).map((h) => {
    let tramos: [number, number][] = [[aMin(h.inicio), aMin(h.fin)]];
    for (const o of ocupados) {
      tramos = tramos.flatMap(([a, b]): [number, number][] => {
        if (o.fin <= a || o.inicio >= b) return [[a, b]];
        const partes: [number, number][] = [];
        if (o.inicio > a) partes.push([a, o.inicio]);
        if (o.fin < b) partes.push([o.fin, b]);
        return partes;
      });
    }
    return { ...h, libre: tramos.filter(([a, b]) => b - a >= 15).map(([a, b]) => `${aHora(a)}-${aHora(b)}`) };
  });
}

export async function huecosLibres(desde: string, hasta: string): Promise<string> {
  if (hasta < desde) return 'Rango inválido: hasta tiene que ser igual o posterior a desde.';
  if (hasta > sumarDias(desde, 14)) hasta = sumarDias(desde, 14);
  const porDia = await ocupadosPorDia(desde, hasta);
  return JSON.stringify(
    Object.entries(porDia).map(([fecha, ocupados]) => ({
      fecha,
      dia: etiqueta(fecha),
      huecos: tramosLibres(fecha, ocupados).map(({ tipo, inicio, fin, para, libre }) => ({ tipo, horario: `${inicio}-${fin}`, para, libre })),
      ya_agendado: ocupados
        .filter((o) => huecosDeTrabajo(fecha).some((h) => o.inicio < aMin(h.fin) && o.fin > aMin(h.inicio)))
        .map((o) => `${aHora(o.inicio)}-${aHora(o.fin)} ${o.titulo}`),
    }))
  );
}

export interface ItemPlan {
  tarea: string;
  negocio: string;
  prioridad: Prioridad;
  proyecto_id?: string;
  tipo?: TipoTarea;
  decision?: Decision;
  fecha_limite?: string;
  notas?: string;
  tarea_existente_id?: string;
  agenda?: { fecha: string; hora: string; duracion_min: number };
}

/**
 * Valida TODO primero; si algo no cabe no crea nada y devuelve los errores.
 * Con `simular` valida igual pero no escribe (pruebas en local).
 */
export async function planificar(items: ItemPlan[], { simular = false } = {}): Promise<string> {
  const hoy = hoyEC();
  const ahora = aMin(horaEC());
  const d = await leerTodo();
  const pendientes = d.tareas.filter((t) => t.estado === 'PENDIENTE');
  const porId = new Map(pendientes.map((t) => [t.id, t]));
  const porTexto = new Map(pendientes.map((t) => [t.tarea.trim().toUpperCase(), t]));
  const proyectos = new Set(d.proyectos.map((p) => p.id));

  const fechas = items.flatMap((i) => (i.agenda ? [i.agenda.fecha] : [])).sort();
  const porDia = fechas.length ? await ocupadosPorDia(fechas[0], fechas[fechas.length - 1]) : {};

  const errores: string[] = [];
  items.forEach((it, n) => {
    const quien = `#${n + 1} "${it.tarea}"`;
    if (it.tarea_existente_id && !porId.has(it.tarea_existente_id)) errores.push(`${quien}: no hay tarea PENDIENTE con id ${it.tarea_existente_id}`);
    const igual = porTexto.get(it.tarea.trim().toUpperCase());
    if (!it.tarea_existente_id && igual) errores.push(`${quien}: ya existe pendiente (id ${igual.id}); usar tarea_existente_id`);
    if (it.proyecto_id && !proyectos.has(it.proyecto_id)) errores.push(`${quien}: no existe el proyecto ${it.proyecto_id}`);
    if (!it.agenda) return;

    const { fecha, hora, duracion_min: dur } = it.agenda;
    const ini = aMin(hora);
    const fin = ini + dur;
    if (fecha < hoy || (fecha === hoy && ini < ahora)) {
      errores.push(`${quien}: ${fecha} ${hora} ya pasó`);
      return;
    }
    const ocupados = porDia[fecha];
    const libres = () =>
      tramosLibres(fecha, ocupados)
        .map((h) => `${h.tipo} ${h.libre.join(', ') || 'lleno'}`)
        .join(' · ');
    if (!huecosDeTrabajo(fecha).some((h) => ini >= aMin(h.inicio) && fin <= aMin(h.fin))) {
      errores.push(`${quien}: ${etiqueta(fecha)} ${hora}-${aHora(fin)} cae fuera de los huecos de trabajo. Libre ese día: ${libres()}`);
      return;
    }
    const choque = ocupados.find((o) => ini < o.fin && fin > o.inicio);
    if (choque) {
      errores.push(`${quien}: ${etiqueta(fecha)} ${hora}-${aHora(fin)} choca con "${choque.titulo}". Libre ese día: ${libres()}`);
      return;
    }
    // Los items siguientes de esta misma lista ya no pueden usar este tramo.
    ocupados.push({ inicio: ini, fin, titulo: it.tarea });
  });

  if (errores.length) {
    return JSON.stringify({ ok: false, nota: 'No se creó NADA. Corrige y vuelve a mandar la lista completa.', errores });
  }

  if (simular) {
    return JSON.stringify({
      ok: true,
      simulado: true,
      creadas: items.map((it) => ({
        tarea: it.tarea,
        existente: !!it.tarea_existente_id,
        evento: it.agenda ? `${etiqueta(it.agenda.fecha)} ${it.agenda.hora}-${aHora(aMin(it.agenda.hora) + it.agenda.duracion_min)}` : null,
      })),
    });
  }

  const creadas: { tarea: string; id: string; existente: boolean; evento: string | null }[] = [];
  for (const it of items) {
    try {
      const fechaLimite = it.fecha_limite || it.agenda?.fecha || '';
      let id = it.tarea_existente_id;
      if (id) {
        await actualizarTarea(id, {
          ...(fechaLimite && { fecha_limite: fechaLimite }),
          ...(it.proyecto_id && { proyectoId: it.proyecto_id }),
          ...(it.agenda && { duracionMin: it.agenda.duracion_min }),
        });
      } else {
        id = await crearTarea({
          tarea: it.tarea,
          prioridad: it.prioridad,
          fecha_limite: fechaLimite,
          negocio: it.negocio,
          notas: it.notas,
          proyectoId: it.proyecto_id,
          tipo: it.tipo,
          decision: it.decision,
          duracionMin: it.agenda?.duracion_min ?? null,
        });
      }
      let evento: string | null = null;
      if (it.agenda) {
        const { fecha, hora, duracion_min } = it.agenda;
        await crearEvento({
          titulo: it.tarea,
          fecha,
          hora,
          duracionMin: duracion_min,
          descripcion: [`Tarea ${id} · ${it.negocio} · ${APP}`, it.notas].filter(Boolean).join('\n'),
          calendario: CALENDARIO_TAREAS,
        });
        evento = `${etiqueta(fecha)} ${hora}-${aHora(aMin(hora) + duracion_min)}`;
      }
      creadas.push({ tarea: it.tarea, id, existente: !!it.tarea_existente_id, evento });
    } catch (e) {
      // Lo anterior ya quedó creado: decirlo, no repetir la lista entera.
      return JSON.stringify({
        ok: false,
        nota: `❌ Falló en "${it.tarea}": ${e instanceof Error ? e.message : e}. Las anteriores SÍ se crearon; no las repitas.`,
        creadas,
      });
    }
  }
  return JSON.stringify({ ok: true, creadas });
}
