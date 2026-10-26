import { useState, useEffect, useRef, type ReactNode } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { useRestanteRegalo } from "@/hooks/useRegaloDeHoy";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import { TikTokCarrusel, type VideoTikTok } from "@/components/TikTokCarrusel";
import { CarouselImage } from "@/components/CarouselImage";
import { useSlideActual } from "@/hooks/useSlideActual";
import { trackViewContent, trackInitiateCheckout } from "@/lib/pixels";
import { Star, Gift, Truck, Clock, Banknote, Package, Wine, BookOpen, Hand, Flame } from "lucide-react";
import torrePicante1 from "@/assets/torre-picante-1.webp";
import torrePicante1_640 from "@/assets/torre-picante-1-640.webp";
import torrePicante1_760 from "@/assets/torre-picante-1-760.webp";
import torrePicante2 from "@/assets/torre-picante-2.webp";
import torrePicante2_640 from "@/assets/torre-picante-2-640.webp";
import torrePicante2_760 from "@/assets/torre-picante-2-760.webp";
import torrePicante3 from "@/assets/torre-picante-3.webp";
import torrePicante3_640 from "@/assets/torre-picante-3-640.webp";
import torrePicante3_760 from "@/assets/torre-picante-3-760.webp";
import torrePicante4 from "@/assets/torre-picante-4.webp";
import torrePicante4_640 from "@/assets/torre-picante-4-640.webp";
import torrePicante4_760 from "@/assets/torre-picante-4-760.webp";
import torrePicante5 from "@/assets/torre-picante-5.webp";
import torrePicante5_640 from "@/assets/torre-picante-5-640.webp";
import torrePicante5_760 from "@/assets/torre-picante-5-760.webp";
import torrePicante6 from "@/assets/torre-picante-6.webp";
import torrePicante6_640 from "@/assets/torre-picante-6-640.webp";
import torrePicante6_760 from "@/assets/torre-picante-6-760.webp";
import torrePicante7 from "@/assets/torre-picante-7.webp";
import torrePicante7_640 from "@/assets/torre-picante-7-640.webp";
import torrePicante7_760 from "@/assets/torre-picante-7-760.webp";
import torrePicante8 from "@/assets/torre-picante-8.webp";
import torrePicante8_640 from "@/assets/torre-picante-8-640.webp";
import torrePicante8_760 from "@/assets/torre-picante-8-760.webp";
import torrePicante10 from "@/assets/torre-picante-10.webp";
import torrePicante10_640 from "@/assets/torre-picante-10-640.webp";
import torrePicante10_760 from "@/assets/torre-picante-10-760.webp";
import beso3 from "@/assets/picante-beso-3.webp";
import beso3_640 from "@/assets/picante-beso-3-640.webp";
import beso3_760 from "@/assets/picante-beso-3-760.webp";
import grupo from "@/assets/torre-picante-life-grupo.webp";
import grupo640 from "@/assets/torre-picante-life-grupo-640.webp";
import grupo760 from "@/assets/torre-picante-life-grupo-760.webp";
import imgResena1 from "@/assets/tpk2-resena-1.webp";
import imgResena1_600 from "@/assets/tpk2-resena-1-600.webp";
import imgResena2 from "@/assets/tpk2-resena-2.webp";
import imgResena2_600 from "@/assets/tpk2-resena-2-600.webp";
import imgResena3 from "@/assets/tpk2-resena-3.webp";
import imgResena3_600 from "@/assets/tpk2-resena-3-600.webp";
import imgResena4 from "@/assets/tpk2-resena-4.webp";
import imgResena4_600 from "@/assets/tpk2-resena-4-600.webp";
import imgTiktokCrush from "@/assets/tiktok/7649844245884439815.webp";
import imgTiktokTimidos from "@/assets/tiktok/7638798502822202642.webp";
import portadaGuia from "@/assets/ebook-25-juegos-portada-120.webp";
import torreNormalImgThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";

