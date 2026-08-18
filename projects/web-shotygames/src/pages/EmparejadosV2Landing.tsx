import { useState, useEffect, useRef } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ShoppingCart, Printer, Gift, Smartphone, Shuffle, Timer,
  Infinity as InfinityIcon, Check, ArrowDown, Lock, Clock, Star,
} from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";
import demoVideo from "@/assets/emparejados-demo.mp4";
import portadaImage from "@/assets/emparejados-portada.jpg";
import conexionImage from "@/assets/emparejados-conexion.jpg";
import deseoImage from "@/assets/emparejados-deseo.jpg";
import diversionImage from "@/assets/emparejados-diversion.jpg";
import ebookImage from "@/assets/ebook-30-posiciones.webp";
import appCrono from "@/assets/emparejados-app-crono.webp";
import appBarajea from "@/assets/emparejados-app-barajea.webp";
import appGuia from "@/assets/emparejados-app-guia.webp";
import lifeConexion from "@/assets/emparejados-life-conexion.webp";
import lifeSofa from "@/assets/emparejados-life-sofa.webp";
import lifeTv from "@/assets/emparejados-life-tv.webp";
import impresasCortando from "@/assets/emparejados-impresas-cortando.jpg";
import impresasMesa from "@/assets/emparejados-impresas-mesa.jpg";
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
  RESEÑAS ESPECÍFICAS DE EMPAREJADOS — hoy vacío a propósito.

  En src/assets solo hay capturas de clientes de productos FÍSICOS (torres,
  envíos, guías). Ponerlas bajo un título que hable de Emparejados sería
  mentir, así que la sección de testimonios del producto no se renderiza
  hasta que este array tenga capturas reales de gente hablando de Emparejados.
  Para activarla: guarda las imágenes en src/assets, impórtalas y agrégalas acá.
*/
const resenasEmparejados: { img: string; alt: string }[] = [];

/* Único lugar donde vive el precio. Todo lo demás lo deriva de acá. */
const PRECIO = 6.90;
const PRECIO_ANTES = 15.00;
const VALOR_GUIA = 4.90;

const CATEGORIAS = [
  {
    emoji: "💗",
    nombre: "CONEXIÓN",
    color: "#d63384",
    img: conexionImage,
    desc: "Para hablar de cosas que normalmente nunca salen en una conversación cualquiera.",
    ejemplo: "Dile una fantasía romántica que aún no hayas vivido.",
  },
  {
    emoji: "🔥",
    nombre: "DESEO",
    color: "#8B1538",
    img: deseoImage,
    desc: "Para subir la temperatura sin tener que ser quien propone todo.",
    ejemplo: "Dale tres besos lentos donde tú quieras.",
  },
  {
    emoji: "🎯",
    nombre: "DIVERSIÓN",
    color: "#0077b6",
    img: diversionImage,
    desc: "Para romper la seriedad y terminar riéndose juntos.",
    ejemplo: "Elige una canción y tu pareja deberá bailarla.",
  },
];

const VENTAJAS_DIGITAL = [
  {
    icon: Shuffle,
    img: appBarajea,
    titulo: "Las cartas se barajan solas",
    desc: "Cada partida empieza diferente. No tienen que ordenar ni mezclar nada.",
    alt: "Pantalla del juego barajeando las 72 cartas",
  },
  {
    icon: Timer,
    img: appCrono,
    titulo: "Cronómetro dentro del juego",
    desc: "Cuando una carta necesita tiempo, el cronómetro está ahí mismo.",
    alt: "Carta de Deseo con el botón de iniciar cronómetro dentro del juego",
  },
  {
    icon: Smartphone,
    img: appGuia,
    titulo: "Siempre lo tienen cerca",
    desc: "No tienen que llevar una caja ni acordarse de guardar las cartas.",
    alt: "Pantalla principal del juego en el celular",
  },
  {
    icon: InfinityIcon,
    img: null,
    titulo: "Juegan otra vez cuando quieran",
    desc: "No es una experiencia de una sola noche. El acceso es de por vida.",
    alt: "",
  },
];

