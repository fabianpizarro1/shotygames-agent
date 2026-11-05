'use client';

import { useMemo, useState } from 'react';
import { api, json, type CampoConfig, type InvitadoAdmin } from './tipos';

type Filtro = 'todos' | 'pendiente' | 'confirmado' | 'no_asiste' | 'sin_enviar';

const campo = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900';
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium active:scale-[0.97] disabled:opacity-50';
const btnOscuro = 'rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white active:scale-[0.97] disabled:opacity-40';

const ETIQUETA: Record<InvitadoAdmin['estado'], [string, string]> = {
  pendiente: ['Pendiente', 'bg-amber-100 text-amber-900'],
  confirmado: ['Confirmó', 'bg-emerald-100 text-emerald-900'],
  no_asiste: ['No asiste', 'bg-rose-100 text-rose-900'],
};

function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onCerrar}>
      <div role="dialog" aria-label={titulo} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{titulo}</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="px-2 text-xl leading-none text-stone-500">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormInvitado({ inicial, onGuardar, onCerrar }: { inicial?: InvitadoAdmin; onGuardar: (d: Partial<InvitadoAdmin>) => Promise<string | void>; onCerrar: () => void }) {
  const [d, setD] = useState<Partial<InvitadoAdmin>>(inicial ?? { genero: 'F', cupos: 1, estado: 'pendiente' });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof InvitadoAdmin>(k: K, v: InvitadoAdmin[K]) => setD((x) => ({ ...x, [k]: v }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const err = await onGuardar(d);
    if (err) {
      setError(err);
      setGuardando(false);
    } else onCerrar();
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <label className="block text-sm">Nombre
        <input required autoFocus value={d.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} className={`${campo} mt-1`} />
      </label>
      <label className="block text-sm">WhatsApp
        <input inputMode="tel" placeholder="0967600303" value={d.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} className={`${campo} mt-1`} />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="block text-sm">Cupos
          <input type="number" min={1} max={20} value={d.cupos ?? 1} onChange={(e) => set('cupos', Number(e.target.value))} className={`${campo} mt-1`} />
        </label>
        <label className="block text-sm">Género
          <select value={d.genero ?? 'F'} onChange={(e) => set('genero', e.target.value as 'F' | 'M')} className={`${campo} mt-1`}>
            <option value="F">Mujer</option>
            <option value="M">Hombre</option>
          </select>
        </label>
        <label className="block text-sm">Grupo
          <input value={d.grupo ?? ''} onChange={(e) => set('grupo', e.target.value)} className={`${campo} mt-1`} />
        </label>
      </div>
      {inicial && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Estado
            <select value={d.estado} onChange={(e) => set('estado', e.target.value as InvitadoAdmin['estado'])} className={`${campo} mt-1`}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmó</option>
              <option value="no_asiste">No asiste</option>
            </select>
          </label>
          <label className="block text-sm">Asistentes
            <input type="number" min={0} max={20} value={d.asistentes ?? 0} onChange={(e) => set('asistentes', Number(e.target.value))} className={`${campo} mt-1`} />
          </label>
        </div>
      )}
      <label className="block text-sm">Notas (solo tú las ves)
        <input value={d.notas ?? ''} onChange={(e) => set('notas', e.target.value)} className={`${campo} mt-1`} />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={guardando || !d.nombre?.trim()} className={`${btnOscuro} w-full`}>{guardando ? 'Guardando…' : 'Guardar'}</button>
    </form>
  );
}

