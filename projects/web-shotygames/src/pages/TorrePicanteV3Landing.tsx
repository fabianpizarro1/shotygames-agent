import { useState, useEffect, useRef, type ReactNode } from "react";
import Seo from "@/components/Seo";
import Footer from "@/components/Footer";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { useRegaloDeHoy } from "@/hooks/useRegaloDeHoy";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import { TikTokCarrusel, type VideoTikTok } from "@/components/TikTokCarrusel";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { CarouselImage } from "@/components/CarouselImage";
import { useSlideActual } from "@/hooks/useSlideActual";
import { trackViewContent, trackInitiateCheckout } from "@/lib/pixels";
import {
  Star, Gift, Truck, Clock, CheckCircle2, Banknote, Users, Snowflake, Laugh, Package,
  MessageCircle, TreePine, Type, Repeat, ClipboardList, PartyPopper,
} from "lucide-react";
import torrePicante1 from "@/assets/torre-picante-1.webp";
import torreNormalImgThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";

// V3 (2026-10-13): estructura y copy del "Prompt Maestro" de la IA externa
// (18 bloques, tema oscuro, ángulo "¿quién se atreve a sacar el primer
// bloque?"). Esa IA no mandó imágenes: van las fotos que ya teníamos, cada una
// una sola vez. Lo de Releasit/Shopify del documento no aplica — el checkout,
// los upsells y los pixeles son los mismos de la v2.
// Decisiones de Fabián: envío gratis "a todo Ecuador" (no "continental"), el
// contador del regalo se queda, y fuera el bloque "¿Tuvieras sexo con alguien
// de los presentes?" (torre-picante-9).
// 2026-10-13 (2da vuelta): el hero pasa a ser el carrusel de fotos reales de la
// v1 (pedido de Fabián); por eso "Cada bloque es una sorpresa" y "Qué incluye"
// cambiaron de foto, y la de la caja en la mano (tpk2-08) se sacó: la caja se
// veía muy chica.
import imgJugando from "@/assets/tpk2-02-hero-jugando.webp";
import imgJugando640 from "@/assets/tpk2-02-hero-jugando-640.webp";
import imgProblema from "@/assets/tpk2-03-problema.webp";
import imgProblema640 from "@/assets/tpk2-03-problema-640.webp";
import imgPartida from "@/assets/tpk2-07-con-torre.webp";
import imgPartida360 from "@/assets/tpk2-07-con-torre-360.webp";
import imgPaso1 from "@/assets/tpk2-05-paso1-sacar.webp";
import imgPaso2 from "@/assets/tpk2-05-paso2-leer.webp";
import imgPaso3 from "@/assets/tpk2-05-paso3-cumplir.webp";
import imgPaso1640 from "@/assets/tpk2-05-paso1-sacar-640.webp";
import imgPaso2640 from "@/assets/tpk2-05-paso2-leer-640.webp";
import imgPaso3640 from "@/assets/tpk2-05-paso3-cumplir-640.webp";
import torrePicante2 from "@/assets/torre-picante-2.webp";
import torrePicante2_640 from "@/assets/torre-picante-2-640.webp";
import torrePicante3 from "@/assets/torre-picante-3.webp";
import torrePicante3_640 from "@/assets/torre-picante-3-640.webp";
import torrePicante4 from "@/assets/torre-picante-4.webp";
import torrePicante4_640 from "@/assets/torre-picante-4-640.webp";
import torrePicante5 from "@/assets/torre-picante-5.webp";
import torrePicante5_640 from "@/assets/torre-picante-5-640.webp";
import torrePicante6 from "@/assets/torre-picante-6.webp";
import torrePicante6_640 from "@/assets/torre-picante-6-640.webp";
import torrePicante7 from "@/assets/torre-picante-7.webp";
import torrePicante7_640 from "@/assets/torre-picante-7-640.webp";
import torrePicante8 from "@/assets/torre-picante-8.webp";
import torrePicante8_640 from "@/assets/torre-picante-8-640.webp";
import torrePicante10 from "@/assets/torre-picante-10.webp";
import torrePicante10_640 from "@/assets/torre-picante-10-640.webp";
import imgOcasiones from "@/assets/torre-picante-life-grupo.webp";
import imgOcasiones640 from "@/assets/torre-picante-life-grupo-640.webp";
import torrePicante1_640 from "@/assets/torre-picante-1-640.webp";
import imgEbook from "@/assets/ebook-25-juegos-portada.webp";
import imgCajaOferta from "@/assets/tpk3-oferta-caja.webp";
import imgResena1 from "@/assets/tpk2-resena-1.webp";
import imgResena2 from "@/assets/tpk2-resena-2.webp";
import imgResena3 from "@/assets/tpk2-resena-3.webp";
import imgResena4 from "@/assets/tpk2-resena-4.webp";
import imgTiktokCrush from "@/assets/tiktok/7649844245884439815.webp";
import imgTiktokTimidos from "@/assets/tiktok/7638798502822202642.webp";

