import { useState, useEffect, useRef } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Gift, Truck, Clock, Heart, Zap, CheckCircle2, Banknote, Flame, Users } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import { CarouselImage } from "@/components/CarouselImage";
import { TikTokCarrusel, type VideoTikTok } from "@/components/TikTokCarrusel";
import { useSlideActual } from "@/hooks/useSlideActual";
import { useRegaloDeHoy } from "@/hooks/useRegaloDeHoy";
import { trackViewContent, trackInitiateCheckout } from "@/lib/pixels";
import torrePicante1 from "@/assets/torre-picante-1.webp";
import torrePicante2 from "@/assets/torre-picante-2.webp";
import torrePicante3 from "@/assets/torre-picante-3.webp";
import torrePicante4 from "@/assets/torre-picante-4.webp";
import torrePicante5 from "@/assets/torre-picante-5.webp";
import torrePicante6 from "@/assets/torre-picante-6.webp";
import torrePicante7 from "@/assets/torre-picante-7.webp";
import torrePicante8 from "@/assets/torre-picante-8.webp";
import torrePicante9 from "@/assets/torre-picante-9.webp";
import torrePicante10 from "@/assets/torre-picante-10.webp";
import torreNormalImgThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import emparejadosPortadaThumb from "@/assets/thumbs/emparejados-portada.webp";

// Set de octubre 2026 (zip "Torre de Shots Picante"): 12 imágenes pensadas
// por slot — hero, problema, solución, 3 pasos, antes/después y fotos de la
// caja llegando. A diferencia de Torre Parejas V2, acá las imágenes NO traen
// el copy quemado: el texto va en HTML, sacado de la landing v1 que ya vende.
// Las fotos de la caja llegando (tpk2-08 a 12) tenían su sección "Así te
// llega"; se sacó porque repetía las mismas escenas que las fotos de las reseñas.
import imgHeroOferta from "@/assets/tpk2-00-hero-oferta.webp";
import imgProblema from "@/assets/tpk2-03-problema.webp";
import imgSolucion from "@/assets/tpk2-04-solucion.webp";
import imgPaso1 from "@/assets/tpk2-05-paso1-sacar.webp";
import imgPaso2 from "@/assets/tpk2-05-paso2-leer.webp";
import imgPaso3 from "@/assets/tpk2-05-paso3-cumplir.webp";
import imgSinTorre from "@/assets/tpk2-06-sin-torre.webp";
import imgConTorre from "@/assets/tpk2-07-con-torre.webp";
import imgResena1 from "@/assets/tpk2-resena-1.webp";
import imgResena2 from "@/assets/tpk2-resena-2.webp";
import imgResena3 from "@/assets/tpk2-resena-3.webp";
import imgResena4 from "@/assets/tpk2-resena-4.webp";

/** La imagen original de "cómo funciona" venía con los cuadros fuera de orden:
 *  en el primero ya tenía el bloque leído arriba de la torre y recién en el
 *  segundo lo sacaba. Se cortó en 3 y se reordenó al orden real del juego. */
const PASOS = [
  { src: imgPaso1, w: 1024, h: 504, t: "Saca un bloque", d: "Con cuidado: el que tumba la torre paga la penitencia final 💥", alt: "Sacando el bloque 'Beso de 3' de la torre" },
  { src: imgPaso2, w: 1024, h: 506, t: "Lee el reto en voz alta", d: "Y pon el bloque arriba de la torre, para que siga creciendo.", alt: "Leyendo el bloque 'Finge un orgasmo' antes de ponerlo arriba de la torre" },
  { src: imgPaso3, w: 1024, h: 515, t: "Lo cumples o tomas 3 shots 🍸", d: "Lo que no quieras hacer, no lo haces. Pero se paga.", alt: "Jugador celebrando con un shot al lado de la torre" },
];

