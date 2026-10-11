import type { Negocio, Ventanas } from '@/lib/negocio';

// Dinero y ventas leídos solos de los Sheets de negocio (CEO). Componente de
// servidor: solo muestra, no escribe nada.

const usd = (n: number) => `$${n.toLocaleString('es-EC', { maximumFractionDigits: n >= 1000 ? 0 : 2 })}`;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const corta = (f: string) => (f ? `${Number(f.slice(8))} ${MESES[Number(f.slice(5, 7)) - 1]}` : '—');

function Tarjeta({ label, valor, detalle, children }: { label: string; valor: string; detalle?: string; children?: React.ReactNode }) {
  return (
    <div className="tarjeta p-4">
      <p className="text-xs text-[var(--color-texto-tenue)]">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{valor}</p>
      {detalle && <p className="text-[11px] text-[var(--color-texto-tenue)]">{detalle}</p>}
      {children}
    </div>
  );
}

function Fila({ label, v, campo = 'ingreso' }: { label: string; v: Ventanas | null; campo?: 'ingreso' | 'utilidad' }) {
  const celda = (k: keyof Ventanas) =>
    v ? (
      <td className="px-2 py-2 text-right">
        <span className="font-semibold">{v[k].pedidos}</span>
        <span className="block text-[11px] text-[var(--color-texto-tenue)]">{usd(v[k][campo])}</span>
      </td>
    ) : (
      <td className="px-2 py-2 text-right text-xs text-[var(--color-texto-tenue)]">—</td>
    );
  return (
    <tr className="border-t border-[var(--color-borde)]">
      <td className="py-2 pr-2 text-sm">{label}</td>
      {celda('hoy')}
      {celda('semana')}
      {celda('mes')}
    </tr>
  );
}

export default function DineroNegocio({ negocio, mes }: { negocio: Negocio | null; mes: string }) {
  if (!negocio) {
    return <p className="tarjeta p-4 text-sm text-[var(--color-texto-suave)]">No pude leer los Sheets de negocio. Revisa la conexión y recarga.</p>;
  }
  const { deuda, caja } = negocio;
  const utilidad = negocio.utilidadCobradaMes;
  const calle = negocio.enCalle;
  const pctMeta = utilidad !== null ? Math.max(0, Math.min(100, Math.round((utilidad / 5000) * 100))) : 0;
  const cajaVieja = caja?.cuentas.filter((c) => c.saldo !== 0).map((c) => c.fecha).filter(Boolean).sort()[0] ?? '';
  const nombreMes = MESES[Number(mes.slice(5, 7)) - 1];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Tarjeta
          label="Deuda pendiente"
          valor={deuda ? usd(deuda.pendiente) : 'sin dato'}
          detalle={deuda ? `${deuda.cantidad} deudas · última anotada ${corta(deuda.ultimaRegistrada)}` : 'no se pudo leer DEUDAS'}
        />
        <Tarjeta
          label="Caja real"
          valor={caja ? usd(caja.total) : 'sin dato'}
          detalle={caja ? `${caja.cuentas.length} cuentas · la más vieja al ${corta(cajaVieja)}` : 'no se pudo leer SALDOS_REALES'}
        />
      </div>

      <Tarjeta
        label={`Utilidad cobrada (${nombreMes})`}
        valor={utilidad !== null ? `${usd(utilidad)} / $5.000` : 'sin dato'}
        detalle="Solo pedidos ya entregados o pagados (los devueltos restan el envío) + digitales + drop cobrado. Antes de publicidad y gastos fijos."
      >
        {utilidad !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-superficie-alta)]">
            <div className="h-full bg-[var(--color-verde)]" style={{ width: `${pctMeta}%` }} />
          </div>
        )}
        {calle && calle.pedidos > 0 && (
          <p className="mt-2 text-xs text-[var(--color-texto-suave)]">
            En la calle: <strong>{calle.pedidos} pedidos</strong> con <strong>{usd(calle.porCobrar)}</strong> de saldo por cobrar. No cuentan hasta que se
            entreguen.
            {calle.viejos > 0 && (
              <span className="text-[var(--color-ambar)]"> {calle.viejos} llevan más de 15 días: atascados o con el estado sin actualizar.</span>
            )}
          </p>
        )}
      </Tarjeta>

      <div className="tarjeta px-4 py-2">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-[var(--color-texto-tenue)]">
              <th className="py-1 text-left font-normal">Pedidos · ingreso</th>
              <th className="px-2 py-1 text-right font-normal">Hoy</th>
              <th className="px-2 py-1 text-right font-normal">Semana</th>
              <th className="px-2 py-1 text-right font-normal">Mes</th>
            </tr>
          </thead>
          <tbody>
            <Fila label="ShotyGames vendidos" v={negocio.fisicos} />
            <Fila label="ShotyGames cobrados" v={negocio.fisicosCobrados} />
            <Fila label="Digitales" v={negocio.digitales} />
            <Fila label="Drop generados" v={negocio.dropGenerados} />
            <Fila label="Drop cobrados" v={negocio.dropCobrados} />
          </tbody>
        </table>
      </div>

      {deuda && deuda.items.length > 0 && (
        <details className="tarjeta px-4 py-2.5 text-sm">
          <summary className="cursor-pointer text-xs text-[var(--color-texto-suave)]">Ver las {deuda.cantidad} deudas</summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {deuda.items.map((d, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="text-[var(--color-texto-suave)]">
                  {d.acreedor || d.negocio || 'Sin nombre'}
                  {d.vence && <span className="text-[11px] text-[var(--color-texto-tenue)]"> · vence {corta(d.vence)}</span>}
                </span>
                <span className="font-semibold">{usd(d.pendiente)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {negocio.errores.length > 0 && (
        <p className="rounded-lg bg-[var(--color-ambar-tenue)] px-3 py-2 text-xs text-[var(--color-ambar)]">No pude leer: {negocio.errores.join(' · ')}</p>
      )}
      <p className="text-[11px] text-[var(--color-texto-tenue)]">
        Se lee solo de Contabilidad, Pedidos, Ventas digitales y Dropshipping (cada 5 min). Para cambiar un número, cámbialo en su Sheet.
      </p>
    </div>
  );
}
