import { db, type Evento } from './db';
import { CONFIG_DEFAULTS } from './config-defaults.mjs';
import { plantillaPorSlug } from './plantillas';

export { CONFIG_DEFAULTS };

// Todo lo que se ve en la invitación vive en evento.config (clave → valor). Las claves que el
// cliente no tocó salen de la plantilla y, si la plantilla no las trae, de los valores base.

export type Config = Record<keyof typeof CONFIG_DEFAULTS, string>;

const base = () => Object.fromEntries(Object.entries(CONFIG_DEFAULTS).map(([k, v]) => [k, v.valor])) as Config;

export function configDeEvento(e: Pick<Evento, 'plantilla' | 'config'>): Config {
  return { ...base(), ...plantillaPorSlug(e.plantilla).defaults, ...e.config } as Config;
}

export interface CampoConfig {
  clave: string;
  valor: string;
  descripcion: string;
}

// Lista completa para el editor: valor efectivo de cada clave conocida.
export function camposDeEvento(e: Evento): CampoConfig[] {
  const c = configDeEvento(e);
  return Object.entries(CONFIG_DEFAULTS).map(([clave, d]) => ({ clave, valor: c[clave as keyof Config], descripcion: d.descripcion }));
}

// Guarda solo claves conocidas, con tope de largo.
export async function guardarConfigEvento(eventoId: string, cambios: Record<string, string>): Promise<number> {
  const e = await db().eventoPorId(eventoId);
  if (!e) return 0;
  const limpios: Record<string, string> = {};
  for (const [k, v] of Object.entries(cambios)) if (k in CONFIG_DEFAULTS) limpios[k] = String(v).slice(0, 4000);
  const n = Object.keys(limpios).length;
  if (n) await db().parchearEvento(eventoId, { config: { ...e.config, ...limpios } });
  return n;
}