// PRINCIPAL de la Torre Picante desde 2026-10-26 (/landing/torre-picante, donde caen los anuncios).
// Nació ese mismo día como versión aparte para el feriado (sáb 31-oct al mar 3-nov; ROTAR el copy
// después del 3-nov) y Fabián ordenó promoverla; la anterior (el póster, TorrePicanteV2Landing)
// quedó en /landing/torre-picante-v4 (mismo cruce que La Previa; los archivos no se renombran).
// Pedido de Fabián: "misma estructura que la normal", con el gráfico de la torre y sus retos como
// imagen principal. Es la hermana de TorreNormalV2Landing (La Previa): misma estructura, mismos
// componentes de compra (afuera del componente de la página a propósito) y el mismo contador del
// regalo. Fotos: "Saca. Lee. Cumple." usa una de las generadas de Descargas "PICANTE - GENERADAS
// LOTE1 BESO DE 3" (la caja que muestran sí es la real; las otras —1, 2 y 5— quedaron sin usar en
// src/assets) y la zona del feriado lleva UNA sola foto, `life-grupo` (la fiesta con confeti), por
// orden de Fabián (antes era un mosaico de 4). Los retos reales, las reseñas con foto y los 2
// TikToks son los de la Picante del póster. El tachado de la guía en $9.90 es el mismo que Fabián
// pidió para La Previa (suelta se vende a $4.90).
// OJO: el nombre del producto no se toca — n8n lo compara exacto.
const PRODUCT_NAME = "Torre de Shots Picante";
const PRECIO = 29.99;
const PRECIO_TXT = `$${PRECIO.toFixed(2)}`;

const GRADIENTE = "bg-gradient-to-r from-[#ff3d00] to-[#ff7b00]";

/** Mismo valor en el <img> del hero y en el preload del prerender (scripts/prerender-seo.mjs). */
const SIZES_HERO = "(min-width: 1024px) 488px, (min-width: 768px) calc(50vw - 40px), calc(100vw - 32px)";

// Fotos REALES de los bloques (el gráfico de la torre sube al hero; el "¿Tuvieras sexo...?"
// —torre-picante-9— queda fuera, decisión de Fabián del 2026-10-13).
const FOTOS_REALES = [
  { src: torrePicante7, src640: torrePicante7_640, src760: torrePicante7_760, badge: "Reto real 😈", alt: "Bloque real: Beso de 3" },
  { src: torrePicante3, src640: torrePicante3_640, src760: torrePicante3_760, badge: "Reto real 😈", alt: "Bloque real: Muestra tu ropa interior" },
  { src: torrePicante4, src640: torrePicante4_640, src760: torrePicante4_760, badge: "Reto real 🌶️", alt: "Bloque real: Sácale una prenda al jugador que quieras" },
  { src: torrePicante6, src640: torrePicante6_640, src760: torrePicante6_760, badge: "Reto real 💋", alt: "Bloque real: Besa apasionadamente durante 30 seg al jugador que quieras" },
  { src: torrePicante10, src640: torrePicante10_640, src760: torrePicante10_760, badge: "Reto real 😈", alt: "Bloque real: Dale una nalgada a alguien del sexo opuesto" },
  { src: torrePicante2, src640: torrePicante2_640, src760: torrePicante2_760, badge: "Reto real 🔥", alt: "Bloque real: Por cada jugador que se saque una prenda tomas 1 shot" },
  { src: torrePicante5, src640: torrePicante5_640, src760: torrePicante5_760, badge: "Reto real 🔥", alt: "Bloque real: Finge un orgasmo" },
  { src: torrePicante8, src640: torrePicante8_640, src760: torrePicante8_760, badge: "Reto real 🔥", alt: "Bloque real: Di tu fantasía sexual" },
];

