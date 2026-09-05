'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error ?? 'No se pudo entrar');
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar');
      setCargando(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={entrar} className="animar-panel w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[var(--color-verde)]" />
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-texto-tenue)] uppercase">
              Logística
            </span>
          </div>
          <h1 className="text-2xl font-semibold">Truquito, Avanora y ShotyGames</h1>
          <p className="prosa mt-1 text-sm text-[var(--color-texto-suave)]">
            Los pedidos que están en la calle ahora mismo.
          </p>
        </div>

        <label htmlFor="pass" className="mb-2 block text-sm text-[var(--color-texto-suave)]">
          Contraseña
        </label>
        <input
          id="pass"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 py-3 outline-none transition-colors duration-150 focus:border-[var(--color-verde)]"
        />

        {error && <p className="mt-3 text-sm text-[var(--color-rojo)]">{error}</p>}

        <button
          type="submit"
          disabled={cargando || !password}
          className="pulsable mt-5 w-full rounded-xl bg-[var(--color-verde)] px-4 py-3 font-semibold text-[#08110c] disabled:opacity-40"
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
