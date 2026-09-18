'use client';

// Interruptor claro/oscuro, estilo iOS. El default (claro) lo pone
// globals.css; este componente solo alterna `data-theme` en <html> y lo
// guarda en localStorage — el script bloqueante de layout.tsx lo vuelve a
// aplicar en la próxima carga antes de pintar, para que no haya flash.

import { useEffect, useState } from 'react';

const CLAVE = 'tema';

export function InterruptorTema() {
  // Arranca en `false` (claro, el default del HTML) y se corrige apenas monta
  // si el script bloqueante ya había puesto oscuro — evita depender de
  // `document` durante el render del servidor.
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    setOscuro(document.documentElement.dataset.theme === 'oscuro');
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    document.documentElement.dataset.theme = nuevo ? 'oscuro' : 'claro';
    try {
      localStorage.setItem(CLAVE, nuevo ? 'oscuro' : 'claro');
    } catch {
      // Safari en modo privado tira acá — el interruptor igual cambia el
      // tema, solo que no se acuerda la próxima vez.
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      aria-label={oscuro ? 'Pasar a modo claro' : 'Pasar a modo oscuro'}
      onClick={alternar}
      className={`pulsable relative h-8 w-[52px] shrink-0 rounded-full border transition-colors duration-200 ${
        oscuro
          ? 'border-[var(--color-verde)] bg-[var(--color-verde)]'
          : 'border-[var(--color-borde-fuerte)] bg-[var(--color-superficie-alta)]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 grid size-6 place-items-center rounded-full bg-white text-[12px] shadow-sm transition-transform duration-200 ${
          oscuro ? 'translate-x-[22px]' : 'translate-x-0'
        }`}
      >
        {oscuro ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
