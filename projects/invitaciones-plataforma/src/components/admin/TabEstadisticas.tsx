'use client';

import { useEffect, useState } from 'react';
import { api } from './tipos';
import type { Estadisticas } from '@/lib/eventos';

function Cifra({ valor, etiqueta, nota }: { valor: string | number; etiqueta: string; nota?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <p className="text-3xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-0.5 text-sm text-stone-600">{etiqueta}</p>
      {nota && <p className="text-xs text-stone-400">{nota}</p>}
    </div>
  );
}

export function TabEstadisticas({ invitados }: { invitados: number }) {
  const [e, setE] = useState<Estadisticas | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    api<Estadisticas>('/api/admin/estadisticas').then((r) => {
      if (!vivo) return;
      if (r.ok) setE(r as unknown as Estadisticas);
      else setError(r.error || 'No se pudieron leer las estadísticas');
    });
    return () => {
      vivo = false;
    };
  }, [invitados]);

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (!e) return <p className="py-10 text-center text-sm text-stone-500">Cargando…</p>;
  if (e.invitados === 0) return <p className="rounded-xl bg-white p-6 text-center text-stone-600 ring-1 ring-stone-200">Aquí verás quién abrió y quién confirmó cuando agregues invitados y envíes las invitaciones.</p>;

  const maximo = Math.max(1, ...e.dias.map((d) => Math.max(d.abiertos, d.confirmaciones)));
  const corto = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra valor={e.invitados} etiqueta="Invitados" nota={`${e.personasInvitadas} personas`} />
        <Cifra valor={`${e.confirmados}`} etiqueta="Confirmaron" nota={`${e.asistentes} asistentes`} />
        <Cifra valor={e.noAsisten} etiqueta="No asisten" />
        <Cifra valor={e.pendientes} etiqueta="Sin responder" />
        <Cifra valor={`${e.tasaApertura}%`} etiqueta="Abrieron" nota={`${e.abiertos} de ${e.enviados || e.invitados}`} />
        <Cifra valor={`${e.tasaConfirmacion}%`} etiqueta="Tasa de confirmación" />
        <Cifra valor={e.enviados} etiqueta="Enviadas" />
      </div>

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h3 className="mb-3 font-semibold">Últimos 14 días</h3>
        <div className="flex h-32 items-end gap-1" role="img" aria-label="Aperturas y confirmaciones por día">
          {e.dias.map((d) => (
            <div key={d.dia} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end gap-px">
                <div className="w-1/2 rounded-t bg-stone-300" style={{ height: `${(d.abiertos / maximo) * 100}%`, minHeight: d.abiertos ? 3 : 0 }} title={`${d.abiertos} aperturas`} />
                <div className="w-1/2 rounded-t bg-stone-900" style={{ height: `${(d.confirmaciones / maximo) * 100}%`, minHeight: d.confirmaciones ? 3 : 0 }} title={`${d.confirmaciones} respuestas`} />
              </div>
              <span className="text-[10px] text-stone-400">{corto(d.dia)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 flex gap-4 text-xs text-stone-500">
          <span><i className="mr-1 inline-block size-2 rounded-sm bg-stone-300" />Aperturas</span>
          <span><i className="mr-1 inline-block size-2 rounded-sm bg-stone-900" />Respuestas</span>
        </p>
      </section>

      {e.sinAbrir.length > 0 && (
        <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <h3 className="font-semibold">Enviadas y sin abrir ({e.sinAbrir.length})</h3>
          <p className="mb-2 text-sm text-stone-500">Buenas candidatas para un recordatorio por WhatsApp.</p>
          <ul className="divide-y divide-stone-100 text-sm">
            {e.sinAbrir.map((i) => (
              <li key={i.token} className="py-1.5">{i.nombre}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
