import { useState, useEffect, useRef } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Truck, CheckCircle2, Banknote, Heart, Clock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import Testimonials from "@/components/Testimonials";
import torreParejas1 from "@/assets/torre-parejas-1.webp";
import torreParejas2 from "@/assets/torre-parejas-2.webp";
import torreParejas3 from "@/assets/torre-parejas-3.webp";
import torreParejas4 from "@/assets/torre-parejas-4.webp";
import torreParejas5 from "@/assets/torre-parejas-5.webp";
import torreParejas6 from "@/assets/torre-parejas-6.webp";
import torreParejas7 from "@/assets/torre-parejas-7.webp";
import torreParejas8 from "@/assets/torre-parejas-8.webp";
import torreParejas9 from "@/assets/torre-parejas-9.webp";
import torreParejas10 from "@/assets/torre-parejas-10.webp";
import torreParejas11 from "@/assets/torre-parejas-11.webp";
import torreNormalImgThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torrePicanteImgThumb from "@/assets/thumbs/torre-picante.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import emparejadosPortadaThumb from "@/assets/thumbs/emparejados-portada.webp";
import unboxingVideo from "@/assets/torre-parejas-unboxing.mp4";
import unboxingPoster from "@/assets/torre-parejas-unboxing-poster.webp";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { CarouselImage } from "@/components/CarouselImage";
import { useSlideActual } from "@/hooks/useSlideActual";
import { LazyVideo } from "@/components/LazyVideo";
import { useRegaloDeHoy } from "@/hooks/useRegaloDeHoy";

// Creativos del set de septiembre 2026. A diferencia de la landing original,
// acá el copy de la mitad de arriba va QUEMADO EN LA IMAGEN: cada pieza es un
// bloque completo (titular + subtítulo + bullets), así que la página no repite
// ese texto en HTML. El orden es el del embudo, no el de los archivos.
//
// OJO: la primera y la última llevan el precio $29.99 dibujado. Si cambia el
// precio hay que regenerarlas — no alcanza con tocar `productPrice`.
import imgOferta from "@/assets/tp2-10-oferta.webp";
import imgAntesDespues from "@/assets/tp2-02-antes-despues.webp";
import imgRompeHielo from "@/assets/tp2-03-rompe-el-hielo.webp";
import imgComoSeJuega from "@/assets/tp2-05-como-se-juega.webp";
import imgQueIncluye from "@/assets/tp2-06-que-incluye.webp";
import imgComparativa from "@/assets/tp2-07-comparativa.webp";
import imgOcasiones from "@/assets/tp2-08-ocasiones.webp";
import imgBonoGuia from "@/assets/tp2-09-bono-guia.webp";
import imgHeroPlan from "@/assets/tp2-01-hero-plan.webp";

/** El alt importa: es lo unico que lee Google y un lector de pantalla, porque
 *  todo el mensaje de estas piezas esta dentro del pixel.
 *
 *  El array va en el mismo orden en que se pinta, para que reordenar el embudo
 *  sea mover una línea y no recalcular índices. */
const PIEZAS = [
  { src: imgOferta, w: 1122, h: 1402, alt: "Adios a la rutina. Torre de Shots Parejas por $29.99, envio gratis, pago contraentrega y guia digital de 30 posiciones de regalo solo hoy." },
  { src: imgAntesDespues, w: 1122, h: 1402, alt: "Antes y despues: de estar cada uno con su celular a jugar la Torre de Shots Parejas." },
  { src: imgRompeHielo, w: 1122, h: 1402, alt: "Rompe el hielo en minutos: mas conexion, mas emocion y cero silencios incomodos." },
  { src: imgComoSeJuega, w: 1122, h: 1402, alt: "Como se juega: saca un bloque, lee el reto y cumplelo. Mientras mas avanzan, mas atrevida se pone la noche." },
  { src: imgQueIncluye, w: 1122, h: 1402, alt: "Todo listo para jugar: 51 bloques con retos, 1 vaso tequilero, caja lista para regalo, para 2 jugadores mayores de 18." },
  { src: imgComparativa, w: 1024, h: 1536, alt: "No todas son iguales: la nuestra es 100% madera de pino premium, se puede mojar, no se borra el texto, dura por anos, incluye shot de vidrio, envio gratis y pago contraentrega. Otras del mercado son de MDF generico, se danan con humedad y el texto se desgasta." },
  { src: imgOcasiones, w: 1122, h: 1402, alt: "Ideal para parejas que quieren mas que solo ver una serie: citas en casa, aniversarios, cumpleanos y noches especiales." },
  { src: imgBonoGuia, w: 1122, h: 1402, alt: "Hoy te llevas un regalo mas: compra la Torre de Shots Parejas y recibe gratis la guia digital de 30 posiciones." },
  { src: imgHeroPlan, w: 1122, h: 1402, alt: "Tu proxima noche ya tiene plan. Torre de Shots Parejas por $29.99 con envio gratis, pago contraentrega y la guia digital de 30 posiciones de regalo." },
];

