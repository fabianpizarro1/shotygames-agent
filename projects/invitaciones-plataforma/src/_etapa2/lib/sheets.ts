import { auth as googleAuth, sheets as sheetsApi, type sheets_v4 } from '@googleapis/sheets';

// Mismas credenciales OAuth que el resto de KEPLER. El Sheet de esta app es
// propio (SHEETS_ID_INVITACIONES) para no mezclar invitados con las finanzas.

let cliente: sheets_v4.Sheets | null = null;

export function getSheets(): sheets_v4.Sheets {
  if (cliente) return cliente;
  const auth = new googleAuth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  cliente = sheetsApi({ version: 'v4', auth });
  return cliente;
}

export function sheetId(): string {
  const id = process.env.SHEETS_ID_INVITACIONES;
  if (!id) throw new Error('Falta SHEETS_ID_INVITACIONES');
  return id;
}

// El Sheet tiene ~60 lecturas/min por usuario: ante un 429 o un 5xx se reintenta con espera
// (0,5 s y 2 s) antes de rendirse, para que un pico en plena fiesta no tumbe la página.
async function conReintento<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const x = e as { code?: number | string; status?: number; response?: { status?: number } };
      const codigo = Number(x.code ?? x.status ?? x.response?.status);
      if (i >= 2 || ![429, 500, 502, 503].includes(codigo)) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1) ** 2));
    }
  }
}

export type Fila = Record<string, string> & { _fila: number };

// Convierte un índice de columna (0 = A) a letra. Las letras nunca se escriben
// a mano: se calculan a partir del título de cada columna.
export function letra(i: number): string {
  let n = i;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export async function leerTabla(hoja: string): Promise<{ encabezados: string[]; filas: Fila[] }> {
  const r = await conReintento(() =>
    getSheets().spreadsheets.values.get({
      spreadsheetId: sheetId(),
      range: `${hoja}!A1:ZZ`,
      valueRenderOption: 'FORMATTED_VALUE',
    }),
  );
  const [cab = [], ...resto] = r.data.values ?? [];
  const encabezados = cab.map((c) => String(c).trim());
  const filas: Fila[] = [];
  resto.forEach((valores, i) => {
    if (!valores.some((v) => String(v ?? '').trim() !== '')) return;
    const fila: Fila = { _fila: i + 2 } as Fila;
    encabezados.forEach((h, c) => {
      if (h) fila[h] = String(valores[c] ?? '');
    });
    filas.push(fila);
  });
  return { encabezados, filas };
}

// Agrega una fila respetando el orden REAL de los encabezados del Sheet.
export async function agregarFila(hoja: string, datos: Record<string, string>): Promise<void> {
  const { encabezados } = await leerTabla(hoja);
  const valores = encabezados.map((h) => datos[h] ?? '');
  await getSheets().spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: `${hoja}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [valores] },
  });
}

// Actualiza solo las celdas indicadas de una fila, resolviendo la columna por título.
export async function actualizarCeldas(
  hoja: string,
  encabezados: string[],
  fila: number,
  cambios: Record<string, string>,
): Promise<void> {
  const data = Object.entries(cambios).map(([titulo, valor]) => {
    const col = encabezados.indexOf(titulo);
    if (col < 0) throw new Error(`La hoja ${hoja} no tiene la columna "${titulo}"`);
    return { range: `${hoja}!${letra(col)}${fila}`, values: [[valor]] };
  });
  if (!data.length) return;
  await conReintento(() =>
    getSheets().spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId(),
      requestBody: { valueInputOption: 'RAW', data },
    }),
  );
}

// Agrega varias filas de una sola llamada (importaciones masivas).
export async function agregarFilas(hoja: string, filas: Record<string, string>[]): Promise<void> {
  if (!filas.length) return;
  const { encabezados } = await leerTabla(hoja);
  await getSheets().spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: `${hoja}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: filas.map((f) => encabezados.map((h) => f[h] ?? '')) },
  });
}

// Borra una fila entera (número de fila de la hoja, 1 = encabezados; nunca se permite borrarlos).
export async function eliminarFila(hoja: string, fila: number): Promise<void> {
  if (fila < 2) throw new Error('No se pueden borrar los encabezados');
  const api = getSheets();
  const meta = await api.spreadsheets.get({ spreadsheetId: sheetId(), fields: 'sheets.properties(sheetId,title)' });
  const gid = meta.data.sheets?.find((s) => s.properties?.title === hoja)?.properties?.sheetId;
  if (gid === undefined || gid === null) throw new Error(`No existe la hoja ${hoja}`);
  await api.spreadsheets.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: { requests: [{ deleteDimension: { range: { sheetId: gid, dimension: 'ROWS', startIndex: fila - 1, endIndex: fila } } }] },
  });
}
