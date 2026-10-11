// La semana tipo de Fabián (brief de octubre 2026). Puro, sin Sheets: se
// importa también desde componentes cliente.
//
// Si cambia la rutina, se cambia ACÁ, en context/rutina.md y en rutina.js de la
// raíz de KEPLER (huecos donde el bot de Telegram agenda) — y el Google Calendar
// con scripts/rutina-calendario-2026-10-v2.js como modelo.

import { diaSemana } from './fecha';

export type ClaseBloque = 'personal' | 'profundo' | 'operativo' | 'revision' | 'descanso';

/** Bloques donde el chat puede agendar tareas. El resto de la rutina no se toca. */
/**
 * GESTIONES = ventana de horario comercial (16:30-17:15): todo lo que depende de que un negocio esté
 * atendiendo (imprentas, proveedores, bancos, compras) va ahí y NUNCA después de las 18:00.
 * OPERATIVO = producción propia de las 18:00 (impresión por lotes), sin llamadas ni anuncios.
 */
export type TipoHueco = 'PROFUNDO_1' | 'PROFUNDO_2' | 'GESTIONES' | 'OPERATIVO' | 'PERSONAL' | 'CANDYSHOTS';

export interface BloqueAgenda {
  inicio: string; // 'HH:MM'
  fin: string;
  titulo: string;
  clase: ClaseBloque;
  noHacer?: string;
  agendable?: TipoHueco;
}

export interface DiaAgenda {
  mision: string;
  bloques: BloqueAgenda[];
  /** Lo que la app recuerda ese día además del Top 3. */
  recordatorio?: string;
}

const NO_HACER_PROFUNDO = 'Nada de Meta, redes ni WhatsApp personal. Pedido nuevo = 2 min y vuelves.';

/** `dormir`: se despierta a las 06:00 de lunes a viernes, así que duerme 22:30 domingo a jueves y 23:30 viernes y sábado. */
function diaLaboral(profundo1: string, profundo2: string, mision: string, recordatorio?: string, dormir = '22:30'): DiaAgenda {
  return {
    mision,
    recordatorio,
    bloques: [
      { inicio: '06:00', fin: '06:45', titulo: 'Agua, aseo sin redes + Biblia y oración', clase: 'personal' },
      { inicio: '06:45', fin: '07:00', titulo: 'Comida pre-entreno', clase: 'personal' },
      { inicio: '07:00', fin: '09:00', titulo: 'Gym (ir, entrenar y volver)', clase: 'personal' },
      { inicio: '09:00', fin: '09:30', titulo: 'Desayuno', clase: 'personal' },
      { inicio: '09:30', fin: '10:00', titulo: 'Ducha + prepararme', clase: 'personal' },
      {
        inicio: '10:00',
        fin: '10:30',
        titulo: 'Logística #1 + control del test diario (3 tiendas)',
        clase: 'revision',
        noHacer: 'Revisar, no optimizar. 30 min y cierras Meta.',
      },
      { inicio: '10:30', fin: '13:00', titulo: `Profundo #1 — ${profundo1}`, clase: 'profundo', noHacer: NO_HACER_PROFUNDO, agendable: 'PROFUNDO_1' },
      { inicio: '13:00', fin: '13:30', titulo: 'Pausa — camina o estírate antes de almorzar', clase: 'descanso' },
      { inicio: '13:30', fin: '14:30', titulo: 'Almuerzo', clase: 'descanso' },
      { inicio: '14:30', fin: '16:30', titulo: `Profundo #2 — ${profundo2}`, clase: 'profundo', noHacer: NO_HACER_PROFUNDO, agendable: 'PROFUNDO_2' },
      {
        inicio: '16:30',
        fin: '17:15',
        titulo: 'Gestiones con negocios (horario comercial)',
        clase: 'operativo',
        noHacer: 'Imprentas, proveedores, bancos y compras, antes de que cierren. Los anuncios se PROGRAMAN para las 05:00; nunca se activan ahora.',
        agendable: 'GESTIONES',
      },
      { inicio: '17:15', fin: '17:45', titulo: 'Revisión de logística #2: guías, novedades y urgentes', clase: 'revision' },
      { inicio: '17:45', fin: '18:00', titulo: 'Snack', clase: 'personal' },
      {
        inicio: '18:00',
        fin: '19:00',
        titulo: 'Producción por lotes: impresión de bloques / sistemas',
        clase: 'operativo',
        noHacer: 'Sin llamadas ni anuncios (a esta hora los negocios ya cerraron). Impresión solo según stock y pedidos.',
        agendable: 'OPERATIVO',
      },
      {
        inicio: '19:00',
        fin: '20:00',
        titulo: 'Vida personal — familia, pareja, amigos',
        clase: 'descanso',
        noHacer: 'Ocio sin culpa. No compenses trabajando de noche.',
        agendable: 'PERSONAL',
      },
      { inicio: '20:00', fin: '21:00', titulo: 'Merienda', clase: 'personal' },
      { inicio: '21:00', fin: '21:20', titulo: 'Revisión de logística #3: la última del día', clase: 'revision' },
      { inicio: '21:20', fin: '22:00', titulo: 'Vida personal — desconectar, sin trabajo', clase: 'descanso', agendable: 'PERSONAL' },
      { inicio: '22:00', fin: '22:20', titulo: 'Cerrar día + Top 3 de mañana', clase: 'revision' },
      { inicio: '22:20', fin: dormir, titulo: 'Descanso', clase: 'descanso', noHacer: 'Nada de trabajo después de las 22:20.' },
      { inicio: dormir, fin: '23:59', titulo: 'Dormir', clase: 'descanso' },
    ],
  };
}

