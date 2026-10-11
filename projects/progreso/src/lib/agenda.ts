// La semana tipo de Fabián (brief de octubre 2026). Puro, sin Sheets: se
// importa también desde componentes cliente.
//
// Si cambia la rutina, se cambia ACÁ, en context/rutina.md y en rutina.js de la
// raíz de KEPLER (huecos donde el bot de Telegram agenda) — y el Google Calendar
// con scripts/rutina-calendario-2026-10.js como modelo.

import { diaSemana } from './fecha';

export type ClaseBloque = 'personal' | 'profundo' | 'operativo' | 'revision' | 'descanso';

export interface BloqueAgenda {
  inicio: string; // 'HH:MM'
  fin: string;
  titulo: string;
  clase: ClaseBloque;
  noHacer?: string;
}

export interface DiaAgenda {
  mision: string;
  bloques: BloqueAgenda[];
  /** Lo que la app recuerda ese día además del Top 3. */
  recordatorio?: string;
}

const NO_HACER_PROFUNDO = 'Nada de Meta, redes ni WhatsApp personal. Pedido nuevo = 2 min y vuelves.';

function diaLaboral(profundo1: string, profundo2: string, mision: string, recordatorio?: string): DiaAgenda {
  return {
    mision,
    recordatorio,
    bloques: [
      { inicio: '07:00', fin: '07:15', titulo: 'Agua, aseo — sin redes', clase: 'personal' },
      { inicio: '07:15', fin: '07:45', titulo: 'Biblia + oración + reflexión', clase: 'personal' },
      { inicio: '07:45', fin: '08:15', titulo: 'Desayuno', clase: 'personal' },
      { inicio: '08:15', fin: '09:15', titulo: 'Gym', clase: 'personal' },
      { inicio: '09:15', fin: '09:45', titulo: 'Ducha + prepararme', clase: 'personal' },
      {
        inicio: '09:45',
        fin: '10:10',
        titulo: 'Revisión rápida: Meta, pedidos, urgencias',
        clase: 'revision',
        noHacer: 'Revisar, no optimizar. 25 min y cierras Meta.',
      },
      { inicio: '10:10', fin: '12:30', titulo: `Profundo #1 — ${profundo1}`, clase: 'profundo', noHacer: NO_HACER_PROFUNDO },
      { inicio: '12:30', fin: '12:50', titulo: 'Logística: guías + novedades (3 tiendas)', clase: 'operativo' },
      { inicio: '12:50', fin: '14:00', titulo: 'Almuerzo + descanso', clase: 'descanso' },
      { inicio: '14:00', fin: '16:30', titulo: `Profundo #2 — ${profundo2}`, clase: 'profundo', noHacer: NO_HACER_PROFUNDO },
      { inicio: '16:30', fin: '17:15', titulo: 'Producción / sistemas / secundarias', clase: 'operativo' },
      { inicio: '17:15', fin: '17:35', titulo: 'Última revisión: logística, Meta, urgentes', clase: 'revision' },
      {
        inicio: '17:35',
        fin: '21:30',
        titulo: 'Vida personal — familia, pareja, amigos',
        clase: 'descanso',
        noHacer: 'Ocio sin culpa. No compenses trabajando de noche.',
      },
      { inicio: '21:30', fin: '22:00', titulo: 'Inglés', clase: 'personal' },
      { inicio: '22:00', fin: '22:20', titulo: 'Cerrar día + Top 3 de mañana', clase: 'revision' },
      { inicio: '22:20', fin: '23:30', titulo: 'Descanso', clase: 'descanso', noHacer: 'Nada de trabajo después de las 22:20.' },
      { inicio: '23:30', fin: '23:59', titulo: 'Dormir', clase: 'descanso' },
    ],
  };
}

function diaCandy(mision: string, extra: BloqueAgenda | null, recordatorio?: string): DiaAgenda {
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
    },
    { inicio: '22:00', fin: '22:20', titulo: 'Cerrar día', clase: 'revision' },
    { inicio: '23:30', fin: '23:59', titulo: 'Dormir', clase: 'descanso' }
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
        'Antes de cerrar: stock suficiente para sábado, domingo y lunes.'
      );
    case 6:
      return diaCandy('CandyShots + operación ligera', null, 'El producto drop de hoy sale igual (preparado el miércoles).');
    default:
      return diaCandy(
        'CandyShots + revisión semanal',
        { inicio: '08:30', fin: '09:30', titulo: 'Revisión semanal (30 min, no 3 horas)', clase: 'revision' },
        'Revisión semanal en CEO → Revisión.'
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
