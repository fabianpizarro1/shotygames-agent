import { lazy, ComponentType } from "react";

/**
 * Reemplazo de React.lazy() que se recupera sola del error más común en
 * apps con rutas cargadas bajo demanda: el navegador tiene abierto el
 * index.html de ANTES de un deploy, y al navegar a una ruta lazy intenta
 * pedir un archivo .js con un hash que el deploy nuevo ya reemplazó → 404 →
 * la promesa de import() rechaza → sin esto, la pantalla se queda en blanco
 * para siempre (el usuario solo se salva si refresca a mano).
 *
 * Acá, si el import falla, se hace UN reload automático (trae el index.html
 * actual con los hashes correctos) en vez de dejar la pantalla en blanco.
 * El flag en sessionStorage evita loop infinito si el fallo es por otra causa
 * (ej. sin internet de verdad).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const RELOAD_FLAG = "chunk-reload-attempted";
    try {
      const component = await factory();
      sessionStorage.removeItem(RELOAD_FLAG);
      return component;
    } catch (error) {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        // Nunca resuelve — el reload ya está en camino.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
