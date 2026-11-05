'use client';

import { useEffect, useMemo, useState } from 'react';
import { Subidor } from './Subidor';
import { api, json, type CampoConfig, type InvitadoAdmin } from './tipos';

type Tipo = 'sino' | 'texto' | 'largo' | 'fechahora' | 'fecha' | 'color' | 'imagen' | 'galeria' | 'audio';

const GRUPOS: { titulo: string; campos: [string, string, Tipo][] }[] = [
  { titulo: 'Evento', campos: [['festejado', 'Quién cumple', 'texto'], ['nombre_evento', 'Título grande', 'texto'], ['titulo', 'Frase de arriba ({invitada} se ajusta al invitado)', 'texto'], ['mensaje', 'Mensaje de bienvenida', 'largo']] },
  { titulo: 'Fecha y lugar', campos: [['fecha_hora', 'Fecha y hora', 'fechahora'], ['hora_fin_texto', 'Hora de fin (texto, opcional)', 'texto'], ['lugar_nombre', 'Nombre del lugar', 'texto'], ['lugar_direccion', 'Dirección o ciudad', 'texto'], ['maps_url', 'Link de Google Maps', 'texto'], ['waze_url', 'Link de Waze (opcional)', 'texto']] },
  { titulo: 'Dress code', campos: [['dresscode_titulo', 'Dress code', 'texto'], ['dresscode_detalle', 'Detalle', 'largo']] },
  { titulo: 'Programa y regalos', campos: [['itinerario', 'Programa — una línea por actividad: hora|texto (vacío = se oculta)', 'largo'], ['regalos_texto', 'Nota sobre regalos', 'largo'], ['fecha_limite_rsvp', 'Fecha límite para confirmar (opcional)', 'fecha']] },
  { titulo: 'Fotos y stickers', campos: [['portada_url', 'Foto principal (sale en la tarjeta)', 'imagen'], ['galeria_titulo', 'Título de la galería', 'texto'], ['galeria_fotos', 'Galería de fotos (polaroids)', 'galeria'], ['sticker_copa_url', 'Sticker de la copa (PNG)', 'imagen'], ['sticker_pastel_url', 'Sticker del pastel (PNG)', 'imagen']] },
  { titulo: 'Fotos de la fiesta (QR)', campos: [['fotos_activas', 'Fotos habilitadas', 'sino'], ['fotos_titulo', 'Título de la página de fotos', 'texto'], ['fotos_mensaje', 'Texto de la página de fotos', 'largo'], ['fotos_subida_desde', 'Se pueden subir fotos desde', 'fechahora'], ['fotos_subida_hasta', 'Se cierra la subida', 'fechahora'], ['fotos_galeria_desde', 'La galería se ve desde', 'fechahora'], ['fotos_max_por_persona', 'Máximo de fotos por persona', 'texto']] },
  { titulo: 'Música', campos: [['musica_url', 'Canción de la invitación', 'audio'], ['musica_titulo', 'Nombre que se muestra', 'texto']] },
  { titulo: 'Colores', campos: [['color_fondo', 'Rayas (tono 1)', 'color'], ['color_fondo_2', 'Rayas (tono 2)', 'color'], ['color_papel', 'Tarjeta', 'color'], ['color_texto', 'Texto', 'color'], ['color_acento', 'Rosa del sobre y detalles', 'color']] },
  { titulo: 'Envío por WhatsApp', campos: [['contacto_whatsapp', 'WhatsApp de contacto (593…)', 'texto'], ['wa_mensaje', 'Mensaje ({nombre} y {link} se reemplazan; sin emojis)', 'largo'], ['url_base', 'Dominio público de la invitación (vacío = el actual)', 'texto']] },
];

const campoCls = 'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900';

const aInput = (tipo: Tipo, v: string) => (tipo === 'fechahora' ? v.slice(0, 16) : tipo === 'fecha' ? v.slice(0, 10) : v);
const aGuardar = (tipo: Tipo, v: string) => (tipo === 'fechahora' && v ? `${v}:00-05:00` : tipo === 'fecha' && v ? `${v}T23:59:00-05:00` : v);

