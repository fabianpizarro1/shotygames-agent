import { NextResponse } from 'next/server';
import { esAdmin } from '@/lib/admin-auth';
import { subirTrozo } from '@/lib/drive';

export const runtime = 'nodejs';

// El navegador manda trozos de ≤ 3 MB (múltiplos de 256 KB, salvo el último) con la sesión en la URL.
export async function POST(req: Request) {
  if (!(await esAdmin())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    const u = new URL(req.url);
    const sesion = u.searchParams.get('sesion') ?? '';
    const inicio = Number(u.searchParams.get('inicio'));
    const total = Number(u.searchParams.get('total'));
    const datos = new Uint8Array(await req.arrayBuffer());
    if (!datos.length || !Number.isFinite(inicio) || !Number.isFinite(total)) throw new Error('Trozo inválido');
    const r = await subirTrozo(sesion, datos, inicio, total);
    return NextResponse.json(r.listo ? { ok: true, listo: true, url: `/media/${r.id}` } : { ok: true, listo: false });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
