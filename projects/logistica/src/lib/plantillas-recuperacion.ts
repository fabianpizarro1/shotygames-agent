// ============================================================
// PLANTILLAS DE WHATSAPP PARA RECUPERAR PEDIDOS WEB
//
// Aparte de `plantillas.ts` a propósito: ese archivo le habla a alguien que ya
// compró y tiene un paquete viajando. Acá el cliente **no compró** y puede que
// no recuerde ni haber dejado el pedido, así que hay dos diferencias de fondo:
//
//  1. **Se presenta la tienda.** En logística no se hace (Fabián lo sacó: el
//     cliente ya sabe quién le escribe). Acá es el primer contacto después del
//     checkout y sin el nombre el mensaje parece una estafa.
//  2. **Se repite lo que pidió.** Nombre del producto, total y ciudad. Es lo
//     que hace que se acuerde en la primera línea en vez de preguntar "¿quién
//     es?".
//
// Salen por `wa.me` con el mismo `linkWhatsApp` de `plantillas.ts`, así que los
// emoji se filtran solos y nada se manda sin que Fabián apriete enviar.
// ============================================================

import { sinEmoji } from './plantillas';
import { ANTICIPO_ENVIO, type Candidato } from './recuperacion-tipos';

export interface PlantillaRecuperacion {
  id: string;
  etiqueta: string;
  desc: string;
  texto: (c: Candidato) => string;
}

const MARCA = 'ShotyGames';

const saludo = (c: Candidato) => {
  const n = (c.nombre || '').trim().split(/\s+/)[0] ?? '';
  const bonito = n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : '';
  return bonito ? `¡Hola ${bonito}! ` : '¡Hola! ';
};

const usd = (n: number) => '$' + (Number(n) || 0).toFixed(2);

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
 * Cómo se le nombra el problema, según cuántas devoluciones tiene de verdad.
 *
 * ⚠️ Esto **no** puede ser un texto fijo. Desde que la tasa se ajusta por
 * evidencia (ver `tasaAjustada` en `recuperacion-tipos.ts`), al balde de riesgo
 * entra gente con UNA sola devolución — y decirle "tienes varios pedidos
 * anteriores que volvieron" a quien pidió una vez es mentirle en la cara, con
 * el agravante de que él sabe que es mentira y ahí se termina la conversación.
 */
function motivoDevoluciones(c: Candidato): string {
  const d = c.dropi?.devueltos ?? 0;
  if (d === 0) {
    // Fabián puede elegir esta plantilla a mano en cualquier pedido, y en uno
    // sin devoluciones el motivo no existe: se le pide el anticipo por la zona,
    // sin inventarle un historial que no tiene.
    return 'la entrega contra reembolso en tu zona nos está fallando seguido';
  }
  if (d === 1) return 'un pedido anterior tuyo no se llegó a entregar y se devolvió';
  return 'tu número tiene varios pedidos anteriores que volvieron sin poder entregarse';
}

export const PLANTILLAS_RECUPERACION: PlantillaRecuperacion[] = [
  {
    id: 'confirmar',
    etiqueta: 'Pedir confirmación',
    desc: 'Dejó el pedido y nunca confirmó',
    texto: (c) =>
      saludo(c) +
      `Te escribimos de *${MARCA}*.\n\n` +
      `Vimos que dejaste este pedido en nuestra página:\n\n` +
      bloquePedido(c) +
      `Pero no llegamos a confirmarlo contigo. ¿Todavía lo quieres?\n\n` +
      `Si me confirmas, lo despachamos y lo pagas cuando lo recibas. 📦`,
  },
  {
    id: 'anticipo',
    etiqueta: 'Ofrecer anticipo de envío',
    desc: 'Frenado por devoluciones — explicar y ofrecer los $5',
    // El motivo va SIN cifras. Decirle "tienes 11 de 11 devueltos" es exacto
    // pero suena a que lo estuvimos investigando y la conversación se muere
    // ahí. Lo que importa es que entienda por qué y que hay salida.
    texto: (c) =>
      saludo(c) +
      `Te escribimos de *${MARCA}* por el pedido que dejaste en nuestra página:\n\n` +
      bloquePedido(c) +
      `Te cuento con sinceridad por qué todavía no salió: al revisar el sistema ` +
      `de la transportadora, ${motivoDevoluciones(c)}. Cuando eso pasa el envío ` +
      `nos lo cobran igual, así que no podemos mandarlo todo contra entrega.\n\n` +
      `Pero no queremos dejarte sin tu pedido, así que te propongo algo:\n\n` +
      `• Adelantas solo *${usd(ANTICIPO_ENVIO)}* del envío\n` +
      `• El resto, *${usd(c.saldoConAnticipo)}*, lo pagas al recibirlo\n\n` +
      `Con eso lo despachamos de una. ¿Te parece? 🤝`,
  },
  {
    id: 'libre',
    etiqueta: 'Sin mensaje',
    desc: 'Abrir el chat en blanco',
    texto: () => '',
  },
];

/**
 * Cuál plantilla le corresponde. Sale del BALDE, o sea de la reputación real en
 * DROPI — no del estado de la hoja, que no distingue "no contestó" de "lo
 * frené" (ver el encabezado de `recuperacion.ts`).
 */
export function plantillaSugerida(c: Candidato): string {
  return c.balde === 'riesgo' ? 'anticipo' : 'confirmar';
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