function diaCandy(mision: string, extra: BloqueAgenda | null, recordatorio?: string, dormir = '23:30'): DiaAgenda {
  const bloques: BloqueAgenda[] = [
    { inicio: '07:00', fin: '07:45', titulo: 'Biblia + oración, sin apuro', clase: 'personal' },
    { inicio: '07:45', fin: '08:30', titulo: 'Desayuno', clase: 'personal' },
  ];
  if (extra) bloques.push(extra);
  bloques.push(
    {
      inicio: '09:30',
      fin: '10:00',
      titulo: 'Revisión mínima: pedidos, logística, producto drop del día',
      clase: 'revision',
    },
    {
      inicio: '10:00',
      fin: '22:00',
      titulo: 'CandyShots — observar cuellos de botella, tiempos, preguntas; grabar contenido',
      clase: 'operativo',
      noHacer: 'No trabajar como empleado del local: anotar qué se puede delegar.',
      agendable: 'CANDYSHOTS',
    },
    { inicio: '22:00', fin: '22:20', titulo: 'Cerrar día', clase: 'revision' },
    { inicio: dormir, fin: '23:59', titulo: 'Dormir', clase: 'descanso' }
  );
  return { mision, bloques, recordatorio };
}

export function agendaDe(fecha: string, productoActivo = 'producto activo'): DiaAgenda {
  switch (diaSemana(fecha)) {
    case 1:
      return diaLaboral(
        'CEO: números + elegir el cuello de botella de la semana',
        'Ads ShotyGames — tanda 1 (3-5 creativos)',
        'CEO + ShotyGames marketing',
        'Elige UN cuello de botella para la semana y escríbelo en CEO.'
      );
    case 2:
      return diaLaboral(
        productoActivo,
        `${productoActivo} (diseño, proveedor, costos, prototipo…)`,
        `Avanzar ${productoActivo}`,
        'El producto activo tiene que avanzar visible esta semana.'
      );
    case 3:
      return diaLaboral(
        'Product Lab: investigar y seleccionar productos',
        'Ofertas, landings, creativos y campañas — cola de 7',
        'Product Lab dropshipping',
        'Meta: dejar ~7 productos listos para salir uno por día.'
      );
    case 4:
      return diaLaboral(
        'Sistemas + delegación: ¿qué tarea puedo dejar de hacer yo?',
        'CandyShots: procesos, recetas, inventario, caja',
        'Sistemas, delegación y CandyShots'
      );
    case 5:
      return diaLaboral(
        'Ads: detectar ganadores + tanda 2',
        'Contenido + finanzas + plan de la semana',
        'Marketing, iteración y finanzas',
        'Antes de cerrar: stock suficiente para sábado, domingo y lunes.',
        '23:30'
      );
    case 6:
      return diaCandy('CandyShots + operación ligera', null, 'El producto drop de hoy sale igual (preparado el miércoles).');
    default:
      return diaCandy(
        'CandyShots + revisión semanal',
        { inicio: '08:30', fin: '09:30', titulo: 'Revisión semanal (30 min, no 3 horas)', clase: 'revision' },
        'Revisión semanal en CEO → Revisión.',
        '22:30'
      );
  }
}

export function bloqueActual(
  agenda: DiaAgenda,
  hora: string
): { actual: BloqueAgenda | null; siguiente: BloqueAgenda | null } {
  const idx = agenda.bloques.findIndex((b) => hora >= b.inicio && hora < b.fin);
  if (idx >= 0) return { actual: agenda.bloques[idx], siguiente: agenda.bloques[idx + 1] ?? null };
  const siguiente = agenda.bloques.find((b) => b.inicio > hora) ?? null;
  return { actual: null, siguiente };
}

/** Los bloques del día donde se pueden agendar tareas, con su propósito. */
export function huecosDeTrabajo(fecha: string): { tipo: TipoHueco; inicio: string; fin: string; para: string }[] {
  return agendaDe(fecha)
    .bloques.filter((b): b is BloqueAgenda & { agendable: TipoHueco } => !!b.agendable)
    .map((b) => ({ tipo: b.agendable, inicio: b.inicio, fin: b.fin, para: b.titulo }));
}
