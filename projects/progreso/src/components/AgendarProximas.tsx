'use client';

import { useState } from 'react';
import { agendarProximas } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import type { ResultadoAgenda } from '@/lib/organizador';
import ResultadoPlan from './ResultadoPlan';

// Lo mismo que corre solo cada domingo a las 20:00, por si se quiere ya.
export default function AgendarProximas() {
  const { pendiente, error, correr } = useAccion();
  const [r, setR] = useState<ResultadoAgenda | null>(null);
  return (
    <div className="mb-3 flex flex-col gap-2">
      <button
        onClick={() => correr(() => agendarProximas(), setR)}
        disabled={pendiente}
        className="pulsable self-start rounded-full border border-[var(--color-borde)] px-3 py-1.5 text-xs text-[var(--color-texto-suave)]"
      >
        {pendiente ? 'Agendando…' : 'Agendar las próximas 2 semanas'}
      </button>
      {r && <ResultadoPlan r={r} />}
      {error && <p className="text-xs text-[var(--color-rojo)]">{error}</p>}
    </div>
  );
}
