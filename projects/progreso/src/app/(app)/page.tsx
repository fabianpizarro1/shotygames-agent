import Link from 'next/link';
import { cargarTodo } from '@/lib/datos';
import { agendaDe, bloqueActual } from '@/lib/agenda';
import { fechaLarga, hoyEC, horaEC } from '@/lib/fecha';
import {
  alertas,
  cumplimientoSemana,
  fallasDeAyer,
  habitosDelDia,
  productoActivo,
  tareasPendientesOrdenadas,
} from '@/lib/calculos';
import { CONTADORES, progresoProyecto } from '@/lib/tipos';
import Top3Hoy from '@/components/Top3Hoy';
import HabitosHoy from '@/components/HabitosHoy';
import ModoFoco from '@/components/ModoFoco';

export const dynamic = 'force-dynamic';

const COLOR_CLASE: Record<string, string> = {
  profundo: 'var(--color-acento)',
  operativo: 'var(--color-ambar)',
  revision: 'var(--color-verde)',
  personal: 'var(--color-texto-suave)',
  descanso: 'var(--color-texto-tenue)',
};

export default async function HoyPage() {
  const datos = await cargarTodo();
  const hoy = hoyEC();
  const hora = horaEC();
  const producto = productoActivo(datos);
  const agenda = agendaDe(hoy, producto?.nombre);
  const { actual, siguiente } = bloqueActual(agenda, hora);
  const dia = datos.dias.find((d) => d.fecha === hoy);
  const porId = new Map(datos.tareas.map((t) => [t.id, t]));

  const top3 = (dia?.top3 ?? []).map((it) => {
    const t = it.id ? porId.get(it.id) : undefined;
    return { ...it, texto: t?.tarea ?? it.texto, hecho: t?.estado === 'HECHO', negocio: t?.negocio ?? '' };
  });

  const habitos = habitosDelDia(hoy);
  const hechos = datos.rutina.filter((r) => r.fecha === hoy && r.cumplido).map((r) => r.bloque);
  const semana = cumplimientoSemana(datos, hoy);
  const contadores = CONTADORES.map((c) => ({
    id: c.id,
    label: c.label,
    meta: c.metaSemanal,
    hoy: datos.contadores.filter((x) => x.fecha === hoy && x.clave === c.id).reduce((a, x) => a + x.cantidad, 0),
    semana: semana.items.find((i) => i.id === c.id)?.hecho ?? 0,
  }));
  const fallas = fallasDeAyer(datos, hoy);
  const listaAlertas = alertas(datos, hoy);

  // Progreso del día = Top 3 + hábitos de hoy (lo que depende de él, nada más).
  const totalDia = top3.length + habitos.length;
  const hechoDia = top3.filter((t) => t.hecho).length + habitos.filter((h) => hechos.includes(h.id)).length;
  const pctDia = totalDia ? Math.round((hechoDia / totalDia) * 100) : 0;

  const tareaFoco = top3.find((t) => !t.hecho && t.id) ?? null;
  const mejor = tareasPendientesOrdenadas(datos, hoy)[0];
  const focoSugerido = tareaFoco ? { id: tareaFoco.id, texto: tareaFoco.texto } : mejor ? { id: mejor.id, texto: mejor.tarea } : null;
  const cerrado = Boolean(dia?.cerradoEn);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="text-xs font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
          Hoy — {fechaLarga(hoy)}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{dia?.mision || agenda.mision}</h1>
        {producto && (
          <p className="mt-1 text-sm text-[var(--color-texto-suave)]">
            Producto activo: <strong>{producto.nombre}</strong> · {progresoProyecto(producto)}%
          </p>
        )}
        {agenda.recordatorio && <p className="mt-1 text-sm text-[var(--color-texto-suave)]">{agenda.recordatorio}</p>}
      </section>

      <section className="tarjeta overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1.5" style={{ background: COLOR_CLASE[actual?.clase ?? 'descanso'] }} />
          <div className="flex-1 px-4 py-3">
            <p className="text-xs text-[var(--color-texto-tenue)]">Ahora · {hora}</p>
            <p className="font-semibold">{actual ? actual.titulo : 'Fuera de horario'}</p>
            {actual?.noHacer && <p className="mt-1 text-xs font-medium text-[var(--color-rojo)]">✕ {actual.noHacer}</p>}
            {siguiente && (
              <p className="mt-1 text-xs text-[var(--color-texto-tenue)]">
                Después: {siguiente.inicio} {siguiente.titulo}
              </p>
            )}
          </div>
        </div>
      </section>

      {listaAlertas.length > 0 && (
        <section className="flex flex-col gap-2">
          {listaAlertas.slice(0, 4).map((a, i) => (
            <p
              key={i}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{
                borderColor: a.nivel === 'rojo' ? 'var(--color-rojo)' : a.nivel === 'ambar' ? 'var(--color-ambar)' : 'var(--color-borde)',
                background: a.nivel === 'rojo' ? 'var(--color-rojo-tenue)' : a.nivel === 'ambar' ? 'var(--color-ambar-tenue)' : 'var(--color-superficie)',
              }}
            >
              {a.texto}
            </p>
          ))}
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="titulo-seccion">Top 3</h2>
          <span className="text-xs text-[var(--color-texto-tenue)]">Día {pctDia}%</span>
        </div>
        <Top3Hoy fecha={hoy} items={top3} />
        <div className="mt-2">
          <ModoFoco fecha={hoy} tarea={focoSugerido} />
        </div>
      </section>

      <section>
        <h2 className="titulo-seccion">Rutina</h2>
        <HabitosHoy
          fecha={hoy}
          habitos={habitos}
          hechos={hechos}
          contadores={contadores}
          fallasAyer={fallas.map((f) => f.id)}
        />
      </section>

      <section>
        <details className="tarjeta">
          <summary className="pulsable cursor-pointer px-4 py-3 text-sm font-medium text-[var(--color-texto-suave)]">
            Agenda completa de hoy
          </summary>
          <ul className="border-t border-[var(--color-borde)] px-4 py-2">
            {agenda.bloques.map((b) => (
              <li
                key={b.inicio}
                className={`flex gap-3 py-1.5 text-sm ${b === actual ? 'font-semibold' : 'text-[var(--color-texto-suave)]'}`}
              >
                <span className="w-11 shrink-0 tabular-nums" style={{ color: COLOR_CLASE[b.clase] }}>
                  {b.inicio}
                </span>
                <span>{b.titulo}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <Link
        href="/cerrar"
        className={`pulsable block rounded-[var(--radius-tarjeta)] px-4 py-4 text-center font-semibold ${
          cerrado ? 'border border-[var(--color-verde)] text-[var(--color-verde)]' : 'boton-primario'
        }`}
      >
        {cerrado ? '✓ Día cerrado — ver cierre' : 'Cerrar el día (2-5 min)'}
      </Link>
    </div>
  );
}
