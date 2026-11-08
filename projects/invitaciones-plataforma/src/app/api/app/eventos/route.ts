import { NextResponse } from 'next/server';
import { usuarioActual } from '@/lib/auth';
import { crearEvento } from '@/lib/eventos';

export async function POST(req: Request) {
  const u = await usuarioActual();
  if (!u) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    const { nombre, plantilla, festejado } = (await req.json()) as { nombre?: string; plantilla?: string; festejado?: string };
    const e = await crearEvento(u, { nombre: String(nombre ?? ''), plantilla: String(plantilla ?? 'cumple'), festejado });
    return NextResponse.json({ ok: true, id: e.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
}
