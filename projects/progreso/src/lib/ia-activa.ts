// Interruptor de la IA DENTRO de la app (chat, voz, inbox, Top 3, cierre,
// revisión semanal, organizar proyectos). Desde el 2026-10-11 está APAGADA por
// decisión de Fabián: la app es para ver y marcar, y la planificación la hace
// con Claude Code en sus sesiones de KEPLER. Así la app no gasta tokens.
//
// Para prenderla: NEXT_PUBLIC_IA_ACTIVA=1 en Vercel y redeploy (es de build,
// se lee igual en el servidor y en el teléfono).
export const IA_ACTIVA = process.env.NEXT_PUBLIC_IA_ACTIVA === '1';

export const MENSAJE_IA_APAGADA = 'La IA de la app está apagada: esto se hace en tu sesión con Claude.';
