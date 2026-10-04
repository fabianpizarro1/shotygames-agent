'use client';

import { useState, useTransition } from 'react';
import type { Resultado } from '@/app/acciones';

// Las server actions ya llaman revalidatePath: al volver, la página se
// re-renderiza sola con los datos nuevos. Esto solo maneja "cargando" y errores.
export function useAccion() {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState('');

  function correr<T>(fn: () => Promise<Resultado<T>>, alTerminar?: (data: T) => void) {
    setError('');
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error);
      else alTerminar?.(r.data);
    });
  }

  return { pendiente, error, setError, correr };
}
