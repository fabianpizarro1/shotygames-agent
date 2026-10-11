import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cambiarEstadoProyecto } from '@/lib/proyectos';
import { autorizado } from '../permiso';

// Para el bot de Telegram: activar, pausar, terminar o devolver a la cola un
// proyecto, con las mismas reglas que la pantalla Proyectos.
const Cuerpo = z.object({ proyecto_id: z.string(), estado: z.enum(['ACTIVO', 'PAUSADO', 'EN_COLA', 'TERMINADO']) });

export async function POST(req: NextRequest) {
  if (!(await autorizado(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const r = Cuerpo.safeParse(await req.json().catch(() => null));
  if (!r.success) return NextResponse.json({ error: z.prettifyError(r.error) }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, cambio: await cambiarEstadoProyecto(r.data.proyecto_id, r.data.estado) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 422 });
  }
}
