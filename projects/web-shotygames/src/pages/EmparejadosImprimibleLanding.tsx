import { useState, useEffect, useRef } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ShoppingCart, Printer, Gift, Smartphone, Scissors, FileDown, Download,
  Infinity as InfinityIcon, Check, ArrowDown, Lock, Clock, Star, RotateCcw,
} from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";
import demoVideo from "@/assets/emparejados-demo.mp4";
import heroImage from "@/assets/emparejados-hero-imprimible.jpg";
import flatlayImage from "@/assets/emparejados-flatlay.jpg";
import portadaImage from "@/assets/emparejados-portada.jpg";
import conexionImage from "@/assets/emparejados-conexion.jpg";
import deseoImage from "@/assets/emparejados-deseo.jpg";
import diversionImage from "@/assets/emparejados-diversion.jpg";
import ebookImage from "@/assets/ebook-30-posiciones.webp";
import appBarajea from "@/assets/emparejados-app-barajea.webp";
import appGuia from "@/assets/emparejados-app-guia.webp";
import impresasMesa from "@/assets/emparejados-impresas-mesa.jpg";
import realProblema from "@/assets/emparejados-real-problema.jpg";
import realCambioRitmo from "@/assets/emparejados-real-cambio-ritmo.jpg";
import realPaso1 from "@/assets/emparejados-real-paso1.jpg";
import realPaso2 from "@/assets/emparejados-real-paso2.jpg";
import realPaso3 from "@/assets/emparejados-real-paso3.jpg";
import realPaso4 from "@/assets/emparejados-real-paso4.jpg";
import realDigitalCartas from "@/assets/emparejados-real-digital-cartas.jpg";
import realDigitalCelular from "@/assets/emparejados-real-digital-celular.jpg";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";
import testimonial4 from "@/assets/testimonial-4.jpg";
import testimonial5 from "@/assets/testimonial-5.jpg";
import testimonial6 from "@/assets/testimonial-6.jpg";
import torreNormalImg from "@/assets/torre-normal-brillo.webp";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import torreParejasImg from "@/assets/torre-parejas.jpg";
import dadosDelPlacerImg from "@/assets/dados-del-placer.webp";

/*
  EMPAREJADOS — "IMPRIMIBLE" (variante de posicionamiento)
  ─────────────────────────────────────────────────────────
  V2 vende esto como juego digital que también se puede imprimir.
  Esta variante invierte la jerarquía a propósito: se vende como un mazo de
  72 cartas imprimibles, y la versión digital aparece después como el gran
  bono adicional. Mismo producto, mismo precio, mismo checkout — solo cambia
  el orden en que se cuenta la historia. Sirve para comparar conversión
  contra V2 en Meta Ads.

  RESEÑAS ESPECÍFICAS DE EMPAREJADOS — vacío a propósito, igual que en V1/V2.
  No hay capturas reales de gente hablando puntualmente de Emparejados todavía
  (solo de productos físicos). No inventar. Se activa sola en cuanto el array
  tenga elementos reales.
*/
const resenasEmparejados: { img: string; alt: string }[] = [];

/* Único lugar donde vive el precio. Debe coincidir con lo que carga el CheckoutModal. */
const PRECIO = 6.90;
const PRECIO_ANTES = 15.00;
const VALOR_GUIA = 4.90;

const CATEGORIAS = [
  {
    emoji: "💗",
    nombre: "CONEXIÓN",
    color: "#d63384",
    img: conexionImage,
    desc: "Preguntas para hablar de cosas que normalmente no salen en una conversación cualquiera.",
    ejemplo: "Dile una fantasía romántica que aún no hayas vivido.",
  },
  {
    emoji: "🔥",
    nombre: "DESEO",
    color: "#8B1538",
    img: deseoImage,
    desc: "Retos para subir la temperatura sin que todo dependa de quién se atreve a proponer primero.",
    ejemplo: "Dale tres besos lentos donde tú quieras.",
  },
  {
    emoji: "🎯",
    nombre: "DIVERSIÓN",
    color: "#0077b6",
    img: diversionImage,
    desc: "Dinámicas para reírse, romper el hielo y hacer algo diferente juntos.",
    ejemplo: "Elige una canción y tu pareja deberá bailarla.",
  },
];

