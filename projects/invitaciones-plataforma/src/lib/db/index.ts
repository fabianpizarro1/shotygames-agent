import { crearAdaptadorLocal } from './local';
import type { Db } from './types';

export * from './types';

// DB_DRIVER=local (por defecto) | supabase (cuando existan las llaves; todavía no está escrito).
const g = globalThis as unknown as { __db?: Db };

export function db(): Db {
  if (!g.__db) {
    const driver = process.env.DB_DRIVER ?? 'local';
    if (driver !== 'local') throw new Error(`DB_DRIVER=${driver} todavía no está implementado`);
    g.__db = crearAdaptadorLocal();
  }
  return g.__db;
}
