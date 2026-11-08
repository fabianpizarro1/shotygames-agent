'use client';

import { useState } from 'react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) {
      window.location.href = '/admin';
      return;
    }
    setError(j.error || 'No se pudo entrar');
    setCargando(false);
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-stone-100 p-6 text-stone-900">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h1 className="text-lg font-semibold">Panel de la invitación</h1>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Clave"
          className="w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-stone-900"
        />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={!password || cargando} className="w-full rounded-lg bg-stone-900 py-2.5 font-medium text-white active:scale-[0.98] disabled:opacity-40">
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
