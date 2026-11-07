'use client';

import { tamNombre } from '@/lib/nombre';
import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Config } from '@/lib/config';
import { piezasFecha } from '@/lib/fechas';
import { Capitulo, Cinta, Entra, Escribe, Listo } from './anim';
import { Cuenta } from './Cuenta';
import { Brillo, Confeti, Humo, Pegatina, Sticker } from './Decor';
import { Musica, type MusicaApi } from './Musica';
import { Rsvp } from './Rsvp';
import { SobreRegalo } from './SobreRegalo';
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
  mensaje: string;
}

// Solo http(s) o rutas propias en cualquier campo que acabe como enlace o archivo.
const CAMPOS_URL = new Set(['maps_url', 'waze_url', 'url_base', 'musica_url', 'portada_url', 'lugar_foto_url', 'playlist_url', 'galeria_fotos']);
const urlSegura = (v: string) => v.split('\n').every((l) => !l.trim() || /^(\/|https?:\/\/)/i.test(l.trim()));
function limpiarValores(v: unknown, base: Config): Partial<Config> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== 'object') return out;
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (!(k in base) || typeof x !== 'string' || x.length > 5000) continue;
    out[k] = CAMPOS_URL.has(k) && !urlSegura(x) ? '' : x;
  }
  return out;
}

// Tipos de letra de la palabra grande de Bienvenida: [clase, mayúsculas, ancho por letra (em), tamaño máximo, tamaño mínimo]
const LETRAS_PALABRA: Record<string, [string, boolean, number, number, number]> = {
  elegante: ['f-elegante', false, 0.42, 108, 46],
  serif: ['f-serif font-black tracking-[0.04em]', true, 0.69, 76, 34],
  impacto: ['f-impact tracking-[0.02em]', true, 0.8, 68, 30],
  condensada: ['f-cond font-bold tracking-[0.06em]', true, 0.56, 84, 36],
  cursiva: ['f-script', false, 0.42, 92, 40],
  firma: ['f-firma', false, 0.35, 104, 44],
  sans: ['font-black tracking-[0.02em]', true, 0.72, 72, 32],
};
const TONOS_CORONA: Record<string, 'plata' | 'color' | 'rosa' | 'negro' | 'gris'> = { plata: 'plata', dorado: 'color', rosa: 'rosa', negro: 'negro', gris: 'gris' };

