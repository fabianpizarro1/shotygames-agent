import 'server-only';
import type { TipoHueco } from './agenda';
import { eventosEntre } from './calendario';
import { crearTareas, guardarProyecto, leerTodo } from './datos';
import { diaSemana, horaEC, hoyEC, sumarDias } from './fecha';
import { planDeProyecto } from './ia';
import { aHora, aMin, ocupadosPorDia, planificar, tramosLibres, type ItemPlan } from './planificador';
import type { Datos, Prioridad, Proyecto, Tarea, TipoTarea } from './tipos';

// Proyecto con fecha límite → plan completo de tareas hasta esa fecha, pero en
// el calendario solo entran las próximas 2 semanas (decisión de Fabián,
// 2026-10-11): cada domingo se agenda lo que sigue. Así, si algo se atrasa, se
// reacomoda solo, sin tener que mover 40 eventos.
//
// La IA decide QUÉ hay que hacer y para CUÁNDO; la hora exacta la elige este
// código contra los huecos libres reales — y planificar() vuelve a validar.

const VENTANA_DIAS = 14;
// Mismo flag que el chat: en local valida y lee de verdad pero no escribe.
const SIMULAR = process.env.CHAT_SIMULADO === '1';

/** Días de la semana (0 = dom) en que conviene trabajar cada proyecto: el tema del día. */
function diasDeTema(p: Pick<Proyecto, 'negocio' | 'clase'> | undefined): number[] {
  if (!p) return [];
  if (p.clase === 'SISTEMA') return [4];
  if (p.negocio === 'SHOTYGAMES') return [2];
  if (p.negocio === 'DROPSHIPPING') return [3];
  if (p.negocio === 'CANDYSHOTS') return [4, 6, 0];
  if (p.negocio === 'CONTENIDO') return [5];
  if (p.negocio === 'SALIR_DE_DEUDAS') return [1, 5];
  return [];
}

function huecosPara(t: Pick<Tarea, 'tipo' | 'negocio'>): TipoHueco[] {
  if (t.negocio === 'PERSONAL') return ['PERSONAL'];
  const base: TipoHueco[] =
    t.tipo === 'OPERATIVO' || t.tipo === 'ADMINISTRATIVO'
      ? ['OPERATIVO', 'PROFUNDO_2'] // el operativo dura 45 min: si no cabe, al final del día
      : ['PROFUNDO_1', 'PROFUNDO_2'];
  return t.negocio === 'CANDYSHOTS' ? [...base, 'CANDYSHOTS'] : base;
}

