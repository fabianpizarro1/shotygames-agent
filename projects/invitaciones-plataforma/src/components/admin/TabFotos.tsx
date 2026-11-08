'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, json, type CampoConfig } from './tipos';

interface FotoAdmin {
  id: string;
  creada: string;
  autor: string;
  visible: boolean;
  url: string;
  mini: string;
}

const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium active:scale-[0.97] disabled:opacity-50';
const fmt = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' });

export function TabFotos({ campos, eventoId, slug }: { campos: CampoConfig[] | null; eventoId: string; slug: string }) {
  const [fotos, setFotos] = useState<FotoAdmin[] | null>(null);
  const [error, setError] = useState('');
  const [verOcultas, setVerOcultas] = useState(true);

  const cargar = useCallback(async () => {
    const r = await api<{ fotos: FotoAdmin[] }>('/api/admin/fotos');
    if (!r.ok) return setError(r.error || 'No se pudieron leer las fotos');
    setFotos(r.fotos);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const conf = (k: string) => campos?.find((c) => c.clave === k)?.valor ?? '';
  const f = (iso: string) => (iso && !Number.isNaN(new Date(iso).getTime()) ? fmt.format(new Date(iso)) : '—');

  async function alternar(x: FotoAdmin) {
    setFotos((l) => l && l.map((y) => (y.id === x.id ? { ...y, visible: !y.visible } : y)));
    const r = await api('/api/admin/fotos', json('PATCH', { id: x.id, visible: !x.visible }));
    if (!r.ok) {
      setError(r.error || 'No se pudo cambiar');
      cargar();
    }
  }

  async function eliminar(x: FotoAdmin) {
    if (!confirm('¿Eliminar esta foto? Se borra y sale de la galería.')) return;
    const r = await api('/api/admin/fotos?id=' + x.id, { method: 'DELETE' });
    if (!r.ok) setError(r.error || 'No se pudo eliminar');
    cargar();
  }

  if (!fotos) return <p className="py-10 text-center text-sm text-stone-500">{error || 'Cargando…'}</p>;

  const ocultas = fotos.filter((x) => !x.visible).length;
  const lista = verOcultas ? fotos : fotos.filter((x) => x.visible);
  const autores = new Set(fotos.map((x) => x.autor.trim().toLowerCase()).filter(Boolean)).size;

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="font-semibold">Cómo funciona</h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-stone-500">Se pueden subir desde</dt><dd>{f(conf('fotos_subida_desde'))}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-stone-500">Se cierra la subida</dt><dd>{f(conf('fotos_subida_hasta'))}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-stone-500">Galería visible desde</dt><dd>{f(conf('fotos_galeria_desde'))}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-stone-500">Estado</dt><dd>{conf('fotos_activas') === 'no' ? 'Apagadas' : 'Activas'}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-stone-500">Las fechas y el máximo por persona se cambian en la pestaña Contenido, sección “Fotos de la fiesta”.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`/app/${eventoId}/qr`} className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white">QR para imprimir</a>
          <a href={`/fotos?e=${slug}`} target="_blank" rel="noopener noreferrer" className={btn}>Ver página de fotos</a>
        </div>
        <p className="mt-2 text-xs text-stone-500">La página de fotos solo funciona cuando la invitación está publicada. Cada foto se descarga desde la galería.</p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {[['Fotos', fotos.length], ['Personas', autores], ['Ocultas', ocultas]].map(([t, v]) => (
          <div key={t} className="rounded-xl bg-white p-3.5 ring-1 ring-stone-200">
            <p className="text-xs text-stone-500">{t}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      {ocultas > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verOcultas} onChange={(e) => setVerOcultas(e.target.checked)} /> Mostrar también las ocultas
        </label>
      )}

      {lista.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">Todavía no hay fotos. Aparecerán aquí cuando los invitados las suban.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lista.map((x) => (
            <li key={x.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
              <a href={x.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.mini} alt="" loading="lazy" className="size-full object-cover" style={{ opacity: x.visible ? 1 : 0.3 }} />
                {!x.visible && <span className="absolute left-2 top-2 rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-medium text-white">Oculta</span>}
              </a>
              <div className="p-2.5 text-xs">
                <p className="truncate font-medium">{x.autor || 'Sin nombre'}</p>
                <p className="text-stone-500">{f(x.creada)}</p>
                <div className="mt-2 flex gap-3">
                  <button onClick={() => alternar(x)} className="underline underline-offset-2">{x.visible ? 'Ocultar' : 'Mostrar'}</button>
                  <button onClick={() => eliminar(x)} className="text-red-700 underline underline-offset-2">Eliminar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
