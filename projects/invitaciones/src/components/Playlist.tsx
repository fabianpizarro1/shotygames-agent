'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

interface Resultado {
  id: string;
  titulo: string;
  artista: string;
  portada: string;
  preview: string;
}
interface Mia {
  id: string;
  titulo: string;
  artista: string;
  portada: string;
  estado: string;
}
interface EnLista {
  id: string;
  titulo: string;
  artista: string;
  portada: string;
  por: string;
}

interface Props {
  config: {
    titulo: string;
    mensaje: string;
    evento: string;
    hasta: string;
    url: string;
    colores: { fondo: string; fondo2: string; papel: string; texto: string; acento: string };
  };
  invitado: { token: string; nombre: string } | null;
  inicial: { activa: boolean; abierta: boolean; max: number };
}

const limite = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' }).format(d);
};

export function Playlist({ config: c, invitado, inicial }: Props) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [mias, setMias] = useState<Mia[]>([]);
  const [lista, setLista] = useState<EnLista[]>([]);
  const [max, setMax] = useState(inicial.max);
  const [abierta, setAbierta] = useState(inicial.abierta);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [pidiendo, setPidiendo] = useState('');
  const [sonando, setSonando] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const turno = useRef(0);

  const tema = { '--fondo': c.colores.fondo, '--fondo2': c.colores.fondo2, '--papel': c.colores.papel, '--texto': c.colores.texto, '--acento': c.colores.acento } as CSSProperties;

  const cargar = useCallback(async () => {
    if (!invitado) return;
    try {
      const j = await (await fetch(`/api/musica/mias?t=${invitado.token}`, { cache: 'no-store' })).json();
      if (j.ok) {
        setMias(j.mias);
        setLista(j.lista);
        setMax(j.max);
        setAbierta(j.abierta);
      }
    } catch {}
  }, [invitado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Búsqueda con espera de 350 ms; si llega una respuesta vieja después de una nueva, se descarta.
  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setResultados([]);
      setBuscando(false);
      setErrorBusqueda('');
      return;
    }
    setBuscando(true);
    const mio = ++turno.current;
    const id = setTimeout(async () => {
      try {
        const j = await (await fetch(`/api/musica/buscar?q=${encodeURIComponent(texto)}`)).json();
        if (mio !== turno.current) return;
        if (j.ok) {
          setResultados(j.resultados);
          setErrorBusqueda('');
        } else setErrorBusqueda(j.error || 'No se pudo buscar');
      } catch {
        if (mio === turno.current) setErrorBusqueda('Sin conexión. Intenta de nuevo.');
      } finally {
        if (mio === turno.current) setBuscando(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => () => audio.current?.pause(), []);

  function escuchar(r: Resultado) {
    if (!r.preview) return;
    if (sonando === r.id) {
      audio.current?.pause();
      setSonando('');
      return;
    }
    audio.current?.pause();
    const a = new Audio(r.preview);
    a.onended = () => setSonando('');
    a.play().catch(() => setSonando(''));
    audio.current = a;
    setSonando(r.id);
  }

  async function pedir(r: Resultado) {
    if (!invitado || pidiendo) return;
    setPidiendo(r.id);
    setAviso(null);
    try {
      const res = await fetch('/api/musica/pedir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invitado.token, deezerId: r.id }) });
      const j = await res.json();
      if (j.ok) {
        setAviso({ tipo: 'ok', texto: `Listo: "${r.titulo}" quedó en la lista.` });
        await cargar();
      } else setAviso({ tipo: 'error', texto: j.ya?.por ? `${j.error} La pidió ${j.ya.por.split(' ')[0]}.` : j.error || 'No se pudo pedir' });
    } catch {
      setAviso({ tipo: 'error', texto: 'Sin conexión. Intenta de nuevo.' });
    } finally {
      setPidiendo('');
    }
  }

  async function quitar(m: Mia) {
    if (!invitado) return;
    setMias((l) => l.filter((x) => x.id !== m.id));
    await fetch('/api/musica/quitar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invitado.token, id: m.id }) }).catch(() => {});
    cargar();
  }

  const yaPedidas = new Set(lista.map((x) => `${x.titulo}|${x.artista}`));
  const puede = !!invitado && abierta && inicial.activa;
  const llegoAlTope = mias.length >= max;

  return (
    <div style={tema} className="rayas min-h-dvh">
      <main className="mx-auto w-full max-w-[430px] space-y-8 px-5 pb-16 pt-10">
        <header className="text-center" style={{ color: 'var(--texto)' }}>
          <p className="f-serif text-xs uppercase tracking-[0.3em] opacity-80">{c.evento}</p>
          <h1 className="f-script mt-2 text-5xl leading-none">{c.titulo}</h1>
          {c.mensaje && <p className="mx-auto mt-4 max-w-[19rem] text-sm opacity-90">{c.mensaje}</p>}
        </header>

        <section className="papel rounded-sm p-6" aria-labelledby="t-pedir">
          <h2 id="t-pedir" className="f-serif mb-4 text-center text-sm font-semibold uppercase tracking-[0.3em]">Pide tu canción</h2>

          {!inicial.activa && <p className="text-center text-sm">Los pedidos de canciones no están habilitados.</p>}
          {inicial.activa && !invitado && <p className="text-center text-sm">Abre esta página desde el enlace de tu invitación para poder pedir canciones.</p>}
          {inicial.activa && invitado && !abierta && <p className="text-center text-sm">Ya se cerraron los pedidos de canciones. ¡Gracias por participar!</p>}

          {puede && (
            <div className="space-y-4">
              <p className="text-center text-xs opacity-70">
                Llevas {mias.length} de {max}. {c.hasta && limite(c.hasta) && <>Hasta el {limite(c.hasta)}</>}
              </p>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca por canción o artista"
                aria-label="Buscar canción"
                disabled={llegoAlTope}
                className="w-full rounded-md border bg-white/70 px-3 py-3 text-base outline-none focus:bg-white disabled:opacity-50"
                style={{ borderColor: 'color-mix(in srgb, var(--texto) 35%, transparent)' }}
              />
              {llegoAlTope && <p className="text-center text-sm">Ya pediste tus {max} canciones. Quita una abajo si quieres cambiarla.</p>}
              {aviso && (
                <p role="status" className="rounded-md p-2.5 text-center text-sm font-medium" style={{ background: aviso.tipo === 'ok' ? 'color-mix(in srgb, var(--acento) 35%, var(--papel))' : '#f6dede' }}>
                  {aviso.texto}
                </p>
              )}
              {buscando && <p className="text-center text-xs opacity-60">Buscando…</p>}
              {errorBusqueda && <p role="alert" className="text-center text-sm">{errorBusqueda}</p>}
              {!buscando && !errorBusqueda && q.trim().length >= 2 && resultados.length === 0 && <p className="text-center text-sm opacity-70">No encontramos nada. Prueba con otro nombre.</p>}

              {!llegoAlTope && (
                <ul className="space-y-2">
                  {resultados.map((r) => {
                    const repetida = yaPedidas.has(`${r.titulo}|${r.artista}`);
                    return (
                      <li key={r.id} className="flex items-center gap-3 rounded-md bg-white/60 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r.portada ? <img src={r.portada} alt="" width={48} height={48} loading="lazy" className="size-12 shrink-0 rounded" /> : <span className="size-12 shrink-0 rounded bg-black/10" />}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">{r.titulo}</p>
                          <p className="truncate text-xs opacity-70">{r.artista}</p>
                        </div>
                        {r.preview && (
                          <button type="button" onClick={() => escuchar(r)} aria-label={sonando === r.id ? 'Pausar muestra' : 'Escuchar muestra'} className="boton grid size-9 shrink-0 place-items-center rounded-full border-2 text-xs" style={{ borderColor: 'var(--texto)' }}>
                            {sonando === r.id ? '❚❚' : '▶'}
                          </button>
                        )}
                        <button type="button" onClick={() => pedir(r)} disabled={!!pidiendo || repetida} className="boton shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-40" style={{ background: 'var(--texto)', color: 'var(--papel)' }}>
                          {pidiendo === r.id ? '…' : repetida ? 'Ya está' : 'Pedir'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        {invitado && mias.length > 0 && (
          <section className="papel rounded-sm p-6" aria-labelledby="t-mias">
            <h2 id="t-mias" className="f-serif mb-4 text-center text-sm font-semibold uppercase tracking-[0.3em]">Tus canciones</h2>
            <ul className="space-y-2">
              {mias.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-md bg-white/60 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.portada ? <img src={m.portada} alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 rounded" /> : <span className="size-10 shrink-0 rounded bg-black/10" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.titulo}</p>
                    <p className="truncate text-xs opacity-70">{m.artista}</p>
                  </div>
                  {abierta && <button type="button" onClick={() => quitar(m)} className="shrink-0 px-2 py-1 text-xs underline underline-offset-2">Quitar</button>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {lista.length > 0 && (
          <section className="papel rounded-sm p-6" aria-labelledby="t-todas">
            <h2 id="t-todas" className="f-serif mb-1 text-center text-sm font-semibold uppercase tracking-[0.3em]">Entre todos</h2>
            <p className="mb-4 text-center text-xs opacity-70">{lista.length} {lista.length === 1 ? 'canción' : 'canciones'} hasta ahora</p>
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {lista.map((x) => (
                <li key={x.id} className="flex items-center gap-3 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {x.portada ? <img src={x.portada} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 rounded" /> : <span className="size-8 shrink-0 rounded bg-black/10" />}
                  <span className="min-w-0 flex-1 truncate"><b>{x.titulo}</b> <span className="opacity-70">· {x.artista}</span></span>
                  <span className="shrink-0 text-xs opacity-60">{x.por}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {c.url && (
          <p className="text-center">
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="boton inline-block rounded-full border-2 px-5 py-3 text-xs font-semibold uppercase tracking-widest" style={{ borderColor: 'var(--texto)', color: 'var(--texto)' }}>
              Abrir la playlist en Spotify
            </a>
          </p>
        )}
      </main>
    </div>
  );
}