// Las mismas reseñas con foto de la Picante principal, tal cual las pasó Fabián (2026-10-07).
const RESENAS = [
  { foto: imgResena1, foto600: imgResena1_600, nombre: "Daniela M.", ciudad: "Guayaquil", texto: "Me llegó súper rápido y la caja vino en buen estado. Lo usamos el fin de semana con amigos y terminamos riéndonos demasiado 😂 Los retos sí están picantes, recomendado." },
  { foto: imgResena2, foto600: imgResena2_600, nombre: "Kevin R.", ciudad: "Quito", texto: "Pensé que iba a ser más tranquilo pero sí se pone bueno jajaja. La calidad de los bloques está mejor de lo que esperaba y llegó todo completo. Buen juego para una reunión." },
  { foto: imgResena3, foto600: imgResena3_600, nombre: "Sofía P.", ciudad: "Cuenca", texto: "Lo compré para una noche con amigos y nos encantó. Hay retos que dan mucha risa y otros que sí te hacen pensarlo dos veces 😅 Llegó bien empacado y sin problemas." },
  { foto: imgResena4, foto600: imgResena4_600, nombre: "Mateo C.", ciudad: "Machala", texto: "Llegó tal cual se ve en las fotos. Ya lo estrenamos y estuvo buenísimo, especialmente cuando ya llevábamos unas rondas 😂 Sí lo volvería a comprar para regalar." },
];

// Los 2 TikToks de la Picante principal (el 7649563268683517192 da INVALID_VIDEO en el player).
const TIKTOKS: VideoTikTok[] = [
  { id: "7649844245884439815", portada: imgTiktokCrush, alt: "Sale este reto y tu crush está en la mesa", autor: "@shotygames_ec" },
  { id: "7638798502822202642", portada: imgTiktokTimidos, alt: "Este Jenga no es apto para tímidos", autor: "@shotygames_ec" },
];

const PASOS = [
  { Icono: Package, t: "Arma la torre" },
  { Icono: Hand, t: "Saca un bloque" },
  { Icono: BookOpen, t: "Lee el reto en voz alta" },
  { Icono: Flame, t: "Cúmplelo si te atreves" },
];

const INCLUYE = [
  { Icono: Package, t: "51 bloques con retos" },
  { Icono: Wine, t: "1 vaso tequilero" },
  { Icono: BookOpen, t: "Instrucciones de juego" },
];

const FAQS = [
  { q: "¿Cuándo llega?", a: "2 a 4 días hábiles a todo Ecuador. Si pides antes de las 3 de la tarde, sale el mismo día." },
  { q: "¿Pago por adelantado?", a: "No. Pagas en efectivo al recibir. Confirmas por WhatsApp con un mensaje ya escrito." },
  { q: "¿Es muy fuerte?", a: "Es la más atrevida de las tres: retos para adultos (+18) y grupos con confianza. Mira los ejemplos de esta página." },
  { q: "¿Llega discreta?", a: "Sí. El paquete llega sellado y sin ninguna referencia al contenido por fuera." },
  { q: "¿Aguanta que se moje?", a: "Sí. Pino premium, lijado y sellado: no se daña ni se borra el texto." },
  { q: "¿Para cuántos? ¿Hay que tomar?", a: "Desde 3 personas, sin límite. Tomar es opcional: pueden adaptar la dinámica sin alcohol." },
  { q: "¿Algo más suave?", a: "Agrega la Torre La Previa o la Parejas (+$10 cada una) al hacer tu pedido." },
];

const Seccion = ({ children, className = "", ancho = "max-w-5xl" }: { children: ReactNode; className?: string; ancho?: string }) => (
  <section className={`px-4 py-8 md:py-14 ${className}`}>
    <div className={`mx-auto ${ancho}`}>{children}</div>
  </section>
);

const H2 = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2 className={`text-2xl md:text-4xl font-bold leading-tight ${className}`}>{children}</h2>
);

const Estrellas = ({ className }: { className: string }) => (
  <div className="flex gap-0.5" role="img" aria-label="5 de 5 estrellas">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`${className} fill-[#ff3d00] text-[#ff3d00]`} />
    ))}
  </div>
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

