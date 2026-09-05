// Helpers de presentación. Corren en el cliente: nada de secretos acá.

import type { Fase, MetodoPago, Momento, Tienda } from './tipos';

export const usd = (n: number) => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);

/**
 * El color sale de la FASE, no del literal del estado. Así "GUIA_GENERADA" de
 * dropshipping y "ENVIADO" de ShotyGames se ven igual — que es lo que son.
 */
export const ESTILO_FASE: Record<Fase, { texto: string; fondo: string; punto: string }> = {
  preparando: {
    texto: 'text-[var(--color-texto-suave)]',
    fondo: 'bg-[var(--color-superficie-alta)]',
    punto: 'bg-[var(--color-texto-suave)]',
  },
  'por-despachar': {
    texto: 'text-[var(--color-azul)]',
    fondo: 'bg-[var(--color-azul-tenue)]',
    punto: 'bg-[var(--color-azul)]',
  },
  'en-camino': {
    texto: 'text-[var(--color-verde)]',
    fondo: 'bg-[var(--color-verde-tenue)]',
    punto: 'bg-[var(--color-verde)]',
  },
  novedad: {
    texto: 'text-[var(--color-ambar)]',
    fondo: 'bg-[var(--color-ambar-tenue)]',
    punto: 'bg-[var(--color-ambar)]',
  },
  devuelto: {
    texto: 'text-[var(--color-rojo)]',
    fondo: 'bg-[var(--color-rojo-tenue)]',
    punto: 'bg-[var(--color-rojo)]',
  },
  cerrado: {
    texto: 'text-[var(--color-texto-tenue)]',
    fondo: 'bg-[var(--color-superficie-alta)]',
    punto: 'bg-[var(--color-texto-tenue)]',
  },
};

/**
 * Verde = la plata ya entró. Ámbar = falta cobrar una parte. Azul = hay que
 * cobrarlo todo al entregar, que es donde está el riesgo real.
 */
export const ESTILO_PAGO: Record<MetodoPago, string> = {
  anticipado: 'bg-[var(--color-verde-tenue)] text-[var(--color-verde)]',
  mixto: 'bg-[var(--color-ambar-tenue)] text-[var(--color-ambar)]',
  contraentrega: 'bg-[var(--color-azul-tenue)] text-[var(--color-azul)]',
};

/**
 * Color del momento del paquete.
 *
 * Verde = va bien · ámbar = necesita algo · rojo = se está perdiendo ·
 * gris = todavía no pasó nada digno de mirar.
 */
export const ESTILO_MOMENTO: Record<Momento, { texto: string; fondo: string; punto: string }> = {
  entregado: {
    texto: 'text-[var(--color-verde)]',
    fondo: 'bg-[var(--color-verde-tenue)]',
    punto: 'bg-[var(--color-verde)]',
  },
  'en-reparto': {
    texto: 'text-[var(--color-verde)]',
    fondo: 'bg-[var(--color-verde-tenue)]',
    punto: 'bg-[var(--color-verde)]',
  },
  'en-ciudad': {
    texto: 'text-[var(--color-azul)]',
    fondo: 'bg-[var(--color-azul-tenue)]',
    punto: 'bg-[var(--color-azul)]',
  },
  'en-transito': {
    texto: 'text-[var(--color-texto-suave)]',
    fondo: 'bg-[var(--color-superficie-alta)]',
    punto: 'bg-[var(--color-texto-suave)]',
  },
  'hacia-agencia': {
    texto: 'text-[var(--color-azul)]',
    fondo: 'bg-[var(--color-azul-tenue)]',
    punto: 'bg-[var(--color-azul)]',
  },
  'en-agencia': {
    texto: 'text-[var(--color-ambar)]',
    fondo: 'bg-[var(--color-ambar-tenue)]',
    punto: 'bg-[var(--color-ambar)]',
  },
  'en-gestion': {
    texto: 'text-[var(--color-ambar)]',
    fondo: 'bg-[var(--color-ambar-tenue)]',
    punto: 'bg-[var(--color-ambar)]',
  },
  novedad: {
    texto: 'text-[var(--color-ambar)]',
    fondo: 'bg-[var(--color-ambar-tenue)]',
    punto: 'bg-[var(--color-ambar)]',
  },
  'en-devolucion': {
    texto: 'text-[var(--color-rojo)]',
    fondo: 'bg-[var(--color-rojo-tenue)]',
    punto: 'bg-[var(--color-rojo)]',
  },
  'sin-datos': {
    texto: 'text-[var(--color-texto-tenue)]',
    fondo: 'bg-[var(--color-superficie-alta)]',
    punto: 'bg-[var(--color-texto-tenue)]',
  },
};

