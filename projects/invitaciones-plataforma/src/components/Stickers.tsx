// Stickers de línea (copa y pastel) al estilo de la invitación. Provisionales:
// cuando haya los PNG originales de Canva se reemplazan por <img>.

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function Copa({ className = '', src }: { className?: string; src?: string }) {
  if (src) return <Imagen src={src} className={className} />;
  return (
    <span className={`sticker inline-block rounded-[38%_62%_55%_45%/50%_45%_55%_50%] p-3 ${className}`}>
      <svg viewBox="0 0 100 110" width="96" height="106" aria-hidden>
        <path {...trazo} d="M14 22 Q50 14 86 22 Q80 52 50 62 Q20 52 14 22 Z" />
        <path {...trazo} d="M50 62 V92" />
        <path {...trazo} d="M30 98 Q50 90 70 98" />
        <circle {...trazo} cx="62" cy="34" r="6" />
        <path {...trazo} d="M66 30 L82 8" />
        <path {...trazo} d="M50 78 Q36 70 34 80 Q36 88 50 80 Q64 88 66 80 Q64 70 50 78 Z" />
      </svg>
    </span>
  );
}

export function Pastel({ className = '', src }: { className?: string; src?: string }) {
  if (src) return <Imagen src={src} className={className} />;
  return (
    <span className={`sticker inline-block rounded-[45%_55%_40%_60%/55%_40%_60%_45%] p-3 ${className}`}>
      <svg viewBox="0 0 100 120" width="96" height="116" aria-hidden>
        <circle {...trazo} cx="44" cy="16" r="6" />
        <circle {...trazo} cx="58" cy="14" r="6" />
        <path {...trazo} d="M26 34 Q50 26 74 34 V50 H26 Z" />
        <path {...trazo} d="M18 50 Q50 42 82 50 V72 H18 Z" />
        <path {...trazo} d="M10 72 Q50 62 90 72 V94 H10 Z" />
        <path {...trazo} d="M10 80 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0" />
        <path {...trazo} d="M30 104 Q50 98 70 104 V112 H30 Z" />
      </svg>
    </span>
  );
}

export function Corazon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="currentColor" d="M12 21s-7.5-4.6-9.4-9.1C1.2 8.5 3.3 5 6.6 5c2 0 3.5 1.1 4.4 2.6C11.9 6.1 13.4 5 15.4 5c3.3 0 5.4 3.5 4 6.9C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

// Sticker subido desde el panel (PNG con fondo transparente): conserva la sombra de recorte.
function Imagen({ src, className }: { src: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={110} className={`inline-block h-auto w-[110px] ${className}`} style={{ filter: 'drop-shadow(0 6px 8px rgb(0 0 0 / 0.35))' }} />
  );
}

export function Polaroid({ src, giro = 0, className = '', bn = false, ancha = false, cinta = false }: { src: string; giro?: number; className?: string; bn?: boolean; ancha?: boolean; cinta?: boolean }) {
  return (
    <figure className={`relative bg-white p-2 pb-8 ${className}`} style={{ transform: `rotate(${giro}deg)`, boxShadow: '0 12px 24px -8px rgb(0 0 0 / 0.5)' }}>
      {cinta && <span aria-hidden className="absolute -top-3 left-1/2 z-[1] h-6 w-20 -translate-x-1/2 -rotate-3 bg-white/70 shadow-[0_1px_3px_rgb(0_0_0/0.25)] backdrop-blur-[1px]" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" decoding="async" className={`w-full object-cover ${ancha ? 'aspect-[16/10]' : 'aspect-[4/5]'}`} style={{ filter: bn ? 'grayscale(1) contrast(1.08)' : undefined }} />
    </figure>
  );
}
