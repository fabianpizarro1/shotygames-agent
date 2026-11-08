'use client';

import { useState } from 'react';
import { api, json } from './tipos';

interface Estado {
  estado: string;
  plan: string;
  expira_at: string;
}

const fecha = (iso: string) => (iso ? new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : '');

export function TabPublicar({ slug, inicial, recargar }: { slug: string; inicial: Estado; recargar: () => Promise<void> }) {
  const [e, setE] = useState<Estado>(inicial);
  const [plan, setPlan] = useState(inicial.plan || 'basico');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const publicado = e.estado === 'publicado';
  const enlace = typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : `/e/${slug}`;

  async function accion(a: 'publicar' | 'despublicar') {
    setOcupado(true);
    setAviso('');
    const r = await api<Estado>('/api/admin/publicar', json('POST', { accion: a, plan }));
    setOcupado(false);
    if (r.ok) {
      setE({ estado: r.estado, plan: r.plan, expira_at: r.expira_at });
      await recargar();
    } else setAviso(r.error || 'No se pudo');
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Estado de la invitación</h2>
            <p className="text-sm text-stone-500">
              {publicado ? `Publicada${e.expira_at ? ` · visible hasta el ${fecha(e.expira_at)}` : ''}` : 'Borrador: solo tú la ves. Los invitados no pueden abrirla todavía.'}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${publicado ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{publicado ? 'Publicada' : 'Borrador'}</span>
        </div>

        {!publicado && (
          <fieldset className="mt-4 space-y-2">
            <legend className="mb-1 text-sm font-medium">Plan</legend>
            {[['basico', 'Básico', 'Enlace, confirmaciones y estadísticas.'], ['completo', 'Completo', 'Todo lo del básico + fotos por QR y playlist (próximamente).']].map(([v, n, d]) => (
              <label key={v} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${plan === v ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
                <input type="radio" name="plan" checked={plan === v} onChange={() => setPlan(v)} className="mt-1" />
                <span><span className="block font-medium">{n}</span><span className="text-sm text-stone-500">{d}</span></span>
              </label>
            ))}
            <p className="text-xs text-stone-500">El cobro todavía no está conectado: por ahora publicar es gratis.</p>
          </fieldset>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {publicado ? (
            <button disabled={ocupado} onClick={() => accion('despublicar')} className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-medium disabled:opacity-60">Volver a borrador</button>
          ) : (
            <button disabled={ocupado} onClick={() => accion('publicar')} className="rounded-lg bg-stone-900 px-5 py-2.5 font-semibold text-white disabled:opacity-60">{ocupado ? 'Publicando…' : 'Publicar invitación'}</button>
          )}
        </div>
        {aviso && <p role="alert" className="mt-3 text-sm text-red-700">{aviso}</p>}
      </section>

      {publicado && (
        <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="font-semibold">Enlace general</h2>
          <p className="mb-2 text-sm text-stone-500">Para ver la invitación. La confirmación se hace con el enlace personal de cada invitado (pestaña Invitados).</p>
          <div className="flex gap-2">
            <input readOnly value={enlace} className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm" onFocus={(ev) => ev.currentTarget.select()} />
            <button onClick={() => navigator.clipboard?.writeText(enlace)} className="shrink-0 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white">Copiar</button>
          </div>
        </section>
      )}
    </div>
  );
}
