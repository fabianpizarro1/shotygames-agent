import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ShoppingCart, Gift, Heart, Sparkles, Clock, Printer, Timer,
  Smartphone, MessageCircle, KeyRound, CheckCircle2, Infinity as InfinityIcon, Star,
} from "lucide-react";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import demoVideo from "@/assets/emparejados-demo.mp4";
import portadaImage from "@/assets/emparejados-portada.jpg";
import conexionImage from "@/assets/emparejados-conexion.jpg";
import deseoImage from "@/assets/emparejados-deseo.jpg";
import diversionImage from "@/assets/emparejados-diversion.jpg";
import impresasCortando from "@/assets/emparejados-impresas-cortando.jpg";
import impresasMesa from "@/assets/emparejados-impresas-mesa.jpg";
import impresasMano from "@/assets/emparejados-impresas-mano.jpg";
import ebookImage from "@/assets/ebook-30-posiciones.webp";
import appCrono from "@/assets/emparejados-app-crono.webp";
import appBarajea from "@/assets/emparejados-app-barajea.webp";
import appGuia from "@/assets/emparejados-app-guia.webp";
import lifeConexion from "@/assets/emparejados-life-conexion.webp";
import lifeCartas from "@/assets/emparejados-life-cartas.webp";
import lifeSofa from "@/assets/emparejados-life-sofa.webp";
import lifeTv from "@/assets/emparejados-life-tv.webp";
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
import torreNormalImgThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torrePicanteImgThumb from "@/assets/thumbs/torre-picante.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import { LazyVideo } from "@/components/LazyVideo";

/*
  RESEÑAS ESPECÍFICAS DE EMPAREJADOS.

  Hoy está vacío a propósito: las capturas que tenemos en /assets son de
  clientes de la marca (torres, envíos), no de gente hablando de Emparejados.
  Meterlas bajo un título tipo "esto dicen quienes ya jugaron Emparejados"
  sería mentir. Cuando tengas capturas REALES de conversaciones sobre
  Emparejados: guárdalas en src/assets, impórtalas y agrégalas acá.
  La sección se renderiza sola en cuanto este array tenga elementos.
*/
const resenasEmparejados: { img: string; alt: string }[] = [];

