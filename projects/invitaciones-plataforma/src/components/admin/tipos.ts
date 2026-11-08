export type { InvitadoAdmin } from '@/lib/invitados-admin';
export type { CampoConfig } from '@/lib/config';

// Los componentes del panel llaman a /api/admin/...; aquí se reescribe a /api/app/<evento>/...
// para que cada pantalla trabaje siempre sobre el evento abierto (y el servidor lo verifica).
let eventoActual = '';
export const usarEvento = (id: string) => {
  eventoActual = id;
};
const aRutaDelEvento = (url: string) => (eventoActual ? url.replace('/api/admin/', `/api/app/${eventoActual}/`) : url);

export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T & { ok: boolean; error?: string }> {
  const r = await fetch(aRutaDelEvento(url), init);
  if (r.status === 401) {
    window.location.href = '/login';
    throw new Error('Sesión vencida');
  }
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inválida' }));
  return j;
}

export const json = (metodo: string, cuerpo: unknown): RequestInit => ({
  method: metodo,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo),
});
