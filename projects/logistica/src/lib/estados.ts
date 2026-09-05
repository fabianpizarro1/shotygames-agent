// ============================================================
// LOS ESTADOS SALEN DEL SHEET, NO DE UNA LISTA EN EL CÓDIGO
//
// Fabián pidió que los botones de la app sean exactamente los estados de cada
// Sheet. Se leen en vivo:
//
//   · ShotyGames  → hoja `DATOS!C2:C19`, que es el desplegable de la columna
//     ESTADO (validación `=DATOS!$C$2:$C$19`).
//   · Dropshipping → la validación de datos de la propia columna ESTADO.
//
// ⚠️ La validación de dropshipping está DESACTUALIZADA: no incluye `NOVEDAD` y
// sin embargo hay 10 pedidos en ese estado (2026-09-03). Por eso la lista final
// es la UNIÓN de lo que ofrece el desplegable y lo que de verdad está en uso —
// si no, un estado real desaparecería de los botones y no habría forma de
// sacar un pedido de ahí desde la app.
// ============================================================

import { google, type sheets_v4 } from 'googleapis';
import type { Fase, Negocio } from './negocios';
import { norm } from './negocios';

/**
 * Estados que Fabián dio de baja el 2026-09-03. Siguen en la hoja DATOS de
 * ShotyGames, así que hay que sacarlos acá; si algún día se borran del Sheet,
 * esta lista puede quedar vacía y no cambia nada.
 */
const RETIRADOS = ['AVISAR', 'NOTIFICADO', 'VERIFICAR'];

/**
 * Qué significa cada literal. Es por patrón y no por lista cerrada, porque los
 * estados los define el Sheet: uno nuevo tiene que caer en algún lado sin que
 * haya que tocar el código.
 *
 * El orden importa — `PENDIENTE_CONFIRMACION` se evalúa antes que `PENDIENTE`.
 */
const REGLAS: { re: RegExp; fase: Fase }[] = [
  { re: /PENDIENTE.?CONFIRMA/, fase: 'cerrado' },
  // ShotyGames: "ya está todo listo pero todavía no lo entrego a la
  // transportadora". No es trabajo de logística hasta que pase a ENVIADO.
  { re: /^PENDIENTE$/, fase: 'preparando' },
  { re: /EN.?DROPI/, fase: 'por-despachar' },
  { re: /GUIA.?GENERADA|^ENVIADO$|EN.?CAMINO/, fase: 'en-camino' },
  { re: /NOVEDAD/, fase: 'novedad' },
  { re: /DEVOLUCION|DEVUELT/, fase: 'devuelto' },
  { re: /ENTREGADO|PAGADO|CANCELADO|ANULAD/, fase: 'cerrado' },
];

/** Un estado que no matchea ninguna regla se trata como trabajo, no se esconde. */
export function faseDeLiteral(literal: string): Fase {
  const n = norm(literal);
  return REGLAS.find((r) => r.re.test(n))?.fase ?? 'novedad';
}

