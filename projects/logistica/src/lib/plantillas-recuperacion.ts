// ============================================================
// PLANTILLAS DE WHATSAPP PARA RECUPERAR PEDIDOS WEB
//
// Aparte de `plantillas.ts` a propósito: ese archivo le habla a alguien que ya
// compró y tiene un paquete viajando. Acá el cliente **no compró**.
//
// ⚠️ **Estos NUNCA son el primer mensaje.** Al hacer el pedido en la web el
// cliente ya recibió el resumen para confirmar (Fabián, 2026-09-14). Así que no
// se le "descubre" el pedido — se retoma una conversación que ya empezó. La
// primera versión decía "vimos que dejaste este pedido en nuestra página", que
// sonaba a contacto en frío y borraba el mensaje que él ya había recibido.
//
// Cuál va se decide por la ACCIÓN, no por el balde — ver `accionDe` en
// `recuperacion-tipos.ts`. Y al que devuelve seguido y encima no confirmó **no
// se le escribe nada**: no hay plantilla para eso a propósito.
//
// Dos cosas se mantienen de la versión anterior:
//  · **NO se presenta la tienda.** Se había puesto un "te escribimos de
//    ShotyGames" y Fabián lo sacó: el cliente ya recibió el resumen del pedido
//    por este mismo chat, así que presentarse es tratarlo como desconocido.
//  · **Se repite lo que pidió** — producto, total y ciudad, para que se ubique
//    en la primera línea en vez de preguntar "¿de qué pedido me hablas?".
//
// Salen por `wa.me` con el mismo filtro de emoji de `plantillas.ts`, y nada se
// manda sin que Fabián apriete enviar.
// ============================================================

import { sinEmoji } from './plantillas';
import { ANTICIPO_ENVIO, type Candidato } from './recuperacion-tipos';

export interface PlantillaRecuperacion {
  id: string;
  etiqueta: string;
  desc: string;
  texto: (c: Candidato) => string;
}

const saludo = (c: Candidato) => {
  const n = (c.nombre || '').trim().split(/\s+/)[0] ?? '';
  const bonito = n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : '';
  return bonito ? `¡Hola ${bonito}! ` : '¡Hola! ';
};

const usd = (n: number) => '$' + (Number(n) || 0).toFixed(2);

/**
 * "$5" y no "$5.00". El abono es una cifra redonda y así la escribe Fabián a
 * mano; los centavos en un número exacto lo hacen ver más grande de lo que es.
 * El saldo sí lleva decimales: ahí el centavo es real.
 */
const usdCorto = (n: number) =>
  Number.isInteger(n) ? '$' + n : usd(n);

/**
 * "SANTO DOMINGO DE LOS COLORADOS" → "Santo Domingo de los Colorados".
 *
 * Las preposiciones y artículos quedan en minúscula: capitalizar todas las
 * palabras daba "Santo Domingo De Los Colorados", que se lee a plantilla
 * automática. La primera palabra siempre va en mayúscula, aunque sea una de
 * esas ("La Libertad", "El Guabo").
 */
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en']);

