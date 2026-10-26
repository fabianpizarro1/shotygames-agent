import { useState, useEffect, useRef, type ReactNode } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { useRestanteRegalo } from "@/hooks/useRegaloDeHoy";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import Testimonials from "@/components/Testimonials";
import { CarouselImage } from "@/components/CarouselImage";
import { useSlideActual } from "@/hooks/useSlideActual";
import { trackViewContent, trackInitiateCheckout } from "@/lib/pixels";
import {
  Star, Gift, Truck, Clock, Banknote, CheckCircle2, Droplets, Users, MapPin,
  ClipboardList, MessageCircle, PartyPopper,
} from "lucide-react";
import torreNormal1 from "@/assets/torre-normal-brillo.webp";
import torreNormal2 from "@/assets/torre-normal-2.webp";
import torreNormal3 from "@/assets/torre-normal-3.webp";
import torreNormal4 from "@/assets/torre-normal-4.webp";
import torreNormal5 from "@/assets/torre-normal-5.webp";
import torreNormal6 from "@/assets/torre-normal-6.webp";
import torreNormal7 from "@/assets/torre-normal-7.webp";
import torreNormal8 from "@/assets/torre-normal-8.webp";
import torreNormal9 from "@/assets/torre-normal-9.webp";
import torreNormal10 from "@/assets/torre-normal-10.webp";
import lifeFiesta from "@/assets/torre-normal-life-fiesta.webp";
import lifeRonda from "@/assets/torre-normal-life-ronda.webp";
import imgEbook from "@/assets/ebook-25-juegos-portada.webp";
import imgEbook420 from "@/assets/ebook-25-juegos-portada-420.webp";
import imgEbookEjemplo from "@/assets/ebook-25-juegos-ejemplo.webp";
import torrePicanteImgThumb from "@/assets/thumbs/torre-picante.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import emparejadosPortadaThumb from "@/assets/thumbs/emparejados-portada.webp";

// Vive en /landing/torre-normal-v2. La que sigue vendiendo (y recibiendo los
// anuncios) es /landing/torre-normal: ésta es la variante para comparar.
// 2026-10-25: copy del documento "Reescribir landing de ventas" de la IA externa,
// filtrado con las decisiones de Fabián — ruta nueva, los claims del producto
// (pino premium, sellado, no se borra el texto, se puede mojar) se quedan, y
// con contador del regalo como en la Picante. Lo que ese documento pedía quitar
// y NO se quitó: +3.500 clientes y las capturas (regla del 12-oct), el ancla de
// $4.90 de la guía (es el precio real de Ebook25JuegosLanding), "2 a 4 días" y
// el "envío gratis a todo Ecuador". La foto lifestyle `torre-normal-life-producto`
// ya no se usa: muestra 2 vasos (se vende 1) y la caja dice "Blaques con retas".
// OJO: el nombre del producto no se toca — n8n (PEDIDOS WEB LOVABLE) lo compara exacto.
const PRODUCT_NAME = "Torre La Previa";
const PRECIO = 29.99;
const PRECIO_TXT = `$${PRECIO.toFixed(2)}`;

const GRADIENTE = "bg-gradient-to-r from-[#ff3d00] to-[#ff7b00]";

// Primero la foto del producto y los 3 retos que mejor se entienden de un
// vistazo (ex, WhatsApp, mandarina); después el resto.
const FOTOS = [
  { src: torreNormal1, badge: "Foto real 📸", alt: "Torre La Previa: caja, 1 vaso de shot y 51 bloques con retos" },
  { src: torreNormal2, badge: "Reto real 🔥", alt: "Bloque real: Llama a tu ex" },
  { src: torreNormal9, badge: "Reto real 📱", alt: "Bloque real: Muestra tu último mensaje de WhatsApp" },
  { src: torreNormal7, badge: "Reto real 🍊", alt: "Bloque real: Toma el más mandarina" },
  { src: torreNormal3, badge: "Reto real 😱", alt: "Bloque real: Toma 1 shot por cada ex que tengas" },
  { src: torreNormal4, badge: "Reto real 🍹", alt: "Bloque real: Toma 1 shot por cada vez que te pusieron los cachos" },
  { src: torreNormal5, badge: "Reto real 😈", alt: "Bloque real: Toma el más cachud@" },
  { src: torreNormal6, badge: "Reto real 🌶️", alt: "Bloque real: Toma el más tóxico/a" },
  { src: torreNormal8, badge: "Reto real 👴", alt: "Bloque real: Escríbeles a tus padres y diles que serán abuelos" },
  { src: torreNormal10, badge: "Reto real 📸", alt: "Bloque real: Sube una historia y pon que extrañas a tu ex" },
];

