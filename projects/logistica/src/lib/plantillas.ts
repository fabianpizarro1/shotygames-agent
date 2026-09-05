// ============================================================
// PLANTILLAS DE WHATSAPP
//
// Portadas de la sección /logistica de `finanzas-app`, que es la que Fabián
// venía usando. Son situaciones distintas y cada una le pide al cliente una
// cosa distinta — mandarle el mismo texto a todos es como no escribirle.
//
// La app SUGIERE la que encaja con el tracking real, pero la decisión final es
// de quien escribe: abre WhatsApp con el texto puesto y nada se manda solo.
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
  return bonito ? `Hola ${bonito}! ` : 'Hola! ';
};

const usd = (n: number) => '$' + (Number(n) || 0).toFixed(2);

const transportadora = (p: Pedido) => p.transportadora ?? 'la transportadora';

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
 * El bloque con la agencia: nombre, dirección exacta, teléfono y horario.
 *
 * La dirección sale del directorio oficial de Servientrega (844 agencias). Si
 * no se puede emparejar con seguridad se manda solo el nombre — una dirección
 * equivocada hace que el cliente viaje al otro lado de la ciudad.
 */
function bloqueAgencia(p: Pedido): string {
  const nombre = nombreAgencia(p);
  // El destino que declara Servientrega manda sobre el del Sheet: la hoja
  // escribe las ciudades a mano y no siempre igual que el directorio.
  const ag = buscarAgencia(p.tracking?.destino || p.ciudad, nombre);

  if (ag) {
    return (
      `Agencia: *${ag.sucursal.replace(/_/g, ' - ')}*\n` +
      `Direccion: ${ag.direccion}\n` +
      (ag.horario ? `Horario: ${ag.horario}\n` : '') +
      (ag.telefono ? `Telefono de la agencia: ${ag.telefono}\n` : '')
    );
  }
  if (nombre) return `Agencia: *${nombre}*\n`;
  return `Esta en una agencia de ${transportadora(p)} en ${p.ciudad || 'tu ciudad'}. Escribenos y te confirmamos cual.\n`;
}

/** La guía y el PDF, que es lo que el cliente necesita para retirar. */
function bloqueGuia(p: Pedido): string {
  const pdf = p.tracking?.pdf;
  return (
    `Numero de guia: *${p.guia || '—'}*\n` +
    (pdf ? `Guia en PDF: ${pdf}\n` : '')
  );
}

/**
 * ¿El cliente pidió él mismo retirar en agencia?
 *
 * Servientrega lo deja explícito en el tracking. Es la diferencia entre "tal
 * como pediste, está en la agencia" y "no se pudo entregar y quedó ahí".
 */
function pidioRetiro(p: Pedido): boolean {
  return (p.tracking?.movimientos ?? []).some((m) => /SOLICITA\s+RETIRAR/i.test(m.movimiento));
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
      // Tres situaciones distintas y el cliente merece que no las mezclemos:
      //  · nació para retiro en oficina → nunca hubo intento de entrega;
      //  · el cliente pidió retirarlo → hubo intento y él lo redirigió;
      //  · no se pudo entregar → quedó en agencia sin que lo pidiera.
      // ⚠️ Solo se afirma que YA llegó cuando el tracking lo confirma. Para
      // cualquier otro momento se usa el texto de "va en camino": si Fabián
      // elige esta plantilla a mano en un pedido que todavía viaja, el mensaje
      // no puede mandarlo a una agencia donde el paquete no está.
      const enCamino = p.momento !== 'en-agencia';

      // "Intentaron entregarte" solo se dice si DE VERDAD lo intentaron. Lo
      // decide el tracking; la dirección es apenas un respaldo.
      const intentaron = huboIntentoDeEntrega(p);

      const apertura = enCamino
        ? `Te contamos que tu pedido va en camino a una agencia de ${transportadora(p)} para que lo retires.`
        : !intentaron || pidioRetiroEnAgencia(p.direccion)
          ? `Tu pedido ya llego a la agencia y esta listo para que lo retires.`
          : pidioRetiro(p)
            ? `Nos indican de ${transportadora(p)} que intentaron entregarte el pedido y no fue posible. Tal como solicitaste, quedo en la agencia para que lo retires.`
            : `Nos indican de ${transportadora(p)} que intentaron entregarte el pedido y no fue posible, asi que lo dejaron en agencia para que lo retires.`;

      const cierre = enCamino
        ? `\nApenas llegue te avisamos para que pases a retirarlo. Lleva tu cedula.` +
          (p.aCobrar > 0 ? ` El valor a pagar es de *${usd(p.aCobrar)}* en efectivo.` : '')
        : `\nRetiralo presentando tu cedula.` +
          (p.aCobrar > 0 ? ` El valor a pagar es de *${usd(p.aCobrar)}* en efectivo.` : '') +
          `\n\nImportante: una vez que el paquete esta en agencia ya no vuelve a salir a domicilio, y si no lo retiras en los proximos dias se devuelve.`;

      return saludo(p) + apertura + `\n\n` + bloqueAgencia(p) + `\n` + bloqueGuia(p) + cierre;
    },
  },
  {
    id: 'ciudad',
    etiqueta: 'Llegó a tu ciudad',
    desc: 'Ya está en destino, falta el reparto',
    texto: (p) =>
      saludo(p) +
      `Te contamos que tu pedido ya llego a ${p.ciudad || 'tu ciudad'}.\n\n` +
      `Los repartidores se van a comunicar contigo cuando salga a entrega, asi que mantente atento al celular.\n\n` +
      (p.aCobrar > 0 ? `Ten listo el valor del pago en efectivo: *${usd(p.aCobrar)}*\n` : '') +
      bloqueGuia(p),
  },
  {
    id: 'distribucion',
    etiqueta: 'Salió a entrega',
    desc: 'Que esté atento y con el efectivo',
    texto: (p) =>
      saludo(p) +
      `Buenas noticias, ${transportadora(p)} nos indico que tu pedido *ya salio a despacho el dia de hoy*.\n\n` +
      `Los repartidores se van a comunicar contigo para coordinar la entrega, asi que por favor:\n\n` +
      `- Mantente atento al celular, te van a llamar o escribir\n` +
      `- Ten listo el valor del pago en efectivo: *${usd(p.aCobrar)}*\n` +
      (p.direccion ? `- Entrega en: ${p.direccion}\n` : '') +
      `\nQue lo disfrutes!`,
  },
  {
    id: 'contacto',
    etiqueta: '¿Te contactaron?',
    desc: 'Preguntar si el repartidor llamó',
    texto: (p) =>
      saludo(p) +
      `Tu pedido esta en camino con ${transportadora(p)} (guia *${p.guia || '—'}*).\n\n` +
      `Los repartidores se han comunicado contigo para coordinar la entrega?\n\n` +
      `Queremos asegurarnos de que te llegue sin problema.`,
  },
  {
    id: 'intentos',
    etiqueta: 'Intentaron entregar',
    desc: 'No hubo quien reciba',
    texto: (p) =>
      saludo(p) +
      `Nos indican de ${transportadora(p)} que los repartidores han estado intentando entregarte tu pedido, pero no encontraron quien lo reciba y no obtuvieron respuesta.`,
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

export function linkWhatsApp(p: Pedido, texto: string): string {
  const base = `https://wa.me/${telefonoWA(p.telefono)}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
