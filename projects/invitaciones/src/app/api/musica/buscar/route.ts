import { NextResponse } from 'next/server';
import { buscarCanciones } from '@/lib/musica';

const golpes = new Map<string, number[]>();

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x';
  const ahora = Date.now();
  const r = (golpes.get(ip) ?? []).filter((x) => ahora - x < 60_000);
  r.push(ahora);
  golpes.set(ip, r);
  if (r.length > 300) return NextResponse.json({ ok: false, error: 'Demasiadas búsquedas. Espera un momento.' }, { status: 429 });

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ ok: true, resultados: [] });
  try {
    return NextResponse.json({ ok: true, resultados: await buscarCanciones(q) });
  } catch (e) {
    console.error('[musica/buscar]', e);
    return NextResponse.json({ ok: false, error: 'No se pudo buscar ahora. Intenta de nuevo.' }, { status: 502 });
  }
}
