'use client';

import { useState } from 'react';

const campo = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-stone-900';

export function NuevoEvento({ plantillas }: { plantillas: { slug: string; nombre: string; descripcion: string }[] }) {
  const [nombre, setNombre] = useState('');
  const [festejado, setFestejado] = useState('');
  const [plantilla, setPlantilla] = useState(plantillas[0]?.slug ?? 'cumple');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await fetch('/api/app/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, festejado, plantilla }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'No se pudo crear');
      window.location.href = `/app/${j.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={crear} className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-stone-200">
      <h2 className="font-semibold">Nuevo evento</h2>
      <input className={campo} placeholder="Nombre del evento (ej: Cumpleaños de Ana)" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input className={campo} placeholder="Nombre de quien cumple (ej: Ana)" value={festejado} onChange={(e) => setFestejado(e.target.value)} />
      <div className="space-y-2">
        {plantillas.map((p) => (
          <label key={p.slug} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${plantilla === p.slug ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
            <input type="radio" name="plantilla" checked={plantilla === p.slug} onChange={() => setPlantilla(p.slug)} className="mt-1" />
            <span>
              <span className="block font-medium">{p.nombre}</span>
              <span className="text-sm text-stone-500">{p.descripcion}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={enviando} className="w-full rounded-lg bg-stone-900 py-3 font-semibold text-white disabled:opacity-60">{enviando ? 'Creando…' : 'Crear y personalizar'}</button>
    </form>
  );
}
