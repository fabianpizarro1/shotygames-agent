#!/usr/bin/env node
// Progreso desde la terminal — lo que usa Claude Code en las sesiones de
// KEPLER desde que la IA de la app está apagada (2026-10-11). Mismos datos
// (Sheet personal + Google Calendar) y la MISMA lógica que la app: huecos de
// la rutina, validación de choques, calendario "Tareas", etiqueta "Tarea <id>".
//
//   node --env-file=.env.local scripts/progreso.mjs <comando> [args] [--simular]
//
//   resumen                         hoy: top 3, vencidas, semana, proyectos, inbox, dinero
//   tareas [NEGOCIO]                pendientes con id, fecha, negocio, proyecto
//   inbox                           capturas del + sin clasificar
//   huecos DESDE HASTA              tramos libres de trabajo (máx 14 días)
//   eventos DESDE HASTA             eventos del calendario con id y calendario
//   planificar ARCHIVO.json         [{tarea, negocio, prioridad, proyecto_id?, tipo?, decision?,
//                                    fecha_limite?, notas?, tarea_existente_id?, agenda?{fecha,hora,duracion_min}}]
//                                   valida TODO antes de crear (si algo choca, no crea nada)
//   crear-tareas ARCHIVO.json       [{tarea, negocio, prioridad, fecha_limite, proyectoId?, tipo?, decision?,
//                                    duracionMin?, responsable?, notas?}] en lote, sin agenda
//   actualizar ID '{json}'          cambios: prioridad, fecha_limite, negocio, notas, proyectoId, tipo, decision...
//   completar ID [ID...]            marca hechas
//   archivar ID [ID...]             las saca de la lista (el bot las ignora)
//   inbox-listo ID_INBOX [ID...]    marca capturas como procesadas
//   proyecto ID estado ESTADO       ACTIVO | PAUSADO | EN_COLA | TERMINADO (con las reglas de activación)
//   proyecto ID plan ARCHIVO.json   {fecha_limite, hitos:[{etapa, fecha}], siguiente_accion?}
//   agendar-proximas [PROYECTO_ID]  lo mismo que el cron del domingo
//   borrar-evento ID CALENDARIO
//
// --simular: lee todo de verdad pero no escribe nada.
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs';

const args = process.argv.slice(2).filter((a) => a !== '--simular');
if (process.argv.includes('--simular')) process.env.CHAT_SIMULADO = '1';
const SIMULAR = process.env.CHAT_SIMULADO === '1';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(aqui, '..', 'src');
const jiti = createJiti(import.meta.url, { alias: { 'server-only': path.join(aqui, '_vacio.mjs'), '@/': src + '/' } });
const cargar = (m) => jiti.import(path.join(src, 'lib', m));

const json = (x) => JSON.parse(x.trim().startsWith('[') || x.trim().startsWith('{') ? x : readFileSync(x, 'utf8'));
const imprimir = (x) => console.log(typeof x === 'string' ? x : JSON.stringify(x, null, 2));
const noEscribir = (que) => {
  if (SIMULAR) {
    console.log(`(simulado, no se escribió) ${que}`);
    return true;
  }
  return false;
};

const [cmd, ...resto] = args;
const datos = await cargar('datos.ts');
const { hoyEC, sumarDias, lunesDe } = await cargar('fecha.ts');