const PASOS_JUEGO = [
  { n: "1", t: "Arman la torre" },
  { n: "2", t: "Sacan un bloque y leen el reto" },
  { n: "3", t: "Lo cumplen o toman 3 shots 🍸" },
  { n: "4", t: "El que la tumba paga la penitencia final 💥" },
];

const PASOS_PEDIDO = [
  { Icono: ClipboardList, t: "Completa tu pedido", d: "Déjanos tus datos y dirección de entrega." },
  { Icono: MessageCircle, t: "Confirma por WhatsApp", d: "Te llevamos a WhatsApp con el mensaje ya escrito: solo envíalo para confirmar." },
  { Icono: PartyPopper, t: "Recibe y paga", d: "Recibe La Previa con tu vaso, las instrucciones y el QR de tu guía digital. Pagas en efectivo al recibir." },
];

const FAQS = [
  {
    q: "¿Qué es La Previa?",
    a: "Es nuestra Torre de Shots versión Normal (así la verás escrita en la caja): una torre de 51 bloques de madera con retos para jugar entre amigos. En cada turno sacan un bloque, leen el reto y siguen las instrucciones del juego.",
  },
  {
    q: "¿Es muy fuerte? ¿Para qué grupo sirve?",
    a: "Es la versión más suave de las tres: los retos son para reírse, sin nada subido de tono. Eso sí, es un juego para adultos (+18) y algunos retos hablan de ex, mensajes y bromas personales: mira los ejemplos de esta página para ver si encaja con tu grupo.",
  },
  {
    q: "¿De qué material es? ¿Aguanta que se derrame trago encima?",
    a: "Es madera de pino 100% premium, lijada y sellada. Se puede mojar y no se daña ni se borra el texto de los bloques. Es un juego de shots — está hecha para eso.",
  },
  {
    q: "¿Qué incluye mi pedido?",
    a: "La torre de 51 bloques, 1 vaso tequilero y las instrucciones de juego. Por pedir hoy también recibes gratis la Guía Digital de 25 Juegos para Fiestas.",
  },
  {
    q: "¿La guía es un libro físico?",
    a: "No. Es digital: dentro de la caja viene una tarjeta con código QR para descargarla en tu celular. Sin costo extra.",
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
    q: "¿Para cuántas personas sirve?",
    a: "La caja dice para 2 o más, pero se disfruta de verdad desde 3 en adelante, sin límite. Entre más grande el grupo, más se arma.",
  },
  {
    q: "¿Es obligatorio tomar alcohol?",
    a: "No. Pueden adaptar la dinámica y disfrutar del juego sin bebidas alcohólicas.",
  },
  {
    q: "¿Es lo mismo que la Torre Picante? ¿Y si quiero algo más atrevido?",
    a: "No. La Previa es la más suave: bromas y retos entre amigos. Si quieres algo más atrevido tenemos la Torre Picante (retos más subidos de tono para grupos con confianza) y la Torre Parejas (solo para dos). Puedes agregarlas a tu pedido al momento de comprar y te sale más barato que pedirlas por separado.",
  },
];

const Seccion = ({ children, className = "", ancho = "max-w-5xl" }: { children: ReactNode; className?: string; ancho?: string }) => (
  <section className={`px-4 py-10 md:py-16 ${className}`}>
    <div className={`mx-auto ${ancho}`}>{children}</div>
  </section>
);

const H2 = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2 className={`text-2xl md:text-4xl font-bold leading-tight ${className}`}>{children}</h2>
);

