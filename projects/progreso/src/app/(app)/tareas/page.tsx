import { cargarTodo } from '@/lib/datos';
import { hoyEC, diasEntre } from '@/lib/fecha';
import { tareasPendientesOrdenadas } from '@/lib/calculos';
import ListaTareas from '@/components/ListaTareas';
import BancoIdeas from '@/components/BancoIdeas';

export const dynamic = 'force-dynamic';

export default async function TareasPage() {
  const datos = await cargarTodo();
  const hoy = hoyEC();
  const ordenadas = tareasPendientesOrdenadas(datos, hoy);
  const esMuerta = (fecha: string) => Boolean(fecha) && diasEntre(fecha, hoy) > 60;

  const muertas = ordenadas.filter((t) => esMuerta(t.fecha_limite));
  const paraSoltar = ordenadas.filter((t) => t.paraSoltar && !esMuerta(t.fecha_limite));
  const activas = ordenadas.filter((t) => !t.paraSoltar && !esMuerta(t.fecha_limite));
  const hechas = datos.tareas
    .filter((t) => t.estado === 'HECHO' && t.completadaEn)
    .sort((a, b) => b.completadaEn.localeCompare(a.completadaEn))
    .slice(0, 15);
  const top3Ids = (datos.dias.find((d) => d.fecha === hoy)?.top3 ?? []).map((i) => i.id);
  const proyectos = datos.proyectos
    .filter((p) => p.estado !== 'TERMINADO')
    .sort((a, b) => a.orden - b.orden)
    .map((p) => ({ id: p.id, nombre: p.nombre }));
  const ideas = datos.inbox.filter((i) => i.estado === 'IDEA' || i.estado === 'NUEVO').reverse();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[var(--color-texto-tenue)]">
        Ordenadas por impacto (dinero, deudas, producto activo, urgencia), no por fecha. ⭐ = meter al Top 3 de hoy.
      </p>
      <ListaTareas
        hoy={hoy}
        activas={activas}
        paraSoltar={paraSoltar}
        muertas={muertas}
        hechas={hechas}
        top3Ids={top3Ids}
        proyectos={proyectos}
      />
      <BancoIdeas ideas={ideas} />
    </div>
  );
}
