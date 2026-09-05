// ============================================================
// TRACKING DIRECTO DE SERVIENTREGA (solo servidor)
//
// POR QUÉ EXISTE, aunque DROPI ya devuelve movimientos:
// DROPI no se atrasa —comparadas 18 guías, las marcas de tiempo coinciden al
// minuto— pero **recorta el nombre del movimiento**:
//
//   Servientrega:  "Ingresando en Agencia QUITO_CONDADO"
//   DROPI:         "INGRESANDO EN AGENCIA"  + nom_conc: "cs condando"
//
//   Servientrega:  "Ingresando a CL SANTO DOMINGO"
//   DROPI:         "INGRESANDO A"
//
// Esa poda es la que hacía que el aviso de "llegó a tu ciudad" se disparara en
// 1 de 49 pedidos: la señal existía, DROPI se la comía. Y es la que obligaba a
// adivinar la agencia a partir de un campo escrito a mano.
//
// Cubre el 98% de los pedidos (48 de 49 van por Servientrega). Para GINTRACOM y
// LAAR se sigue usando lo de DROPI, que para esos es la única fuente.
//
// Es una página pública: no hay login ni credenciales. Se parsea el HTML del
// timeline, así que si Servientrega rediseña la página esto deja de encontrar
// movimientos — devuelve null y la app cae sola a los de DROPI, sin romperse.
// ============================================================

import { unstable_cache } from 'next/cache';
import type { Movimiento } from './tipos';

const BASE = 'https://www.servientrega.com.ec';
const TTL_S = 10 * 60;

export interface RastreoSV {
  guia: string;
  /** Ciudad de origen tal como la declara Servientrega. */
  origen: string | null;
  /** Ciudad de DESTINO — la autoridad sobre a dónde va el paquete. */
  destino: string | null;
  /** Estado que muestra la página ("PENDIENTE", "ENTREGADO"…). */
  estado: string | null;
  /** Del más reciente al más antiguo, con el nombre COMPLETO. */
  movimientos: Movimiento[];
}

// ─── Ritmo ───────────────────────────────────────────────────────────────────
// Es un sitio público y son ~50 páginas por refresco. Mismo criterio que con
// DROPI: pocas en vuelo y espaciadas, para no hacer ruido.

const MAX_EN_VUELO = 5;
const ESPACIO_MS = 120;

let enVuelo = 0;
let ultimo = 0;
const esperando: (() => void)[] = [];
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function conRitmo<T>(fn: () => Promise<T>): Promise<T> {
  if (enVuelo >= MAX_EN_VUELO) await new Promise<void>((r) => esperando.push(r));
  enVuelo++;
  try {
    const desde = Date.now() - ultimo;
    if (desde < ESPACIO_MS) await dormir(ESPACIO_MS - desde);
    ultimo = Date.now();
    return await fn();
  } finally {
    enVuelo--;
    esperando.shift()?.();
  }
}

// ─── Parseo ──────────────────────────────────────────────────────────────────

/**
 * Quita las etiquetas y devuelve los textos sueltos, en orden.
 * Se separa con un carácter de control que no puede aparecer en el HTML.
 */
const SEP = '\u0001';
const sinTags = (h: string) =>
  h
    .replace(/<[^>]*>/g, SEP)
    .split(SEP)
    .map((x) => x.trim())
    .filter(Boolean);

function desescapar(t: string): string {
  return t
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

/** "MACHALA (Provincia: EL ORO)" → "MACHALA" */
const soloCiudad = (t: string | null) =>
  t ? desescapar(t).replace(/\s*\(Provincia:[^)]*\)\s*/i, '').trim() || null : null;

function parsear(html: string, guia: string): RastreoSV | null {
  // Cada movimiento es un `.timeline-item` con tres textos: grupo, fecha y el
  // nombre completo. La fecha es el ancla porque es la única con formato fijo.
  const items = html.split(/class="timeline-item"/).slice(1);

  const movimientos: Movimiento[] = [];
  for (const it of items) {
    const partes = sinTags(it).map(desescapar);
    const iFecha = partes.findIndex((p) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(p));
    if (iFecha < 0) continue;
    const fecha = partes[iFecha];
    const nombre = partes[iFecha + 1];
    if (!nombre) continue;
    movimientos.push({ movimiento: nombre, motivo: '', fecha });
  }

  if (!movimientos.length) return null;

  const cab = html.match(/Origen:\s*<\/?[^>]*>?\s*([^<]+)<[\s\S]{0,120}?Destino\s*:\s*<\/?[^>]*>?\s*([^<]+)</i);
  const estado = html.match(/estimated-delivery[\s\S]{0,200}?>\s*([A-ZÁÉÍÓÚÑ ]{3,30})\s*</i);

  return {
    guia,
    origen: soloCiudad(cab?.[1] ?? null),
    destino: soloCiudad(cab?.[2] ?? null),
    estado: estado ? desescapar(estado[1]) : null,
    // La página los lista del más reciente al más antiguo; se ordena igual por
    // fecha para no depender de eso.
    movimientos: movimientos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
  };
}

// ─── Consulta ────────────────────────────────────────────────────────────────

async function pedir(guia: string): Promise<RastreoSV | null> {
  try {
    const res = await conRitmo(() =>
      fetch(`${BASE}/Tracking/Index/?guia=${encodeURIComponent(guia)}`, {
        headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' },
        signal: AbortSignal.timeout(20_000),
      })
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parsear(await res.text(), guia);
  } catch (e) {
    console.error(`Servientrega ${guia}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * El rastreo de una guía. `null` si no se pudo o si la página cambió de forma —
 * quien llama debe seguir con lo que tenga de DROPI.
 *
 * Se cachea igual que el tracking de DROPI: 10 minutos en la Data Cache, que
 * comparten todas las instancias del lambda.
 */
async function rastrear(guia: string): Promise<RastreoSV | null> {
  try {
    return await unstable_cache(
      async () => {
        const r = await pedir(guia);
        // Un fallo NO se cachea: tirar deja la entrada sin escribir.
        if (!r) throw new Error('sin-datos');
        return r;
      },
      ['servientrega', guia],
      { revalidate: TTL_S, tags: ['servientrega'] }
    )();
  } catch {
    return null;
  }
}

/** Varias guías. El ritmo lo controla `conRitmo`, así que van todas de una. */
export async function rastrearVarias(guias: string[]): Promise<Map<string, RastreoSV>> {
  const out = new Map<string, RastreoSV>();
  const unicas = [...new Set(guias.filter(Boolean))];
  const res = await Promise.all(unicas.map((g) => rastrear(g)));
  res.forEach((r, i) => {
    if (r) out.set(unicas[i], r);
  });
  return out;
}
