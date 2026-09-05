import { Component, Suspense, lazy, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
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
//
// ── Por qué esto tiene reintento y fallback visible (2026-09-04) ──
// Antes era `lazy()` pelado con `<Suspense fallback={null}>`. Eso dejaba dos
// agujeros en el ÚNICO componente que factura:
//
//  1. Si el cliente tocaba COMPRAR antes de que terminara la precarga (móvil
//     con red lenta, que es de donde viene casi todo el tráfico de Meta), el
//     `fallback={null}` pintaba NADA: ni spinner ni overlay. El botón parecía
//     muerto. El cliente toca de nuevo, no pasa nada, y se va. Desde afuera se
//     ve exactamente como "se me congeló el checkout".
//  2. Si el import FALLABA (red que se corta, o el index.html es de antes de un
//     deploy y el .js con ese hash ya no existe → 404), la promesa rechazaba y
//     el throw subía hasta el RouteErrorBoundary de App.tsx: la landing entera
//     se reemplazaba por "No se pudo cargar la página". Todas las demás rutas
//     usan `lazyWithRetry` y se recuperan solas; el checkout era la única que
//     no. Justo la que cuesta plata.
//
// Ahora: se reintenta el import antes de rendirse, mientras tanto se ve un
// spinner, y si igual falla el error queda ENCERRADO acá (no tumba la landing)
// y se le ofrece al cliente reintentar o cerrar por WhatsApp, para no perder la
// venta.

const WHATSAPP_VENTAS = "593993154462";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Importa el chunk del checkout reintentando: la causa más común de fallo es
 *  un bache de red de un segundo, no una caída real. Tres intentos con espera
 *  creciente cubren eso sin dejar al cliente esperando de más. */
async function cargarCheckout() {
  let ultimoError: unknown;
  for (let intento = 0; intento < 3; intento++) {
    try {
      return await import("./CheckoutModal");
    } catch (error) {
      ultimoError = error;
      if (intento < 2) await esperar(400 * (intento + 1));
    }
  }
  throw ultimoError;
}

const CheckoutModal = lazy(() =>
  cargarCheckout().then((m) => ({ default: m.CheckoutModal })),
);

const prefetch = () => cargarCheckout().catch(() => {});

/** Lo que ve el cliente mientras baja el chunk. Antes era `null` — o sea, el
 *  botón no daba ninguna señal de haber sido tocado. */
const CheckoutLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-background px-8 py-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Abriendo el formulario…</p>
    </div>
  </div>
);

/** Encierra el fallo acá para que un chunk que no baja NO tumbe la landing
 *  entera. Y sobre todo: le deja al cliente una salida para comprar igual. */
class CheckoutErrorBoundary extends Component<{ children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="max-w-sm space-y-4 rounded-2xl bg-background p-6 text-center">
          <p className="text-lg font-semibold">No pudimos abrir el formulario</p>
          <p className="text-sm text-muted-foreground">
            Puede ser tu conexión. Reintenta, o escríbenos por WhatsApp y te tomamos
            el pedido ahí mismo.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              Reintentar
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(
                "Hola, quiero hacer un pedido pero la pagina no me abrio el formulario.",
              )}`}
              className="rounded-xl border px-4 py-3 font-semibold"
            >
              Pedir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export const LazyCheckoutModal = (props: ComponentProps<typeof CheckoutModalType>) => {
  // Una vez abierto se deja montado: cerrar y reabrir no debe recargar nada.
  const [everOpened, setEverOpened] = useState(props.open);

  useEffect(() => {
    if (props.open) setEverOpened(true);
  }, [props.open]);

  // NO se dispara InitiateCheckout acá: cada landing ya lo manda en su propio
  // handler del botón de comprar (ver TorreParejasV2Landing y las demás).
  // Agregarlo también acá lo contaba dos veces por cada cliente.

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
    <CheckoutErrorBoundary>
      {/* El loader solo se muestra si el cliente YA pidió abrir el modal: la
          precarga en segundo plano no debe tapar la landing. */}
      <Suspense fallback={props.open ? <CheckoutLoader /> : null}>
        <CheckoutModal {...props} />
      </Suspense>
    </CheckoutErrorBoundary>
  );
};
