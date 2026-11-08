'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { TabContenido } from './TabContenido';
import { TabEstadisticas } from './TabEstadisticas';
import { TabFotos } from './TabFotos';
import { TabPlaylist } from './TabPlaylist';
import { TabInvitados } from './TabInvitados';
import { TabPublicar } from './TabPublicar';
import { api, usarEvento, type CampoConfig, type InvitadoAdmin } from './tipos';

type Tab = 'invitados' | 'contenido' | 'fotos' | 'playlist' | 'estadisticas' | 'publicar';
interface Meta {
  slug: string;
  estado: string;
  plan: string;
  expira_at: string;
  plantilla: string;
}

export function Dashboard({ eventoId, nombre }: { eventoId: string; nombre: string }) {
  usarEvento(eventoId); // antes de que cualquier pestaña haga su primera llamada
  const [tab, setTab] = useState<Tab>('contenido');
  const [invitados, setInvitados] = useState<InvitadoAdmin[] | null>(null);
  const [campos, setCampos] = useState<CampoConfig[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState('');

  const cargarInvitados = useCallback(async () => {
    const r = await api<{ invitados: InvitadoAdmin[] }>('/api/admin/invitados');
    if (r.ok) setInvitados(r.invitados);
    else setError(r.error || 'No se pudo leer la lista');
  }, []);

  const cargarConfig = useCallback(async () => {
    const r = await api<{ campos: CampoConfig[] } & Meta>('/api/admin/config');
    if (r.ok) {
      setCampos(r.campos);
      setMeta({ slug: r.slug, estado: r.estado, plan: r.plan, expira_at: r.expira_at, plantilla: r.plantilla });
    } else setError(r.error || 'No se pudo leer la configuración');
  }, []);

  useEffect(() => {
    cargarInvitados();
    cargarConfig();
  }, [cargarInvitados, cargarConfig]);

  const salir = async () => {
    await fetch('/api/auth/salir', { method: 'POST' });
    window.location.href = '/login';
  };

  const ancho = tab === 'contenido' ? 'max-w-6xl' : 'max-w-3xl';
  const pestanas: [Tab, string][] = [['contenido', 'Contenido'], ['invitados', 'Invitados'], ['fotos', 'Fotos'], ['playlist', 'Playlist'], ['estadisticas', 'Estadísticas'], ['publicar', 'Publicar']];

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 ${ancho}`}>
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/app" aria-label="Mis eventos" className="shrink-0 text-lg leading-none text-stone-500">←</Link>
            <span className="truncate text-sm font-semibold">{nombre}</span>
            {meta && <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${meta.estado === 'publicado' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{meta.estado === 'publicado' ? 'Publicada' : 'Borrador'}</span>}
          </div>
          <button onClick={salir} className="shrink-0 text-xs text-stone-500 underline underline-offset-4">Salir</button>
        </div>
        <div className={`mx-auto px-3 pb-2 sm:px-4 ${ancho}`}>
          <nav className="flex min-w-0 gap-0.5 overflow-x-auto rounded-xl bg-stone-100 p-1 text-[13px] font-medium sm:gap-1 sm:text-sm" aria-label="Secciones">
            {pestanas.map(([k, t]) => (
              <button key={k} onClick={() => setTab(k)} aria-current={tab === k} className={`rounded-lg px-2.5 py-1.5 transition-colors sm:px-4 ${tab === k ? 'bg-white shadow-sm' : 'text-stone-500'}`}>
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={`mx-auto px-4 pb-32 pt-5 ${ancho}`}>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {!meta ? (
          <p className="py-10 text-center text-sm text-stone-500">Cargando…</p>
        ) : tab === 'invitados' ? (
          <TabInvitados invitados={invitados} campos={campos} recargar={cargarInvitados} />
        ) : tab === 'fotos' ? (
          <TabFotos campos={campos} eventoId={eventoId} slug={meta.slug} />
        ) : tab === 'playlist' ? (
          <TabPlaylist campos={campos} />
        ) : tab === 'estadisticas' ? (
          <TabEstadisticas invitados={invitados?.length ?? 0} />
        ) : tab === 'publicar' ? (
          <TabPublicar slug={meta.slug} inicial={{ estado: meta.estado, plan: meta.plan, expira_at: meta.expira_at }} recargar={cargarConfig} />
        ) : (
          <TabContenido campos={campos} invitados={invitados} recargar={cargarConfig} slug={meta.slug} plantilla={meta.plantilla} />
        )}
      </main>
    </div>
  );
}
