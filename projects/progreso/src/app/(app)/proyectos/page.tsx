import { cargarTodo } from '@/lib/datos';
import { diasEntre, hoyEC } from '@/lib/fecha';
import { MAX_PROYECTOS_ACTIVOS, type Proyecto } from '@/lib/tipos';
import TarjetaProyecto from '@/components/TarjetaProyecto';
import NuevoProyecto from '@/components/NuevoProyecto';

export const dynamic = 'force-dynamic';

export default async function ProyectosPage() {
  const datos = await cargarTodo();
  const hoy = hoyEC();
  const orden = (a: Proyecto, b: Proyecto) => a.orden - b.orden;
  const de = (e: Proyecto['estado']) => datos.proyectos.filter((p) => p.estado === e).sort(orden);
  const activos = de('ACTIVO');

  const tarjeta = (p: Proyecto) => (
    <TarjetaProyecto
      key={p.id}
      p={p}
      pendientes={datos.tareas.filter((t) => t.proyectoId === p.id && t.estado === 'PENDIENTE').length}
      diasSinAvance={p.actualizado ? diasEntre(p.actualizado.slice(0, 10), hoy) : null}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="titulo-seccion">
          Activos ({activos.length}/{MAX_PROYECTOS_ACTIVOS})
        </h2>
        <p className="mb-3 text-xs text-[var(--color-texto-tenue)]">
          Un producto activo por negocio. Para activar otro, termina o pausa el actual.
        </p>
        <ul className="flex flex-col gap-3">{activos.map(tarjeta)}</ul>
      </section>

      {de('EN_COLA').length > 0 && (
        <section>
          <h2 className="titulo-seccion">En cola — en este orden</h2>
          <ul className="flex flex-col gap-2">{de('EN_COLA').map(tarjeta)}</ul>
        </section>
      )}

      {de('PAUSADO').length > 0 && (
        <section>
          <h2 className="titulo-seccion">Pausados</h2>
          <ul className="flex flex-col gap-2">{de('PAUSADO').map(tarjeta)}</ul>
        </section>
      )}

      <NuevoProyecto activos={activos.length} />

      {de('TERMINADO').length > 0 && (
        <details>
          <summary className="titulo-seccion cursor-pointer">Terminados ({de('TERMINADO').length})</summary>
          <ul className="flex flex-col gap-2">{de('TERMINADO').map(tarjeta)}</ul>
        </details>
      )}
    </div>
  );
}
