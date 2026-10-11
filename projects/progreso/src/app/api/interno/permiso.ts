import type { NextRequest } from 'next/server';
import { tokenInterno } from '@/lib/auth';

/** El bot de Telegram manda "Bearer <tokenInterno>". La cookie de la app no aplica acá. */
export async function autorizado(req: NextRequest): Promise<boolean> {
  return req.headers.get('authorization') === `Bearer ${await tokenInterno()}`;
}
