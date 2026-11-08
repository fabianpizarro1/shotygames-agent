import { configDeEvento, type Config } from './config';
import { db, type Evento } from './db';

// Las páginas y APIs públicas (fotos, playlist) identifican el evento por `?e=<slug>` (QR general)
// o por `?t=<token>` (enlace personal). Solo se atiende un evento PUBLICADO.
export async function eventoPublico(q: URLSearchParams): Promise<{ evento: Evento; config: Config; token: string } | null> {
  const token = q.get('t') ?? '';
  let evento: Evento | null = null;
  if (/^[A-Za-z0-9]{6,32}$/.test(token)) {
    const inv = await db().invitadoPorToken(token);
    if (inv) evento = await db().eventoPorId(inv.evento_id);
  } else if (q.get('e')) {
    evento = await db().eventoPorSlug(q.get('e') as string);
  }
  if (!evento || evento.estado !== 'publicado') return null;
  return { evento, config: configDeEvento(evento), token: /^[A-Za-z0-9]{6,32}$/.test(token) ? token : '' };
}
