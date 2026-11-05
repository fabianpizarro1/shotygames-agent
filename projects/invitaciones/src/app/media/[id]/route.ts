import { leerArchivo } from '@/lib/drive';

export const runtime = 'nodejs';

// Sirve los archivos de la carpeta de Drive (con Range, necesario para audio en iPhone).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const r = await leerArchivo(id, req.headers.get('range'));
    if (!r) return new Response('No encontrado', { status: 404 });
    // ?d=1 fuerza la descarga (botón "Descargar" de la galería).
    if (new URL(req.url).searchParams.has('d')) {
      const h = new Headers(r.headers);
      h.set('Content-Disposition', 'attachment; filename="foto-fiesta.jpg"');
      return new Response(r.body, { status: r.status, headers: h });
    }
    return r;
  } catch (e) {
    console.error('[media]', e);
    return new Response('Error', { status: 502 });
  }
}
