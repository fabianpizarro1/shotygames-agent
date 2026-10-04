import InterruptorTema from './InterruptorTema';

export default function CabeceraProgreso({
  nivel,
  xpTotal,
  progresoPct,
  semanaPct,
}: {
  nivel: number;
  xpTotal: number;
  progresoPct: number;
  semanaPct: number;
}) {
  const colorSemana =
    semanaPct >= 80 ? 'var(--color-verde)' : semanaPct >= 50 ? 'var(--color-ambar)' : 'var(--color-rojo)';
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">Nivel {nivel}</p>
          <p className="text-lg font-bold">{xpTotal} XP</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-right">
            <p className="text-xs text-[var(--color-texto-tenue)]">Semana (meta 80%)</p>
            <p className="text-lg font-bold" style={{ color: colorSemana }}>
              {semanaPct}%
            </p>
          </div>
          <InterruptorTema />
        </div>
      </div>
      <div className="h-1.5 w-full bg-[var(--color-superficie-alta)]">
        <div
          className="h-full bg-[var(--color-acento)] transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progresoPct))}%` }}
        />
      </div>
    </div>
  );
}
