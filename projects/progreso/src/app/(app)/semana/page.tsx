import { cargarTodo } from '@/lib/datos';
import { hoyEC, lunesDe, sumarDias } from '@/lib/fecha';
import { cumplimientoSemana, ultimaMetrica } from '@/lib/calculos';
import { labelNegocio, progresoProyecto } from '@/lib/tipos';
import BarrasCumplimiento from '@/components/BarrasCumplimiento';
import RevisionSemanal from '@/components/RevisionSemanal';

export const dynamic = 'force-dynamic';

export default async function SemanaPage() {
  const datos = await cargarTodo();
  const hoy = hoyEC();
  const lunes = lunesDe(hoy);
  const domingo = sumarDias(lunes, 6);
  const c = cumplimientoSemana(datos, hoy);
  const anterior = cumplimientoSemana(datos, sumarDias(lunes, -1), sumarDias(lunes, -7));
  const hechas = datos.tareas.filter((t) => t.estado === 'HECHO' && t.completadaEn.slice(0, 10) >= lunes);
  const porNegocio = Object.entries(
    hechas.reduce<Record<string, number>>((a, t) => ({ ...a, [t.negocio]: (a[t.negocio] ?? 0) + 1 }), {})
  );
  const cierres = datos.dias.filter((d) => d.fecha >= lunes && d.fecha <= domingo && d.cerradoEn).length;
  const semana = datos.semanas.find((s) => s.semana === lunes) ?? {
    semana: lunes, funciono: '', noFunciono: '', dejar: '', delegar: '', automatizar: '', cuelloBotella: '', prioridades: '', resumenIa: '', cerradaEn: '',
  };
  const utilidad = ultimaMetrica(datos, 'UTILIDAD_MES');
  const deuda = ultimaMetrica(datos, 'DEUDA_TOTAL');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
          Revisión semanal · {lunes} → {domingo}
        </p>
        <h1 className="mt-1 text-2xl font-bold">30 minutos, no 3 horas</h1>
      </div>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="tarjeta p-3">
          <p className="text-2xl font-bold">{c.pct}%</p>
          <p className="text-[11px] text-[var(--color-texto-tenue)]">cumplimiento (antes {anterior.pct}%)</p>
        </div>
        <div className="tarjeta p-3">
          <p className="text-2xl font-bold">{hechas.length}</p>
          <p className="text-[11px] text-[var(--color-texto-tenue)]">tareas hechas</p>
        </div>
        <div className="tarjeta p-3">
          <p className="text-2xl font-bold">{cierres}/7</p>
          <p className="text-[11px] text-[var(--color-texto-tenue)]">días cerrados</p>
        </div>
      </section>

      <section className="tarjeta flex flex-col gap-1 p-4 text-sm">
        <p>
          Utilidad: <strong>{utilidad.actual === null ? 'sin dato' : `$${utilidad.actual.toLocaleString('es-EC')}`}</strong> de $5.000
        </p>
        <p>
          Deuda: <strong>{deuda.actual === null ? 'sin dato' : `$${deuda.actual.toLocaleString('es-EC')}`}</strong>
          {deuda.anterior !== null && deuda.actual !== null && ` (antes $${deuda.anterior.toLocaleString('es-EC')})`}
        </p>
        {porNegocio.length > 0 && (
          <p className="text-[var(--color-texto-suave)]">
            Hechas por negocio: {porNegocio.map(([n, k]) => `${labelNegocio(n)} ${k}`).join(' · ')}
          </p>
        )}
        {datos.proyectos
          .filter((p) => p.estado === 'ACTIVO')
          .map((p) => (
            <p key={p.id} className="text-[var(--color-texto-suave)]">
              {p.nombre}: {progresoProyecto(p)}%
            </p>
          ))}
      </section>

      <section className="tarjeta p-4">
        <BarrasCumplimiento items={c.items} />
      </section>

      <RevisionSemanal semana={semana} />
    </div>
  );
}
