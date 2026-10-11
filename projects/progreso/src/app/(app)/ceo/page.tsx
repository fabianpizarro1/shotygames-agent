import Link from 'next/link';
import { cargarTodo } from '@/lib/datos';
import { hoyEC, lunesDe } from '@/lib/fecha';
import { cumplimientoSemana, productoActivo, tareasPendientesOrdenadas, ultimaMetrica } from '@/lib/calculos';
import { labelNegocio, progresoProyecto } from '@/lib/tipos';
import MetricaEditable from '@/components/MetricaEditable';
import CuelloBotella from '@/components/CuelloBotella';
import BarrasCumplimiento from '@/components/BarrasCumplimiento';
import DineroNegocio from '@/components/DineroNegocio';

export const dynamic = 'force-dynamic';

// Modo CEO: objetivos, problemas, dinero, proyectos, sistemas. Nada de tareas chicas.
export default async function CeoPage() {
  const datos = await cargarTodo();
  const hoy = hoyEC();
  const semana = cumplimientoSemana(datos, hoy);
  const m = (c: string) => ultimaMetrica(datos, c);
  const producto = productoActivo(datos);
  const activos = datos.proyectos.filter((p) => p.estado === 'ACTIVO').sort((a, b) => a.orden - b.orden);
  const pendientes = tareasPendientesOrdenadas(datos, hoy);
  const paraSoltar = pendientes.filter((t) => t.paraSoltar);
  const sinDecidir = pendientes.filter((t) => !t.decision && (t.tipo === 'OPERATIVO' || t.tipo === 'ADMINISTRATIVO')).length;
  const cuello = datos.semanas.find((s) => s.semana === lunesDe(hoy))?.cuelloBotella ?? '';
  const delegadas = datos.tareas.filter((t) => t.estado === 'HECHO' && ['DELEGAR', 'TERCERIZAR', 'AUTOMATIZAR'].includes(t.decision)).length;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="titulo-seccion">Dinero y ventas</h2>
        <DineroNegocio negocio={datos.negocio} mes={hoy} />
      </section>

      <section>
        <h2 className="titulo-seccion">Cuello de botella de la semana</h2>
        <CuelloBotella actual={cuello} />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="titulo-seccion">Semana — {semana.pct}% (meta 80%)</h2>
          <Link href="/semana" className="text-xs font-semibold text-[var(--color-acento)]">
            Revisión semanal →
          </Link>
        </div>
        <div className="tarjeta p-4">
          <BarrasCumplimiento items={semana.items} />
        </div>
      </section>

      <section>
        <h2 className="titulo-seccion">Tiempo de Fabián</h2>
        <div className="grid grid-cols-2 gap-3">
          <MetricaEditable clave="HORAS_OPERATIVAS" label="Horas operativas/sem" bajarEsBueno {...val(m('HORAS_OPERATIVAS'))} />
          <MetricaEditable clave="HORAS_ESTRATEGICAS" label="Horas estratégicas/sem" {...val(m('HORAS_ESTRATEGICAS'))} />
        </div>
      </section>

      <section>
        <h2 className="titulo-seccion">Proyectos activos</h2>
        <ul className="tarjeta divide-y divide-[var(--color-borde)]">
          {activos.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span>
                {p.nombre}
                <span className="text-xs text-[var(--color-texto-tenue)]"> · {labelNegocio(p.negocio)}</span>
                {p === producto && <span className="text-xs font-semibold text-[var(--color-acento)]"> · producto activo</span>}
              </span>
              <span className="font-semibold">{progresoProyecto(p)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="titulo-seccion">Sistemas y delegación</h2>
        <div className="tarjeta flex flex-col gap-2 p-4 text-sm">
          <p>
            <strong>{delegadas}</strong> tareas resueltas delegando, tercerizando o automatizando.
          </p>
          <p>
            <strong className={paraSoltar.length ? 'text-[var(--color-ambar)]' : ''}>{paraSoltar.length}</strong> marcadas para
            soltar que siguen contigo
            {paraSoltar.length > 0 && ':'}
          </p>
          {paraSoltar.slice(0, 5).map((t) => (
            <p key={t.id} className="pl-3 text-xs text-[var(--color-texto-suave)]">
              • {t.tarea.toLowerCase()} ({t.decision.toLowerCase()}
              {t.responsable ? ` → ${t.responsable}` : ''})
            </p>
          ))}
          {sinDecidir > 0 && (
            <p className="text-xs text-[var(--color-texto-tenue)]">
              {sinDecidir} tareas operativas sin decidir si las haces tú. Ábrelas en Tareas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function val(x: { actual: number | null; anterior: number | null; fecha: string }) {
  return { valor: x.actual, anterior: x.anterior, fecha: x.fecha };
}
