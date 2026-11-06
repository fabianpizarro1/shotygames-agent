'use client';

import { AnimatePresence, motion } from 'motion/react';
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Config } from '@/lib/config';
import { piezasFecha } from '@/lib/fechas';
import { Cuenta } from './Cuenta';
import { Brillo, Confeti, Humo, Pegatina, Sticker } from './Decor';
import { Musica, type MusicaApi } from './Musica';
import { Rsvp } from './Rsvp';
import { Sobre } from './Sobre';
import { Polaroid } from './Stickers';

// Invitación en capítulos tipo historia (blanco, negro y plata), inspirada en la plantilla
// "RIP 20s". Cada capítulo tiene su propio "protagonista" para que no se vea repetido:
//   1 invitación + RIP 20s (globos, bola disco)   2 brindis (foto con cinta, confeti)
//   3 bienvenida a los 30 (corona)                4 fecha y lugar (lentes, foto)
//   5 vestimenta (tacones, fondo rosado)          6 confirmación (globos y bola, cierre)

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

// Mientras la portada está cerrada los textos esperan, para que no terminen de animarse debajo.
const Listo = createContext(true);

const SUAVE = [0.22, 1, 0.36, 1] as const;

function Entra({ children, retraso = 0, className = '' }: { children: ReactNode; retraso?: number; className?: string }) {
  const listo = useContext(Listo);
  return (
    <motion.div
      className={`relative z-[2] ${className}`}
      initial="off"
      animate={listo ? undefined : 'off'}
      whileInView={listo ? 'on' : undefined}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.65, ease: SUAVE, delay: retraso }}
    >
      {children}
    </motion.div>
  );
}

