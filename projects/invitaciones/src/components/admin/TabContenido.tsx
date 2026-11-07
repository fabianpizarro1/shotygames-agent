'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Subidor } from './Subidor';
import { api, json, type CampoConfig, type InvitadoAdmin } from './tipos';

type Tipo = 'sino' | 'texto' | 'largo' | 'fechahora' | 'fecha' | 'color' | 'imagen' | 'galeria' | 'audio' | 'paleta' | 'programa' | 'colortexto' | 'colornumero' | 'colorfirma' | 'corona';
type Campo = [clave: string, etiqueta: string, tipo: Tipo, ayuda?: string];
interface Seccion {
  id: string;
  titulo: string;
  desc: string;
  cap: string | null; // capítulo de la invitación que se muestra en la vista previa
  campos: Campo[];
}

// Las secciones siguen el orden en que el invitado ve la invitación.
const SECCIONES: Seccion[] = [
  {
    id: 'inicio', titulo: 'Portada y saludo', desc: 'Lo primero que se ve al abrir el sobre', cap: 'inicio',
    campos: [
      ['texto_color_inicio', 'Color de los textos', 'colortexto', 'Solo cambia este capítulo. «General» usa el color de la sección Colores.'],
      ['festejado', 'Nombre de la cumpleañera', 'texto', 'Sale como firma sobre el número 30.'],
      ['intro_linea', 'Línea pequeña de arriba', 'texto'],
      ['intro_titulo', 'Título grande', 'texto', 'Ej: Mi Cumple'],
      ['rip_numero', 'Número del globo', 'texto', 'Ej: 20s'],
      ['sobre_texto', 'Texto que sale del sobre', 'texto', 'Es la tarjeta que sube al abrir el sobre. {festejado} se cambia por el nombre de la cumpleañera.'],
      ['numero_color_inicio', 'Color del número', 'colornumero', 'El número grande se ve metalizado en el color que elijas.'],
      ['rip_texto', 'Frase de invitación', 'largo', 'Escribe {invitada} y se cambia solo a «invitada» o «invitado» según la persona.'],
      ['cinta_texto', 'Cinta que se desplaza', 'texto', 'Déjala vacía para quitarla.'],
    ],
  },
  {
    id: 'bienvenida', titulo: 'Bienvenida a los 30', desc: 'El número grande con tu nombre', cap: 'bienvenida',
    campos: [
      ['texto_color_bienvenida', 'Color de los textos', 'colortexto', 'Solo cambia este capítulo. «General» usa el color de la sección Colores.'],
      ['bienvenida_linea', 'Línea de arriba', 'texto'],
      ['bienvenida_palabra', 'Palabra grande', 'texto'],
      ['bienvenida_numero', 'Número del globo', 'texto'],
      ['corona_color', 'Color de la corona', 'corona'],
      ['firma_color', 'Color del nombre sobre el 30', 'colorfirma', 'El borde se ajusta solo para que siempre se lea.'],
      ['numero_color_bienvenida', 'Color del número', 'colornumero', 'El número grande se ve metalizado en el color que elijas.'],
    ],
  },
  {
    id: 'brindis', titulo: 'Brindis y tu foto', desc: 'La foto en polaroid con confeti', cap: 'brindis',
    campos: [
      ['texto_color_brindis', 'Color de los textos', 'colortexto', 'Solo cambia este capítulo. «General» usa el color de la sección Colores.'],
      ['portada_url', 'Tu foto', 'imagen', 'Se ve mejor una foto vertical.'],
      ['foto_bn', 'Foto en blanco y negro', 'sino'],
      ['brindis_titulo', 'Título', 'texto'],
      ['brindis_texto', 'Texto bajo la foto', 'largo'],
    ],
  },
  {
    id: 'fecha', titulo: 'Fecha y lugar', desc: 'Día, hora, mapa y cuenta regresiva', cap: 'fecha',
    campos: [
      ['texto_color_fecha', 'Color de los textos', 'colortexto', 'Solo cambia este capítulo. «General» usa el color de la sección Colores.'],
      ['fecha_linea', 'Frase sobre la fecha', 'texto'],
      ['fecha_hora', 'Fecha y hora de inicio', 'fechahora'],
      ['hora_fin_texto', 'Hora de fin (opcional)', 'texto', 'Ej: hasta las 21:00'],
      ['lugar_nombre', 'Nombre del lugar', 'texto'],
      ['lugar_direccion', 'Dirección o ciudad', 'texto'],
      ['lugar_foto_url', 'Foto del lugar', 'imagen', 'Al tocarla se abre el mapa.'],
      ['maps_url', 'Link de Google Maps', 'texto', 'En Google Maps: Compartir → Copiar enlace.'],
      ['waze_url', 'Link de Waze (opcional)', 'texto'],
    ],
  },
  {
    id: 'vestimenta', titulo: 'Código de vestimenta', desc: 'Cómo deben ir vestidos', cap: 'vestimenta',
    campos: [
      ['texto_color_vestimenta', 'Color de los textos', 'colortexto', 'Solo cambia este capítulo. «General» usa el color de la sección Colores.'],
      ['vestimenta_titulo', 'Título', 'texto'],
      ['dresscode_titulo', 'Colores o estilo', 'texto', 'Ej: Rosa bebé – rosa claro'],
      ['dresscode_detalle', 'Detalle (va entre paréntesis)', 'largo'],
      ['dresscode_colores', 'Círculos de color', 'paleta', 'También tiñen el fondo de esta parte.'],
    ],
  },
  {
    id: 'programa', titulo: 'Programa y galería', desc: 'Se ocultan solas si están vacías', cap: 'programa',
    campos: [
      ['texto_color_programa', 'Color de los textos', 'colortexto', 'Solo cambia este capítulo. «General» usa el color de la sección Colores.'],
      ['itinerario', 'Programa del día', 'programa'],
      ['galeria_titulo', 'Título de la galería', 'texto'],
      ['galeria_fotos', 'Galería de fotos', 'galeria'],
    ],
  },
  {
    id: 'final', titulo: 'Obsequio y confirmación', desc: 'El sobre del regalo y el botón de confirmar', cap: 'final',
    campos: [
      ['texto_color_final', 'Color de los textos', 'colortexto', 'Solo cambia este capítulo. «General» usa el color de la sección Colores.'],
      ['regalos_texto', 'Texto del obsequio', 'largo', 'Sale con el dibujo del sobre. Déjalo vacío para quitar el sobre.'],
      ['invita_titulo', 'Título sobre el obsequio (opcional)', 'texto'],
      ['mensaje', 'Texto pequeño (opcional)', 'largo'],
      ['final_titulo', 'Título final', 'texto'],
      ['final_texto', 'Texto sobre la confirmación', 'texto'],
      ['fecha_limite_rsvp', 'Fecha límite para confirmar (opcional)', 'fecha'],
    ],
  },
  {
    id: 'musica', titulo: 'Música', desc: 'La canción del botón «Escuchar música»', cap: 'inicio',
    campos: [
      ['musica_url', 'Canción', 'audio', 'Suena solo cuando el invitado toca el botón.'],
      ['musica_titulo', 'Nombre que se muestra', 'texto'],
    ],
  },
  {
    id: 'colores', titulo: 'Colores', desc: 'La paleta de toda la invitación', cap: 'inicio',
    campos: [
      ['color_fondo', 'Papel de fondo', 'color'],
      ['color_papel', 'Tarjetas', 'color'],
      ['color_texto', 'Color general de los textos', 'colortexto', 'Es el de toda la invitación; cada capítulo puede tener el suyo.'],
      ['color_acento', 'Plata (sobre y detalles)', 'color'],
      ['color_fondo_2', 'Negro de los adornos', 'color'],
    ],
  },
  {
    id: 'fotos', titulo: 'Fotos de la fiesta (QR)', desc: 'Cuándo se pueden subir y ver las fotos', cap: null,
    campos: [
      ['fotos_activas', 'Fotos habilitadas', 'sino'],
      ['fotos_titulo', 'Título de la página', 'texto'],
      ['fotos_mensaje', 'Texto de la página', 'largo'],
      ['fotos_subida_desde', 'Se pueden subir desde', 'fechahora'],
      ['fotos_subida_hasta', 'La subida se cierra', 'fechahora'],
      ['fotos_galeria_desde', 'La galería se ve desde', 'fechahora'],
      ['fotos_max_por_persona', 'Máximo de fotos por persona', 'texto'],
    ],
  },
  {
    id: 'playlist', titulo: 'Playlist de la fiesta', desc: 'Pedidos de canciones de los invitados', cap: null,
    campos: [
      ['playlist_activa', 'Pedidos habilitados', 'sino'],
      ['playlist_titulo', 'Título de la página', 'texto'],
      ['playlist_mensaje', 'Texto de la página', 'largo'],
      ['playlist_hasta', 'Se pueden pedir hasta', 'fechahora'],
      ['playlist_max_por_persona', 'Máximo de canciones por invitado', 'texto'],
      ['playlist_url', 'Link de tu playlist de Spotify (opcional)', 'texto'],
    ],
  },
  {
    id: 'general', titulo: 'General y WhatsApp', desc: 'Nombre del evento y mensaje de envío', cap: null,
    campos: [
      ['nombre_evento', 'Nombre del evento', 'texto', 'Sale en el calendario, las fotos y la pestaña del navegador.'],
      ['contacto_whatsapp', 'WhatsApp de contacto', 'texto', 'Con 593 y sin el 0 inicial.'],
      ['wa_mensaje', 'Mensaje de WhatsApp', 'largo', '{nombre} y {link} se reemplazan solos. Sin emojis.'],
      ['url_base', 'Dominio de la invitación (opcional)', 'texto', 'Déjalo vacío para usar el actual.'],
    ],
  },
];

