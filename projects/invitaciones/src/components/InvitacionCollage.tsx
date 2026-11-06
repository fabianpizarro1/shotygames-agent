'use client';

import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Config } from '@/lib/config';
import { piezasFecha } from '@/lib/fechas';
import { Capitulo, Cinta, Entra, Escribe, Listo } from './anim';
import { Cuenta } from './Cuenta';
import { Pegatina, Sticker } from './Decor';
import { Musica, type MusicaApi } from './Musica';
import { Rsvp } from './Rsvp';
import { Sobre } from './Sobre';
import { Polaroid } from './Stickers';

// VERSIÓN 2 · "collage": papel kraft arrugado, banderines, notas de cuaderno con cinta, letras
// recortadas de revista, globo foil rosa con la foto en medio. Inspirada en la plantilla del video
// de referencia (sin usar sus imágenes). Se ve con ?v=2 al final del enlace.

interface InvitadoVista {
  token: string;
  nombre: string;
  genero: 'F' | 'M';
  cupos: number;
  estado: 'pendiente' | 'confirmado' | 'no_asiste';
  asistentes: number;
  mensaje: string;
}

const ROSA = '#e0629f';
const MALVA = '#bf6b92';
const TINTA = '#231a1c';

// ---------- piezas del collage ----------

// Banderines colgando de una cuerda, a todo el ancho de la columna.
function Banderines({ className = '' }: { className?: string }) {
  const colores = ['#e0629f', '#2fb5a6', '#f4c542', '#8e63c7', '#f08a3c', '#4aa3df'];
  const P0 = [-10, 4], P1 = [215, 74], P2 = [440, 4];
  const punto = (t: number) => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
  const tangente = (t: number) => [2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])];
  const n = 11;
  return (
    <svg viewBox="0 0 430 110" preserveAspectRatio="none" aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 z-[1] h-[110px] w-full ${className}`}>
      <path d={`M${P0[0]} ${P0[1]} Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke="#5b4636" strokeWidth="1.6" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const [x, y] = punto(t);
        const [tx, ty] = tangente(t);
        const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
            <path d="M-17 0 L17 0 L0 42 Z" fill={colores[i % colores.length]} stroke="rgb(0 0 0 / 0.14)" strokeWidth="1" />
          </g>
        );
      })}
    </svg>
  );
}

// Nota de cuaderno rayado con cinta adhesiva.
function Nota({ children, giro = 0, cinta = true, className = '' }: { children: ReactNode; giro?: number; cinta?: boolean; className?: string }) {
  return (
    <div className={`nota ${className}`} style={{ rotate: `${giro}deg` }}>
      {cinta && <span aria-hidden className="absolute -top-3.5 left-1/2 z-[1] h-7 w-24 -translate-x-1/2 -rotate-2 bg-[#f4c542]/75 shadow-[0_1px_3px_rgb(0_0_0/0.25)]" />}
      {children}
    </div>
  );
}

