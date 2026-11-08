'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, json, type CampoConfig } from './tipos';

type Estado = 'pendiente' | 'aprobada' | 'rechazada' | 'en_spotify';
interface CancionAdmin {
  id: string;
  titulo: string;
  artista: string;
  pedidaPor: string;
  estado: Estado;
  portada: string;
  isrc: string;
}
type Filtro = 'revisar' | 'aprobada' | 'en_spotify' | 'rechazada' | 'todas';

const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium active:scale-[0.97] disabled:opacity-50';
const ETIQ: Record<Estado, [string, string]> = {
  pendiente: ['Por revisar', 'bg-amber-100 text-amber-900'],
  aprobada: ['Aprobada', 'bg-emerald-100 text-emerald-900'],
  en_spotify: ['En Spotify', 'bg-sky-100 text-sky-900'],
  rechazada: ['Rechazada', 'bg-rose-100 text-rose-900'],
};

export function TabPlaylist({ campos }: { campos: CampoConfig[] | null }) {
  const [canciones, setCanciones] = useState<CancionAdmin[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('revisar');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    const r = await api<{ canciones: CancionAdmin[] }>('/api/admin/canciones');
    if (!r.ok) return setError(r.error || 'No se pudo leer la lista');
    setError('');
    setCanciones(r.canciones);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const conf = (k: string) => campos?.find((c) => c.clave === k)?.valor ?? '';
  const nota = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(''), 2500);
  };

  const cuenta = useMemo(() => {
    const l = canciones ?? [];
    const n = (e: Estado) => l.filter((x) => x.estado === e).length;
    return { total: l.length, revisar: n('pendiente'), aprobada: n('aprobada'), en_spotify: n('en_spotify'), rechazada: n('rechazada') };
  }, [canciones]);

  const lista = useMemo(() => {
    const l = canciones ?? [];
    if (filtro === 'todas') return l;
    return l.filter((x) => x.estado === (filtro === 'revisar' ? 'pendiente' : filtro));
  }, [canciones, filtro]);

  async function marcar(c: CancionAdmin, estado: Estado) {
    setCanciones((l) => l && l.map((x) => (x.id === c.id ? { ...x, estado } : x)));
    const r = await api('/api/admin/canciones', json('PATCH', { id: c.id, estado }));
    if (!r.ok) {
      setError(r.error || 'No se pudo cambiar');
      cargar();
    }
  }

  async function quitar(c: CancionAdmin) {
    if (!confirm(`¿Quitar "${c.titulo}" de la lista?`)) return;
    const r = await api('/api/admin/canciones?id=' + c.id, { method: 'DELETE' });
    if (!r.ok) setError(r.error || 'No se pudo quitar');
    cargar();
  }

  async function copiar() {
    const texto = (canciones ?? []).filter((x) => x.estado !== 'rechazada').map((x) => `${x.titulo} - ${x.artista}`).join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      nota('Lista copiada');
    } catch {
      nota('No se pudo copiar');
    }
  }

  if (!canciones) return <p className="py-10 text-center text-sm text-stone-500">{error || 'Cargando…'}</p>;

  const spotifyBuscar = (c: CancionAdmin) => `https://open.spotify.com/search/${encodeURIComponent(`${c.titulo} ${c.artista}`)}`;

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="font-semibold">Cómo funciona</h2>
        <p className="mt-2 text-sm text-stone-600">
          Cada invitado busca y pide canciones desde su invitación (límite y fecha de cierre en Contenido → Playlist). Aquí las revisas y las pasas a tu playlist de Spotify:
          el botón “Buscar en Spotify” abre cada canción lista para agregar.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={copiar} className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white active:scale-[0.97]">Copiar lista ({cuenta.total - cuenta.rechazada})</button>
          {conf('playlist_url') && <a href={conf('playlist_url')} target="_blank" rel="noopener noreferrer" className={btn + ' py-2.5 text-sm'}>Abrir mi playlist</a>}
          {aviso && <span role="status" className="self-center text-xs text-emerald-700">{aviso}</span>}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {([['Pedidas', cuenta.total - cuenta.rechazada], ['Por revisar', cuenta.revisar], ['En Spotify', cuenta.en_spotify]] as const).map(([t, v]) => (
          <div key={t} className="rounded-xl bg-white p-3.5 ring-1 ring-stone-200">
            <p className="text-xs text-stone-500">{t}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {([['revisar', `Por revisar (${cuenta.revisar})`], ['aprobada', `Aprobadas (${cuenta.aprobada})`], ['en_spotify', `En Spotify (${cuenta.en_spotify})`], ['rechazada', `Rechazadas (${cuenta.rechazada})`], ['todas', 'Todas']] as const).map(([k, t]) => (
          <button key={k} onClick={() => setFiltro(k)} aria-pressed={filtro === k} className={`rounded-full px-3 py-1.5 font-medium ${filtro === k ? 'bg-stone-900 text-white' : 'bg-white ring-1 ring-stone-200'}`}>{t}</button>
        ))}
      </div>

      <ul className="space-y-3">
        {lista.map((c) => {
          const [et, clase] = ETIQ[c.estado];
          return (
            <li key={c.id} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.portada ? <img src={c.portada} alt="" width={48} height={48} loading="lazy" className="size-12 shrink-0 rounded" /> : <span className="size-12 shrink-0 rounded bg-stone-200" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.titulo}</p>
                  <p className="truncate text-xs text-stone-500">{c.artista} · pedida por {c.pedidaPor}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${clase}`}>{et}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={spotifyBuscar(c)} target="_blank" rel="noopener noreferrer" className={btn}>Buscar en Spotify</a>
                {c.estado !== 'en_spotify' && <button onClick={() => marcar(c, 'en_spotify')} className={btn}>Ya la agregué</button>}
                {c.estado === 'pendiente' && <button onClick={() => marcar(c, 'aprobada')} className={btn}>Aprobar</button>}
                {c.estado !== 'rechazada' ? <button onClick={() => marcar(c, 'rechazada')} className={btn + ' text-red-700'}>Rechazar</button> : <button onClick={() => marcar(c, 'pendiente')} className={btn}>Restaurar</button>}
                <button onClick={() => quitar(c)} className={btn + ' text-red-700'}>Eliminar</button>
              </div>
            </li>
          );
        })}
        {!lista.length && <li className="py-8 text-center text-sm text-stone-500">{cuenta.total ? 'No hay canciones en este filtro.' : 'Todavía nadie pidió canciones.'}</li>}
      </ul>
    </div>
  );
}
