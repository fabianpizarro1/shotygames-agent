import { NextRequest, NextResponse } from 'next/server';
import { transcribir } from '@/lib/voz';

export const maxDuration = 60;

// Una nota de voz de varios minutos pesa ~1-2 MB; Vercel corta en 4,5 MB.
const MAX_BYTES = 4 * 1024 * 1024;
const EXTENSIONES = [['webm', 'webm'], ['ogg', 'ogg'], ['mpeg', 'mp3'], ['mp3', 'mp3'], ['wav', 'wav'], ['m4a', 'm4a']] as const;

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const audio = form?.get('audio');
  if (!(audio instanceof Blob) || !audio.size) {
    return NextResponse.json({ error: 'No llegó el audio' }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Audio muy largo, mándalo en partes' }, { status: 413 });
  }
  // Safari graba en mp4 y Chrome en webm: la extensión le dice a OpenAI cuál es.
  const ext = EXTENSIONES.find(([tipo]) => audio.type.includes(tipo))?.[1] ?? 'mp4';
  try {
    const texto = await transcribir(audio, `nota.${ext}`);
    return NextResponse.json({ texto });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 502 });
  }
}
