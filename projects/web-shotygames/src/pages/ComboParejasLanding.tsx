import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import Footer from "@/components/Footer";
import {
  ShoppingCart,
  Gift,
  Truck,
  CheckCircle2,
  Star,
  Smartphone,
  Package,
  Wallet,
  Zap,
} from "lucide-react";

import comboFlatlay from "@/assets/combo-parejas-pareja-hero.webp";
import comboMesa from "@/assets/combo-parejas-pareja-mesa.webp";
import comboCercano from "@/assets/combo-parejas-pareja-cercano.webp";
import torreVelas from "@/assets/torre-parejas-lifestyle-velas.webp";
import torreJugando from "@/assets/torre-parejas-lifestyle-jugando.webp";
import torreNormalUpsell from "@/assets/torre-normal-brillo.webp";
import torrePicanteUpsell from "@/assets/torre-picante.jpg";
import dadosPlacer from "@/assets/dados-del-placer-combo.webp";
import emparejadosImpresasMesa from "@/assets/emparejados-impresas-mesa.jpg";
import emparejadosImpresasCortando from "@/assets/emparejados-impresas-cortando.jpg";
import emparejadosImpresasMano from "@/assets/emparejados-impresas-mano.jpg";
import guia30Posiciones from "@/assets/ebook-30-posiciones.webp";
import guiaPlacer from "@/assets/guia-placer-portada.webp";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";
import testimonial4 from "@/assets/testimonial-4.jpg";
import testimonial5 from "@/assets/testimonial-5.jpg";
import testimonial6 from "@/assets/testimonial-6.jpg";
import torreNormalUpsellThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torrePicanteUpsellThumb from "@/assets/thumbs/torre-picante.webp";

/**
 * Landing del COMBO PAREJAS ($35).
 *
 * Independiente de /landing/torre-parejas: acá no se vende una torre, se vende
 * "todo lo que necesitan para una noche diferente". Jerarquía deliberada:
 * experiencia → combo → valor → bonos → precio → CTA.
 *
 * Tema: la página se pinta oscura con `dark` + override de las variables del
 * design system en el contenedor. Así los componentes de shadcn (Card, Badge,
 * Accordion, Button) heredan el tema rosa/oscuro sin tener que reestilizarlos
 * uno por uno, y sin tocar el tema global del sitio.
 *
 * IMPORTANTE: no toca el checkout. Usa el CheckoutModal tal cual, con el mismo
 * flujo de pago contra entrega que el resto de productos físicos.
 */

// Variables del design system sobreescritas solo para esta página.
const themeVars = {
  "--background": "336 30% 4%",
  "--foreground": "0 0% 98%",
  "--card": "336 22% 8%",
  "--card-foreground": "0 0% 98%",
  "--popover": "336 22% 8%",
  "--popover-foreground": "0 0% 98%",
  "--primary": "340 82% 52%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "336 20% 12%",
  "--secondary-foreground": "0 0% 98%",
  "--muted": "336 18% 11%",
  "--muted-foreground": "336 10% 68%",
  "--accent": "340 100% 48%",
  "--accent-foreground": "0 0% 100%",
  "--border": "336 20% 18%",
  "--input": "336 20% 18%",
  "--ring": "340 82% 52%",
} as React.CSSProperties;

const ROSA = "#e91e63";
const ROSA_FUERTE = "#f50057";
const ORO = "#f0c04a";