const PASOS_IMPRIMIR = [
  {
    n: "1",
    t: "Recibes el PDF",
    d: "Las 72 cartas listas para imprimir, frente y dorso.",
    icon: FileDown,
    img: realPaso1,
    alt: "El PDF de Emparejados abierto en la laptop, con las cartas listas para imprimir",
  },
  {
    n: "2",
    t: "Lo imprimes",
    d: "En casa o en cualquier centro de impresión. 9 cartas por hoja A4.",
    icon: Printer,
    img: realPaso2,
    alt: "Hoja A4 con las cartas de Emparejados recién impresas, saliendo de la impresora",
  },
  {
    n: "3",
    t: "Recortas",
    d: "Y arman su propio mazo, carta por carta.",
    icon: Scissors,
    img: realPaso3,
    alt: "Recortando las cartas de Emparejados con tijera siguiendo las líneas de la hoja impresa",
  },
  {
    n: "4",
    t: "Juegan",
    d: "Sacan la primera carta y empiezan.",
    icon: Check,
    img: realPaso4,
    alt: "El mazo de Emparejados ya armado, con una carta de Conexión en la mano, lista para jugar",
  },
];

const EmparejadosImprimibleLanding = () => {
  const productName = "Emparejados";
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();
  const digitalRef = useRef<HTMLElement>(null);

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
        content_category: "Juegos Imprimibles",
        value: PRECIO,
        currency: "USD",
      });
    }
  }, []);

  /* Todos los CTA de la página pasan por acá: mismo evento, misma acción. */
  const handleBuyClick = () => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: productName,
        content_category: "Juegos Imprimibles",
        value: PRECIO,
        currency: "USD",
      });
    }
    setCheckoutOpen(true);
  };

  const scrollToDigital = () => digitalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const Precio = ({ className = "" }: { className?: string }) => (
    <span className={className}>${PRECIO.toFixed(2)}</span>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Seo
        title="Emparejados — 72 cartas imprimibles para parejas | ShotyGames Ecuador"
        description={`72 cartas de Conexión, Deseo y Diversión listas para imprimir hoy. También incluye la versión digital y, comprando hoy, la Guía de 30 Posiciones gratis. $${PRECIO.toFixed(2)}, pago único.`}
        canonical="https://www.shotygames.com/landing/emparejados-imprimible"
        image={`https://www.shotygames.com${heroImage}`}
        type="product"
      />

      {/* ── Barra superior (no sticky: se va con el scroll) ─────────── */}
      <div className="bg-foreground text-background py-2 px-3">
        <div className="flex items-center justify-center gap-x-4 gap-y-0.5 flex-wrap text-[0.7rem] sm:text-xs font-medium tracking-wide text-center">
          <span>🖨 72 cartas imprimibles</span>
          <span className="opacity-40">·</span>
          <span>📱 Digital incluido</span>
          <span className="opacity-40">·</span>
          <span>🎁 Guía de 30 Posiciones GRATIS hoy</span>
        </div>
      </div>

      {/* ── 1. HERO ──────────────────────────────────────────────────
          Todo el posicionamiento tiene que quedar claro en 5 segundos:
          72 cartas imprimibles. La foto manda: cartas en primer plano,
          pareja detrás, celular chico al lado. En ese orden. */}
      <section className="px-4 pt-4 pb-8 md:pt-12 md:pb-14 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 md:grid-rows-[auto_auto] gap-4 md:gap-x-12 md:gap-y-5 md:items-center">
          <div className="md:col-start-2 md:row-start-1 md:self-end">
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-primary mb-1.5">
              JUEGO PARA PAREJAS · 72 CARTAS
            </p>
            <h1 className="font-display text-[1.65rem] leading-[1.12] sm:text-4xl lg:text-[3rem] lg:leading-[1.1] font-bold mb-2">
              72 cartas para imprimir hoy y hacer algo diferente esta noche.
            </h1>
            <p className="text-muted-foreground text-[0.9rem] leading-snug sm:text-lg sm:leading-relaxed">
              72 cartas de Conexión, Deseo y Diversión listas para imprimir y
              jugar. También incluye la versión digital para el celular.
            </p>
          </div>

          {/* Visual: cartas impresas en primer plano, pareja detrás, celular
              chico al lado. Es el LCP, por eso va eager y con fetchpriority alta. */}
          <div className="md:col-start-1 md:row-start-1 md:row-span-2 md:self-center">
            <div className="relative rounded-2xl overflow-hidden bg-muted shadow-2xl aspect-[4/5]">
              <img
                src={heroImage}
                alt="Cartas de Emparejados impresas (Conexión, Deseo y Diversión) en primer plano sobre la mesa, con una pareja jugando de fondo y el celular con la versión digital al lado"
                className="w-full h-full object-cover"
                width={928}
                height={1152}
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>

          <div className="md:col-start-2 md:row-start-2 md:self-start space-y-3 md:space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold">
              <span className="flex items-center gap-1.5"><Printer className="w-4 h-4 text-primary" /> 72 cartas imprimibles</span>
              <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-primary" /> Versión digital incluida</span>
            </div>
            <p className="text-sm font-semibold flex items-start gap-1.5">
              <Gift className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              Guía Digital de 30 Posiciones GRATIS comprando hoy
            </p>

            <div className="flex items-baseline gap-3">
              <span className="text-lg text-muted-foreground line-through">${PRECIO_ANTES.toFixed(2)}</span>
              <Precio className="text-4xl font-bold text-primary" />
              <span className="text-sm text-muted-foreground">pago único</span>
            </div>

            <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full md:w-auto md:px-12 text-base">
              <ShoppingCart className="mr-2 h-5 w-5" />
              QUIERO MIS 72 CARTAS
            </Button>

            <p className="text-xs text-muted-foreground">
              Sin costo de envío · Lo recibes después de confirmar tu pago · Puedes volver a imprimirlo cuando quieras
            </p>

            <p className="text-xs text-muted-foreground pt-1">
              +3.500 clientes han comprado en ShotyGames 🇪🇨
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. IDENTIFICACIÓN ────────────────────────────────────────── */}
      <section className="px-4 py-10 md:py-16 bg-muted/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-[1.6rem] sm:text-3xl md:text-4xl font-bold leading-snug mb-5">
            Quieren hacer algo juntos. Pero nadie propone nada.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-2">
            Se sientan. Hablan un rato. Agarran el celular. Buscan qué ver.
            Y otra noche termina pareciéndose a muchas otras.
          </p>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
            No necesariamente faltan ganas. A veces simplemente falta tener
            algo diferente para empezar.
          </p>

          <div className="rounded-2xl overflow-hidden shadow-lg max-w-sm mx-auto mb-6 aspect-[4/3]">
            <img
              src={realProblema}
              alt="Pareja sentada en el sofá, cada uno mirando su propio celular, sin hablarse"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p className="font-display text-xl sm:text-2xl font-bold mb-1">
            Alguien tiene que sacar la primera carta.
          </p>
          <p className="text-muted-foreground">Para eso existe Emparejados.</p>
        </div>
      </section>

      {/* ── 3+4. MOSTRAR EL PRODUCTO + LAS TRES CATEGORÍAS ────────────
          Fusionadas a propósito: título → imagen → categorías, sin espacio
          en blanco entre medio. Antes de explicar de más, que vean qué están
          comprando: muchas cartas, buen papel, cortes limpios. */}
      <section className="py-10 md:py-16 bg-muted/40">
        <div className="px-4 max-w-3xl mx-auto text-center mb-6 md:mb-8">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Este es Emparejados.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-5">
            72 cartas creadas para conversar, coquetear y divertirse juntos.
          </p>
          <div className="rounded-2xl overflow-hidden shadow-2xl aspect-square max-w-lg mx-auto">
            <img
              src={flatlayImage}
              alt="Muchas cartas de Emparejados de las categorías Conexión, Deseo y Diversión, extendidas sobre la mesa"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="px-4 max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              72 cartas. 3 tipos de momentos.
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Nunca saben cuál viene después.
            </p>
          </div>

          <div
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0 max-w-5xl md:mx-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIAS.map((c) => (
              <article
                key={c.nombre}
                className="shrink-0 w-[76vw] max-w-[300px] snap-center md:w-auto md:max-w-none bg-background rounded-2xl overflow-hidden border shadow-sm"
              >
                <div className="aspect-[3/4] bg-muted">
                  <img
                    src={c.img}
                    alt={`Carta real de la categoría ${c.nombre}, sostenida en la mano`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1.5" style={{ color: c.color }}>
                    {c.emoji} {c.nombre}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                  <blockquote
                    className="rounded-lg bg-muted/70 px-3 py-2 border-l-2 text-sm italic"
                    style={{ borderColor: c.color }}
                  >
                    "{c.ejemplo}"
                  </blockquote>
                </div>
              </article>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4 md:hidden">
            Desliza para ver las tres →
          </p>

          <p className="text-center text-muted-foreground mt-7 mb-6 max-w-md mx-auto">
            Ustedes deciden hasta dónde llegar. La carta simplemente propone.
          </p>

          <div className="text-center">
            <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full sm:w-auto sm:px-10 text-[0.8rem] sm:text-base">
              <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
              QUIERO DESCUBRIR LAS OTRAS 69
            </Button>
          </div>
        </div>
      </section>

      {/* ── 5. EL GRAN ARGUMENTO: IMPRIME, CORTA Y JUEGA ─────────────── */}
      <section className="px-4 py-14 md:py-20 max-w-5xl mx-auto">
        <div className="text-center mb-9 md:mb-12">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Lo reciben. Lo imprimen. Empiezan.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            El PDF completo viene preparado para convertir las 72 cartas en
            su propio mazo de Emparejados.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {PASOS_IMPRIMIR.map((p) => (
            <div key={p.n} className="rounded-2xl border bg-background overflow-hidden">
              <div className="aspect-square bg-muted">
                {p.img ? (
                  <img
                    src={p.img}
                    alt={p.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <FileDown className="w-8 h-8 md:w-10 md:h-10" />
                      <span className="text-[0.55rem] md:text-[0.65rem] font-bold tracking-wide">72 CARTAS.PDF</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2.5 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                  <span className="shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/10 text-primary text-[0.65rem] md:text-xs font-bold flex items-center justify-center">
                    {p.n}
                  </span>
                  <p className="font-bold leading-tight text-sm md:text-base">{p.t}</p>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{p.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 text-center">
          <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full sm:w-auto sm:px-10">
            <ShoppingCart className="mr-2 h-5 w-5" />
            QUIERO IMPRIMIR MI JUEGO
          </Button>
        </div>
      </section>

      {/* ── 6. TANGIBILIDAD / PROPIEDAD ──────────────────────────────── */}
      <section className="px-4 py-10 md:py-16 bg-muted/40">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-14 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3] order-2 md:order-1">
            <img
              src={impresasMesa}
              alt="Mazo de Emparejados ya impreso y recortado sobre la mesa"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="order-1 md:order-2 text-center md:text-left">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-snug">
              Imprímelo hoy. Y vuelve a imprimirlo cuando quieras.
            </h2>
            <ul className="text-muted-foreground text-base sm:text-lg space-y-1.5 mb-4 inline-block text-left">
              <li className="flex items-start gap-2"><RotateCcw className="w-4 h-4 text-primary mt-1.5 shrink-0" /> ¿Se dañó una carta? La vuelves a imprimir.</li>
              <li className="flex items-start gap-2"><RotateCcw className="w-4 h-4 text-primary mt-1.5 shrink-0" /> ¿Quieres armar otro mazo? Lo vuelves a imprimir.</li>
            </ul>
            <p className="font-display text-xl sm:text-2xl font-bold">
              Tu juego sigue disponible.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. CAMBIO DE RITMO (transición corta, sin producto) ──────── */}
      <section className="relative">
        <div className="relative h-[260px] sm:h-[300px] md:h-[360px] overflow-hidden">
          <img
            src={realCambioRitmo}
            alt="Pareja recostada mirándose, sosteniendo el mazo de cartas de Emparejados en abanico, complicidad y sonrisas"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="relative h-full flex flex-col justify-end px-5 pb-6 md:pb-8 max-w-3xl mx-auto text-white">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-1.5">
              Una carta cambia el plan.
            </h2>
            <p className="text-white/85 text-sm sm:text-base max-w-md leading-snug">
              Ya no tienen que pensar qué hacer. Sacan una carta y dejan que
              el juego proponga lo siguiente.
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. AHORA REVELAMOS LA VERSIÓN DIGITAL ────────────────────── */}
      {/* ── 8+9. TODO EL BLOQUE DIGITAL EN UNA SOLA SECCIÓN ───────────
          Revelación + demo real fusionadas: antes eran 2 pantallas grandes,
          ahora es una sola sección continua con menos padding. */}
      <section ref={digitalRef} className="px-4 py-10 md:py-16 bg-foreground text-background scroll-mt-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-7 md:mb-9">
            <p className="text-[0.7rem] font-bold tracking-[0.14em] text-primary mb-2">
              Y HAY OTRA FORMA DE JUGAR
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-3 max-w-xl mx-auto leading-snug">
              ¿No quieren imprimir nada hoy? Tampoco hace falta.
            </h2>
            <p className="text-background/70 max-w-lg mx-auto">
              La compra también incluye Emparejados Digital. Abren el juego
              desde el celular, barajan las cartas y empiezan directamente.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-5 md:gap-6 items-center max-w-3xl mx-auto">
            <div className="rounded-2xl overflow-hidden bg-black/30 aspect-square">
              <img
                src={realDigitalCartas}
                alt="Mazo impreso de Emparejados y una carta de Conexión en la mano"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="flex md:flex-col items-center justify-center py-1">
              <span className="font-display text-4xl md:text-5xl font-bold text-primary">+</span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/30 aspect-square">
              <img
                src={realDigitalCelular}
                alt="Emparejados Digital funcionando en el celular, con el mazo de cartas y el cronómetro en pantalla"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <p className="text-center text-xs text-background/50 mt-3 mb-6">
            IMPRIMIBLE + DIGITAL
          </p>

          <ul className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-6">
            {[
              { icon: Smartphone, t: "Juegan desde el celular" },
              { icon: RotateCcw, t: "Barajado automático" },
              { icon: Clock, t: "Cronómetro integrado cuando el reto lo necesita" },
              { icon: InfinityIcon, t: "Pueden volver a jugar" },
            ].map((v) => (
              <li key={v.t} className="flex items-center gap-2.5 rounded-xl bg-background/10 px-4 py-3 text-sm">
                <v.icon className="w-4 h-4 text-primary shrink-0" /> {v.t}
              </li>
            ))}
          </ul>

          <p className="font-display text-lg sm:text-xl md:text-2xl font-bold text-center mb-7 md:mb-9">
            Un juego. Dos formas de jugar.
          </p>

          {/* Demo real, dentro de la misma sección */}
          <div className="border-t border-background/10 pt-7 md:pt-9">
            <div className="text-center mb-6 md:mb-7">
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">
                Así se ve cuando juegan desde el celular.
              </h3>
              <p className="text-background/70 text-sm sm:text-base">
                Barajan. Sacan una carta. Cumplen el reto. Y siguen.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
              <div className="mx-auto w-full max-w-[200px] sm:max-w-[230px] rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-background/15 order-2 md:order-1">
                <video
                  src={demoVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  poster={appBarajea}
                  className="w-full h-full object-cover"
                  aria-label="Emparejados Digital funcionando en un celular: barajear, sacar una carta y cumplir el reto"
                />
              </div>

              <div className="order-1 md:order-2">
                <p className="text-background/70 text-sm sm:text-base mb-3">
                  Eso es todo lo que tienen que aprender. No hay reglas complicadas
                  ni tutoriales largos.
                </p>
                <div className="flex items-center gap-3 rounded-xl bg-background/10 p-3">
                  <img src={appGuia} alt="La Guía de 30 Posiciones se descarga desde adentro del juego" className="w-12 h-16 object-cover rounded shadow shrink-0" loading="lazy" />
                  <p className="text-xs sm:text-sm text-background/70">
                    Y desde ahí mismo descargan la Guía de 30 Posiciones que viene de regalo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 md:mt-9">
            <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full sm:w-auto sm:px-10">
              <ShoppingCart className="mr-2 h-5 w-5" />
              QUIERO LAS DOS VERSIONES
            </Button>
          </div>
        </div>
      </section>

      {/* ── 10. REGALO DE HOY ────────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20 bg-muted/40">
        <div className="max-w-4xl mx-auto rounded-3xl border-2 border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent p-6 md:p-10">
          <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
            <div className="mx-auto md:mx-0 w-[150px] md:w-[190px] shrink-0 relative">
              <img
                src={ebookImage}
                alt="Portada de la Guía Digital de 30 Posiciones para Parejas"
                className="w-full rounded-xl shadow-2xl"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary text-primary-foreground text-[0.65rem] font-bold px-3 py-1 shadow-lg">
                REGALO INCLUIDO HOY
              </span>
            </div>

            <div className="text-center md:text-left pt-2 md:pt-0 min-w-0">
              <p className="text-[0.7rem] font-bold tracking-[0.14em] text-primary mb-2">
                🎁 REGALO DE HOY
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 leading-snug">
                Guía Digital de 30 Posiciones para Parejas GRATIS
              </h2>
              <p className="text-muted-foreground mb-2">
                Si compras Emparejados hoy, también recibes gratis nuestra
                Guía Digital de 30 Posiciones para Parejas.
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                Un extra para cuando quieran continuar la noche después de las cartas.
              </p>

              <div className="inline-flex flex-wrap items-center justify-center gap-2.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold mb-6 max-w-full">
                <Gift className="w-4 h-4 shrink-0" />
                <span>GRATIS COMPRANDO HOY</span>
                <span className="line-through opacity-70 font-normal">${VALOR_GUIA.toFixed(2)}</span>
              </div>

              <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full md:w-auto md:px-10 h-auto whitespace-normal text-[0.8rem] sm:text-base">
                <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
                QUIERO EMPAREJADOS + MI GUÍA
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. STACK DE VALOR ───────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-10">
            Todo esto viene incluido.
          </h2>

          <div className="rounded-2xl border bg-background shadow-xl overflow-hidden">
            <ul className="divide-y">
              {[
                { emoji: "🃏", t: "EMPAREJADOS", d: "72 cartas de Conexión, Deseo y Diversión.", v: `$${PRECIO_ANTES.toFixed(2)}`, tachado: true },
                { emoji: "🖨", t: "PDF IMPRIMIBLE", d: "Las 72 cartas listas para imprimir y recortar.", v: "Incluido" },
                { emoji: "📱", t: "EMPAREJADOS DIGITAL", d: "También juega directamente desde el celular.", v: "Incluido" },
                { emoji: "🎁", t: "GUÍA DE 30 POSICIONES", d: "Gratis comprando hoy.", v: "GRATIS", destacado: true, tachadoExtra: `$${VALOR_GUIA.toFixed(2)}` },
                { emoji: "📖", t: "INSTRUCCIONES", d: "Todo lo necesario para empezar.", v: "Incluido" },
                { emoji: "♾", t: "ACCESO", d: "Uso sin suscripción ni mensualidades.", v: "Incluido" },
              ].map((item) => (
                <li key={item.t} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5 shrink-0" aria-hidden="true">{item.emoji}</span>
                    <div>
                      <p className="font-semibold leading-tight">{item.t}</p>
                      <p className="text-sm text-muted-foreground">{item.d}</p>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    {item.tachadoExtra && (
                      <div className="text-xs text-muted-foreground line-through">{item.tachadoExtra}</div>
                    )}
                    <div
                      className={
                        item.destacado
                          ? "text-primary font-bold"
                          : item.tachado
                          ? "text-muted-foreground line-through"
                          : "text-primary text-sm font-semibold"
                      }
                    >
                      {item.v}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-5 py-5 border-t-2 border-primary/20 bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">
                Un solo pago. Dos formas de jugar. Y un regalo incluido hoy.
              </p>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-semibold">Hoy pagas</span>
                <Precio className="text-4xl font-bold text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Pago único. Sin suscripción ni cobros mensuales.
              </p>
              <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full text-base">
                <ShoppingCart className="mr-2 h-5 w-5" />
                QUIERO TODO ESTO
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 12. PRUEBA SOCIAL ────────────────────────────────────────────
          Dos cosas distintas, separadas a propósito:
          a) reseñas de EMPAREJADOS — solo si `resenasEmparejados` tiene datos;
          b) prueba de MARCA — capturas reales de clientes de ShotyGames, con
             el subtítulo diciendo exactamente de qué son. No inventar. */}
      <section className="px-4 py-10 md:py-16 bg-muted/40">
        <div className="max-w-5xl mx-auto space-y-10">
          {resenasEmparejados.length > 0 && (
            <div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8">
                Parejas que ya sacaron la primera carta
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                {resenasEmparejados.map((r) => (
                  <div key={r.alt} className="aspect-[4/5] rounded-xl overflow-hidden shadow-lg bg-muted">
                    <img src={r.img} alt={r.alt} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-center mb-7">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Estás comprando a ShotyGames
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                +3.500 clientes ya han comprado con nosotros en Ecuador 🇪🇨
                Estas son algunas conversaciones reales de nuestros clientes.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {[testimonial1, testimonial2, testimonial3, testimonial4, testimonial5, testimonial6].map((src, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl overflow-hidden shadow-lg bg-muted">
                  <img
                    src={src}
                    alt={`Captura real de conversación con un cliente de ShotyGames (${i + 1} de 6)`}
                    width={945}
                    height={1181}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 13. CÓMO LO RECIBES ──────────────────────────────────────── */}
      <section className="px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4">
            De comprar a jugar, sin esperar un envío.
          </h2>
          <p className="text-center text-sm text-muted-foreground max-w-lg mx-auto mb-8 md:mb-10">
            No tienes que esperar un paquete. Después de confirmar tu pago
            recibes el PDF imprimible, la versión digital y tu regalo.
          </p>

          <ol className="grid sm:grid-cols-4 gap-5">
            {[
              { n: "1", t: "Haces tu pedido", d: "Completas tus datos acá. Toma menos de un minuto." },
              { n: "2", t: "Confirmas tu pago", d: "Te escribimos por WhatsApp con los datos para pagar." },
              { n: "3", t: "Recibes Emparejados", d: "PDF imprimible + digital + Guía + instrucciones." },
              { n: "4", t: "Eligen cómo jugar", d: "Imprimen las cartas o abren la versión digital." },
            ].map((p) => (
              <li key={p.n} className="text-center sm:text-left">
                <span className="inline-flex w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold items-center justify-center mb-2.5">
                  {p.n}
                </span>
                <p className="font-bold leading-tight mb-1">{p.t}</p>
                <p className="text-sm text-muted-foreground">{p.d}</p>
              </li>
            ))}
          </ol>

          <p className="text-center font-display text-lg sm:text-xl font-bold mt-8">
            Y pueden sacar la primera carta.
          </p>
        </div>
      </section>

      {/* ── 14. FAQ ───────────────────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-10">
            Antes de comprar, probablemente quieras saber esto.
          </h2>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "¿Las cartas me llegan físicamente?",
                a: "No por courier. Recibes el PDF completo de las 72 cartas listo para imprimir y convertir en tu propio mazo. Por eso lo recibes sin esperar ningún envío, en vez de esperar días a que llegue un paquete.",
              },
              {
                q: "¿Puedo jugar sin imprimir?",
                a: "Sí. La compra también incluye Emparejados Digital para jugar desde el celular, sin imprimir nada.",
              },
              { q: "¿Cuántas cartas incluye?", a: "72 cartas." },
              { q: "¿Qué categorías tiene?", a: "Conexión, Deseo y Diversión." },
              {
                q: "¿Puedo imprimirlo nuevamente?",
                a: "Sí. El PDF es tuyo, así que si se daña una carta o quieren armar otro mazo, lo vuelven a imprimir cuando quieran.",
              },
              {
                q: "¿Necesito instalar alguna aplicación?",
                a: "No. Emparejados Digital se abre desde el navegador del celular, tablet o computadora. Entras con tu correo y tu clave y ya está funcionando.",
              },
              {
                q: "¿Necesito internet?",
                a: "Para imprimir las cartas no. Para la versión digital puedes guardarla en tu dispositivo y jugar sin conexión; con tu compra va un mini tutorial de cómo hacerlo.",
              },
              {
                q: "¿Puedo jugar varias veces?",
                a: "Sí, según las condiciones actuales del producto: el acceso es sin suscripción y las cartas digitales se barajan solas cada partida, así que no sale siempre en el mismo orden.",
              },
              {
                q: "¿Cómo recibo mi compra?",
                a: "Después de hacer el pedido te escribimos por WhatsApp con los datos para pagar. Apenas confirmamos el pago te mandamos el PDF imprimible, el acceso a la versión digital, la Guía de 30 Posiciones y las instrucciones. El correo que pones en el formulario es el usuario con el que entras al juego digital.",
              },
              {
                q: "¿La Guía Digital de 30 Posiciones está incluida?",
                a: "Sí. Comprando Emparejados hoy la recibes gratis.",
              },
            ].map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className="bg-background rounded-xl px-5 border-0">
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── 15. CIERRE EMOCIONAL ─────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24 bg-foreground text-background">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl sm:text-3xl md:text-[2.75rem] md:leading-tight font-bold mb-3">
            Esta noche puede terminar como muchas otras.
          </h2>
          <p className="text-background/60 text-base sm:text-lg mb-10">
            O pueden imprimir las cartas, sacar la primera y ver qué pasa.
          </p>

          <div className="w-12 h-px bg-background/25 mx-auto mb-10" />

          <div className="rounded-2xl bg-background/10 p-5 md:p-7 mb-9 text-left max-w-sm mx-auto">
            <ul className="space-y-2.5 text-sm">
              {[
                "🃏 72 cartas de Emparejados",
                "🖨 PDF imprimible completo",
                "📱 Versión digital incluida",
                "🎁 Guía de 30 Posiciones GRATIS comprando hoy",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline gap-3 mt-5 pt-5 border-t border-background/15">
              <span className="text-lg text-background/50 line-through">${PRECIO_ANTES.toFixed(2)}</span>
              <Precio className="text-4xl font-bold text-primary" />
              <span className="text-sm text-background/60">pago único</span>
            </div>
          </div>

          <p className="font-display text-xl sm:text-2xl font-bold text-primary mb-7">
            Un juego. Dos formas de jugar.
          </p>

          <Button onClick={handleBuyClick} size="xl" variant="hero" className="w-full sm:w-auto sm:px-14 text-base sm:text-lg">
            <ShoppingCart className="mr-2 h-5 w-5" />
            QUIERO MIS 72 CARTAS
          </Button>

          <ul className="flex items-center justify-center gap-x-5 gap-y-1.5 flex-wrap mt-6 text-xs text-background/60">
            <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Sin envío</li>
            <li className="flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Imprimible + digital</li>
            <li className="flex items-center gap-1.5"><Gift className="w-3.5 h-3.5" /> Guía de 30 Posiciones incluida GRATIS hoy</li>
          </ul>

          <button
            onClick={scrollToDigital}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-background/50 mt-6 transition-transform duration-200 ease-out active:scale-[0.97]"
          >
            <ArrowDown className="w-3.5 h-3.5" /> Ver la versión digital de nuevo
          </button>
        </div>
      </section>

      {/* ── Sticky CTA móvil (~64px) ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t shadow-2xl">
        <div className="px-3 py-2 flex items-center gap-2.5">
          <img
            src={portadaImage}
            alt=""
            aria-hidden="true"
            className="w-9 h-9 rounded object-cover shrink-0"
          />
          <div className="shrink-0 leading-tight">
            <div className="text-[0.65rem] text-muted-foreground line-through">${PRECIO_ANTES.toFixed(2)}</div>
            <Precio className="text-base font-bold text-primary block" />
          </div>
          <Button onClick={handleBuyClick} size="sm" variant="hero" className="flex-1 min-w-0">
            <ShoppingCart className="w-4 h-4 mr-1.5 shrink-0" />
            <span className="truncate">LO QUIERO</span>
          </Button>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
        productPrice={PRECIO}
        originalPrice={PRECIO_ANTES}
        productImage={portadaImage}
        productId="emparejados"
        upsells={[
          { id: "torreNormal", name: "Torre La Previa (para grupos)", price: 10, image: torreNormalImg },
          { id: "torrePicante", name: "Torre Picante (para grupos)", price: 10, image: torrePicanteImg },
          { id: "torreParejas", name: "Torre de Shots Parejas", price: 10, image: torreParejasImg },
          { id: "dadosPlacer", name: "Dados del Placer", price: 3.90, image: dadosDelPlacerImg },
        ]}
      />
    </div>
  );
};

export default EmparejadosImprimibleLanding;
