'use client';

import { useState } from 'react';
import { fijarCuelloBotella } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';

export default function CuelloBotella({ actual }: { actual: string }) {
  const [texto, setTexto] = useState(actual);
  const { pendiente, error, correr } = useAccion();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        correr(() => fijarCuelloBotella(texto.trim()));
      }}
      className="flex gap-2"
    >
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="UNO solo. Ej: devoluciones COD, impresión depende de mí…"
        className="campo flex-1 text-sm"
      />
      <button type="submit" disabled={pendiente || texto.trim() === actual} className="pulsable boton-primario">
        Fijar
      </button>
      {error && <p className="text-xs text-[var(--color-rojo)]">{error}</p>}
    </form>
  );
}
