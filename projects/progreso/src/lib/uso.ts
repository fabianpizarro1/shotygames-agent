import 'server-only';
import { after } from 'next/server';
import { anotarUsoIa } from './datos';
import { ahoraEC } from './fecha';

// Cada llamada a Claude deja una fila en USO_IA con sus tokens y su costo, para
// saber cuánto cuesta la app de verdad en vez de estimarlo.
//
// Precios por millón de tokens, de platform.claude.com/docs/en/about-claude/pricing
// (consultado el 2026-10-11). Si cambian, se actualizan acá — y en
// claude-personal.js del bot de Telegram, que usa la misma tabla.
const PRECIOS: Record<string, { input: number; escritura5m: number; lectura: number; output: number }> = {
  'claude-opus-5-5': { input: 4, escritura5m: 5, lectura: 0.2, output: 20 },
  'claude-sonnet-5-5': { input: 2, escritura5m: 2.5, lectura: 0.1, output: 10 },
  'claude-haiku-5-5': { input: 0.1, escritura5m: 0.125, lectura: 0.01, output: 0.5 },
};

export interface UsoApi {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export function costoUsd(modelo: string, u: UsoApi): number {
  const p = PRECIOS[modelo] ?? PRECIOS['claude-opus-5-5'];
  return (
    (u.input_tokens * p.input +
      (u.cache_creation_input_tokens ?? 0) * p.escritura5m +
      (u.cache_read_input_tokens ?? 0) * p.lectura +
      u.output_tokens * p.output) /
    1_000_000
  );
}

/** Suma el uso de varias vueltas de un mismo turno (loop de herramientas). */
export function sumarUso(a: UsoApi | null, b: UsoApi): UsoApi {
  if (!a) return { ...b };
  return {
    input_tokens: a.input_tokens + b.input_tokens,
    output_tokens: a.output_tokens + b.output_tokens,
    cache_creation_input_tokens: (a.cache_creation_input_tokens ?? 0) + (b.cache_creation_input_tokens ?? 0),
    cache_read_input_tokens: (a.cache_read_input_tokens ?? 0) + (b.cache_read_input_tokens ?? 0),
  };
}

/** Anota el uso sin demorar la respuesta (se escribe después de responder). */
export function registrarUso(ruta: string, modelo: string, u: UsoApi | null) {
  if (!u) return;
  const fila = [
    ahoraEC(),
    'app',
    ruta,
    modelo,
    String(u.input_tokens),
    String(u.cache_creation_input_tokens ?? 0),
    String(u.cache_read_input_tokens ?? 0),
    String(u.output_tokens),
    costoUsd(modelo, u).toFixed(5),
  ];
  const escribir = () => anotarUsoIa(fila).catch((e) => console.error('[uso-ia]', e instanceof Error ? e.message : e));
  try {
    after(escribir);
  } catch {
    // Fuera de un request (scripts): se escribe directo.
    void escribir();
  }
}
