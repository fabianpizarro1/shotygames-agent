'use client';

import { useState } from 'react';
import { api, json } from './tipos';

const ESTILOS = ['Elegante', 'Romántico', 'Divertido', 'Minimalista', 'Moderno', 'Clásico'];
const COLORES = ['Rosa', 'Lila', 'Azul', 'Verde', 'Dorado', 'Rojo vino', 'Blanco y negro'];

const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm font-medium ${on ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white'}`;

// "Diseñar con IA": el cliente cuenta lo que quiere y la IA propone colores y textos. La propuesta se aplica a la
// vista previa SIN guardar: el cliente puede pedir otra versión, ajustar a mano, guardar o descartar.
export function PanelIA({ onAplicar }: { onAplicar: (cambios: Record<string, string>) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [estilo, setEstilo] = useState('');
  const [colores, setColores] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [intentos, setIntentos] = useState(0);

  async function crear() {
    setCargando(true);
    setAviso(null);
    try {
      const r = await api<{ cambios: Record<string, string> }>('/api/admin/ia', json('POST', { descripcion, estilo, colores }));
      if (!r.ok) throw new Error(r.error || 'No se pudo crear la propuesta');
      onAplicar(r.cambios);
      setIntentos((n) => n + 1);
      setAviso({ tipo: 'ok', texto: `Listo: apliqué ${Object.keys(r.cambios).length} cambios a la vista previa. Revisa cómo quedó y pulsa «Guardar cambios» si te gusta, o pide otra versión.` });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo crear la propuesta' });
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="rounded-xl bg-white ring-1 ring-stone-200">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span>
          <span className="block font-semibold">✨ Diseñar con IA</span>
          <span className="block text-sm text-stone-500">Cuéntame cómo la quieres y propongo colores y textos.</span>
        </span>
        <span aria-hidden className="text-stone-400">{abierto ? '▴' : '▾'}</span>
      </button>
      {abierto && (
        <div className="space-y-3 border-t border-stone-100 px-4 pb-4 pt-3">
          <label className="block text-sm font-medium" htmlFor="ia-desc">¿Cómo quieres tu invitación?</label>
          <textarea
            id="ia-desc"
            rows={3}
            maxLength={600}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Algo delicado y romántico, con tonos durazno y verde salvia. Mensaje corto y cálido para mi familia."
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900"
          />
          <div>
            <p className="mb-1.5 text-sm font-medium">Estilo</p>
            <div className="flex flex-wrap gap-2">
              {ESTILOS.map((x) => (
                <button key={x} type="button" aria-pressed={estilo === x} onClick={() => setEstilo(estilo === x ? '' : x)} className={chip(estilo === x)}>{x}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Colores (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((x) => (
                <button key={x} type="button" aria-pressed={colores === x} onClick={() => setColores(colores === x ? '' : x)} className={chip(colores === x)}>{x}</button>
              ))}
            </div>
          </div>
          <button type="button" disabled={cargando || descripcion.trim().length < 8} onClick={crear} className="w-full rounded-lg bg-stone-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {cargando ? 'Creando propuesta…' : intentos ? 'Otra versión' : 'Crear propuesta'}
          </button>
          {aviso && (
            <p role={aviso.tipo === 'error' ? 'alert' : 'status'} className={`rounded-lg p-3 text-sm ${aviso.tipo === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-900'}`}>{aviso.texto}</p>
          )}
          <p className="text-xs text-stone-500">La propuesta no cambia fechas, lugares ni nombres. Nada se guarda hasta que pulses «Guardar cambios».</p>
        </div>
      )}
    </section>
  );
}