const PRECIO = 29.99;
const PRECIO_TXT = `$${PRECIO.toFixed(2)}`;

/** Los cuadros de tpk2-05 ya vienen cortados y en el orden real del juego. */
const PASOS = [
  { src: imgPaso1, src640: imgPaso1640, w: 1024, h: 504, t: "SACA UN BLOQUE", d: "Elige una pieza de la torre sin derribarla.", alt: "Jugador sacando el bloque 'Beso de 3' de la Torre Picante" },
  { src: imgPaso2, src640: imgPaso2640, w: 1024, h: 506, t: "DESCUBRE EL RETO", d: "Lee el reto de la pieza y sigue la dinámica del juego.", alt: "Jugador leyendo el reto de un bloque antes de ponerlo arriba de la torre" },
  { src: imgPaso3, src640: imgPaso3640, w: 1024, h: 515, t: "SIGUE LA RONDA", d: "La torre cambia en cada turno... y nadie sabe qué viene después.", alt: "Jugador celebrando al lado de la torre en plena partida" },
];

/** Carrusel del hero: las fotos reales de la v1 (producto + bloques), sin el
 *  "¿Tuvieras sexo...?" (torre-picante-9). */
const FOTOS_REALES = [
  { src: torrePicante1, src640: torrePicante1_640, w: 1080, badge: "Foto real 📸", alt: "Torre de Shots Picante: caja, 1 vaso de shots y 51 bloques con retos" },
  { src: torrePicante7, src640: torrePicante7_640, w: 1400, badge: "Reto real 😈", alt: "Bloque real: Beso de 3" },
  { src: torrePicante3, src640: torrePicante3_640, w: 1400, badge: "Reto real 😈", alt: "Bloque real: Muestra tu ropa interior" },
  { src: torrePicante4, src640: torrePicante4_640, w: 1400, badge: "Reto real 🌶️", alt: "Bloque real: Sácale una prenda al jugador que quieras" },
  { src: torrePicante6, src640: torrePicante6_640, w: 1400, badge: "Reto real 💋", alt: "Bloque real: Besa apasionadamente durante 30 seg al jugador que quieras" },
  { src: torrePicante10, src640: torrePicante10_640, w: 1400, badge: "Reto real 😈", alt: "Bloque real: Dale una nalgada a alguien del sexo opuesto" },
  { src: torrePicante2, src640: torrePicante2_640, w: 1400, badge: "Reto real 🔥", alt: "Bloque real: Por cada jugador que se saque una prenda tomas 1 shot" },
  { src: torrePicante5, src640: torrePicante5_640, w: 1400, badge: "Reto real 🔥", alt: "Bloque real: Finge un orgasmo" },
  { src: torrePicante8, src640: torrePicante8_640, w: 1400, badge: "Reto real 🔥", alt: "Bloque real: Di tu fantasía sexual" },
];

/** Las mismas reseñas de la v2, tal cual las pasó Fabián (2026-10-07). */
const RESENAS = [
  { foto: imgResena1, nombre: "Daniela M.", ciudad: "Guayaquil", texto: "Me llegó súper rápido y la caja vino en buen estado. Lo usamos el fin de semana con amigos y terminamos riéndonos demasiado 😂 Los retos sí están picantes, recomendado." },
  { foto: imgResena2, nombre: "Kevin R.", ciudad: "Quito", texto: "Pensé que iba a ser más tranquilo pero sí se pone bueno jajaja. La calidad de los bloques está mejor de lo que esperaba y llegó todo completo. Buen juego para una reunión." },
  { foto: imgResena3, nombre: "Sofía P.", ciudad: "Cuenca", texto: "Lo compré para una noche con amigos y nos encantó. Hay retos que dan mucha risa y otros que sí te hacen pensarlo dos veces 😅 Llegó bien empacado y sin problemas." },
  { foto: imgResena4, nombre: "Mateo C.", ciudad: "Machala", texto: "Llegó tal cual se ve en las fotos. Ya lo estrenamos y estuvo buenísimo, especialmente cuando ya llevábamos unas rondas 😂 Sí lo volvería a comprar para regalar." },
];

const TIKTOKS: VideoTikTok[] = [
  { id: "7649844245884439815", portada: imgTiktokCrush, alt: "Sale este reto y tu crush está en la mesa", autor: "@shotygames_ec" },
  { id: "7638798502822202642", portada: imgTiktokTimidos, alt: "Este Jenga no es apto para tímidos", autor: "@shotygames_ec" },
];

