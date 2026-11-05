export type { InvitadoAdmin } from '@/lib/invitados-admin';
export type { CampoConfig } from '@/lib/config';

export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T & { ok: boolean; error?: string }> {
  const r = await fetch(url, init);
  if (r.status === 401) {
    window.location.href = '/admin/login';
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
