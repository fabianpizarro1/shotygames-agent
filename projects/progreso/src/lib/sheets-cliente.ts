import { google, sheets_v4 } from 'googleapis';

// Mismas credenciales que usa KEPLER (sheets-personal.js en la raíz del
// monorepo) y el mismo Sheet — esta app no tiene datos propios a propósito,
// para que el bot de Telegram y la web nunca queden desincronizados.

function getAuth() {
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

export function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

export const SHEET_ID = process.env.SHEETS_ID_PERSONAL as string;
