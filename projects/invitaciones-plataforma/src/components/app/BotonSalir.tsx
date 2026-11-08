'use client';

export function BotonSalir() {
  return (
    <button
      className="underline underline-offset-4"
      onClick={async () => {
        await fetch('/api/auth/salir', { method: 'POST' });
        window.location.href = '/login';
      }}
    >
      Salir
    </button>
  );
}
