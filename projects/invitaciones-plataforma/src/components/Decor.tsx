'use client';

import { useId, useMemo, type CSSProperties } from 'react';

// Decoración del tema "RIP 20s": negro, plata y papel. Los stickers pequeños son Noto Emoji
// (licencia libre) convertidos a blanco y negro con filtros; la bola disco y los globos se
// dibujan aquí para controlar el brillo y las animaciones.

export type Tono = 'plata' | 'negro' | 'gris' | 'color' | 'rosa';

const FILTROS: Record<Tono, string> = {
  // Solo filtros de color (baratos). Nada de drop-shadow: es lo más caro de pintar en un celular.
  plata: 'grayscale(1) contrast(1.08)',
  negro: 'grayscale(1) brightness(0.16) contrast(1.25)',
  gris: 'grayscale(1) brightness(0.55) contrast(1.15)',
  color: 'none',
  rosa: 'sepia(1) saturate(3.4) hue-rotate(305deg) brightness(1.05)',
};

export type NombreSticker = 'labios' | 'martini' | 'corona' | 'tacon' | 'lentes' | 'mono' | 'rosa' | 'destello' | 'disco' | 'globo' | 'copas' | 'reloj' | 'megafono' | 'tv' | 'champan' | 'coctel' | 'mariposa' | 'cereza' | 'corazon' | 'telefono';

interface StickerProps {
  nombre: NombreSticker;
  tono?: Tono;
  ancho?: number;
  rot?: number;
  espejo?: boolean;
  className?: string;
  style?: CSSProperties;
  anim?: 'flota' | 'balanceo' | 'pop' | 'ninguna';
  retraso?: number;
}

