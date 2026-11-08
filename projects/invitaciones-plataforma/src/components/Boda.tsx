import type { CSSProperties } from 'react';

// Adornos propios de la plantilla de boda (dibujados en código: sin derechos de terceros).

// Rama de olivo: tallo curvo con hojas a ambos lados.
export function Rama({ className = '', espejo = false, style }: { className?: string; espejo?: boolean; style?: CSSProperties }) {
  const hojas = [
    [28, 78, -38], [42, 64, 34], [58, 54, -36], [74, 44, 32], [92, 36, -34], [110, 29, 30], [130, 24, -30], [150, 21, 26],
  ] as const;
  return (
    <svg viewBox="0 0 190 100" aria-hidden className={`pointer-events-none absolute ${className}`} style={{ transform: espejo ? 'scaleX(-1)' : undefined, color: 'var(--acento)', ...style }}>
      <path d="M6 94 C 44 88 92 62 176 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      {hojas.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 0 C 5 -8 5 -17 0 -25 C -5 -17 -5 -8 0 0Z" fill="currentColor" opacity={0.5 + (i % 3) * 0.1} />
        </g>
      ))}
      <g transform="translate(176 20) rotate(8)">
        <path d="M0 0 C 4 -7 4 -14 0 -21 C -4 -14 -4 -7 0 0Z" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  );
}

// Filete fino con un rombo al centro.
export function Divisor({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`mx-auto flex items-center justify-center gap-3 ${className}`} style={{ color: 'var(--acento)' }}>
      <span className="h-px w-14" style={{ background: 'linear-gradient(to right, transparent, currentColor)' }} />
      <svg viewBox="0 0 12 12" width="9" height="9"><path d="M6 0 L12 6 L6 12 L0 6Z" fill="currentColor" /></svg>
      <span className="h-px w-14" style={{ background: 'linear-gradient(to left, transparent, currentColor)' }} />
    </div>
  );
}

// Corona de quinceañera (dibujo propio, dorada).
export function Corona({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 80" aria-hidden className={`pointer-events-none absolute ${className}`} style={{ color: 'var(--acento)', ...style }}>
      <path d="M12 66 L6 24 L36 44 L60 12 L84 44 L114 24 L108 66 Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 66 H108" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 74 H104" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      {[[6, 24], [60, 12], [114, 24]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4.2" fill="currentColor" />)}
      {[[36, 52], [60, 46], [84, 52]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="currentColor" opacity="0.8" />)}
    </svg>
  );
}

// Mariposa estática (dibujo propio).
export function Mariposa({ className = '', espejo = false, style }: { className?: string; espejo?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden className={`pointer-events-none absolute ${className}`} style={{ color: 'var(--acento)', transform: espejo ? 'scaleX(-1)' : undefined, ...style }}>
      <path d="M32 28 C 24 10 6 4 4 14 C 2 24 14 32 32 28Z" fill="currentColor" opacity="0.38" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 28 C 40 10 58 4 60 14 C 62 24 50 32 32 28Z" fill="currentColor" opacity="0.38" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 28 C 22 34 14 50 24 52 C 32 54 32 40 32 28Z" fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 28 C 42 34 50 50 40 52 C 32 54 32 40 32 28Z" fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 18 V 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 18 C 28 10 24 8 22 6 M32 18 C 36 10 40 8 42 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