const enOracion = (s: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

interface Pendiente {
  id: string;
  tarea: string;
  negocio: string;
  prioridad: Prioridad;
  fecha_limite: string;
  tipo: TipoTarea | '';
  duracionMin: number | null;
  proyectoId: string;
}

export interface ResultadoAgenda {
  agendadas: { tarea: string; evento: string; tarde: boolean }[];
  sinHueco: string[];
}

/**
 * Agenda en el calendario las tareas de proyectos ACTIVOS que vencen en las
 * próximas 2 semanas y no tienen evento desde ahora en adelante (incluye las
 * que se agendaron y no se hicieron: se reacomodan).
 */
export async function agendarProximas(
  opciones: { proyectoId?: string; datos?: Datos; extra?: Pendiente[] } = {}
): Promise<ResultadoAgenda> {
  const hoy = hoyEC();
  const fin = sumarDias(hoy, VENTANA_DIAS - 1);
  const d = opciones.datos ?? (await leerTodo());
  const activos = new Map(d.proyectos.filter((p) => p.estado === 'ACTIVO').map((p) => [p.id, p]));

  // Tareas que ya tienen su evento de hoy en adelante (la descripción dice "Tarea <id>").
  const eventos = await eventosEntre(hoy, sumarDias(hoy, 90));
  const ahora = Date.now();
  const yaAgendadas = new Set(
    eventos.filter((e) => new Date(e.fin).getTime() > ahora).flatMap((e) => /Tarea (\d+)/.exec(e.descripcion)?.[1] ?? [])
  );

  const candidatas: Pendiente[] = [
    ...d.tareas.filter(
      (t) =>
        t.estado === 'PENDIENTE' &&
        activos.has(t.proyectoId) &&
        (!opciones.proyectoId || t.proyectoId === opciones.proyectoId) &&
        !['DELEGAR', 'TERCERIZAR', 'AUTOMATIZAR', 'ELIMINAR'].includes(t.decision) &&
        t.fecha_limite &&
        t.fecha_limite <= fin &&
        !yaAgendadas.has(t.id)
    ),
    ...(opciones.extra ?? []).filter((t) => t.fecha_limite <= fin),
  ]
    // Por fecha y, dentro de la misma fecha, en el orden en que se crearon (los
    // ids son correlativos en el orden de ejecución que dio la IA).
    .sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite) || a.id.localeCompare(b.id, undefined, { numeric: true }));

  if (!candidatas.length) return { agendadas: [], sinHueco: [] };

  const porDia = await ocupadosPorDia(hoy, fin);
  // Hoy no se agenda en lo que ya pasó (ni en los próximos 15 min).
  porDia[hoy].push({ inicio: 0, fin: Math.min(1440, aMin(horaEC()) + 15), titulo: 'ya pasó' });
  const dias = Object.keys(porDia).sort();

  const items: ItemPlan[] = [];
  const resultado: ResultadoAgenda = { agendadas: [], sinHueco: [] };
  // Lo último agendado de cada proyecto: la tarea siguiente nunca va antes,
  // aunque haya un hueco más temprano (no se define el tamaño de la carta
  // antes de la mecánica solo porque el martes quedaba media hora libre).
  const ultimo = new Map<string, { fecha: string; fin: number }>();

  for (const t of candidatas) {
    const dur = Math.min(150, Math.max(15, t.duracionMin ?? 60));
    const tema = diasDeTema(activos.get(t.proyectoId));
    const limite = t.fecha_limite < hoy ? hoy : t.fecha_limite;
    // Como mucho 6 días antes de su fecha: las fechas de la IA ya traen las
    // esperas (la imprenta tarda una semana en responder) y el ritmo semanal.
    const antes = dias.filter((f) => f <= limite && f >= sumarDias(limite, -6));
    const despues = dias.filter((f) => f > limite);
    // Primero los días de su tema en la semana del vencimiento, después
    // cualquier día de esa semana, y si no queda otra, tarde (pero agendada).
    const desde = ultimo.get(t.proyectoId);
    const orden = [...antes.filter((f) => tema.includes(diaSemana(f))), ...antes.filter((f) => !tema.includes(diaSemana(f))), ...despues].filter(
      (f) => !desde || f >= desde.fecha
    );

    let puesto = false;
    for (const fecha of orden) {
      const tipos = huecosPara(t);
      const ocupado = desde?.fecha === fecha ? [...porDia[fecha], { inicio: 0, fin: desde.fin, titulo: 'tarea anterior' }] : porDia[fecha];
      const libres = tramosLibres(fecha, ocupado).filter((h) => tipos.includes(h.tipo));
      libres.sort((a, b) => tipos.indexOf(a.tipo) - tipos.indexOf(b.tipo));
      for (const h of libres) {
        const tramo = h.libre.map((x) => x.split('-').map(aMin)).find(([a, b]) => b - a >= dur);
        if (!tramo) continue;
        const ini = tramo[0];
        porDia[fecha].push({ inicio: ini, fin: ini + dur, titulo: t.tarea });
        // Lo operativo (mandar un correo, una compra) va al final del día y no
        // empuja lo demás: solo fija el día, no la hora.
        const previo = desde?.fecha === fecha ? desde.fin : 0;
        ultimo.set(t.proyectoId, { fecha, fin: h.tipo.startsWith('PROFUNDO') ? ini + dur : previo });
        items.push({
          tarea: enOracion(t.tarea),
          negocio: t.negocio,
          prioridad: t.prioridad,
          fecha_limite: t.fecha_limite,
          tarea_existente_id: t.id.startsWith('SIM') ? undefined : t.id,
          agenda: { fecha, hora: aHora(ini), duracion_min: dur },
        });
        resultado.agendadas.push({ tarea: enOracion(t.tarea), evento: `${fecha} ${aHora(ini)}-${aHora(ini + dur)}`, tarde: fecha > limite });
        puesto = true;
        break;
      }
      if (puesto) break;
    }
    if (!puesto) resultado.sinHueco.push(enOracion(t.tarea));
  }

  if (items.length && !SIMULAR) {
    const r = JSON.parse(await planificar(items));
    if (!r.ok) throw new Error(`No se pudo agendar: ${(r.errores ?? [r.nota]).join(' · ')}`);
  }
  return resultado;
}