/** Fotos reales de los bloques, las mismas de la landing original. Acá pesan
 *  más que allá: van justo después del creativo de retos, que muestra ejemplos
 *  suaves ("di 3 cosas que te gustan"). Estas son las de verdad. */
const FOTOS_REALES = [
  { src: torreParejas1, badge: "Foto real 📸", alt: "Torre Parejas - empaque completo" },
  { src: torreParejas2, badge: "Reto real 🔥", alt: "Castígame con 5 nalgadas" },
  { src: torreParejas3, badge: "Reto real 💋", alt: "Juegas en ropa interior durante 3 rondas" },
  { src: torreParejas4, badge: "Reto real 💞", alt: "Hazle un masaje por 2 minutos" },
  { src: torreParejas5, badge: "Reto real 🌶️", alt: "Véndale los ojos y juega con su cuerpo durante 1 minuto" },
  { src: torreParejas6, badge: "Reto real 😈", alt: "Juegas desnudo/a durante 2 rondas" },
  { src: torreParejas7, badge: "Reto real ⚡", alt: "Hazme un rapidín en el lugar que elijas" },
  { src: torreParejas8, badge: "Reto real 💋", alt: "Quítame la ropa interior con la boca" },
  { src: torreParejas9, badge: "Reto real 😏", alt: "Mírame fíjamente mientras te tocas por 1 minuto" },
  { src: torreParejas10, badge: "Reto real 💑", alt: "Hazme terminar con tus manos" },
  { src: torreParejas11, badge: "Reto real 🔥", alt: "Hazme s❤️x❤️ oral por 3 minutos" },
];