export function Invitacion({ config, invitado, vistaPrevia = false }: { config: Config; invitado: InvitadoVista; vistaPrevia?: boolean }) {
  // En la vista previa del panel, `c` se actualiza en vivo con lo que se está editando (sin guardar).
  const [c, setC] = useState(config);
  useEffect(() => setC(config), [config]);
  const [portada, setPortada] = useState(!vistaPrevia);
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

  // La portada bloquea el scroll mientras está abierta.
  useEffect(() => {
    document.body.style.overflow = portada ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [portada]);

  // Vista previa (solo admin): recibe los cambios del panel, salta a un capítulo y avisa qué capítulo se tocó.
  useEffect(() => {
    if (!vistaPrevia) return;
    const yo = window.location.origin;
    const alMensaje = (e: MessageEvent) => {
      if (e.origin !== yo) return;
      const d = e.data as { tipo?: string; valores?: unknown; cap?: string } | null;
      if (d?.tipo === 'config') setC((prev) => ({ ...prev, ...limpiarValores(d.valores, config) }));
      else if (d?.tipo === 'ir' && typeof d.cap === 'string') {
        const s = d.cap === 'inicio' ? null : document.querySelector(`section[data-cap="${CSS.escape(d.cap)}"]`);
        if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    const alClic = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('a')) e.preventDefault();
      const cap = (t?.closest?.('section[data-cap]') as HTMLElement | null)?.dataset.cap;
      if (cap) window.parent.postMessage({ tipo: 'editar', cap }, yo);
    };
    window.addEventListener('message', alMensaje);
    document.addEventListener('click', alClic, true);
    window.parent.postMessage({ tipo: 'listo' }, yo);
    return () => {
      window.removeEventListener('message', alMensaje);
      document.removeEventListener('click', alClic, true);
    };
  }, [vistaPrevia, config]);

  // Marca "abierto" una sola vez por sesión (alimenta las estadísticas del panel).
  useEffect(() => {
    if (vistaPrevia) return;
    try {
      const k = `abierto-${invitado.token}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {}
    fetch('/api/abierto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invitado.token }) }).catch(() => {});
  }, [invitado.token, vistaPrevia]);

  // Firma sobre el 30: el borde se oscurece o aclara solo para que siempre se lea.
  const esClaro = (hex: string) => {
    const h = hex.replace('#', '');
    const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.slice(0, 6);
    const n = parseInt(f, 16);
    return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
  };
  const colorOk = (v: string) => (/^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim() : undefined);
  const tema = { '--fondo': c.color_fondo, '--fondo2': c.color_fondo_2, '--papel': c.color_papel, '--texto': c.color_texto, '--texto-base': c.color_texto, '--acento': c.color_acento } as CSSProperties;

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
  const alterno = c.fotos_activas.trim().toLowerCase() !== 'no';
  const lista = c.playlist_activa.trim().toLowerCase() !== 'no';
  // El capítulo del código de vestimenta se tiñe del primer color del código (rosa, en este caso).
  const tinte = colores[0] ? `color-mix(in srgb, ${colores[0]} 50%, var(--fondo))` : '';
  const fondoVestimenta = tinte ? `linear-gradient(to bottom, transparent 0%, ${tinte} 18%, ${tinte} 82%, transparent 100%)` : undefined;

  return (
    <Listo.Provider value={!portada}>
      <div style={tema} className={`rayas min-h-dvh overflow-x-clip ${vistaPrevia ? 'vista-previa' : ''}`}>
        <AnimatePresence>
          {portada && (
            <Sobre nombre={invitado.nombre} inicial={(c.festejado.trim()[0] ?? 'J').toUpperCase()} colorSello={c.sello_color} texto={(/birthday/i.test(c.festejado) && /^\{festejado\}\s*birthday$/i.test(c.sobre_texto.trim()) ? c.festejado : c.sobre_texto.replace('{festejado}', c.festejado)).trim()} onAbrir={() => {}} onListo={() => setPortada(false)} />
          )}
        </AnimatePresence>

        {/* 1 · Invitación + RIP 20s (globos y bola disco) */}
        <Capitulo nombre="inicio" texto={colorOk(c.texto_color_inicio)} className="!min-h-0 !justify-start !pt-48 !pb-52">
          <Humo />
          <Pegatina nombre="globos-rosa" ancho={150} rot={-6} className="-left-3 top-4" anim="flota" />
          <Pegatina nombre="disco-estrellas" ancho={215} rot={6} className="-right-14 -top-6" anim="flota" retraso={0.6} />
          <Pegatina nombre="treinta-29" ancho={200} rot={-3} className="bottom-6 left-1/2 -ml-[100px]" />
          <Brillo tam={22} className="text-(--texto)" style={{ left: '16%', top: '32%' }} />
          <Brillo tam={15} className="text-[color-mix(in_srgb,var(--texto)_70%,transparent)]" style={{ right: '18%', bottom: '16%' }} retraso={1} />

          <Entra className="mt-2">
            <p className="f-cond text-[16.8px] font-medium tracking-[0.4em] opacity-70">Para</p>
            <p className="f-cond mt-1 break-words font-bold leading-none tracking-[0.12em]" style={{ fontSize: tamNombre(invitado.nombre, 0.62, 28.7, 20, 290) }}>{invitado.nombre}</p>
          </Entra>
          {(c.intro_linea.trim() || c.intro_titulo.trim()) && (
            <div className="mt-10 flex flex-col items-center">
              {c.intro_linea.trim() && <Escribe className="f-script text-[2.128rem] leading-tight" retraso={0.2}>{c.intro_linea}</Escribe>}
              {c.intro_titulo.trim() && <Escribe className="f-firma -mt-1 text-[5.4rem] leading-[0.95]" retraso={0.9} dur={1.8}>{c.intro_titulo}</Escribe>}
            </div>
          )}
          <Entra retraso={0.3} className="mt-16">
            <p className="f-cond mx-auto max-w-[16rem] text-[1.456rem] font-bold leading-[1.15]">{c.rip_texto.replace('{invitada}', invitada)}</p>
            <div className="mt-6 flex items-end justify-center gap-1">
              <span className="f-serif pb-3 text-[3.36rem] font-black leading-none tracking-wide">RIP</span>
              <span className="globo-num text-[8.4rem]" data-t={ripBase} style={{ '--num': colorOk(c.numero_color_inicio) } as CSSProperties}>{ripBase}</span>
              {ripSufijo && <span className="f-serif mb-4 text-[1.4rem] font-bold">{ripSufijo}</span>}
            </div>
          </Entra>
        </Capitulo>

        <Cinta texto={c.cinta_texto} />

        {/* 2 · Bienvenida a los 30 (corona) */}
        <Capitulo nombre="bienvenida" texto={colorOk(c.texto_color_bienvenida)} className="!min-h-0 !pt-[72px] !pb-60">
          <Pegatina nombre="garner-susto" ancho={190} className="bottom-0 right-0" />
          <Sticker nombre="corona" tono={TONOS_CORONA[c.corona_color.trim().toLowerCase()] ?? 'plata'} ancho={150} rot={-3} className="bottom-10 left-3" />
          <Brillo tam={22} className="text-(--texto)" style={{ right: '14%', top: '36%' }} />
          <Brillo tam={16} className="text-[color-mix(in_srgb,var(--texto)_70%,transparent)]" style={{ left: '12%', top: '46%' }} retraso={0.9} />
          {c.bienvenida_linea.trim() && (
            <Entra>
              <p className="f-serif mx-auto max-w-[13rem] text-[1.176rem] leading-snug">{c.bienvenida_linea}</p>
            </Entra>
          )}
          {/* Bienvenida: la primera palabra grande, el resto entre dos filetes finos, y el número con un eco de contorno, anillos y brillo */}
          {(() => {
            const clave = c.bienvenida_letra.trim().toLowerCase();
            const [cls, mayus, em, max, min] = LETRAS_PALABRA[clave] ?? LETRAS_PALABRA.elegante;
            const palabras = c.bienvenida_palabra.trim().split(/\s+/).filter(Boolean);
            const primera = palabras[0] ?? '';
            const resto = palabras.slice(1).join(' ');
            const fsP = Math.round(Math.min(max, Math.max(min, 300 / (em * Math.max(1, primera.length)))));
            const fsR = Math.round(Math.max(26, Math.min(48, 156 / (em * Math.max(1, resto.length)))));
            const sombra = clave === 'elegante' || !clave ? undefined : '0 3px 0 color-mix(in srgb, currentColor 22%, transparent)';
            const m = c.bienvenida_numero.trim().match(/^(\d+)(.*)$/);
            const base = m ? m[1] : c.bienvenida_numero;
            const suf = m ? m[2] : '';
            const colorNum = colorOk(c.numero_color_bienvenida);
            const tinta = colorNum ?? 'var(--texto)';
            const claseLetra = `${cls} ${mayus ? 'uppercase' : ''}`;
            return (
              <div className="relative w-full">
                <Escribe className="mt-1 leading-none" retraso={0.3}>
                  <span className={`block leading-[1.0] ${claseLetra}`} style={{ fontSize: fsP, textShadow: sombra }}>{primera}</span>
                </Escribe>
                <Entra retraso={0.6} className="relative mt-[84px]">
                  {/* resplandor suave y anillos finos detrás del número */}
                  <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-0 size-[360px] -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--papel) 62%, transparent), transparent)' }} />
                  <svg viewBox="0 0 360 360" role={resto ? 'img' : undefined} aria-label={resto || undefined} aria-hidden={resto ? undefined : true} className="pointer-events-none absolute left-1/2 top-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 overflow-visible" fill="none" stroke="currentColor">
                    <defs>
                      <path id="arco-bienvenida" d="M 50 180 A 130 130 0 0 1 310 180" />
                    </defs>
                    <circle cx="180" cy="180" r="170" strokeWidth="0.8" opacity="0.34" />
                    <circle cx="180" cy="180" r="118" strokeWidth="1" strokeDasharray="1 7" strokeLinecap="round" opacity="0.5" />
                    <circle cx="36" cy="262" r="2.8" fill="currentColor" stroke="none" opacity="0.55" />
                    {resto && (
                      <text className={claseLetra} fontSize={Math.round(fsR / 0.9167)} fill="currentColor" stroke="none" textAnchor="middle">
                        <textPath href="#arco-bienvenida" startOffset="50%">{resto}</textPath>
                      </text>
                    )}
                  </svg>
                  <span className="relative inline-block">
                    {/* eco de contorno desplazado: da profundidad sin sombras pesadas */}
                    <span aria-hidden className="f-serif pointer-events-none absolute inset-0 block translate-x-[7px] translate-y-[7px] select-none text-[9.5rem] font-medium leading-[0.9]" style={{ fontVariantNumeric: 'lining-nums', color: 'transparent', WebkitTextStroke: `1.2px ${tinta}`, opacity: 0.42 }}>{base}</span>
                    <span className="f-serif relative block text-[9.5rem] font-medium leading-[0.9]" style={{ fontVariantNumeric: 'lining-nums', color: colorNum }}>{base}</span>
                    {suf && <span className="f-serif absolute bottom-3 left-full pl-2 text-[2.2rem] font-medium leading-none" style={{ color: colorNum }}>{suf}</span>}
                  </span>
                  {c.gorro_mostrar.trim().toLowerCase() === 'si' && (
                    <Pegatina nombre="gorro-rojo" ancho={76} rot={22} className="-top-[60px] right-[50px] z-[3]" />
                  )}
                  {c.firma_mostrar.trim().toLowerCase() === 'si' && (
                    <Escribe className="f-firma absolute inset-x-0 bottom-1 text-[4.2rem] leading-none" retraso={1.1} dur={1.6}>
                      {(() => {
                        const col = colorOk(c.firma_color) ?? '#ffffff';
                        const borde = esClaro(col) ? '#000' : '#fff';
                        const halo = esClaro(col) ? 'rgb(0 0 0 / 0.75)' : 'rgb(255 255 255 / 0.8)';
                        return <span style={{ color: col, textShadow: `0 2px 0 ${borde}, 0 0 14px ${halo}` }}>{c.festejado}</span>;
                      })()}
                    </Escribe>
                  )}
                </Entra>

                {/* filete con estrella, cierra la composición */}
                <Entra retraso={0.8} className="mx-auto mt-7 flex items-center justify-center gap-3 opacity-80" aria-hidden>
                  <span className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, currentColor)' }} />
                  <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" /></svg>
                  <span className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, currentColor)' }} />
                </Entra>
              </div>
            );
          })()}
        </Capitulo>

        {/* 3 · Brindis (foto con cinta, confeti: alegre) */}
        <Capitulo nombre="brindis" texto={colorOk(c.texto_color_brindis)} className="!pt-12 !pb-48">
          <Confeti cantidad={6} />
          <Pegatina nombre="going-on-30" ancho={150} rot={-6} className="bottom-12 left-3" />
          <Pegatina nombre="nena-brindis" ancho={172} className="bottom-0 right-2" />
          <Brillo tam={18} className="text-(--texto)" style={{ right: '14%', top: '30%' }} />
          <div className="mt-6">
            <Escribe className="f-script text-[3.6rem] leading-none">{c.brindis_titulo}</Escribe>
          </div>
          {c.portada_url ? (
            <Entra retraso={0.25} className="mt-9 w-full">
              <Polaroid src={c.portada_url} giro={3} bn={bn} cinta className="mx-auto w-[74%]" />
            </Entra>
          ) : (
            <div className="relative mt-9 h-40 w-full" aria-hidden>
              <Sticker nombre="copas" tono="plata" ancho={130} rot={-6} className="left-1/2 -ml-[65px]" />
            </div>
          )}
          {c.brindis_texto && (
            <Entra retraso={0.4} className="mt-9">
              <p className="f-cond mx-auto max-w-[16rem] text-[1.344rem] font-bold leading-[1.2]">{c.brindis_texto}</p>
            </Entra>
          )}
        </Capitulo>


        {/* 4 · Fecha y lugar (lentes, foto del sitio) */}
        <Capitulo nombre="fecha" texto={colorOk(c.texto_color_fecha)} className="!pb-10">
          <Sticker nombre="martini" tono="plata" ancho={68} rot={8} className="left-3 top-[6%]" />
          <Brillo tam={20} className="text-(--texto)" style={{ left: '18%', top: '22%' }} />
          <Brillo tam={14} className="text-[color-mix(in_srgb,var(--texto)_70%,transparent)]" style={{ right: '8%', top: '44%' }} retraso={1} />
          <Entra>
            <p className="f-cond mx-auto max-w-[14rem] text-[1.064rem] font-medium leading-snug opacity-80">{c.fecha_linea}</p>
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
              <div className="mx-auto mt-4 w-64 border-y border-(--texto) py-1.5">
                <span className="f-serif text-[1.68rem] tracking-[0.35em]" style={{ fontVariantNumeric: 'lining-nums' }}>{f.hora}</span>
              </div>
              {c.hora_fin_texto && <p className="mt-2 text-[15.12px] opacity-70">{c.hora_fin_texto}</p>}
            </Entra>
          )}
          <Entra retraso={0.3} className="mt-7">
            <p className="f-cond text-[1.68rem] font-bold leading-none">Lugar</p>
            <p className="f-serif mx-auto mt-2 max-w-[17rem] text-[1.288rem] font-bold leading-tight">{c.lugar_nombre}</p>
            {c.lugar_direccion && <p className="mt-1 text-[17.36px] opacity-75">{c.lugar_direccion}</p>}
            {c.lugar_foto_url && (
              <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Ver el lugar en el mapa" className="relative mt-32 block">
                <Pegatina nombre="perro-lentes" ancho={120} rot={7} className="-top-[7rem] right-3" />
                <Polaroid src={c.lugar_foto_url} giro={-1.5} ancha className="relative mx-auto w-[92%]" />
              </a>
            )}
            <div className="mt-5 flex flex-col items-center gap-2.5">
              <a href={maps} target="_blank" rel="noopener noreferrer" className="boton f-cond rounded-full bg-(--texto-base) px-7 py-3 text-[15.12px] font-bold tracking-[0.3em] text-(--papel)">Cómo llegar</a>
              {c.waze_url && <a href={c.waze_url} target="_blank" rel="noopener noreferrer" className="boton f-cond rounded-full border border-(--texto) px-6 py-2.5 text-[15.12px] font-bold tracking-[0.3em]">Abrir en Waze</a>}
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
        <Capitulo nombre="vestimenta" texto={colorOk(c.texto_color_vestimenta)} fondo={fondoVestimenta} className="!min-h-0 !justify-start !pt-8 !pb-4">
          <Pegatina nombre="nena-corona" ancho={150} rot={5} className="right-3 top-2" />
          <Pegatina nombre="treinta-brillando" ancho={130} rot={-8} className="left-3 top-[34px]" />
          <Brillo tam={22} className="text-(--texto)" style={{ right: '12%', top: '14%' }} />
          <Brillo tam={16} className="text-[color-mix(in_srgb,var(--texto)_70%,transparent)]" style={{ left: '12%', top: '44%' }} retraso={1} />
          <Entra className="mt-[140px]">
            <p className="f-cond text-[1.064rem] font-medium opacity-80">{c.vestimenta_titulo}</p>
            <p className="f-cond mx-auto mt-2 max-w-[17rem] text-[2.912rem] font-bold leading-[1.02]">{c.dresscode_titulo}</p>
            {c.dresscode_detalle && <p className="mx-auto mt-4 max-w-[15rem] text-[17.36px] leading-snug opacity-80">({c.dresscode_detalle})</p>}
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
          <Capitulo nombre="programa" texto={colorOk(c.texto_color_programa)}>
            {itinerario.length > 0 && (
              <Entra className="w-full">
                <p className="f-script mb-5 text-[3.36rem] leading-none">Programa</p>
                <ul className="mx-auto max-w-[17rem] space-y-3 text-left">
                  {itinerario.map(([hora, texto]) => (
                    <li key={hora + texto} className="flex items-baseline gap-4 border-b border-[color-mix(in_srgb,var(--texto)_20%,transparent)] pb-2">
                      <span className="f-serif w-16 shrink-0 text-right text-[1.26rem] font-bold tabular-nums">{hora}</span>
                      <span className="f-cond text-[17.36px] font-medium">{texto}</span>
                    </li>
                  ))}
                </ul>
              </Entra>
            )}
            {fotos.length > 0 && (
              <Entra className={`w-full ${itinerario.length ? 'mt-14' : ''}`}>
                {c.galeria_titulo && <p className="f-script mb-6 text-[3.36rem] leading-none">{c.galeria_titulo}</p>}
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
        <Capitulo nombre="final" texto={colorOk(c.texto_color_final)} className="!justify-start !pt-6">
          {/* Ocultos a pedido (se pueden volver a poner): mono-globos y disco-estrellas */}
          <Pegatina nombre="hamster-pastel" ancho={140} className="bottom-0 left-1/2 -ml-[70px]" />
          <Pegatina nombre="treinta-coqueta" ancho={132} rot={-6} className="bottom-6 left-1" />
          <Pegatina nombre="hecha-90s" ancho={132} rot={5} className="bottom-10 right-1" />
          <Humo lado="abajo" />
          <Brillo tam={18} className="text-(--texto)" style={{ left: '30%', top: '40px' }} />
          <div className="mt-2 flex flex-col items-center">
            {c.invita_titulo && <Escribe className="f-script text-[3.36rem] leading-[0.95]">{c.invita_titulo}</Escribe>}
            {c.regalos_texto && (
              <>
                <SobreRegalo className="mt-2" />
                <Entra retraso={0.3}>
                  <p className="f-cond mx-auto mt-6 max-w-[16rem] text-[1.568rem] font-bold leading-[1.1]">{c.regalos_texto}</p>
                </Entra>
              </>
            )}
            {c.mensaje && (
              <Entra retraso={0.45}>
                <p className="mx-auto mt-3 max-w-[15rem] text-[17.36px] leading-snug opacity-80">{c.mensaje}</p>
              </Entra>
            )}
          </div>
          <div className="mt-20">
            <Escribe className="f-script text-[4rem] leading-none">{c.final_titulo}</Escribe>
            <Entra retraso={0.3}>
              <p className="f-cond mx-auto mt-3 max-w-[14rem] text-[1.456rem] font-bold leading-tight">{c.final_texto}</p>
            </Entra>
          </div>

          <Entra retraso={0.15} className="mt-8 w-full">
            <div id="confirmar" className="papel scroll-mt-6 rounded-sm p-6 text-left">
              <p className="f-cond break-words text-center font-bold leading-tight tracking-[0.08em]" style={{ fontSize: tamNombre(invitado.nombre, 0.58, 40, 22, 255) }}>{invitado.nombre}</p>
              <div className="mt-5">
                <Rsvp
                  deshabilitado={vistaPrevia}
                  token={invitado.token}
                  cupos={invitado.cupos}
                  limite={limite}
                  inicial={{ estado: invitado.estado, asistentes: invitado.asistentes, mensaje: invitado.mensaje }}
                />
              </div>
            </div>
          </Entra>

          {(lista || alterno) && (
            <Entra retraso={0.1} className="mt-8 grid w-full gap-3">
              {lista && (
                <a href={`/playlist?t=${invitado.token}`} className="boton papel block rounded-sm p-5 text-center">
                  <span className="f-cond block text-[1.12rem] font-bold tracking-[0.2em]">{c.playlist_titulo}</span>
                  <span className="mt-1 block text-[15.12px] opacity-70">{c.playlist_mensaje}</span>
                  <span className="f-cond mt-3 inline-block rounded-full bg-(--texto) px-5 py-2 text-[15.12px] font-bold tracking-[0.3em] text-(--papel)">Pedir mis canciones</span>
                </a>
              )}
              {alterno && (
                <a href={`/fotos?t=${invitado.token}`} className="boton papel block rounded-sm p-5 text-center">
                  <span className="f-cond block text-[1.12rem] font-bold tracking-[0.2em]">{c.fotos_titulo}</span>
                  <span className="mt-1 block text-[15.12px] opacity-70">{c.fotos_mensaje}</span>
                  <span className="f-cond mt-3 inline-block rounded-full bg-(--texto) px-5 py-2 text-[15.12px] font-bold tracking-[0.3em] text-(--papel)">Ir a las fotos</span>
                </a>
              )}
            </Entra>
          )}
          <div className="h-56 w-full" aria-hidden />
        </Capitulo>

        <Musica url={c.musica_url} titulo={c.musica_titulo} apiRef={musica} visible={!portada} />
      </div>
    </Listo.Provider>
  );
}
