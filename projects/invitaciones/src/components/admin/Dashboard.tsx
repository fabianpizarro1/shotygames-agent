'use client';

import { useCallback, useEffect, useState } from 'react';
import { TabContenido } from './TabContenido';
import { TabFotos } from './TabFotos';
import { TabInvitados } from './TabInvitados';
import { api, type CampoConfig, type InvitadoAdmin } from './tipos';

export function Dashboard() {
  const [tab, setTab] = useState<'invitados' | 'fotos' | 'contenido'>('invitados');
  const [invitados, setInvitados] = useState<InvitadoAdmin[] | null>(null);
  const [campos, setCampos] = useState<CampoConfig[] | null>(null);
  const [error, setError] = useState('');

  const cargarInvitados = useCallback(async () => {
    const r = await api<{ invitados: InvitadoAdmin[] }>('/api/admin/invitados');
    if (r.ok) setInvitados(r.invitados);
    else setError(r.error || 'No se pudo leer la lista');
  }, []);

  const cargarConfig = useCallback(async () => {
    const r = await api<{ campos: CampoConfig[] }>('/api/admin/config');
    if (r.ok) setCampos(r.campos);
    else setError(r.error || 'No se pudo leer la configuración');
  }, []);

  useEffect(() => {
    cargarInvitados();
    cargarConfig();
  }, [cargarInvitados, cargarConfig]);

  const salir = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <nav className="flex gap-1 rounded-xl bg-stone-100 p-1 text-sm font-medium" aria-label="Secciones">
            {([['invitados', 'Invitados'], ['fotos', 'Fotos'], ['contenido', 'Contenido']] as const).map(([k, t]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                aria-current={tab === k}
                className={`rounded-lg px-4 py-1.5 transition-colors ${tab === k ? 'bg-white shadow-sm' : 'text-stone-500'}`}
              >
                {t}
              </button>
            ))}
          </nav>
          <button onClick={salir} className="text-xs text-stone-500 underline underline-offset-4">Salir</button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-5">
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {tab === 'invitados' ? (
          <TabInvitados invitados={invitados} campos={campos} recargar={cargarInvitados} />
        ) : tab === 'fotos' ? (
          <TabFotos campos={campos} />
        ) : (
          <TabContenido campos={campos} invitados={invitados} recargar={cargarConfig} />
        )}
      </main>
    </div>
  );
}
