'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * La hoja de detalle en móvil, con comportamiento de app nativa.
 *
 * Dos cosas que la versión anterior no hacía y se notaban enseguida:
 *
 *  1. **La lista de atrás se movía.** Al arrastrar dentro de la hoja, el scroll
 *     se "encadenaba" al body y la cola quedaba en otro lado al cerrar. Se
 *     bloquea el body mientras la hoja está abierta, guardando la posición para
 *     devolverla exacta.
 *  2. **No se podía cerrar deslizando.** En iOS una hoja se baja con el dedo.
 *     Se arrastra desde la barra de arriba —el asa y toda la cabecera con el
 *     nombre—, que es la zona que no hace falta para leer.
 *
 * Usa **pointer events** y no touch events a propósito: el navegador los emite
 * igual para dedo y para mouse, así que el gesto se puede probar de verdad en
 * desarrollo en vez de confiar en que ande.
 */
export function HojaMovil({
  onCerrar,
  children,
}: {
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  const [arrastre, setArrastre] = useState(0);
  const [soltando, setSoltando] = useState(false);

  /** Cuánto hay que bajar para cerrar, y el "flick" rápido que también cierra. */
  const CIERRA_EN = 110;
  const VELOCIDAD = 0.5;

  // ── Bloqueo del fondo ─────────────────────────────────────────────────────
  // `position: fixed` es lo único que frena de verdad el scroll del body en
  // iOS; `overflow: hidden` solo no alcanza.
  //
  // ⚠️ Solo en móvil. El componente se monta igual en escritorio —ahí lo tapa
  // `lg:hidden`, que es CSS y no impide que el efecto corra— y sin este
  // chequeo abrir un pedido dejaba la página de escritorio sin poder scrollear.
  useEffect(() => {
    const esMovil = window.matchMedia('(max-width: 1023px)');
    if (!esMovil.matches) return;

    const y = window.scrollY;
    const body = document.body;
    const previo = { position: body.style.position, top: body.style.top, width: body.style.width };

    const soltar = () => {
      body.style.position = previo.position;
      body.style.top = previo.top;
      body.style.width = previo.width;
      window.scrollTo(0, y);
    };

    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.width = '100%';

    // Si se gira el teléfono o se agranda la ventana hasta escritorio, el
    // bloqueo deja de tener sentido y hay que soltarlo.
    const alCambiar = () => {
      if (!esMovil.matches) soltar();
    };
    esMovil.addEventListener('change', alCambiar);

    return () => {
      esMovil.removeEventListener('change', alCambiar);
      soltar();
    };
  }, []);

  // ── Arrastrar para cerrar ─────────────────────────────────────────────────
  const inicio = useRef<{ y: number; t: number; id: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    // Solo desde el asa o la cabecera: el resto del panel tiene que seguir
    // sirviendo para leer y tocar botones.
    if (!(e.target as HTMLElement).closest('[data-asa]')) return;
    inicio.current = { y: e.clientY, t: Date.now(), id: e.pointerId };
    // La captura mantiene los eventos en la hoja aunque el dedo se salga de
    // ella. Si el navegador la rechaza, el gesto sigue funcionando igual: no
    // vale la pena romper el arrastre por esto.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* puntero ya liberado o no capturable */
    }
    setSoltando(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!inicio.current || e.pointerId !== inicio.current.id) return;
    // Solo hacia abajo: la hoja no se estira hacia arriba.
    setArrastre(Math.max(0, e.clientY - inicio.current.y));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!inicio.current || e.pointerId !== inicio.current.id) return;
    const velocidad = arrastre / Math.max(1, Date.now() - inicio.current.t);
    inicio.current = null;
    setSoltando(true);
    if (arrastre > CIERRA_EN || velocidad > VELOCIDAD) onCerrar();
    else setArrastre(0);
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-black/60"
        style={{ opacity: Math.max(0, 1 - arrastre / 400) }}
      />

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="animar-hoja absolute inset-x-0 bottom-0 top-[max(2rem,calc(env(safe-area-inset-top)+0.5rem))] overflow-hidden rounded-t-3xl border-t border-[var(--color-borde)]"
        style={{
          transform: arrastre ? `translateY(${arrastre}px)` : undefined,
          // Mientras el dedo está apoyado no hay transición: la hoja tiene que
          // seguirlo al instante. Al soltar, vuelve o se va con animación.
          transition: soltando ? 'transform 220ms cubic-bezier(0.22,1,0.36,1)' : undefined,
        }}
      >
        {/* El asa: la barrita de las hojas de iOS. `touch-action: none` evita
            que el navegador se quede con el gesto antes que nosotros. */}
        <div
          data-asa
          className="absolute inset-x-0 top-0 z-20 flex h-6 items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <span className="h-1 w-9 rounded-full bg-[var(--color-borde-fuerte)]" />
        </div>

        {children}
      </div>
    </div>
  );
}