/** Cómo se muestra el estado en la interfaz: "GUIA_GENERADA" → "Guía generada". */
export function etiquetaDeLiteral(literal: string): string {
  const t = String(literal ?? '').replace(/_/g, ' ').trim().toLowerCase();
  if (!t) return '—';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Estados que existen en el Sheet pero NO se ofrecen como botón en la app.
 *
 * Todo lo que llega a esta cola ya está confirmado y despachado, así que
 * mandarlo "de vuelta" a un estado previo no tiene sentido y solo da lugar a
 * equivocarse de botón. Lo pidió Fabián el 2026-09-03.
 *
 * Siguen siendo estados VÁLIDOS: se leen del Sheet, pintan la fase y el color,
 * y el botón de "DROPI ya lo tiene como X" puede escribirlos igual — ese no
 * inventa nada, sincroniza lo que DROPI ya reporta.
 */
const NO_OFRECIBLES: Record<Negocio, string[]> = {
  dropshipping: ['PENDIENTE_CONFIRMACION', 'EN_DROPI', 'GUIA_GENERADA', 'CANCELADO'],
  shotygames: ['PENDIENTE', 'ENVIADO', 'CANCELADO'],
};

export interface EstadoSheet {
  literal: string;
  fase: Fase;
  etiqueta: string;
  /** ¿Se muestra como botón para cambiar el estado a mano? */
  ofrecible: boolean;
}

function construir(literales: string[], negocio: Negocio): EstadoSheet[] {
  const vistos = new Set<string>();
  const out: EstadoSheet[] = [];

  for (const raw of literales) {
    const literal = String(raw ?? '').trim();
    if (!literal) continue;
    const n = norm(literal);
    if (vistos.has(n) || RETIRADOS.includes(n)) continue;
    vistos.add(n);
    out.push({
      literal,
      fase: faseDeLiteral(literal),
      etiqueta: etiquetaDeLiteral(literal),
      ofrecible: !NO_OFRECIBLES[negocio].includes(n),
    });
  }
  return out;
}

function getSheets(): sheets_v4.Sheets {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN');
  }
  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

/** ShotyGames: el desplegable vive en la hoja DATOS. */
async function leerShotygames(): Promise<string[]> {
  const id = process.env.SHEETS_ID_SHOTYGAMES;
  if (!id) throw new Error('Falta SHEETS_ID_SHOTYGAMES');
  const r = await getSheets().spreadsheets.values.get({
    spreadsheetId: id,
    range: 'DATOS!C2:C19',
  });
  return (r.data.values ?? []).flat().map(String);
}

/** Dropshipping: el desplegable es la validación de datos de la celda D2. */
async function leerDropshipping(): Promise<string[]> {
  const id = process.env.SHEETS_ID_DROPSHIPPING;
  if (!id) throw new Error('Falta SHEETS_ID_DROPSHIPPING');
  const meta = await getSheets().spreadsheets.get({
    spreadsheetId: id,
    ranges: ['PEDIDOS!D2:D2'],
    includeGridData: true,
    fields: 'sheets.data.rowData.values.dataValidation.condition.values.userEnteredValue',
  });
  const cond =
    meta.data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0]?.dataValidation?.condition;
  return (cond?.values ?? []).map((v) => String(v.userEnteredValue ?? ''));
}

// Los estados cambian muy de vez en cuando; se cachean por instancia para no
// gastar dos llamadas más a la API de Sheets en cada carga de la cola.
const cache = new Map<Negocio, EstadoSheet[]>();

/**
 * La lista de estados de un negocio.
 *
 * `enUso` son los literales que aparecen de verdad en las filas: se suman a los
 * del desplegable para que ninguno quede sin botón (ver el aviso de arriba
 * sobre NOVEDAD en dropshipping).
 */
export async function getEstados(negocio: Negocio, enUso: string[] = []): Promise<EstadoSheet[]> {
  let base = cache.get(negocio);

  if (!base) {
    try {
      base = construir(
        negocio === 'shotygames' ? await leerShotygames() : await leerDropshipping(),
        negocio
      );
      cache.set(negocio, base);
    } catch (e) {
      // Si el Sheet no contesta, la app no puede quedarse sin botones: se sigue
      // con lo que esté en uso, que es lo mínimo indispensable para operar.
      console.error(`No se pudo leer la lista de estados de ${negocio}:`, e);
      base = [];
    }
  }

  const vistos = new Set(base.map((e) => norm(e.literal)));
  const extra = construir(
    enUso.filter((l) => !vistos.has(norm(l))),
    negocio
  );

  return [...base, ...extra];
}

/** ¿Este literal es un estado aceptable para este negocio? */
export async function esEstadoValido(negocio: Negocio, literal: string): Promise<boolean> {
  const lista = await getEstados(negocio);
  return lista.some((e) => norm(e.literal) === norm(literal));
}
