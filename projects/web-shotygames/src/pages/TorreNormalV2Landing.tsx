import { useState, useEffect, useRef, type ReactNode } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { useRestanteRegalo } from "@/hooks/useRegaloDeHoy";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import Testimonials from "@/components/Testimonials";
import { TikTokCarrusel, type VideoTikTok } from "@/components/TikTokCarrusel";
import { CarouselImage } from "@/components/CarouselImage";
import { useSlideActual } from "@/hooks/useSlideActual";
import { trackViewContent, trackInitiateCheckout } from "@/lib/pixels";
import { Gift, Truck, Clock, Banknote, Package, Wine, BookOpen, Hand, Flame } from "lucide-react";
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
import lifeRonda from "@/assets/torre-normal-life-ronda.webp";
import fiesta360 from "@/assets/torre-normal-life-fiesta-360.webp";
import fiesta640 from "@/assets/torre-normal-life-fiesta-640.webp";
import retoEx from "@/assets/previa-reto-ex.webp";
import retoEx360 from "@/assets/previa-reto-ex-360.webp";
import retoEx640 from "@/assets/previa-reto-ex-640.webp";
import nocheEx360 from "@/assets/previa-noche-ex-360.webp";
import nocheEx640 from "@/assets/previa-noche-ex-640.webp";
import retoCachudo360 from "@/assets/previa-reto-cachudo-360.webp";
import retoCachudo640 from "@/assets/previa-reto-cachudo-640.webp";
import ttCachudo from "@/assets/tiktok/7629538696882146567.webp";
import ttAmigo from "@/assets/tiktok/7628628724530941192.webp";
import ttControl from "@/assets/tiktok/7628410923962682632.webp";
import ttEx from "@/assets/tiktok/7565926233649810706.webp";
import portadaGuia from "@/assets/ebook-25-juegos-portada-120.webp";
import torrePicanteImgThumb from "@/assets/thumbs/torre-picante.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import emparejadosPortadaThumb from "@/assets/thumbs/emparejados-portada.webp";

// Vive en /landing/torre-normal-v2. La que sigue vendiendo (y recibiendo los
// anuncios) es /landing/torre-normal: ésta es la variante para comparar.
// 2026-10-25: copy del documento "Reescribir landing de ventas" de la IA externa,
// filtrado con las decisiones de Fabián (ruta nueva, claims del producto, contador).
// 2026-10-26: "hay mucho texto" → mínimo de palabras, imagen primero y enfocada al
// feriado del sáb 31-oct al mar 3-nov (Difuntos + Cuenca). Mismo día, 2da vuelta de
// Fabián: sin la etiqueta del feriado arriba, el hero es el gráfico de la torre con
// sus retos (el que abría el carrusel de fotos reales), sin el "+3.500" del inicio,
// tachado de la guía en $9.90 (suelta se vende a $4.90 en Ebook25JuegosLanding),
// el bloque "Que el feriado no se quede sin plan" sube y se vuelve mosaico, y hay
// sección de videos de TikTok (vacía hasta que pase los links).
// Fotos generadas: Descargas "LA PREVIA - GENERADAS LOTE1/LOTE2" (las de los
// anuncios; en ellas la caja dice "LA PREVIA" y el bloque "…O TOMA 3 SHOTS", y los
// bloques de las fotos reales dicen solo "LLAMA A TU EX"). De la v1 se reusan
// `life-fiesta` y `life-ronda`; `life-producto` NO (2 vasos y la caja dice "Blaques con retas").
// OJO: el nombre del producto no se toca — n8n lo compara exacto.
const PRODUCT_NAME = "Torre La Previa";
const PRECIO = 29.99;
const PRECIO_TXT = `$${PRECIO.toFixed(2)}`;

const GRADIENTE = "bg-gradient-to-r from-[#ff3d00] to-[#ff7b00]";