const campoCls = 'mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900';
const btnSec = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium active:scale-[0.97] disabled:opacity-50';

const aInput = (tipo: Tipo, v: string) => (tipo === 'fechahora' ? v.slice(0, 16) : tipo === 'fecha' ? v.slice(0, 10) : v);
const aGuardar = (tipo: Tipo, v: string) => (tipo === 'fechahora' && v ? `${v}:00-05:00` : tipo === 'fecha' && v ? `${v}T23:59:00-05:00` : v);

// ---------- editores visuales ----------

function EditorPaleta({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const colores = valor.split(',').map((x) => x.trim()).filter(Boolean);
  const poner = (l: string[]) => onChange(l.join(','));
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      {colores.map((c, i) => (
        <span key={i} className="relative">
          <input type="color" aria-label={`Color ${i + 1}`} value={/^#[0-9a-f]{6}$/i.test(c) ? c : '#f4b6c2'} onChange={(e) => poner(colores.map((x, k) => (k === i ? e.target.value : x)))} className="size-12 cursor-pointer rounded-full border-2 border-stone-300 bg-white p-0.5" />
          <button type="button" aria-label={`Quitar color ${i + 1}`} onClick={() => poner(colores.filter((_, k) => k !== i))} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-stone-900 text-sm leading-none text-white">×</button>
        </span>
      ))}
      <button type="button" onClick={() => poner([...colores, '#f4b6c2'])} className={btnSec}>+ Agregar color</button>
    </div>
  );
}

const COLORES_TEXTO: [string, string][] = [
  ['#111111', 'Negro'], ['#3b3b3b', 'Gris oscuro'], ['#6d1a36', 'Vino'], ['#b8325f', 'Rosa fuerte'],
  ['#1f2a44', 'Azul marino'], ['#ffffff', 'Blanco'],
];

const COLORES_FIRMA: [string, string][] = [
  ['#ffffff', 'Blanco'], ['#111111', 'Negro'], ['#f48fb1', 'Rosa'], ['#e0527f', 'Rosa fuerte'], ['#c9a24a', 'Dorado'], ['#6d1a36', 'Vino'],
];

const COLORES_NUMERO: [string, string][] = [
  ['#e0527f', 'Rosa'], ['#c9a24a', 'Dorado'], ['#9a9a9a', 'Plata'], ['#6d1a36', 'Vino'], ['#1f2a44', 'Azul marino'], ['#ffffff', 'Blanco'],
];

function EditorColorTexto({ valor, onChange, conGeneral, paleta = COLORES_TEXTO, vacio = 'General' }: { valor: string; onChange: (v: string) => void; conGeneral: boolean; paleta?: [string, string][]; vacio?: string }) {
  const v = valor.trim().toLowerCase();
  const esPreset = paleta.some(([c]) => c === v);
  const personalizado = !!v && !esPreset;
  const aro = (on: boolean) => (on ? 'ring-2 ring-offset-2 ring-stone-900' : 'ring-1 ring-stone-300');
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2.5">
      {conGeneral && (
        <button type="button" onClick={() => onChange('')} aria-pressed={!v} className={`rounded-full px-4 py-2 text-sm font-semibold ${!v ? 'bg-stone-900 text-white' : 'border border-stone-300 bg-white'}`}>
          {vacio}
        </button>
      )}
      {paleta.map(([c, nombre]) => (
        <button key={c} type="button" title={nombre} aria-label={nombre} aria-pressed={v === c} onClick={() => onChange(c)} className={`size-10 rounded-full active:scale-95 ${aro(v === c)}`} style={{ background: c }} />
      ))}
      <label title="Elegir otro color" className={`relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full active:scale-95 ${aro(personalizado)}`} style={{ background: personalizado ? v : 'conic-gradient(#f87171, #fbbf24, #4ade80, #38bdf8, #a78bfa, #f472b6, #f87171)' }}>
        <span className="sr-only">Elegir otro color</span>
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#111111'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
      </label>
    </div>
  );
}

