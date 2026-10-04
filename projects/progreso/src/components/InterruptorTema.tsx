'use client';

import { useEffect, useState } from 'react';

export default function InterruptorTema() {
  const [oscuro, setOscuro] = useState(true);

  useEffect(() => {
    setOscuro(document.documentElement.dataset.theme === 'oscuro');
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    document.documentElement.dataset.theme = nuevo ? 'oscuro' : 'claro';
    try {
      localStorage.setItem('tema', nuevo ? 'oscuro' : 'claro');
    } catch {}
  }

  return (
    <button onClick={alternar} className="pulsable rounded-lg px-2 py-2 text-lg" aria-label="Cambiar tema">
      {oscuro ? '☀️' : '🌙'}
    </button>
  );
}
