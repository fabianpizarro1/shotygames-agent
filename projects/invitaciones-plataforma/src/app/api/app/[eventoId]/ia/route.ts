import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { excedeLimite, IaNoConfigurada, proponerDiseno } from '@/lib/ia';

export const maxDuration = 60;

// Devuelve una PROPUESTA de diseño (valores de configuración). No guarda nada: el panel la muestra en la
// vista previa y el cliente decide si la guarda.
export async function POST(req: Request, { params }: { params: Promise<{ eventoId: string }> }) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { descripcion?: string; estilo?: string; colores?: string };
  const descripcion = String(b.descripcion ?? '').trim().slice(0, 600);
  if (descripcion.length < 8) return NextResponse.json({ ok: false, error: 'Cuéntame un poco más de cómo quieres tu invitación.' }, { status: 400 });
  if (excedeLimite(p.usuario.id)) return NextResponse.json({ ok: false, error: 'Llegaste al límite de propuestas por ahora. Intenta de nuevo en un rato.' }, { status: 429 });
  try {
    const cambios = await proponerDiseno(p.evento, { descripcion, estilo: String(b.estilo ?? '').slice(0, 40), colores: String(b.colores ?? '').slice(0, 60) });
    return NextResponse.json({ ok: true, cambios });
  } catch (e) {
    if (e instanceof IaNoConfigurada) return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
    console.error('[ia]', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'No se pudo crear la propuesta' }, { status: 502 });
  }
}