const ComboParejasLanding = () => {
  const productName = "Combo Parejas";
  const productPrice = 35.0;

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();

  useEffect(() => {
    if (shouldOpenCheckout) {
      setCheckoutOpen(true);
      setShouldOpenCheckout(false);
    }
  }, [shouldOpenCheckout, setShouldOpenCheckout]);

  useEffect(() => {
    if (typeof (window as any).fbq !== "undefined") {
      (window as any).fbq("track", "ViewContent", {
        content_name: productName,
        content_category: "Combos",
        value: productPrice,
        currency: "USD",
      });
    }
  }, []);

  // La barra sticky aparece recién cuando el usuario pasó el hero: antes es
  // ruido (el CTA del hero ya está en pantalla) y le come alto útil al móvil.
  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBuyClick = () => {
    if (typeof (window as any).fbq !== "undefined") {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: productName,
        content_type: "product",
        value: productPrice,
        currency: "USD",
      });
    }
    setCheckoutOpen(true);
  };

  const testimonios = [
    { img: testimonial1, alt: "Testimonio real de cliente — entrega confirmada" },
    { img: testimonial2, alt: "Cliente satisfecho con la Torre de Shots Parejas" },
    { img: testimonial3, alt: "Testimonio positivo — producto recibido" },
    { img: testimonial4, alt: "Confirmación de entrega — cliente agradecido" },
    { img: testimonial5, alt: "Clienta feliz con la entrega de su pedido" },
    { img: testimonial6, alt: "Testimonio destacado — puntualidad 10/10" },
  ];

  const faqs = [
    {
      q: "¿Los 3 juegos son físicos?",
      a: "La Torre Parejas y los Dados del Placer son físicos y te llegan a tu puerta. Emparejados y las dos guías son digitales: los usas desde el celular, y Emparejados además incluye el PDF para imprimirlo y jugarlo en físico si prefieren.",
    },
    {
      q: "¿Cómo recibo los productos digitales?",
      a: "Dentro de la misma caja, en tarjetas con código QR: una para Emparejados y una para cada guía. Escaneas, descargas y ya son tuyas para siempre.",
    },
    {
      q: "¿Tengo que instalar alguna aplicación para Emparejados?",
      a: "No. Se abre desde el navegador del celular, tablet o computadora. Entras con tu correo y tu clave y ya está funcionando. También puedes guardarlo en tu dispositivo para jugarlo sin conexión.",
    },
    {
      q: "¿Puedo jugar Emparejados en físico, con cartas de verdad?",
      a: "Sí. Tu compra incluye el PDF imprimible de las 72 cartas: frente y dorso, 9 cartas por hoja A4, listo para imprimir y cortar en casa. Funciona en papel normal, aunque en cartulina quedan mejor.",
    },
    {
      q: "¿El envío está incluido?",
      a: "Sí. Los $35 ya incluyen el envío a todo Ecuador continental, y llega en 2 a 4 días hábiles. Si estás en Galápagos, escríbenos por WhatsApp antes de pedir para coordinar el envío.",
    },
    {
      q: "¿Tengo que pagar algo por adelantado?",
      a: "No. Pagas los $35 completos en efectivo cuando el paquete llega a tu puerta. Para confirmar el pedido solo te llevamos a WhatsApp con el mensaje ya escrito: lo envías y listo.",
    },
    {
      q: "¿Hasta cuándo recibo las dos guías gratis?",
      a: "Las dos guías van de regalo mientras dure la promo de lanzamiento. Cuando se termina, el combo sigue existiendo pero sin los bonos.",
    },
    {
      q: "¿Llega en empaque discreto?",
      a: "Sí. El paquete llega sellado y sin ninguna referencia al contenido por fuera. Nadie sabe qué hay adentro más que ustedes.",
    },
    {
      q: "¿De qué material es la torre? ¿Se arruina si le cae trago encima?",
      a: "Madera de pino 100% premium, lijada y sellada. Se puede mojar y no se daña ni se borra el texto de los bloques. Es un juego de shots: está hecha para eso.",
    },
  ];

  const CtaButton = ({
    children,
    className = "",
    variant = "rosa",
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: "rosa" | "blanco" | "oro";
  }) => {
    // Los gradientes van en `style` y no como clase arbitraria de Tailwind:
    // el JIT solo compila clases que existan literales en el código, así que
    // un `bg-[...${variable}...]` armado en runtime nunca genera CSS.
    const base =
      "w-full h-auto whitespace-normal font-bold rounded-2xl py-5 text-base leading-tight sm:text-lg shadow-xl transition-transform duration-200 ease-out hover:brightness-110 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";
    const skins: Record<string, { className: string; style: React.CSSProperties }> = {
      rosa: {
        className: "text-white",
        style: { background: `linear-gradient(100deg, ${ROSA}, ${ROSA_FUERTE})` },
      },
      blanco: { className: "text-[#12060c]", style: { background: "#ffffff" } },
      oro: {
        className: "text-[#1a1206]",
        style: { background: `linear-gradient(100deg, ${ORO}, #ffdd85)` },
      },
    };
    return (
      <Button
        onClick={handleBuyClick}
        size="lg"
        className={`${base} ${skins[variant].className} ${className}`}
        style={skins[variant].style}
      >
        <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
        <span>{children}</span>
      </Button>
    );
  };

  return (
    <div
      className="dark min-h-screen bg-background text-foreground pb-28 md:pb-0"
      style={themeVars}
    >
      <Seo
        title="Combo Parejas 🔥 3 juegos + 2 guías por $35 | ShotyGames Ecuador"
        description="Torre Parejas + Dados del Placer + Emparejados digital, y esta semana 2 guías digitales de regalo. Todo por $35 con envío incluido. Pagas en efectivo al recibir."
        canonical="https://www.shotygames.com/landing/combo-parejas"
        image={`https://www.shotygames.com${comboFlatlay}`}
        type="product"
      />

      {/* ---------------- BARRA SUPERIOR STICKY (urgencia) ---------------- */}
      <div
        className="fixed top-0 left-0 right-0 z-50 text-white text-center px-3 py-1.5 md:py-2.5"
        style={{ background: `linear-gradient(90deg, ${ROSA}, ${ROSA_FUERTE})` }}
      >
        {/* Dos redacciones: la corta cabe en una línea a 360px, la larga entra
            desde sm. Si la barra se parte en 2 líneas se come el alto útil del
            hero en móvil, que es justo donde se decide la venta. */}
        <p className="text-[11.5px] leading-tight md:text-sm font-semibold tracking-wide">
          🔥 <span className="sm:hidden">LANZAMIENTO: 2 guías digitales <span className="font-extrabold">GRATIS</span></span>
          <span className="hidden sm:inline">
            PROMO DE LANZAMIENTO: llévate 2 guías digitales <span className="font-extrabold">GRATIS</span> hoy
          </span>
        </p>
      </div>
      <div className="h-8 md:h-11" />

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        {/* Glow controlado detrás del hero, sin costo de render (gradiente plano) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-[420px]"
          style={{
            background: `radial-gradient(60% 55% at 50% 0%, ${ROSA}33 0%, transparent 70%)`,
          }}
        />

        <div className="container relative mx-auto px-5 pt-4 pb-10 md:pt-12 md:pb-16">
          <div className="mx-auto max-w-5xl">
            {/*
              Orden en móvil (flujo natural del grid): titular → composición del
              combo → precio y CTA. El titular tiene que leerse antes que las
              fotos; si las fotos van primero se comen la pantalla completa y la
              oferta queda bajo el fold.
              En desktop: columna izquierda titular + precio, columna derecha las
              fotos ocupando las dos filas.
            */}
            <div className="grid gap-5 md:grid-cols-2 md:items-center md:gap-x-12 md:gap-y-6">
              {/* Copy */}
              <div className="text-center md:col-start-1 md:row-start-1 md:text-left">
                <div
                  className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] md:text-xs"
                  style={{ borderColor: `${ROSA}66`, background: `${ROSA}1a`, color: "#ffb4cd" }}
                >
                  🔥 Nuevo combo para parejas
                </div>

                <h1 className="font-display text-[27px] font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-[44px]">
                  TODO PARA UNA
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: `linear-gradient(100deg, ${ROSA}, #ff5c8a)` }}
                  >
                    NOCHE DIFERENTE
                  </span>
                  <br />
                  EN PAREJA 🔥
                </h1>

                <p className="mx-auto mt-2.5 max-w-md text-[13.5px] leading-snug text-muted-foreground md:mx-0 md:mt-4 md:text-lg">
                  Torre Parejas + Dados del Placer + Emparejados digital
                  <span className="text-foreground font-semibold"> + 2 guías digitales GRATIS hoy.</span>
                </p>
              </div>

              {/* Composición del combo con assets reales */}
              <div className="md:col-start-2 md:row-span-2 md:row-start-1">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Una sola foto con TODO el combo pesa más que tres tiles
                      sueltos: es lo que hace pensar "me llevo un montón de
                      cosas" en los primeros segundos. */}
                  <ComboTile
                    src={comboFlatlay}
                    alt="Pareja jugando el Combo Parejas: caja de la Torre Parejas, Dados del Placer y cartas de Emparejados sobre la mesa"
                    label="Todo lo que incluye"
                    tag="3 juegos + 2 guías"
                    className="col-span-2 aspect-square"
                    priority
                  />

                  {/* Los bonos no van como un producto más: franja aparte, en
                      dorado, para que se lean como regalo y no como relleno. */}
                  <div
                    className="col-span-2 flex items-center gap-3 rounded-2xl border px-3 py-2"
                    style={{ borderColor: `${ORO}59`, background: `${ORO}12` }}
                  >
                    <div className="flex shrink-0 gap-1.5">
                      <img
                        src={guia30Posiciones}
                        alt="Portada de la Guía 30 Posiciones para parejas"
                        loading="lazy"
                        decoding="async"
                        className="h-[58px] w-[39px] rounded-md object-cover md:h-[68px] md:w-[46px]"
                      />
                      <img
                        src={guiaPlacer}
                        alt="Portada de la Guía Digital del Placer"
                        loading="lazy"
                        decoding="async"
                        className="h-[58px] w-[39px] rounded-md object-cover md:h-[68px] md:w-[46px]"
                      />
                    </div>
                    <div className="min-w-0 text-left">
                      <p
                        className="text-[10px] font-extrabold uppercase tracking-[0.14em]"
                        style={{ color: ORO }}
                      >
                        🎁 De regalo hoy
                      </p>
                      <p className="mt-0.5 text-[12.5px] font-bold leading-tight md:text-sm">
                        Guía 30 Posiciones + Guía del Placer
                      </p>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        2 guías digitales, gratis con tu combo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precio + CTA */}
              <div className="text-center md:col-start-1 md:row-start-2 md:text-left">
                <div className="flex flex-col items-center gap-1 md:items-start">
                  <div className="flex items-end gap-3">
                    <span className="font-display text-[56px] font-extrabold leading-none tracking-tight md:text-7xl">
                      $35
                    </span>
                    <span className="mb-2 text-sm font-semibold text-muted-foreground">
                      todo el combo
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#ffb4cd" }}>
                    <Truck className="h-4 w-4" /> Envío incluido a todo Ecuador
                  </p>
                  <p className="text-xs text-muted-foreground">Pagas en efectivo al recibir</p>
                </div>

                {/* Prueba social temprana: gana confianza antes de pedir el
                    primer clic. "ShotyGames" y no "con este combo" a propósito
                    — el combo es nuevo, los 3.500 son de la marca, no de este
                    producto puntual. */}
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground md:justify-start">
                  <Star className="h-3.5 w-3.5" style={{ fill: ROSA, color: ROSA }} />
                  +3.500 clientes ShotyGames en Ecuador
                </p>

                <div className="mx-auto mt-4 max-w-sm md:mx-0">
                  <CtaButton className="text-lg">QUIERO MI COMBO 🔥</CtaButton>
                </div>

                {/* Microbeneficios de confianza */}
                <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground md:justify-start md:text-xs">
                  {["Envíos a todo Ecuador", "Productos físicos + digitales", "Compra directa con ShotyGames"].map(
                    (t) => (
                      <li key={t} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: ROSA }} />
                        {t}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CONCEPTO ---------------- */}
      <section className="border-y border-border/60 bg-[#0d0509] py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-4xl">
              UNA NOCHE. 3 JUEGOS.
              <br className="sm:hidden" />{" "}
              <span style={{ color: ROSA }}>CERO RUTINA.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-lg">
              Empiecen suave, dejen que el juego decida qué sigue y vean hasta dónde llega la noche.
            </p>

            <div className="mt-9 grid grid-cols-3 gap-2.5 md:gap-5">
              {[
                { img: torreVelas, t: "Torre Parejas", fit: "object-cover" },
                { img: dadosPlacer, t: "Dados del Placer", fit: "object-cover" },
                { img: emparejadosImpresasMesa, t: "Emparejados", fit: "object-cover" },
              ].map((p, i) => (
                <div key={p.t} className="relative">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <img
                      src={p.img}
                      alt={p.t}
                      loading="lazy"
                      decoding="async"
                      className={`aspect-square w-full ${p.fit}`}
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold leading-tight md:text-sm">{p.t}</p>
                  {i < 2 && (
                    <span
                      aria-hidden
                      className="absolute -right-[7px] top-[30%] z-10 text-lg font-bold md:-right-3 md:text-2xl"
                      style={{ color: ROSA }}
                    >
                      ›
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- TODO LO QUE RECIBES ---------------- */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-4xl">
              TODO ESTO INCLUYE TU COMBO 👇
            </h2>

            <div className="mt-8 space-y-4 md:mt-12 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
              <ProductoCard
                badge="Físico"
                titulo="Torre Parejas"
                desc="51 bloques con retos + 1 vaso tequilero incluido."
                img={torreJugando}
                alt="Pareja sacando un bloque de la Torre de Shots Parejas"
              />
              <ProductoCard
                badge="Físico"
                titulo="Dados del Placer"
                desc="4 dados — Acción, Zona, Tiempo e Intensidad — deciden qué sigue."
                img={dadosPlacer}
                alt="Dados del Placer de madera con las caras MORDER, NALGAS y LENTO"
              />
              <ProductoCard
                badge="Digital + PDF"
                titulo="Emparejados"
                desc="72 cartas: las juegan desde el celular o imprimen el PDF y las cortan en casa."
                img={emparejadosImpresasCortando}
                alt="Hoja del PDF imprimible de Emparejados siendo cortada en cartas físicas"
                extra="Incluye el PDF listo para imprimir — frente y dorso, 9 cartas por hoja A4."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- COMPARACIÓN DE VALOR ---------------- */}
      {/* Precios reales de cada producto por separado (confirmados por
          Fabián, no listados en ningún catálogo público porque Dados del
          Placer y Emparejados se venden sobre todo como upsell/combo):
          Torre Parejas $29.99 (incluye el vaso), Dados del Placer $15,
          Emparejados $6.90. Las 2 guías quedaron fuera de catálogo — son
          bonus puro, por eso no se les pone precio acá. */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div
            className="mx-auto max-w-xl rounded-3xl border p-6 md:p-8"
            style={{
              borderColor: `${ROSA}40`,
              background: "linear-gradient(170deg, #180a12 0%, #12070d 100%)",
            }}
          >
            <h2 className="text-center font-display text-[22px] font-extrabold leading-tight tracking-tight md:text-3xl">
              SI LOS COMPRARAS POR SEPARADO...
            </h2>

            <ul className="mt-6 space-y-2.5">
              {[
                { t: "Torre Parejas", p: "$29.99" },
                { t: "Dados del Placer", p: "$15" },
                { t: "Emparejados", p: "$6.90" },
              ].map((item) => (
                <li key={item.t} className="flex items-center justify-between text-[15px] md:text-lg">
                  <span className="text-muted-foreground">{item.t}</span>
                  <span className="font-semibold">{item.p}</span>
                </li>
              ))}
            </ul>

            <div className="my-4 h-px bg-border" />

            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold md:text-lg">Total por separado</span>
              <span className="text-[15px] font-semibold line-through text-muted-foreground md:text-lg">
                $51.89
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
                En el combo pagas
              </span>
              <span className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">$35</span>
            </div>

            <div
              className="mt-4 rounded-xl border px-4 py-2.5 text-center text-sm font-extrabold uppercase tracking-wide md:text-base"
              style={{ borderColor: `${ORO}59`, background: `${ORO}1a`, color: ORO }}
            >
              Ahorras $16.89 🔥
            </div>

            <p className="mt-4 text-center text-[12px] text-muted-foreground md:text-sm">
              Y las 2 guías digitales van de regalo, aparte — no están incluidas en esta cuenta.
            </p>

            <div className="mx-auto mt-5 max-w-sm">
              <CtaButton>QUIERO MI COMBO 🔥</CtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- BONOS ---------------- */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 50% at 50% 50%, ${ORO}1f 0%, transparent 72%)`,
          }}
        />
        <div className="container relative mx-auto px-5">
          <div
            className="mx-auto max-w-3xl rounded-3xl border p-6 md:p-10"
            style={{
              borderColor: `${ORO}59`,
              background: "linear-gradient(165deg, #1a1208 0%, #150a10 55%, #12070d 100%)",
              boxShadow: `0 0 60px ${ORO}1a`,
            }}
          >
            <div className="text-center">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]"
                style={{ background: `${ORO}26`, color: ORO, border: `1px solid ${ORO}59` }}
              >
                <Gift className="h-3.5 w-3.5" /> Bonos de lanzamiento
              </span>
              <h2 className="mx-auto mt-4 max-w-md font-display text-[24px] font-extrabold leading-tight tracking-tight sm:text-4xl">
                🎁 Y ESTA SEMANA TE REGALAMOS 2 BONOS
              </h2>
              <p className="mt-3 text-[15px] text-muted-foreground md:text-lg">
                Pide tu combo ahora y también recibes:
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4 md:gap-6">
              {[
                {
                  n: "BONO #1",
                  t: "Guía 30 Posiciones",
                  sub: "Guía digital de 30 posiciones para parejas",
                  img: guia30Posiciones,
                  alt: "Portada de la Guía 30 Posiciones para parejas",
                },
                {
                  n: "BONO #2",
                  t: "Guía del Placer",
                  sub: "Ideas y experiencias para encender la pasión",
                  img: guiaPlacer,
                  alt: "Portada de la Guía Digital del Placer",
                },
              ].map((b) => (
                <div key={b.n} className="text-center">
                  <p
                    className="mb-2 text-[11px] font-extrabold tracking-[0.14em] md:text-xs"
                    style={{ color: ORO }}
                  >
                    {b.n}
                  </p>
                  <div
                    className="overflow-hidden rounded-2xl border"
                    style={{ borderColor: `${ORO}40`, background: "#120a10" }}
                  >
                    <img
                      src={b.img}
                      alt={b.alt}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[2/3] w-full object-contain p-2"
                    />
                  </div>
                  <p className="mt-2.5 text-sm font-bold leading-tight md:text-base">{b.t}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground md:text-sm">{b.sub}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[13px] text-muted-foreground md:text-base">
              Los recibes en formato digital junto con tu compra.
            </p>

            <div className="mt-5 text-center">
              <span
                className="inline-block rounded-xl px-5 py-2 font-display text-lg font-extrabold tracking-tight md:text-2xl"
                style={{ background: `${ORO}1f`, color: ORO, border: `1px solid ${ORO}59` }}
              >
                GRATIS CON TU COMBO
              </span>
            </div>

            <div className="mx-auto mt-6 max-w-sm">
              <CtaButton variant="oro">QUIERO LOS 2 BONOS GRATIS 🔥</CtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- EXPERIENCIA ---------------- */}
      <section className="border-y border-border/60 bg-[#0d0509] py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-4xl">
              ¿CÓMO EMPIEZA LA NOCHE?
            </h2>

            <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
              {[
                {
                  n: "01",
                  t: "Empiecen con la Torre",
                  d: "Sacan un bloque y cumplen el reto.",
                  img: torreJugando,
                  alt: "Pareja sacando un bloque de la Torre Parejas",
                },
                {
                  n: "02",
                  t: "Suban el nivel con los Dados",
                  d: "El azar decide la siguiente jugada.",
                  img: dadosPlacer,
                  alt: "Dados del Placer sobre tela roja",
                },
                {
                  n: "03",
                  t: "Terminen con Emparejados",
                  d: "Desde el celular o con las cartas impresas — siguen jugando.",
                  img: emparejadosImpresasMano,
                  alt: "Carta de Emparejados impresa, sostenida en la mano junto a una vela",
                  contain: false,
                },
              ].map((s) => (
                <Card
                  key={s.n}
                  className="overflow-hidden border-border bg-card/80"
                >
                  <div className="flex items-center gap-4 p-4 md:flex-col md:items-start md:p-5">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl md:h-40 md:w-full">
                      <img
                        src={s.img}
                        alt={s.alt}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full ${s.contain ? "object-contain bg-black" : "object-cover"}`}
                      />
                    </div>
                    <div>
                      <span
                        className="font-display text-xl font-extrabold tracking-tight md:text-2xl"
                        style={{ color: ROSA }}
                      >
                        {s.n}
                      </span>
                      <h3 className="mt-0.5 text-base font-bold leading-tight md:text-lg">{s.t}</h3>
                      <p className="mt-1 text-[13px] leading-snug text-muted-foreground md:text-sm">
                        {s.d}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- POR QUÉ UN COMBO ---------------- */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-[26px] font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              NO ES UN SOLO JUEGO.
              <br />
              <span style={{ color: ROSA }}>SON 3 FORMAS DIFERENTES DE JUGAR JUNTOS.</span>
            </h2>

            <div className="mt-8 grid gap-3 text-left md:mt-10 md:grid-cols-3 md:gap-5">
              {[
                "Si se cansan de uno, cambian al siguiente.",
                "Tres dinámicas distintas en una sola compra.",
                "Pueden volver a jugarlos sin que todas las noches sean iguales.",
              ].map((t) => (
                <Card key={t} className="border-border bg-card/80 p-4 md:p-5">
                  <CheckCircle2 className="mb-2 h-5 w-5" style={{ color: ROSA }} />
                  <p className="text-sm leading-snug md:text-base">{t}</p>
                </Card>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-3xl border border-border bg-card md:mt-10">
              <img
                src={comboMesa}
                alt="Pareja jugando con la Torre Parejas, los Dados del Placer y las cartas de Emparejados sobre la mesa"
                loading="lazy"
                decoding="async"
                width={1254}
                height={1254}
                className="w-full object-cover"
              />
            </div>

            <div className="mx-auto mt-8 max-w-sm">
              <CtaButton>QUIERO MI COMBO 🔥</CtaButton>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- PRUEBA SOCIAL ---------------- */}
      <section className="border-y border-border/60 bg-[#0d0509] py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div className="mb-7 text-center">
            <div className="mb-3 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5" style={{ fill: ROSA, color: ROSA }} />
              ))}
            </div>
            <h2 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-4xl">
              +3.500 clientes en Ecuador
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              👉 Desliza para ver reseñas reales
            </p>
          </div>

          <Carousel opts={{ align: "start", loop: true }} className="mx-auto w-full max-w-5xl">
            <CarouselContent className="-ml-3">
              {testimonios.map((t, i) => (
                <CarouselItem key={i} className="basis-[72%] pl-3 sm:basis-1/2 lg:basis-1/3">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border">
                    <img
                      src={t.img}
                      alt={t.alt}
                      width={945}
                      height={1181}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-5 flex justify-center gap-4">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* ---------------- VALUE STACK / OFERTA ---------------- */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div
            className="mx-auto max-w-2xl rounded-3xl border p-6 md:p-10"
            style={{
              borderColor: `${ROSA}59`,
              background: "linear-gradient(170deg, #1c0a14 0%, #14070e 100%)",
              boxShadow: `0 0 70px ${ROSA}1f`,
            }}
          >
            <h2 className="text-center font-display text-[22px] font-extrabold tracking-tight md:text-3xl">
              TU COMBO INCLUYE:
            </h2>

            <ul className="mt-6 space-y-3.5">
              {[
                { icon: "check", t: "Torre Parejas", s: "51 bloques con retos + vaso tequilero · físico" },
                { icon: "check", t: "Dados del Placer", s: "4 dados: Acción + Zona + Tiempo + Intensidad · físico" },
                { icon: "check", t: "Emparejados", s: "72 cartas: digital o impresas (PDF incluido)" },
                { icon: "gift", t: "Guía 30 Posiciones", s: "GRATIS con la promo" },
                { icon: "gift", t: "Guía Digital del Placer", s: "GRATIS con la promo" },
                { icon: "truck", t: "Envío incluido", s: "A todo Ecuador continental" },
              ].map((item) => (
                <li key={item.t} className="flex items-start gap-3">
                  {item.icon === "gift" ? (
                    <Gift className="mt-0.5 h-5 w-5 shrink-0" style={{ color: ORO }} />
                  ) : item.icon === "truck" ? (
                    <Truck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: ROSA }} />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: ROSA }} />
                  )}
                  <div>
                    <p className="text-[15px] font-bold leading-tight md:text-lg">{item.t}</p>
                    <p
                      className="text-xs leading-snug md:text-sm"
                      style={{ color: item.icon === "gift" ? ORO : undefined }}
                    >
                      <span className={item.icon === "gift" ? "" : "text-muted-foreground"}>{item.s}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="my-7 h-px bg-border" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Todo por</p>
              <p className="font-display text-[64px] font-extrabold leading-none tracking-tight md:text-8xl">
                $35
              </p>
              <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: "#ffb4cd" }}>
                <Truck className="h-4 w-4" /> Envío incluido
              </p>
            </div>

            <p
              className="mt-5 rounded-xl border p-3 text-center text-[12px] leading-snug md:text-sm"
              style={{ borderColor: `${ORO}40`, background: `${ORO}12`, color: "#f7dfa8" }}
            >
              Las 2 guías son <strong>GRATIS</strong> únicamente durante la promo de lanzamiento de esta semana.
            </p>

            {/* Cómo llega lo digital con contraentrega. El beneficio de pagar
                por adelantado (5% OFF, envío prioritario y lo digital al toque
                por WhatsApp) NO se menciona acá: vive solo en el checkout, para
                que la landing tenga una sola promesa y no divida la decisión. */}
            <div
              className="mt-3 flex items-start gap-2.5 rounded-xl border p-3 text-left text-[12px] leading-snug md:text-sm"
              style={{ borderColor: `${ROSA}40`, background: `${ROSA}12`, color: "#ffc9dc" }}
            >
              <Zap className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ROSA }} />
              <span>
                <strong className="text-foreground">Lo digital viene en la caja.</strong> Emparejados y las 2
                guías llegan en tarjetas con código QR: escaneas, descargas y ya son tuyas para siempre.
              </span>
            </div>

            <div className="mt-5">
              <CtaButton className="text-base sm:text-xl">QUIERO MI COMBO POR $35 🔥</CtaButton>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground md:text-sm">
                <Wallet className="h-4 w-4" /> Pagas en efectivo al recibir
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="border-t border-border/60 py-12 md:py-20">
        <div className="container mx-auto px-5">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-[26px] font-extrabold tracking-tight sm:text-4xl">
              PREGUNTAS FRECUENTES
            </h2>
            <Accordion type="single" collapsible className="mt-7 w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-[15px] font-semibold md:text-lg">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[14px] leading-relaxed text-muted-foreground md:text-base">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(65% 60% at 50% 40%, ${ROSA}2e 0%, transparent 72%)` }}
        />
        <div className="container relative mx-auto px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-[27px] font-extrabold leading-[1.12] tracking-tight sm:text-4xl">
              LA PRÓXIMA NOCHE NO TIENE QUE SER COMO TODAS 🔥
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground md:text-lg">
              Tres juegos, dos regalos y todo listo para jugar juntos.
            </p>

            <div className="mx-auto mt-7 max-w-sm overflow-hidden rounded-3xl border border-border bg-card">
              <img
                src={comboCercano}
                alt="Pareja sonriendo mientras juega con las cartas del Combo Parejas"
                loading="lazy"
                decoding="async"
                width={1254}
                height={1254}
                className="w-full object-cover"
              />
            </div>

            <p className="mt-7 font-display text-[52px] font-extrabold leading-none tracking-tight md:text-7xl">
              $35
            </p>
            <p className="mt-1.5 flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: "#ffb4cd" }}>
              <Truck className="h-4 w-4" /> Envío incluido
            </p>

            <div className="mx-auto mt-6 max-w-sm">
              <CtaButton>QUIERO MI COMBO PAREJAS</CtaButton>
              <p className="mt-3 text-xs text-muted-foreground md:text-sm">Pagas en efectivo al recibir.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ---------------- CTA STICKY MÓVIL ---------------- */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-[#12070d]/95 backdrop-blur-md transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[11px] leading-tight text-muted-foreground">Combo Parejas</p>
            <p className="font-display text-xl font-extrabold leading-none tracking-tight">$35</p>
          </div>
          <Button
            onClick={handleBuyClick}
            className="ml-auto h-11 shrink-0 rounded-xl px-5 text-sm font-bold text-white shadow-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none"
            style={{ background: `linear-gradient(100deg, ${ROSA}, ${ROSA_FUERTE})` }}
          >
            LO QUIERO 🔥
          </Button>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
        productPrice={productPrice}
        productImage={comboFlatlay}
        productId="comboParejas"
        isCombo
        comboIncludes={[
          "Torre Parejas + 1 vaso tequilero",
          "Dados del Placer — 4 dados: Acción, Zona, Tiempo e Intensidad",
          "Emparejados — 72 cartas (digital + PDF imprimible)",
          "🎁 Guía 30 Posiciones — GRATIS por la promo",
          "🎁 Guía Digital del Placer — GRATIS por la promo",
        ]}
        originalPrice={49.9}
        upsells={[
          { id: "torreNormal", name: "Torre La Previa (para grupos)", price: 10, image: torreNormalUpsellThumb },
          { id: "torrePicante", name: "Torre Picante (para grupos)", price: 10, image: torrePicanteUpsellThumb },
        ]}
      />
    </div>
  );
};

