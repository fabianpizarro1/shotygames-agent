'use client';

import { AnimatePresence } from 'motion/react';
import type { CSSProperties } from 'react';
import type { Config } from '@/lib/config';
import { nombreBonito, tamNombre } from '@/lib/nombre';
import { partes, piezasFecha } from '@/lib/fechas';
import { Capitulo, Entra, Escribe, Listo } from './anim';
import { Divisor, Rama } from './Boda';
import { Cuenta } from './Cuenta';
import { Brillo } from './Decor';
import { Musica } from './Musica';
import { Rsvp } from './Rsvp';
import { Sobre } from './Sobre';
import { Polaroid } from './Stickers';
import { useInvitacionBase, type InvitadoVista } from './useInvitacionBase';

// Plantilla de boda: marfil y dorado, nombres en letra elegante, historia con foto en arco, ceremonia y
// recepción, código de vestimenta, programa, regalos y confirmación. Mismo motor que la de cumpleaños
// (vista previa en vivo, sobre con sello, música, RSVP, fotos y playlist), distinta composición.

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const dorado = 'color-mix(in srgb, var(--acento) 78%, var(--texto))';

const Rotulo = ({ children }: { children: React.ReactNode }) => (
  <p className="f-garamond text-[0.95rem] font-semibold uppercase tracking-[0.34em] opacity-70">{children}</p>
);

