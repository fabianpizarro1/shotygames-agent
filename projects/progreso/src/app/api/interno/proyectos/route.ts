import { NextRequest, NextResponse } from 'next/server';
import { leerTodo } from '@/lib/datos';
import { progresoProyecto } from '@/lib/tipos';
import { autorizado } from '../permiso';

// Para el bot de Telegram: los proyectos con sus ids, para poder organizarlos.
export async function GET(req: NextRequest) {
  if (!(await autorizado(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const d = await leerTodo();
  return NextResponse.json(
    d.proyectos
      .filter((p) => p.estado !== 'TERMINADO')
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        negocio: p.negocio,
        clase: p.clase,
        estado: p.estado,
        fecha_limite: p.fechaObjetivo,
        avance: progresoProyecto(p),
        tareas_pendientes: d.tareas.filter((t) => t.proyectoId === p.id && t.estado === 'PENDIENTE').length,
      }))
  );
}
