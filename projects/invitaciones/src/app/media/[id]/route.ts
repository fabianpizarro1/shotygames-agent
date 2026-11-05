import { leerArchivo } from '@/lib/drive';

export const runtime = 'nodejs';

// Sirve los archivos de la carpeta de Drive (con Range, necesario para audio en iPhone).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const r = await leerArchivo(id, req.headers.get('range'));
    return r ?? new Response('No encontrado', { status: 404 });
  } catch (e) {
    console.error('[media]', e);
    return new Response('Error', { status: 502 });
  }
}