// Letras recortadas de revista: cada letra con su color, tipografía y giro (fijos, sin azar: igual en servidor y cliente).
const FICHAS = [
  { bg: '#2fb5a6', fg: '#ffffff' },
  { bg: '#f4c542', fg: TINTA },
  { bg: ROSA, fg: '#ffffff' },
  { bg: '#fbf6e8', fg: TINTA },
  { bg: TINTA, fg: '#fbf6e8' },
  { bg: '#8e63c7', fg: '#ffffff' },
  { bg: '#f08a3c', fg: TINTA },
];
const FUENTES = ['var(--f-serif)', 'var(--f-oswald)', 'var(--f-bowlby)', 'var(--f-mano)', 'var(--f-sans)'];
function Rescate({ texto, tam = '3rem' }: { texto: string; tam?: string }) {
  let k = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label={texto}>
      {texto.split(' ').map((palabra, w) => (
        <span key={w} aria-hidden className="inline-flex">
          {[...palabra].map((ch) => {
            const i = k++;
            return (
              <span
                key={i}
                style={{
                  fontSize: tam,
                  lineHeight: 1.04,
                  padding: '0.02em 0.13em',
                  margin: '0 0.025em',
                  background: FICHAS[(i * 5 + 2) % FICHAS.length].bg,
                  color: FICHAS[(i * 5 + 2) % FICHAS.length].fg,
                  fontFamily: FUENTES[(i * 3 + 1) % FUENTES.length],
                  fontWeight: 900,
                  textTransform: i % 3 === 1 ? 'none' : 'uppercase',
                  transform: `rotate(${((i * 37) % 9) - 4}deg)`,
                  boxShadow: '0 2px 0 rgb(0 0 0 / 0.18), 0 7px 8px -5px rgb(0 0 0 / 0.45)',
                  display: 'inline-block',
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}

function Dialogo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[22px] px-6 py-5 shadow-[0_12px_16px_-10px_rgb(60_20_40/0.6)] ${className}`} style={{ background: MALVA, color: TINTA }}>
      {children}
      <span aria-hidden className="absolute -bottom-2.5 left-10 size-6 rotate-45 rounded-sm" style={{ background: MALVA }} />
    </div>
  );
}

// Número de globo foil con la foto entre los dígitos y una corona.
function Foil({ numero, foto }: { numero: string; foto: string }) {
  const d = [...numero];
  const a = d[0] ?? '3';
  const b = d.slice(1).join('') || '0';
  return (
    <div className="relative mx-auto flex items-center justify-center pt-8">
      <span className="foil text-[8.6rem]" data-t={a}>{a}</span>
      <span className="relative z-[3] -mx-4 grid size-[100px] shrink-0 place-items-center overflow-hidden rounded-full border-[5px] border-[#fbf6e8]" style={{ background: 'rgb(224 98 159 / 0.35)', boxShadow: '0 10px 14px -6px rgb(60 20 40 / 0.55)' }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <Sticker nombre="corazon" tono="color" ancho={64} className="static" />
        )}
      </span>
      <span className="foil text-[8.6rem]" data-t={b}>{b}</span>
      <Sticker nombre="corona" tono="rosa" ancho={70} rot={-6} className="left-1/2 top-1 z-[4] -ml-[35px]" anim="pop" />
    </div>
  );
}

function Flechas() {
  return (
    <svg viewBox="0 0 90 70" width="86" aria-hidden className="mx-auto mt-3 block">
      {[14, 52].map((x) => (
        <path key={x} d={`M${x} 6 v34 h-9 l17 22 l17 -22 h-9 v-34 z`} fill={ROSA} stroke="#fff" strokeWidth="4" strokeLinejoin="round" paintOrder="stroke" />
      ))}
    </svg>
  );
}

export function InvitacionCollage({ config: c, invitado }: { config: Config; invitado: InvitadoVista }) {
  const [portada, setPortada] = useState(true);
  const musica = useRef<MusicaApi>(null);

  // Siempre desde el principio: sin esto el navegador restaura el scroll anterior (al recargar o volver
  // atrás) y la invitación arranca "a la mitad" al abrir el sobre.
  useEffect(() => {
    try {
      history.scrollRestoration = 'manual';
    } catch {}
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (portada) return;
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(id);
  }, [portada]);

  useEffect(() => {
    document.body.style.overflow = portada ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [portada]);

  useEffect(() => {
    try {
      const k = `abierto-${invitado.token}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {}
    fetch('/api/abierto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invitado.token }) }).catch(() => {});
  }, [invitado.token]);

  // Colores propios de esta versión (no dependen de los colores del panel).
  const tema = { '--fondo': '#ddc8a5', '--fondo2': TINTA, '--papel': '#fbf6e8', '--texto': TINTA, '--acento': ROSA } as CSSProperties;

  const invitada = invitado.genero === 'M' ? 'invitado' : 'invitada';
  const invitadas = invitado.genero === 'M' ? 'invitados' : 'invitadas';
  const f = piezasFecha(c.fecha_hora);
  const maps = c.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.lugar_nombre, c.lugar_direccion].filter(Boolean).join(' '))}`;
  const colores = c.dresscode_colores.split(',').map((x) => x.trim()).filter((x) => /^#[0-9a-f]{3,8}$/i.test(x));
  const limite = c.fecha_limite_rsvp && !Number.isNaN(new Date(c.fecha_limite_rsvp).getTime())
    ? new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', timeZone: 'America/Guayaquil' }).format(new Date(c.fecha_limite_rsvp))
    : '';
  const alterno = c.fotos_activas.trim().toLowerCase() !== 'no';
  const lista = c.playlist_activa.trim().toLowerCase() !== 'no';
  const fotos = c.galeria_fotos.split('\n').map((u) => u.trim()).filter(Boolean);

  return (
    <Listo.Provider value={!portada}>
      <div style={tema} className="kraft min-h-dvh overflow-x-clip" data-version="2">
        <AnimatePresence>
          {portada && (
            <Sobre fondo="kraft" humo={false} nombre={invitado.nombre} inicial={(c.festejado.trim()[0] ?? 'J').toUpperCase()} numero={c.rip_numero} onAbrir={() => {}} onListo={() => setPortada(false)} />
          )}
        </AnimatePresence>

        {/* 1 · Título con letras recortadas y nota de invitación */}
        <Capitulo className="!justify-start !pt-64 !min-h-[920px]">
          <Banderines />
          <Pegatina nombre="disco-estrellas" ancho={190} rot={-8} className="-left-10 top-10" anim="flota" />
          <Pegatina nombre="globos-rosa" ancho={150} rot={7} className="-right-3 top-8" anim="flota" retraso={0.5} />
          <Pegatina nombre="mono-pastel" ancho={170} className="bottom-0 right-2" />
          <Sticker nombre="telefono" tono="rosa" ancho={86} rot={-10} className="bottom-24 left-5" anim="pop" retraso={0.3} />
          <Sticker nombre="corazon" tono="color" ancho={44} rot={12} className="bottom-52 left-28" anim="pop" retraso={0.6} />
          <Entra>
            <Rescate texto={c.intro_titulo} tam="3.1rem" />
          </Entra>
          <Entra retraso={0.25} className="mt-9 w-[90%]">
            <Nota giro={-2}>
              <p className="f-mano text-[1.456rem] uppercase leading-[28px] opacity-70">Para</p>
              <p className="f-mano text-[2.352rem] leading-[28px]" style={{ color: ROSA }}>{invitado.nombre}</p>
              <p className="f-mano mt-3 text-[1.848rem] uppercase leading-[28px]">{c.b_linea1}</p>
            </Nota>
          </Entra>
        </Capitulo>

        {/* 2 · Humor: nota + globo de diálogo */}
        <Capitulo className="!justify-start !pt-24 !min-h-[900px]">
          <Pegatina nombre="garner-susto" ancho={175} className="right-3 top-6" />
          <Pegatina nombre="mujer-copa" ancho={185} className="bottom-0 left-0" />
          <Sticker nombre="tv" tono="color" ancho={118} rot={6} className="bottom-12 right-4" anim="pop" />
          <Sticker nombre="mariposa" tono="color" ancho={58} rot={-18} className="bottom-72 right-24" anim="pop" retraso={0.4} />
          <Entra className="mt-40 w-[88%]">
            <Nota giro={2}>
              <p className="f-mano text-[1.848rem] uppercase leading-[28px]">{c.b_linea2}</p>
            </Nota>
          </Entra>
          <Entra retraso={0.2} className="mt-14 w-[92%]">
            <Dialogo>
              <p className="f-cond text-[1.68rem] font-bold leading-[1.15]">{c.b_linea3.replace('{invitadas}', invitadas)}</p>
            </Dialogo>
          </Entra>
        </Capitulo>

        {/* 3 · Estás invitada a mis 30 (globo foil con la foto) */}
        <Capitulo className="!justify-start !pt-28 !min-h-[900px]">
          <Pegatina nombre="going-on-30" ancho={165} rot={-8} className="left-1 top-6" anim="pop" />
          <Pegatina nombre="treinta-brillando" ancho={140} rot={8} className="right-2 top-8" anim="pop" retraso={0.2} />
          <Pegatina nombre="nena-brindis" ancho={185} className="bottom-0 right-1" />
          <Sticker nombre="copas" tono="color" ancho={100} rot={-8} className="bottom-24 left-3" anim="pop" retraso={0.4} />
          <Entra className="mt-32">
            <p className="f-mano -rotate-3 text-[2.128rem] uppercase leading-none" style={{ color: ROSA, textShadow: '0 2px 0 #fff' }}>Estás {invitada} a mis</p>
          </Entra>
          <Entra retraso={0.2} className="mt-2">
            <Foil numero={c.bienvenida_numero} foto={c.portada_url} />
          </Entra>
          <Escribe className="f-firma -mt-1 text-[4.6rem] leading-none" retraso={0.9} dur={1.6}>
            <span style={{ color: ROSA, textShadow: '0 2px 0 #fff' }}>{c.festejado}</span>
          </Escribe>
        </Capitulo>

        <Cinta texto={c.cinta_texto} fondo={ROSA} color="#ffffff" />

        {/* 4 · Fecha, hora y lugar */}
        <Capitulo className="!justify-start !pt-24">
          <Banderines />
          <Entra className="mt-24 w-[90%]">
            <Nota giro={-1.5} className="text-center">
              {f && (
                <>
                  <p className="f-mano text-[2.128rem] uppercase leading-[28px]">{f.dia}</p>
                  <p className="f-mano mt-1 text-[4.6rem] leading-[56px]" style={{ color: ROSA, textShadow: '0 2px 0 #fff' }}>{f.numero}</p>
                  <p className="f-mano text-[2.576rem] uppercase leading-[34px]" style={{ color: ROSA, textShadow: '0 2px 0 #fff' }}>{f.mes}</p>
                  <p className="mx-auto mt-3 w-fit rounded-full px-5 py-1 f-mano text-[1.904rem] leading-[34px] text-white" style={{ background: MALVA }}>{f.hora}</p>
                  <Sticker nombre="reloj" tono="color" ancho={70} rot={-12} className="bottom-[3.2rem] left-[6%] z-[3]" anim="pop" />
                </>
              )}
              <a href="#confirmar" className="f-mano mt-4 block text-[1.344rem] uppercase underline underline-offset-4">Confirmar asistencia!!</a>
            </Nota>
          </Entra>
          <Entra retraso={0.2} className="mt-12 w-[90%]">
            <Nota giro={1.5} className="text-center">
              <p className="f-mano text-[2.128rem] uppercase leading-[28px]">Lugar</p>
              <p className="f-mano mt-1 text-[1.792rem] leading-[28px]">{c.lugar_nombre}</p>
              {c.lugar_direccion && <p className="f-mano text-[1.4rem] leading-[28px] opacity-75">{c.lugar_direccion}</p>}
              {c.lugar_foto_url && (
                <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Ver el lugar en el mapa" className="relative mt-24 block">
                  <Pegatina nombre="perro-lentes" ancho={125} rot={7} className="-top-[7.2rem] right-2" />
                  <Polaroid src={c.lugar_foto_url} giro={-1.5} ancha className="relative mx-auto w-[96%]" />
                </a>
              )}
              <a href={maps} target="_blank" rel="noopener noreferrer" className="boton f-mano mt-5 inline-block rounded-full px-7 py-2.5 text-[1.512rem] uppercase text-white" style={{ background: ROSA }}>Cómo llegar</a>
              {c.waze_url && <a href={c.waze_url} target="_blank" rel="noopener noreferrer" className="boton f-mano ml-2 mt-5 inline-block rounded-full border-2 px-6 py-2 text-[1.4rem] uppercase" style={{ borderColor: TINTA }}>Waze</a>}
            </Nota>
          </Entra>
          <Entra retraso={0.15} className="mt-12 w-[92%]">
            <Nota giro={-1} cinta={false}>
              <Cuenta fechaHora={c.fecha_hora} />
            </Nota>
          </Entra>
        </Capitulo>

        {/* 5 · Código de vestimenta */}
        <Capitulo className="!justify-start !pt-28 !min-h-[880px]">
          <Pegatina nombre="nena-corona" ancho={170} rot={5} className="right-2 top-6" />
          <Pegatina nombre="mono-globos" ancho={205} className="bottom-0 right-0" />
          <Sticker nombre="tacon" tono="rosa" ancho={126} rot={-8} className="bottom-24 left-1" anim="pop" />
          <Sticker nombre="tacon" tono="rosa" ancho={126} rot={8} espejo className="bottom-20 left-[26%]" />
          <Entra className="mt-44 w-[90%]">
            <Nota giro={1.5} className="text-center">
              <p className="f-mano text-[1.512rem] uppercase leading-[28px] opacity-75">{c.vestimenta_titulo}</p>
              <p className="f-mano mt-1 text-[2.464rem] uppercase leading-[34px]" style={{ color: ROSA, textShadow: '0 2px 0 #fff' }}>{c.dresscode_titulo}</p>
              {c.dresscode_detalle && <p className="f-mano mt-3 text-[1.4rem] leading-[28px]">({c.dresscode_detalle})</p>}
              {colores.length > 0 && (
                <div className="mt-4 flex justify-center gap-3" aria-hidden>
                  {colores.map((col) => (
                    <span key={col} className="size-11 rounded-full" style={{ background: col, boxShadow: `0 0 0 2px ${TINTA}, 0 6px 8px -4px rgb(0 0 0 / 0.4)` }} />
                  ))}
                </div>
              )}
            </Nota>
          </Entra>
        </Capitulo>

        {fotos.length > 0 && (
          <Capitulo>
            <Entra className="w-full">
              {c.galeria_titulo && <p className="f-mano mb-6 text-[2.912rem] uppercase leading-none" style={{ color: ROSA, textShadow: '0 2px 0 #fff' }}>{c.galeria_titulo}</p>}
              <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                {fotos.map((u, k) => (
                  <Polaroid key={u + k} src={u} giro={[-3, 2.5, 2, -2.5][k % 4]} className={k % 2 ? 'mt-6' : ''} cinta />
                ))}
              </div>
            </Entra>
          </Capitulo>
        )}

        {/* 6 · Te espero + confirmación */}
        <Capitulo className="!justify-start !pt-28">
          <Banderines />
          <Sticker nombre="megafono" tono="color" ancho={104} rot={-12} className="left-1 top-[15%]" anim="pop" />
          <Sticker nombre="champan" tono="color" ancho={92} rot={14} className="right-3 top-[17%]" anim="pop" retraso={0.2} />
          <Entra className="mt-52 flex flex-col items-center gap-3">
            <span className="f-cond rounded-full px-7 py-2 text-[2.24rem] font-bold uppercase tracking-wide text-white" style={{ background: ROSA, boxShadow: '0 8px 12px -8px rgb(60 20 40 / 0.7)' }}>¡Te espero!</span>
            <span className="f-cond rounded-full px-6 py-1.5 text-[1.68rem] font-bold uppercase tracking-wide" style={{ background: MALVA, color: TINTA }}>No faltes…</span>
          </Entra>
          {c.b_final_humor && (
            <Entra retraso={0.2} className="mt-8">
              <p className="f-mano text-[1.904rem] uppercase leading-tight">{c.b_final_humor}</p>
              <Flechas />
            </Entra>
          )}
          <Entra retraso={0.1} className="mt-3 w-full">
            <Nota giro={-1} className="text-left">
              <div id="confirmar" className="scroll-mt-6">
                <p className="f-mano text-center text-[2.576rem] leading-[34px]" style={{ color: ROSA }}>{invitado.nombre}</p>
                <div className="mt-5">
                  <Rsvp token={invitado.token} cupos={invitado.cupos} limite={limite} inicial={{ estado: invitado.estado, asistentes: invitado.asistentes, mensaje: invitado.mensaje }} />
                </div>
              </div>
            </Nota>
          </Entra>
          {(lista || alterno) && (
            <Entra retraso={0.1} className="mt-10 grid w-full gap-5">
              {lista && (
                <a href={`/playlist?t=${invitado.token}`} className="boton block">
                  <Nota giro={1.5} className="text-center">
                    <span className="f-mano block text-[1.792rem] uppercase leading-[28px]">{c.playlist_titulo}</span>
                    <span className="f-mano mt-1 block text-[1.344rem] leading-[26px] opacity-75">{c.playlist_mensaje}</span>
                    <span className="f-mano mt-3 inline-block rounded-full px-5 py-1.5 text-[1.4rem] uppercase text-white" style={{ background: ROSA }}>Pedir mis canciones</span>
                  </Nota>
                </a>
              )}
              {alterno && (
                <a href={`/fotos?t=${invitado.token}`} className="boton block">
                  <Nota giro={-1.5} className="text-center">
                    <span className="f-mano block text-[1.792rem] uppercase leading-[28px]">{c.fotos_titulo}</span>
                    <span className="f-mano mt-1 block text-[1.344rem] leading-[26px] opacity-75">{c.fotos_mensaje}</span>
                    <span className="f-mano mt-3 inline-block rounded-full px-5 py-1.5 text-[1.4rem] uppercase text-white" style={{ background: ROSA }}>Ir a las fotos</span>
                  </Nota>
                </a>
              )}
            </Entra>
          )}
          <Sticker nombre="coctel" tono="color" ancho={86} rot={-8} className="bottom-10 left-5" anim="pop" />
          <Sticker nombre="cereza" tono="color" ancho={56} rot={16} className="bottom-24 right-8" anim="pop" retraso={0.3} />
          <Pegatina nombre="hamster-pastel" ancho={150} className="-bottom-1 left-1/2 -ml-[75px]" />
          <div className="h-52 w-full" aria-hidden />
        </Capitulo>

        <Musica url={c.musica_url} titulo={c.musica_titulo} apiRef={musica} />
      </div>
    </Listo.Provider>
  );
}
