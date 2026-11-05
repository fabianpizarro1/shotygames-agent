import { unstable_cache } from 'next/cache';
import { actualizarCeldas, agregarFilas, leerTabla } from './sheets';
import { CONFIG_DEFAULTS } from './config-defaults.mjs';

export { CONFIG_DEFAULTS };

// Todo lo que se ve en la invitación vive en la hoja CONFIG (clave | valor |
// descripcion). El dashboard la edita; la página solo lee.


export type Config = Record<keyof typeof CONFIG_DEFAULTS, string>;

const porDefecto = () =>
  Object.fromEntries(Object.entries(CONFIG_DEFAULTS).map(([k, v]) => [k, v.valor])) as Config;

// Lanza si el Sheet falla: unstable_cache no guarda los errores, así que un fallo no deja
// "la configuración por defecto" cacheada un minuto pisando lo que se editó en el panel.
async function leerConfig(): Promise<Config> {
  const base = porDefecto();
  const { filas } = await leerTabla('CONFIG');
  for (const f of filas) {
    const clave = (f['clave'] ?? '').trim();
    if (clave in base) (base as Record<string, string>)[clave] = f['valor'] ?? '';
  }
  return base;
}

const configCacheada = unstable_cache(leerConfig, ['config'], { tags: ['config'], revalidate: 60 });

export async function getConfig(): Promise<Config> {
  try {
    return await configCacheada();
  } catch (e) {
    console.error('[config] no se pudo leer CONFIG, uso valores por defecto (sin cachear)', e);
    return porDefecto();
  }
}

// ---- Escritura (solo dashboard) ----

export interface CampoConfig {
  clave: string;
  valor: string;
  descripcion: string;
}

// Lista completa para el editor: valores del Sheet; si falta una clave, el valor por defecto.
export async function configCompleta(): Promise<CampoConfig[]> {
  const { filas } = await leerTabla('CONFIG');
  const enSheet = new Map(filas.map((f) => [(f['clave'] ?? '').trim(), f['valor'] ?? '']));
  return Object.entries(CONFIG_DEFAULTS).map(([clave, d]) => ({
    clave,
    valor: enSheet.has(clave) ? (enSheet.get(clave) as string) : d.valor,
    descripcion: d.descripcion,
  }));
}

// Guarda solo las claves conocidas: actualiza la celda si existe y agrega la fila si falta.
export async function guardarConfig(cambios: Record<string, string>): Promise<number> {
  const claves = Object.keys(cambios).filter((k) => k in CONFIG_DEFAULTS);
  if (!claves.length) return 0;
  const { encabezados, filas } = await leerTabla('CONFIG');
  const fila = new Map(filas.map((f) => [(f['clave'] ?? '').trim(), f._fila]));
  const nuevas: Record<string, string>[] = [];
  for (const k of claves) {
    const v = String(cambios[k]).slice(0, 4000);
    if (fila.has(k)) await actualizarCeldas('CONFIG', encabezados, fila.get(k) as number, { valor: v });
    else nuevas.push({ clave: k, valor: v, descripcion: CONFIG_DEFAULTS[k as keyof typeof CONFIG_DEFAULTS].descripcion });
  }
  await agregarFilas('CONFIG', nuevas);
  return claves.length;
}
