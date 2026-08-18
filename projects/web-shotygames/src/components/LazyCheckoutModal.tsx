import { Suspense, lazy, useEffect, useState, type ComponentProps } from "react";
import type { CheckoutModal as CheckoutModalType } from "./CheckoutModal";

// El CheckoutModal pesa ~114 KB (formulario, provincias, upsells, todos los
// campos de pago). Antes vivía en el chunk común, así que CADA landing lo
// descargaba antes de poder pintar nada — aunque el visitante se fuera sin
// llegar al botón de comprar.
//
// Acá se carga aparte y en dos tiempos:
//  1. la landing pinta sin él;
//  2. apenas el navegador queda libre (requestIdleCallback) se baja el chunk
//     en segundo plano, sin competir con el hero ni las fotos.
// Cuando el cliente toca "COMPRAR" ya está en caché y el modal abre al toque.
// Si toca antes de que termine la precarga, el Suspense aguanta ese instante.

const CheckoutModal = lazy(() =>
  import("./CheckoutModal").then((m) => ({ default: m.CheckoutModal })),
);

const prefetch = () => import("./CheckoutModal");

export const LazyCheckoutModal = (props: ComponentProps<typeof CheckoutModalType>) => {
  // Una vez abierto se deja montado: cerrar y reabrir no debe recargar nada.
  const [everOpened, setEverOpened] = useState(props.open);

  useEffect(() => {
    if (props.open) setEverOpened(true);
  }, [props.open]);

  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    // Safari iOS todavía no trae requestIdleCallback y es de donde viene
    // buena parte del tráfico móvil: un timeout corto cumple la misma función.
    const id = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(id);
  }, []);

  if (!everOpened) return null;

  return (
    <Suspense fallback={null}>
      <CheckoutModal {...props} />
    </Suspense>
  );
};
