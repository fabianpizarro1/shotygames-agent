'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Config } from '@/lib/config';
import { partes, textoFecha, textoHora } from '@/lib/fechas';
import { Cuenta } from './Cuenta';
import { Musica, type MusicaApi } from './Musica';
import { Rsvp } from './Rsvp';
import { Sobre } from './Sobre';
import { Copa, Pastel, Polaroid } from './Stickers';

interface InvitadoVista {
  token: string;
  nombre: string;
  genero: 'F' | 'M';
  cupos: number;
  estado: 'pendiente' | 'confirmado' | 'no_asiste';
  asistentes: number;
  restricciones: string;
  mensaje: string;
}

function Revelar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="f-serif mb-4 text-center text-sm font-semibold uppercase tracking-[0.3em]">{children}</h2>;
}

export function Invitacion({ config: c, invitado }: { config: Config; invitado: InvitadoVista }) {
  const [portada, setPortada] = useState(true);
  const musica = useRef<MusicaApi>(null);

  // La portada bloquea el scroll mientras está abierta.
  useEffect(() => {
    document.body.style.overflow = portada ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [portada]);

  // Marca "abierto" una sola vez por sesión (alimenta las estadísticas del dashboard).
  useEffect(() => {
    try {
      const k = `abierto-${invitado.token}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {}
    fetch('/api/abierto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invitado.token }) }).catch(() => {});
  }, [invitado.token]);

  const tema = {
    '--fondo': c.color_fondo,
    '--fondo2': c.color_fondo_2,
    '--papel': c.color_papel,
    '--texto': c.color_texto,
    '--acento': c.color_acento,
  } as CSSProperties;

  const titulo = c.titulo.replace('{invitada}', invitado.genero === 'M' ? 'invitado' : 'invitada');
  const maps = c.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.lugar_nombre, c.lugar_direccion].filter(Boolean).join(' '))}`;
  const itinerario = c.itinerario
    .split('\n')
    .map((l) => l.split('|'))
    .filter((p) => p.length >= 2 && p[1].trim())
    .map(([hora, texto]) => [hora.trim(), texto.trim()]);
  const fotos = c.galeria_fotos.split('\n').map((u) => u.trim()).filter(Boolean);
  const p = partes(c.fecha_hora);
  const limite = c.fecha_limite_rsvp && !Number.isNaN(new Date(c.fecha_limite_rsvp).getTime())
    ? new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', timeZone: 'America/Guayaquil' }).format(new Date(c.fecha_limite_rsvp))
    : '';
  const wa = c.contacto_whatsapp.replace(/\D/g, '');
  const telVisible = wa.startsWith('593') ? `0${wa.slice(3)}` : wa;

  return (
    <div style={tema} className="rayas min-h-dvh">
      <AnimatePresence>
        {portada && (
          <Sobre
            nombre={invitado.nombre}
            inicial={(c.festejado.trim()[0] ?? '♥').toUpperCase()}
            onAbrir={() => musica.current?.reproducir()}
            onListo={() => setPortada(false)}
          />
        )}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-[430px] space-y-14 px-5 pb-28 pt-10">
        {/* Tarjeta principal */}
        <motion.div
          className="relative pt-14"
          initial={{ opacity: 0, y: 24 }}
          animate={portada ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          <Copa src={c.sticker_copa_url} className="flota absolute -left-3 top-0 z-10 -rotate-6 scale-90" />
          <div className="papel relative rounded-sm px-6 pb-24 pt-14 text-center">
            <p className="f-serif text-lg">{titulo}</p>
            <h1 className="f-script mt-3 text-[3.6rem] leading-[0.95] sm:text-6xl">{c.nombre_evento}</h1>
            {c.portada_url && <Polaroid src={c.portada_url} giro={-2} className="mx-auto mt-7 w-[78%]" />}
            {c.mensaje && <p className="mx-auto mt-6 max-w-[17rem] text-sm leading-relaxed opacity-80">{c.mensaje}</p>}

            <div className="mt-8 space-y-2 text-[15px] font-medium uppercase tracking-wide">
              <p>{textoFecha(c.fecha_hora)}</p>
              <p>{c.lugar_nombre}</p>
              <p>{textoHora(c.fecha_hora)} h{c.hora_fin_texto ? ` · ${c.hora_fin_texto}` : ''}</p>
            </div>

            <div className="mt-8 text-sm">
              <p className="opacity-80">dress code:</p>
              <p className="font-semibold">{c.dresscode_titulo}</p>
            </div>

            <a
              href="#confirmar"
              className="boton mt-8 inline-block rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'var(--texto)', color: 'var(--papel)' }}
            >
              Confirmar asistencia
            </a>

            {c.regalos_texto && <p className="mx-auto mt-8 max-w-[16rem] text-[11px] opacity-70">{c.regalos_texto}</p>}
          </div>
          <Pastel src={c.sticker_pastel_url} className="flota absolute -bottom-8 -right-3 z-10 rotate-6 scale-90" />
        </motion.div>

        {/* Cuenta regresiva y calendario */}
        <Revelar>
          <div className="papel rounded-sm p-6">
            <Cuenta fechaHora={c.fecha_hora} />
          </div>
        </Revelar>

        {/* Galería de fotos */}
        {fotos.length > 0 && (
          <Revelar>
            <div className="text-center">
              {c.galeria_titulo && <p className="f-script mb-6 text-5xl leading-none" style={{ color: 'var(--papel)' }}>{c.galeria_titulo}</p>}
              <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                {fotos.map((u, k) => (
                  <Polaroid key={u + k} src={u} giro={[-3, 2.5, 2, -2.5][k % 4]} className={k % 2 ? 'mt-6' : ''} />
                ))}
              </div>
            </div>
          </Revelar>
        )}

        {/* Lugar */}
        <Revelar>
          <div className="papel rounded-sm p-6 text-center">
            <Titulo>Dónde</Titulo>
            <p className="f-script text-4xl leading-tight">{c.lugar_nombre}</p>
            {c.lugar_direccion && <p className="mt-2 text-sm opacity-80">{c.lugar_direccion}</p>}
            <div className="mt-5 flex flex-col gap-3">
              <a href={maps} target="_blank" rel="noopener noreferrer" className="boton rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-widest" style={{ background: 'var(--texto)', color: 'var(--papel)' }}>
                Cómo llegar
              </a>
              {c.waze_url && (
                <a href={c.waze_url} target="_blank" rel="noopener noreferrer" className="boton rounded-full border-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest" style={{ borderColor: 'var(--texto)' }}>
                  Abrir en Waze
                </a>
              )}
            </div>
          </div>
        </Revelar>

        {/* Dress code */}
        <Revelar>
          <div className="papel rounded-sm p-6 text-center">
            <Titulo>Dress code</Titulo>
            <p className="f-script text-4xl leading-tight">{c.dresscode_titulo}</p>
            {c.dresscode_detalle && <p className="mt-3 text-sm opacity-80">{c.dresscode_detalle}</p>}
            <div className="mt-5 flex justify-center gap-3" aria-hidden>
              {['#f9d3da', '#f4b6c2', '#ef9aa8', '#f7e1e5'].map((col) => (
                <span key={col} className="size-9 rounded-full" style={{ background: col, boxShadow: 'inset 0 0 0 2px rgb(0 0 0 / 0.08)' }} />
              ))}
            </div>
          </div>
        </Revelar>

        {/* Itinerario (solo si hay) */}
        {itinerario.length > 0 && (
          <Revelar>
            <div className="papel rounded-sm p-6">
              <Titulo>Programa</Titulo>
              <ul className="space-y-3">
                {itinerario.map(([hora, texto]) => (
                  <li key={hora + texto} className="flex items-baseline gap-4">
                    <span className="f-serif w-14 shrink-0 text-right text-lg font-semibold tabular-nums">{hora}</span>
                    <span className="text-sm">{texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Revelar>
        )}

        {/* RSVP */}
        <Revelar>
          <div id="confirmar" className="papel scroll-mt-6 rounded-sm p-6">
            <Titulo>Confirma tu asistencia</Titulo>
            <p className="f-script mb-5 text-center text-4xl leading-tight">{invitado.nombre}</p>
            <Rsvp
              token={invitado.token}
              cupos={invitado.cupos}
              limite={limite}
              inicial={{ estado: invitado.estado, asistentes: invitado.asistentes, restricciones: invitado.restricciones, mensaje: invitado.mensaje }}
            />
          </div>
        </Revelar>

        {/* Pie */}
        <Revelar className="text-center" >
          <p className="f-script text-5xl leading-none" style={{ color: 'var(--papel)' }}>
            {p ? '¡No faltes!' : ''}
          </p>
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm underline underline-offset-4"
              style={{ color: 'var(--papel)' }}
            >
              ¿Dudas? Escríbeme al {telVisible}
            </a>
          )}
        </Revelar>
      </main>

      <Musica url={c.musica_url} titulo={c.musica_titulo} apiRef={musica} />
    </div>
  );
}
