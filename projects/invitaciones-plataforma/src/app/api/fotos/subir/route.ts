import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { estadoFotos } from '@/lib/fotos';
import { eventoPublico } from '@/lib/publico';

export const runtime = 'nodejs';

const MAX_FOTO = 3 * 1024 * 1024;
const MAX_MINI = 250 * 1024;
const golpes = new Map<string, number[]>();

// Toda la fiesta comparte el wifi (misma IP), así que el tope por IP es alto: solo frena abusos.
function demasiado(ip: string): boolean {
  const ahora = Date.now();
  const r = (golpes.get(ip) ?? []).filter((x) => ahora - x < 60_000);
  r.push(ahora);
  golpes.set(ip, r);
  return r.length > 600;
}

const MENSAJES = {
  antes: 'Las fotos se abren el día de la fiesta.',
  cerrada: 'Ya se cerró la subida de fotos.',
  apagada: 'Las fotos no están habilitadas.',
} as const;

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x';
  if (demasiado(ip)) return NextResponse.json({ ok: false, error: 'Demasiadas fotos a la vez. Espera un momento.' }, { status: 429 });

  const u = new URL(req.url).searchParams;
  const p = await eventoPublico(u);
  if (!p) return NextResponse.json({ ok: false, error: 'Evento no disponible' }, { status: 404 });
  const e = estadoFotos(p.config);
  if (e.subida !== 'abierta') return NextResponse.json({ ok: false, error: MENSAJES[e.subida] }, { status: 403 });

  const uploader = u.get('u') ?? '';
  const tipo = u.get('tipo') === 'mini' ? 'mini' : 'foto';
  const autor = (u.get('autor') ?? '').trim().slice(0, 60);
  const th = u.get('th') ?? '';
  if (!/^[A-Za-z0-9-]{8,40}$/.test(uploader)) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  if (tipo === 'foto' && !autor) return NextResponse.json({ ok: false, error: 'Escribe tu nombre para subir fotos.' }, { status: 400 });
  if (tipo === 'foto' && th && !/^[A-Za-z0-9-]{8,60}$/.test(th)) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });

  const datos = new Uint8Array(await req.arrayBuffer());
  if (!datos.length || datos.length > (tipo === 'mini' ? MAX_MINI : MAX_FOTO)) return NextResponse.json({ ok: false, error: 'La foto es demasiado grande.' }, { status: 413 });
  if (!(datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff)) return NextResponse.json({ ok: false, error: 'Solo se aceptan fotos JPG.' }, { status: 415 });

  try {
    // También en la miniatura: así una foto rechazada por el tope no deja una miniatura huérfana.
    const propias = (await db().fotosDe(p.evento.id)).filter((f) => f.uploader === uploader).length;
    if (propias >= e.maxPorPersona) return NextResponse.json({ ok: false, error: `Llegaste al máximo de ${e.maxPorPersona} fotos.` }, { status: 403 });
    const archivoId = randomUUID();
    await db().guardarArchivo({ id: archivoId, evento_id: p.evento.id, mime: 'image/jpeg', bytes: datos });
    if (tipo === 'foto') {
      await db().crearFoto({ id: randomUUID(), evento_id: p.evento.id, archivo_id: archivoId, mini_id: th, autor, uploader, visible: true, creada_at: new Date().toISOString() });
    }
    return NextResponse.json({ ok: true, id: archivoId });
  } catch (err) {
    console.error('[fotos/subir]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar la foto. Intenta de nuevo.' }, { status: 502 });
  }
}
