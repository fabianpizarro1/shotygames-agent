import type { ItemCumplimiento } from '@/lib/calculos';

export default function BarrasCumplimiento({ items }: { items: ItemCumplimiento[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((i) => {
        const pct = Math.min(100, Math.round((i.hecho / i.meta) * 100));
        const atrasado = i.hecho < i.esperado;
        return (
          <li key={i.id} className="text-sm">
            <div className="flex justify-between">
              <span>{i.label}</span>
              <span className={atrasado ? 'font-semibold text-[var(--color-ambar)]' : 'text-[var(--color-texto-suave)]'}>
                {i.hecho}/{i.meta}
                {atrasado && <span className="text-xs font-normal"> (deberías ir en {i.esperado})</span>}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-superficie-alta)]">
              <div
                className="h-full"
                style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--color-verde)' : atrasado ? 'var(--color-ambar)' : 'var(--color-acento)' }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