export function Sticker({ nombre, tono = 'negro', ancho = 64, rot = 0, espejo = false, className = '', style, anim = 'ninguna', retraso = 0 }: StickerProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/stickers/${nombre}.svg`}
      alt=""
      aria-hidden
      width={ancho}
      height={ancho}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`pointer-events-none absolute select-none ${anim === 'flota' ? 'flota' : anim === 'balanceo' ? 'balanceo' : anim === 'pop' ? 'pop' : ''} ${className}`}
      style={{ width: ancho, height: 'auto', filter: FILTROS[tono], ['--r' as string]: `${rot}deg`, transform: `rotate(${rot}deg) scaleX(${espejo ? -1 : 1})`, animationDelay: `${retraso}s`, ...style }}
    />
  );
}

// Estrella de cuatro puntas que titila.
export function Brillo({ tam = 18, className = '', retraso = 0, style }: { tam?: number; className?: string; retraso?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} aria-hidden className={`titila pointer-events-none absolute ${className}`} style={{ animationDelay: `${retraso}s`, ...style }}>
      <path fill="currentColor" d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" />
    </svg>
  );
}

// Globo negro brillante con nudo y cinta.
export function Globo({ ancho = 64, className = '', retraso = 0, style, cinta = true }: { ancho?: number; className?: string; retraso?: number; style?: CSSProperties; cinta?: boolean }) {
  const id = `g${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 60 170" width={ancho} aria-hidden className={`flota pointer-events-none absolute ${className}`} style={{ animationDelay: `${retraso}s`, ...style }}>
      <defs>
        <radialGradient id={id} cx="34%" cy="26%" r="75%">
          <stop offset="0" stopColor="#7a7a7a" />
          <stop offset="0.28" stopColor="#262626" />
          <stop offset="0.7" stopColor="#050505" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <filter id={`${id}b`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <path d="M30 2C8 2 1 22 1 40c0 24 16 42 29 46C43 82 59 64 59 40 59 22 52 2 30 2Z" fill={`url(#${id})`} />
      <ellipse cx="19" cy="22" rx="6" ry="13" transform="rotate(-24 19 22)" fill="#fff" opacity="0.55" filter={`url(#${id}b)`} />
      <ellipse cx="44" cy="62" rx="3" ry="6" transform="rotate(30 44 62)" fill="#fff" opacity="0.18" filter={`url(#${id}b)`} />
      <path d="M30 86l-5 8h10z" fill="#0a0a0a" />
      {cinta && <path d="M30 94c-8 14 8 26 0 40s-8 22-2 34" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

// Bola disco: teselas calculadas sobre una esfera, con luz arriba a la izquierda.
interface Tesela {
  p: string;
  c: string;
}
let cacheTeselas: Tesela[] | null = null;
function teselas(): Tesela[] {
  if (cacheTeselas) return cacheTeselas;
  let s = 11;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const R = 100;
  const filas = 15;
  const out: Tesela[] = [];
  const luz = [-0.45, -0.6, 0.66];
  const punto = (lat: number, lon: number) => [R * Math.cos(lat) * Math.sin(lon), R * Math.sin(lat), Math.cos(lat) * Math.cos(lon)] as const;
  for (let i = 0; i < filas; i++) {
    const la0 = -Math.PI / 2 + (i / filas) * Math.PI;
    const la1 = -Math.PI / 2 + ((i + 1) / filas) * Math.PI;
    const cols = Math.max(5, Math.round(30 * Math.cos((la0 + la1) / 2)));
    for (let j = 0; j < cols; j++) {
      const lo0 = -Math.PI / 2 + (j / cols) * Math.PI;
      const lo1 = -Math.PI / 2 + ((j + 1) / cols) * Math.PI;
      const esq = [punto(la0, lo0), punto(la0, lo1), punto(la1, lo1), punto(la1, lo0)];
      const mid = punto((la0 + la1) / 2, (lo0 + lo1) / 2);
      const dot = Math.max(0, (mid[0] / R) * luz[0] + (mid[1] / R) * luz[1] + mid[2] * luz[2]);
      const brillo = 28 + 205 * dot * (0.55 + 0.45 * rnd()) + (rnd() > 0.93 ? 55 : 0);
      const g = Math.round(Math.min(250, brillo));
      out.push({ p: esq.map((e) => `${e[0].toFixed(1)},${e[1].toFixed(1)}`).join(' '), c: `rgb(${g},${g},${g})` });
    }
  }
  cacheTeselas = out;
  return out;
}

export function BolaDisco({ tam = 160, className = '', cuerda = 0, style }: { tam?: number; className?: string; cuerda?: number; style?: CSSProperties }) {
  const t = useMemo(teselas, []);
  const id = `d${useId().replace(/:/g, '')}`;
  return (
    <div className={`pointer-events-none absolute ${className}`} style={{ width: tam, ...style }} aria-hidden>
      {cuerda > 0 && <div className="mx-auto bg-black/80" style={{ width: 1.5, height: cuerda }} />}
      <svg viewBox="-104 -104 208 208" width={tam} height={tam} className="block overflow-visible">
        <defs>
          <clipPath id={`${id}c`}><circle r="100" /></clipPath>
          <radialGradient id={`${id}s`} cx="36%" cy="30%" r="72%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <circle r="100" fill="#1b1b1b" />
        <g clipPath={`url(#${id}c)`}>
          {t.map((x, i) => (
            <polygon key={i} points={x.p} fill={x.c} stroke="#0c0c0c" strokeWidth="0.9" />
          ))}
          <circle r="100" fill={`url(#${id}s)`} />
          {/* destello que recorre la bola */}
          <g className="barrido"><rect x="-130" y="-120" width="34" height="240" fill="#fff" opacity="0.5" transform="rotate(20)" /></g>
        </g>
      </svg>
      <Brillo tam={tam * 0.2} className="text-white" style={{ left: '8%', top: '12%' }} />
      <Brillo tam={tam * 0.13} className="text-white" style={{ right: '4%', top: '38%' }} retraso={1.1} />
      <Brillo tam={tam * 0.1} className="text-black/70" style={{ left: '-6%', bottom: '24%' }} retraso={0.6} />
    </div>
  );
}

// Humo / bokeh oscuro del borde superior e inferior de cada capítulo.
export function Humo({ lado = 'arriba', className = '' }: { lado?: 'arriba' | 'abajo'; className?: string }) {
  const arriba = lado === 'arriba';
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 z-0 ${arriba ? 'top-0' : 'bottom-0'} h-40 ${className}`}>
      <div
        className="absolute inset-x-[-10%] h-full"
        style={{
          [arriba ? 'top' : 'bottom']: '-34px',
          background: `radial-gradient(ellipse 45% 70% at 18% ${arriba ? '0%' : '100%'}, rgb(0 0 0 / 0.78), transparent 70%), radial-gradient(ellipse 40% 60% at 62% ${arriba ? '-10%' : '110%'}, rgb(0 0 0 / 0.6), transparent 70%), radial-gradient(ellipse 35% 60% at 95% ${arriba ? '0%' : '100%'}, rgb(0 0 0 / 0.7), transparent 70%)`,
          filter: 'blur(16px)',
        }}
      />
      {[10, 36, 63, 88].map((x, i) => (
        <span
          key={x}
          className="titila absolute rounded-full bg-white"
          style={{ left: `${x}%`, [arriba ? 'top' : 'bottom']: `${6 + ((i * 17) % 38)}px`, width: 5 + (i % 3) * 4, height: 5 + (i % 3) * 4, opacity: 0.55, filter: 'blur(1.2px)', animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </div>
  );
}

// Confeti que cae despacio (negro, plata y rosa). Solo transform: cuesta casi nada.
const COLORES_CONFETI = ['#111111', '#9a9a9a', '#f4b6c2', '#ef9aa8', '#ffffff', '#111111'];
export function Confeti({ cantidad = 26, className = '' }: { cantidad?: number; className?: string }) {
  const piezas = useMemo(() => {
    let s = 5;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: cantidad }, (_, i) => {
      const redondo = rnd() > 0.55;
      const lado = 6 + Math.round(rnd() * 7);
      return {
        x: Math.round(rnd() * 100),
        w: redondo ? lado : lado * 0.55,
        h: redondo ? lado : lado * 1.5,
        c: COLORES_CONFETI[i % COLORES_CONFETI.length],
        r: redondo ? '50%' : '2px',
        d: 9 + rnd() * 8,
        t: rnd() * 14,
      };
    });
  }, [cantidad]);
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${className}`}>
      {piezas.map((p, i) => (
        <span key={i} className="confeti absolute block" style={{ left: `${p.x}%`, top: -24, width: p.w, height: p.h, background: p.c, borderRadius: p.r, animationDuration: `${p.d}s`, animationDelay: `-${p.t}s` }} />
      ))}
    </div>
  );
}

// Sticker de foto (WebP recortado, con su propio color): globos rosa, bola disco con estrellas y
// los memes de cumpleaños. Los de base plana se colocan asomándose desde un borde.
export type NombrePegatina = 'globos-rosa' | 'disco-estrellas' | 'mono-pastel' | 'mono-globos' | 'nena-brindis' | 'perro-lentes' | 'hamster-pastel' | 'treinta-29' | 'garner-susto' | 'mujer-copa' | 'nena-corona' | 'gorro-rojo' | 'treinta-coqueta' | 'treinta-brillando' | 'going-on-30' | 'labios-rojos' | 'hecha-90s' | 'ticket-birthday';

export function Pegatina({ nombre, ancho = 110, rot = 0, espejo = false, className = '', style, anim = 'ninguna', retraso = 0 }: { nombre: NombrePegatina; ancho?: number; rot?: number; espejo?: boolean; className?: string; style?: CSSProperties; anim?: 'flota' | 'pop' | 'ninguna'; retraso?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/stickers/${nombre}.webp`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`pointer-events-none absolute select-none ${anim === 'flota' ? 'flota' : anim === 'pop' ? 'pop' : ''} ${className}`}
      style={{ width: ancho, height: 'auto', scale: espejo ? '-1 1' : undefined, ['--r' as string]: `${rot}deg`, transform: `rotate(${rot}deg)`, animationDelay: `${retraso}s`, ...style }}
    />
  );
}
