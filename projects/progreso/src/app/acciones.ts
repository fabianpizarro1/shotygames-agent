'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { tokenSesion } from '@/lib/auth';
import * as db from '@/lib/datos';
import * as ia from '@/lib/ia';
import * as organizador from '@/lib/organizador';
import * as proyectos from '@/lib/proyectos';
import { hoyEC, lunesDe, sumarDias, ahoraEC } from '@/lib/fecha';
import { agendaDe } from '@/lib/agenda';
import { productoActivo } from '@/lib/calculos';
import type { ItemTop3, Proyecto, Semana } from '@/lib/tipos';

// Una server action se puede invocar haciendo POST a CUALQUIER ruta — incluida
// /login, que el proxy deja pasar sin sesión. Por eso cada acción revisa la
// cookie por su cuenta, no alcanza con el proxy.
async function exigirSesion() {
  const c = (await cookies()).get('auth')?.value;
  if (c !== (await tokenSesion())) throw new Error('No autorizado');
}

function refrescar() {
  revalidatePath('/', 'layout');
}

export type Resultado<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function envolver<T>(fn: () => Promise<T>): Promise<Resultado<T>> {
  try {
    await exigirSesion();
    const data = await fn();
    refrescar();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

// ── Tareas ──────────────────────────────────────────────────────────────────

export async function completarTarea(id: string, hecho: boolean) {
  return envolver(() => db.completarTarea(id, hecho));
}

export async function crearTarea(t: db.NuevaTarea) {
  return envolver(async () => {
    if (!t.tarea?.trim()) throw new Error('Falta el texto de la tarea');
    return db.crearTarea(t);
  });
}

export async function actualizarTarea(id: string, cambios: db.CambiosTarea) {
  return envolver(() => db.actualizarTarea(id, cambios));
}

export async function archivarTareas(ids: string[]) {
  return envolver(() => db.archivarTareas(ids));
}

// ── Hábitos ─────────────────────────────────────────────────────────────────

export async function marcarHabito(fecha: string, habito: string, cumplido: boolean) {
  return envolver(() => db.marcarHabito(fecha, habito, cumplido));
}

export async function sumarContador(fecha: string, clave: string, delta: number) {
  return envolver(() => db.sumarContador(fecha, clave, delta));
}

// ── Top 3 ───────────────────────────────────────────────────────────────────

export async function fijarTop3(fecha: string, items: ItemTop3[]) {
  return envolver(async () => {
    if (items.length > 3) throw new Error('Máximo 3. Si todo es prioridad, nada lo es.');
    const datos = await db.leerTodo();
    const dia = datos.dias.find((d) => d.fecha === fecha);
    await db.guardarDia(fecha, {
      top3: items,
      mision: dia?.mision || agendaDe(fecha, productoActivo(datos)?.nombre).mision,
    });
  });
}

export async function alternarTop3(fecha: string, tareaId: string, texto: string) {
  return envolver(async () => {
    const datos = await db.leerTodo();
    const actual = datos.dias.find((d) => d.fecha === fecha)?.top3 ?? [];
    const ya = actual.some((i) => i.id === tareaId);
    if (!ya && actual.length >= 3) throw new Error('Ya tienes 3. Saca una antes de meter otra.');
    const nuevo = ya ? actual.filter((i) => i.id !== tareaId) : [...actual, { id: tareaId, texto }];
    await db.guardarDia(fecha, {
      top3: nuevo,
      mision: datos.dias.find((d) => d.fecha === fecha)?.mision || agendaDe(fecha, productoActivo(datos)?.nombre).mision,
    });
    return !ya;
  });
}

export async function sugerirTop3(fecha: string) {
  return envolver(async () => {
    const datos = await db.leerTodo();
    const r = await ia.sugerirTop3(datos, fecha);
    const porId = new Map(datos.tareas.map((t) => [t.id, t]));
    const items = r.ids
      .filter((id) => porId.get(id)?.estado === 'PENDIENTE')
      .slice(0, 3)
      .map((id) => ({ id, texto: porId.get(id)!.tarea }));
    return { items, motivo: r.motivo };
  });
}

// ── Inbox ───────────────────────────────────────────────────────────────────

export async function capturar(texto: string) {
  return envolver(async () => {
    const limpio = texto.trim();
    if (!limpio) throw new Error('Vacío');
    const datos = await db.leerTodo();
    let c: Awaited<ReturnType<typeof ia.clasificarInbox>>;
    try {
      c = await ia.clasificarInbox(datos, limpio);
    } catch {
      // Sin IA la captura NO se pierde: queda en el inbox sin clasificar.
      await db.crearInbox({ texto: limpio, estado: 'NUEVO', clase: '', negocio: '', tareaId: '' });
      return { clase: 'NOTA' as const, titulo: limpio, comentario: 'La IA no respondió — quedó en el inbox sin clasificar.', tareaId: '' };
    }

    const proyectoValido = datos.proyectos.some((p) => p.id === c.proyecto_id) ? c.proyecto_id : '';
    let tareaId = '';
    if (c.clase === 'TAREA') {
      tareaId = await db.crearTarea({
        tarea: c.titulo,
        prioridad: c.prioridad,
        fecha_limite: /^\d{4}-\d{2}-\d{2}$/.test(c.fecha_limite) ? c.fecha_limite : '',
        negocio: c.negocio,
        notas: c.comentario,
        proyectoId: proyectoValido,
        tipo: c.tipo,
        decision: c.decision,
        responsable: c.responsable,
      });
    }
    await db.crearInbox({
      texto: c.clase === 'TAREA' ? limpio : c.titulo,
      estado: c.clase === 'TAREA' ? 'TAREA' : 'IDEA',
      clase: c.clase,
      negocio: c.negocio,
      tareaId,
    });
    return { clase: c.clase, titulo: c.titulo, comentario: c.comentario, tareaId };
  });
}

export async function descartarInbox(id: string) {
  return envolver(async () => {
    const datos = await db.leerTodo();
    const item = datos.inbox.find((i) => i.id === id);
    if (item?.tareaId) await db.archivarTareas([item.tareaId]);
    await db.actualizarInbox(id, { estado: 'DESCARTADO' });
  });
}

/** Deshacer la última captura: se busca por la tarea creada o por el texto más reciente. */
export async function deshacerCaptura(tareaId: string, titulo: string) {
  return envolver(async () => {
    const datos = await db.leerTodo();
    const item = [...datos.inbox]
      .reverse()
      .find((i) => (tareaId ? i.tareaId === tareaId : i.texto === titulo) && i.estado !== 'DESCARTADO');
    if (tareaId) await db.archivarTareas([tareaId]);
    if (item) await db.actualizarInbox(item.id, { estado: 'DESCARTADO' });
  });
}

export async function ideaATarea(id: string) {
  return envolver(async () => {
    const datos = await db.leerTodo();
    const item = datos.inbox.find((i) => i.id === id);
    if (!item) throw new Error('No existe');
    const tareaId = await db.crearTarea({
      tarea: item.texto,
      negocio: item.negocio,
      tipo: 'CREATIVO',
      decision: 'HACER_YO',
    });
    await db.actualizarInbox(id, { estado: 'TAREA', tareaId });
  });
}

// ── Proyectos ───────────────────────────────────────────────────────────────

export async function guardarProyecto(p: Partial<Proyecto> & { id: string }) {
  return envolver(async () => {
    const datos = await db.leerTodo();
    const actual = datos.proyectos.find((x) => x.id === p.id);
    const negocio = p.negocio ?? actual?.negocio;
    const clase = p.clase ?? actual?.clase;

    if (p.estado === 'ACTIVO' && actual?.estado !== 'ACTIVO' && negocio && clase) {
      proyectos.verificarActivacion(datos.proyectos, { id: p.id, negocio, clase });
    }
    await db.guardarProyecto(p);
  });
}

export async function crearProyecto(p: Parameters<typeof proyectos.crearProyecto>[0]) {
  return envolver(() => proyectos.crearProyecto(p));
}

/** La IA parte el proyecto en tareas hasta la fecha límite y agenda las próximas 2 semanas. */
export async function organizarProyecto(proyectoId: string, fechaLimite: string) {
  return envolver(() => organizador.organizarProyecto(proyectoId, fechaLimite));
}

/** Agenda lo que vence en las próximas 2 semanas (lo mismo que corre solo los domingos). */
export async function agendarProximas() {
  return envolver(() => organizador.agendarProximas());
}

const PASOS = [0, 25, 50, 75, 100];

export async function avanzarEtapa(proyectoId: string, indice: number, retroceder = false) {
  return envolver(async () => {
    const datos = await db.leerTodo();
    const p = datos.proyectos.find((x) => x.id === proyectoId);
    if (!p?.etapas[indice]) throw new Error('Etapa no encontrada');
    const actual = p.etapas[indice].pct;
    const sig = retroceder
      ? [...PASOS].reverse().find((x) => x < actual) ?? 0
      : PASOS.find((x) => x > actual) ?? 0; // en 100 vuelve a 0 (por si se tocó de más)
    const etapas = p.etapas.map((e, i) => (i === indice ? { ...e, pct: sig } : e));
    await db.guardarProyecto({ id: p.id, etapas });
  });
}

// ── Cierre del día ──────────────────────────────────────────────────────────

export interface RespuestasCierre {
  terminado: string;
  pendiente: string;
  aprendido: string;
  problema: string;
  manana: string;
}

export async function proponerCierre(r: RespuestasCierre) {
  return envolver(async () => {
    const hoy = hoyEC();
    await db.guardarDia(hoy, r);
    const datos = await db.leerTodo();
    const p = await ia.proponerCierre(datos, r);
    const porId = new Map(datos.tareas.map((t) => [t.id, t]));
    const proyectos = new Map(datos.proyectos.map((x) => [x.id, x]));
    return {
      mensaje: p.mensaje,
      top3: p.top3_manana
        .filter((id) => porId.get(id)?.estado === 'PENDIENTE')
        .slice(0, 3)
        .map((id) => ({ id, texto: porId.get(id)!.tarea })),
      mover: p.mover
        .filter((m) => porId.get(m.id)?.estado === 'PENDIENTE' && /^\d{4}-\d{2}-\d{2}$/.test(m.nueva_fecha))
        .map((m) => ({ ...m, texto: porId.get(m.id)!.tarea, antes: porId.get(m.id)!.fecha_limite })),
      etapas: p.etapas
        .filter((e) => proyectos.get(e.proyecto_id)?.etapas.some((x) => x.nombre === e.etapa))
        .map((e) => ({ ...e, proyecto: proyectos.get(e.proyecto_id)!.nombre })),
    };
  });
}

export async function aplicarCierre(propuesta: {
  top3: ItemTop3[];
  mover: { id: string; nueva_fecha: string }[];
  etapas: { proyecto_id: string; etapa: string; pct: number }[];
}) {
  return envolver(async () => {
    const hoy = hoyEC();
    const manana = sumarDias(hoy, 1);
    for (const m of propuesta.mover) await db.actualizarTarea(m.id, { fecha_limite: m.nueva_fecha });

    const datos = await db.leerTodo();
    const porProyecto = new Map<string, { etapa: string; pct: number }[]>();
    for (const e of propuesta.etapas) {
      porProyecto.set(e.proyecto_id, [...(porProyecto.get(e.proyecto_id) ?? []), e]);
    }
    for (const [id, cambios] of porProyecto) {
      const p = datos.proyectos.find((x) => x.id === id);
      if (!p) continue;
      const etapas = p.etapas.map((e) => {
        const c = cambios.find((x) => x.etapa === e.nombre);
        return c ? { ...e, pct: Math.max(0, Math.min(100, c.pct)) } : e;
      });
      await db.guardarProyecto({ id, etapas });
    }

    await db.guardarDia(manana, {
      top3: propuesta.top3.slice(0, 3),
      mision: agendaDe(manana, productoActivo(datos)?.nombre).mision,
    });
    await db.guardarDia(hoy, { cerradoEn: ahoraEC() });
  });
}

export async function cerrarSinIA(r: RespuestasCierre) {
  return envolver(() => db.guardarDia(hoyEC(), { ...r, cerradoEn: ahoraEC() }));
}

// ── CEO y semana ────────────────────────────────────────────────────────────

export async function registrarMetrica(clave: string, valor: number, nota = '') {
  return envolver(async () => {
    if (!Number.isFinite(valor)) throw new Error('Número inválido');
    await db.registrarMetrica(clave, valor, nota);
  });
}

export async function guardarSemana(campos: Partial<Omit<Semana, 'semana'>>, cerrar = false) {
  return envolver(() =>
    db.guardarSemana(lunesDe(hoyEC()), { ...campos, ...(cerrar ? { cerradaEn: ahoraEC() } : {}) })
  );
}

export async function fijarCuelloBotella(texto: string) {
  return envolver(() => db.guardarSemana(lunesDe(hoyEC()), { cuelloBotella: texto }));
}

export async function redactarSemana() {
  return envolver(async () => {
    const texto = await ia.redactarRevisionSemanal(await db.leerTodo());
    await db.guardarSemana(lunesDe(hoyEC()), { resumenIa: texto });
    return texto;
  });
}

