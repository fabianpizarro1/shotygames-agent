'use client';

import { VolverInvitacion } from './VolverInvitacion';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { enviarFoto, prepararFoto } from '@/lib/cliente-subida';

type Ventana = 'antes' | 'abierta' | 'cerrada' | 'apagada';

interface Props {
  config: {
    titulo: string;
    mensaje: string;
    evento: string;
    subidaDesde: string;
    galeriaDesde: string;
    colores: { fondo: string; fondo2: string; papel: string; texto: string; acento: string };
  };
  inicial: { subida: Ventana; galeriaAbierta: boolean; max: number };
  nombreInicial: string;
  token?: string;
}

interface Item {
  id: number;
  nombre: string;
  estado: 'cola' | 'subiendo' | 'ok' | 'error';
  error?: string;
  vista: string;
}

interface FotoGaleria {
  id: string;
  url: string;
  mini: string;
  autor: string;
}

const cuando = (iso: string) =>
  new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' }).format(new Date(iso));

function guardado(k: string): string {
  try {
    return localStorage.getItem(k) ?? '';
  } catch {
    return '';
  }
}
function guardar(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

export function Fotos({ config: c, inicial, nombreInicial, token }: Props) {
  const [subida, setSubida] = useState<Ventana>(inicial.subida);
  const [galeriaAbierta, setGaleriaAbierta] = useState(inicial.galeriaAbierta);
  const [max, setMax] = useState(inicial.max);
  const [subidas, setSubidas] = useState(0);
  const [nombre, setNombre] = useState(nombreInicial);
  const [uid, setUid] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [galeria, setGaleria] = useState<FotoGaleria[] | null>(null);
  const [visor, setVisor] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const siguienteId = useRef(0);

  const tema = { '--fondo': c.colores.fondo, '--fondo2': c.colores.fondo2, '--papel': c.colores.papel, '--texto': c.colores.texto, '--acento': c.colores.acento } as CSSProperties;

  const refrescarEstado = useCallback(async (u: string) => {
    try {
      const j = await (await fetch(`/api/fotos/estado?u=${encodeURIComponent(u)}`, { cache: 'no-store' })).json();
      if (j.ok) {
        setSubida(j.subida);
        setGaleriaAbierta(j.galeriaAbierta);
        setMax(j.max);
        setSubidas(j.subidas);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let id = guardado('fotos-uid');
    if (!/^[A-Za-z0-9-]{8,40}$/.test(id)) {
      id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `u${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
      guardar('fotos-uid', id);
    }
    setUid(id);
    if (!nombreInicial) setNombre(guardado('fotos-nombre'));
    refrescarEstado(id);
  }, [nombreInicial, refrescarEstado]);

  useEffect(() => {
    if (!galeriaAbierta) return;
    fetch('/api/fotos/lista', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => j.ok && setGaleria(j.fotos))
      .catch(() => setGaleria([]));
  }, [galeriaAbierta]);

  const cambiarItem = (id: number, cambios: Partial<Item>) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...cambios } : x)));

  async function elegir(files: FileList | null) {
    if (!files?.length || !uid || !nombre.trim()) return;
    guardar('fotos-nombre', nombre.trim());
    const nuevos: { item: Item; file: File }[] = Array.from(files).map((file) => ({
      file,
      item: { id: siguienteId.current++, nombre: file.name, estado: 'cola', vista: URL.createObjectURL(file) },
    }));
    setItems((l) => [...nuevos.map((n) => n.item), ...l]);
    if (input.current) input.current.value = '';

    // Dos a la vez: más rápido que una por una sin saturar el wifi del lugar.
    const cola = [...nuevos];
    const trabajador = async () => {
      for (let n = cola.shift(); n; n = cola.shift()) {
        cambiarItem(n.item.id, { estado: 'subiendo' });
        try {
          await enviarFoto(await prepararFoto(n.file), uid, nombre.trim());
          cambiarItem(n.item.id, { estado: 'ok' });
          setSubidas((s) => s + 1);
        } catch (e) {
          cambiarItem(n.item.id, { estado: 'error', error: e instanceof Error ? e.message : 'Error' });
        }
      }
    };
    await Promise.all([trabajador(), trabajador()]);
    refrescarEstado(uid);
  }

  useEffect(() => {
    if (visor === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisor(null);
      if (e.key === 'ArrowRight') setVisor((v) => (v === null || !galeria ? v : (v + 1) % galeria.length));
      if (e.key === 'ArrowLeft') setVisor((v) => (v === null || !galeria ? v : (v - 1 + galeria.length) % galeria.length));
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [visor, galeria]);

  const ocupado = items.some((i) => i.estado === 'cola' || i.estado === 'subiendo');
  const restantes = Math.max(0, max - subidas);

  return (
    <div style={tema} className="rayas min-h-dvh">
      <main className="mx-auto w-full max-w-[430px] space-y-8 px-5 pb-16 pt-5">
        <VolverInvitacion token={token} />
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="text-center" style={{ color: 'var(--texto)' }}>
          <p className="f-serif text-[15.12px] uppercase tracking-[0.3em] opacity-80">{c.evento}</p>
          <h1 className="f-script mt-2 text-[3.36rem] leading-none">{c.titulo}</h1>
          {c.mensaje && <p className="mx-auto mt-4 max-w-[19rem] text-[17.36px] opacity-90">{c.mensaje}</p>}
        </motion.header>

        {/* Subida */}
        <section className="papel rounded-sm p-6 text-center" aria-labelledby="t-subir">
          <h2 id="t-subir" className="f-serif mb-4 text-[17.36px] font-semibold uppercase tracking-[0.3em]">Sube tus fotos</h2>

          {subida === 'antes' && <p className="text-[17.36px]">Se abre el <b>{cuando(c.subidaDesde)}</b>. ¡Vuelve a escanear el QR ese día!</p>}
          {subida === 'cerrada' && <p className="text-[17.36px]">La subida de fotos ya se cerró. ¡Gracias por compartir!</p>}
          {subida === 'apagada' && <p className="text-[17.36px]">Las fotos aún no están habilitadas.</p>}

          {subida === 'abierta' && (
            <div className="space-y-4">
              <label className="block text-left text-[17.36px]">
                <span className="mb-1.5 block text-[15.12px] font-semibold uppercase tracking-widest opacity-70">Tu nombre</span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  className="w-full rounded-md border bg-white/70 px-3 py-2.5 text-[1.12rem] outline-none focus:bg-white"
                  style={{ borderColor: 'color-mix(in srgb, var(--texto) 35%, transparent)' }}
                />
              </label>
              <button
                type="button"
                disabled={!nombre.trim() || !uid || restantes === 0}
                onClick={() => input.current?.click()}
                className="boton w-full rounded-full py-4 text-[17.36px] font-semibold uppercase tracking-widest disabled:opacity-40"
                style={{ background: 'var(--texto)', color: 'var(--papel)' }}
              >
                {restantes === 0 ? 'Llegaste al máximo' : ocupado ? 'Subiendo…' : 'Elegir fotos'}
              </button>
              <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => elegir(e.target.files)} />
              <p className="text-[15.12px] opacity-70">{subidas > 0 ? `Subiste ${subidas} de ${max} fotos.` : `Puedes subir hasta ${max} fotos.`}</p>
            </div>
          )}

          {items.length > 0 && (
            <ul className="mt-5 grid grid-cols-3 gap-2" aria-label="Fotos seleccionadas">
              {items.map((i) => (
                <li key={i.id} className="relative aspect-square overflow-hidden rounded-md bg-white/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.vista} alt="" className="size-full object-cover" style={{ opacity: i.estado === 'ok' ? 1 : 0.55 }} />
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[14.56px] font-medium text-white" title={i.error}>
                    {i.estado === 'ok' ? 'Lista' : i.estado === 'error' ? i.error : i.estado === 'subiendo' ? 'Subiendo…' : 'En cola'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Galería */}
        <section className="papel rounded-sm p-6" aria-labelledby="t-galeria">
          <h2 id="t-galeria" className="f-serif mb-4 text-center text-[17.36px] font-semibold uppercase tracking-[0.3em]">Galería</h2>
          {!galeriaAbierta ? (
            <p className="text-center text-[17.36px]">La galería se abre el <b>{cuando(c.galeriaDesde)}</b>. Ahí podrás ver y descargar las fotos de todos.</p>
          ) : galeria === null ? (
            <p className="text-center text-[17.36px] opacity-70">Cargando fotos…</p>
          ) : galeria.length === 0 ? (
            <p className="text-center text-[17.36px] opacity-70">Todavía no hay fotos.</p>
          ) : (
            <div className="columns-2 gap-2 [&>button]:mb-2">
              {galeria.map((f, k) => (
                <button key={f.id} type="button" onClick={() => setVisor(k)} className="block w-full overflow-hidden rounded-md bg-white/60" aria-label={`Foto de ${f.autor || 'un invitado'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.mini} alt="" loading="lazy" decoding="async" className="w-full" />
                </button>
              ))}
            </div>
          )}
        </section>
        <VolverInvitacion token={token} abajo />
      </main>

      <AnimatePresence>
        {visor !== null && galeria && galeria[visor] && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-label="Foto"
            onClick={() => setVisor(null)}
          >
            <div className="flex items-center justify-between p-4 text-[17.36px] text-white" onClick={(e) => e.stopPropagation()}>
              <span className="truncate">{galeria[visor].autor && `Por ${galeria[visor].autor}`}</span>
              <div className="flex gap-4">
                <a href={`${galeria[visor].url}?d=1`} className="underline underline-offset-4">Descargar</a>
                <button onClick={() => setVisor(null)} aria-label="Cerrar" className="text-[1.68rem] leading-none">×</button>
              </div>
            </div>
            <div className="relative grid min-h-0 flex-1 place-items-center px-2 pb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={galeria[visor].id} src={galeria[visor].url} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
              {galeria.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setVisor((visor - 1 + galeria.length) % galeria.length); }} aria-label="Anterior" className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-[1.68rem] text-white">‹</button>
                  <button onClick={(e) => { e.stopPropagation(); setVisor((visor + 1) % galeria.length); }} aria-label="Siguiente" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-[1.68rem] text-white">›</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
