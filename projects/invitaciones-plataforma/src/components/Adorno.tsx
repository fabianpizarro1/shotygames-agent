'use client';

import { createContext, useContext, useId, type CSSProperties } from 'react';
import { BolaDisco, Pegatina, Sticker, type NombrePegatina } from './Decor';

// Los "adornos" de la invitación pueden ser las pegatinas de foto (memes y fotos de la invitación de
// Joselin: solo para uso privado) o adornos PROPIOS: globos y bola disco dibujados en código y
// stickers Noto Emoji (Apache 2.0). Las plantillas de la plataforma usan siempre los propios.

export const StickersPropios = createContext(false);

interface P {
  nombre: NombrePegatina;
  ancho?: number;
  rot?: number;
  espejo?: boolean;
  className?: string;
  style?: CSSProperties;
  anim?: 'flota' | 'pop' | 'ninguna';
  retraso?: number;
}

// Globo pastel brillante con nudo y cinta (dibujo propio).
function GloboColor({ ancho, color, className = '', style }: { ancho: number; color: string; className?: string; style?: CSSProperties }) {
  const id = `gc${useId().replace(/:/g, '')}`; // useId (no Math.random) para que servidor y navegador coincidan
  return (
    <svg viewBox="0 0 60 170" width={ancho} aria-hidden className={`pointer-events-none absolute ${className}`} style={style}>
      <defs>
        <radialGradient id={id} cx="34%" cy="26%" r="78%">
          <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${color} 45%, white)` }} />
          <stop offset="0.45" style={{ stopColor: color }} />
          <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${color} 72%, #7a2a3a)` }} />
        </radialGradient>
      </defs>
      <path d="M30 2C8 2 1 22 1 40c0 24 16 42 29 46C43 82 59 64 59 40 59 22 52 2 30 2Z" fill={`url(#${id})`} />
      <ellipse cx="19" cy="22" rx="6" ry="13" transform="rotate(-24 19 22)" fill="#fff" opacity="0.55" />
      <path d="M30 86l-5 8h10z" fill={color} />
      <path d="M30 94c-8 14 8 26 0 40s-8 22-2 34" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RamoGlobos({ ancho, rot, espejo, className = '', style, anim, retraso = 0 }: Omit<P, 'nombre'>) {
  const cl = anim === 'flota' ? 'flota' : '';
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${cl} ${className}`}
      style={{ width: ancho, height: (ancho ?? 120) * 1.3, ['--r' as string]: `${rot ?? 0}deg`, transform: `rotate(${rot ?? 0}deg) scaleX(${espejo ? -1 : 1})`, animationDelay: `${retraso}s`, color: '#7a2a3a', ...style }}
    >
      <GloboColor ancho={(ancho ?? 120) * 0.42} color="#f4b6c2" className="left-0 top-[14%]" />
      <GloboColor ancho={(ancho ?? 120) * 0.44} color="#ef9aa8" className="left-[28%] top-0" />
      <GloboColor ancho={(ancho ?? 120) * 0.4} color="#f9d3da" className="left-[58%] top-[18%]" />
    </div>
  );
}

// Sustituto propio de cada pegatina de foto: [sticker Noto, tono, tamaño relativo].
const SUSTITUTOS: Partial<Record<NombrePegatina, ['copas' | 'corona' | 'destello' | 'labios' | 'lentes' | 'martini' | 'rosa' | 'tacon', 'plata' | 'negro' | 'gris' | 'color' | 'rosa', number]>> = {
  'treinta-29': ['copas', 'rosa', 0.62],
  'garner-susto': ['labios', 'rosa', 0.5],
  'going-on-30': ['martini', 'rosa', 0.62],
  'nena-brindis': ['rosa', 'rosa', 0.62],
  'perro-lentes': ['lentes', 'rosa', 0.95],
  'mujer-copa': ['tacon', 'rosa', 0.62],
  'nena-corona': ['corona', 'color', 0.7],
  'treinta-brillando': ['destello', 'rosa', 0.55],
  'treinta-coqueta': ['labios', 'rosa', 0.5],
  'hecha-90s': ['rosa', 'rosa', 0.5],
  'hamster-pastel': ['copas', 'rosa', 0.8],
};

export function Adorno({ nombre, ...p }: P) {
  const propios = useContext(StickersPropios);
  if (!propios) return <Pegatina nombre={nombre} {...p} />;
  if (nombre === 'globos-rosa') return <RamoGlobos {...p} />;
  if (nombre === 'disco-estrellas') return <BolaDisco tam={(p.ancho ?? 180) * 0.8} className={p.className} style={{ rotate: `${p.rot ?? 0}deg`, ...p.style }} />;
  const s = SUSTITUTOS[nombre];
  if (!s) return null; // gorro, monos, ticket…: sin sustituto
  return <Sticker nombre={s[0]} tono={s[1]} ancho={Math.round((p.ancho ?? 120) * s[2])} rot={p.rot} espejo={p.espejo} className={p.className} style={p.style} anim={p.anim === 'pop' ? 'pop' : p.anim === 'flota' ? 'flota' : 'ninguna'} retraso={p.retraso} />;
}