const FAQS = [
  { q: "¿Cómo se juega?", a: "Arma la torre, saca un bloque por turno y sigue el reto indicado en la pieza. Continúen jugando mientras la torre se mantiene en pie." },
  { q: "¿Cuántos bloques incluye?", a: "La Torre Picante incluye 51 bloques de madera con retos." },
  { q: "¿Qué viene con mi pedido?", a: "La Torre Picante con sus 51 bloques, un vaso tequilero, las instrucciones de juego y el ebook digital de 25 juegos para fiestas de regalo." },
  { q: "¿Cuánto cuesta?", a: `Una Torre Picante cuesta ${PRECIO_TXT} con envío gratis a todo Ecuador.` },
  { q: "¿Puedo pagar cuando llegue?", a: "Sí. Pagas en efectivo cuando el paquete llega a tu puerta. Antes de despacharlo te escribimos por WhatsApp para confirmar tus datos." },
  { q: "¿El envío es gratis?", a: "Sí, a todo Ecuador vía Servientrega. El envío ya está incluido en el precio." },
  { q: "¿Cuándo llega?", a: "Entre 2 y 4 días hábiles a todo Ecuador. Si pides antes de las 3 de la tarde, sale el mismo día." },
  { q: "¿Llega en empaque discreto?", a: "Sí. El paquete llega sellado y sin ninguna referencia al contenido por fuera." },
  { q: "¿Es solo para parejas?", a: "No. La Torre Picante está pensada para jugar en grupo con amigos adultos." },
  { q: "¿Para cuántas personas sirve?", a: "La caja dice para 2 o más, pero se disfruta de verdad desde 3 en adelante, sin límite." },
  { q: "¿Es obligatorio tomar alcohol?", a: "No. Pueden adaptar la dinámica y disfrutar del juego sin bebidas alcohólicas." },
  { q: "¿Cómo recibo el ebook?", a: "Viene dentro de la caja, en una tarjeta con código QR para descargarlo. Sin costo extra." },
];

// Paleta del documento. Fondos claros solo en los bloques de confianza.
const FONDO = "bg-[#101014]";
const SUPERFICIE = "bg-[#19191F]";
const TEXTO_2 = "text-[#CFCDD2]";
const DEGRADADO = "bg-gradient-to-r from-[#FF3D00] to-[#FF7B00]";

const Seccion = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-4 py-12 md:py-20 ${className}`}>
    <div className="mx-auto max-w-[1140px]">{children}</div>
  </section>
);

const H2 = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2 className={`text-[26px] leading-[1.15] md:text-[40px] font-extrabold tracking-tight ${className}`}>{children}</h2>
);

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[13px] md:text-sm font-semibold">
    {children}
  </span>
);

// Afuera del componente a propósito: el contador re-renderiza la página cada
// segundo, y un componente definido adentro es un tipo nuevo en cada render —
// React desmontaba y volvía a montar TODOS los botones de compra una vez por
// segundo (un toque justo en ese instante se perdía).
const CtaBoton = ({ texto, onClick, variante = "lleno", className = "" }: { texto: string; onClick: () => void; variante?: "lleno" | "borde" | "blanco"; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full min-h-[56px] rounded-xl px-5 py-4 text-[17px] md:text-xl font-extrabold tracking-wide transition-transform motion-safe:hover:scale-[1.02] active:scale-[0.99] ${
      variante === "lleno"
        ? `${DEGRADADO} text-white shadow-[0_12px_32px_-10px_rgba(255,61,0,0.75)]`
        : variante === "blanco"
          ? "bg-white text-[#FF3D00] shadow-2xl"
          : "border-2 border-[#FF3D00] text-white hover:bg-[#FF3D00]/10"
    } ${className}`}
  >
    {texto}
  </button>
);

const RelojRegalo = ({ restante, className = "" }: { restante: string; className?: string }) => (
  <p className={`flex items-center justify-center gap-1.5 text-[13px] md:text-sm font-semibold text-yellow-300 ${className}`}>
    <Clock className="h-4 w-4 shrink-0" />
    El regalo se cierra en <span className="tabular-nums">{restante}</span>
  </p>
);

