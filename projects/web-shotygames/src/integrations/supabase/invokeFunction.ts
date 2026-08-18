// Llama a una Edge Function de Supabase con un fetch plano.
//
// Por qué no usamos `supabase.functions.invoke()`: importar
// @supabase/supabase-js metía ~120 KB (min) en el chunk de /pago-tarjeta —
// la página del checkout con tarjeta, justo donde más caro sale que el
// cliente espere. Toda la app usaba el SDK para exactamente UNA llamada
// (payphone-config), sin auth, sin realtime, sin queries. Esto replica el
// contrato de `invoke`: mismo endpoint, mismos headers y el mismo
// `{ data, error }` que ya esperaba PayphoneCheckout.

const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function invokeFunction<T = unknown>(
  name: string,
  body?: unknown,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const res = await fetch(`${URL_BASE}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      return { data: null, error: new Error(`Edge function ${name}: HTTP ${res.status}`) };
    }
    return { data: (await res.json()) as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