export interface ResultadoOrganizar extends ResultadoAgenda {
  resumen: string;
  advertencia: string;
  creadas: number;
  hitos: { etapa: string; fecha: string }[];
  simulado: boolean;
}

/** Plan completo hasta la fecha límite + agenda de las próximas 2 semanas. */
export async function organizarProyecto(proyectoId: string, fechaLimite: string): Promise<ResultadoOrganizar> {
  const hoy = hoyEC();
  const manana = sumarDias(hoy, 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaLimite) || fechaLimite <= hoy) throw new Error('La fecha límite tiene que ser después de hoy.');

  const d = await leerTodo();
  const p = d.proyectos.find((x) => x.id === proyectoId);
  if (!p) throw new Error('Proyecto no encontrado');
  if (p.estado !== 'ACTIVO') throw new Error('Actívalo primero: solo se organizan los proyectos activos.');

  const existentes = d.tareas.filter((t) => t.proyectoId === p.id && t.estado === 'PENDIENTE');
  const plan = await planDeProyecto(d, p, fechaLimite, existentes);

  const limitar = (f: string) => (!/^\d{4}-\d{2}-\d{2}$/.test(f) || f < manana ? manana : f > fechaLimite ? fechaLimite : f);
  const nombres = new Set(p.etapas.map((e) => e.nombre));
  const hitos = plan.hitos.filter((h) => nombres.has(h.etapa)).map((h) => ({ etapa: h.etapa, fecha: limitar(h.fecha) }));
  const tareas = plan.tareas.slice(0, 80).map((t) => ({
    tarea: t.tarea,
    prioridad: 'MEDIA' as Prioridad,
    fecha_limite: limitar(t.fecha_objetivo),
    negocio: p.negocio,
    notas: [nombres.has(t.etapa) ? `Etapa: ${t.etapa}` : '', t.notas].filter(Boolean).join(' · '),
    proyectoId: p.id,
    tipo: t.tipo,
    decision: t.decision,
    duracionMin: t.duracion_min,
    responsable: t.responsable,
  }));

  const etapas = p.etapas.map((e) => ({ ...e, fecha: hitos.find((h) => h.etapa === e.nombre)?.fecha ?? e.fecha }));
  const primera = tareas.find((t) => t.decision === 'HACER_YO') ?? tareas[0];

  let agenda: ResultadoAgenda;
  if (SIMULAR) {
    agenda = await agendarProximas({
      proyectoId: p.id,
      datos: d,
      extra: tareas
        .filter((t) => !['DELEGAR', 'TERCERIZAR', 'AUTOMATIZAR'].includes(t.decision))
        .map((t, i) => ({ ...t, id: `SIM${i}`, fecha_limite: t.fecha_limite, tipo: t.tipo, duracionMin: t.duracionMin })),
    });
  } else {
    await crearTareas(tareas);
    await guardarProyecto({ id: p.id, fechaObjetivo: fechaLimite, etapas, ...(primera && { siguienteAccion: primera.tarea }) });
    agenda = await agendarProximas({ proyectoId: p.id });
  }

  return { resumen: plan.resumen, advertencia: plan.advertencia, creadas: tareas.length, hitos, simulado: SIMULAR, ...agenda };
}
