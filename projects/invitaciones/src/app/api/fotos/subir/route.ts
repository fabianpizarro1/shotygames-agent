import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { contarFotosDe, subirSimple } from '@/lib/drive';
import { estadoFotos } from '@/lib/fotos';

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

  const c = await getConfig();
  const e = estadoFotos(c);
  if (e.subida !== 'abierta') return NextResponse.json({ ok: false, error: MENSAJES[e.subida] }, { status: 403 });

  const u = new URL(req.url).searchParams;
  const uploader = u.get('u') ?? '';
  const tipo = u.get('tipo') === 'mini' ? 'mini' : 'foto';
  const autor = (u.get('autor') ?? '').trim().slice(0, 60);
  const th = u.get('th') ?? '';
  if (!/^[A-Za-z0-9-]{8,40}$/.test(uploader)) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  if (tipo === 'foto' && !autor) return NextResponse.json({ ok: false, error: 'Escribe tu nombre para subir fotos.' }, { status: 400 });
  if (tipo === 'foto' && th && !/^[A-Za-z0-9_-]{10,80}$/.test(th)) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });

  const datos = new Uint8Array(await req.arrayBuffer());
  if (!datos.length || datos.length > (tipo === 'mini' ? MAX_MINI : MAX_FOTO)) {
    return NextResponse.json({ ok: false, error: 'La foto es demasiado grande.' }, { status: 413 });
  }
  if (!(datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff)) {
    return NextResponse.json({ ok: false, error: 'Solo se aceptan fotos JPG.' }, { status: 415 });
  }

  try {
    // También en la miniatura: así una foto rechazada por el tope no deja una miniatura huérfana.
    if ((await contarFotosDe(uploader)) >= e.maxPorPersona) {
      return NextResponse.json({ ok: false, error: `Llegaste al máximo de ${e.maxPorPersona} fotos.` }, { status: 403 });
    }
    const id = await subirSimple(
      `${tipo === 'mini' ? 'mini' : 'foto'}-${Date.now()}.jpg`,
      'image/jpeg',
      datos,
      tipo === 'mini' ? { tipo: 'miniatura', uploader } : { tipo: 'fiesta', autor, uploader, visible: 'si', ...(th ? { th } : {}) },
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[fotos/subir]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar la foto. Intenta de nuevo.' }, { status: 502 });
  }
}
