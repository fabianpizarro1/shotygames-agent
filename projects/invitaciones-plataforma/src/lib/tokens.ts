import { randomInt } from 'node:crypto';

// Token del link personal: 8 caracteres sin letras ambiguas (0/O, 1/l/I) para que se pueda dictar.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function nuevoToken(): string {
  return Array.from({ length: 8 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
}
