// ============================================================
// PLANTILLAS DE WHATSAPP
//
// Portadas de la sección /logistica de `finanzas-app`, que es la que Fabián
// venía usando. Son situaciones distintas y cada una le pide al cliente una
// cosa distinta — mandarle el mismo texto a todos es como no escribirle.
//
// La app SUGIERE la que encaja con el tracking real, pero la decisión final es
// de quien escribe: abre WhatsApp con el texto puesto y nada se manda solo.
//
// UN SOLO TEXTO, DOS RENDERIZADOS. El texto se escribe CON emoji, y el canal
// decide si sobreviven:
//
//  · **`wa.me`** — el botón de la app, que es como Fabián manda a mano. Acá
//    `linkWhatsApp` les saca los emoji SOLO, porque dentro de un `wa.me` NINGUNO
//    sobrevive en su teléfono: ni los astrales (📦 📍) ni los del BMP (✅ ⚠ ☎).
//    Llegan como rombo. Probado con link real el 2026-09-10.
//  · **Evolution API** — hoy solo el cron de avisos (`/api/cron/avisos`, que manda
//    la plantilla "ciudad"). Ahí los emoji SÍ llegan, así que el texto los lleva.
//
// Fabián eligió el 2026-09-11 que tocar una plantilla abra WhatsApp directo, de
// un toque, en vez de pedir confirmación — sabiendo que por ese camino no hay
// emoji. Por eso el único mensaje de este archivo que hoy sale con emoji es el
// automático de "llegó a tu ciudad".
//
// El filtro vive DENTRO de `linkWhatsApp` y no en quien la llama: así no existe
// forma de armar un `wa.me` con emoji por olvido. Las TILDES sí pasan por los dos
// canales, así que el texto va acentuado siempre.
// ============================================================

import type { Pedido } from './tipos';
import { buscarAgencia, pidioRetiroEnAgencia } from './agencias';

export interface Plantilla {
  id: string;
  etiqueta: string;
  desc: string;
  texto: (p: Pedido) => string;
}

const MARCA: Record<string, string> = {
  shotygames: 'ShotyGames',
  truquito: 'Truquito',
  avanora: 'Avanora Naturals',
};

const marca = (p: Pedido) => MARCA[p.tienda] ?? 'la tienda';

const saludo = (p: Pedido) => {
  const n = (p.nombre || '').trim().split(/\s+/)[0] ?? '';
  const bonito = n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : '';
  return bonito ? `¡Hola ${bonito}! ` : '¡Hola! ';
};

const usd = (n: number) => '$' + (Number(n) || 0).toFixed(2);

const transportadora = (p: Pedido) => p.transportadora ?? 'la transportadora';

/**
 * "SERVIENTREGA" → "Servientrega". El Sheet las guarda en mayúsculas, que está
 * bien cuando el nombre va suelto en su propia línea, pero grita cuando va en
 * medio de una frase ("los repartidores de SERVIENTREGA se han comunicado").
 */
const nombrePropio = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');

/**
 * De qué agencia se trata, según el tracking. `nom_conc` es campo libre y a
 * veces trae el MOTIVO en vez de la agencia ("NO ESTA", "NO CONTESTA"), así que
 * esos se descartan.
 */
function nombreAgencia(p: Pedido): string | null {
  const movs = p.tracking?.movimientos ?? [];
  for (const m of movs) {
    // Con la fuente de Servientrega esto viene limpio y en el MISMO formato que
    // el directorio: "Ingresando en Agencia GUAYAQUIL_CITY MALL". El guion bajo
    // NO se toca — es lo que separa la ciudad del nombre de la sucursal.
    const enNombre = m.movimiento.match(/agencia\s+(.{3,})$/i);
    if (enNombre) return enNombre[1].trim().toUpperCase();
  }
  const ES_MOTIVO = /^(no |sin |rechaz|ausente|cerrad|direccion|dirección|entregado|reportad)/i;
  for (const m of movs) {
    if (/agencia/i.test(m.movimiento) && m.motivo && !ES_MOTIVO.test(m.motivo)) {
      return m.motivo.trim().toUpperCase();
    }
  }
  return null;
}