const TorrePicanteV4Landing = () => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();

  // Para saber qué foto del carrusel está a la vista y no bajar las otras.
  const [api, setApi] = useState<CarouselApi>();
  const slideActual = useSlideActual(api);

  // La barra de abajo solo aparece cuando el CTA del hero ya salió de pantalla:
  // el hero ya trae botón, precio y regalo y dos botones juntos compiten. Arranca
  // escondida; si el navegador no tiene IntersectionObserver, queda siempre visible.
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
        title="Torre de Shots Picante: el juego del feriado | ShotyGames Ecuador"
        description="Este feriado sube la temperatura: 51 bloques con retos atrevidos para jugar en grupo. $29.99, envío gratis y pago al recibir. Pide hoy y recibe una guía digital de regalo."
        canonical="https://www.shotygames.com/landing/torre-picante"
        image={`https://www.shotygames.com${torrePicante1}`}
        type="product"
      />

      {/* ---------- BARRA DE CONFIANZA ---------- */}
      <div className={`sticky top-0 z-50 ${GRADIENTE} px-4 py-2 md:py-3 text-center font-semibold text-white shadow-lg`}>
        <p className="text-[11px] md:text-base leading-tight">💵 Pagas al recibir · 🚚 Envío gratis a todo Ecuador</p>
      </div>

      {/* ---------- HERO: la torre con sus retos + precio, regalo y botón ----------
          Móvil: titular → foto → oferta. Escritorio: texto a la izquierda, foto a la derecha. */}
      <section className="bg-gradient-to-br from-background to-muted/30 px-4 pt-5 pb-8 md:py-12">
        <div className="mx-auto max-w-5xl md:grid md:grid-cols-2 md:gap-x-12">
          <div className="md:col-start-1 md:row-start-1 md:self-end">
            <h1 className="text-balance text-[30px] leading-[1.1] md:text-5xl font-bold tracking-tight">
              Este feriado, sube la temperatura.
              <span className={`mt-1 block text-[22px] md:text-3xl ${GRADIENTE} bg-clip-text text-transparent`}>
                ¿Quién se atreve a sacar el primer bloque?
              </span>
            </h1>
          </div>

          <div className="mt-4 md:mt-0 md:col-start-2 md:row-start-1 md:row-span-2 md:self-center">
            <div className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl">
              <img
                src={torrePicante1}
                srcSet={`${torrePicante1_640} 640w, ${torrePicante1_760} 760w, ${torrePicante1} 1080w`}
                sizes={SIZES_HERO}
                alt="Torre de Shots Picante: la caja, 1 vaso de shot, 51 bloques con retos y algunos de los retos"
                width={1080}
                height={1080}
                decoding="sync"
                {...{ fetchpriority: "high" }}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3 md:col-start-1 md:row-start-2 md:mt-5 md:self-start">
            <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#ff3d00]/20 bg-white px-4 py-3 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-wide md:text-base">Torre Picante</p>
                <p className="text-[13px] text-muted-foreground">51 bloques + vaso tequilero</p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-green-700">
                  <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Envío gratis
                </p>
              </div>
              <p className="text-[32px] font-bold leading-none tabular-nums text-[#ff3d00] min-[360px]:text-[38px] md:text-[46px]">
                {PRECIO_TXT}
              </p>
            </div>

            <div className="rounded-xl border-2 border-yellow-400/60 bg-yellow-50 px-4 py-2.5 text-center">
              <p className="text-[14px] font-semibold text-yellow-900 md:text-base">
                🎁 Pide hoy: <strong>Guía de 25 juegos GRATIS</strong>
              </p>
              <RelojRegalo className="mt-1 text-amber-700" />
            </div>

            <div ref={ctaHeroRef}>
              <CtaBoton texto="QUIERO MI TORRE + GUÍA GRATIS" onClick={handleBuyClick} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground md:text-sm">
              <span className="flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="font-semibold text-foreground">Contraentrega</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#ff3d00]" aria-hidden="true" />
                Llega en 2-4 días hábiles
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- EL PROBLEMA, EN UNA LÍNEA ---------- */}
      <Seccion className="bg-muted/30" ancho="max-w-3xl">
        <div className="space-y-2 text-center">
          <H2>4 días de feriado. ¿Y nadie se atreve a nada?</H2>
          <p className={`text-xl font-bold md:text-2xl ${GRADIENTE} bg-clip-text text-transparent`}>La torre pone los retos.</p>
        </div>
      </Seccion>

      {/* ---------- CÓMO SE JUEGA ---------- */}
      <Seccion>
        <H2 className="mb-6 text-center">Saca. Lee. Cumple.</H2>
        <div className="grid items-center gap-5 md:grid-cols-2 md:gap-10">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl md:aspect-square">
            <img
              src={beso3}
              srcSet={`${beso3_640} 640w, ${beso3_760} 760w, ${beso3} 1080w`}
              sizes="(min-width: 1024px) 488px, (min-width: 768px) calc(50vw - 40px), calc(100vw - 32px)"
              alt="Un grupo de amigos y una mano que muestra el bloque «Beso de 3» frente a la Torre de Shots Picante"
              width={1080}
              height={1080}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-[50%_55%]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PASOS.map(({ Icono, t }) => (
              <Card key={t} className="flex flex-col items-center gap-2 p-4 text-center">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full ${GRADIENTE} text-white`}>
                  <Icono className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold md:text-base">{t}</p>
              </Card>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground md:text-sm">Juego para adultos (+18)</p>
      </Seccion>

      {/* ---------- FOTO DE LA FIESTA + EL FERIADO ---------- */}
      <Seccion className="bg-muted/30" ancho="max-w-xl">
        <div className="space-y-4 text-center">
          <div className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl">
            <img
              src={grupo}
              srcSet={`${grupo640} 640w, ${grupo760} 760w, ${grupo} 1000w`}
              sizes="(min-width: 608px) 576px, calc(100vw - 32px)"
              alt="Grupo de amigos celebrando con confeti alrededor de la Torre de Shots Picante"
              width={1000}
              height={1000}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <H2>Que el feriado no se quede tibio.</H2>
          <CtaBoton texto="QUIERO MI TORRE + GUÍA GRATIS" onClick={handleBuyClick} />
          <p className="text-xs text-muted-foreground md:text-sm">
            💵 Pagas al recibir · 🚚 Envío gratis · Producto para adultos (+18)
          </p>
        </div>
      </Seccion>

      {/* ---------- VIDEOS DE TIKTOK (aparece cuando TIKTOKS tiene videos) ---------- */}
      {TIKTOKS.length > 0 && (
        <Seccion ancho="max-w-5xl">
          <H2 className="mb-6 text-center">Míralo en acción</H2>
          <TikTokCarrusel videos={TIKTOKS} />
          <p className="mt-2 text-center text-xs text-muted-foreground md:hidden">👉 Desliza y toca para reproducir</p>
        </Seccion>
      )}

      {/* ---------- RETOS REALES ---------- */}
      <Seccion className={TIKTOKS.length > 0 ? "bg-muted/30" : ""} ancho="max-w-xl">
        <H2 className="mb-5 text-center">Retos reales del juego</H2>
        <Carousel opts={{ align: "center", loop: true }} setApi={setApi} className="w-full">
          <CarouselContent>
            {FOTOS_REALES.map((foto, index) => (
              <CarouselItem key={foto.alt}>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl">
                  <CarouselImage
                    src={foto.src}
                    srcSet={`${foto.src640} 640w, ${foto.src760} 760w, ${foto.src} 1080w`}
                    sizes="(min-width: 640px) 576px, calc(100vw - 32px)"
                    alt={foto.alt}
                    index={index}
                    current={slideActual}
                    prioridad={false}
                    className="h-full w-full object-cover"
                  />
                  <span className={`absolute top-3 right-3 rounded-full ${GRADIENTE} px-3 py-1 text-sm font-bold text-white shadow-lg`}>
                    {foto.badge}
                  </span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        <p className="mt-2 text-center text-sm text-muted-foreground">👉 Desliza</p>
      </Seccion>

      {/* ---------- LO QUE LLEGA + PRECIO ---------- */}
      <section className="relative overflow-hidden px-4 py-10 md:py-16">
        <div className={`absolute inset-0 ${GRADIENTE} opacity-95`} aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-xl text-center text-white">
          <h2 className="mb-5 text-2xl font-bold leading-tight md:text-4xl">Lo que llega a tu casa</h2>

          <div className="space-y-4 rounded-2xl border-2 border-white/30 bg-black/25 p-5 backdrop-blur-sm md:p-7">
            <ul className="space-y-3 text-left text-base md:text-lg">
              {INCLUYE.map(({ Icono, t }) => (
                <li key={t} className="flex items-center gap-3">
                  <Icono className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ))}
              <li className="flex items-center gap-3">
                <img src={portadaGuia} alt="" width={96} height={150} loading="lazy" decoding="async" className="h-10 w-auto shrink-0 rounded" />
                <span className="flex-1">Guía de 25 juegos</span>
                <span className="whitespace-nowrap font-bold text-yellow-300">
                  <span className="mr-2 font-normal text-white/60 line-through">$9.90</span>GRATIS
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Gift className="h-5 w-5 shrink-0 opacity-0" aria-hidden="true" />
                <span className="flex-1">Envío a todo Ecuador</span>
                <span className="font-bold">GRATIS</span>
              </li>
            </ul>

            <div className="h-px bg-white/25" />

            <div>
              <p className="text-sm text-white/80">Hoy pagas</p>
              <p className="text-5xl font-bold tabular-nums md:text-6xl">{PRECIO_TXT}</p>
              <p className="mt-1 text-base font-semibold">Al recibirla 💵</p>
            </div>

            <RelojRegalo className="rounded-xl border border-yellow-300/40 bg-yellow-300/15 px-3 py-2 text-yellow-200" />

            <CtaBoton texto="PEDIR LA MÍA CON EL REGALO" onClick={handleBuyClick} variante="blanco" />
          </div>

          <p className="mt-4 text-[13px] text-white/90">
            🇪🇨 Hecha en Ecuador desde 2017 · 🔁 Si llega defectuosa, la reponemos
          </p>
        </div>
      </section>

      {/* ---------- RESEÑAS CON FOTO ---------- */}
      <Seccion className="bg-muted/30">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Estrellas className="h-6 w-6" />
          <H2>Lo que opinan quienes ya jugaron</H2>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {RESENAS.map((r) => (
            <article
              key={r.nombre}
              className="flex w-[80%] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border bg-card shadow-sm sm:w-[46%] md:w-auto"
            >
              <img
                src={r.foto}
                srcSet={`${r.foto600} 600w, ${r.foto} 720w`}
                sizes="(min-width: 1024px) 241px, (min-width: 768px) calc((100vw - 52px) / 2), (min-width: 640px) calc((100vw - 32px) * 0.46), calc((100vw - 32px) * 0.8)"
                alt={`Torre de Shots Picante recibida por ${r.nombre} en ${r.ciudad}`}
                width={720}
                height={960}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
                <Estrellas className="h-4 w-4" />
                <p className="flex-1 text-[14px] leading-relaxed md:text-base">“{r.texto}”</p>
                <p className="text-sm font-bold">
                  {r.nombre} <span className="font-normal text-muted-foreground">— {r.ciudad}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground md:hidden">👉 Desliza para ver más reseñas</p>
      </Seccion>

      {/* ---------- PREGUNTAS ---------- */}
      <Seccion ancho="max-w-3xl">
        <H2 className="mb-6 text-center">Preguntas rápidas</H2>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold md:text-lg">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground md:text-base">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Seccion>

      <BarraFija visible={mostrarBarra && !checkoutOpen} onClick={handleBuyClick} />

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={PRODUCT_NAME}
        productPrice={PRECIO}
        productImage={torrePicante1}
        productId="torrePicante"
        upsells={[
          { id: "torreNormal", name: "Torre La Previa (para grupos)", price: 10, image: torreNormalImgThumb },
          { id: "torreParejas", name: "Torre de Shots Parejas", price: 10, image: torreParejasImgThumb },
          { id: "dadosPlacer", name: "Dados del Placer", price: 5, image: dadosDelPlacerImgThumb },
        ]}
      />
    </div>
  );
};

export default TorrePicanteV4Landing;
