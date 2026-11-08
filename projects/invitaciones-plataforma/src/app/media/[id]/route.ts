import { db } from '@/lib/db';

export const runtime = 'nodejs';

// Sirve los archivos del evento (fotos, imágenes del editor). Con Range por si algún navegador lo pide.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db().leerArchivo(id);
  if (!a) return new Response('No encontrado', { status: 404 });
  const total = a.bytes.length;
  const h = new Headers({
    'Content-Type': a.mime,
    'Accept-Ranges': 'bytes',
    // El id cambia con cada subida: el contenido de un id nunca cambia.
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
  });
  // ?d=1 fuerza la descarga (botón "Descargar" de la galería).
  if (new URL(req.url).searchParams.has('d')) h.set('Content-Disposition', 'attachment; filename="foto-fiesta.jpg"');
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (m && (m[1] || m[2])) {
    const ini = m[1] ? parseInt(m[1], 10) : Math.max(0, total - parseInt(m[2], 10));
    const fin = m[1] && m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    if (ini >= total || ini > fin) return new Response('Rango no válido', { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
    h.set('Content-Range', `bytes ${ini}-${fin}/${total}`);
    h.set('Content-Length', String(fin - ini + 1));
    return new Response(a.bytes.slice(ini, fin + 1) as BodyInit, { status: 206, headers: h });
  }
  h.set('Content-Length', String(total));
  return new Response(a.bytes as BodyInit, { status: 200, headers: h });
}
