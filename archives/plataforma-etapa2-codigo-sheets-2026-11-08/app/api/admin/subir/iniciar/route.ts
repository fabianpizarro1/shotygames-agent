import { NextResponse } from 'next/server';
import { esAdmin } from '@/lib/admin-auth';
import { MAX_BYTES, TIPOS_PERMITIDOS, iniciarSubida } from '@/lib/drive';

export async function POST(req: Request) {
  if (!(await esAdmin())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    const { nombre, tipo, bytes } = (await req.json()) as { nombre?: string; tipo?: string; bytes?: number };
    if (!tipo || !TIPOS_PERMITIDOS.includes(tipo)) throw new Error('Tipo de archivo no permitido (JPG, PNG, WebP o MP3/M4A)');
    if (!bytes || bytes < 1 || bytes > MAX_BYTES) throw new Error('El archivo supera los 25 MB');
    const limpio = String(nombre ?? 'archivo').replace(/[^\w.\- ]+/g, '_').slice(0, 80);
    return NextResponse.json({ ok: true, sesion: await iniciarSubida(limpio, tipo, bytes) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
