import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { contarFotosDe } from '@/lib/drive';
import { estadoFotos } from '@/lib/fotos';

export async function GET(req: Request) {
  const e = estadoFotos(await getConfig());
  const u = new URL(req.url).searchParams.get('u') ?? '';
  let subidas = 0;
  try {
    if (e.subida === 'abierta') subidas = await contarFotosDe(u);
  } catch (err) {
    console.error('[fotos/estado]', err);
  }
  return NextResponse.json({ ok: true, subida: e.subida, galeriaAbierta: e.galeriaAbierta, max: e.maxPorPersona, subidas });
}
