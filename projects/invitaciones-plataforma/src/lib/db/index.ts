import { crearAdaptadorLocal } from './local';
import type { Db } from './types';

export * from './types';

// DB_DRIVER=local (por defecto) | supabase (cuando existan las llaves; todavía no está escrito).
const g = globalThis as unknown as { __db?: Db };

export function db(): Db {
  const driver = process.env.DB_DRIVER ?? 'local';
  if (driver !== 'local') throw new Error(`DB_DRIVER=${driver} todavía no está implementado`);
  if (!g.__db) g.__db = crearAdaptadorLocal();
  // En desarrollo, el recargado en caliente conserva la instancia vieja aunque la interfaz haya
  // crecido: si le faltan métodos, se crea de nuevo (los datos viven en .data/db.json).
  else if (process.env.NODE_ENV !== 'production' && Object.keys(g.__db).length !== Object.keys(crearAdaptadorLocal()).length) g.__db = crearAdaptadorLocal();
  return g.__db;
}
