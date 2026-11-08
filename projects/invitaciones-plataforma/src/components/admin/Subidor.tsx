'use client';

import { useRef, useState } from 'react';
import { subirArchivo } from '@/lib/cliente-subida';

interface Props {
  valor: string;
  onChange: (v: string) => void;
  tipo: 'imagen' | 'audio';
  multiple?: boolean;
  maxLado?: number;
}

const boton = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium active:scale-[0.97] disabled:opacity-50';

export function Subidor({ valor, onChange, tipo, multiple = false, maxLado }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [error, setError] = useState('');
  const urls = valor.split('\n').map((u) => u.trim()).filter(Boolean);

  async function elegir(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    try {
      const nuevas: string[] = [];
      for (const f of Array.from(files)) {
        setProgreso(0);
        nuevas.push(await subirArchivo(f, { maxLado, alProgreso: setProgreso }));
      }
      onChange(multiple ? [...urls, ...nuevas].join('\n') : nuevas[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir');
    } finally {
      setProgreso(null);
      if (input.current) input.current.value = '';
    }
  }

  const mover = (i: number, d: -1 | 1) => {
    const a = [...urls];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a.join('\n'));
  };

  return (
    <div className="space-y-3">
      {tipo === 'imagen' && urls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {urls.map((u, i) => (
            <div key={u + i} className="w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="aspect-square w-24 rounded-lg border border-stone-200 bg-stone-100 object-cover" />
              <div className="mt-1 flex justify-between text-xs">
                {multiple && <button type="button" onClick={() => mover(i, -1)} aria-label="Mover antes" className="px-1.5 py-0.5">←</button>}
                <button type="button" onClick={() => onChange(multiple ? urls.filter((_, k) => k !== i).join('\n') : '')} className="px-1.5 py-0.5 text-red-700">Quitar</button>
                {multiple && <button type="button" onClick={() => mover(i, 1)} aria-label="Mover después" className="px-1.5 py-0.5">→</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {tipo === 'audio' && urls[0] && (
        <div className="space-y-2">
          <audio src={urls[0]} controls preload="none" className="w-full" />
          <button type="button" onClick={() => onChange('')} className="text-xs text-red-700">Quitar canción</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button type="button" disabled={progreso !== null} onClick={() => input.current?.click()} className={boton}>
          {progreso !== null
            ? `Subiendo ${Math.round(progreso * 100)}%`
            : tipo === 'audio' ? (urls[0] ? 'Cambiar canción' : 'Subir canción (MP3/M4A)') : multiple ? 'Agregar fotos' : urls[0] ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        <input ref={input} type="file" hidden multiple={multiple} accept={tipo === 'audio' ? 'audio/*' : 'image/*'} onChange={(e) => elegir(e.target.files)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