/** Fotos reales de los bloques, las mismas de la v1. */
const RETOS_REALES = [
  { src: torrePicante1, badge: "Foto real 📸", alt: "Torre Picante - empaque principal" },
  { src: torrePicante2, badge: "Reto real 🔥", alt: "Por cada jugador que se saque una prenda tomas 1 shot" },
  { src: torrePicante3, badge: "Reto real 😈", alt: "Muestra tu ropa interior" },
  { src: torrePicante4, badge: "Reto real 🌶️", alt: "Sácale una prenda al jugador que quieras" },
  { src: torrePicante5, badge: "Reto real 🔥", alt: "Finge un orgasmo" },
  { src: torrePicante6, badge: "Reto real 💋", alt: "Besa apasionadamente durante 30 seg al jugador que quieras" },
  { src: torrePicante7, badge: "Reto real 😈", alt: "Beso de 3" },
  { src: torrePicante8, badge: "Reto real 🔥", alt: "Di tu fantasía sexual" },
  { src: torrePicante9, badge: "Reto real 🌶️", alt: "¿Tendrías algo con alguien de los presentes?" },
  { src: torrePicante10, badge: "Reto real 😈", alt: "Dale una nalgada a alguien del sexo opuesto" },
];

/** Reseñas de clientes de la Torre Picante, pasadas por Fabián el 2026-10-07.
 *  En esta landing reemplazan al carrusel de capturas de WhatsApp
 *  (`Testimonials`), que sigue en las demás. */
const RESENAS = [
  { foto: imgResena1, nombre: "Daniela M.", ciudad: "Guayaquil", texto: "Me llegó súper rápido y la caja vino en buen estado. Lo usamos el fin de semana con amigos y terminamos riéndonos demasiado 😂 Los retos sí están picantes, recomendado." },
  { foto: imgResena2, nombre: "Kevin R.", ciudad: "Quito", texto: "Pensé que iba a ser más tranquilo pero sí se pone bueno jajaja. La calidad de los bloques está mejor de lo que esperaba y llegó todo completo. Buen juego para una reunión." },
  { foto: imgResena3, nombre: "Sofía P.", ciudad: "Cuenca", texto: "Lo compré para una noche con amigos y nos encantó. Hay retos que dan mucha risa y otros que sí te hacen pensarlo dos veces 😅 Llegó bien empacado y sin problemas." },
  { foto: imgResena4, nombre: "Mateo C.", ciudad: "Machala", texto: "Llegó tal cual se ve en las fotos. Ya lo estrenamos y estuvo buenísimo, especialmente cuando ya llevábamos unas rondas 😂 Sí lo volvería a comprar para regalar." },
];

/** Videos de TikTok para la tira horizontal. Las portadas se bajan con
 *  `node scripts/tiktok-portadas.mjs <links>` y se importan de src/assets/tiktok.
 *  Mientras esté vacío, la sección no se pinta. */
const TIKTOKS: VideoTikTok[] = [];

