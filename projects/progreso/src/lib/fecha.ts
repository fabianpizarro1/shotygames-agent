// Ecuador no tiene horario de verano: el offset -05:00 es fijo todo el año,
// así que sumar/restar días en base a estas fechas nunca cruza un cambio de DST.
//
// Todas las fechas viajan como 'YYYY-MM-DD' (string). La aritmética se hace
// en UTC sobre esas partes — nunca con `new Date()` local, que en Vercel es
// UTC y corre el día a partir de las 19:00 de Ecuador.

const OPCIONES_FECHA: Intl.DateTimeFormatOptions = { timeZone: 'America/Guayaquil' };

export function hoyEC(): string {
  return new Intl.DateTimeFormat('en-CA', OPCIONES_FECHA).format(new Date());
}

function partesAhora(): Record<string, string> {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
}

export function ahoraEC(): string {
  const p = partesAhora();
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}-05:00`;
}

/** 'HH:MM' en Ecuador. */
export function horaEC(): string {
  const p = partesAhora();
  return `${p.hour}:${p.minute}`;
}

function aUTC(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function sumarDias(fecha: string, dias: number): string {
  const d = aUTC(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
export function diaSemana(fecha: string): number {
  return aUTC(fecha).getUTCDay();
}

/** Lunes de la semana de `fecha` — la semana es SIEMPRE lunes-domingo. */
export function lunesDe(fecha: string): string {
  const dow = diaSemana(fecha);
  return sumarDias(fecha, dow === 0 ? -6 : 1 - dow);
}

/** Días de b − a (positivo si b es posterior). */
export function diasEntre(a: string, b: string): number {
  return Math.round((aUTC(b).getTime() - aUTC(a).getTime()) / 86_400_000);
}

export const NOMBRE_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function fechaLarga(fecha: string): string {
  const [, m, d] = fecha.split('-').map(Number);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${NOMBRE_DIA[diaSemana(fecha)]} ${d} ${meses[m - 1]}`;
}
