import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import comboParejasBanner from "@/assets/combo-parejas-banner.webp";

/**
 * Banda de "Promo de esta semana": una sola promo destacada, arriba del
 * catálogo, para que el producto de mayor ticket se vea antes que las torres
 * sueltas.
 *
 * Antes esto era un banner genérico ("HOY: Regalos Digitales Incluidos") sin
 * producto ni destino: el único handler que tenía apuntaba a un WhatsApp que
 * no existe (593987654321) y encima estaba desconectado de todo botón. No
 * llevaba a ninguna venta.
 *
 * El CTA manda a /landing/combo-parejas en vez de abrir el checkout acá: esa
 * landing es la que ya vende el combo entero (bonos, testimonios, garantía) y
 * es la que reciben los anuncios. Abrir el modal desde un banner sin contexto
 * pide la dirección antes de haber explicado qué se lleva.
 *
 * Los precios viven acá duplicados de la landing a propósito (no hay catálogo
 * central todavía). Si cambia el precio del combo, cambia en los dos lados:
 * este archivo y src/pages/ComboParejasLanding.tsx.
 */

const PRECIO = 35;
const PRECIO_ANTES = 49.9;
const RUTA = "/landing/combo-parejas";

const PromoBanner = () => {
  const navigate = useNavigate();

  const irAlCombo = () => {
    // Igual que las tarjetas de producto: el pixel marca la intención acá,
    // el InitiateCheckout real lo dispara la landing cuando abre el checkout.
    if (typeof (window as any).fbq !== "undefined") {
      (window as any).fbq("track", "ViewContent", {
        content_name: "Combo Parejas",
        content_type: "product",
        value: PRECIO,
        currency: "USD",
      });
    }
    navigate(RUTA);
  };

  return (
    <section className="relative overflow-hidden bg-[#1a0510] py-10 md:py-14">
      {/* Halos decorativos: fuera del flujo, sin costo de layout */}
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#e91e63]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#f50057]/20 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        {/* La columna de la imagen va con ancho tope: la foto es vertical (4:5)
            y sin tope estiraba la banda a ~750 px de alto en escritorio, que ya
            no es una banda sino otra portada compitiendo con el hero. */}
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          {/* Texto */}
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e91e63] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
              Promo de esta semana
            </span>

            <h2 className="font-display mt-4 text-4xl leading-tight text-white md:text-5xl">
              Combo <span className="text-[#ff6b9d]">Parejas</span>
            </h2>

            <p className="mt-3 text-lg text-white/80">
              Torre Parejas + Dados del Placer + Emparejados. Todo lo de una noche
              distinta en un solo pedido.
            </p>

            <div className="mt-5 flex items-baseline justify-center gap-3 md:justify-start">
              <span className="font-display text-5xl font-bold text-white">${PRECIO}</span>
              <span className="text-2xl text-white/50 line-through">
                ${PRECIO_ANTES.toFixed(2)}
              </span>
              <span className="rounded-md bg-[#f0c04a] px-2 py-1 text-sm font-bold text-black">
                -30%
              </span>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/70 md:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[#ff6b9d]" /> Envío gratis a todo Ecuador
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-[#ff6b9d]" /> 2 guías digitales de regalo
              </span>
            </div>

            <Button
              onClick={irAlCombo}
              size="xl"
              className="group mt-7 w-full bg-gradient-to-r from-[#e91e63] to-[#f50057] text-white hover:from-[#f50057] hover:to-[#e91e63] sm:w-auto"
            >
              VER LA PROMO
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Imagen: clicable también, es lo que la gente toca primero */}
          <button
            type="button"
            onClick={irAlCombo}
            aria-label="Ver el Combo Parejas"
            className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform hover:scale-[1.02]"
          >
            <img
              src={comboParejasBanner}
              alt="Combo Parejas: Torre de Shots Parejas, Dados del Placer y cartas Emparejados"
              width={800}
              height={993}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
