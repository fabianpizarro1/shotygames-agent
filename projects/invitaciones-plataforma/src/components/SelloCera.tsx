// Sello de cera: borde ondulado e irregular, anillo en relieve, corona de laurel y la inicial en cursiva.
// Todo es un solo SVG estático (sin filtros pesados): el color se arma con color-mix a partir de `color`.

const C = 100; // centro del viewBox 200x200
const R = 84;

// Contorno de cera: radio que "respira" alrededor del círculo (5 lóbulos grandes + ondas finas).
function contorno(): string {
  const n = 140;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const r = R * (1 + 0.05 * Math.sin(5 * t + 0.7) + 0.028 * Math.sin(9 * t + 1.9) + 0.016 * Math.sin(3 * t + 0.2));
    pts.push(`${(C + r * Math.cos(t)).toFixed(2)} ${(C + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join(' L')}Z`;
}
const CONTORNO = contorno();

// Hojas de laurel a los dos lados (abierto arriba y abajo).
function hojas(): { x: number; y: number; rot: number; tam: number }[] {
  const out: { x: number; y: number; rot: number; tam: number }[] = [];
  const r = 55;
  for (const lado of [1, -1]) {
    for (let i = 0; i < 11; i++) {
      const angDeg = -66 + i * 13.2; // lado derecho: de arriba (-66°) hacia abajo
      const a = (angDeg * Math.PI) / 180;
      const x = C + lado * r * Math.cos(a);
      const y = C + r * Math.sin(a);
      // la punta de la hoja mira hacia arriba siguiendo el aro, alternando ±30° (el lado izquierdo es el espejo)
      const rot = lado * (angDeg + (i % 2 ? 30 : -30));
      out.push({ x, y, rot, tam: 1.45 - i * 0.02 });
    }
  }
  return out;
}
const HOJAS = hojas();

export function SelloCera({ inicial, color = '#8b1424', className = '' }: { inicial: string; color?: string; className?: string }) {
  const mezcla = (pct: number, con: string) => `color-mix(in srgb, ${color} ${pct}%, ${con})`;
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={className} style={{ overflow: 'visible', filter: 'none' }}>
      <defs>
        <radialGradient id="sello-cuerpo" cx="34%" cy="28%" r="82%">
          <stop offset="0" style={{ stopColor: mezcla(62, '#fff') }} />
          <stop offset="0.38" style={{ stopColor: color }} />
          <stop offset="1" style={{ stopColor: mezcla(52, '#000') }} />
        </radialGradient>
        <radialGradient id="sello-hueco" cx="60%" cy="65%" r="75%">
          <stop offset="0" style={{ stopColor: mezcla(78, '#000') }} />
          <stop offset="1" style={{ stopColor: mezcla(92, '#fff') }} />
        </radialGradient>
      </defs>
      {/* sombra de contacto */}
      <path d={CONTORNO} transform="translate(2 6)" fill="#000" opacity="0.28" />
      {/* cuerpo de cera */}
      <path d={CONTORNO} fill="url(#sello-cuerpo)" />
      <path d={CONTORNO} fill="none" stroke={mezcla(50, '#000')} strokeWidth="1.2" opacity="0.55" />
      {/* disco central hundido */}
      <circle cx={C} cy={C} r="66" fill="url(#sello-hueco)" />
      <circle cx={C} cy={C} r="66" fill="none" stroke={mezcla(45, '#000')} strokeWidth="1.6" opacity="0.7" />
      <circle cx={C} cy={C} r="67.6" fill="none" stroke={mezcla(55, '#fff')} strokeWidth="1" opacity="0.55" />
      {/* laurel */}
      <g>
        {HOJAS.map((h, i) => (
          <g key={i} transform={`translate(${h.x.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.rot.toFixed(1)}) scale(${h.tam.toFixed(3)})`}>
            <path d="M0 0 C 6 -5 6 -15 0 -22 C -6 -15 -6 -5 0 0Z" fill={mezcla(70, '#000')} opacity="0.85" />
            <path d="M0 -2 C 3 -7 3 -14 0 -19" fill="none" stroke={mezcla(55, '#fff')} strokeWidth="1" opacity="0.6" />
          </g>
        ))}
      </g>
      {/* inicial con relieve */}
      <text x={C + 1.5} y={C + (inicial.length > 1 ? 14 : 24.5)} textAnchor="middle" className="f-elegante" fontSize={inicial.length > 1 ? 46 : 76} fill={mezcla(40, '#000')} opacity="0.75">{inicial}</text>
      <text x={C} y={C + (inicial.length > 1 ? 12.5 : 23)} textAnchor="middle" className="f-elegante" fontSize={inicial.length > 1 ? 46 : 76} style={{ fill: mezcla(58, '#fff') }}>{inicial}</text>
      {/* brillo de cera */}
      <path d="M38 62 C 46 40 70 26 96 24" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.28" />
      <ellipse cx="58" cy="44" rx="9" ry="5" transform="rotate(-38 58 44)" fill="#fff" opacity="0.32" />
    </svg>
  );
}