/**
 * La agencia del pedido: la del directorio si se pudo emparejar, y el nombre
 * crudo del tracking. Con ninguna de las dos no sabemos cuál es, y el mensaje
 * no puede anunciarla.
 */
function agenciaDelPedido(p: Pedido) {
  const nombre = nombreAgencia(p);
  // El destino que declara Servientrega manda sobre el del Sheet: la hoja
  // escribe las ciudades a mano y no siempre igual que el directorio.
  return { ag: buscarAgencia(p.tracking?.destino || p.ciudad, nombre), nombre };
}

/**
 * El bloque con la agencia: nombre, dirección exacta, teléfono y horario.
 *
 * La dirección sale del directorio oficial de Servientrega (844 agencias). Si
 * no se puede emparejar con seguridad se manda solo el nombre — una dirección
 * equivocada hace que el cliente viaje al otro lado de la ciudad.
 */
function bloqueAgencia(p: Pedido): string {
  const { ag, nombre } = agenciaDelPedido(p);

  if (ag) {
    return (
      `📍 *Agencia:* ${ag.sucursal.replace(/_/g, ' - ')}\n` +
      `🏠 *Dirección:* ${ag.direccion}\n` +
      (ag.horario ? `🕒 *Horario:* ${ag.horario}\n` : '') +
      (ag.telefono ? `☎️ *Teléfono de la agencia:* ${ag.telefono}\n` : '')
    );
  }
  if (nombre) return `📍 *Agencia:* ${nombre}\n`;
  return `📍 Está en una agencia de *${transportadora(p)}* en *${p.ciudad || 'tu ciudad'}*. Escríbenos y te confirmamos cuál.\n`;
}

/** La guía y el PDF, que es lo que el cliente necesita para retirar. */
function bloqueGuia(p: Pedido): string {
  const pdf = p.tracking?.pdf;
  return (
    `🚛 *Número de guía:* ${p.guia || '—'}\n` +
    (pdf ? `📄 *Guía en PDF:* ${pdf}\n` : '')
  );
}

/**
 * ¿Alguna vez salió el repartidor a entregarlo?
 *
 * Es LA pregunta para armar el mensaje de agencia, y se responde con el
 * tracking, no con la dirección. Caso real (LUIS, Playas): su historial va
 * derecho de recolección a "Ingresando en Agencia" — nunca hubo intento de
 * entrega, así que decirle "intentaron entregarte y no fue posible" es falso.
 * La dirección tampoco alcanzaba: decía "Servi entrega diagonal a TÍA", que no
 * matcheaba ningún patrón de retiro.
 */
