// La fecha del evento se lee de las partes del ISO (hora de Ecuador tal cual
// está escrita), nunca con el huso del navegador: un invitado en otro país
// debe ver "15:00", no su hora local.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface Partes {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  dow: number;
}

export function partes(iso: string): Partes | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  return { y, mo, d, h, mi, dow: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
}

export function textoFecha(iso: string): string {
  const p = partes(iso);
  return p ? `${DIAS[p.dow]} ${p.d} de ${MESES[p.mo - 1]}`.toUpperCase() : '';
}

export function textoHora(iso: string): string {
  const p = partes(iso);
  return p ? `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}` : '';
}

export function nombreMes(iso: string): string {
  const p = partes(iso);
  return p ? `${MESES[p.mo - 1]} ${p.y}`.toUpperCase() : '';
}

// Semanas del mes (lunes primero); null = casilla vacía.
export function matrizMes(y: number, mo: number): (number | null)[][] {
  const primero = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7;
  const dias = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const celdas: (number | null)[] = [...Array(primero).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  while (celdas.length % 7) celdas.push(null);
  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

const MESES_TXT = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_TXT = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Piezas sueltas para el diseño de la invitación (día en letras, mes, número, hora en formato 12 h).
export function piezasFecha(iso: string): { dia: string; mes: string; numero: string; hora: string } | null {
  const p = partes(iso);
  if (!p) return null;
  const h12 = p.h % 12 || 12;
  return {
    dia: DIAS_TXT[p.dow],
    mes: MESES_TXT[p.mo - 1],
    numero: String(p.d).padStart(2, '0'),
    hora: `${h12}:${String(p.mi).padStart(2, '0')} ${p.h >= 12 ? 'PM' : 'AM'}`,
  };
}