const TorrePicanteV2Landing = () => {
  const productName = "Torre de Shots Picante";
  const productPrice = 29.99;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();
  const regalo = useRegaloDeHoy();

  // La barra de arriba es `fixed`: el espaciador se mide en vivo para que no
  // quede franja blanca ni tape el hero si el texto pasa a dos líneas.
  const barraRef = useRef<HTMLDivElement>(null);
  const [altoBarra, setAltoBarra] = useState(0);
  useEffect(() => {
    const el = barraRef.current;
    if (!el) return;
    const medir = () => setAltoBarra(el.getBoundingClientRect().height);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // El carrusel de retos baja solo la foto que está a la vista.
  const [apiRetos, setApiRetos] = useState<CarouselApi>();
  const slideRetos = useSlideActual(apiRetos);

  useEffect(() => {
    if (shouldOpenCheckout) {
      setCheckoutOpen(true);
      setShouldOpenCheckout(false);
    }
  }, [shouldOpenCheckout, setShouldOpenCheckout]);

  useEffect(() => {
    trackViewContent({
      content_name: productName,
      content_category: 'Juegos de Mesa',
      value: productPrice,
    });
  }, []);

  const handleBuyClick = () => {
    trackInitiateCheckout({
      content_name: productName,
      content_category: 'Juegos de Mesa',
      value: productPrice,
    });
    setCheckoutOpen(true);
  };

  const CLAIMS = [
    { Icono: Banknote, titulo: "Pagas al recibir", pie: "En efectivo, en tu puerta" },
    { Icono: Truck, titulo: "Envío gratis", pie: "A todo Ecuador" },
    { Icono: Gift, titulo: "Ebook de regalo", pie: "25 juegos" },
  ];

  /** Mismo criterio que Torre Parejas V2:
   *  - "completo": solo el primer CTA. Precio en el botón, los 3 badges y el reloj.
   *  - "simple": los de más abajo, solo el botón, y ocultos en móvil porque
   *    ahí la barra fija de abajo ya lleva el botón de compra. */
  const Cta = ({ texto, variante = "simple" }: { texto: string; variante?: "completo" | "simple" }) => (
    <div
      className={
        variante === "completo"
          ? "container mx-auto px-4 py-6 md:py-8"
          : "container mx-auto hidden px-4 py-8 md:block md:py-10"
      }
    >
      <div className="max-w-xl mx-auto space-y-4">
        <Button
          onClick={handleBuyClick}
          size="lg"
          className="flex h-auto w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] hover:from-[#ff3d00]/90 hover:to-[#ff7b00]/90 text-white text-base md:text-2xl font-bold py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
        >
          <span className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            {texto}
          </span>
          {variante === "completo" && (
            <span className="rounded-lg bg-white/25 px-2.5 py-0.5 text-lg md:text-2xl tabular-nums">
              ${productPrice.toFixed(2)}
            </span>
          )}
        </Button>

        {variante === "completo" && (
          <>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {CLAIMS.map(({ Icono, titulo, pie }) => (
                <div
                  key={titulo}
                  className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-[#ff3d00]/25 bg-[#ff3d00]/5 px-2 py-3 text-center md:py-4"
                >
                  <Icono className="h-5 w-5 md:h-6 md:w-6 text-[#ff3d00]" />
                  <p className="text-[11px] md:text-sm font-bold leading-tight">{titulo}</p>
                  <p className="text-[10px] md:text-xs leading-tight text-muted-foreground">{pie}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-center">
              <Clock className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-[11px] md:text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                El regalo se cierra en{" "}
                <span className="tabular-nums">{regalo.restante}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const faqs = [
    {
      q: "¿Llega en empaque discreto?",
      a: "Sí. El paquete llega sellado y sin ninguna referencia al contenido por fuera. Nadie sabe qué hay adentro más que tu grupo.",
    },
    {
      q: "¿De qué material es? ¿Aguanta que se derrame trago encima?",
      a: "Es madera de pino 100% premium, lijada y sellada. Se puede mojar y no se daña ni se borra el texto de los bloques. Es un juego de shots — está hecha para eso.",
    },
    {
      q: "¿Cuánto tarda en llegar?",
      a: "Entre 2 y 4 días hábiles a todo Ecuador. Si pides antes de las 3 de la tarde, sale el mismo día.",
    },
    {
      q: "¿Tengo que pagar por adelantado?",
      a: "No. Pagas todo en efectivo cuando el paquete llega a tu puerta. Para confirmar el pedido solo te llevamos a WhatsApp con el mensaje ya escrito: lo envías y listo, no adelantas nada.",
    },
    {
      q: "¿Qué tan fuertes son los retos?",
      a: "Más atrevidos que La Previa, pensados para un grupo con confianza. Nadie está obligado a nada — lo que no quieran hacer, no lo hacen, y siguen jugando.",
    },
    {
      q: "¿Para cuántas personas sirve?",
      a: "La caja dice para 2 o más, pero se disfruta de verdad desde 3 en adelante, sin límite. Entre más grande el grupo, más se arma.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <Seo
        title="Torre de Shots Picante 🌶️ - Retos Atrevidos | ShotyGames Ecuador"
        description="51 retos atrevidos para grupos con confianza. Madera de pino premium. Pagas en efectivo al recibir. Envío gratis a todo Ecuador."
        canonical="https://www.shotygames.com/landing/torre-picante-v2"
        image={`https://www.shotygames.com${torrePicante1}`}
        type="product"
      />

      {/* Barra fija: mata las 2 objeciones más grandes en el primer segundo */}
      <div
        ref={barraRef}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] text-white py-3 md:py-3.5 px-4 text-center font-semibold shadow-lg"
      >
        <p className="text-[13px] md:text-base leading-snug">
          💵 Pagas al recibir · 🎁 Ebook GRATIS hoy, cierra en{" "}
          <strong className="tabular-nums">{regalo.restante}</strong>
        </p>
      </div>
      <div style={{ height: altoBarra }} aria-hidden />

      {/* ---------- HERO ----------
          Póster completo: titular, precio, envío, contraentrega y regalo van
          dibujados en la imagen, así que acá no se repiten en HTML. Va a sangre
          en móvil, como las piezas de Torre Parejas V2. */}
      <section className="bg-gradient-to-br from-background to-muted/30">
        <h1 className="sr-only">
          Torre de Shots Picante: sube la temperatura de la noche. Hoy $29.99 con envío gratis y pago contraentrega.
        </h1>
        <div className="mx-auto max-w-xl">
          <img
            src={imgHeroOferta}
            alt="Sube la temperatura de la noche. Torre de Shots Picante hoy a $29.99, envío gratis, pago contraentrega y ebook de 25 juegos para fiestas de regalo."
            width={941}
            height={1672}
            loading="eager"
            // Es el LCP. En minúscula porque React 18 no reconoce `fetchPriority`.
            {...{ fetchpriority: "high" }}
            decoding="sync"
            className="w-full h-auto"
          />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            {/* Prueba social temprana: valida antes de pedir nada */}
            <div className="flex flex-col items-center gap-1.5 mt-5">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#ff3d00] text-[#ff3d00]" />
                ))}
              </div>
              <p className="text-sm md:text-base font-semibold text-center">
                +3.500 clientes en Ecuador ya la tienen en su casa
              </p>
            </div>
          </div>
        </div>

        <Cta texto="LA QUIERO EN MI CASA" variante="completo" />
      </section>

      {/* ---------- EL PROBLEMA, AGITADO ---------- */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src={imgProblema}
                alt="Un invitado aburrido en una previa que no arranca"
                width={1080}
                height={1080}
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
              />
            </div>
            <div className="text-center md:text-left space-y-3 md:space-y-4">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Se juntan, ponen música, y a la hora ya no saben qué más hacer.
              </h2>
              <div className="text-base md:text-lg text-muted-foreground space-y-3">
                <p>
                  Nadie quiere ser el aburrido, pero tampoco el que propone algo y queda en silencio.
                  Y la previa se apaga antes de arrancar de verdad.
                </p>
                <p>No faltan ganas. Falta algo que rompa el hielo por ustedes.</p>
              </div>
              <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] bg-clip-text text-transparent">
                Alguien tiene que sacar el primer bloque.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ANTES / DESPUES ----------
          Misma mesa, misma gente: lo único que cambia es la torre. */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2">
                La misma mesa. La misma gente.
              </h2>
              <p className="text-base md:text-xl text-muted-foreground">
                Lo único que cambió es lo que pusieron encima.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              <figure className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={imgSinTorre}
                    alt="Tres amigos aburridos en la mesa, sin la torre"
                    width={680}
                    height={768}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto grayscale-[35%]"
                  />
                  <Badge className="absolute top-2 left-2 md:top-3 md:left-3 bg-black/70 text-white border-none text-xs md:text-sm">
                    Sin la torre 😐
                  </Badge>
                </div>
              </figure>
              <figure className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden shadow-xl ring-4 ring-[#ff3d00]/60">
                  <img
                    src={imgConTorre}
                    alt="Los mismos amigos riéndose mientras juegan la Torre de Shots Picante"
                    width={680}
                    height={768}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto"
                  />
                  <Badge className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#ff3d00] text-white border-none text-xs md:text-sm">
                    Con la torre 🔥
                  </Badge>
                </div>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- LA SOLUCION + MECANISMO UNICO ---------- */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center mb-8 md:mb-10">
              <div className="text-center md:text-left order-2 md:order-1">
                <h2 className="text-2xl md:text-4xl font-bold mb-3">
                  Se arma en la mesa en 2 minutos
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  Cada bloque tiene un reto distinto. Sacan uno, lo cumplen, siguen.
                  Lo que empieza incómodo termina en risas — y ninguna previa sale igual.
                </p>
              </div>
              <div className="order-1 md:order-2 rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto w-full">
                <img
                  src={imgSolucion}
                  alt="Torre de Shots Picante: diversión en grupo, súper picante, ideal para fiestas, regalo original"
                  width={1080}
                  height={1440}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Mecanismo único: por qué ESTA torre y no cualquier jenga */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              <Card className="p-5 md:p-6 border-2 border-[#ff3d00]/20 hover:shadow-xl transition-all">
                <div className="p-3 rounded-full bg-[#ff3d00]/10 w-fit mb-4">
                  <Flame className="w-6 h-6 text-[#ff3d00]" />
                </div>
                <h3 className="font-bold text-base md:text-lg mb-2">Aguanta que le derramen encima</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Madera de pino 100% premium, lijada y sellada. Se puede mojar y
                  <strong className="text-foreground"> no se daña ni se borra el texto</strong>.
                  Es un juego de shots: está hecha para eso.
                </p>
              </Card>

              <Card className="p-5 md:p-6 border-2 border-[#ff3d00]/20 hover:shadow-xl transition-all">
                <div className="p-3 rounded-full bg-[#ff3d00]/10 w-fit mb-4">
                  <Zap className="w-6 h-6 text-[#ff3d00]" />
                </div>
                <h3 className="font-bold text-base md:text-lg mb-2">51 retos más atrevidos que la Normal</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Suben de intensidad más rápido, pensados para un grupo con confianza.
                  <strong className="text-foreground"> Lo que no quieran hacer, no lo hacen</strong> —
                  y siguen jugando igual.
                </p>
              </Card>

              <Card className="p-5 md:p-6 border-2 border-[#ff3d00]/20 hover:shadow-xl transition-all">
                <div className="p-3 rounded-full bg-[#ff3d00]/10 w-fit mb-4">
                  <Users className="w-6 h-6 text-[#ff3d00]" />
                </div>
                <h3 className="font-bold text-base md:text-lg mb-2">Hecha en Ecuador 🇪🇨</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Producida y armada acá, no importada genérica.
                  Los retos están escritos <strong className="text-foreground">como hablamos nosotros</strong>,
                  no traducidos.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- COMO SE JUEGA: los 3 cuadros, en orden ---------- */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-10">
              Cómo se juega
            </h2>
            <ol className="space-y-6 md:space-y-8">
              {PASOS.map((paso, i) => (
                <li key={i} className="rounded-2xl overflow-hidden shadow-xl border-2 border-[#ff3d00]/15 bg-card">
                  <img
                    src={paso.src}
                    alt={paso.alt}
                    width={paso.w}
                    height={paso.h}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto"
                  />
                  <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] text-white font-bold text-lg md:text-xl flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-base md:text-xl">{paso.t}</p>
                      <p className="text-sm md:text-base text-muted-foreground">{paso.d}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- RETOS REALES ---------- */}
      <section className="py-10 md:py-14 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-2">
                Fotos reales, no render
              </p>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-3">
                Algunos de los retos que trae
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground">
                Son <strong className="text-foreground">51 bloques</strong> en total. Acá va una muestra,
                fotografiada bloque por bloque.
              </p>
            </div>

            <Carousel opts={{ align: "center", loop: true }} setApi={setApiRetos} className="w-full">
              <CarouselContent>
                {RETOS_REALES.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
                      {/* index+1: el índice 0 de CarouselImage se carga con prioridad
                          de LCP, y acá el LCP ya es el hero. */}
                      <CarouselImage
                        src={image.src}
                        alt={image.alt}
                        index={index + 1}
                        current={slideRetos + 1}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-4 right-4 bg-[#ff3d00] text-white border-none text-sm md:text-base px-3 py-1">
                        {image.badge}
                      </Badge>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 md:left-4" />
              <CarouselNext className="right-2 md:right-4" />
            </Carousel>
            <div className="text-center mt-3 text-sm text-muted-foreground">
              👉 Desliza para ver más retos reales
            </div>
          </div>
        </div>
      </section>

      <Cta texto="PEDIR LA MÍA AHORA" />

      {/* ---------- QUE INCLUYE ---------- */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#ff3d00]/5 to-[#ff7b00]/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-10">
              Qué llega a tu puerta
            </h2>
            <Card className="p-6 md:p-8 border-2 border-[#ff7b00]/20 shadow-xl">
              <div className="space-y-4">
                {[
                  { t: "51 bloques de madera con retos", d: "Cada uno con un reto atrevido distinto" },
                  { t: "1 vaso tequilero", d: "Incluido en la caja" },
                  { t: "Instrucciones de juego", d: "Para que arranquen sin dudas" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-[#ff3d00] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-base md:text-lg">{item.t}</p>
                      <p className="text-sm md:text-base text-muted-foreground">{item.d}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-4 pt-4 border-t-2 border-dashed border-[#ff3d00]/30">
                  <Gift className="w-6 h-6 text-[#ff3d00] flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <div className="font-bold text-base md:text-lg">
                      Ebook de 25 Juegos para Fiestas
                      <Badge className="ml-2 bg-[#ff3d00] text-white align-middle">DE REGALO</Badge>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Viene dentro de la caja, en una tarjeta con código QR. Sin costo extra.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ---------- VIDEOS DE TIKTOK ---------- */}
      {TIKTOKS.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center max-w-xl mx-auto mb-6 md:mb-8">
                <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#ff3d00] uppercase mb-2">
                  Videos de TikTok
                </p>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                  Míralo en acción
                </h2>
              </div>
              <TikTokCarrusel videos={TIKTOKS} />
              <p className="text-center text-xs text-muted-foreground mt-2 md:hidden">
                👉 Desliza y toca para reproducir
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ---------- PRUEBA SOCIAL ----------
          Tira horizontal en móvil (una reseña y media a la vista), 4 columnas
          en escritorio. */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-6 md:mb-10">
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 md:w-7 md:h-7 fill-[#ff3d00] text-[#ff3d00]" />
                ))}
              </div>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2">
                Lo que dicen los que ya la tienen
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground">
                +3.500 clientes en Ecuador
              </p>
            </div>

            <div className="-mx-4 px-4 flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
              {RESENAS.map((r) => (
                <article
                  key={r.nombre}
                  className="snap-center shrink-0 w-[80%] sm:w-[46%] md:w-auto flex flex-col rounded-2xl overflow-hidden bg-card border shadow-lg"
                >
                  <img
                    src={r.foto}
                    alt={`Torre de Shots Picante recibida por ${r.nombre} en ${r.ciudad}`}
                    width={720}
                    height={960}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
                    <div className="flex items-center gap-0.5" aria-label="5 de 5 estrellas">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#ff3d00] text-[#ff3d00]" />
                      ))}
                    </div>
                    <p className="flex-1 text-sm md:text-base leading-relaxed">“{r.texto}”</p>
                    <p className="text-sm font-bold">
                      {r.nombre} <span className="font-normal text-muted-foreground">— {r.ciudad}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2 md:hidden">
              👉 Desliza para ver más reseñas
            </p>
          </div>
        </div>
      </section>

      {/* ---------- LA OFERTA: recién acá aparece el desglose ---------- */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] opacity-95"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <Badge className="bg-white text-[#ff3d00] text-sm md:text-base px-4 py-1.5 mb-4 font-bold">
              🎁 REGALO SOLO POR LOS PEDIDOS DE HOY
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 leading-tight">
              Hoy no llevas solo la torre
            </h2>

            <div className="bg-black/25 backdrop-blur-sm p-6 md:p-8 rounded-2xl border-2 border-white/30 space-y-5">
              {/* Desglose de valor: todo real, nada inventado */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    Torre Picante + vaso tequilero
                  </span>
                  <span className="font-semibold whitespace-nowrap">$29.99</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                  <span className="flex items-center gap-2">
                    <Gift className="w-5 h-5 flex-shrink-0 text-yellow-300" />
                    Ebook de 25 Juegos para Fiestas
                  </span>
                  <span className="font-bold text-yellow-300 whitespace-nowrap">
                    <span className="text-white/60 line-through mr-2 font-normal">$4.90</span>GRATIS
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                  <span className="flex items-center gap-2">
                    <Truck className="w-5 h-5 flex-shrink-0" />
                    Envío a todo Ecuador
                  </span>
                  <span className="font-bold whitespace-nowrap">GRATIS</span>
                </div>
              </div>

              <div className="h-px bg-white/25"></div>

              <div>
                <p className="text-base md:text-lg text-white/80 mb-1">Hoy pagas</p>
                <p className="text-5xl md:text-7xl font-bold">$29.99</p>
              </div>

              <div className="bg-yellow-300/15 border border-yellow-300/40 rounded-xl p-4 md:p-5 space-y-3">
                <p className="text-sm md:text-base text-yellow-100">
                  🎁 <strong className="text-yellow-300">El Ebook de 25 Juegos va incluido en los pedidos de hoy.</strong>{" "}
                  Viene dentro de la caja, en una tarjeta con código QR para descargarlo.
                </p>
                <div className="border-t border-yellow-300/30 pt-3">
                  <p className="text-xs md:text-sm text-yellow-100/80 uppercase tracking-wider mb-1">
                    El regalo se cierra en
                  </p>
                  <p className="text-3xl md:text-5xl font-bold text-yellow-300 tabular-nums leading-none">
                    {regalo.restante}
                  </p>
                </div>
              </div>

              <p className="text-lg md:text-2xl font-bold">
                Pagas cuando la tengas en la mano 💵
              </p>

              <Button
                onClick={handleBuyClick}
                size="lg"
                className="w-full bg-white text-[#ff3d00] hover:bg-white/90 text-lg md:text-2xl font-bold py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                PEDIR LA MÍA CON EL REGALO
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- OBJECIONES / FAQ ---------- */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-10">
              Lo que todos preguntan antes de pedir
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-base md:text-lg font-semibold">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ---------- REDUCCION DE RIESGO ---------- */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-10">
              Comprar es simple
            </h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-6 text-center border-2 border-green-500/30 bg-green-500/5">
                <Banknote className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <p className="font-bold text-base md:text-lg mb-1">Pago contraentrega</p>
                <p className="text-sm text-muted-foreground">
                  Pagas en efectivo cuando el paquete llega a tu puerta. Confirmas por WhatsApp con un mensaje ya escrito.
                </p>
              </Card>
              <Card className="p-6 text-center border-2 border-[#ff3d00]/20">
                <Truck className="w-10 h-10 text-[#ff3d00] mx-auto mb-3" />
                <p className="font-bold text-base md:text-lg mb-1">Envío gratis</p>
                <p className="text-sm text-muted-foreground">
                  A todo Ecuador vía Servientrega. El envío ya está incluido en el precio.
                </p>
              </Card>
              <Card className="p-6 text-center border-2 border-[#ff3d00]/20">
                <Heart className="w-10 h-10 text-[#ff3d00] mx-auto mb-3" />
                <p className="font-bold text-base md:text-lg mb-1">Empaque discreto</p>
                <p className="text-sm text-muted-foreground">
                  Llega sellado y sin referencias al contenido por fuera. Nadie sabe qué hay adentro.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff3d00] via-[#ff7b00] to-[#ff3d00] opacity-95"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white space-y-5 md:space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold leading-tight">
              La próxima previa puede ser igual a todas las anteriores
            </h2>
            <p className="text-base md:text-xl text-white/90">
              O puede ser la que todos recuerden. La torre llega en 2-4 días hábiles:
              pagas cuando la tengas en la mano.
            </p>
            <p className="text-base md:text-lg font-semibold text-yellow-300">
              🎁 Si pides hoy, el Ebook de 25 Juegos va incluido —{" "}
              <span className="tabular-nums">quedan {regalo.restante}</span>
            </p>

            <Button
              onClick={handleBuyClick}
              size="lg"
              className="w-full md:w-auto bg-white text-[#ff3d00] hover:bg-white/90 text-lg md:text-2xl font-bold px-8 md:px-14 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              PEDIR MI TORRE PICANTE
            </Button>

            <p className="text-xs md:text-sm text-white/80">
              💵 Pagas al recibir · 🚚 Envío gratis · 🎁 Ebook de 25 juegos
            </p>
          </div>
        </div>
      </section>

      {/* ---------- STICKY MOBILE ---------- */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
        <div className="bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] px-3 pb-3 pt-2 shadow-2xl">
          <p className="text-center text-[11px] font-semibold text-white/95 mb-1.5">
            🎁 Ebook de 25 Juegos gratis · cierra en{" "}
            <span className="tabular-nums font-bold">{regalo.restante}</span>
          </p>
          <Button onClick={handleBuyClick} size="lg" className="w-full bg-white text-[#ff3d00] hover:bg-white/90 font-bold text-base py-6 rounded-xl shadow-xl">
            <ShoppingCart className="mr-2 h-5 w-5" />
            LA QUIERO CON EL REGALO
          </Button>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
        productPrice={productPrice}
        productImage={torrePicante1}
        productId="torrePicante"
        upsells={[
          { id: 'torreNormal', name: 'Torre La Previa (para grupos)', price: 10, image: torreNormalImgThumb },
          { id: 'torreParejas', name: 'Torre de Shots Parejas', price: 10, image: torreParejasImgThumb },
          { id: 'dadosPlacer', name: 'Dados del Placer', price: 5, image: dadosDelPlacerImgThumb },
          { id: 'emparejados', name: 'Emparejados (juego digital)', price: 2.90, image: emparejadosPortadaThumb },
        ]}
      />
    </div>
  );
};

export default TorrePicanteV2Landing;
