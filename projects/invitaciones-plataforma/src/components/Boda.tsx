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
