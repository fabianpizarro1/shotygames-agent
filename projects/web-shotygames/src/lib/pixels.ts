// Dispara el mismo evento en Meta Pixel y TikTok Pixel a la vez — un solo
// punto de entrada para no repetir el chequeo `typeof window.fbq` (y ahora
// `window.ttq`) en cada landing. Mapeo de eventos entre plataformas:
//   ViewContent      -> ViewContent
//   InitiateCheckout -> InitiateCheckout
//   Lead (checkout completado, pago sin confirmar) -> PlaceAnOrder
// El Purchase real de ambas plataformas NO sale de acá — sale server-side
// cuando la venta se confirma en Sheets (ver meta-capi.js; TikTok pendiente
// de credenciales, ver decisions/log.md).
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
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
  window.ttq?.track("InitiateCheckout", ttqContents(params));
}

export function trackPlaceAnOrder(params: EventoContenido) {
  const { content_name, value, currency = "USD" } = params;
  window.fbq?.("track", "Lead", { value, currency, content_name, content_type: "product" });
  window.ttq?.track("PlaceAnOrder", ttqContents(params));
}
