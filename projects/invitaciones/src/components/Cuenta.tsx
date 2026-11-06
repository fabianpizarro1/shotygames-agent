'use client';

import { useEffect, useState } from 'react';
import { matrizMes, nombreMes, partes } from '@/lib/fechas';
import { Corazon } from './Stickers';

// Cuenta regresiva + calendario del mes con el día marcado.

function restante(objetivo: number) {
  const ms = Math.max(0, objetivo - Date.now());
  const s = Math.floor(ms / 1000);
  return { terminado: ms === 0, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Cuenta({ fechaHora }: { fechaHora: string }) {
  const objetivo = new Date(fechaHora).getTime();
  // null hasta montar: el servidor no sabe la hora del visitante y evita un desajuste de hidratación.
  const [t, setT] = useState<ReturnType<typeof restante> | null>(null);

  useEffect(() => {
    setT(restante(objetivo));
    const id = setInterval(() => setT(restante(objetivo)), 1000);
    return () => clearInterval(id);
  }, [objetivo]);

  const p = partes(fechaHora);
  const semanas = p ? matrizMes(p.y, p.mo) : [];
  const celdas: [string, number | undefined][] = [
    ['Días', t?.d],
    ['Horas', t?.h],
    ['Min', t?.m],
    ['Seg', t?.s],
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="f-cond text-center text-[15.5px] font-bold tracking-[0.35em]">
          {t?.terminado ? '¡Es hoy!' : 'Faltan'}
        </h2>
        <div className="mt-4 grid grid-cols-4 gap-2" aria-live="off">
          {celdas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="rounded-md py-3 text-center" style={{ background: 'var(--texto)', color: 'var(--papel)' }}>
              <div className="f-impact text-3xl tabular-nums leading-none">{valor === undefined ? '--' : String(valor).padStart(2, '0')}</div>
              <div className="mt-1.5 text-[13px] uppercase tracking-widest opacity-70">{etiqueta}</div>
            </div>
          ))}
        </div>
      </div>

      {p && (
        <div>
          <p className="f-cond mb-3 text-center text-[13.5px] tracking-[0.3em] opacity-80">{nombreMes(fechaHora)}</p>
          <div className="grid grid-cols-7 gap-y-1.5 text-center text-[15.5px]">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={i} className="pb-1 text-[13px] font-semibold opacity-50">{d}</span>
            ))}
            {semanas.flat().map((dia, i) => (
              <span key={i} className="relative grid h-9 place-items-center">
                {dia === p.d ? (
                  <>
                    <Corazon className="absolute size-9" />
                    <span className="relative text-[13.5px] font-bold" style={{ color: 'var(--papel)' }}>{dia}</span>
                  </>
                ) : (
                  <span className="opacity-80">{dia ?? ''}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
