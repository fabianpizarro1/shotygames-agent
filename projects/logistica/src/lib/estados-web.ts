// Los estados que acepta "PEDIDOS LOVABLE".
//
// No están escritos en el código: la columna ESTADO de esa hoja tiene una
// validación que apunta a `DATOS!$C$2:$C$19`, así que la lista viva es lo que
// haya en ese rango. Hoy son SIN COMPRAR / COMPRADO / AVISADO / CANCELADO más
// FRENADO, que es el que se agregó para esta pantalla — si Fabián agrega otro a
// mano en la hoja, esto lo acepta sin tocar código.
//
// Es el mismo patrón que `estados.ts` usa para los otros dos Sheets, con una
// diferencia: acá no hay fases ni colores porque no hay paquete viajando. Solo
// hace falta saber qué literales se pueden escribir.

import { google, type sheets_v4 } from 'googleapis';

/** El rango al que apunta la validación de la columna ESTADO. */
const RANGO_VALIDACION = 'DATOS!C2:C19';

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

let cache: string[] | null = null;

/** Los literales del desplegable, en MAYÚSCULAS y sin repetidos. */
export async function estadosDeLaHojaWeb(): Promise<string[]> {
  if (cache) return cache;

  const id = process.env.SHEETS_ID_PEDIDOS_WEB;
  if (!id) throw new Error('Falta SHEETS_ID_PEDIDOS_WEB');

  const r = await getSheets().spreadsheets.values.get({
    spreadsheetId: id,
    range: RANGO_VALIDACION,
  });

  const lista = [
    ...new Set(
      (r.data.values ?? [])
        .flat()
        .map((v) => String(v ?? '').trim().toUpperCase())
        .filter(Boolean)
    ),
  ];

  // Sin lista no se puede validar nada, y dejar pasar cualquier texto sería
  // peor que fallar: quedaría una celda fuera del desplegable de la hoja.
  if (!lista.length) throw new Error(`${RANGO_VALIDACION} está vacío en la hoja web`);

  cache = lista;
  return lista;
}