export function TabInvitados({ invitados, campos, recargar }: { invitados: InvitadoAdmin[] | null; campos: CampoConfig[] | null; recargar: () => Promise<void> }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [modal, setModal] = useState<'nuevo' | 'importar' | InvitadoAdmin | null>(null);
  const [texto, setTexto] = useState('');
  const [aviso, setAviso] = useState('');

  const conf = (k: string) => campos?.find((c) => c.clave === k)?.valor ?? '';
  const base = (conf('url_base').trim() || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  const link = (i: InvitadoAdmin) => `${base}/i/${i.token}`;

  const resumen = useMemo(() => {
    const l = invitados ?? [];
    const conf = l.filter((i) => i.estado === 'confirmado');
    return {
      invitados: l.length,
      personasInvitadas: l.reduce((s, i) => s + i.cupos, 0),
      confirmados: conf.length,
      personasConfirmadas: conf.reduce((s, i) => s + i.asistentes, 0),
      noAsisten: l.filter((i) => i.estado === 'no_asiste').length,
      pendientes: l.filter((i) => i.estado === 'pendiente').length,
      enviados: l.filter((i) => i.enviado_at).length,
      vistos: l.filter((i) => i.abierto_at).length,
    };
  }, [invitados]);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (invitados ?? []).filter((i) => {
      if (q && !`${i.nombre} ${i.grupo} ${i.telefono}`.toLowerCase().includes(q)) return false;
      if (filtro === 'sin_enviar') return !i.enviado_at;
      return filtro === 'todos' || i.estado === filtro;
    });
  }, [invitados, busqueda, filtro]);

  const nota = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(''), 2500);
  };

  async function enviarWhatsApp(i: InvitadoAdmin) {
    // Sin emojis: los que están fuera del BMP llegan como "�" cuando el mensaje pasa por wa.me.
    const mensaje = conf('wa_mensaje').replace('{nombre}', i.nombre.split(' ')[0]).replace('{link}', link(i)).replace(/[\u{10000}-\u{10FFFF}]/gu, '');
    const url = `https://wa.me/${i.telefono || ''}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener');
    await api('/api/admin/invitados', json('PATCH', { token: i.token, enviado_at: new Date().toISOString() }));
    recargar();
  }

  async function copiar(i: InvitadoAdmin) {
    try {
      await navigator.clipboard.writeText(link(i));
      nota('Link copiado');
    } catch {
      nota('No se pudo copiar');
    }
  }

  async function eliminar(i: InvitadoAdmin) {
    if (!confirm(`¿Eliminar a ${i.nombre}? Su link dejará de funcionar.`)) return;
    const r = await api('/api/admin/invitados?token=' + i.token, { method: 'DELETE' });
    if (!r.ok) alert(r.error);
    recargar();
  }

  async function guardar(d: Partial<InvitadoAdmin>, existente?: InvitadoAdmin): Promise<string | void> {
    const r = existente
      ? await api('/api/admin/invitados', json('PATCH', { ...d, token: existente.token }))
      : await api('/api/admin/invitados', json('POST', d));
    if (!r.ok) return r.error || 'No se pudo guardar';
    await recargar();
  }

  async function importar() {
    const r = await api<{ creados: number; omitidas: string[] }>('/api/admin/invitados/importar', json('POST', { texto }));
    if (!r.ok) return alert(r.error);
    nota(`${r.creados} invitados agregados`);
    setTexto('');
    setModal(null);
    recargar();
  }

  if (!invitados) return <p className="py-10 text-center text-sm text-stone-500">Cargando…</p>;

  const tarjetas: [string, string, string?][] = [
    ['Invitados', String(resumen.invitados), `${resumen.personasInvitadas} cupos`],
    ['Confirmaron', String(resumen.confirmados), `${resumen.personasConfirmadas} personas`],
    ['Pendientes', String(resumen.pendientes)],
    ['No asisten', String(resumen.noAsisten)],
    ['Enviadas', `${resumen.enviados}/${resumen.invitados}`],
    ['Vieron la invitación', `${resumen.vistos}/${resumen.invitados}`],
  ];

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resumen">
        {tarjetas.map(([t, v, sub]) => (
          <div key={t} className="rounded-xl bg-white p-3.5 ring-1 ring-stone-200">
            <p className="text-xs text-stone-500">{t}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{v}</p>
            {sub && <p className="text-xs text-stone-500">{sub}</p>}
          </div>
        ))}
      </section>

      <div className="flex gap-2">
        <button onClick={() => setModal('nuevo')} className={btnOscuro}>Agregar invitado</button>
        <button onClick={() => setModal('importar')} className={btn}>Importar lista</button>
        {aviso && <span role="status" className="self-center text-xs text-emerald-700">{aviso}</span>}
      </div>

      <div className="space-y-3">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, grupo o teléfono" className={campo} />
        <div className="flex flex-wrap gap-2 text-xs">
          {([['todos', 'Todos'], ['sin_enviar', 'Sin enviar'], ['pendiente', 'Pendientes'], ['confirmado', 'Confirmaron'], ['no_asiste', 'No asisten']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)} aria-pressed={filtro === k} className={`rounded-full px-3 py-1.5 font-medium ${filtro === k ? 'bg-stone-900 text-white' : 'bg-white ring-1 ring-stone-200'}`}>{t}</button>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {lista.map((i) => {
          const [et, clase] = ETIQUETA[i.estado];
          return (
            <li key={i.token} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{i.nombre}</p>
                  <p className="text-xs text-stone-500">
                    {[i.grupo, `${i.cupos} ${i.cupos === 1 ? 'cupo' : 'cupos'}`, i.telefono && `+${i.telefono}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5 text-[11px] font-medium">
                  <span className={`rounded-full px-2 py-0.5 ${clase}`}>{et}{i.estado === 'confirmado' ? ` (${i.asistentes})` : ''}</span>
                  {i.enviado_at && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-900">Enviada</span>}
                  {i.abierto_at && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-900">Vista</span>}
                </div>
              </div>
              {(i.restricciones || i.mensaje || i.notas) && (
                <p className="mt-2 text-xs text-stone-600">
                  {i.restricciones && <span className="mr-3">Restricciones: {i.restricciones}</span>}
                  {i.mensaje && <span className="mr-3">“{i.mensaje}”</span>}
                  {i.notas && <span className="italic">{i.notas}</span>}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => enviarWhatsApp(i)} className={btnOscuro}>{i.enviado_at ? 'Reenviar' : 'Enviar'} por WhatsApp</button>
                <button onClick={() => copiar(i)} className={btn}>Copiar link</button>
                <a href={link(i)} target="_blank" rel="noopener noreferrer" className={btn}>Ver</a>
                <button onClick={() => setModal(i)} className={btn}>Editar</button>
                <button onClick={() => eliminar(i)} className={`${btn} text-red-700`}>Eliminar</button>
              </div>
            </li>
          );
        })}
        {!lista.length && <li className="py-8 text-center text-sm text-stone-500">{invitados.length ? 'Nadie coincide con el filtro.' : 'Aún no hay invitados. Agrega el primero o importa tu lista.'}</li>}
      </ul>

      {modal === 'nuevo' && (
        <Modal titulo="Agregar invitado" onCerrar={() => setModal(null)}>
          <FormInvitado onGuardar={(d) => guardar(d)} onCerrar={() => setModal(null)} />
        </Modal>
      )}
      {modal && typeof modal === 'object' && (
        <Modal titulo="Editar invitado" onCerrar={() => setModal(null)}>
          <FormInvitado inicial={modal} onGuardar={(d) => guardar(d, modal)} onCerrar={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'importar' && (
        <Modal titulo="Importar lista" onCerrar={() => setModal(null)}>
          <p className="mb-2 text-sm text-stone-600">Una persona por línea: <b>nombre, teléfono, cupos, grupo</b>. Solo el nombre es obligatorio. Puedes pegar desde Excel o Sheets.</p>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={8} placeholder={'María Pérez, 0991234567, 2, Familia\nCarlos Mora, 0987654321'} className={campo} />
          <button onClick={importar} disabled={!texto.trim()} className={`${btnOscuro} mt-3 w-full`}>Importar</button>
        </Modal>
      )}
    </div>
  );
}
