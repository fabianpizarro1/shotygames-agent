'use client';

import { useState } from 'react';
import { actualizarTarea, alternarTop3, archivarTareas, completarTarea } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import type { CambiosTarea } from '@/lib/datos';
import {
  DECISIONES,
  LABEL_DECISION,
  LABEL_TIPO,
  NEGOCIOS,
  TIPOS_TAREA,
  labelNegocio,
  type Decision,
  type Tarea,
} from '@/lib/tipos';

const COLOR_PRIORIDAD: Record<string, string> = {
  ALTA: 'var(--color-rojo)',
  MEDIA: 'var(--color-ambar)',
  BAJA: 'var(--color-texto-tenue)',
};

export interface TareaVista extends Tarea {
  puntaje?: number;
  razones?: string[];
}

export default function TareaFila({
  tarea: t,
  hoy,
  enTop3,
  proyectos,
}: {
  tarea: TareaVista;
  hoy: string;
  enTop3: boolean;
  proyectos: { id: string; nombre: string }[];
}) {
  const [abierta, setAbierta] = useState(false);
  const { pendiente, error, correr } = useAccion();
  const hecha = t.estado === 'HECHO';
  const vencida = Boolean(t.fecha_limite && t.fecha_limite < hoy && !hecha);

  function cambiar(c: CambiosTarea) {
    correr(() => actualizarTarea(t.id, c));
  }

  return (
    <li className={`tarjeta animar-aparecer ${pendiente ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 px-3 py-3">
        <button
          onClick={() => correr(() => completarTarea(t.id, !hecha))}
          aria-label={hecha ? 'Reabrir' : 'Completar'}
          className={`pulsable mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
            hecha ? 'border-[var(--color-verde)] bg-[var(--color-verde)] text-white' : 'border-[var(--color-borde-fuerte)] text-transparent'
          }`}
        >
          ✓
        </button>
        <button onClick={() => setAbierta(!abierta)} className="flex-1 text-left">
          <p className={`text-sm font-medium ${hecha ? 'line-through opacity-60' : ''}`}>{t.tarea}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[var(--color-texto-tenue)]">
            <span style={{ color: COLOR_PRIORIDAD[t.prioridad] }}>{t.prioridad}</span>
            {t.negocio && <span>· {labelNegocio(t.negocio)}</span>}
            {t.fecha_limite && (
              <span className={vencida ? 'font-semibold text-[var(--color-rojo)]' : ''}>
                · {vencida ? 'venció' : 'vence'} {t.fecha_limite}
              </span>
            )}
            {t.decision && t.decision !== 'HACER_YO' && (
              <span className="font-semibold text-[var(--color-acento)]">· {LABEL_DECISION[t.decision]}</span>
            )}
            {!t.decision && !hecha && <span className="text-[var(--color-ambar)]">· ¿lo hace Fabián?</span>}
          </div>
        </button>
        {!hecha && (
          <button
            onClick={() => correr(() => alternarTop3(hoy, t.id, t.tarea))}
            aria-label={enTop3 ? 'Sacar del Top 3' : 'Meter al Top 3'}
            className={`pulsable rounded-lg px-1.5 py-0.5 text-lg ${enTop3 ? '' : 'opacity-30 grayscale'}`}
          >
            ⭐
          </button>
        )}
      </div>

      {error && <p className="px-3 pb-2 text-xs text-[var(--color-rojo)]">{error}</p>}

      {abierta && (
        <div className="flex flex-col gap-3 border-t border-[var(--color-borde)] p-3 text-sm">
          {t.razones && t.razones.length > 0 && (
            <p className="text-xs text-[var(--color-texto-tenue)]">
              Puntaje {t.puntaje}: {t.razones.join(' · ')}
            </p>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-[var(--color-texto-suave)]">¿Esto realmente necesita hacerlo Fabián?</p>
            <div className="flex flex-wrap gap-1.5">
              {DECISIONES.map((d) => (
                <button
                  key={d}
                  onClick={() => cambiar({ decision: t.decision === d ? '' : (d as Decision) })}
                  className={`pulsable rounded-full border px-3 py-1 text-xs ${
                    t.decision === d
                      ? 'border-[var(--color-acento)] bg-[var(--color-acento-tenue)] font-semibold text-[var(--color-acento)]'
                      : 'border-[var(--color-borde)]'
                  }`}
                >
                  {LABEL_DECISION[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select value={t.prioridad} onChange={(e) => cambiar({ prioridad: e.target.value as Tarea['prioridad'] })} className="campo">
              <option value="ALTA">Prioridad alta</option>
              <option value="MEDIA">Prioridad media</option>
              <option value="BAJA">Prioridad baja</option>
            </select>
            <input
              type="date"
              defaultValue={t.fecha_limite}
              onBlur={(e) => e.target.value !== t.fecha_limite && cambiar({ fecha_limite: e.target.value })}
              className="campo"
            />
            <select value={t.negocio} onChange={(e) => cambiar({ negocio: e.target.value })} className="campo">
              <option value="">Sin negocio</option>
              {NEGOCIOS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <select value={t.tipo} onChange={(e) => cambiar({ tipo: e.target.value as Tarea['tipo'] })} className="campo">
              <option value="">Tipo…</option>
              {TIPOS_TAREA.map((x) => (
                <option key={x} value={x}>
                  {LABEL_TIPO[x]}
                </option>
              ))}
            </select>
            <select value={t.proyectoId} onChange={(e) => cambiar({ proyectoId: e.target.value })} className="campo col-span-2">
              <option value="">Sin proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <input
              defaultValue={t.responsable}
              placeholder="Responsable"
              onBlur={(e) => e.target.value !== t.responsable && cambiar({ responsable: e.target.value })}
              className="campo"
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={t.duracionMin ?? ''}
              placeholder="Minutos"
              onBlur={(e) => {
                const v = e.target.value === '' ? null : Number(e.target.value);
                if (v !== t.duracionMin) cambiar({ duracionMin: v });
              }}
              className="campo"
            />
          </div>

          <button
            onClick={() => correr(() => archivarTareas([t.id]))}
            className="pulsable self-start text-xs font-medium text-[var(--color-texto-tenue)] underline"
          >
            Archivar (no se borra, el bot deja de verla)
          </button>
        </div>
      )}
    </li>
  );
}