function EditorPrograma({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const filas = valor.split('\n').filter((l) => l.includes('|')).map((l) => { const [h, ...t] = l.split('|'); return [h, t.join('|')] as [string, string]; });
  const poner = (f: [string, string][]) => onChange(f.map(([h, t]) => `${h}|${t}`).join('\n'));
  return (
    <div className="mt-2 space-y-2">
      {filas.length === 0 && <p className="text-sm text-stone-500">Sin programa: esta parte no se muestra.</p>}
      {filas.map(([h, t], i) => (
        <div key={i} className="flex items-center gap-2">
          <input aria-label="Hora" placeholder="15:00" value={h} onChange={(e) => poner(filas.map((f, k) => (k === i ? [e.target.value, f[1]] : f)))} className="w-24 shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900" />
          <input aria-label="Actividad" placeholder="Recepción" value={t} onChange={(e) => poner(filas.map((f, k) => (k === i ? [f[0], e.target.value] : f)))} className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-900" />
          <button type="button" aria-label="Quitar actividad" onClick={() => poner(filas.filter((_, k) => k !== i))} className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-300 text-lg leading-none">×</button>
        </div>
      ))}
      <button type="button" onClick={() => poner([...filas, ['', '']])} className={btnSec}>+ Agregar actividad</button>
    </div>
  );
}

// ---------- vista previa en vivo ----------

function Vista({ token, valores, capActivo, completa, onEditar, nombre }: { token: string; valores: Record<string, string>; capActivo: string | null; completa: boolean; onEditar: (cap: string) => void; nombre: string }) {
  const marco = useRef<HTMLIFrameElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const listo = useRef(false);
  const [k, setK] = useState(1);
  const valoresRef = useRef(valores);
  valoresRef.current = valores;

  const enviar = useCallback((msg: unknown) => marco.current?.contentWindow?.postMessage(msg, window.location.origin), []);

  // la invitación avisa cuando cargó y cuando se toca un capítulo
  useEffect(() => {
    const f = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== marco.current?.contentWindow) return;
      const d = e.data as { tipo?: string; cap?: string } | null;
      if (d?.tipo === 'listo') {
        listo.current = true;
        enviar({ tipo: 'config', valores: valoresRef.current });
      } else if (d?.tipo === 'editar' && d.cap) onEditar(d.cap);
    };
    window.addEventListener('message', f);
    return () => window.removeEventListener('message', f);
  }, [enviar, onEditar]);

  useEffect(() => {
    listo.current = false;
  }, [token]);

  // cada cambio se refleja casi al instante (sin guardar)
  useEffect(() => {
    const id = setTimeout(() => listo.current && enviar({ tipo: 'config', valores }), 120);
    return () => clearTimeout(id);
  }, [valores, enviar]);

  useEffect(() => {
    if (capActivo && listo.current) enviar({ tipo: 'ir', cap: capActivo });
  }, [capActivo, enviar]);

  // en el panel de escritorio el celular se escala para que quepa completo
  useEffect(() => {
    if (completa || !caja.current) return;
    const medir = () => setK(Math.max(0.5, Math.min(1, (caja.current?.clientWidth ?? 375) / 375, (window.innerHeight - 330) / 812)));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caja.current);
    window.addEventListener('resize', medir);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [completa]);

  const src = `/i/${token}?vista=1`;
  if (completa) {
    return <iframe ref={marco} key={token} src={src} title={`Vista previa para ${nombre}`} className="size-full border-0 bg-white" />;
  }
  return (
    <div ref={caja} className="w-full">
      <div className="mx-auto overflow-hidden rounded-[28px] bg-stone-900 p-2 shadow-xl" style={{ width: 375 * k + 16 }}>
        <div className="overflow-hidden rounded-[20px] bg-white" style={{ width: 375 * k, height: 812 * k }}>
          <iframe ref={marco} key={token} src={src} title={`Vista previa para ${nombre}`} className="border-0 bg-white" style={{ width: 375, height: 812, transform: `scale(${k})`, transformOrigin: 'top left' }} />
        </div>
      </div>
    </div>
  );
}