// Todo lo que se repinta o recibe toques va FUERA del componente de la página:
// definido adentro es un tipo nuevo en cada render y React desmontaba los
// botones en cada tick del contador (un toque justo ahí se perdía).
const CtaBoton = ({ texto, onClick, variante = "lleno" }: { texto: string; onClick: () => void; variante?: "lleno" | "blanco" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full min-h-[56px] rounded-xl px-5 py-4 text-[16px] md:text-xl font-bold leading-tight tracking-wide shadow-2xl transition-transform duration-150 ease-out active:scale-[0.97] motion-safe:[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02] ${
      variante === "lleno" ? `${GRADIENTE} text-white` : "bg-white text-[#ff3d00] hover:bg-white/90"
    }`}
  >
    {texto}
  </button>
);

// En móvil el icono va al lado del texto (3 tarjetas apiladas con el icono arriba
// ocupaban casi una pantalla entera); desde md vuelve a ir arriba.
const Ventaja = ({ Icono, titulo, children }: { Icono: typeof Droplets; titulo: ReactNode; children: ReactNode }) => (
  <Card className="flex gap-4 border-2 border-[#ff3d00]/20 p-4 md:block md:p-6">
    <div className="h-fit w-fit shrink-0 rounded-full bg-[#ff3d00]/10 p-3 md:mb-4">
      <Icono className="h-6 w-6 text-[#ff3d00]" aria-hidden="true" />
    </div>
    <div>
      <h3 className="mb-1 text-base font-bold md:mb-2 md:text-lg">{titulo}</h3>
      <p className="text-sm text-muted-foreground md:text-base">{children}</p>
    </div>
  </Card>
);

// Cada reloj se suscribe solo (useRestanteRegalo): la página no re-renderiza.
const RelojRegalo = ({ className = "" }: { className?: string }) => {
  const restante = useRestanteRegalo();
  return (
    <p className={`flex items-center justify-center gap-1.5 text-[13px] md:text-sm font-semibold ${className}`}>
      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        El regalo se cierra en <span className="tabular-nums font-bold">{restante}</span>
      </span>
    </p>
  );
};

const BarraFija = ({ visible, onClick }: { visible: boolean; onClick: () => void }) => {
  const restante = useRestanteRegalo();
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className={`${GRADIENTE} px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl`}>
        <p className="mb-1.5 text-center text-[12px] font-semibold text-yellow-100">
          🎁 Guía de 25 juegos gratis · cierra en <span className="tabular-nums font-bold">{restante}</span>
        </p>
        <button
          type="button"
          onClick={onClick}
          tabIndex={visible ? 0 : -1}
          className="flex w-full min-h-[52px] flex-col items-center justify-center rounded-xl bg-white font-bold leading-tight text-[#ff3d00] shadow-xl transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <span className="text-[16px]">PEDIR CON REGALO</span>
          <span className="text-[12px] font-semibold text-[#ff3d00]/80">{PRECIO_TXT} · Envío gratis · Pagas al recibir</span>
        </button>
      </div>
    </div>
  );
};

const TorreNormalV2Landing = () => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();

  // Para saber qué foto del carrusel está a la vista y no bajar las otras 9.
  const [api, setApi] = useState<CarouselApi>();
  const slideActual = useSlideActual(api);

  // La barra de abajo solo aparece cuando el CTA del hero ya salió de pantalla:
  // el hero ya trae botón, precio y regalo en el primer pantallazo y dos botones
  // juntos compiten. Arranca escondida (en este hero el CTA se ve desde el
  // inicio); si el navegador no tiene IntersectionObserver, queda siempre visible.
  const ctaHeroRef = useRef<HTMLDivElement>(null);
  const [mostrarBarra, setMostrarBarra] = useState(false);
  useEffect(() => {
    const el = ctaHeroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setMostrarBarra(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setMostrarBarra(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (shouldOpenCheckout) {
      setCheckoutOpen(true);
      setShouldOpenCheckout(false);
    }
  }, [shouldOpenCheckout, setShouldOpenCheckout]);

  useEffect(() => {
    trackViewContent({ content_name: PRODUCT_NAME, content_category: "Juegos de Mesa", value: PRECIO });
  }, []);

  const handleBuyClick = () => {
    trackInitiateCheckout({ content_name: PRODUCT_NAME, content_category: "Juegos de Mesa", value: PRECIO });
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <Seo
        title="Torre La Previa: juego de retos para amigos | ShotyGames Ecuador"
        description="51 bloques con retos para tu próxima reunión. Torre La Previa por $29.99, envío gratis a todo Ecuador y pago al recibir. Pide hoy y recibe una guía digital de regalo."
        canonical="https://www.shotygames.com/landing/torre-normal-v2"
        image={`https://www.shotygames.com${torreNormal1}`}
        type="product"
      />

      {/* ---------- BARRA DE CONFIANZA ---------- */}
      <div className={`sticky top-0 z-50 ${GRADIENTE} px-4 py-2 md:py-3 text-center font-semibold text-white shadow-lg`}>
        <p className="text-[11px] md:text-base leading-tight">💵 Pagas al recibir · 🚚 Envío gratis a todo Ecuador</p>
      </div>

      {/* ---------- HERO: qué es, cuánto cuesta, qué regalo y botón en el primer pantallazo ---------- */}
      <section className="bg-gradient-to-br from-background to-muted/30 px-4 pt-5 pb-10 md:py-14">
        <div className="mx-auto max-w-5xl md:grid md:grid-cols-2 md:items-center md:gap-x-12">
          <div>
            <p className="mb-2 text-[12px] md:text-sm font-bold uppercase tracking-[0.14em] text-[#ff3d00]">
              La Previa · juego de retos para amigos
            </p>
            <h1 className="text-[30px] leading-[1.1] md:text-5xl font-bold tracking-tight">
              Tú llevas la torre.{" "}
              <span className={`block ${GRADIENTE} bg-clip-text text-transparent`}>El grupo pone las anécdotas.</span>
            </h1>
            <p className="mt-3 text-[15px] md:text-xl text-muted-foreground">
              51 bloques de madera con retos para jugar entre amigos. Sacan uno, leen lo que les tocó y empieza la
              parte de la reunión que van a querer contar.
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {["Retos ya escritos", "Fácil de aprender"].map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ff3d00]/25 bg-[#ff3d00]/5 px-3 py-1.5 text-[13px] md:text-sm font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#ff3d00]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border-2 border-[#ff3d00]/20 bg-white px-4 py-3 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm md:text-base font-bold uppercase tracking-wide">Torre La Previa</p>
                <p className="text-[13px] text-muted-foreground">51 bloques + vaso tequilero</p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-green-700">
                  <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Envío gratis
                </p>
              </div>
              <p className="text-[32px] min-[360px]:text-[38px] md:text-[46px] font-bold leading-none tabular-nums text-[#ff3d00]">{PRECIO_TXT}</p>
            </div>

            <div className="mt-3 rounded-xl border-2 border-yellow-400/60 bg-yellow-50 px-4 py-2.5 text-center">
              <p className="text-[14px] md:text-base font-semibold text-yellow-900">
                🎁 Pide hoy y recibe <strong>GRATIS</strong> la Guía Digital de 25 Juegos para Fiestas
              </p>
              <RelojRegalo className="mt-1 text-amber-700" />
            </div>

            <div ref={ctaHeroRef} className="mt-4">
              <CtaBoton texto="QUIERO MI TORRE + GUÍA GRATIS" onClick={handleBuyClick} />
            </div>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              Sin pago anticipado: confirmas por WhatsApp con un mensaje ya escrito.
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="font-semibold text-foreground">Contraentrega</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[#ff3d00]" aria-hidden="true" />
                Envío gratis
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#ff3d00]" aria-hidden="true" />
                Llega en 2-4 días hábiles
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1" role="img" aria-label="5 de 5 estrellas">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[#ff3d00] text-[#ff3d00]" />
                ))}
              </div>
              <p className="text-center text-sm md:text-base font-semibold">
                +3.500 clientes en Ecuador ya la tienen en su casa
              </p>
            </div>
          </div>

          <div className="mt-8 md:mt-0">
            <Carousel opts={{ align: "center", loop: true }} setApi={setApi} className="w-full">
              <CarouselContent>
                {FOTOS.map((foto, index) => (
                  <CarouselItem key={foto.alt}>
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl">
                      {/* La 0 es el LCP: CarouselImage le da eager + fetchpriority. */}
                      <CarouselImage
                        src={foto.src}
                        alt={foto.alt}
                        index={index}
                        current={slideActual}
                        className="h-full w-full object-cover"
                      />
                      <span className={`absolute top-3 right-3 rounded-full ${GRADIENTE} px-3 py-1 text-sm font-bold text-white shadow-lg`}>
                        {foto.badge}
                      </span>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 md:left-4" />
              <CarouselNext className="right-2 md:right-4" />
            </Carousel>
            <p className="mt-2 text-center text-sm text-muted-foreground">👉 Desliza para ver los retos reales que trae</p>
          </div>
        </div>
      </section>

      {/* ---------- EL PROBLEMA ---------- */}
      <Seccion className="bg-muted/30" ancho="max-w-3xl">
        <div className="space-y-4 text-center md:space-y-6">
          <H2>Todos llegaron. Y a la hora ya cada uno está en su celular.</H2>
          <div className="space-y-3 text-base text-muted-foreground md:text-xl">
            <p>
              No es que la gente no quiera pasarla bien. Es que nadie propone nada, y la reunión se apaga sola antes
              de arrancar de verdad.
            </p>
            <p>Siempre falta el que rompa el hielo. Y ese papel cansa.</p>
            <p className={`pt-2 text-lg font-bold md:text-2xl ${GRADIENTE} bg-clip-text text-transparent`}>
              Poner la torre en la mesa hace ese trabajo por ti.
            </p>
          </div>
        </div>
      </Seccion>

      {/* ---------- LA SOLUCIÓN: imaginar la escena + lo que la hace distinta ---------- */}
      <Seccion>
        <div className="mb-8 grid items-center gap-8 md:mb-10 md:grid-cols-2 md:gap-10">
          <div className="space-y-3 text-center md:text-left">
            <H2>Ahora imagina a tus amigos sacando estos bloques.</H2>
            <p className="text-base text-muted-foreground md:text-xl">
              La gracia está en descubrir a quién le toca. Un bloque pone a alguien en aprietos, otro desata las
              bromas… y todos quieren ver qué sale después.
            </p>
            <p className="text-base text-muted-foreground md:text-xl">
              Se arma en la mesa en 2 minutos. Nadie tiene que proponer nada: la torre lo hace por ustedes, y ninguna
              reunión sale igual.
            </p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl md:aspect-square">
            <img
              src={lifeFiesta}
              alt="Grupo de amigos celebrando alrededor de la Torre La Previa"
              width={1000}
              height={1000}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-[50%_25%]"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 md:gap-5">
          <Ventaja Icono={Droplets} titulo="Aguanta que le derramen encima">
            Madera de pino 100% premium, lijada y sellada. Se puede mojar y
            <strong className="text-foreground"> no se daña ni se borra el texto</strong>. Es un juego de shots: está
            hecha para eso.
          </Ventaja>
          <Ventaja Icono={Users} titulo="La más suave de las tres">
            Retos para reírse, sin nada subido de tono.
            <strong className="text-foreground"> Rompe el hielo con tus amigos de siempre</strong>.
          </Ventaja>
          <Ventaja Icono={MapPin} titulo="Hecha en Ecuador 🇪🇨">
            Producida y armada acá, no importada genérica. Los retos están escritos{" "}
            <strong className="text-foreground">como hablamos nosotros</strong>, no traducidos.
          </Ventaja>
        </div>

        <div className="mx-auto mt-10 max-w-xl space-y-4 text-center">
          <p className={`text-xl font-bold md:text-2xl ${GRADIENTE} bg-clip-text text-transparent`}>
            ¿Ya sabes quién de tu grupo no querría sacar el siguiente?
          </p>
          <CtaBoton texto="QUIERO LLEVARLA A LA PRÓXIMA REUNIÓN" onClick={handleBuyClick} />
        </div>
      </Seccion>

      {/* ---------- CÓMO SE JUEGA ---------- */}
      <Seccion className="bg-muted/30">
        <div className="mb-8 space-y-2 text-center md:mb-10">
          <H2>Saca un bloque. Lee el reto. Ahora te toca.</H2>
          <p className="text-base text-muted-foreground md:text-xl">
            No necesitas preparar una lista de preguntas ni dirigir toda la reunión.
          </p>
        </div>
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,280px)_1fr] md:gap-8">
          <div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl shadow-2xl md:aspect-auto md:h-full">
            <img
              src={lifeRonda}
              alt="Sacando un bloque de la Torre La Previa"
              width={1000}
              height={1000}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-5">
            {PASOS_JUEGO.map((paso) => (
              <Card key={paso.n} className="p-4 text-center md:p-6">
                <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${GRADIENTE} text-lg font-bold text-white md:h-12 md:w-12 md:text-xl`}>
                  {paso.n}
                </div>
                <p className="text-sm font-semibold md:text-base">{paso.t}</p>
              </Card>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Juego para adultos (+18). Acuerden los límites del grupo antes de empezar.
        </p>
      </Seccion>

      {/* ---------- PRUEBA SOCIAL (componente compartido) ---------- */}
      <Testimonials />

      {/* ---------- EL REGALO ---------- */}
      <Seccion className="bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="grid items-center gap-8 md:grid-cols-[2fr_3fr] md:gap-12">
          <div className="mx-auto flex w-full max-w-[300px] items-end justify-center -space-x-6 md:max-w-none md:-space-x-8">
            <img
              src={imgEbook}
              srcSet={`${imgEbook420} 420w, ${imgEbook} 512w`}
              sizes="(min-width: 768px) 190px, 42vw"
              alt="Portada de la Guía Digital de 25 Juegos para Fiestas de ShotyGames"
              width={512}
              height={800}
              loading="lazy"
              decoding="async"
              className="relative z-10 h-auto w-[46%] max-w-[210px] -rotate-3 rounded-xl shadow-[0_20px_50px_-15px_rgba(255,123,0,0.55)]"
            />
            <img
              src={imgEbookEjemplo}
              alt="Una de las páginas de la guía: ficha de un juego con preparación y condiciones de victoria"
              width={512}
              height={800}
              loading="lazy"
              decoding="async"
              className="mb-4 h-auto w-[40%] max-w-[180px] rotate-3 rounded-xl shadow-xl"
            />
          </div>
          <div className="space-y-4 text-center md:text-left">
            <span className="inline-block rounded-full bg-yellow-300 px-3 py-1 text-[12px] font-bold tracking-wide text-yellow-950">
              REGALO POR TU PEDIDO DE HOY
            </span>
            <H2>La torre pone los retos. Tu regalo suma 25 juegos más.</H2>
            <p className="text-base text-muted-foreground md:text-xl">
              Pide hoy La Previa y recibe GRATIS la Guía Digital de 25 Juegos para Fiestas: más ideas para variar el
              plan y seguir jugando con tu grupo.
            </p>
            <p className="text-sm text-muted-foreground md:text-base">
              Dentro de tu caja encontrarás una tarjeta con código QR para descargar la guía en tu celular. Es una
              guía digital, no un libro físico.
            </p>
            <RelojRegalo className="text-amber-700 md:justify-start" />
            <CtaBoton texto="PEDIR MI TORRE CON LA GUÍA GRATIS" onClick={handleBuyClick} />
          </div>
        </div>
      </Seccion>

      {/* ---------- LA OFERTA: acá se junta todo ---------- */}
      <section className="relative overflow-hidden px-4 py-10 md:py-16">
        <div className={`absolute inset-0 ${GRADIENTE} opacity-95`} aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-2xl text-center text-white">
          <span className="mb-4 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#ff3d00] md:text-base">
            🎁 REGALO POR PEDIDO DE HOY
          </span>
          <h2 className="mb-6 text-2xl font-bold leading-tight md:mb-8 md:text-4xl">
            Tu próxima previa empieza con este paquete
          </h2>

          <div className="space-y-5 rounded-2xl border-2 border-white/30 bg-black/25 p-6 backdrop-blur-sm md:p-8">
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Torre La Previa: 51 bloques con retos + vaso tequilero + instrucciones
                </span>
                <span className="whitespace-nowrap font-semibold">{PRECIO_TXT}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                <span className="flex items-center gap-2">
                  <Gift className="h-5 w-5 shrink-0 text-yellow-300" aria-hidden="true" />
                  Guía Digital de 25 Juegos para Fiestas
                </span>
                <span className="whitespace-nowrap font-bold text-yellow-300">
                  <span className="mr-2 font-normal text-white/60 line-through">$4.90</span>GRATIS
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                <span className="flex items-center gap-2">
                  <Truck className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Envío a todo Ecuador
                </span>
                <span className="whitespace-nowrap font-bold">GRATIS</span>
              </div>
            </div>

            <div className="h-px bg-white/25" />

            <div>
              <p className="mb-1 text-base text-white/80 md:text-lg">Hoy pagas</p>
              <p className="text-5xl font-bold tabular-nums md:text-7xl">{PRECIO_TXT}</p>
            </div>

            <RelojRegalo className="rounded-xl border border-yellow-300/40 bg-yellow-300/15 px-3 py-2 text-yellow-200" />

            <p className="text-lg font-bold md:text-2xl">Pagas cuando la tengas en la mano 💵</p>

            <CtaBoton texto="PEDIR LA MÍA CON EL REGALO" onClick={handleBuyClick} variante="blanco" />
            <p className="text-[13px] text-white/85">Completa tus datos y confirma por WhatsApp.</p>
          </div>
        </div>
      </section>

      {/* ---------- COMPRA Y ENTREGA ---------- */}
      <Seccion ancho="max-w-4xl">
        <H2 className="mb-8 text-center md:mb-10">Pídela hoy y empieza a preparar la próxima reunión.</H2>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
          {PASOS_PEDIDO.map(({ Icono, t, d }, i) => (
            <li key={t}>
              <Card className="flex h-full gap-3 p-4 md:flex-col md:p-6">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${GRADIENTE} font-bold text-white`}>
                  {i + 1}
                </span>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-base font-bold md:text-lg">
                    {t} <Icono className="h-4 w-4 text-[#ff3d00]" aria-hidden="true" />
                  </p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
          Llega en 2 a 4 días hábiles a todo Ecuador vía Servientrega. Si pides antes de las 3 de la tarde, sale el
          mismo día.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm font-semibold md:text-base">
          🚚 Envío gratis, ya incluido en el precio · 🇪🇨 Marca ecuatoriana desde 2017 · 🔁 Si algo llega defectuoso o
          incompleto, lo reponemos
        </p>
      </Seccion>

      {/* ---------- PREGUNTAS FRECUENTES ---------- */}
      <Seccion className="bg-muted/30" ancho="max-w-3xl">
        <H2 className="mb-8 text-center md:mb-10">Antes de llevarla a tu próxima previa</H2>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold md:text-lg">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground md:text-base">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Seccion>

      {/* ---------- CIERRE ---------- */}
      <section className="relative overflow-hidden px-4 py-10 md:py-16">
        <div className={`absolute inset-0 ${GRADIENTE} opacity-95`} aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-2xl space-y-5 text-center text-white md:space-y-6">
          <h2 className="text-2xl font-bold leading-tight md:text-4xl">En la próxima reunión, sé quien lleva el juego.</h2>
          <p className="text-base text-white/90 md:text-xl">
            Que alguien ponga la música. Tú lleva La Previa y deja que el primer bloque abra la conversación.
          </p>
          <p className="text-base font-semibold md:text-lg">
            Torre + vaso + instrucciones por {PRECIO_TXT}. Envío gratis y pago al recibir.
          </p>
          <div>
            <p className="text-base font-semibold text-yellow-300">
              🎁 Pide hoy y recibe GRATIS la Guía Digital de 25 Juegos para Fiestas
            </p>
            <RelojRegalo className="mt-1 text-yellow-200" />
          </div>

          <CtaBoton texto="QUIERO MI TORRE + GUÍA GRATIS" onClick={handleBuyClick} variante="blanco" />

          <p className="text-xs text-white/80 md:text-sm">💵 Pagas al recibir · 🚚 Envío gratis · 🎁 Guía de 25 juegos</p>
          <p className="pt-2 text-[12px] text-white/70">Producto dirigido a adultos (+18). Juega con responsabilidad.</p>
        </div>
      </section>

      <BarraFija visible={mostrarBarra && !checkoutOpen} onClick={handleBuyClick} />

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={PRODUCT_NAME}
        productPrice={PRECIO}
        productImage={torreNormal1}
        productId="torreNormal"
        upsells={[
          { id: "torrePicante", name: "Torre Picante (para grupos)", price: 10, image: torrePicanteImgThumb },
          { id: "torreParejas", name: "Torre de Shots Parejas", price: 10, image: torreParejasImgThumb },
          { id: "dadosPlacer", name: "Dados del Placer", price: 5, image: dadosDelPlacerImgThumb },
          { id: "emparejados", name: "Emparejados (juego digital)", price: 2.9, image: emparejadosPortadaThumb },
        ]}
      />
    </div>
  );
};

export default TorreNormalV2Landing;
