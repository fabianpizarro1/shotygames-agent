import type { ResultadoAgenda, ResultadoOrganizar } from '@/lib/organizador';

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-10-13 10:10-11:40" → "mar 13 oct · 10:10-11:40" */
export function cuando(evento: string) {
  const [fecha, horas] = evento.split(' ');
  const d = new Date(`${fecha}T12:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}${horas ? ` · ${horas}` : ''}`;
}

export function fechaCorta(fecha: string) {
  if (!fecha) return '';
  const d = new Date(`${fecha}T12:00:00Z`);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

export default function ResultadoPlan({ r }: { r: Partial<ResultadoOrganizar> & ResultadoAgenda }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[var(--color-superficie-alta)] p-3 text-sm">
      {r.simulado && <p className="text-xs font-semibold text-[var(--color-ambar)]">Simulación local: no se escribió nada.</p>}
      {r.creadas !== undefined && (
        <p>
          <strong>{r.creadas} tareas</strong> creadas hasta la fecha límite · <strong>{r.agendadas.length}</strong> en tu calendario (próximas 2 semanas).
        </p>
      )}
      {r.creadas === undefined && (
        <p>
          <strong>{r.agendadas.length}</strong> tareas agendadas en las próximas 2 semanas.
        </p>
      )}
      {r.resumen && <p className="text-[var(--color-texto-suave)]">{r.resumen}</p>}
      {r.advertencia && <p className="rounded-lg bg-[var(--color-ambar-tenue)] px-2.5 py-1.5 text-xs text-[var(--color-ambar)]">{r.advertencia}</p>}
      {r.agendadas.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs">
          {r.agendadas.map((a, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{a.tarea}</span>
              <span className={`shrink-0 ${a.tarde ? 'text-[var(--color-ambar)]' : 'text-[var(--color-texto-tenue)]'}`}>
                {cuando(a.evento)}
                {a.tarde && ' (tarde)'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {r.sinHueco.length > 0 && (
        <p className="text-xs text-[var(--color-texto-suave)]">
          Sin hueco en 2 semanas (quedan como tareas con fecha): {r.sinHueco.join(' · ')}
        </p>
      )}
    </div>
  );
}