export function TabContenido({ campos, invitados, recargar }: { campos: CampoConfig[] | null; invitados: InvitadoAdmin[] | null; recargar: () => Promise<void> }) {
  const original = useMemo(() => Object.fromEntries((campos ?? []).map((c) => [c.clave, c.valor])), [campos]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => setValores(original), [original]);

  if (!campos) return <p className="py-10 text-center text-sm text-stone-500">Cargando…</p>;

  const cambios = Object.keys(valores).filter((k) => valores[k] !== original[k]);
  const set = (k: string, v: string) => setValores((x) => ({ ...x, [k]: v }));
  const primero = invitados?.[0];

  async function guardar() {
    setGuardando(true);
    const r = await api('/api/admin/config', json('PUT', Object.fromEntries(cambios.map((k) => [k, valores[k]]))));
    setGuardando(false);
    if (!r.ok) return setAviso(r.error || 'No se pudo guardar');
    await recargar();
    setAviso('Guardado. La invitación ya muestra los cambios.');
    setTimeout(() => setAviso(''), 4000);
  }

  return (
    <div className="space-y-5">
      {primero && (
        <a href={`/i/${primero.token}`} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-white p-3.5 text-sm ring-1 ring-stone-200">
          Ver la invitación como <b>{primero.nombre}</b> →
        </a>
      )}

      {GRUPOS.map((g) => (
        <section key={g.titulo} className="space-y-4 rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <h2 className="font-semibold">{g.titulo}</h2>
          {g.campos.map(([clave, etiqueta, tipo]) => {
            const v = valores[clave] ?? '';
            const sucio = valores[clave] !== original[clave];
            return (
              <div key={clave} className="text-sm">
                <label htmlFor={clave} className="block font-medium">
                  {etiqueta}
                  {sucio && <span className="ml-2 text-xs font-normal text-amber-700">sin guardar</span>}
                </label>
                {tipo === 'imagen' || tipo === 'galeria' ? (
                  <div className="mt-2"><Subidor tipo="imagen" multiple={tipo === 'galeria'} valor={v} onChange={(x) => set(clave, x)} maxLado={clave.startsWith('sticker') ? 1000 : 1600} /></div>
                ) : tipo === 'audio' ? (
                  <div className="mt-2"><Subidor tipo="audio" valor={v} onChange={(x) => set(clave, x)} /></div>
                ) : tipo === 'sino' ? (
                  <label className="mt-1 flex items-center gap-3">
                    <input id={clave} type="checkbox" checked={v.trim().toLowerCase() !== 'no'} onChange={(e) => set(clave, e.target.checked ? 'si' : 'no')} className="size-5" />
                    <span>{v.trim().toLowerCase() !== 'no' ? 'Sí' : 'No'}</span>
                  </label>
                ) : tipo === 'largo' ? (
                  <textarea id={clave} rows={3} value={v} onChange={(e) => set(clave, e.target.value)} className={campoCls} />
                ) : tipo === 'color' ? (
                  <div className="mt-1 flex items-center gap-3">
                    <input id={clave} type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#000000'} onChange={(e) => set(clave, e.target.value)} className="h-10 w-14 rounded-lg border border-stone-300 bg-white p-1" />
                    <code className="text-xs text-stone-500">{v}</code>
                  </div>
                ) : (
                  <input
                    id={clave}
                    type={tipo === 'fechahora' ? 'datetime-local' : tipo === 'fecha' ? 'date' : 'text'}
                    value={aInput(tipo, v)}
                    onChange={(e) => set(clave, aGuardar(tipo, e.target.value))}
                    className={campoCls}
                  />
                )}
              </div>
            );
          })}
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p role="status" className="text-xs text-stone-600">{aviso || (cambios.length ? `${cambios.length} cambio${cambios.length > 1 ? 's' : ''} sin guardar` : 'Todo guardado')}</p>
          <button onClick={guardar} disabled={!cambios.length || guardando} className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white active:scale-[0.97] disabled:opacity-40">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
