import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const MAX = 3 * 1024 * 1024; // el navegador reduce la imagen antes de subirla; Vercel limita cada petición a ~4,5 MB

// Imágenes del editor (tu foto, foto del lugar, galería). Solo JPG/PNG/WebP, verificadas por su cabecera.
function tipoDe(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

export async function POST(req: Request, { params }: { params: Promise<{ eventoId: string }> }) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const datos = new Uint8Array(await req.arrayBuffer());
  if (!datos.length || datos.length > MAX) return NextResponse.json({ ok: false, error: 'La imagen es demasiado grande (máximo 3 MB).' }, { status: 413 });
  const mime = tipoDe(datos);
  if (!mime) return NextResponse.json({ ok: false, error: 'Solo se aceptan imágenes JPG, PNG o WebP.' }, { status: 415 });
  const id = randomUUID();
  await db().guardarArchivo({ id, evento_id: p.evento.id, mime, bytes: datos });
  return NextResponse.json({ ok: true, url: `/media/${id}` });
}