export function InvitacionBoda({ config, invitado, vistaPrevia = false, volver = false, soloLectura = false }: { config: Config; invitado: InvitadoVista; vistaPrevia?: boolean; volver?: boolean; soloLectura?: boolean }) {
  const { c, portada, setPortada, musica, estadoRsvp, setEstadoRsvp } = useInvitacionBase({ config, invitado, vistaPrevia, volver, soloLectura });

  const colorOk = (v: string) => (/^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim() : undefined);
  const tema = { '--fondo': c.color_fondo, '--fondo2': c.color_fondo_2, '--papel': c.color_papel, '--texto': c.color_texto, '--texto-base': c.color_texto, '--acento': c.color_acento } as CSSProperties;

  const novia = c.novia.trim();
  const novio = c.novio.trim();
  const iniciales = `${(novia[0] ?? 'A').toUpperCase()}&${(novio[0] ?? 'B').toUpperCase()}`;
  const p = partes(c.fecha_hora);
  const f = piezasFecha(c.fecha_hora);
  const fechaCorta = p ? `${String(p.d).padStart(2, '0')} · ${MESES[p.mo - 1]} · ${p.y}` : '';
  const maps = c.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.lugar_nombre, c.lugar_direccion].filter(Boolean).join(' '))}`;
  const mapsRecepcion = c.recepcion_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.recepcion_lugar, c.recepcion_direccion].filter(Boolean).join(' '))}`;
  const hayRecepcion = c.recepcion_activa.trim().toLowerCase() !== 'no' && c.recepcion_lugar.trim() !== '';
  const itinerario = c.itinerario
    .split('\n')
    .map((l) => l.split('|'))
    .filter((q) => q.length >= 2 && q[1].trim())
    .map(([hora, texto]) => [hora.trim(), texto.trim()]);
  const fotos = c.galeria_fotos.split('\n').map((u) => u.trim()).filter(Boolean);
  const colores = c.dresscode_colores.split(',').map((x) => x.trim()).filter((x) => /^#[0-9a-f]{3,8}$/i.test(x));
  const limite = c.fecha_limite_rsvp && !Number.isNaN(new Date(c.fecha_limite_rsvp).getTime())
    ? new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', timeZone: 'America/Guayaquil' }).format(new Date(c.fecha_limite_rsvp))
    : '';
  const alterno = c.fotos_activas.trim().toLowerCase() !== 'no';
  const lista = c.playlist_activa.trim().toLowerCase() !== 'no';
  const soloConfirmados = c.extras_solo_confirmados.trim().toLowerCase() !== 'no';
  const hayExtras = (lista || alterno) && (!soloConfirmados || vistaPrevia || estadoRsvp === 'confirmado');
  const tinte = colores[0] ? `color-mix(in srgb, ${colores[0]} 42%, var(--fondo))` : '';
  const fondoVestimenta = tinte ? `linear-gradient(to bottom, transparent 0%, ${tinte} 18%, ${tinte} 82%, transparent 100%)` : undefined;
  const nombreGuest = nombreBonito(invitado.nombre);
  const wa = c.contacto_whatsapp.replace(/\D/g, '');
  const sobre = c.sobre_texto.replace('{novia}', novia).replace('{novio}', novio).replace('{festejado}', `${novia} & ${novio}`).trim();

  const botonOscuro = 'boton f-garamond inline-block rounded-full px-7 py-3 text-[0.95rem] font-semibold uppercase tracking-[0.28em]';
  const estiloBoton: CSSProperties = { background: 'var(--texto-base)', color: 'var(--papel)' };

  return (
    <Listo.Provider value={!portada}>
      <div style={tema} className={`rayas min-h-dvh overflow-x-clip ${vistaPrevia ? 'vista-previa' : ''}`}>
        <AnimatePresence>
          {portada && (
            <Sobre
              estilo="boda"
              humo={false}
              nombre={invitado.nombre}
              inicial={iniciales}
              colorSello={c.sello_color}
              texto={sobre}
              onAbrir={() => {
                // El toque en el sello es un gesto del usuario: el navegador permite iniciar la música aquí (y solo aquí)
                if (c.musica_autoplay.trim().toLowerCase() !== 'no' && !vistaPrevia) musica.current?.reproducir();
              }}
              onListo={() => setPortada(false)}
            />
          )}
        </AnimatePresence>

        {/* 1 · Portada: los nombres */}
        <Capitulo nombre="inicio" texto={colorOk(c.texto_color_inicio)} className="!min-h-dvh !py-20">
          <Rama className="left-1/2 top-4 w-[210px] -translate-x-1/2" />
          <Brillo tam={16} className="text-(--acento)" style={{ left: '14%', top: '24%' }} />
          <Brillo tam={12} className="text-(--acento)" style={{ right: '16%', bottom: '24%' }} retraso={1} />
          <Entra className="mt-10">
            <Rotulo>Con amor invitamos a</Rotulo>
            <p className="f-cormorant mx-auto mt-2 break-words leading-tight" style={{ fontSize: tamNombre(nombreGuest, 0.42, 38, 24, 290) }}>{nombreGuest}</p>
          </Entra>
          <Entra retraso={0.2} className="mt-7">
            <p className="f-garamond mx-auto max-w-[17rem] text-[1.2rem] leading-snug opacity-85 [text-wrap:balance]">{c.boda_frase}</p>
          </Entra>
          <div className="mt-8 flex flex-col items-center" style={{ color: dorado }}>
            <Escribe className="leading-none" retraso={0.3}>
              <span className="f-elegante block leading-[1.1]" style={{ fontSize: tamNombre(novia, 0.42, 92, 46, 300) }}>{novia}</span>
            </Escribe>
            <span className="f-cormorant my-1 block text-[2.4rem] leading-none opacity-80">&amp;</span>
            <Escribe className="leading-none" retraso={0.9}>
              <span className="f-elegante block leading-[1.1]" style={{ fontSize: tamNombre(novio, 0.42, 92, 46, 300) }}>{novio}</span>
            </Escribe>
          </div>
          {fechaCorta && (
            <Entra retraso={0.5} className="mt-9">
              <Divisor />
              <p className="f-garamond mt-3 whitespace-nowrap text-[1.2rem] font-semibold tracking-[0.2em]">{fechaCorta}</p>
            </Entra>
          )}
        </Capitulo>

        {/* 2 · Nuestra historia: foto en arco */}
        <Capitulo nombre="historia" texto={colorOk(c.texto_color_historia)} className="!min-h-0 !py-20">
          <Escribe className="f-elegante text-[3.4rem] leading-none" retraso={0.1}>{c.historia_titulo}</Escribe>
          <Entra retraso={0.2} className="mt-9 w-full">
            <div className="relative mx-auto w-[70%]">
              <span aria-hidden className="absolute -inset-2 rounded-t-full border" style={{ borderColor: 'color-mix(in srgb, var(--acento) 65%, transparent)' }} />
              {c.portada_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.portada_url} alt="" loading="lazy" decoding="async" className="aspect-[3/4] w-full rounded-t-full object-cover" />
              ) : (
                <div className="grid aspect-[3/4] w-full place-items-center rounded-t-full" style={{ background: 'color-mix(in srgb, var(--acento) 14%, var(--papel))' }}>
                  <span className="f-elegante text-[4.4rem] leading-none" style={{ color: dorado }}>{iniciales.replace('&', ' & ')}</span>
                </div>
              )}
            </div>
          </Entra>
          {c.historia_texto && (
            <Entra retraso={0.3} className="mt-10">
              <p className="f-garamond mx-auto max-w-[18rem] text-[1.25rem] leading-relaxed opacity-90 [text-wrap:pretty]">{c.historia_texto}</p>
            </Entra>
          )}
        </Capitulo>

        {/* 3 · Fecha, ceremonia y recepción */}
        <Capitulo nombre="fecha" texto={colorOk(c.texto_color_fecha)} className="!min-h-0 !py-20">
          <Entra>
            <Rotulo>{c.fecha_linea}</Rotulo>
          </Entra>
          {f && (
            <Entra retraso={0.15} className="mt-5">
              <div className="flex items-center justify-center gap-4">
                <div className="f-elegante text-right text-[2.6rem] leading-[0.95]" style={{ color: dorado }}>
                  <p>{f.dia}</p>
                  <p>{f.mes}</p>
                </div>
                <span className="f-serif text-[6.2rem] font-medium leading-none" style={{ fontVariantNumeric: 'lining-nums' }}>{f.numero}</span>
              </div>
              <p className="f-garamond mt-2 text-[1.15rem] font-semibold tracking-[0.3em]">{p?.y}</p>
            </Entra>
          )}

          <Entra retraso={0.2} className="mt-12 w-full">
            <Divisor />
            <p className="f-elegante mt-4 text-[2.8rem] leading-none" style={{ color: dorado }}>{c.ceremonia_titulo}</p>
            {f && <p className="f-garamond mt-2 text-[1.3rem] font-semibold tracking-[0.2em]">{f.hora}</p>}
            <p className="f-serif mx-auto mt-3 max-w-[17rem] text-[1.3rem] font-medium leading-tight">{c.lugar_nombre}</p>
            {c.lugar_direccion && <p className="f-garamond mt-1 text-[1.1rem] opacity-80">{c.lugar_direccion}</p>}
            {c.lugar_foto_url && (
              <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Ver la ceremonia en el mapa" className="mt-6 block">
                <Polaroid src={c.lugar_foto_url} giro={-1} ancha className="mx-auto w-[88%]" />
              </a>
            )}
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <a href={maps} target="_blank" rel="noopener noreferrer" className={botonOscuro} style={estiloBoton}>Cómo llegar</a>
              {c.waze_url && <a href={c.waze_url} target="_blank" rel="noopener noreferrer" className="boton f-garamond text-[0.9rem] font-semibold uppercase tracking-[0.25em] underline underline-offset-4">Abrir en Waze</a>}
            </div>
          </Entra>

          {hayRecepcion && (
            <Entra retraso={0.2} className="mt-14 w-full">
              <Divisor />
              <p className="f-elegante mt-4 text-[2.8rem] leading-none" style={{ color: dorado }}>Recepción</p>
              {c.recepcion_hora && <p className="f-garamond mt-2 text-[1.3rem] font-semibold tracking-[0.2em]">{c.recepcion_hora}</p>}
              <p className="f-serif mx-auto mt-3 max-w-[17rem] text-[1.3rem] font-medium leading-tight">{c.recepcion_lugar}</p>
              {c.recepcion_direccion && <p className="f-garamond mt-1 text-[1.1rem] opacity-80">{c.recepcion_direccion}</p>}
              <div className="mt-6">
                <a href={mapsRecepcion} target="_blank" rel="noopener noreferrer" className={botonOscuro} style={estiloBoton}>Cómo llegar</a>
              </div>
            </Entra>
          )}

          <Entra retraso={0.15} className="mt-14 w-full">
            <div className="papel rounded-sm p-5">
              <Cuenta fechaHora={c.fecha_hora} />
            </div>
          </Entra>
        </Capitulo>

        {/* 4 · Código de vestimenta */}
        <Capitulo nombre="vestimenta" texto={colorOk(c.texto_color_vestimenta)} fondo={fondoVestimenta} className="!min-h-0 !py-20">
          <Entra className="w-full">
            <div className="mx-auto flex items-center justify-center gap-3 opacity-80">
              <span aria-hidden className="h-px w-7" style={{ background: 'linear-gradient(to right, transparent, currentColor)' }} />
              <p className="f-garamond whitespace-nowrap text-[0.9rem] font-semibold uppercase tracking-[0.2em]">{c.vestimenta_titulo}</p>
              <span aria-hidden className="h-px w-7" style={{ background: 'linear-gradient(to left, transparent, currentColor)' }} />
            </div>
            <p className="f-cormorant mx-auto mt-5 max-w-[17rem] leading-[1.12] [text-wrap:balance]" style={{ fontSize: c.dresscode_titulo.trim().length <= 22 ? 46 : c.dresscode_titulo.trim().length <= 40 ? 36 : 30 }}>
              {c.dresscode_titulo}
            </p>
            {c.dresscode_detalle && <p className="f-garamond mx-auto mt-3 max-w-[16rem] text-[1.1rem] leading-snug opacity-80 [text-wrap:balance]">{c.dresscode_detalle}</p>}
            {colores.length > 0 && (
              <div className="mt-9 flex justify-center" aria-hidden>
                {colores.map((col, k) => (
                  <span key={col} className="relative size-[54px] rounded-full" style={{ background: col, marginLeft: k ? -13 : 0, zIndex: colores.length - k, boxShadow: '0 0 0 3px var(--papel), 0 10px 16px -8px rgb(0 0 0 / 0.3)' }} />
                ))}
              </div>
            )}
          </Entra>
        </Capitulo>

        {/* 5 · Programa (solo si hay) */}
        {(itinerario.length > 0 || fotos.length > 0) && (
          <Capitulo nombre="programa" texto={colorOk(c.texto_color_programa)} className="!min-h-0 !py-20">
            {itinerario.length > 0 && (
              <Entra className="w-full">
                <p className="f-elegante text-[3.2rem] leading-none" style={{ color: dorado }}>Programa</p>
                <ol className="relative mx-auto mt-8 max-w-[17rem] space-y-6 text-left">
                  <span aria-hidden className="absolute bottom-2 left-[4.6rem] top-2 w-px" style={{ background: 'color-mix(in srgb, var(--acento) 55%, transparent)' }} />
                  {itinerario.map(([hora, texto]) => (
                    <li key={hora + texto} className="relative flex items-baseline gap-6">
                      <span className="f-serif w-14 shrink-0 text-right text-[1.2rem] font-medium tabular-nums">{hora}</span>
                      <span aria-hidden className="absolute left-[4.35rem] top-[0.7rem] size-2 -translate-x-px rotate-45" style={{ background: 'var(--acento)' }} />
                      <span className="f-garamond pl-3 text-[1.2rem] leading-snug">{texto}</span>
                    </li>
                  ))}
                </ol>
              </Entra>
            )}
            {fotos.length > 0 && (
              <Entra className={`w-full ${itinerario.length ? 'mt-16' : ''}`}>
                {c.galeria_titulo && <p className="f-elegante mb-6 text-[3rem] leading-none" style={{ color: dorado }}>{c.galeria_titulo}</p>}
                <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                  {fotos.map((u, k) => (
                    <Polaroid key={u + k} src={u} giro={[-2, 1.5, 1, -1.5][k % 4]} className={k % 2 ? 'mt-6' : ''} />
                  ))}
                </div>
              </Entra>
            )}
          </Capitulo>
        )}

        {/* 6 · Regalos, confirmación y cierre */}
        <Capitulo nombre="final" texto={colorOk(c.texto_color_final)} className="!min-h-0 !justify-start !py-20">
          {c.regalos_texto && (
            <Entra className="w-full">
              <p className="f-elegante text-[3rem] leading-none" style={{ color: dorado }}>{c.regalos_titulo}</p>
              <p className="f-garamond mx-auto mt-4 max-w-[17rem] text-[1.25rem] leading-relaxed opacity-90 [text-wrap:pretty]">{c.regalos_texto}</p>
              {c.regalos_url && (
                <div className="mt-5">
                  <a href={c.regalos_url} target="_blank" rel="noopener noreferrer" className={botonOscuro} style={estiloBoton}>Ver mesa de regalos</a>
                </div>
              )}
            </Entra>
          )}
          <Entra retraso={0.1} className={`w-full ${c.regalos_texto ? 'mt-16' : ''}`}>
            <Divisor />
            <p className="f-elegante mt-4 text-[3.6rem] leading-none" style={{ color: dorado }}>{c.final_titulo}</p>
            <p className="f-garamond mx-auto mt-3 max-w-[16rem] text-[1.25rem] leading-snug opacity-90">{c.final_texto}</p>
          </Entra>

          <Entra retraso={0.15} className="mt-8 w-full">
            <div id="confirmar" className="papel scroll-mt-6 rounded-sm p-6 text-left">
              <p className="f-cormorant break-words text-center leading-tight" style={{ fontSize: tamNombre(nombreGuest, 0.42, 38, 22, 255) }}>{nombreGuest}</p>
              <div className="mt-5">
                <Rsvp
                  deshabilitado={vistaPrevia || soloLectura}
                  token={invitado.token}
                  cupos={invitado.cupos}
                  limite={limite}
                  inicial={{ estado: invitado.estado, asistentes: invitado.asistentes, mensaje: invitado.mensaje }}
                  onEstado={setEstadoRsvp}
                />
              </div>
            </div>
          </Entra>

          {hayExtras && (
            <Entra retraso={0.1} className="mt-8 grid w-full gap-3" id="extras">
              {lista && (
                <a href={`/playlist?t=${invitado.token}`} className="boton papel block rounded-sm p-5 text-center">
                  <span className="f-garamond block text-[1.2rem] font-semibold uppercase tracking-[0.2em]">{c.playlist_titulo}</span>
                  <span className="f-garamond mt-1 block text-[1.05rem] opacity-75">{c.playlist_mensaje}</span>
                  <span className="f-garamond mt-3 inline-block rounded-full px-5 py-2 text-[0.9rem] font-semibold uppercase tracking-[0.25em]" style={estiloBoton}>Pedir mis canciones</span>
                </a>
              )}
              {alterno && (
                <a href={`/fotos?t=${invitado.token}`} className="boton papel block rounded-sm p-5 text-center">
                  <span className="f-garamond block text-[1.2rem] font-semibold uppercase tracking-[0.2em]">{c.fotos_titulo}</span>
                  <span className="f-garamond mt-1 block text-[1.05rem] opacity-75">{c.fotos_mensaje}</span>
                  <span className="f-garamond mt-3 inline-block rounded-full px-5 py-2 text-[0.9rem] font-semibold uppercase tracking-[0.25em]" style={estiloBoton}>Ir a las fotos</span>
                </a>
              )}
            </Entra>
          )}

          <Entra retraso={0.1} className="mt-16 w-full">
            {c.hashtag.trim() && <p className="f-elegante mb-5 text-[2.2rem] leading-none" style={{ color: dorado }}>{c.hashtag.trim()}</p>}
            <Divisor />
            <p className="f-garamond mt-4 text-[1.1rem] italic opacity-80">Con todo nuestro cariño</p>
            <p className="f-elegante mt-1 text-[2.8rem] leading-none" style={{ color: dorado }}>{novia} &amp; {novio}</p>
            {wa && (
              <p className="f-garamond mt-6 text-[1.05rem] opacity-80">
                ¿Dudas?{' '}
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Escríbenos por WhatsApp</a>
              </p>
            )}
          </Entra>
          <Rama className="left-1/2 -ml-[95px] mt-10 w-[190px]" style={{ position: 'relative' }} espejo />
        </Capitulo>

        <Musica url={c.musica_url} titulo={c.musica_titulo} apiRef={musica} visible={!portada} />
      </div>
    </Listo.Provider>
  );
}
