import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getConfig } from '@/lib/config';
import { listarFotos } from '@/lib/drive';
import { estadoFotos } from '@/lib/fotos';

const visibles = unstable_cache(async () => (await listarFotos()).filter((f) => f.visible), ['fotos-visibles'], { tags: ['fotos'], revalidate: 20 });

// La galería no existe para el público hasta la hora configurada: antes de eso no se devuelve ni una URL.
export async function GET() {
  const e = estadoFotos(await getConfig());
  if (!e.galeriaAbierta) return NextResponse.json({ ok: true, abierta: false, fotos: [] });
  try {
    const fotos = (await visibles()).slice(0, 800).map((f) => ({
      id: f.id,
      url: `/media/${f.id}`,
      mini: `/media/${f.miniatura || f.id}`,
      autor: f.autor,
      creada: f.creada,
    }));
    return NextResponse.json({ ok: true, abierta: true, fotos });
  } catch (err) {
    console.error('[fotos/lista]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo cargar la galería' }, { status: 502 });
  }
}
