'use client';

import { useState } from 'react';
import { registrarMetrica } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';

export default function MetricaEditable({
  clave,
  label,
  valor,
  anterior,
  fecha,
  prefijo = '',
  meta,
  bajarEsBueno = false,
}: {
  clave: string;
  label: string;
  valor: number | null;
  anterior: number | null;
  fecha: string;
  prefijo?: string;
  meta?: number | null;
  bajarEsBueno?: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [nuevo, setNuevo] = useState('');
  const { pendiente, error, correr } = useAccion();
  const fmt = (n: number) => `${prefijo}${n.toLocaleString('es-EC')}`;
  const delta = valor !== null && anterior !== null ? valor - anterior : null;
  const deltaBueno = delta === null || delta === 0 ? null : bajarEsBueno ? delta < 0 : delta > 0;
  const pctMeta = meta && valor !== null ? Math.min(100, Math.round((valor / meta) * 100)) : null;

  return (
    <div className="tarjeta p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-[var(--color-texto-tenue)]">{label}</p>
        <button onClick={() => setEditando(!editando)} className="text-xs font-medium text-[var(--color-acento)]">
          {editando ? 'Cancelar' : 'Actualizar'}
        </button>
      </div>
      <p className="mt-0.5 text-2xl font-bold">
        {valor === null ? <span className="text-base font-normal text-[var(--color-texto-tenue)]">sin dato</span> : fmt(valor)}
        {meta ? <span className="text-sm font-normal text-[var(--color-texto-tenue)]"> / {fmt(meta)}</span> : null}
      </p>
      {delta !== null && delta !== 0 && (
        <p className="text-xs font-medium" style={{ color: deltaBueno ? 'var(--color-verde)' : 'var(--color-rojo)' }}>
          {delta > 0 ? '↑' : '↓'} {fmt(Math.abs(delta))} vs anterior
        </p>
      )}
      {fecha && <p className="text-[11px] text-[var(--color-texto-tenue)]">al {fecha}</p>}
      {pctMeta !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-superficie-alta)]">
          <div className="h-full bg-[var(--color-verde)]" style={{ width: `${pctMeta}%` }} />
        </div>
      )}
      {editando && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            correr(() => registrarMetrica(clave, Number(nuevo.replace(',', '.'))), () => {
              setEditando(false);
              setNuevo('');
            });
          }}
          className="mt-2 flex gap-2"
        >
          <input
            autoFocus
            inputMode="decimal"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Valor real"
            className="campo flex-1"
          />
          <button type="submit" disabled={pendiente || !nuevo} className="pulsable boton-primario">
            OK
          </button>
        </form>
      )}
      {error && <p className="mt-1 text-xs text-[var(--color-rojo)]">{error}</p>}
    </div>
  );
}
