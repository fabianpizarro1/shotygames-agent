// Dispara el mismo evento en Meta Pixel y TikTok Pixel a la vez — un solo
// punto de entrada para no repetir el chequeo `typeof window.fbq` (y ahora
// `window.ttq`) en cada landing. Mapeo de eventos entre plataformas:
//   ViewContent      -> ViewContent
//   InitiateCheckout -> InitiateCheckout (+ AddToCart en TikTok — ver abajo)
//   Lead (checkout completado, pago sin confirmar) -> PlaceAnOrder
// El Purchase real de ambas plataformas NO sale de acá — sale server-side
// cuando la venta se confirma en Sheets (ver meta-capi.js; TikTok pendiente
// de credenciales, ver decisions/log.md).
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      identify: (params: Record<string, string>) => void;
    };
  }
}

interface EventoContenido {
  content_name: string;
  content_category?: string;
  value: number;
  currency?: string;
}

// TikTok pide content_id dentro de "contents". No manejamos SKUs en el
// catálogo web (Meta tampoco los usa), así que se deriva un slug estable
// del nombre — sirve para agrupar/optimizar aunque no matchee un catálogo.
function slugContentId(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ttqContents({ content_name, value, currency = "USD" }: EventoContenido) {
  return {
    contents: [
      {
        content_id: slugContentId(content_name),
        content_type: "product",
        content_name,
      },
    ],
    value,
    currency,
  };
}

export function trackViewContent(params: EventoContenido) {
  const { content_name, content_category, value, currency = "USD" } = params;
  window.fbq?.("track", "ViewContent", { content_name, content_category, value, currency });
  window.ttq?.track("ViewContent", ttqContents(params));
}

export function trackInitiateCheckout(params: EventoContenido) {
  const { content_name, content_category, value, currency = "USD" } = params;
  window.fbq?.("track", "InitiateCheckout", { content_name, content_category, value, currency });
  // El sitio no tiene un paso de "carrito" separado — "Comprar" ES el único
  // momento de intención antes del checkout. TikTok marca como evento crítico
  // faltante no ver AddToCart en el embudo, así que se manda acá mismo, en el
  // mismo click. Meta no lo pide — no se agrega ahí para no inventar un evento
  // que no mide nada nuevo en esa plataforma.
  window.ttq?.track("AddToCart", ttqContents(params));
  window.ttq?.track("InitiateCheckout", ttqContents(params));
}

export function trackPlaceAnOrder(params: EventoContenido) {
  const { content_name, value, currency = "USD" } = params;
  window.fbq?.("track", "Lead", { value, currency, content_name, content_type: "product" });
  window.ttq?.track("PlaceAnOrder", ttqContents(params));
}

async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Mismo formato que tiktok-capi.js del lado servidor: 593 + número sin el 0 inicial.
function telefonoE164(tel: string): string {
  let s = tel.replace(/\D/g, "");
  if (s.startsWith("593")) s = s.slice(3);
  if (s.startsWith("0")) s = s.slice(1);
  return "593" + s;
}

// TikTok pide el hash calculado en el navegador (nunca mandar el dato crudo).
// Llamar ANTES de trackPlaceAnOrder para que el evento salga ya identificado
// — mejora la tasa de coincidencia (email/teléfono) que usa TikTok para
// optimizar. No hay ID propio de cliente en este sitio, así que no se manda
// external_id.
export async function identifyTikTok(params: { email?: string; telefono?: string }) {
  if (!window.ttq) return;
  const data: Record<string, string> = {};
  if (params.email) data.email = await sha256Hex(params.email.trim().toLowerCase());
  if (params.telefono) data.phone_number = await sha256Hex(telefonoE164(params.telefono));
  if (Object.keys(data).length) window.ttq.identify(data);
}