// Fotos REALES de los bloques (la foto del producto sube al hero; acá van los
// retos que mejor se entienden de un vistazo primero).
const FOTOS_REALES = [
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

const MOSAICO = [
  { src360: retoEx360, src640: retoEx640, alt: "Una amiga muestra el bloque «Llama a tu ex o toma 3 shots» frente a la Torre La Previa" },
  { src360: retoCachudo360, src640: retoCachudo640, alt: "Una amiga muestra el bloque «Toma el más cachudo/a del grupo» frente a la Torre La Previa" },
  { src360: nocheEx360, src640: nocheEx640, alt: "Amigos de noche reaccionando al reto «Llama a tu ex o toma 3 shots»" },
  { src360: fiesta360, src640: fiesta640, alt: "Grupo de amigos celebrando alrededor de la Torre La Previa" },
];

// Videos de TikTok de @shotygames_ec (los 4 links que pasó Fabián el 2026-10-26; la
// sección solo se ve si hay alguno). Para sumar:
//   node scripts/tiktok-portadas.mjs <link1> <link2> ...   → baja la portada a src/assets/tiktok/<id>.webp
// y pegar acá { id, portada: <import>, alt, autor }.
const TIKTOKS: VideoTikTok[] = [
  { id: "7629538696882146567", portada: ttCachudo, alt: "Ya sabes a quién mandarle este video", autor: "@shotygames_ec" },
  { id: "7628628724530941192", portada: ttAmigo, alt: "No le mandes este video a tu amigo", autor: "@shotygames_ec" },
  { id: "7628410923962682632", portada: ttControl, alt: "Dijiste que no ibas a tomar… pero viste este juego", autor: "@shotygames_ec" },
  { id: "7565926233649810706", portada: ttEx, alt: "¿Y tú qué harías si te sale este reto?", autor: "@shotygames_ec" },
];

const PASOS = [
  { Icono: Package, t: "Arma la torre" },
  { Icono: Hand, t: "Saca un bloque" },
  { Icono: BookOpen, t: "Lee el reto en voz alta" },
  { Icono: Flame, t: "Cúmplelo o toma 3 shots" },
];

const INCLUYE = [
  { Icono: Package, t: "51 bloques con retos" },
  { Icono: Wine, t: "1 vaso tequilero" },
  { Icono: BookOpen, t: "Instrucciones de juego" },
];

const FAQS = [
  { q: "¿Cuándo llega?", a: "2 a 4 días hábiles a todo Ecuador. Si pides antes de las 3 de la tarde, sale el mismo día." },
  { q: "¿Pago por adelantado?", a: "No. Pagas en efectivo al recibir. Confirmas por WhatsApp con un mensaje ya escrito." },
  { q: "¿Es muy fuerte?", a: "Es la más suave de las tres. Es para adultos (+18): hay retos de ex, mensajes y bromas personales." },
  { q: "¿Aguanta que se moje?", a: "Sí. Pino premium, lijado y sellado: no se daña ni se borra el texto." },
  { q: "¿Para cuántos? ¿Hay que tomar?", a: "Desde 3 personas, sin límite. Tomar es opcional: pueden adaptar la dinámica sin alcohol." },
  { q: "¿Algo más atrevido?", a: "Agrega la Torre Picante o la Parejas (+$10 cada una) al hacer tu pedido." },
];

const Seccion = ({ children, className = "", ancho = "max-w-5xl" }: { children: ReactNode; className?: string; ancho?: string }) => (
  <section className={`px-4 py-8 md:py-14 ${className}`}>
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

  // Para saber qué foto del carrusel está a la vista y no bajar las otras 8.
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
        title="Torre La Previa: el juego del feriado | ShotyGames Ecuador"
        description="Este feriado lleva La Previa: 51 bloques con retos para jugar entre amigos. $29.99, envío gratis y pago al recibir. Pide hoy y recibe una guía digital de regalo."
        canonical="https://www.shotygames.com/landing/torre-normal-v2"
        image={`https://www.shotygames.com${retoEx}`}
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
              Este feriado, tú llevas la torre.
              <span className={`mt-1 block text-[22px] md:text-3xl ${GRADIENTE} bg-clip-text text-transparent`}>
                El grupo pone las anécdotas.
              </span>
            </h1>
          </div>

          <div className="mt-4 md:mt-0 md:col-start-2 md:row-start-1 md:row-span-2 md:self-center">
            <div className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl">
              <img
                src={torreNormal1}
                alt="Torre La Previa: la caja, 1 vaso de shot, 51 bloques con retos y algunos de los retos"
                width={675}
                height={675}
                decoding="sync"
                {...{ fetchpriority: "high" }}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3 md:col-start-1 md:row-start-2 md:mt-5 md:self-start">
            <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#ff3d00]/20 bg-white px-4 py-3 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-wide md:text-base">Torre La Previa</p>
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
          <H2>4 días de feriado. ¿Y nadie propone nada?</H2>
          <p className={`text-xl font-bold md:text-2xl ${GRADIENTE} bg-clip-text text-transparent`}>La torre lo propone por ti.</p>
        </div>
      </Seccion>

      {/* ---------- CÓMO SE JUEGA ---------- */}
      <Seccion>
        <H2 className="mb-6 text-center">Saca. Lee. Cumple.</H2>
        <div className="grid items-center gap-5 md:grid-cols-2 md:gap-10">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl md:aspect-square">
            <img
              src={lifeRonda}
              alt="Sacando un bloque de la Torre La Previa"
              width={1000}
              height={1000}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-[50%_45%]"
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
        <p className="mt-4 text-center text-xs text-muted-foreground md:text-sm">
          Si cae la torre, penitencia final 💥 · Juego para adultos (+18)
        </p>
      </Seccion>

      {/* ---------- MOSAICO DE FOTOS + EL FERIADO ---------- */}
      <Seccion className="bg-muted/30" ancho="max-w-xl">
        <div className="space-y-4 text-center">
          <div className="grid grid-cols-2 gap-2">
            {MOSAICO.map((foto) => (
              <div key={foto.alt} className="aspect-square overflow-hidden rounded-xl shadow-lg">
                <img
                  src={foto.src360}
                  srcSet={`${foto.src360} 360w, ${foto.src640} 640w`}
                  sizes="(min-width: 640px) 284px, calc(50vw - 20px)"
                  alt={foto.alt}
                  width={360}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <H2>Que el feriado no se quede sin plan.</H2>
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

      {/* ---------- PRUEBA SOCIAL (componente compartido) ---------- */}
      <Testimonials sinParejas />

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