function huboIntentoDeEntrega(p: Pedido): boolean {
  return (p.tracking?.movimientos ?? []).some((m) =>
    /^EN DISTRIBUCION A CLIENTE/i.test(m.movimiento)
  );
}

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'agencia',
    etiqueta: 'Está en agencia',
    desc: 'Dónde retirarlo, con dirección y guía',
    texto: (p) => {
      // Dos situaciones distintas y el cliente merece que no las mezclemos:
      //  · nació para retiro en oficina (o él lo pidió) → nunca hubo intento
      //    de entrega que contarle: el paquete ya lo está esperando;
      //  · no se pudo entregar → quedó en agencia sin que lo pidiera.
      // ⚠️ Solo se afirma que YA llegó cuando el tracking lo confirma. Para
      // cualquier otro momento se usa el texto de "va en camino": si Fabián
      // elige esta plantilla a mano en un pedido que todavía viaja, el mensaje
      // no puede mandarlo a una agencia donde el paquete no está.
      const enCamino = p.momento !== 'en-agencia';

      // "Intentaron entregarte" solo se dice si DE VERDAD lo intentaron. Lo
      // decide el tracking; la dirección es apenas un respaldo.
      const intentaron = huboIntentoDeEntrega(p);

      // Sin agencia identificada el bloque de abajo no la nombra, así que la
      // apertura tampoco puede presentarla con dos puntos.
      const { ag, nombre } = agenciaDelPedido(p);
      const sabemosCual = Boolean(ag || nombre);

      const apertura = enCamino
        ? `📦 Te contamos que tu pedido *va en camino* a una agencia de *${transportadora(p)}* para que lo retires.`
        : !intentaron || pidioRetiroEnAgencia(p.direccion)
          ? `📦 Tu pedido *ya llegó a la agencia* y está listo para que lo retires.`
          : sabemosCual
            ? `📦 Nos indican de *${transportadora(p)}* que intentaron entregarte el pedido y no fue posible, así que dejaron el paquete en la siguiente agencia para su retiro:`
            : `📦 Nos indican de *${transportadora(p)}* que intentaron entregarte el pedido y no fue posible, así que lo dejaron en una agencia para su retiro.`;

      const cierre = enCamino
        ? `\n🆔 Apenas llegue te avisamos para que pases a retirarlo. Lleva tu cédula.` +
          (p.aCobrar > 0 ? `\n💵 El valor a pagar es de *${usd(p.aCobrar)}* en efectivo.` : '')
        : (p.aCobrar > 0 ? `\n💵 El valor a pagar es de *${usd(p.aCobrar)}* en efectivo.` : '') +
          `\n☺️ Si puedes, nos avisas cuando lo retires. ¡Muchas gracias!`;

      return saludo(p) + apertura + `\n\n` + bloqueAgencia(p) + `\n` + bloqueGuia(p) + cierre;
    },
  },
  {
    id: 'ciudad',
    etiqueta: 'Llegó a tu ciudad',
    desc: 'Ya está en destino, falta el reparto',
    texto: (p) =>
      saludo(p) +
      `📦 Te contamos que tu pedido *ya llegó a ${p.ciudad || 'tu ciudad'}*.\n\n` +
      `📞 Los repartidores se van a comunicar contigo cuando salga a entrega, así que *mantente atento al celular*.\n\n` +
      (p.aCobrar > 0 ? `💵 Ten listo el valor del pago en efectivo: *${usd(p.aCobrar)}*\n` : '') +
      bloqueGuia(p),
  },
  {
    id: 'distribucion',
    etiqueta: 'Salió a entrega',
    desc: 'Que esté atento y con el efectivo',
    texto: (p) =>
      saludo(p) +
      `🚚 Buenas noticias: *${transportadora(p)}* nos indicó que tu pedido *ya salió a despacho el día de hoy*.\n\n` +
      `Los repartidores se van a comunicar contigo para coordinar la entrega, así que por favor:\n\n` +
      `• 📞 *Mantente atento al celular*, te van a llamar o escribir\n` +
      `• 💵 Ten listo el valor del pago en efectivo: *${usd(p.aCobrar)}*\n` +
      (p.direccion ? `• 🏠 Entrega en: *${p.direccion}*\n` : '') +
      `\n¡Que lo disfrutes! 🎉`,
  },
  {
    id: 'contacto',
    etiqueta: '¿Te contactaron?',
    desc: 'Preguntar si el repartidor llamó',
    // Una sola pregunta, sin guía ni cierre: acá no se le está informando nada,
    // se le está preguntando. Todo lo demás era relleno que tapaba la pregunta.
    // Texto dictado por Fabián (2026-09-11), incluida la grafía de la
    // transportadora en minúsculas, que es como se lee natural en la frase.
    texto: (p) =>
      saludo(p) +
      `Una consulta, los repartidores de ${nombrePropio(transportadora(p))} se han comunicado contigo para coordinar la entrega?`,
  },
  {
    id: 'intentos',
    etiqueta: 'Intentaron entregar',
    desc: 'No hubo quien reciba',
    texto: (p) =>
      saludo(p) +
      `⚠️ Nos indican de *${transportadora(p)}* que los repartidores han estado intentando entregarte tu pedido, pero *no encontraron quien lo reciba* y no obtuvieron respuesta.`,
  },
  {
    id: 'libre',
    etiqueta: 'Sin mensaje',
    desc: 'Abrir el chat en blanco',
    texto: () => '',
  },
];

