'use client';

import Link from 'next/link';
import { useState } from 'react';

const campo = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-stone-900';

export function FormAuth({ modo, siguiente }: { modo: 'login' | 'registro'; siguiente: string }) {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await fetch(`/api/auth/${modo}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, clave, nombre }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'No se pudo');
      window.location.href = siguiente || '/app';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="f-script mb-6 text-center text-5xl">{modo === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
      <form onSubmit={enviar} className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        {modo === 'registro' && <input className={campo} placeholder="Tu nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />}
        <input className={campo} type="email" placeholder="Correo" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={campo} type="password" placeholder={modo === 'registro' ? 'Contraseña (mínimo 8)' : 'Contraseña'} autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} required value={clave} onChange={(e) => setClave(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={enviando} className="w-full rounded-lg bg-stone-900 py-3 font-semibold text-white disabled:opacity-60">
          {enviando ? 'Un momento…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-600">
        {modo === 'login' ? (
          <>¿Primera vez? <Link href="/registro" className="underline underline-offset-4">Crea tu cuenta</Link></>
        ) : (
          <>¿Ya tienes cuenta? <Link href="/login" className="underline underline-offset-4">Entra</Link></>
        )}
      </p>
    </main>
  );
}
