import { cargarTodo } from '@/lib/datos';
import { fechaLarga, hoyEC } from '@/lib/fecha';
import CierreDia from '@/components/CierreDia';

export const dynamic = 'force-dynamic';

export default async function CerrarPage() {
  const datos = await cargarTodo();
  const hoy = hoyEC();
  const dia = datos.dias.find((d) => d.fecha === hoy);
  const completadasHoy = datos.tareas
    .filter((t) => t.estado === 'HECHO' && t.completadaEn.startsWith(hoy))
    .map((t) => t.tarea.toLowerCase());

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
          Cierre — {fechaLarga(hoy)}
        </p>
        <h1 className="mt-1 text-2xl font-bold">2-5 minutos y a descansar</h1>
      </div>
      <CierreDia
        inicial={{
          terminado: dia?.terminado ?? '',
          pendiente: dia?.pendiente ?? '',
          aprendido: dia?.aprendido ?? '',
          problema: dia?.problema ?? '',
          manana: dia?.manana ?? '',
        }}
        completadasHoy={completadasHoy}
        yaCerrado={Boolean(dia?.cerradoEn)}
      />
    </div>
  );
}
