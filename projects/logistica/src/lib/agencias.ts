// ============================================================
// DIRECTORIO DE AGENCIAS DE SERVIENTREGA
//
// 844 agencias en 242 ciudades, bajadas del "Centro de Soluciones" del sitio
// oficial (`scripts/bajar-agencias.js`) y guardadas en `agencias.json`. Se
// commitean a propósito: cambian pocas veces al año y así la app no depende en
// cada carga de que el sitio de Servientrega esté arriba.
//
// El nombre que da DROPI viene sucio y con errores de tipeo del repartidor
// ("cs condando" por CONDADO), así que el emparejado tolera diferencias — pero
// **solo devuelve algo si está seguro**: mandarle a un cliente la dirección de
// otra agencia es peor que no mandarle ninguna.
// ============================================================

import datos from './agencias.json';

export interface Agencia {
  sucursal: string;
  direccion: string;
  telefono: string;
  horario: string;
}

const DIRECTORIO = datos as Record<string, Agencia[]>;

const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    // "CS" (Centro de Soluciones) y "SERVIENTREGA" aparecen o no según quién
    // escriba; sacarlos hace comparables los dos lados.
    .replace(/\bCS\b|\bSERVIENTREGA\b|\bAGENCIA\b/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

/** Distancia de edición. Sirve para aguantar un typo, no para adivinar. */
function distancia(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return Math.max(m, n);

  let previa = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const actual = [i];
    for (let j = 1; j <= n; j++) {
      actual[j] = Math.min(
        previa[j] + 1,
        actual[j - 1] + 1,
        previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previa = actual;
  }
  return previa[n];
}

/** "QUITO_CONDADO" → "CONDADO" */
const soloNombre = (sucursal: string) => norm(sucursal.split('_').slice(1).join(' ') || sucursal);

function agenciasDe(ciudad: string): Agencia[] {
  const c = norm(ciudad);
  if (!c) return [];
  if (DIRECTORIO[c]) return DIRECTORIO[c];
  // El Sheet escribe la ciudad a mano; puede traer la provincia pegada o algún
  // acento de más. Se busca la clave que coincida ya normalizada.
  const clave = Object.keys(DIRECTORIO).find((k) => norm(k) === c);
  return clave ? DIRECTORIO[clave] : [];
}

/**
 * La agencia donde quedó el paquete.
 *
 * `ciudad` acota la búsqueda — sin eso, "CENTRO" o "NORTE" matchearían en
 * veinte ciudades distintas. Si la ciudad no está en el directorio o el nombre
 * no se parece lo suficiente a ninguna, devuelve null y el mensaje sale sin
 * dirección en vez de con una inventada.
 */
export function buscarAgencia(ciudad: string, nombre: string | null): Agencia | null {
  const buscado = soloNombre(nombre ?? '');
  if (!buscado || buscado.length < 3) return null;

  // El propio nombre trae la ciudad adelante ("PLAYAS_AV. 15 DE AGOSTO"), y es
  // más confiable que la del Sheet: PLAYAS no resolvía porque la hoja la
  // escribe distinto. Se prueba primero esa, después la que nos pasaron.
  const ciudadDelNombre = String(nombre ?? '').includes('_')
    ? String(nombre).split('_')[0]
    : '';
  const candidatas = [...agenciasDe(ciudadDelNombre), ...agenciasDe(ciudad)];
  if (!candidatas.length) return null;

  // 1. Coincidencia exacta del nombre de la sucursal.
  const exacta = candidatas.find((a) => soloNombre(a.sucursal) === buscado);
  if (exacta) return exacta;

  // 2. Una contiene a la otra ("CONDADO" ↔ "CONDADO NORTE").
  const contiene = candidatas.filter((a) => {
    const n = soloNombre(a.sucursal);
    return n.includes(buscado) || buscado.includes(n);
  });
  if (contiene.length === 1) return contiene[0];

  // 3. Un typo de distancia: "CONDANDO" → "CONDADO". Se exige que la mejor
  //    candidata sea ÚNICA y esté claramente más cerca que la segunda; si hay
  //    empate, es que no se sabe, y no se adivina.
  const conDistancia = candidatas
    .map((a) => ({ a, d: distancia(soloNombre(a.sucursal), buscado) }))
    .sort((x, y) => x.d - y.d);

  const mejor = conDistancia[0];
  const segunda = conDistancia[1];
  const tope = Math.max(1, Math.floor(buscado.length * 0.25));

  if (mejor && mejor.d <= tope && (!segunda || segunda.d > mejor.d)) return mejor.a;

  return null;
}

/**
 * ¿La dirección del pedido dice que el cliente retira en agencia?
 *
 * Cuando el pedido nació para retiro en oficina, el mensaje NO debe decir que
 * hubo un intento de entrega fallido — nunca se intentó entregar a domicilio.
 */
export function pidioRetiroEnAgencia(direccion: string): boolean {
  const d = norm(direccion);
  return /\bRETIR[AO]\b|\bRETIRAR\b|\bOFICINA\b|\bSUCURSAL\b/.test(d) || /\bCS\b/.test(String(direccion).toUpperCase());
}