switch (cmd) {
  case 'resumen': {
    const d = await datos.leerTodo();
    const { tareasPendientesOrdenadas, cumplimientoSemana, alertas } = await cargar('calculos.ts');
    const { progresoProyecto } = await cargar('tipos.ts');
    const { leerNegocioDirecto } = await cargar('negocio.ts');
    const hoy = hoyEC();
    const pend = tareasPendientesOrdenadas(d, hoy);
    const dia = d.dias.find((x) => x.fecha === hoy);
    const n = await leerNegocioDirecto().catch(() => null);
    d.negocio = n; // leerTodo usa la caché de Next, que fuera de la app no existe
    const c = cumplimientoSemana(d, hoy);
    imprimir({
      hoy,
      semana: `${c.pct}% (meta 80%) desde ${lunesDe(hoy)}`,
      top3: dia?.top3 ?? [],
      vencidas: pend.filter((t) => t.fecha_limite && t.fecha_limite < hoy).map((t) => `${t.id} · ${t.fecha_limite} · ${t.tarea}`),
      hoy_y_proximos_7: pend
        .filter((t) => t.fecha_limite >= hoy && t.fecha_limite <= sumarDias(hoy, 7))
        .map((t) => `${t.id} · ${t.fecha_limite} · ${t.negocio} · ${t.tarea}`),
      sin_fecha: pend.filter((t) => !t.fecha_limite).length,
      proyectos_activos: d.proyectos
        .filter((p) => p.estado === 'ACTIVO')
        .map((p) => `${p.id} · ${p.nombre} · ${progresoProyecto(p)}%${p.fechaObjetivo ? ` · límite ${p.fechaObjetivo}` : ''}`),
      inbox_sin_clasificar: d.inbox.filter((i) => i.estado === 'NUEVO').map((i) => `${i.id} · ${i.texto}${i.tareaId ? ` (tarea ${i.tareaId})` : ''}`),
      alertas: alertas(d, hoy).map((a) => a.texto),
      dinero: n
        ? {
            utilidad_real_mes: n.utilidadRealMes,
            utilidad_cobrada_mes: n.utilidadCobradaMes,
            publicidad_mes: n.publicidadMes?.total,
            gastos_mes: n.gastosMes?.restados,
            en_la_calle: n.enCalle,
            deuda: n.deuda?.pendiente,
            caja: n.caja?.total,
            errores: n.errores,
          }
        : 'no se pudo leer',
    });
    break;
  }
  case 'tareas': {
    const d = await datos.leerTodo();
    const { tareasPendientesOrdenadas } = await cargar('calculos.ts');
    const filtro = resto[0]?.toUpperCase();
    for (const t of tareasPendientesOrdenadas(d, hoyEC()).filter((t) => !filtro || t.negocio === filtro)) {
      console.log([t.id, t.fecha_limite || 'sin fecha', t.prioridad, t.negocio || '-', t.proyectoId || '-', t.decision || '-', t.tarea].join(' | '));
    }
    break;
  }
  case 'inbox': {
    const d = await datos.leerTodo();
    imprimir(d.inbox.filter((i) => i.estado === 'NUEVO'));
    break;
  }
  case 'huecos': {
    const { huecosLibres } = await cargar('planificador.ts');
    imprimir(JSON.parse(await huecosLibres(resto[0], resto[1] ?? resto[0])));
    break;
  }
  case 'eventos': {
    const { eventosEntre } = await cargar('calendario.ts');
    for (const e of await eventosEntre(resto[0], resto[1] ?? resto[0])) {
      if (e.libre) continue;
      console.log([e.inicio.slice(0, 16), e.fin.slice(11, 16), e.calendario, e.id, e.titulo, /Tarea (\d+)/.exec(e.descripcion)?.[0] ?? ''].join(' | '));
    }
    break;
  }
  case 'planificar': {
    const { planificar } = await cargar('planificador.ts');
    imprimir(JSON.parse(await planificar(json(resto[0]), { simular: SIMULAR })));
    break;
  }
  case 'crear-tareas': {
    const lista = json(resto[0]);
    if (noEscribir(`${lista.length} tareas`)) break;
    imprimir(await datos.crearTareas(lista));
    break;
  }
  case 'actualizar': {
    if (noEscribir(`actualizar ${resto[0]}`)) break;
    await datos.actualizarTarea(resto[0], json(resto[1]));
    console.log('ok');
    break;
  }
  case 'completar': {
    if (noEscribir(`completar ${resto.join(', ')}`)) break;
    for (const id of resto) await datos.completarTarea(id);
    console.log(`${resto.length} hechas`);
    break;
  }
  case 'archivar': {
    if (noEscribir(`archivar ${resto.join(', ')}`)) break;
    console.log(`${await datos.archivarTareas(resto)} archivadas`);
    break;
  }
  case 'inbox-listo': {
    if (noEscribir(`inbox ${resto.join(', ')}`)) break;
    for (const id of resto) await datos.actualizarInbox(id, { estado: 'TAREA' });
    console.log('ok');
    break;
  }
  case 'proyecto': {
    const [id, accion, valor] = resto;
    if (accion === 'estado') {
      const { cambiarEstadoProyecto } = await cargar('proyectos.ts');
      if (noEscribir(`${id} → ${valor}`)) break;
      console.log(await cambiarEstadoProyecto(id, valor));
    } else if (accion === 'plan') {
      const plan = json(valor);
      const d = await datos.leerTodo();
      const p = d.proyectos.find((x) => x.id === id);
      if (!p) throw new Error(`No existe ${id}`);
      const etapas = p.etapas.map((e) => ({ ...e, fecha: plan.hitos?.find((h) => h.etapa === e.nombre)?.fecha ?? e.fecha }));
      if (noEscribir(`${p.nombre}: límite ${plan.fecha_limite}, ${plan.hitos?.length ?? 0} hitos`)) break;
      await datos.guardarProyecto({ id, fechaObjetivo: plan.fecha_limite, etapas, ...(plan.siguiente_accion && { siguienteAccion: plan.siguiente_accion }) });
      console.log('ok');
    } else throw new Error('proyecto ID estado ESTADO | proyecto ID plan ARCHIVO.json');
    break;
  }
  case 'agendar-proximas': {
    const { agendarProximas } = await cargar('organizador.ts');
    imprimir(await agendarProximas(resto[0] ? { proyectoId: resto[0] } : {}));
    break;
  }
  case 'borrar-evento': {
    const { eliminarEvento } = await cargar('calendario.ts');
    if (noEscribir(`borrar ${resto[0]}`)) break;
    await eliminarEvento(resto[0], resto[1]);
    console.log('ok');
    break;
  }
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 33).join('\n'));
}
