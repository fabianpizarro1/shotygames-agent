import type { Config } from './config';

export type VentanaSubida = 'antes' | 'abierta' | 'cerrada' | 'apagada';

const t = (iso: string) => {
  const n = new Date(iso).getTime();
  return Number.isNaN(n) ? null : n;
};

// El servidor es quien manda: la página muestra el estado, pero la API vuelve a comprobarlo.
export function estadoFotos(c: Config, ahora = Date.now()) {
  const desde = t(c.fotos_subida_desde);
  const hasta = t(c.fotos_subida_hasta);
  const galeria = t(c.fotos_galeria_desde);
  const activas = c.fotos_activas.trim().toLowerCase() !== 'no';
  const subida: VentanaSubida = !activas ? 'apagada' : desde !== null && ahora < desde ? 'antes' : hasta !== null && ahora > hasta ? 'cerrada' : 'abierta';
  const galeriaAbierta = activas && galeria !== null && ahora >= galeria;
  return { activas, subida, galeriaAbierta, maxPorPersona: Math.min(200, Math.max(1, parseInt(c.fotos_max_por_persona, 10) || 40)) };
}
