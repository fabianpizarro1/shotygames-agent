import { NextRequest, NextResponse } from 'next/server';
import { agendarProximas } from '@/lib/organizador';

// Cada domingo 20:00 de Ecuador (lunes 01:00 UTC, vercel.json) agenda en el
// calendario las tareas de proyectos que vencen en las próximas 2 semanas y
// todavía no tienen hora — incluidas las que se agendaron y no se hicieron.
// No usa la cookie de la app: Vercel manda "Bearer <CRON_SECRET>".

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    const r = await agendarProximas();
    return NextResponse.json({ ok: true, agendadas: r.agendadas.length, sinHueco: r.sinHueco.length, detalle: r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