const EmparejadosLanding = () => {
  const productName = "Emparejados";
  const productPrice = 6.90;
  const originalPrice = 15.00;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();

  const heroSlides = [
    { img: lifeConexion, alt: "Pareja jugando Emparejados en el sofá, carta de Conexión en pantalla" },
    { img: lifeCartas, alt: "Las cartas de Emparejados desplegadas alrededor del celular" },
    { img: lifeSofa, alt: "Noche en casa jugando Emparejados desde el celular" },
    { img: lifeTv, alt: "Pareja en el sofá jugando Emparejados en vez de ver la tele" },
  ];

  // Rotación automática — pausa en cuanto el usuario toca un indicador
  const [autoRotate, setAutoRotate] = useState(true);
  useEffect(() => {
    if (!autoRotate) return;
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % heroSlides.length), 4000);
    return () => clearInterval(t);
  }, [autoRotate, heroSlides.length]);

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
        value: productPrice,
        currency: "USD",
      });
    }
  }, []);

  const handleBuyClick = () => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: productName,
        content_category: "Juegos Digitales",
        value: productPrice,
        currency: "USD",
      });
    }
    setCheckoutOpen(true);
  };

  const categorias = [
    {
      img: conexionImage,
      titulo: "Conexión",
      color: "#d63384",
      emoji: "💗",
      desc: "Preguntas que abren conversaciones que normalmente no tienen.",
      ejemplo: "Dile una fantasía romántica que aún no hayas vivido.",
    },
    {
      img: deseoImage,
      titulo: "Deseo",
      color: "#8B1538",
      emoji: "🔥",
      desc: "Retos para subir la temperatura sin que se sienta forzado.",
      ejemplo: "Dale tres besos lentos donde tú quieras.",
    },
    {
      img: diversionImage,
      titulo: "Diversión",
      color: "#0077b6",
      emoji: "🎯",
      desc: "Dinámicas para reír juntos y romper la rutina.",
      ejemplo: "Elige una canción y tu pareja deberá bailarla.",
    },
  ];

  // Los textos tienen que coincidir con el flujo real: el pedido entra por el
  // formulario, se coordina el pago por WhatsApp y el acceso se manda cuando
  // el pago está confirmado. No es entrega automática — no prometer "inmediato".
  const pasosEntrega = [
    { icon: ShoppingCart, titulo: "Haces tu pedido", desc: "Llenas el formulario acá. Toma menos de 1 minuto." },
    { icon: MessageCircle, titulo: "Te escribo por WhatsApp", desc: "Te llega el resumen del pedido y los datos para pagar." },
    { icon: KeyRound, titulo: "Pagas y te mando el acceso", desc: "Apenas confirmo el pago te llega el link, tu clave, el PDF imprimible y las instrucciones." },
    { icon: Smartphone, titulo: "Lo guardas y juegan", desc: "Lo guardas en tu dispositivo y ya pueden jugar sin conexión." },
  ];

  const ventajasDigital = [
    {
      img: appCrono,
      icon: Timer,
      titulo: "Cronómetro adentro",
      desc: 'Cuando la carta dice "por 5 minutos", el cronómetro está dentro del juego. No hay que salir a buscar el reloj del celular.',
      alt: "Carta de Deseo con el botón Iniciar Cronómetro dentro del juego",
    },
    {
      img: appBarajea,
      icon: Sparkles,
      titulo: "Nunca sale en el mismo orden",
      desc: "Las 72 cartas se mezclan solas cada vez que juegan, así que la décima partida no se siente como la primera.",
      alt: "Pantalla del juego barajeando las cartas",
    },
    {
      img: appGuia,
      icon: Gift,
      titulo: "El regalo ya viene adentro",
      desc: "La Guía de 30 Posiciones se descarga con un botón desde el mismo juego. No tienes que pedirla ni esperarla.",
      alt: "Pantalla principal del juego con el botón para descargar la Guía de 30 Posiciones",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Seo
        title="Emparejados — 72 cartas para jugar en pareja | ShotyGames Ecuador"
        description={`72 cartas de Conexión, Deseo y Diversión. Lo juegas desde el celular y además lo puedes imprimir. Lo recibes en minutos por $${productPrice.toFixed(2)}.`}
        canonical="https://www.shotygames.com/landing/emparejados"
        image={`https://www.shotygames.com${portadaImage}`}
        type="product"
      />

      {/* ── Barra de beneficios ───────────────────────────────────────
          Ya NO es fixed: se ve al entrar y se va con el scroll. En móvil
          el CTA de abajo es el que tiene que quedarse, no dos barras. */}
      <div className="bg-primary text-primary-foreground py-2.5 px-3">
        <div className="flex items-center justify-center gap-x-5 gap-y-1 flex-wrap text-xs sm:text-sm font-semibold">
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Lo recibes en minutos</span>
          <span className="flex items-center gap-1.5"><Printer className="w-4 h-4" /> También lo imprimes</span>
          <span className="flex items-center gap-1.5"><Gift className="w-4 h-4" /> Guía de regalo</span>
        </div>
      </div>

      <div>
        {/* ── 1. HERO ──────────────────────────────────────────────── */}
        <section className="px-4 py-7 md:py-14 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-7 md:gap-12 items-center">
            {/* Carrusel de imágenes — se entiende qué es en 1 segundo */}
            <div className="order-1 md:order-1">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
                {heroSlides.map((slide, i) => (
                  <img
                    key={slide.alt}
                    src={slide.img}
                    alt={slide.alt}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out ${
                      i === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                ))}
              </div>

              {/* Indicadores */}
              <div className="flex justify-center gap-2 mt-4">
                {heroSlides.map((slide, i) => (
                  <button
                    key={slide.alt}
                    onClick={() => { setCurrentSlide(i); setAutoRotate(false); }}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-200 ease-out ${
                      i === currentSlide ? "bg-primary w-8" : "bg-muted-foreground/30 w-2"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Copy + precio */}
            <div className="order-2 md:order-2 space-y-4">
              <Badge variant="secondary" className="text-xs">
                <Heart className="w-3.5 h-3.5 mr-1.5" /> Juego digital para parejas
              </Badge>

              <h1 className="font-display font-bold leading-tight">
                <span className="block text-4xl sm:text-5xl lg:text-6xl text-primary mb-1.5">
                  Emparejados
                </span>
                <span className="block text-[1.6rem] leading-snug sm:text-3xl lg:text-4xl">
                  72 cartas para que esta noche no sea igual a las anteriores
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground">
                Conexión, Deseo y Diversión. Lo abren en el celular y ya están jugando.
                No hay que instalar nada ni esperar que llegue nada.
              </p>

              <div className="bg-muted/50 rounded-2xl p-5 border-2 border-primary/20">
                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <span className="text-xl text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                  <span className="text-5xl font-bold text-primary">${productPrice.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Pago único. Acceso de por vida, sin suscripción.
                </p>
                <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full text-base">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  LO QUIERO AHORA
                </Button>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Lo recibes en minutos</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Uso ilimitado</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                +800 parejas ya están jugando Emparejados 🇪🇨
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. EL PROBLEMA ───────────────────────────────────────── */}
        <section className="px-4 py-12 md:py-16 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
              Se sientan en el sofá. Cada uno con su celular. Otra vez.
            </h2>
            <p className="text-lg text-muted-foreground">
              No es que se quieran menos. Es que ya nadie propone nada distinto,
              y esperar a que al otro "se le ocurra algo" no funciona.
            </p>
            <p className="text-lg font-semibold">
              Alguien tiene que sacar la primera carta. Para eso existe esto.
            </p>
          </div>
        </section>

        {/* ── 3. VIDEO REAL — sube apenas después del problema ─────── */}
        <section className="px-4 py-12 md:py-16 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-7 md:gap-12 items-center">
            <div className="mx-auto w-full max-w-[220px] sm:max-w-[260px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border">
              <LazyVideo
                src={demoVideo}
                autoPlay
                loop
                muted
                playsInline
                poster={appBarajea}
                className="w-full h-full object-cover"
                aria-label="Emparejados funcionando en un celular: barajear y sacar cartas"
              />
            </div>

            <div className="text-center md:text-left space-y-4">
              <Badge variant="secondary" className="text-xs">
                <Smartphone className="w-3.5 h-3.5 mr-1.5" /> Video real
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
                Así se ve funcionando
              </h2>
              <p className="text-muted-foreground text-lg">
                Es el juego real corriendo en un celular. Barajeas, sacas una carta
                y cumplen el reto. No hay nada complicado que aprender.
              </p>
              <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full sm:w-auto">
                <ShoppingCart className="mr-2 h-5 w-5" />
                LO QUIERO AHORA
              </Button>
            </div>
          </div>
        </section>

        {/* ── 4. LAS 3 CATEGORÍAS (compacto) ───────────────────────────
            Antes cada categoría se comía casi una pantalla. Ahora: carrusel
            horizontal en móvil, 3 columnas en desktop. */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="px-4 max-w-6xl mx-auto">
            <div className="text-center mb-7 md:mb-10">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                72 cartas. 3 formas de cambiar la noche.
              </h2>
              <p className="text-muted-foreground">
                Ustedes deciden hasta dónde llegar. La carta solo propone.
              </p>
            </div>

            <div
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0 max-w-5xl md:mx-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {categorias.map((c) => (
                <Card
                  key={c.titulo}
                  className="overflow-hidden shrink-0 w-[74vw] max-w-[300px] snap-center md:w-auto md:max-w-none"
                >
                  <div className="aspect-[3/4] bg-muted">
                    <img
                      src={c.img}
                      alt={`Carta de la categoría ${c.titulo}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="pt-4 pb-5">
                    <h3 className="font-bold text-base mb-1.5" style={{ color: c.color }}>
                      {c.emoji} {c.titulo.toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                    <div className="rounded-lg bg-muted/60 px-3 py-2 border-l-2" style={{ borderColor: c.color }}>
                      <p className="text-[0.7rem] text-muted-foreground mb-0.5">Ejemplo real:</p>
                      <p className="text-sm italic">"{c.ejemplo}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4 md:hidden">
              Desliza para ver las tres →
            </p>
          </div>
        </section>

        {/* ── 5. POR QUÉ DIGITAL GANA ──────────────────────────────────
            En móvil cada bloque es una fila compacta (captura chica a la
            izquierda), en desktop se mantienen las 3 tarjetas. */}
        <section className="px-4 py-12 md:py-16 max-w-5xl mx-auto">
          <div className="text-center mb-7 md:mb-10">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
              Lo que un mazo de cartas no puede hacer
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {ventajasDigital.map((f) => (
              <Card key={f.titulo} className="overflow-hidden flex md:block">
                <div className="bg-[#0d0d0d] flex justify-center items-end shrink-0 w-28 md:w-full pt-4 px-3 md:pt-5 md:px-5">
                  <img
                    src={f.img}
                    alt={f.alt}
                    className="w-full max-w-[170px] rounded-t-lg md:rounded-t-xl shadow-2xl"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4 md:pt-5 md:pb-6 md:px-6 flex flex-col justify-center">
                  <div className="hidden md:flex w-11 h-11 rounded-full bg-primary/10 items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-base md:text-lg mb-1.5 flex items-start gap-2">
                    <f.icon className="w-4 h-4 mt-1 shrink-0 text-primary md:hidden" />
                    {f.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Capturas reales del juego, no ilustraciones
          </p>
        </section>

        {/* ── 6. EL PDF IMPRIMIBLE ─────────────────────────────────── */}
        <section className="px-4 py-12 md:py-16 bg-muted/30">
          <Card className="overflow-hidden border-2 border-primary/30 max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2">
              {/* Foto principal: el proceso real (hoja A4 + tijera + cartas
                  cortadas). En móvil respeta su proporción nativa 4/5; en
                  desktop se estira a la altura de la columna de texto para que
                  no queden 500px de vacío al lado. */}
              <div className="aspect-[4/5] md:aspect-auto md:h-full bg-muted">
                <img
                  src={impresasCortando}
                  alt="La hoja A4 con las cartas de Emparejados recién impresas, una tijera y las primeras cartas ya recortadas"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <CardContent className="p-6 md:p-9 flex flex-col justify-center">
                <Badge className="w-fit mb-3 bg-primary text-primary-foreground">
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> INCLUIDO
                </Badge>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 leading-snug">
                  Es digital. Pero si quieren, lo tienen en la mano.
                </h2>
                <p className="text-muted-foreground mb-3">
                  Con tu compra también recibes el <strong className="text-foreground">PDF imprimible
                  de las 72 cartas</strong>: frente y dorso, 9 cartas por hoja A4, listo para
                  imprimir y cortar en casa.
                </p>
                <p className="text-muted-foreground mb-5">
                  Juéguenlo desde el celular cuando quieran algo rápido. Impriman las cartas
                  cuando prefieran tenerlas en la mano. Los dos formatos vienen incluidos.
                </p>

                <ul className="space-y-2.5 mb-5">
                  {[
                    "Lo juegan desde el celular, sin instalar nada",
                    "Lo imprimen en hojas A4 y lo cortan en casa",
                    "Se queda guardado: es suyo, no se vence",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                {/* Las dos fotos del resultado ya impreso */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={impresasMesa}
                      alt="Las cartas de Conexión, Deseo y Diversión impresas sobre la mesa junto a dos copas de vino"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={impresasMano}
                      alt="Una carta de Diversión impresa sostenida en la mano, con el mazo al fondo"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </section>

        {/* ── 7. QUÉ RECIBES ───────────────────────────────────────── */}
        <section className="px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-7 md:mb-10">
              Qué recibes exactamente
            </h2>

            <Card className="shadow-xl">
              <CardContent className="p-5 md:p-8">
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-4 pb-3.5 border-b">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Emparejados — 72 cartas digitales</p>
                        <p className="text-sm text-muted-foreground">Conexión, Deseo y Diversión, con cronómetro</p>
                      </div>
                    </div>
                    <span className="text-muted-foreground line-through whitespace-nowrap">${originalPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 pb-3.5 border-b">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">PDF imprimible de las 72 cartas</p>
                        <p className="text-sm text-muted-foreground">Para imprimir y cortar en casa</p>
                      </div>
                    </div>
                    <span className="text-primary font-semibold whitespace-nowrap">Incluido</span>
                  </div>

                  <div className="flex items-start justify-between gap-4 pb-3.5 border-b">
                    <div className="flex items-start gap-3">
                      <img src={ebookImage} alt="Guía de 30 Posiciones" className="w-10 h-14 object-cover rounded shadow flex-shrink-0" loading="lazy" />
                      <div>
                        <p className="font-semibold">Guía de 30 Posiciones</p>
                        <p className="text-sm text-muted-foreground">La descargas desde adentro del juego</p>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-muted-foreground line-through text-sm">$4.90</div>
                      <div className="text-primary font-bold">GRATIS</div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 pb-3.5 border-b">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">PDF de instrucciones + mini tutorial</p>
                        <p className="text-sm text-muted-foreground">Para guardarlo en tu celular y jugar sin internet</p>
                      </div>
                    </div>
                    <span className="text-primary font-semibold whitespace-nowrap">Incluido</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Acceso de por vida</p>
                      <p className="text-sm text-muted-foreground">Sin suscripción, sin límite de veces</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t-2 border-primary/20">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-lg font-semibold">Hoy pagas</span>
                    <span className="text-4xl font-bold text-primary">${productPrice.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full text-base">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    LO QUIERO AHORA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── 8. PRUEBA SOCIAL ─────────────────────────────────────────
            Dos cosas distintas y separadas a propósito:
            a) prueba de MARCA (capturas reales de clientes de ShotyGames);
            b) prueba de PRODUCTO (reseñas de Emparejados) — solo se muestra
               cuando el array `resenasEmparejados` tenga capturas reales. */}
        <section className="px-4 py-12 md:py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto space-y-12">
            {resenasEmparejados.length > 0 && (
              <div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-7">
                  Esto dicen quienes ya jugaron Emparejados
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                  {resenasEmparejados.map((r) => (
                    <div key={r.alt} className="aspect-[4/5] rounded-lg overflow-hidden shadow-lg bg-muted">
                      <img src={r.img} alt={r.alt} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-center mb-6 md:mb-8">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 md:w-6 md:h-6 fill-primary text-primary" />
                  ))}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                  +800 parejas ya están jugando Emparejados
                </h2>
                {/* Framing honesto: las capturas de abajo son de clientes de la
                    marca (productos físicos), no reseñas de Emparejados. Por eso
                    el subtítulo aclara de qué son. No inventar testimonios. */}
                <p className="text-muted-foreground">
                  Y +3.500 clientes ya compraron en ShotyGames — estas son capturas reales de sus mensajes 🇪🇨
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                {[testimonial1, testimonial2, testimonial3, testimonial4, testimonial5, testimonial6].map((src, i) => (
                  <div key={i} className="aspect-[4/5] rounded-lg overflow-hidden shadow-lg bg-muted">
                    <img
                      src={src}
                      alt={`Captura real de conversación con un cliente de ShotyGames (${i + 1} de 6)`}
                      width={945}
                      height={1181}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. CÓMO TE LLEGA ─────────────────────────────────────── */}
        <section className="px-4 py-12 md:py-16 max-w-5xl mx-auto">
          <div className="text-center mb-7 md:mb-10">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Cómo te llega
            </h2>
            <p className="text-muted-foreground text-lg">
              Sin misterio: esto es exactamente lo que pasa después de que le das al botón.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pasosEntrega.map((p, i) => (
              <Card key={p.titulo} className="relative">
                <CardContent className="pt-5 pb-5">
                  <div className="absolute top-3 right-4 text-3xl font-bold text-primary/15">
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1.5">{p.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 10. FAQ ──────────────────────────────────────────────── */}
        <section className="px-4 py-12 md:py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-7 md:mb-10">
              Preguntas frecuentes
            </h2>

            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="q1" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Cómo me llega el juego?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Después de hacer el pedido te escribo por WhatsApp con los datos para pagar.
                  Apenas confirmo el pago te mando el link del juego, tu clave y el PDF imprimible.
                  El correo que pones en el formulario es el usuario con el que vas a entrar al juego.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Tengo que descargar o instalar algo?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. Se abre desde el navegador del celular, tablet o computadora.
                  Entras con tu correo y tu clave y ya está funcionando.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2b" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Necesito internet para jugar?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. Puedes guardarlo en tu dispositivo y jugar sin conexión.
                  Con tu compra va un PDF con las instrucciones de acceso y un mini tutorial
                  para guardarlo, paso a paso. Toma menos de un minuto.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿De verdad puedo imprimir las cartas?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sí. El PDF trae las 72 cartas con frente y dorso, 9 por hoja A4, listas para
                  imprimir y cortar. Funciona en papel normal, aunque en cartulina quedan mucho mejor.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q4" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Qué tan fuertes son los retos?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Hay de todo, y ustedes eligen. Las de Conexión son conversación pura,
                  las de Diversión son para reír y las de Deseo suben la temperatura.
                  Si una carta no les cuadra, la pasan y sacan otra. Nadie los obliga a nada.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q6" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Lo pago una vez o es suscripción?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Una sola vez. Pagas los ${productPrice.toFixed(2)} y el acceso es tuyo,
                  sin cobros mensuales ni límite de partidas.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q7" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿El acceso caduca?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. El acceso es de por vida y lo puedes usar las veces que quieras.
                  Además, si lo guardas en tu dispositivo, lo tienes ahí aunque estés sin internet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q5" className="bg-background rounded-xl px-5 border">
                <AccordionTrigger className="text-left font-semibold">
                  ¿Es discreto?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Totalmente. Es digital, así que no llega ningún paquete a tu casa
                  ni nadie ve qué compraste. Todo el proceso es entre tú y yo por WhatsApp.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* ── 11. CTA FINAL ────────────────────────────────────────── */}
        <section className="px-4 py-12 md:py-16 max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground shadow-2xl">
            <CardContent className="p-7 md:p-12 text-center space-y-5">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
                Pueden seguir cada uno en su celular.
              </h2>
              <p className="text-lg opacity-90">
                O sacar la primera carta esta noche.
              </p>

              <div className="py-1">
                <div className="text-xl line-through opacity-70">${originalPrice.toFixed(2)}</div>
                <div className="text-6xl font-bold my-1">${productPrice.toFixed(2)}</div>
                <p className="opacity-90">+ PDF imprimible + Guía de 30 Posiciones gratis</p>
              </div>

              <Button
                onClick={handleBuyClick}
                size="xl"
                variant="secondary"
                className="w-full sm:w-auto text-lg px-10 text-primary"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                LO QUIERO AHORA
              </Button>

              <p className="text-sm opacity-80 flex items-center justify-center gap-4 flex-wrap">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Acceso apenas confirmo tu pago</span>
                <span className="flex items-center gap-1"><InfinityIcon className="w-4 h-4" /> Uso ilimitado</span>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* ── Sticky móvil ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t shadow-2xl">
        <div className="px-3 py-2 flex items-center gap-2.5">
          <img src={portadaImage} alt="Emparejados" className="w-9 h-9 rounded object-cover flex-shrink-0" />
          <div className="flex-shrink-0 leading-tight">
            <div className="text-[0.65rem] text-muted-foreground line-through">${originalPrice.toFixed(2)}</div>
            <div className="text-base font-bold text-primary">${productPrice.toFixed(2)}</div>
          </div>
          <Button onClick={handleBuyClick} size="sm" variant="hero" className="flex-1 min-w-0">
            <ShoppingCart className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">LO QUIERO</span>
          </Button>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
        productPrice={productPrice}
        originalPrice={originalPrice}
        productImage={portadaImage}
        productId="emparejados"
        upsells={[
          { id: "torreNormal", name: "Torre La Previa (para grupos)", price: 10, image: torreNormalImgThumb },
          { id: "torrePicante", name: "Torre Picante (para grupos)", price: 10, image: torrePicanteImgThumb },
          { id: "torreParejas", name: "Torre de Shots Parejas", price: 10, image: torreParejasImgThumb },
          { id: "dadosPlacer", name: "Dados del Placer", price: 3.90, image: dadosDelPlacerImgThumb },
        ]}
      />
    </div>
  );
};

export default EmparejadosLanding;
