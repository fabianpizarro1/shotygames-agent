import { NextRequest, NextResponse } from 'next/server';
import { hablar } from '@/lib/voz';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { texto?: string } | null;
  const texto = body?.texto?.trim();
  if (!texto) return NextResponse.json({ error: 'Falta el texto' }, { status: 400 });
  try {
    const r = await hablar(texto);
    return new Response(r.body, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 502 });
  }
}