const ciudadBonita = (c: Candidato) =>
  c.ciudad
    ? c.ciudad
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((w, i) =>
          i > 0 && MINUSCULAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(' ')
    : '';

/**
 * El bloque que le recuerda qué pedido es. Cada línea solo sale si hay dato:
 * un "Total: $0.00" o una ciudad vacía delatan que el mensaje es automático.
 */
function bloquePedido(c: Candidato): string {
  const lineas = [
    c.descripcion ? `• ${c.descripcion}` : '',
    c.monto > 0 ? `• Total: *${usd(c.monto)}*` : '',
    ciudadBonita(c) ? `• Envío a: ${ciudadBonita(c)}` : '',
  ].filter(Boolean);
  return lineas.length ? lineas.join('\n') + '\n\n' : '';
}

/**
 * Cómo se le nombra el problema: **con el número concreto de devoluciones**.
 *
 * Así lo escribe Fabián a mano ("nos refleja que ya ha tenido 4 devoluciones")
 * y tiene razón contra mi primera versión, que lo dejaba en "varios pedidos
 * anteriores". El número es verificable y el cliente lo reconoce; el vago se
 * discute. Además al balde de riesgo entra gente con UNA sola devolución, y
 * decirle "varios" a quien tuvo una es mentirle sabiendo que él lo sabe.
 *
 * Con 0 devoluciones no se nombra ningún historial: Fabián puede elegir esta
 * plantilla a mano en cualquier pedido y no se le inventa un pasado.
 */
function motivoDevoluciones(c: Candidato): string {
  const d = c.dropi?.devueltos ?? 0;
  if (d === 0) {
    return 'la entrega contra entrega en tu zona nos viene fallando seguido';
  }
  // "que TIENES", no "que tu número tiene" (Fabián, 2026-09-14): hablarle del
  // número en tercera persona suena a expediente; hablarle a él, a una charla.
  const cuantas = d === 1 ? '*1 devolución*' : `*${d} devoluciones*`;
  return `en el sistema de la transportadora nos refleja que tienes ${cuantas}`;
}

export const PLANTILLAS_RECUPERACION: PlantillaRecuperacion[] = [
  {
    id: 'confirmar',
    etiqueta: 'Falta su confirmación',
    desc: 'Recibió el resumen y nunca contestó',
    // No le anuncia el pedido: le recuerda que YA le mandamos el resumen y que
    // falta su respuesta. Es lo que de verdad pasó, y es más difícil de ignorar
    // que un "vimos que dejaste este pedido".
    texto: (c) =>
      saludo(c) +
      `\n\nTe enviamos el resumen de tu pedido pero todavía no hemos recibido tu confirmación:\n\n` +
      bloquePedido(c) +
      `¿Me confirmas que podrás recibirlo para despacharlo?`,
  },
  {
    id: 'anticipo',
    etiqueta: 'Pedir abono de $5',
    desc: 'Confirmó, pero devuelve seguido',
    // Fusión de la plantilla que Fabián ya venía mandando a mano con el formato
    // de acá. De la suya se conserva lo que funcionaba: el número concreto de
    // devoluciones, el "nos cobran el envío en cuanto sale de la bodega" (que
    // es el porqué — sin eso, pedir un abono parece desconfianza), "abono" y
    // "en efectivo al momento de la entrega".
    //
    // Lo agregado: arranca agradeciendo la confirmación, porque este mensaje va
    // justo después de que el cliente confirmó; el pedido concreto; el saldo con
    // el número exacto en vez de "el valor restante"; y cierre con pregunta, que
    // es lo que Fabián eligió en la plantilla de agosto.
    //
    // Lo quitado: "como le comentamos", que daba por dicho algo que
    // probablemente no se dijo en ese hilo.
    texto: (c) =>
      saludo(c) +
      `Gracias por confirmar tu pedido.\n\n` +
      bloquePedido(c) +
      `Antes de despacharlo te cuento algo con sinceridad: ${motivoDevoluciones(c)}. ` +
      `En esos casos ya no podemos enviarlo todo contra entrega, porque a nosotros ` +
      `nos cobran el valor del envío en cuanto el paquete sale de la bodega, se ` +
      `entregue o no.\n\n` +
      // El cierre es textual de Fabián, pasado a tuteo. Mi versión lo abría en
      // dos viñetas y un "¿lo hacemos así?" y él lo bajó: en una sola frase la
      // oferta se lee como una salida, no como una negociación con condiciones.
      `Si deseas te lo podemos enviar, pero tendrías que hacer un abono de ` +
      `*${usdCorto(ANTICIPO_ENVIO)}* para asegurar el envío y el valor restante ` +
      `(*${usd(c.saldoConAnticipo)}*) lo podrías pagar en efectivo al momento de la entrega.`,
  },
  {
    id: 'comprobante',
    etiqueta: 'Falta su comprobante',
    desc: 'Pago anticipado (transferencia/tarjeta), nunca llegó el comprobante',
    // Mismo armado que "confirmar" (saludo, recordar el pedido, cerrar con
    // pregunta) pero la pregunta es otra: quien eligió transferencia o tarjeta
    // no tiene que "confirmar" que recibirá el pedido — ya pagó por adelantado,
    // lo que falta es el comprobante para poder procesarlo y despacharlo.
    // Pedirle que "confirme" a alguien que ya pagó no tiene sentido y suena a
    // que no le creemos que compró.
    texto: (c) =>
      saludo(c) +
      `\n\nTe enviamos el resumen de tu pedido pero todavía no hemos recibido el comprobante de tu pago:\n\n` +
      bloquePedido(c) +
      `Sin el comprobante no podemos procesar tu pedido para despacharlo. Si ya hiciste el pago, ¿me lo puedes enviar para avanzar con el envío?`,
  },
  {
    id: 'libre',
    etiqueta: 'Sin mensaje',
    desc: 'Abrir el chat en blanco',
    texto: () => '',
  },
];

/**
 * Cuál plantilla le corresponde. Sale de la ACCIÓN, que cruza la reputación en
 * DROPI con si el cliente confirmó — ver `accionDe` en `recuperacion-tipos.ts`.
 *
 * Devuelve `null` cuando no hay que escribirle: el que devuelve seguido y
 * encima no confirmó no recibe nada. No sugerir nada es la sugerencia.
 */
export function plantillaSugerida(c: Candidato): string | null {
  if (c.accion === 'no-escribir') return null;
  if (c.accion === 'ofrecer-anticipo') return 'anticipo';
  // pedir-confirmacion: cuál pregunta corresponde depende de qué eligió pagar.
  // Contraentrega necesita que confirme que va a recibirlo; transferencia y
  // tarjeta son pago anticipado — ahí lo que falta es el comprobante, no una
  // confirmación (Fabián, 2026-09-24).
  const metodo = (c.metodoPago || '').toLowerCase();
  if (metodo === 'transferencia' || metodo === 'tarjeta') return 'comprobante';
  return 'confirmar';
}

function telefonoWA(telefono: string): string {
  const n = String(telefono ?? '').replace(/\D/g, '');
  if (/^593\d{9}$/.test(n)) return n;
  if (/^9\d{8}$/.test(n)) return '593' + n;
  if (/^0\d{9}$/.test(n)) return '593' + n.slice(1);
  return n;
}

/** El link que abre WhatsApp con el texto puesto, sin emoji (ver `plantillas.ts`). */
export function linkRecuperacion(c: Candidato, texto: string): string {
  const base = `https://wa.me/${telefonoWA(c.telefono)}`;
  const limpio = sinEmoji(texto);
  return limpio ? `${base}?text=${encodeURIComponent(limpio)}` : base;
}
