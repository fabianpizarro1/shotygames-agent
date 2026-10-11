import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { organizarProyecto } from '@/lib/organizador';
import { crearProyecto } from '@/lib/proyectos';
import { NEGOCIOS } from '@/lib/tipos';
import { autorizado } from '../permiso';

// Para el bot de Telegram: organizar un proyecto existente, o crearlo activo
// y organizarlo de una. Misma lógica que la pantalla Proyectos.
export const maxDuration = 300;

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Cuerpo = z.union([
  z.object({ proyecto_id: z.string(), fecha_limite: fecha }),
  z.object({
    crear: z.object({
      nombre: z.string().min(2),
      negocio: z.enum(NEGOCIOS.map((n) => n.id) as [string, ...string[]]),
      clase: z.enum(['PRODUCTO', 'SISTEMA']),
      objetivo: z.string(),
    }),
    fecha_limite: fecha,
  }),
]);

export async function POST(req: NextRequest) {
  if (!(await autorizado(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const r = Cuerpo.safeParse(await req.json().catch(() => null));
  if (!r.success) return NextResponse.json({ error: z.prettifyError(r.error) }, { status: 400 });
  try {
    if ('proyecto_id' in r.data) {
      return NextResponse.json({ ok: true, ...(await organizarProyecto(r.data.proyecto_id, r.data.fecha_limite)) });
    }
    const { id, plan } = await crearProyecto({ ...r.data.crear, fechaObjetivo: r.data.fecha_limite, empezar: true });
    return NextResponse.json({ ok: true, proyecto_id: id, ...plan });
  } catch (e) {
    // Errores de negocio ("Cartas Parejas sigue activo…"): el bot se los dice a Fabián.
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 422 });
  }
}