// Efecto "escrito a mano": el texto se destapa de izquierda a derecha. El detector de visibilidad
// va en un envoltorio sin recorte: un elemento recortado por completo con clip-path nunca se
// detecta como visible y su animación no arrancaría.
function Escribe({ children, className = '', retraso = 0, dur = 1.4 }: { children: ReactNode; className?: string; retraso?: number; dur?: number }) {
  const listo = useContext(Listo);
  return (
    <motion.span
      className={`relative z-[2] inline-block ${className}`}
      initial="off"
      animate={listo ? undefined : 'off'}
      whileInView={listo ? 'on' : undefined}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      variants={{ off: {}, on: {} }}
    >
      <motion.span
        className="inline-block"
        variants={{
          off: { clipPath: 'inset(-60% 101% -60% -20%)', opacity: 0 },
          on: { clipPath: 'inset(-60% -30% -60% -20%)', opacity: 1 },
        }}
        transition={{ duration: dur, ease: 'easeOut', delay: retraso }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

function Capitulo({ children, fondo, className = '' }: { children: ReactNode; fondo?: string; className?: string }) {
  return (
    <section
      className={`relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center overflow-x-clip px-8 py-24 text-center ${className}`}
      style={fondo ? { background: fondo } : undefined}
    >
      {children}
    </section>
  );
}

// Cinta de texto que se desplaza, a todo el ancho de la pantalla (separa los capítulos).
function Cinta({ texto }: { texto: string }) {
  if (!texto.trim()) return null;
  const mitad = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className="px-5">{texto}<span className="pl-5 opacity-60">✦</span></span>
  ));
  return (
    <div aria-hidden className="relative z-[3] -my-2 w-full -rotate-1 overflow-hidden bg-black py-2.5 shadow-[0_6px_14px_-6px_rgb(0_0_0/0.6)]">
      <div className="marquesina f-cond flex w-max whitespace-nowrap text-[13px] font-bold tracking-[0.35em] text-white">
        <div className="flex">{mitad}</div>
        <div className="flex">{mitad}</div>
      </div>
    </div>
  );
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

  // Marca "abierto" una sola vez por sesión (alimenta las estadísticas del panel).
  useEffect(() => {
    try {
      const k = `abierto-${invitado.token}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {}
    fetch('/api/abierto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invitado.token }) }).catch(() => {});
  }, [invitado.token]);

  const tema = { '--fondo': c.color_fondo, '--fondo2': c.color_fondo_2, '--papel': c.color_papel, '--texto': c.color_texto, '--acento': c.color_acento } as CSSProperties;

  const invitada = invitado.genero === 'M' ? 'invitado' : 'invitada';
  const f = piezasFecha(c.fecha_hora);
  const maps = c.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.lugar_nombre, c.lugar_direccion].filter(Boolean).join(' '))}`;
  const itinerario = c.itinerario
    .split('\n')
    .map((l) => l.split('|'))
    .filter((p) => p.length >= 2 && p[1].trim())
    .map(([hora, texto]) => [hora.trim(), texto.trim()]);
  const fotos = c.galeria_fotos.split('\n').map((u) => u.trim()).filter(Boolean);
  const colores = c.dresscode_colores.split(',').map((x) => x.trim()).filter((x) => /^#[0-9a-f]{3,8}$/i.test(x));
  const bn = c.foto_bn.trim().toLowerCase() !== 'no';
  const rip = c.rip_numero.match(/^(\d+)(.*)$/);
  const ripBase = rip ? rip[1] : c.rip_numero;
  const ripSufijo = rip ? rip[2] : '';
  const limite = c.fecha_limite_rsvp && !Number.isNaN(new Date(c.fecha_limite_rsvp).getTime())
    ? new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', timeZone: 'America/Guayaquil' }).format(new Date(c.fecha_limite_rsvp))
    : '';
  const wa = c.contacto_whatsapp.replace(/\D/g, '');
  const telVisible = wa.startsWith('593') ? `0${wa.slice(3)}` : wa;
  const alterno = c.fotos_activas.trim().toLowerCase() !== 'no';
  const lista = c.playlist_activa.trim().toLowerCase() !== 'no';
  // El capítulo del código de vestimenta se tiñe del primer color del código (rosa, en este caso).
  const tinte = colores[0] ? `color-mix(in srgb, ${colores[0]} 50%, var(--fondo))` : '';
  const fondoVestimenta = tinte ? `linear-gradient(to bottom, transparent 0%, ${tinte} 18%, ${tinte} 82%, transparent 100%)` : undefined;

  return (
    <Listo.Provider value={!portada}>
      <div style={tema} className="rayas min-h-dvh overflow-x-hidden">
        <AnimatePresence>
          {portada && (
            <Sobre nombre={invitado.nombre} inicial={(c.festejado.trim()[0] ?? 'J').toUpperCase()} numero={c.rip_numero} onAbrir={() => musica.current?.reproducir()} onListo={() => setPortada(false)} />
          )}
        </AnimatePresence>

        {/* 1 · Invitación + RIP 20s (globos y bola disco) */}
        <Capitulo className="!min-h-[1040px]">
          <Humo />
          <Pegatina nombre="globos-rosa" ancho={150} rot={-6} className="-left-3 top-4" anim="flota" />
          <Pegatina nombre="disco-estrellas" ancho={215} rot={6} className="-right-14 top-0" anim="flota" retraso={0.6} />
          <Pegatina nombre="mono-pastel" ancho={172} base className="bottom-0 right-3" />
          <Pegatina nombre="ticket-birthday" ancho={150} rot={-7} className="bottom-8 left-3" />
          <Brillo tam={22} className="text-black" style={{ left: '16%', top: '32%' }} />
          <Brillo tam={15} className="text-black/70" style={{ right: '18%', bottom: '16%' }} retraso={1} />
          <Brillo tam={18} className="text-black/80" style={{ left: '8%', bottom: '22%' }} retraso={0.5} />

          <Entra className="mt-28">
            <p className="f-cond text-[11px] font-medium tracking-[0.4em] opacity-60">Para</p>
            <p className="f-cond mt-1 text-sm font-bold tracking-[0.2em]">{invitado.nombre}</p>
          </Entra>
          <div className="mt-16 flex flex-col items-center">
            <Escribe className="f-script text-[1.9rem] leading-tight" retraso={0.2}>{c.intro_linea}</Escribe>
            <Escribe className="f-firma -mt-1 text-[5.4rem] leading-[0.95]" retraso={0.9} dur={1.8}>{c.intro_titulo}</Escribe>
          </div>
          <Entra retraso={0.3} className="mt-9">
            <div className="flex items-end justify-center gap-1">
              <span className="f-serif pb-3 text-[3rem] font-black leading-none tracking-wide">RIP</span>
              <span className="globo-num text-[8.4rem]" data-t={ripBase}>{ripBase}</span>
              {ripSufijo && <span className="f-serif mb-4 text-xl font-bold">{ripSufijo}</span>}
            </div>
            <p className="f-cond mx-auto mt-4 max-w-[16rem] text-[1.3rem] font-bold leading-[1.15]">{c.rip_texto.replace('{invitada}', invitada)}</p>
          </Entra>
        </Capitulo>

        {/* 2 · Brindis (foto con cinta, confeti: alegre) */}
        <Capitulo className="!pb-44">
          <Confeti cantidad={28} />
          <Pegatina nombre="nena-brindis" ancho={172} base className="bottom-0 right-2" />
          <Sticker nombre="copas" tono="plata" ancho={130} rot={-12} className="left-2 top-[7%]" anim="flota" />
          <Pegatina nombre="labios-rojos" ancho={96} rot={12} className="right-4 top-[9%]" />
          <Brillo tam={20} className="text-black" style={{ right: '16%', top: '34%' }} />
          <Brillo tam={15} className="text-black/70" style={{ left: '9%', top: '52%' }} retraso={1.1} />
          <Brillo tam={18} className="text-black/80" style={{ left: '14%', bottom: '14%' }} retraso={0.5} />
          <Brillo tam={13} className="text-black/60" style={{ right: '10%', bottom: '22%' }} retraso={1.6} />
          <div className="mt-20">
            <Escribe className="f-script text-[3.6rem] leading-none">{c.brindis_titulo}</Escribe>
          </div>
          {c.portada_url ? (
            <Entra retraso={0.25} className="mt-9 w-full">
              <Polaroid src={c.portada_url} giro={3} bn={bn} cinta className="mx-auto w-[74%]" />
            </Entra>
          ) : (
            <div className="relative mt-9 h-40 w-full" aria-hidden>
              <Sticker nombre="copas" tono="plata" ancho={130} rot={-6} className="left-1/2 -ml-[65px]" anim="flota" />
            </div>
          )}
          {c.brindis_texto && (
            <Entra retraso={0.4} className="mt-9">
              <p className="f-cond mx-auto max-w-[16rem] text-[1.2rem] font-bold leading-[1.2]">{c.brindis_texto}</p>
            </Entra>
          )}
        </Capitulo>

        {/* 3 · Bienvenida a los 30 (corona) */}
        <Capitulo>
          <Pegatina nombre="treinta-29" ancho={190} rot={-6} className="left-2 top-[4%]" anim="flota" />
          <Pegatina nombre="going-on-30" ancho={150} rot={8} className="right-3 top-[12%]" />
          <Pegatina nombre="garner-susto" ancho={190} base className="bottom-0 right-0" />
          <Sticker nombre="corona" tono="plata" ancho={150} rot={-3} className="bottom-8 left-3" anim="flota" />
          <Brillo tam={22} className="text-black" style={{ right: '14%', top: '36%' }} />
          <Brillo tam={16} className="text-black/70" style={{ left: '12%', top: '46%' }} retraso={0.9} />
          <Brillo tam={20} className="text-black" style={{ left: '14%', bottom: '24%' }} retraso={1.5} />
          <Brillo tam={14} className="text-black/70" style={{ right: '12%', bottom: '30%' }} retraso={0.3} />
          <Entra>
            <p className="f-serif mx-auto max-w-[13rem] text-[1.05rem] leading-snug">{c.bienvenida_linea}</p>
          </Entra>
          <Escribe className="f-script mt-1 text-[3.6rem] leading-none" retraso={0.3}>{c.bienvenida_palabra}</Escribe>
          <Entra retraso={0.4}>
            <p className="f-serif mt-1 text-[1.05rem]">a los</p>
          </Entra>
          <Entra retraso={0.5} className="relative mt-1">
            <Pegatina nombre="gorro-rojo" ancho={92} rot={18} className="-top-9 right-5 z-[3]" />
            <span className="globo-num text-[12rem]" data-t={c.bienvenida_numero}>{c.bienvenida_numero}</span>
            <Escribe className="f-firma absolute inset-x-0 bottom-1 text-[4.2rem] leading-none" retraso={1.1} dur={1.6}>
              <span style={{ color: '#fff', textShadow: '0 2px 0 #000, 0 0 14px rgb(0 0 0 / 0.75)' }}>{c.festejado}</span>
            </Escribe>
          </Entra>
        </Capitulo>

        <Cinta texto={c.cinta_texto} />

        {/* 4 · Fecha y lugar (lentes, foto del sitio) */}
        <Capitulo>
          <Sticker nombre="martini" tono="plata" ancho={68} rot={8} className="left-3 top-[6%]" anim="flota" retraso={0.7} />
          <Brillo tam={20} className="text-black" style={{ left: '18%', top: '22%' }} />
          <Brillo tam={14} className="text-black/70" style={{ right: '8%', top: '44%' }} retraso={1} />
          <Entra>
            <p className="f-cond mx-auto max-w-[14rem] text-[0.95rem] font-medium leading-snug opacity-80">{c.fecha_linea}</p>
          </Entra>
          {f && (
            <Entra retraso={0.15} className="mt-5">
              <div className="flex items-center justify-center gap-3">
                <div className="f-script text-[3.1rem] leading-[0.85]">
                  <p>{f.dia}</p>
                  <p>{f.mes}</p>
                </div>
                <span className="f-serif text-[6.2rem] font-black leading-none" style={{ fontVariantNumeric: 'lining-nums' }}>{f.numero}</span>
              </div>
              <div className="mx-auto mt-4 w-64 border-y border-black py-1.5">
                <span className="f-serif text-[1.5rem] tracking-[0.35em]" style={{ fontVariantNumeric: 'lining-nums' }}>{f.hora}</span>
              </div>
              {c.hora_fin_texto && <p className="mt-2 text-xs opacity-70">{c.hora_fin_texto}</p>}
            </Entra>
          )}
          <Entra retraso={0.3} className="mt-7">
            <p className="f-cond text-[1.5rem] font-bold leading-none">Lugar</p>
            <p className="f-serif mx-auto mt-2 max-w-[17rem] text-[1.15rem] font-bold leading-tight">{c.lugar_nombre}</p>
            {c.lugar_direccion && <p className="mt-1 text-sm opacity-75">{c.lugar_direccion}</p>}
            {c.lugar_foto_url && (
              <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Ver el lugar en el mapa" className="relative mt-32 block">
                <Pegatina nombre="perro-lentes" ancho={120} rot={7} className="-top-[7rem] right-3" />
                <Polaroid src={c.lugar_foto_url} giro={-1.5} ancha className="relative mx-auto w-[92%]" />
              </a>
            )}
            <div className="mt-5 flex flex-col items-center gap-2.5">
              <a href={maps} target="_blank" rel="noopener noreferrer" className="boton f-cond rounded-full bg-black px-7 py-3 text-xs font-bold tracking-[0.3em] text-white">Cómo llegar</a>
              {c.waze_url && <a href={c.waze_url} target="_blank" rel="noopener noreferrer" className="boton f-cond rounded-full border border-black px-6 py-2.5 text-xs font-bold tracking-[0.3em]">Abrir en Waze</a>}
            </div>
          </Entra>
          <Entra retraso={0.15} className="mt-32 w-full">
            <div className="relative">
              <Pegatina nombre="mujer-copa" ancho={150} rot={-4} className="-top-[6.8rem] left-4" />
              <div className="papel relative rounded-sm p-5">
                <Cuenta fechaHora={c.fecha_hora} />
              </div>
            </div>
          </Entra>
        </Capitulo>

        {/* 5 · Código de vestimenta (tacones, fondo rosado) */}
        <Capitulo fondo={fondoVestimenta}>
          <Sticker nombre="mono" tono="negro" ancho={92} rot={-14} className="left-3 top-[3%]" anim="balanceo" />
          <Pegatina nombre="nena-corona" ancho={170} rot={5} className="right-2 top-[5%]" />
          <Pegatina nombre="treinta-brillando" ancho={118} rot={-8} className="left-2 top-[14%]" />
          <Pegatina nombre="mono-globos" ancho={200} base className="bottom-0 right-0" />
          <Sticker nombre="tacon" tono="negro" ancho={130} rot={-6} className="bottom-24 left-[1%]" />
          <Sticker nombre="tacon" tono="negro" ancho={130} rot={6} espejo className="bottom-20 left-[27%]" />
          <Brillo tam={22} className="text-black" style={{ right: '12%', top: '14%' }} />
          <Brillo tam={16} className="text-black/70" style={{ left: '12%', top: '44%' }} retraso={1} />
          <Brillo tam={18} className="text-black/80" style={{ right: '9%', bottom: '34%' }} retraso={0.5} />
          <Entra>
            <p className="f-cond text-[0.95rem] font-medium opacity-80">{c.vestimenta_titulo}</p>
            <p className="f-cond mx-auto mt-2 max-w-[17rem] text-[2.6rem] font-bold leading-[1.02]">{c.dresscode_titulo}</p>
            {c.dresscode_detalle && <p className="mx-auto mt-4 max-w-[15rem] text-sm leading-snug opacity-80">({c.dresscode_detalle})</p>}
            {colores.length > 0 && (
              <div className="mt-8 flex justify-center gap-3" aria-hidden>
                {colores.map((col) => (
                  <span key={col} className="size-12 rounded-full" style={{ background: col, boxShadow: '0 0 0 1.5px #111, 0 8px 10px -4px rgb(0 0 0 / 0.4)' }} />
                ))}
              </div>
            )}
          </Entra>
        </Capitulo>

        {/* Programa y momentos (solo si hay) */}
        {(itinerario.length > 0 || fotos.length > 0) && (
          <Capitulo>
            {itinerario.length > 0 && (
              <Entra className="w-full">
                <p className="f-script mb-5 text-5xl leading-none">Programa</p>
                <ul className="mx-auto max-w-[17rem] space-y-3 text-left">
                  {itinerario.map(([hora, texto]) => (
                    <li key={hora + texto} className="flex items-baseline gap-4 border-b border-black/20 pb-2">
                      <span className="f-serif w-16 shrink-0 text-right text-lg font-bold tabular-nums">{hora}</span>
                      <span className="f-cond text-sm font-medium">{texto}</span>
                    </li>
                  ))}
                </ul>
              </Entra>
            )}
            {fotos.length > 0 && (
              <Entra className={`w-full ${itinerario.length ? 'mt-14' : ''}`}>
                {c.galeria_titulo && <p className="f-script mb-6 text-5xl leading-none">{c.galeria_titulo}</p>}
                <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                  {fotos.map((u, k) => (
                    <Polaroid key={u + k} src={u} giro={[-3, 2.5, 2, -2.5][k % 4]} className={k % 2 ? 'mt-6' : ''} bn={bn} />
                  ))}
                </div>
              </Entra>
            )}
          </Capitulo>
        )}

        {/* 6 · Invita, te espero y confirmación (globos y bola: cierra como abrió) */}
        <Capitulo className="!justify-start">
          <Confeti cantidad={16} />
          <Pegatina nombre="globos-rosa" ancho={128} rot={-6} className="-left-2 top-3" anim="flota" />
          <Pegatina nombre="disco-estrellas" ancho={180} rot={6} className="-right-11 top-0" anim="flota" retraso={0.6} />
          <Pegatina nombre="hamster-pastel" ancho={140} base className="bottom-0 left-1/2 -ml-[70px]" />
          <Pegatina nombre="treinta-coqueta" ancho={132} rot={-6} className="bottom-6 left-1" />
          <Pegatina nombre="hecha-90s" ancho={132} rot={5} className="bottom-10 right-1" />
          <Humo lado="abajo" />
          <Brillo tam={18} className="text-black" style={{ left: '30%', top: '9%' }} />
          <div className="mt-48 flex flex-col items-center">
            {c.invita_titulo && <Escribe className="f-script text-[3rem] leading-[0.95]">{c.invita_titulo}</Escribe>}
            {c.regalos_texto && (
              <Entra retraso={0.3}>
                <p className="f-cond mx-auto mt-5 max-w-[16rem] text-[1.4rem] font-bold leading-[1.1]">{c.regalos_texto}</p>
              </Entra>
            )}
            {c.mensaje && (
              <Entra retraso={0.45}>
                <p className="mx-auto mt-3 max-w-[15rem] text-sm leading-snug opacity-80">{c.mensaje}</p>
              </Entra>
            )}
          </div>
          <div className="mt-12">
            <Escribe className="f-script text-[4rem] leading-none">{c.final_titulo}</Escribe>
            <Entra retraso={0.3}>
              <p className="f-cond mx-auto mt-3 max-w-[14rem] text-[1.3rem] font-bold leading-tight">{c.final_texto}</p>
            </Entra>
          </div>

          <Entra retraso={0.15} className="mt-8 w-full">
            <div id="confirmar" className="papel scroll-mt-6 rounded-sm p-6 text-left">
              <p className="f-script text-center text-[2.6rem] leading-none">{invitado.nombre}</p>
              <div className="mt-5">
                <Rsvp
                  token={invitado.token}
                  cupos={invitado.cupos}
                  limite={limite}
                  inicial={{ estado: invitado.estado, asistentes: invitado.asistentes, restricciones: invitado.restricciones, mensaje: invitado.mensaje }}
                />
              </div>
            </div>
          </Entra>

          {(lista || alterno) && (
            <Entra retraso={0.1} className="mt-8 grid w-full gap-3">
              {lista && (
                <a href={`/playlist?t=${invitado.token}`} className="boton papel block rounded-sm p-5 text-center">
                  <span className="f-cond block text-base font-bold tracking-[0.2em]">{c.playlist_titulo}</span>
                  <span className="mt-1 block text-xs opacity-70">{c.playlist_mensaje}</span>
                  <span className="f-cond mt-3 inline-block rounded-full bg-black px-5 py-2 text-[11px] font-bold tracking-[0.3em] text-white">Pedir mis canciones</span>
                </a>
              )}
              {alterno && (
                <a href={`/fotos?t=${invitado.token}`} className="boton papel block rounded-sm p-5 text-center">
                  <span className="f-cond block text-base font-bold tracking-[0.2em]">{c.fotos_titulo}</span>
                  <span className="mt-1 block text-xs opacity-70">{c.fotos_mensaje}</span>
                  <span className="f-cond mt-3 inline-block rounded-full bg-black px-5 py-2 text-[11px] font-bold tracking-[0.3em] text-white">Ir a las fotos</span>
                </a>
              )}
            </Entra>
          )}

          {wa && (
            <Entra className="mt-8">
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4">¿Dudas? Escríbeme al {telVisible}</a>
            </Entra>
          )}
          <div className="h-56 w-full" aria-hidden />
        </Capitulo>

        <Musica url={c.musica_url} titulo={c.musica_titulo} apiRef={musica} />
      </div>
    </Listo.Provider>
  );
}