/** Tile del hero: imagen + etiqueta del producto. */
const ComboTile = ({
  src,
  alt,
  label,
  tag,
  className = "",
  imgClassName = "object-cover",
  priority = false,
}: {
  src: string;
  alt: string;
  label: string;
  tag: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) => (
  <div className={`relative overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      /* React 18 no reconoce `fetchPriority` en camelCase (avisa en consola y
         no lo emite): va en minúsculas por spread para que sí llegue al DOM. */
      {...(priority ? { fetchpriority: "high" } : {})}
      className={`h-full w-full ${imgClassName}`}
    />
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-1.5 pt-6">
      <p className="text-[11px] font-bold leading-tight text-white md:text-sm">{label}</p>
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] md:text-[10px]" style={{ color: "#ff9ec0" }}>
        {tag}
      </p>
    </div>
  </div>
);

/** Card de producto de la sección "todo lo que recibes". */
const ProductoCard = ({
  badge,
  titulo,
  desc,
  img,
  alt,
  phone = false,
  extra,
}: {
  badge: string;
  titulo: string;
  desc: string;
  img: string;
  alt: string;
  phone?: boolean;
  extra?: string;
}) => (
  <Card className="overflow-hidden border-border bg-card/80">
    {phone ? (
      <div className="flex items-center justify-center bg-[#0d0509] px-4 py-6">
        {/* Mockup simple de teléfono con captura real del juego */}
        <div className="w-[150px] overflow-hidden rounded-[1.6rem] border-[5px] border-[#2a2a2e] bg-black shadow-2xl">
          <img
            src={img}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="block w-full"
          />
        </div>
      </div>
    ) : (
      <img
        src={img}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="aspect-[4/3] w-full object-cover md:aspect-square"
      />
    )}
    <div className="p-5">
      <Badge
        className="mb-2.5 border-none text-[10px] font-extrabold uppercase tracking-[0.14em]"
        style={
          badge === "Digital"
            ? { background: "#2a1b33", color: "#c9a6ff" }
            : { background: `${ROSA}26`, color: "#ff9ec0" }
        }
      >
        {badge === "Digital" ? (
          <Smartphone className="mr-1 h-3 w-3" />
        ) : (
          <Package className="mr-1 h-3 w-3" />
        )}
        {badge}
      </Badge>
      <h3 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">{titulo}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">{desc}</p>
      {extra && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[12px] font-semibold" style={{ color: "#ff9ec0" }}>
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {extra}
        </p>
      )}
    </div>
  </Card>
);

export default ComboParejasLanding;