const TorrePicanteV3Landing = () => {
  const productName = "Torre de Shots Picante";
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();
  const regalo = useRegaloDeHoy();

  // El carrusel baja solo la foto a la vista y la vecina (CarouselImage).
  const [apiFotos, setApiFotos] = useState<CarouselApi>();
  const slideFotos = useSlideActual(apiFotos);

  // La barra fija de abajo se esconde solo mientras el CTA del hero está en
  // pantalla (dos botones juntos competían). Al cargar, en móvil ese CTA queda
  // bajo el pliegue, así que la barra ya está: el primer pantallazo siempre
  // tiene un botón de compra.
  const ctaHeroRef = useRef<HTMLDivElement>(null);
  // Arranca visible: si el observer no llega a correr, la barra queda siempre
  // a la vista (como en la v2) en vez de dejar el celular sin botón.
  const [mostrarBarra, setMostrarBarra] = useState(true);
  useEffect(() => {
    const el = ctaHeroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
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
    trackViewContent({ content_name: productName, content_category: "Juegos de Mesa", value: PRECIO });
  }, []);

  const handleBuyClick = () => {
    trackInitiateCheckout({ content_name: productName, content_category: "Juegos de Mesa", value: PRECIO });
    setCheckoutOpen(true);
  };

  return (
    <div className={`min-h-screen ${FONDO} text-white pb-28 md:pb-0`}>
      <Seo
        title="Torre de Shots Picante 🌶️ - ¿Quién se atreve? | ShotyGames Ecuador"
        description="51 bloques con retos atrevidos para jugar en grupo. Vaso tequilero incluido y ebook de 25 juegos de regalo. Envío gratis a todo Ecuador y pagas al recibir."
        canonical="https://www.shotygames.com/landing/torre-picante-v3"
        image={`https://www.shotygames.com${torrePicante1}`}
        type="product"
      />

      {/* ---------- 01 BARRA DE CONFIANZA ---------- */}
      <div className={`sticky top-0 z-50 ${DEGRADADO} px-4 py-2.5 text-center shadow-lg`}>
        <p className="text-[12.5px] md:text-sm font-bold tracking-wide leading-snug">
          🚚 ENVÍO GRATIS A TODO ECUADOR <span className="opacity-70">·</span> 💵 PAGA CUANDO LO RECIBAS
        </p>
      </div>

      {/* ---------- 02 HERO ----------
          Móvil: titular → foto → oferta. Escritorio: foto a la izquierda y todo
          el texto a la derecha. */}
      <section className="px-4 pt-6 pb-12 md:py-16">
        <div className="mx-auto max-w-[1140px] md:grid md:grid-cols-2 md:gap-x-12 md:items-center">
          <div className="md:col-start-2 md:row-start-1 md:self-end">
            <p className="text-[12px] md:text-sm font-bold tracking-[0.18em] text-[#FF7B00] uppercase mb-2">
              🌶️ El juego para los que se atreven
            </p>
            <h1 className="text-[30px] leading-[1.08] md:text-[52px] font-extrabold tracking-tight">
              ¿QUIÉN SE ATREVE A SACAR EL PRIMER BLOQUE? 😈
            </h1>
            <p className={`mt-3 text-[15px] md:text-lg leading-relaxed ${TEXTO_2}`}>
              Saca un bloque, descubre el reto y deja que la reunión se ponga interesante. La Torre Picante
              convierte una juntada común en un juego lleno de risas, sorpresas y desafíos para adultos.
            </p>
          </div>

          <div className="mt-5 md:mt-0 md:col-start-1 md:row-start-1 md:row-span-2">
            <Carousel opts={{ align: "center", loop: true }} setApi={setApiFotos} className="w-full">
              <CarouselContent>
                {FOTOS_REALES.map((foto, index) => (
                  <CarouselItem key={foto.alt}>
                    <div className={`relative aspect-square overflow-hidden rounded-2xl md:rounded-3xl ${SUPERFICIE} shadow-2xl`}>
                      {/* La 0 es el LCP: CarouselImage le da eager + fetchpriority. */}
                      <CarouselImage
                        src={foto.src}
                        srcSet={`${foto.src640} 640w, ${foto.src} ${foto.w}w`}
                        sizes="(min-width: 1140px) 546px, (min-width: 768px) calc(50vw - 40px), calc(100vw - 32px)"
                        alt={foto.alt}
                        index={index}
                        current={slideFotos}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-3 right-3 rounded-full ${DEGRADADO} px-3 py-1 text-[12px] md:text-sm font-bold shadow-lg`}>
                        {foto.badge}
                      </span>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 md:left-4 border-none bg-white/90 text-[#101014] hover:bg-white" />
              <CarouselNext className="right-2 md:right-4 border-none bg-white/90 text-[#101014] hover:bg-white" />
            </Carousel>
            <p className={`mt-2 text-center text-[13px] ${TEXTO_2}`}>👉 Desliza para ver los retos reales que trae</p>
          </div>

          <div className="mt-5 md:mt-6 md:col-start-2 md:row-start-2 md:self-start space-y-4">
            <div className="flex flex-wrap gap-2">
              <Chip>51 bloques con retos</Chip>
              <Chip>Para jugar en grupo</Chip>
              <Chip>Vaso tequilero incluido</Chip>
            </div>

            <div className={`flex items-center justify-between gap-4 rounded-2xl ${SUPERFICIE} border border-white/10 px-4 py-3`}>
              <div>
                <p className="text-sm font-extrabold tracking-wide">TORRE PICANTE</p>
                <p className={`text-[13px] ${TEXTO_2}`}>Envío gratis a todo Ecuador</p>
              </div>
              <p className="text-[34px] md:text-[42px] font-extrabold leading-none tabular-nums">{PRECIO_TXT}</p>
            </div>

            <div className="rounded-xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-2.5 text-center">
              <p className="text-[14px] md:text-base font-bold text-yellow-200">
                🎁 Incluye GRATIS ebook digital: 25 juegos para fiestas
              </p>
              <RelojRegalo restante={regalo.restante} className="mt-1" />
            </div>

            <div ref={ctaHeroRef}>
              <CtaBoton onClick={handleBuyClick} texto="🔥 QUIERO MI TORRE PICANTE" />
            </div>
            <p className={`text-center text-[13px] ${TEXTO_2}`}>
              Pides hoy y pagas al recibir · Sin pago anticipado
            </p>

            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="flex gap-0.5" aria-label="5 de 5 estrellas">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#FF7B00] text-[#FF7B00]" />
                ))}
              </div>
              <p className="text-[13px] md:text-sm font-semibold">+3.500 clientes en Ecuador ya la tienen en su casa</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 03 IDENTIFICACION ---------- */}
      <Seccion className={SUPERFICIE}>
        <div className="grid md:grid-cols-2 gap-7 md:gap-14 items-center">
          <div className="space-y-4">
            <H2>¿Otra reunión en la que nadie sabe qué hacer?</H2>
            <p className={`text-[15px] md:text-lg leading-relaxed ${TEXTO_2}`}>
              La música está puesta, los amigos llegaron... pero falta algo para arrancar. Torre Picante pone un
              reto sobre la mesa y hace que cada turno sea impredecible.
            </p>
            <div className="grid grid-cols-3 gap-2 md:gap-3 pt-1">
              {[
                { Icono: Snowflake, t: "Rompe el hielo" },
                { Icono: Laugh, t: "Saca risas y reacciones" },
                { Icono: Users, t: "Hace participar al grupo" },
              ].map(({ Icono, t }) => (
                <div key={t} className={`rounded-xl ${FONDO} border border-white/10 px-2 py-3 text-center`}>
                  <Icono className="mx-auto mb-1.5 h-6 w-6 text-[#FF7B00]" />
                  <p className="text-[12px] md:text-sm font-bold leading-tight">{t}</p>
                </div>
              ))}
            </div>
          </div>
          <img
            src={imgProblema}
            srcSet={`${imgProblema640} 640w, ${imgProblema} 1080w`}
            sizes="(min-width: 1140px) 513px, (min-width: 768px) calc(50vw - 72px), calc(100vw - 32px)"
            alt="Un invitado aburrido en una reunión que no arranca"
            width={1080}
            height={1080}
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-2xl shadow-2xl md:order-first"
          />
        </div>
      </Seccion>

      {/* ---------- 04 LA SOLUCION ---------- */}
      <Seccion>
        <div className="grid md:grid-cols-2 gap-7 md:gap-14 items-center">
          <div className="space-y-4">
            <H2>
              No es solo sacar un bloque. <span className="text-[#FF7B00]">Es descubrir qué te toca.</span>
            </H2>
            <p className={`text-[15px] md:text-lg leading-relaxed ${TEXTO_2}`}>
              En cada turno, alguien elige una pieza, lee el reto y el grupo sigue el juego. Cuanto más avanza la
              partida, más difícil es mantener la torre en pie.
            </p>
            <div className="hidden md:block pt-2">
              <CtaBoton onClick={handleBuyClick} texto="QUIERO JUGAR CON MIS AMIGOS" variante="borde" />
            </div>
          </div>
          <img
            src={imgPartida}
            srcSet={`${imgPartida360} 360w, ${imgPartida} 680w`}
            sizes="(min-width: 768px) 513px, calc(100vw - 32px)"
            alt="Grupo de amigos riéndose mientras uno saca un bloque de la Torre Picante"
            width={680}
            height={768}
            loading="lazy"
            decoding="async"
            className="w-full max-w-md mx-auto h-auto rounded-2xl shadow-2xl"
          />
          <div className="md:hidden">
            <CtaBoton onClick={handleBuyClick} texto="QUIERO JUGAR CON MIS AMIGOS" variante="borde" />
          </div>
        </div>
      </Seccion>

      {/* ---------- 05 COMO SE JUEGA ---------- */}
      <Seccion className={SUPERFICIE}>
        <H2 className="text-center mb-8 md:mb-12">Así de fácil empieza la diversión</H2>
        <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
          {PASOS.map((p, i) => (
            <li key={p.t} className={`overflow-hidden rounded-2xl border border-white/10 ${FONDO}`}>
              <img
                src={p.src}
                srcSet={`${p.src640} 640w, ${p.src} 1024w`}
                sizes="(min-width: 768px) 360px, calc(100vw - 32px)"
                alt={p.alt}
                width={p.w}
                height={p.h}
                loading="lazy"
                decoding="async"
                className="w-full h-auto"
              />
              <div className="flex items-start gap-3 p-4 md:p-5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${DEGRADADO} text-lg font-extrabold`}>
                  {i + 1}
                </span>
                <div>
                  <p className="font-extrabold text-[16px] md:text-lg tracking-wide">{p.t}</p>
                  <p className={`text-[14px] md:text-base ${TEXTO_2}`}>{p.d}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className={`mt-6 text-center text-[13px] md:text-sm ${TEXTO_2} max-w-2xl mx-auto`}>
          Juego para adultos. Se puede disfrutar sin consumir alcohol; nadie está obligado a participar en un reto.
        </p>
      </Seccion>

      {/* ---------- 06 INTRIGA ---------- */}
      <Seccion>
        <div className="grid md:grid-cols-2 gap-7 md:gap-14 items-center">
          <div className="space-y-4">
            <H2>Cada bloque es una sorpresa 🌶️</H2>
            <p className={`text-[15px] md:text-lg leading-relaxed ${TEXTO_2}`}>
              Algunos retos provocan carcajadas. Otros hacen que todos miren al siguiente jugador. Lo único seguro
              es que nadie sabe cuál le tocará sacar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip>Retos inesperados</Chip>
              <Chip>Diversión en grupo</Chip>
              <Chip>Partidas diferentes</Chip>
            </div>
          </div>
          <img
            src={imgJugando}
            srcSet={`${imgJugando640} 640w, ${imgJugando} 1080w`}
            sizes="(min-width: 1140px) 513px, (min-width: 768px) calc(50vw - 72px), calc(100vw - 32px)"
            alt="Chica sacando un bloque de la Torre de Shots Picante, con la caja al lado"
            width={1080}
            height={1221}
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-2xl shadow-2xl"
          />
        </div>
      </Seccion>

      {/* ---------- 07 OCASIONES ---------- */}
      <Seccion className={SUPERFICIE}>
        <div className="grid md:grid-cols-2 gap-7 md:gap-14 items-center">
          <div className="space-y-4">
            <H2>Llévala a la próxima reunión</H2>
            <p className={`text-[15px] md:text-lg leading-relaxed ${TEXTO_2}`}>
              Funciona como dinámica para una previa, cumpleaños, reunión con amigos o noche de juegos entre adultos.
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip>🎉 Cumpleaños</Chip>
              <Chip>🏠 Reuniones</Chip>
              <Chip>🎲 Noches de juegos</Chip>
              <Chip>🔥 Previas</Chip>
            </div>
          </div>
          <img
            src={imgOcasiones}
            srcSet={`${imgOcasiones640} 640w, ${imgOcasiones} 1000w`}
            sizes="(min-width: 1140px) 513px, (min-width: 768px) calc(50vw - 72px), calc(100vw - 32px)"
            alt="Grupo de amigos celebrando una partida de la Torre Picante en un cumpleaños"
            width={1000}
            height={1000}
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-2xl shadow-2xl"
          />
        </div>
      </Seccion>

      {/* ---------- 08 CALIDAD ---------- */}
      <Seccion>
        <div className="max-w-3xl mx-auto text-center">
          <div className="space-y-4">
            <H2>Se ve bien en fotos. Mejor cuando lo tienes en la mesa.</H2>
            <p className={`text-[15px] md:text-lg leading-relaxed ${TEXTO_2}`}>
              51 piezas de madera de pino, con retos impresos, listas para armar la torre y empezar la partida.
            </p>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {[
                { Icono: TreePine, t: "Madera real" },
                { Icono: Type, t: "Retos impresos en bloques" },
                { Icono: Repeat, t: "Juego físico para volver a usar" },
              ].map(({ Icono, t }) => (
                <div key={t} className={`rounded-xl ${SUPERFICIE} border border-white/10 px-2 py-3 text-center`}>
                  <Icono className="mx-auto mb-1.5 h-6 w-6 text-[#FF7B00]" />
                  <p className="text-[12px] md:text-sm font-bold leading-tight">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Seccion>

      {/* ---------- 09 QUE RECIBES ---------- */}
      <Seccion className={SUPERFICIE}>
        <div className="grid md:grid-cols-2 gap-7 md:gap-14 items-center">
          <div className="space-y-5">
            <H2>Esto llega con tu Torre Picante</H2>
            <ul className="space-y-3">
              {[
                "1 Torre Picante con 51 bloques de madera",
                "1 vaso tequilero",
                "Instrucciones para jugar",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[16px] md:text-lg font-semibold">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#FF7B00]" />
                  {t}
                </li>
              ))}
              <li className="flex items-start gap-3 text-[16px] md:text-lg font-semibold text-yellow-200">
                <Gift className="mt-0.5 h-6 w-6 shrink-0 text-yellow-300" />
                Ebook digital GRATIS: 25 juegos para fiestas
              </li>
            </ul>
            <p className={`text-[15px] md:text-lg ${TEXTO_2}`}>
              Todo para tener una nueva dinámica lista en tu próxima reunión.
            </p>
          </div>
          <img
            src={imgCajaOferta}
            alt="Caja de la Torre de Shots Picante"
            width={520}
            height={720}
            loading="lazy"
            decoding="async"
            className="w-full max-w-sm mx-auto h-auto rounded-2xl shadow-2xl"
          />
        </div>
      </Seccion>

      {/* ---------- 10 REGALO DIGITAL ---------- */}
      <Seccion>
        <div className="grid md:grid-cols-[2fr_3fr] gap-7 md:gap-14 items-center">
          <img
            src={imgEbook}
            alt="Portada del ebook 25 Juegos para Fiestas de ShotyGames"
            width={512}
            height={800}
            loading="lazy"
            decoding="async"
            className="w-[62%] max-w-[300px] mx-auto h-auto rounded-xl shadow-[0_20px_50px_-15px_rgba(255,123,0,0.55)] rotate-[-2deg]"
          />
          <div className="space-y-4 text-center md:text-left">
            <span className="inline-block rounded-full bg-yellow-300 px-3 py-1 text-[12px] font-extrabold tracking-wide text-[#101014]">
              INCLUIDO SIN COSTO EXTRA
            </span>
            <H2>Y además, te llevas un regalo para seguir jugando 🎁</H2>
            <p className="text-lg md:text-xl font-bold text-[#FF7B00]">Ebook digital: 25 juegos para fiestas</p>
            <p className={`text-[15px] md:text-lg leading-relaxed ${TEXTO_2}`}>
              Ideas para que tengas más dinámicas que probar en tus reuniones, además de la Torre Picante. Viene
              dentro de la caja, en una tarjeta con código QR para descargarlo.
            </p>
            <RelojRegalo restante={regalo.restante} className="md:justify-start" />
          </div>
        </div>
      </Seccion>

      {/* ---------- 11 MICRO-CTA ---------- */}
      <section className={`px-4 py-10 md:py-14 ${DEGRADADO}`}>
        <div className="mx-auto max-w-xl text-center space-y-4">
          <p className="text-[22px] md:text-3xl font-extrabold leading-tight">
            Tu próxima reunión puede tener un reto nuevo en cada turno.
          </p>
          <p className="text-5xl md:text-6xl font-extrabold tabular-nums">{PRECIO_TXT}</p>
          <CtaBoton onClick={handleBuyClick} texto="🔥 PEDIR TORRE PICANTE · PAGO CONTRAENTREGA" variante="blanco" />
          <p className="text-[13px] md:text-sm font-semibold text-white/90">Envío gratis a todo Ecuador</p>
        </div>
      </section>

      {/* ---------- 12 PRUEBA VISUAL: videos reales ---------- */}
      <Seccion className={SUPERFICIE}>
        <div className="max-w-2xl mx-auto text-center mb-6 md:mb-10 space-y-3">
          <H2>Así se ve la experiencia fuera de las fotos de catálogo</H2>
          <p className={`text-[15px] md:text-lg ${TEXTO_2}`}>
            Mira los detalles de la caja, la torre armada y cómo se ve durante una partida.
          </p>
        </div>
        <TikTokCarrusel videos={TIKTOKS} />
        <p className={`mt-2 text-center text-xs ${TEXTO_2} md:hidden`}>👉 Desliza y toca para reproducir</p>
      </Seccion>

      {/* ---------- 13 RESEÑAS ---------- */}
      <Seccion>
        <div className="text-center max-w-xl mx-auto mb-6 md:mb-10">
          <div className="flex justify-center gap-1 mb-3" aria-label="5 de 5 estrellas">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-[#FF7B00] text-[#FF7B00]" />
            ))}
          </div>
          <H2>Lo que opinan quienes ya jugaron</H2>
        </div>
        <div className="-mx-4 px-4 flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
          {RESENAS.map((r) => (
            <article
              key={r.nombre}
              className={`snap-center shrink-0 w-[80%] sm:w-[46%] md:w-auto flex flex-col overflow-hidden rounded-2xl border border-white/10 ${SUPERFICIE}`}
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
                <div className="flex gap-0.5" aria-label="5 de 5 estrellas">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#FF7B00] text-[#FF7B00]" />
                  ))}
                </div>
                <p className="flex-1 text-[14px] md:text-base leading-relaxed">“{r.texto}”</p>
                <p className="text-sm font-bold">
                  {r.nombre} <span className={`font-normal ${TEXTO_2}`}>— {r.ciudad}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className={`mt-2 text-center text-xs ${TEXTO_2} md:hidden`}>👉 Desliza para ver más reseñas</p>
      </Seccion>

      {/* ---------- 14 CONFIANZA (bloque claro) ---------- */}
      <Seccion className="bg-[#F5F3F1] text-[#101014]">
        <H2 className="text-center mb-8 md:mb-10">Compra directamente en ShotyGames</H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {[
            { Icono: Truck, t: "Envío gratis", d: "A todo Ecuador vía Servientrega. Ya está incluido en el precio." },
            { Icono: Banknote, t: "Pagas al recibir", d: "No necesitas pagar por adelantado al realizar el pedido." },
            { Icono: Package, t: "Producto físico", d: "Recibirás la Torre Picante y los componentes mostrados en la oferta." },
            { Icono: MessageCircle, t: "Confirmación del pedido", d: "Te contactaremos por WhatsApp para revisar los datos antes del despacho." },
          ].map(({ Icono, t, d }) => (
            <div key={t} className="flex gap-3 rounded-2xl bg-white p-4 md:p-5 shadow-sm border border-black/5 lg:flex-col">
              <Icono className="h-8 w-8 shrink-0 text-[#FF3D00]" />
              <div>
                <p className="font-extrabold text-[16px] md:text-lg">{t}</p>
                <p className="text-[14px] text-[#4a4850]">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      {/* ---------- 15 OFERTA FINAL ---------- */}
      <section className="relative overflow-hidden px-4 py-14 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,61,0,0.35),transparent_65%)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl">
          <H2 className="text-center mb-8">Lleva la Torre Picante a tu próxima fiesta 🌶️</H2>
          <div className={`rounded-3xl ${SUPERFICIE} border border-[#FF3D00]/40 p-5 md:p-8 shadow-[0_30px_80px_-30px_rgba(255,61,0,0.6)]`}>
            <div>
              <ul className="mx-auto w-fit space-y-2.5">
                {[
                  "51 bloques con retos",
                  "1 vaso tequilero",
                  "Ebook digital de 25 juegos de regalo",
                  "Envío gratis a todo Ecuador",
                  "Pago contraentrega",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-[15px] md:text-lg font-semibold">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#FF7B00]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="my-6 h-px bg-white/10" />
            <div className="text-center space-y-4">
              <div>
                <p className={`text-sm ${TEXTO_2}`}>Precio único</p>
                <p className="text-5xl md:text-7xl font-extrabold tabular-nums">{PRECIO_TXT}</p>
              </div>
              <RelojRegalo restante={regalo.restante} />
              <p className={`text-[13px] md:text-sm ${TEXTO_2}`}>Completa tus datos reales para poder coordinar el envío.</p>
              <CtaBoton onClick={handleBuyClick} texto="🔥 PEDIR AHORA Y PAGAR AL RECIBIR" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 16 TRANSPARENCIA DEL PEDIDO (bloque claro) ---------- */}
      <Seccion className="bg-[#F5F3F1] text-[#101014]">
        <H2 className="text-center mb-8 md:mb-10">Así funciona tu pedido contraentrega</H2>
        <ol className="grid gap-3 md:grid-cols-3 md:gap-5">
          {[
            { Icono: ClipboardList, t: "Realiza tu pedido", d: "Completa nombre, teléfono y dirección correctos." },
            { Icono: MessageCircle, t: "Confirma tus datos", d: "Si nuestro equipo te contacta, responde para coordinar la entrega." },
            { Icono: PartyPopper, t: "Recibe tu Torre Picante", d: "Ten disponible el pago al momento de recibirla." },
          ].map(({ Icono, t, d }, i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-white p-4 md:p-5 shadow-sm border border-black/5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${DEGRADADO} font-extrabold text-white`}>
                {i + 1}
              </span>
              <div>
                <p className="flex items-center gap-1.5 font-extrabold text-[16px] md:text-lg">
                  {t} <Icono className="h-4 w-4 text-[#FF3D00]" />
                </p>
                <p className="text-[14px] text-[#4a4850]">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 mx-auto max-w-2xl rounded-xl bg-white/70 border border-black/5 px-4 py-3 text-center text-[14px] text-[#4a4850]">
          Haz el pedido solo si realmente deseas recibirlo. Preparar y transportar cada paquete genera costos
          incluso cuando no se recibe.
        </p>
      </Seccion>

      {/* ---------- 17 FAQ ---------- */}
      <Seccion>
        <div className="max-w-3xl mx-auto">
          <H2 className="text-center mb-6 md:mb-10">Preguntas frecuentes</H2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-[16px] md:text-lg font-bold hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className={`text-[15px] md:text-base leading-relaxed ${TEXTO_2}`}>
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Seccion>

      {/* ---------- 18 ULTIMO CTA ---------- */}
      <section className={`px-4 py-14 md:py-20 ${SUPERFICIE}`}>
        <div className="mx-auto max-w-xl text-center space-y-4">
          <H2>¿LISTOS PARA EL PRIMER RETO? 😈</H2>
          <p className={`text-[15px] md:text-lg ${TEXTO_2}`}>Haz que tu próxima reunión tenga una historia más para contar.</p>
          <p className="text-5xl font-extrabold tabular-nums">{PRECIO_TXT}</p>
          <CtaBoton onClick={handleBuyClick} texto="🔥 QUIERO MI TORRE PICANTE" />
          <p className={`text-[13px] md:text-sm ${TEXTO_2}`}>Envío gratis a todo Ecuador · Pago contraentrega</p>
          <p className="pt-4 text-[12px] text-white/50">Producto dirigido a adultos (+18). Juega con responsabilidad.</p>
        </div>
      </section>

      <Footer />

      {/* ---------- BARRA FIJA MOVIL ---------- */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          mostrarBarra ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!mostrarBarra}
      >
        <div className={`bg-[#101014]/95 backdrop-blur border-t border-white/10 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl`}>
          <p className="text-center text-[11px] font-semibold text-yellow-300 mb-1.5">
            🎁 Ebook de 25 juegos gratis · cierra en <span className="tabular-nums font-bold">{regalo.restante}</span>
          </p>
          <button
            type="button"
            onClick={handleBuyClick}
            tabIndex={mostrarBarra ? 0 : -1}
            className={`flex w-full min-h-[52px] flex-col items-center justify-center rounded-xl ${DEGRADADO} font-extrabold leading-tight shadow-xl`}
          >
            <span className="text-[16px]">PEDIR POR {PRECIO_TXT}</span>
            <span className="text-[11px] font-semibold text-white/90">Pagas al recibir</span>
          </button>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
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

export default TorrePicanteV3Landing;