// ---------- pestaña ----------

export function TabContenido({ campos, invitados, recargar }: { campos: CampoConfig[] | null; invitados: InvitadoAdmin[] | null; recargar: () => Promise<void> }) {
  const original = useMemo(() => Object.fromEntries((campos ?? []).map((c) => [c.clave, c.valor])), [campos]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [abierta, setAbierta] = useState('inicio');
  const [ancha, setAncha] = useState(false);
  const [movil, setMovil] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => setValores(original), [original]);
  useEffect(() => {
    if (!token && invitados?.length) setToken(invitados[0].token);
  }, [invitados, token]);
  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)');
    const f = () => setAncha(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);

  const cambios = Object.keys(valores).filter((k) => valores[k] !== original[k]);
  useEffect(() => {
    if (!cambios.length) return;
    const f = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [cambios.length]);

  const seccionDeCap = useCallback((cap: string) => SECCIONES.find((s) => s.cap === cap)?.id ?? null, []);
  // tocar un capítulo en la vista previa abre su sección para editarla
  const alEditar = useCallback(
    (cap: string) => {
      const id = seccionDeCap(cap);
      if (!id) return;
      setMovil(false);
      setAbierta(id);
      setTimeout(() => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    },
    [seccionDeCap],
  );

  if (!campos) return <p className="py-10 text-center text-sm text-stone-500">Cargando…</p>;

  const set = (k: string, v: string) => setValores((x) => ({ ...x, [k]: v }));
  const invitadoVista = invitados?.find((i) => i.token === token) ?? invitados?.[0];
  const capActivo = SECCIONES.find((s) => s.id === abierta)?.cap ?? null;

  async function guardar() {
    setGuardando(true);
    const out = Object.fromEntries(cambios.map((k) => [k, k === 'itinerario' ? valores[k].split('\n').filter((l) => l.replace('|', '').trim()).join('\n') : valores[k]]));
    const r = await api('/api/admin/config', json('PUT', out));
    setGuardando(false);
    if (!r.ok) return setAviso(r.error || 'No se pudo guardar');
    await recargar();
    setAviso('Guardado. La invitación ya muestra los cambios.');
    setTimeout(() => setAviso(''), 4000);
  }

  function campoUI([clave, etiqueta, tipo, ayuda]: Campo) {
    const v = valores[clave] ?? '';
    const sucio = valores[clave] !== original[clave];
    return (
      <div key={clave} className="text-base">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={clave} className="block font-medium">{etiqueta}</label>
          {sucio && (
            <button type="button" onClick={() => set(clave, original[clave] ?? '')} className="shrink-0 text-xs font-medium text-amber-800 underline underline-offset-2">Deshacer</button>
          )}
        </div>
        {ayuda && <p className="mt-0.5 text-sm text-stone-500">{ayuda}</p>}
        {tipo === 'imagen' || tipo === 'galeria' ? (
          <div className="mt-2"><Subidor tipo="imagen" multiple={tipo === 'galeria'} valor={v} onChange={(x) => set(clave, x)} maxLado={1600} /></div>
        ) : tipo === 'audio' ? (
          <div className="mt-2"><Subidor tipo="audio" valor={v} onChange={(x) => set(clave, x)} /></div>
        ) : tipo === 'paleta' ? (
          <EditorPaleta valor={v} onChange={(x) => set(clave, x)} />
        ) : tipo === 'colortexto' ? (
          <EditorColorTexto valor={v} onChange={(x) => set(clave, x)} conGeneral={clave !== 'color_texto'} />
        ) : tipo === 'colornumero' ? (
          <EditorColorTexto valor={v} onChange={(x) => set(clave, x)} conGeneral paleta={COLORES_NUMERO} vacio="Negro" />
        ) : tipo === 'colorfirma' ? (
          <EditorColorTexto valor={v || '#ffffff'} onChange={(x) => set(clave, x)} conGeneral={false} paleta={COLORES_FIRMA} />
        ) : tipo === 'corona' ? (
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            {([['plata', 'Plata', '#bdbdbd'], ['dorado', 'Dorado', '#f2b632'], ['rosa', 'Rosa', '#f06ea0'], ['gris', 'Gris', '#6b6b6b'], ['negro', 'Negro', '#111111']] as const).map(([val, nombre, col]) => {
              const on = (v.trim().toLowerCase() || 'plata') === val;
              return (
                <button key={val} type="button" onClick={() => set(clave, val)} aria-pressed={on} className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-semibold ${on ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white'}`}>
                  <span className="size-7 rounded-full ring-1 ring-black/20" style={{ background: col }} />
                  {nombre}
                </button>
              );
            })}
          </div>
        ) : tipo === 'programa' ? (
          <EditorPrograma valor={v} onChange={(x) => set(clave, x)} />
        ) : tipo === 'sino' ? (
          <label className="mt-2 flex items-center gap-3">
            <input id={clave} type="checkbox" checked={v.trim().toLowerCase() !== 'no'} onChange={(e) => set(clave, e.target.checked ? 'si' : 'no')} className="size-6" />
            <span>{v.trim().toLowerCase() !== 'no' ? 'Sí' : 'No'}</span>
          </label>
        ) : tipo === 'largo' ? (
          <textarea id={clave} rows={3} value={v} onChange={(e) => set(clave, e.target.value)} className={campoCls} />
        ) : tipo === 'color' ? (
          <div className="mt-2 flex items-center gap-3">
            <input id={clave} type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#000000'} onChange={(e) => set(clave, e.target.value)} className="h-11 w-16 cursor-pointer rounded-lg border border-stone-300 bg-white p-1" />
            <code className="text-sm text-stone-500">{v}</code>
          </div>
        ) : (
          <input id={clave} type={tipo === 'fechahora' ? 'datetime-local' : tipo === 'fecha' ? 'date' : 'text'} value={aInput(tipo, v)} onChange={(e) => set(clave, aGuardar(tipo, e.target.value))} className={campoCls} />
        )}
      </div>
    );
  }

  const selector = invitados && invitados.length > 0 && (
    <label className="block text-sm">
      <span className="mb-1 block text-stone-600">Ver la invitación como</span>
      <select value={invitadoVista?.token ?? ''} onChange={(e) => setToken(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base">
        {invitados.map((i) => <option key={i.token} value={i.token}>{i.nombre}</option>)}
      </select>
    </label>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-8">
      <div className="space-y-3">
        <div className="rounded-xl bg-white p-4 text-[15px] text-stone-700 ring-1 ring-stone-200">
          <p><b>Toca una parte para editarla.</b> Lo que cambies se ve al instante en la vista previa; no se guarda hasta que pulses <b>Guardar cambios</b>.</p>
          {!ancha && invitadoVista && <button type="button" onClick={() => setMovil(true)} className="mt-3 w-full rounded-lg bg-stone-900 px-4 py-3 text-base font-medium text-white active:scale-[0.98]">Ver vista previa</button>}
        </div>

        {SECCIONES.map((s) => {
          const abierto = abierta === s.id;
          const n = s.campos.filter(([k]) => valores[k] !== original[k]).length;
          return (
            <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-20 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
              <h2>
                <button type="button" aria-expanded={abierto} onClick={() => setAbierta(abierto ? '' : s.id)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left">
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold">{s.titulo}</span>
                    <span className="block text-sm font-normal text-stone-500">{s.desc}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {n > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">{n} sin guardar</span>}
                    <span aria-hidden className={`text-stone-400 transition-transform ${abierto ? 'rotate-180' : ''}`}>▾</span>
                  </span>
                </button>
              </h2>
              {abierto && <div className="space-y-5 border-t border-stone-100 px-4 pb-5 pt-4">{s.campos.map(campoUI)}</div>}
            </section>
          );
        })}
      </div>

      {ancha && (
        <aside className="sticky top-20 mt-0 space-y-3 self-start" aria-label="Vista previa">
          {selector}
          {invitadoVista ? (
            <Vista token={invitadoVista.token} valores={valores} capActivo={capActivo} completa={false} onEditar={alEditar} nombre={invitadoVista.nombre} />
          ) : (
            <p className="rounded-xl bg-white p-4 text-sm text-stone-600 ring-1 ring-stone-200">Agrega un invitado para ver la vista previa.</p>
          )}
          <p className="text-center text-sm text-stone-500">Toca cualquier parte de la invitación para editarla.</p>
          <a href={invitadoVista ? `/i/${invitadoVista.token}` : '#'} target="_blank" rel="noopener noreferrer" className="block text-center text-sm underline underline-offset-4">Abrir la invitación en otra pestaña</a>
        </aside>
      )}

      {movil && invitadoVista && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-900" role="dialog" aria-label="Vista previa">
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold">Vista previa</p>
              <p className="truncate text-sm text-stone-500">Toca una parte para editarla · {invitadoVista.nombre}</p>
            </div>
            <button type="button" onClick={() => setMovil(false)} className="shrink-0 rounded-lg bg-stone-900 px-4 py-2.5 text-base font-medium text-white">Cerrar</button>
          </div>
          {invitados && invitados.length > 1 && <div className="bg-white px-4 pb-3">{selector}</div>}
          <div className="min-h-0 flex-1">
            <Vista token={invitadoVista.token} valores={valores} capActivo={capActivo} completa onEditar={alEditar} nombre={invitadoVista.nombre} />
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p role="status" className="min-w-0 text-sm text-stone-600">{aviso || (cambios.length ? `${cambios.length} cambio${cambios.length > 1 ? 's' : ''} sin guardar` : 'Todo guardado')}</p>
          <div className="flex shrink-0 gap-2">
            {cambios.length > 0 && <button onClick={() => setValores(original)} className={btnSec}>Descartar</button>}
            <button onClick={guardar} disabled={!cambios.length || guardando} className="rounded-lg bg-stone-900 px-5 py-2.5 text-base font-medium text-white active:scale-[0.97] disabled:opacity-40">
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