/**
 * Cuál plantilla encaja. Sale del MOMENTO del paquete (ver `momento.ts`), no de
 * buscar palabras sueltas en el tracking: antes "AGENCIA" en cualquier parte
 * del historial sugería la de agencia aunque el paquete ya hubiera salido de
 * ahí hace tres días.
 *
 * Se sugiere; no se impone.
 */
export function plantillaSugerida(p: Pedido): string {
  switch (p.momento) {
    case 'en-agencia':
      return 'agencia';
    case 'hacia-agencia':
      // Todavía no llegó: no se le puede decir que pase a retirarlo.
      return 'contacto';
    case 'en-reparto':
      return 'distribucion';
    case 'en-ciudad':
      return 'ciudad';
    case 'novedad':
      return 'intentos';
    case 'en-gestion':
      // Hubo intentos, novedades o el cliente pidió retirar: acá no se puede
      // afirmar nada, hay que preguntarle qué quiere hacer.
      return 'contacto';
    default:
      return 'contacto';
  }
}

/**
 * Qué plantillas ya se le mandaron a este pedido.
 * La columna LOG WA guarda "id|fecha ; id|fecha".
 */
export function marcasEnviadas(logWa: string): Record<string, string> {
  const out: Record<string, string> = {};
  String(logWa || '')
    .split(';')
    .forEach((tramo) => {
      const [id, fecha] = tramo.split('|').map((x) => x.trim());
      if (id) out[id] = fecha || ''; // si se repite, queda la más reciente
    });
  return out;
}

export const serializarMarcas = (m: Record<string, string>) =>
  Object.entries(m)
    .map(([id, f]) => `${id}|${f}`)
    .join(' ; ');

/** 0991234567 → 593991234567 */
export function telefonoWA(telefono: string): string {
  const n = String(telefono ?? '').replace(/\D/g, '');
  if (/^593\d{9}$/.test(n)) return n;
  if (/^9\d{8}$/.test(n)) return '593' + n;
  if (/^0\d{9}$/.test(n)) return '593' + n.slice(1);
  return n;
}

/**
 * Saca los emoji de un texto, para los links `wa.me`.
 *
 * Dentro de un `wa.me?text=` ningún emoji sobrevive en el teléfono de Fabián
 * (probado 2026-09-10: ni 📦 ni ✅ ni ⚠; llegan como rombo). El texto llega con
 * las tildes intactas, así que solo hay que quitar los pictogramas.
 *
 * Después de quitarlos quedan espacios colgando al principio de línea y dobles
 * espacios en el medio: se limpian, o el mensaje se ve descuidado.
 */
export function sinEmoji(texto: string): string {
  return texto
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{20E3}\u{200D}]/gu, '')
    .split('\n')
    .map((linea) => linea.replace(/[ \t]{2,}/g, ' ').replace(/^[ \t]+/, '').trimEnd())
    .join('\n');
}

/**
 * El link que abre WhatsApp con el texto puesto.
 *
 * ⚠️ El filtro de emoji va ACÁ y no en quien la llama: mientras todo `wa.me` se
 * arme con esta función, es imposible mandar un emoji por este canal por olvido.
 */
export function linkWhatsApp(p: Pedido, texto: string): string {
  const base = `https://wa.me/${telefonoWA(p.telefono)}`;
  const limpio = sinEmoji(texto);
  return limpio ? `${base}?text=${encodeURIComponent(limpio)}` : base;
}