export const TIENDAS_UI: Record<Tienda, { nombre: string; color: string }> = {
  truquito: { nombre: 'Truquito', color: 'text-[var(--color-azul)]' },
  avanora: { nombre: 'Avanora', color: 'text-[var(--color-verde)]' },
  shotygames: { nombre: 'ShotyGames', color: 'text-[#c98bf0]' },
};

export const tiendaUI = (t: string) =>
  TIENDAS_UI[t as Tienda] ?? { nombre: t || '—', color: 'text-[var(--color-texto-suave)]' };

/**
 * Sitio de rastreo de cada transportadora. Solo Servientrega acepta la guía
 * como parámetro (confirmado); Laar y Gintracom obligan a escribirla a mano en
 * su buscador, así que va el link general en vez de inventar un parámetro que
 * podría no existir. Mismo criterio que `notificar-guia.js` en KEPLER.
 *
 * DOMICILIO y COOPERATIVA no tienen rastreo: no son transportadoras.
 */
export function linkRastreo(transportadora: string | null, guia: string | null): string | null {
  const t = String(transportadora ?? '').toUpperCase();
  if (t.includes('SERVIENTREGA')) {
    return guia ? `https://www.servientrega.com.ec/Tracking/Index/?guia=${guia}` : null;
  }
  if (t.includes('LAAR')) return 'https://fenixoper.laarcourier.com/Tracking/GuiaCompleta.aspx';
  if (t.includes('GINTRACOM')) return 'https://ec.gintracom.site/tracking';
  return null;
}

/** 0991234567 → 593991234567. Mismo criterio que `pedidos.js` al crear la orden. */
export function telefonoWA(telefono: string): string {
  const n = String(telefono ?? '').replace(/\D/g, '');
  if (/^593\d{9}$/.test(n)) return n;
  if (/^9\d{8}$/.test(n)) return '593' + n;
  if (/^0\d{9}$/.test(n)) return '593' + n.slice(1);
  return n;
}

const primerNombre = (n: string) => {
  const p = String(n ?? '').trim().split(/\s+/)[0] ?? '';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
};

/**
 * Deep link de WhatsApp con el mensaje ya escrito. Abre el chat; NO manda nada
 * solo — a quién se le escribe y cuándo lo decide Fabián, no la app.
 *
 * ⚠️ Sin emoji. Los que están fuera del BMP (👋🛒📍🤝🙏) llegan como "�" en
 * `wa.me` en varios teléfonos — confirmado con captura real el 2026-08-26.
 */
export function linkWhatsApp(p: {
  nombre: string;
  telefono: string;
  transportadora: string | null;
  guia: string | null;
  aCobrar: number;
  novedad: string | null;
}): string {
  const rastreo = linkRastreo(p.transportadora, p.guia);
  const partes = [
    `Hola ${primerNombre(p.nombre)}, te escribo por tu pedido.`,
    p.novedad
      ? `La transportadora reporta: ${p.novedad.toLowerCase()}. Quiero coordinar contigo la entrega.`
      : `Tu paquete ya va en camino con ${p.transportadora ?? 'la transportadora'}.`,
    p.guia ? `Guia: ${p.guia}` : '',
    rastreo ? `Rastreo: ${rastreo}` : '',
    p.aCobrar > 0 ? `Valor a pagar al recibir: ${usd(p.aCobrar)}` : '',
  ].filter(Boolean);

  return `https://wa.me/${telefonoWA(p.telefono)}?text=${encodeURIComponent(partes.join('\n'))}`;
}

/**
 * Icono del movimiento según lo que dice el nombre. Es reconocimiento por texto
 * libre de la transportadora, así que hay un caso por defecto y no se asume que
 * la lista esté completa.
 */
export function iconoMovimiento(nombre: string): string {
  const n = nombre.toUpperCase();
  if (/ENTREGAD/.test(n)) return '✓';
  if (/NOVEDAD|DEVOL|RECHAZ/.test(n)) return '!';
  if (/REPARTO|DISTRIBUCI/.test(n)) return '→';
  if (/RUTA|TRANSITO|TRÁNSITO/.test(n)) return '·';
  if (/BODEGA|AGENCIA|RECOLEC|INGRESAND/.test(n)) return '▣';
  if (/GENERAD/.test(n)) return '＋';
  return '·';
}