const TorreParejasV2Landing = () => {
  const productName = "Torre de Shots Parejas";
  const productPrice = 29.99;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();
  const regalo = useRegaloDeHoy();

  // La barra es `fixed`, así que hace falta un espaciador que empuje el
  // contenido. Estaba clavado en h-14 y la barra medía 32px: quedaba una
  // franja blanca de 24px. Medirla en vivo lo deja pegado siempre, y aguanta
  // que el texto pase a dos líneas en pantallas angostas sin tapar el hero.
  // La barra fija de compra en móvil arranca oculta: al tope de la página el
  // CTA completo ya está en pantalla y los dos botones chocaban. Aparece
  // deslizándose apenas ese CTA sale de vista, que es cuando hace falta.
  // PENDIENTE: hacer que la barra fija aparezca al pasar el primer CTA.
  // El intento con IntersectionObserver y con listener de scroll no llegó a
  // disparar; queda para revisar con la página estable.

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
  // Para saber qué foto está a la vista y no bajar las otras 10.
  const [api, setApi] = useState<CarouselApi>();
  const slideActual = useSlideActual(api);

  useEffect(() => {
    if (shouldOpenCheckout) {
      setCheckoutOpen(true);
      setShouldOpenCheckout(false);
    }
  }, [shouldOpenCheckout, setShouldOpenCheckout]);

  useEffect(() => {
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'ViewContent', {
        content_name: productName,
        content_category: 'Juegos de Mesa',
        value: productPrice,
        currency: 'USD',
      });
    }
  }, []);

  const handleBuyClick = () => {
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: productName,
        content_category: 'Juegos de Mesa',
        value: productPrice,
        currency: 'USD',
      });
    }
    setCheckoutOpen(true);
  };

  /** Bloque de imagen a ancho completo. La primera se carga con prioridad
   *  (es el LCP); el resto en diferido, que son 9 piezas de ~145 KB. */
  const Pieza = ({ i }: { i: number }) => (
    <img
      src={PIEZAS[i].src}
      alt={PIEZAS[i].alt}
      width={PIEZAS[i].w}
      height={PIEZAS[i].h}
      loading={i === 0 ? "eager" : "lazy"}
      // La primera pieza es el LCP: se le pide prioridad alta al navegador.
      // En minúscula porque React 18 no reconoce `fetchPriority` en camelCase.
      {...(i === 0 ? { fetchpriority: "high" } : {})}
      decoding={i === 0 ? "sync" : "async"}
      className="w-full h-auto"
    />
  );

  /** Los 3 argumentos que matan las objeciones: no pagas nada ahora, no pagas
   *  envío, y encima te llevas algo. Van como badges y no como una línea de
   *  texto porque el resto de la página es 100% visual — un párrafo gris ahí
   *  abajo no lo lee nadie. */
  const CLAIMS = [
    { Icono: Banknote, titulo: "Pagas al recibir", pie: "En efectivo, en tu puerta" },
    { Icono: Truck, titulo: "Envío gratis", pie: "A todo Ecuador" },
    { Icono: Gift, titulo: "Guía de regalo", pie: "30 posiciones" },
  ];

  /** Dos variantes:
   *  - "completo": solo el primer CTA. Precio en el botón, los 3 badges y el
   *    reloj. Es el único punto donde el visitante todavía no vio esa info.
   *  - "simple": los de más abajo. Solo el botón — a esa altura ya vio precio,
   *    envío y regalo tres veces, repetirlo es ruido.
   *
   *  Los "simple" además se ocultan en móvil (`hidden md:block`): ahí la barra
   *  fija de abajo ya lleva un botón de compra pegado a la pantalla todo el
   *  scroll, así que un segundo botón en el medio del contenido no suma nada. */
  const Cta = ({ texto, variante = "simple" }: { texto: string; variante?: "completo" | "simple" }) => (
    <div
      className={
        variante === "completo"
          ? "container mx-auto px-4 py-8 md:py-10"
          : "container mx-auto hidden px-4 py-8 md:block md:py-10"
      }
    >
      <div className="max-w-xl mx-auto space-y-4">
        <Button
          onClick={handleBuyClick}
          size="lg"
          className="flex h-auto w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gradient-to-r from-[#e91e63] to-[#f50057] hover:from-[#e91e63]/90 hover:to-[#f50057]/90 text-white text-base md:text-2xl font-bold py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
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
                  className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-[#e91e63]/25 bg-[#e91e63]/5 px-2 py-3 text-center md:py-4"
                >
                  <Icono className="h-5 w-5 md:h-6 md:w-6 text-[#e91e63]" />
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
  );  const faqs = [
    {
      q: "¿Llega en empaque discreto?",
      a: "Sí. El paquete llega sellado y sin ninguna referencia al contenido por fuera. Nadie sabe qué hay adentro más que ustedes.",
    },
    {
      q: "¿De qué material es? ¿Se arruina si se derrama trago encima?",
      a: "Madera de pino 100% premium, lijada y sellada. Aguanta que le caiga trago encima sin dañarse ni borrarse el texto. Es un juego de shots: está hecha para eso.",
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
      q: "¿Los retos son muy fuertes?",
      a: "Arrancan suaves y románticos, y suben de intensidad de a poco. Ustedes deciden hasta dónde llegar — no es todo o nada.",
    },
    {
      q: "¿Sirve si llevamos poco tiempo juntos?",
      a: "Sí. Los primeros retos son para conocerse y reírse. Si recién arrancan, funciona igual de bien que con años juntos.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Torre de Shots Parejas ❤️ - Sal de la Rutina | ShotyGames Ecuador"
        description="51 retos para dos que convierten una noche cualquiera en una que van a recordar. Madera de pino premium. Pagas en efectivo al recibir. Envío gratis a todo Ecuador."
        canonical="https://www.shotygames.com/landing/torre-parejas"
        image={`https://www.shotygames.com${torreParejas1}`}
        type="product"
      />

      {/* Barra fija: mata las 2 objeciones mas grandes en el primer segundo */}
      <div
        ref={barraRef}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#e91e63] to-[#f50057] text-white py-3 md:py-3.5 px-4 text-center font-semibold shadow-lg"
      >
        <p className="text-[13px] md:text-base leading-snug">
          💵 Pagas al recibir · 🎁 Guía GRATIS hoy, cierra en{" "}
          <strong className="tabular-nums">{regalo.restante}</strong>
        </p>
      </div>
      <div style={{ height: altoBarra }} aria-hidden />

      {/* ---------- EMBUDO EN IMÁGENES ----------
          Las piezas van a sangre y pegadas entre sí: es una secuencia, no una
          galería. Los CTA cortan en los 3 puntos donde el creativo ya cerró un
          argumento (precio, cómo se juega, el regalo). */}
      <div className="mx-auto max-w-2xl">
        <Pieza i={0} />
      </div>

      <Cta texto="LA QUIERO EN MI CASA" variante="completo" />
      {/* Centinela: marca dónde termina el CTA de arriba. */}

      <div className="mx-auto max-w-2xl">
        <Pieza i={1} />
        <Pieza i={2} />
      </div>

      {/* ---------- RETOS REALES ----------
          Único lugar de la página donde se ven los retos: el creativo que los
          listaba se sacó, así que este carrusel carga solo con ese argumento. */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#e91e63] uppercase mb-2">
                Fotos reales, no render
              </p>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-3">
                Algunos de los retos que trae
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground">
                Son <strong className="text-foreground">51 bloques</strong> en total. Acá va una
                muestra, fotografiada bloque por bloque: arrancan suaves y suben — ustedes deciden
                hasta dónde llegar.
              </p>
            </div>

            <div className="relative">
              <Carousel opts={{ align: "center", loop: true }} setApi={setApi} className="w-full">
                <CarouselContent>
                  {FOTOS_REALES.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
                        <CarouselImage
                          src={image.src}
                          alt={image.alt}
                          index={index}
                          current={slideActual}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-4 right-4 bg-[#e91e63] text-white border-none text-sm md:text-base px-3 py-1">
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
        </div>
      </section>

      <div className="mx-auto max-w-2xl">
        <Pieza i={3} />
        <Pieza i={4} />
        {/* Comparativa "no todas son iguales": va acá porque recién después de
            ver qué trae la caja tiene sentido discutir contra qué se compara. */}
        <Pieza i={5} />
      </div>

      {/* ---------- VIDEO REAL DE UNBOXING ----------
          Se mantiene de la landing original: después de 6 piezas renderizadas,
          es la única prueba de que el producto existe fuera del render. */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          {/* Titular arriba del video: sin esto el mp4 quedaba suelto entre dos
              creativos y nadie sabía qué estaba mirando. */}
          <div className="text-center max-w-xl mx-auto mb-6 md:mb-8">
            <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-[#e91e63] uppercase mb-2">
              Video real, sin edición
            </p>
            <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-3">
              Así te llega a tu casa
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground">
              Abrimos la caja frente a la cámara: los <strong className="text-foreground">51 bloques con retos</strong>,
              el <strong className="text-foreground">vaso tequilero</strong> y las instrucciones. Esto es lo que
              recibes, no un render.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-[320px]">
            {/* preload="none" + poster: con preload="metadata" el navegador se
                bajaba la cabecera del mp4 apenas cargaba la página. Con
                autoPlay+muted arranca solo cuando entra en pantalla. */}
            <LazyVideo
              src={unboxingVideo}
              autoPlay
              loop
              muted
              playsInline
              poster={unboxingPoster}
              className="w-full h-full object-cover"
              aria-label="Video real desempacando la Torre de Shots Parejas"
            />
          </div>
          <p className="text-center text-xs md:text-sm text-muted-foreground mt-3">
            📦 Empaque discreto: llega sellado y sin referencias al contenido por fuera.
          </p>
        </div>
      </section>

      <Cta texto="PEDIR LA MÍA AHORA" />

      <div className="mx-auto max-w-2xl">
        <Pieza i={6} />
        <Pieza i={7} />
        <Pieza i={8} />
      </div>

      <Cta texto="PEDIR LA MÍA CON EL REGALO" />

      {/* ---------- PRUEBA SOCIAL ---------- */}
      <Testimonials />

      {/* ---------- LA OFERTA: recien aca aparece el precio ---------- */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#e91e63] to-[#f50057] opacity-95"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <Badge className="bg-white text-[#e91e63] text-sm md:text-base px-4 py-1.5 mb-4 font-bold">
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
                    Torre Parejas + vaso tequilero
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    <span className="text-white/60 line-through mr-2">$38</span>$29.99
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                  <span className="flex items-center gap-2">
                    <Gift className="w-5 h-5 flex-shrink-0 text-yellow-300" />
                    Guía Digital de 30 Posiciones
                  </span>
                  <span className="font-bold text-yellow-300 whitespace-nowrap">
                    <span className="text-white/60 line-through mr-2 font-normal">$6.90</span>GRATIS
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
                  🎁 <strong className="text-yellow-300">La Guía de 30 Posiciones va incluida en los pedidos de hoy.</strong>
                </p>

                {/* El reloj va acá, pegado al regalo: es lo que se pierde si lo
                    deja para mañana, no una cuenta regresiva del precio. */}
                <div className="border-t border-yellow-300/30 pt-3">
                  <p className="text-xs md:text-sm text-yellow-100/80 uppercase tracking-wider mb-1">
                    El regalo se cierra en
                  </p>
                  <p className="text-3xl md:text-5xl font-bold text-yellow-300 tabular-nums leading-none">
                    {regalo.restante}
                  </p>
                  <p className="text-xs md:text-sm text-yellow-100/70 mt-1.5">
                    Pídela hoy y llévate la guía digital de regalo.
                  </p>
                </div>
              </div>

              <p className="text-lg md:text-2xl font-bold">
                Pagas cuando la tengas en la mano 💵
              </p>

              <Button
                onClick={handleBuyClick}
                size="lg"
                className="w-full bg-white text-[#e91e63] hover:bg-white/90 text-lg md:text-2xl font-bold py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
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
              <Card className="p-6 text-center border-2 border-[#e91e63]/20">
                <Truck className="w-10 h-10 text-[#e91e63] mx-auto mb-3" />
                <p className="font-bold text-base md:text-lg mb-1">Envío gratis</p>
                <p className="text-sm text-muted-foreground">
                  A todo Ecuador vía Servientrega. El envío ya está incluido en el precio.
                </p>
              </Card>
              <Card className="p-6 text-center border-2 border-[#e91e63]/20">
                <Heart className="w-10 h-10 text-[#e91e63] mx-auto mb-3" />
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#e91e63] via-[#f50057] to-[#e91e63] opacity-95"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white space-y-5 md:space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold leading-tight">
              La próxima noche juntos puede ser igual a todas las anteriores
            </h2>
            <p className="text-base md:text-xl text-white/90">
              O puede ser la que se acuerden dentro de un año.
              La torre llega en 2-4 días hábiles: pagas cuando la tengas en la mano.
            </p>
            <p className="text-base md:text-lg font-semibold text-yellow-300">
              🎁 Si pides hoy, la Guía de 30 Posiciones va incluida —{" "}
              <span className="tabular-nums">quedan {regalo.restante}</span>
            </p>

            <Button
              onClick={handleBuyClick}
              size="lg"
              className="w-full md:w-auto bg-white text-[#e91e63] hover:bg-white/90 text-lg md:text-2xl font-bold px-8 md:px-14 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              PEDIR MI TORRE PAREJAS
            </Button>

            <p className="text-xs md:text-sm text-white/80">
              💵 Pagas al recibir · 🚚 Envío gratis · 🎁 Guía de 30 posiciones
            </p>
          </div>
        </div>
      </section>

      {/* ---------- STICKY MOBILE ---------- */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
        <div className="bg-gradient-to-r from-[#e91e63] to-[#f50057] px-3 pb-3 pt-2 shadow-2xl">
          <p className="text-center text-[11px] font-semibold text-white/95 mb-1.5">
            🎁 Guía de 30 Posiciones gratis · cierra en{" "}
            <span className="tabular-nums font-bold">{regalo.restante}</span>
          </p>
          <Button onClick={handleBuyClick} size="lg" className="w-full bg-white text-[#e91e63] hover:bg-white/90 font-bold text-base py-6 rounded-xl shadow-xl">
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
        productImage={torreParejas1}
        productId="torreParejas"
        upsells={[
          { id: 'torreNormal', name: 'Torre La Previa (para grupos)', price: 10, image: torreNormalImgThumb },
          { id: 'torrePicante', name: 'Torre Picante (para grupos)', price: 10, image: torrePicanteImgThumb },
          { id: 'dadosPlacer', name: 'Dados del Placer', price: 5, image: dadosDelPlacerImgThumb },
          { id: 'emparejados', name: 'Emparejados (juego digital)', price: 2.90, image: emparejadosPortadaThumb },
        ]}
      />
    </div>
  );
};

export default TorreParejasV2Landing;