const EmparejadosV2Landing = () => {
  const productName = "Emparejados";
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();
  const demoRef = useRef<HTMLElement>(null);

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
        content_category: "Juegos Digitales",
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
        content_category: "Juegos Digitales",
        value: PRECIO,
        currency: "USD",
      });
    }
    setCheckoutOpen(true);
  };

  const scrollToDemo = () => demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const Precio = ({ className = "" }: { className?: string }) => (
    <span className={className}>${PRECIO.toFixed(2)}</span>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Seo
        title="Emparejados — 72 cartas para jugar en pareja | ShotyGames Ecuador"
        description={`Juego de cartas para parejas: Conexión, Deseo y Diversión. Lo abren desde el celular y además reciben el PDF imprimible de las 72 cartas. $${PRECIO.toFixed(2)}, pago único.`}
        canonical="https://www.shotygames.com/landing/emparejados-v2"
        image={`https://www.shotygames.com${portadaImage}`}
        type="product"
      />

      {/* ── Barra superior (no sticky: se va con el scroll) ─────────── */}
      <div className="bg-foreground text-background py-2 px-3">
        <div className="flex items-center justify-center gap-x-4 gap-y-0.5 flex-wrap text-[0.7rem] sm:text-xs font-medium tracking-wide">
          <span>📱 Digital</span>
          <span className="opacity-40">·</span>
          <span>🖨 Imprimible</span>
          <span className="opacity-40">·</span>
          <span>🎁 Guía gratis hoy</span>
        </div>
      </div>

      {/* ── 1. HERO ──────────────────────────────────────────────────
          Compacto a propósito: en 390px entra casi entero en el primer
          viewport (eyebrow + H1 + visual + CTA + chips). */}
      <section className="px-4 pt-4 pb-8 md:pt-12 md:pb-14 max-w-6xl mx-auto">
        {/* Móvil: texto → visual → precio/CTA (el orden del DOM).
            Desktop: la imagen ocupa la columna izquierda a lo alto y el texto
            + el CTA quedan juntos en la derecha. */}
        <div className="grid md:grid-cols-2 md:grid-rows-[auto_auto] gap-4 md:gap-x-12 md:gap-y-5 md:items-center">
          <div className="md:col-start-2 md:row-start-1 md:self-end">
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-primary mb-1.5">
              JUEGO PARA PAREJAS · 72 CARTAS
            </p>
            <h1 className="font-display text-[1.7rem] leading-[1.1] sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08] font-bold mb-2">
              72 cartas para que esta noche no sea igual a las anteriores.
            </h1>
            <p className="text-muted-foreground text-[0.9rem] leading-snug sm:text-lg sm:leading-relaxed">
              Conexión, deseo y diversión en un juego que abren desde el celular
              y empiezan a jugar en minutos.
            </p>
          </div>

          {/* Visual: pareja + celular con el juego corriendo + cartas.
              Es el LCP, por eso va eager y con fetchpriority alta. */}
          <div className="md:col-start-1 md:row-start-1 md:row-span-2 md:self-center">
            <div className="relative rounded-2xl overflow-hidden bg-muted shadow-2xl aspect-[16/10] md:aspect-square">
              <img
                src={lifeConexion}
                alt="Pareja jugando Emparejados en el sofá con una carta de Conexión en la pantalla del celular"
                className="w-full h-full object-cover"
                width={1200}
                height={900}
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>

          <div className="md:col-start-2 md:row-start-2 md:self-start space-y-3 md:space-y-4">
            <p className="text-[0.82rem] sm:text-sm leading-snug text-foreground/80 border-l-2 border-primary pl-3">
              Y si prefieren tener las cartas en la mano, también incluye el
              <strong className="font-semibold"> PDF imprimible completo</strong>.
            </p>

            <div className="flex items-baseline gap-3">
              <span className="text-lg text-muted-foreground line-through">${PRECIO_ANTES.toFixed(2)}</span>
              <Precio className="text-4xl font-bold text-primary" />
              <span className="text-sm text-muted-foreground">pago único</span>
            </div>

            <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full md:w-auto md:px-12 text-base">
              <ShoppingCart className="mr-2 h-5 w-5" />
              QUIERO JUGARLO ESTA NOCHE
            </Button>

            {/* La entrega NO es automática: se coordina por WhatsApp y el
                acceso se manda cuando el pago está confirmado. */}
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary shrink-0" /> Lo recibes en minutos después de confirmar tu pago</li>
              <li className="flex items-center gap-2"><InfinityIcon className="w-4 h-4 text-primary shrink-0" /> Acceso sin suscripción</li>
              <li className="flex items-center gap-2"><Printer className="w-4 h-4 text-primary shrink-0" /> También incluye versión imprimible</li>
            </ul>

            <p className="text-xs text-muted-foreground pt-1">
              +3.500 clientes han comprado en ShotyGames 🇪🇨
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEMA ──────────────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20 bg-muted/40">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-[1.6rem] sm:text-3xl md:text-4xl font-bold leading-snug mb-5">
            Se sientan juntos. Cada uno termina en su celular.
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
            No es que no tengan ganas de hacer algo. Es que después de un tiempo
            termina pasando lo mismo: cenan, ven algo, revisan el celular y nadie
            propone nada diferente.
          </p>
          <p className="font-display text-xl sm:text-2xl font-bold mb-2">
            Alguien tiene que sacar la primera carta.
          </p>
          <p className="text-muted-foreground mb-7">Para eso hicimos Emparejados.</p>

          <button
            onClick={scrollToDemo}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-transform duration-200 ease-out active:scale-[0.97]"
          >
            VER CÓMO FUNCIONA <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── 3. PRODUCTO EN ACCIÓN ────────────────────────────────────── */}
      <section ref={demoRef} className="px-4 py-14 md:py-20 max-w-5xl mx-auto scroll-mt-4">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Así funciona Emparejados
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            No tienes que aprender reglas complicadas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="mx-auto w-full max-w-[230px] sm:max-w-[260px] rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-border">
            <video
              src={demoVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              poster={appBarajea}
              className="w-full h-full object-cover"
              aria-label="Emparejados funcionando en un celular: barajear, sacar una carta y cumplir el reto"
            />
          </div>

          <ol className="space-y-5">
            {[
              { n: "1", t: "Barajean", d: "Las 72 cartas se mezclan." },
              { n: "2", t: "Sacan una carta", d: "Puede salir Conexión, Deseo o Diversión." },
              { n: "3", t: "Hacen lo que dice", d: "Y siguen con la siguiente." },
            ].map((p) => (
              <li key={p.n} className="flex gap-4">
                <span className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                  {p.n}
                </span>
                <div>
                  <p className="font-bold leading-tight mb-0.5">{p.t}</p>
                  <p className="text-sm text-muted-foreground">{p.d}</p>
                </div>
              </li>
            ))}
            <li className="pt-1">
              <p className="font-display text-xl font-bold">Eso es todo.</p>
            </li>
          </ol>
        </div>

        <div className="mt-9 text-center">
          <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full sm:w-auto sm:px-10">
            <ShoppingCart className="mr-2 h-5 w-5" />
            QUIERO EMPEZAR A JUGAR
          </Button>
        </div>
      </section>

      {/* ── 4. LAS CARTAS ────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-muted/40">
        <div className="px-4 max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              No saben qué carta viene después.
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              72 cartas divididas en tres tipos de momentos.
            </p>
          </div>

          {/* Carrusel swipeable en móvil, 3 columnas en desktop */}
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
                    alt={`Carta real de la categoría ${c.nombre}`}
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
            {/* Texto largo: en móvil baja de cuerpo para no desbordar el botón */}
            <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full sm:w-auto sm:px-10 text-[0.8rem] sm:text-base">
              <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
              QUIERO DESCUBRIR LAS OTRAS 69
            </Button>
          </div>
        </div>
      </section>

      {/* ── 5. RESULTADO (cambio de ritmo, sin producto) ─────────────── */}
      <section className="relative">
        <div className="relative h-[440px] sm:h-[480px] md:h-[560px] overflow-hidden">
          <img
            src={lifeTv}
            alt="Pareja riéndose en el sofá con una carta de Deseo en el celular, mientras sus dos teléfonos siguen apagados sobre la mesa"
            className="absolute inset-0 w-full h-full object-cover object-[center_38%]"
            loading="lazy"
            decoding="async"
          />
          {/* Gradiente solo en la mitad baja: la foto tiene que verse */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="relative h-full flex flex-col justify-end px-5 pb-10 md:pb-14 max-w-3xl mx-auto text-white">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3">
              Una carta cambia el plan.
            </h2>
            <p className="text-white/85 text-base sm:text-lg max-w-md leading-relaxed">
              Ya no tienen que pensar qué hacer. Abren Emparejados, sacan una
              carta y dejan que el juego haga el resto.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. VENTAJA DIGITAL ───────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20 max-w-5xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-10">
          Es más que un mazo en una pantalla.
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
          {VENTAJAS_DIGITAL.map((v) => (
            <div key={v.titulo} className="flex gap-4 rounded-2xl border bg-background p-4 sm:p-5">
              {v.img ? (
                <div className="shrink-0 w-[86px] rounded-lg overflow-hidden bg-[#0d0d0d] flex items-end justify-center pt-3 px-2">
                  <img
                    src={v.img}
                    alt={v.alt}
                    className="w-full rounded-t-md"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="shrink-0 w-[86px] rounded-lg bg-primary/10 flex items-center justify-center">
                  <v.icon className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <h3 className="font-bold mb-1 flex items-start gap-2">
                  <v.icon className="w-4 h-4 mt-1 text-primary shrink-0" />
                  {v.titulo}
                </h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Capturas reales del juego, no ilustraciones
        </p>
      </section>

      {/* ── 7. DIGITAL + IMPRIMIBLE (el gran diferenciador) ──────────── */}
      <section className="px-4 py-14 md:py-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-9 md:mb-12">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
              ¿Celular o cartas?
            </h2>
            <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3">
              No tienen que escoger.
            </p>
            <p className="text-background/70">
              Con Emparejados reciben las dos formas de jugar.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-5 md:gap-6 items-stretch">
            <div className="rounded-2xl bg-background/10 p-5 md:p-6">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/30 mb-4">
                <img
                  src={lifeSofa}
                  alt="Jugando Emparejados desde el celular en casa"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className="font-bold text-lg mb-2">📱 JUEGUEN DIGITAL</h3>
              <p className="text-sm text-background/75 mb-3">
                Abren Emparejados desde el celular, barajan y empiezan.
              </p>
              <ul className="text-sm text-background/70 space-y-1">
                {["Jugar en la cama", "Una cita", "Un viaje", "Cualquier momento improvisado"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex md:flex-col items-center justify-center">
              <span className="font-display text-4xl md:text-5xl font-bold text-primary">+</span>
            </div>

            <div className="rounded-2xl bg-background/10 p-5 md:p-6">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/30 mb-4">
                <img
                  src={impresasCortando}
                  alt="Las 72 cartas de Emparejados impresas en hoja A4, recortándose en casa"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className="font-bold text-lg mb-2">🃏 O IMPRÍMANLO</h3>
              <p className="text-sm text-background/75 mb-3">
                También reciben el PDF completo de las 72 cartas listo para
                imprimir, cortar y convertir en su propio mazo físico.
              </p>
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-black/30">
                <img
                  src={impresasMesa}
                  alt="Las cartas de Conexión, Deseo y Diversión ya impresas sobre la mesa"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-center mt-9 mb-6">
            Los dos formatos vienen incluidos.
          </p>

          <div className="text-center">
            <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full sm:w-auto sm:px-10">
              <ShoppingCart className="mr-2 h-5 w-5" />
              QUIERO LAS DOS VERSIONES
            </Button>
          </div>
        </div>
      </section>

      {/* ── 8. REGALO DE HOY ─────────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20">
        <div className="max-w-4xl mx-auto rounded-3xl border-2 border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent p-6 md:p-10">
          <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
            <div className="mx-auto md:mx-0 w-[150px] md:w-[190px] shrink-0">
              <img
                src={ebookImage}
                alt="Portada de la Guía Digital de 30 Posiciones para Parejas"
                className="w-full rounded-xl shadow-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="text-center md:text-left">
              <p className="text-[0.7rem] font-bold tracking-[0.14em] text-primary mb-2">
                🎁 REGALO DE HOY
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 leading-snug">
                Guía Digital de 30 Posiciones para Parejas
              </h2>
              <p className="text-muted-foreground mb-3">
                Si compras Emparejados hoy, también recibes gratis la Guía
                Digital de 30 Posiciones.
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                La descargas junto con tu compra para tener otra opción cuando
                quieran seguir jugando después de las cartas.
              </p>

              <div className="inline-flex items-center gap-2.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold mb-6">
                <Gift className="w-4 h-4" />
                INCLUIDA GRATIS HOY
                <span className="line-through opacity-70 font-normal">${VALOR_GUIA.toFixed(2)}</span>
              </div>

              <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full md:w-auto md:px-10 text-[0.8rem] sm:text-base">
                <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
                QUIERO EMPAREJADOS + MI GUÍA
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. TODO LO QUE RECIBES ───────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20 bg-muted/40">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-10">
            Esto es todo lo que recibes
          </h2>

          <div className="rounded-2xl border bg-background shadow-xl overflow-hidden">
            <ul className="divide-y">
              {[
                { t: "Emparejados Digital", d: "72 cartas de Conexión, Deseo y Diversión.", v: `$${PRECIO_ANTES.toFixed(2)}`, tachado: true },
                { t: "Juego interactivo", d: "Barajado automático y cronómetro dentro del juego.", v: "Incluido" },
                { t: "PDF imprimible", d: "Las mismas 72 cartas listas para imprimir y cortar.", v: "Incluido" },
                { t: "Guía Digital de 30 Posiciones", d: "Gratis comprando hoy.", v: "GRATIS", destacado: true, tachadoExtra: `$${VALOR_GUIA.toFixed(2)}` },
                { t: "Instrucciones", d: "Todo lo necesario para empezar.", v: "Incluido" },
                { t: "Acceso de por vida", d: "Sin mensualidades ni suscripción.", v: "Incluido" },
              ].map((item) => (
                <li key={item.t} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
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
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-semibold">Hoy pagas</span>
                <Precio className="text-4xl font-bold text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Pago único. Sin suscripción ni cobros mensuales.
              </p>
              <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full text-base">
                <ShoppingCart className="mr-2 h-5 w-5" />
                QUIERO EMPAREJADOS
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. PRUEBA SOCIAL ────────────────────────────────────────────
          Dos cosas distintas, separadas a propósito:
          a) reseñas de EMPAREJADOS — solo si `resenasEmparejados` tiene datos;
          b) prueba de MARCA — capturas reales de clientes de ShotyGames, con
             el subtítulo diciendo exactamente de qué son. No inventar. */}
      <section className="px-4 py-14 md:py-20">
        <div className="max-w-5xl mx-auto space-y-12">
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
                ShotyGames es una marca real
              </h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                +3.500 clientes ya compraron con nosotros. Estas son capturas
                reales de sus conversaciones — la mayoría por nuestros juegos
                físicos, que es con lo que empezamos 🇪🇨
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

      {/* ── 12. CÓMO LO RECIBES ──────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-10">
            Compras hoy. Juegan hoy.
          </h2>

          <ol className="grid sm:grid-cols-3 gap-5">
            {[
              { n: "1", t: "Haces tu pedido", d: "Completas tus datos acá. Toma menos de un minuto." },
              { n: "2", t: "Confirmas tu pago", d: "Te escribimos por WhatsApp con los datos para pagar." },
              { n: "3", t: "Recibes Emparejados", d: "El juego, el PDF imprimible, la Guía y las instrucciones." },
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

      {/* ── 13. OBJECIONES ───────────────────────────────────────────── */}
      <section className="px-4 py-14 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-10">
            Antes de comprar, probablemente quieras saber esto.
          </h2>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "¿Es físico o digital?",
                a: "Es digital, pero también recibes el PDF completo de las 72 cartas para imprimirlas y jugar físicamente. Los dos formatos vienen en la misma compra.",
              },
              {
                q: "¿Tengo que instalar una aplicación?",
                a: "No. Se abre desde el navegador del celular, tablet o computadora. Entras con tu correo y tu clave y ya está funcionando.",
              },
              {
                q: "¿Necesito internet?",
                a: "Puedes guardarlo en tu dispositivo y jugar sin conexión. Con tu compra va un PDF con las instrucciones de acceso y un mini tutorial para guardarlo, paso a paso.",
              },
              { q: "¿Cuántas cartas incluye?", a: "72 cartas." },
              {
                q: "¿Qué tipo de retos tiene?",
                a: "Conexión, Deseo y Diversión. Ustedes deciden cuáles cumplir y hasta dónde quieren llegar. Si una carta no les cuadra, la pasan y sacan otra.",
              },
              {
                q: "¿Puedo jugar más de una vez?",
                a: "Sí. El acceso es de por vida y sin suscripción, y las cartas se barajan solas cada partida, así que no sale siempre en el mismo orden.",
              },
              {
                q: "¿Cómo recibo el producto?",
                a: "Después de hacer el pedido te escribimos por WhatsApp con los datos para pagar. Apenas confirmamos el pago te mandamos el link del juego, tu clave, el PDF imprimible y la Guía. El correo que pones en el formulario es el usuario con el que entras al juego.",
              },
              {
                q: "¿Puedo imprimirlo?",
                a: "Sí. El PDF imprimible completo está incluido: las 72 cartas con frente y dorso, 9 por hoja A4, listas para imprimir y cortar.",
              },
              {
                q: "¿La Guía de 30 Posiciones viene incluida?",
                a: "Sí. Comprando hoy se incluye gratis, y la descargas desde adentro del mismo juego.",
              },
            ].map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className="bg-muted/40 rounded-xl px-5 border-0">
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── 14. CIERRE EMOCIONAL ─────────────────────────────────────── */}
      <section className="px-4 py-16 md:py-24 bg-foreground text-background">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl sm:text-3xl md:text-[2.75rem] md:leading-tight font-bold mb-3">
            Esta noche puede terminar como siempre.
          </h2>
          <p className="text-background/60 text-base sm:text-lg mb-10">
            Cada uno con su celular, buscando qué ver.
          </p>

          <div className="w-12 h-px bg-background/25 mx-auto mb-10" />

          <p className="font-display text-2xl sm:text-3xl md:text-[2.75rem] md:leading-tight font-bold text-primary mb-9">
            O pueden sacar la primera carta.
          </p>

          <div className="rounded-2xl bg-background/10 p-5 md:p-7 mb-7 text-left max-w-sm mx-auto">
            <ul className="space-y-2.5 text-sm">
              {[
                "Emparejados — 72 cartas digitales",
                "PDF imprimible de las 72 cartas",
                "Guía de 30 Posiciones GRATIS hoy",
                "Acceso sin suscripción",
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

          <Button onClick={handleBuyClick} size="xl" variant="hero" className="w-full sm:w-auto sm:px-14 text-base sm:text-lg">
            <ShoppingCart className="mr-2 h-5 w-5" />
            QUIERO JUGARLO ESTA NOCHE
          </Button>

          <ul className="flex items-center justify-center gap-x-5 gap-y-1.5 flex-wrap mt-6 text-xs text-background/60">
            <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Pago por transferencia o tarjeta</li>
            <li className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Lo recibes al confirmar tu pago</li>
            <li className="flex items-center gap-1.5"><InfinityIcon className="w-3.5 h-3.5" /> Uso ilimitado</li>
          </ul>
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

export default EmparejadosV2Landing;
