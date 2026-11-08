'use client';

import { useRef, useState } from 'react';
import { subirImagenEditor } from '@/lib/cliente-subida';
import { eventoActual } from './tipos';

interface Props {
  valor: string;
  onChange: (v: string) => void;
  tipo: 'imagen' | 'audio';
  multiple?: boolean;
  maxLado?: number;
}

const boton = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium active:scale-[0.97] disabled:opacity-50';
const campo = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900';

// Imágenes: se suben desde el celular o se pega un enlace. Audio: solo enlace (la plataforma no aloja música con derechos).
export function Subidor({ valor, onChange, tipo, multiple = false, maxLado }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const urls = valor.split('\n').map((u) => u.trim()).filter(Boolean);

  async function elegir(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setSubiendo(true);
    try {
      const nuevas: string[] = [];
      for (const f of Array.from(files)) nuevas.push(await subirImagenEditor(eventoActual(), f, { maxLado }));
      onChange(multiple ? [...urls, ...nuevas].join('\n') : nuevas[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir');
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = '';
    }
  }

  const quitar = (i: number) => onChange(urls.filter((_, k) => k !== i).join('\n'));
  const mover = (i: number, d: -1 | 1) => {
    const a = [...urls];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a.join('\n'));
  };

  return (
    <div className="space-y-2">
      {tipo === 'imagen' && urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <div key={u + i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-20 w-auto rounded-md object-cover ring-1 ring-stone-200" />
              <button type="button" aria-label="Quitar imagen" onClick={() => quitar(i)} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-stone-900 text-sm leading-none text-white">×</button>
              {multiple && urls.length > 1 && (
                <span className="mt-1 flex justify-center gap-1">
                  <button type="button" aria-label="Mover antes" onClick={() => mover(i, -1)} className="rounded border border-stone-300 px-1.5 text-xs">←</button>
                  <button type="button" aria-label="Mover después" onClick={() => mover(i, 1)} className="rounded border border-stone-300 px-1.5 text-xs">→</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {tipo === 'imagen' && (
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept="image/*" multiple={multiple} className="sr-only" onChange={(e) => elegir(e.target.files)} />
          <button type="button" disabled={subiendo} onClick={() => input.current?.click()} className={boton}>
            {subiendo ? 'Subiendo…' : urls.length && !multiple ? 'Cambiar imagen' : multiple ? 'Agregar imágenes' : 'Subir imagen'}
          </button>
          {!multiple && urls.length > 0 && <button type="button" onClick={() => onChange('')} className={boton}>Quitar</button>}
        </div>
      )}
      {tipo === 'audio' && <input className={campo} placeholder="Enlace al audio (https://…)" value={valor} onChange={(e) => onChange(e.target.value)} />}
      {tipo === 'audio' && <p className="text-xs text-stone-500">La música se agrega con un enlace: no alojamos canciones con derechos de autor.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
