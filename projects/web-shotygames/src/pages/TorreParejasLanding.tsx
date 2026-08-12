import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Truck, Clock, Heart, Zap, CheckCircle2, Banknote, Droplets, MapPin, Sparkles } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckoutModal } from "@/components/CheckoutModal";
import Testimonials from "@/components/Testimonials";
import torreParejas1 from "@/assets/torre-parejas-1.webp";
import torreNormalImg from "@/assets/torre-normal-brillo.webp";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import dadosDelPlacerImg from "@/assets/dados-del-placer.webp";
import emparejadosPortada from "@/assets/emparejados-portada.jpg";
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
import lifestyleVelas from "@/assets/torre-parejas-lifestyle-velas.webp";
import lifestyleJugando from "@/assets/torre-parejas-lifestyle-jugando.webp";
import unboxingVideo from "@/assets/torre-parejas-unboxing.mp4";

const TorreParejasLanding = () => {
  const productName = "Torre de Shots Parejas";
  const productPrice = 28.00;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { shouldOpenCheckout, setShouldOpenCheckout } = useCheckoutRestore();

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

  const productImages = [
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

  const faqs = [
    {
      q: "¿Llega en empaque discreto?",
      a: "Sí. El paquete llega sellado y sin ninguna referencia al contenido por fuera. Nadie sabe qué hay adentro más que ustedes.",
    },
    {
      q: "¿De qué material es? ¿Se arruina si se derrama trago encima?",
      a: "Es madera de pino 100% premium, lijada y sellada. Se puede mojar y no se daña ni se borra el texto de los bloques. Es un juego de shots — sabemos que se van a derramar tragos, y está hecha para aguantarlo.",
    },
    {
      q: "¿Cuánto tarda en llegar?",
      a: "Entre 2 y 4 días hábiles a todo Ecuador. Si pides antes de las 3 de la tarde, sale el mismo día.",
    },
    {
      q: "¿Tengo que pagar por adelantado?",
      a: "No necesitas tarjeta. Puedes reservar tu pedido con $5 y pagar el resto en efectivo cuando el paquete llegue a tu puerta. También aceptamos transferencia y tarjeta si prefieres.",
    },
    {
      q: "¿Los retos son muy fuertes?",
      a: "Están escalonados: arrancan suaves y románticos, y van subiendo de intensidad. Ustedes deciden hasta dónde llegar — lo que no quieran hacer, simplemente no lo hacen.",
    },
    {
      q: "¿Sirve si llevamos poco tiempo juntos?",
      a: "Sí. De hecho es de los mejores momentos para jugarlo: los retos de conexión ayudan a conocerse mejor, y los demás vienen solos.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Torre de Shots Parejas ❤️ - Sal de la Rutina | ShotyGames Ecuador"
        description="51 retos para dos que convierten una noche cualquiera en uno que van a recordar. Madera de pino premium. Reserva con $5 y paga el resto al recibir. Envío gratis a todo Ecuador."
        canonical="https://www.shotygames.com/landing/torre-parejas"
        image={`https://www.shotygames.com${torreParejas1}`}
        type="product"
      />

      {/* Barra fija: mata las 2 objeciones mas grandes en el primer segundo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#e91e63] to-[#f50057] text-white py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
        <p className="text-[11px] md:text-base leading-tight">
          💵 Reserva con $5, resto al recibir · 🚚 Envío gratis a todo Ecuador
        </p>
      </div>
      <div className="h-10 md:h-14"></div>

      {/* ---------- HERO: promesa, no nombre de producto ---------- */}
      <section className="py-6 md:py-12 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-[27px] leading-[1.15] md:text-5xl font-bold mb-3 md:mb-4">
                La última vez que se rieron juntos<br className="hidden md:block" /> hasta llorar,{" "}
                <span className="bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent">
                  ¿cuándo fue?
                </span>
              </h1>
              <p className="text-base md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                51 retos que convierten una noche cualquiera en una que van a recordar.
                Sin salir de casa, sin planear nada.
              </p>
            </div>

            {/* Carrusel con retos reales */}
            <div className="relative mb-5 md:mb-6">
              <Carousel opts={{ align: "center", loop: true }} className="w-full">
                <CarouselContent>
                  {productImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          /* solo la primera se carga ya; las otras 9 al deslizar */
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
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
                👉 Desliza para ver los retos reales que trae
              </div>
            </div>

            {/* Prueba social temprana: valida antes de pedir nada */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#e91e63] text-[#e91e63]" />
                ))}
              </div>
              <p className="text-sm md:text-base font-semibold text-center">
                +3.500 parejas en Ecuador ya la tienen en su casa
              </p>
            </div>

            {/* CTA temprano: captura al que ya esta listo */}
            <div className="text-center space-y-3">
              {/* El regalo se anuncia antes del CTA: es el gancho que ya funciona en WhatsApp */}
              <div className="inline-flex items-center gap-2 bg-[#e91e63]/10 border-2 border-[#e91e63]/30 rounded-full px-4 py-2 mb-1">
                <Gift className="w-4 h-4 md:w-5 md:h-5 text-[#e91e63] flex-shrink-0" />
                <p className="text-xs md:text-base font-semibold text-left">
                  Pedido de hoy: llevas la <strong>Guía de 30 Posiciones</strong> de regalo
                </p>
              </div>

              <Button
                onClick={handleBuyClick}
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-[#e91e63] to-[#f50057] hover:from-[#e91e63]/90 hover:to-[#f50057]/90 text-white text-lg md:text-2xl font-bold px-8 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
              >
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                LA QUIERO EN MI CASA
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-foreground">Pago mixto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#e91e63]" />
                  <span>Envío gratis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#e91e63]" />
                  <span>Llega en 2-4 días hábiles</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------- EL PROBLEMA, AGITADO ---------- */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-6 md:px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold leading-tight">
              Viernes en la noche. Otra vez cada uno con el celular.
            </h2>
            <div className="text-base md:text-xl text-muted-foreground space-y-3">
              <p>
                No es que estén mal. Es que salir se volvió complicado —
                y quedarse en casa terminó siendo siempre lo mismo: una serie, el teléfono, dormir.
              </p>
              <p>
                Nadie planea que la rutina se instale. Simplemente pasa.
              </p>
              <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent pt-2">
                Lo único que hace falta es una excusa para volver a jugar entre ustedes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- LA SOLUCION + MECANISMO UNICO ---------- */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center mb-8 md:mb-10">
              <div className="text-center md:text-left order-2 md:order-1">
                <h2 className="text-2xl md:text-4xl font-bold mb-3">
                  Se arma en la mesa de tu sala en 2 minutos
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  Cada bloque tiene un reto distinto. Sacan uno, lo cumplen, siguen.
                  Lo que empieza con risas termina en otra cosa — y ninguna noche sale igual.
                </p>
              </div>
              <div className="order-1 md:order-2 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={lifestyleVelas}
                  alt="Pareja jugando Torre de Shots Parejas con velas encendidas"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Mecanismo unico: por que ESTA torre y no cualquier jenga */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              <Card className="p-5 md:p-6 border-2 border-[#e91e63]/20 hover:shadow-xl transition-all">
                <div className="p-3 rounded-full bg-[#e91e63]/10 w-fit mb-4">
                  <Droplets className="w-6 h-6 text-[#e91e63]" />
                </div>
                <h3 className="font-bold text-base md:text-lg mb-2">Aguanta que le derramen encima</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Madera de pino 100% premium, lijada y sellada. Se puede mojar y
                  <strong className="text-foreground"> no se daña ni se borra el texto</strong>.
                  Es un juego de shots: está hecha para eso.
                </p>
              </Card>

              <Card className="p-5 md:p-6 border-2 border-[#e91e63]/20 hover:shadow-xl transition-all">
                <div className="p-3 rounded-full bg-[#e91e63]/10 w-fit mb-4">
                  <Sparkles className="w-6 h-6 text-[#e91e63]" />
                </div>
                <h3 className="font-bold text-base md:text-lg mb-2">51 retos que van subiendo</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Arrancan suaves y románticos, y suben de intensidad de a poco.
                  <strong className="text-foreground"> Ustedes deciden hasta dónde llegar</strong> —
                  no es todo o nada.
                </p>
              </Card>

              <Card className="p-5 md:p-6 border-2 border-[#e91e63]/20 hover:shadow-xl transition-all">
                <div className="p-3 rounded-full bg-[#e91e63]/10 w-fit mb-4">
                  <MapPin className="w-6 h-6 text-[#e91e63]" />
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

      {/* ---------- QUE INCLUYE ---------- */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#e91e63]/5 to-[#f50057]/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-10">
              Qué llega a tu puerta
            </h2>
            <Card className="p-6 md:p-8 border-2 border-[#f50057]/20 shadow-xl">
              <div className="space-y-4">
                {[
                  { t: "51 bloques de madera con retos", d: "Cada uno con un reto distinto para dos" },
                  { t: "1 vaso tequilero", d: "Incluido en la caja" },
                  { t: "Instrucciones de juego", d: "Para que arranquen sin dudas" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-[#e91e63] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-base md:text-lg">{item.t}</p>
                      <p className="text-sm md:text-base text-muted-foreground">{item.d}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-4 pt-4 border-t-2 border-dashed border-[#e91e63]/30">
                  <Gift className="w-6 h-6 text-[#e91e63] flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold text-base md:text-lg">
                      Guía Digital de 30 Posiciones
                      <Badge className="ml-2 bg-[#e91e63] text-white align-middle">DE REGALO</Badge>
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Te llega al WhatsApp apenas confirmes el pedido, sin costo extra.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Video real de unboxing — sin audio, en loop. Confirma en video lo
                que el bloque de arriba promete: la torre, el vaso, la guía QR. */}
            <div className="mt-6 md:mt-8 rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-[320px]">
              <video
                src={unboxingVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
                aria-label="Video real desempacando la Torre de Shots Parejas"
              />
            </div>
            <p className="text-center text-xs md:text-sm text-muted-foreground mt-2">
              📦 Así llega a tu casa — video real, sin edición
            </p>
          </div>
        </div>
      </section>

      {/* ---------- COMO SE JUEGA ---------- */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-10">
              Cómo se juega
            </h2>
            <div className="grid md:grid-cols-[minmax(0,280px)_1fr] gap-6 md:gap-8 items-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl mx-auto w-full max-w-[280px] aspect-[4/5] md:aspect-auto md:h-full">
                <img
                  src={lifestyleJugando}
                  alt="Pareja sacando un bloque de la Torre de Shots Parejas"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-5">
                {[
                  { n: "1", t: "Arman la torre" },
                  { n: "2", t: "Sacan un bloque y cumplen el reto" },
                  { n: "3", t: "Si no lo hacen, toman 3 shots 🍸" },
                  { n: "4", t: "El que la tumba paga la penitencia final 💥" },
                ].map((step, i) => (
                  <Card key={i} className="p-4 md:p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-[#e91e63] to-[#f50057] text-white font-bold text-lg md:text-xl flex items-center justify-center mx-auto mb-3">
                      {step.n}
                    </div>
                    <p className="text-sm md:text-base font-semibold">{step.t}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- PRUEBA SOCIAL ---------- */}
      <Testimonials />

      {/* ---------- LA OFERTA: recien aca aparece el precio ---------- */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#e91e63] to-[#f50057] opacity-95"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <Badge className="bg-white text-[#e91e63] text-sm md:text-base px-4 py-1.5 mb-4 font-bold">
              🎁 REGALO POR PEDIDO DE HOY
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
                    <span className="text-white/60 line-through mr-2">$38</span>$28
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
                <p className="text-5xl md:text-7xl font-bold">$28</p>
              </div>

              <div className="bg-yellow-300/15 border border-yellow-300/40 rounded-xl p-3 md:p-4">
                <p className="text-sm md:text-base text-yellow-100">
                  🎁 <strong className="text-yellow-300">La Guía de 30 Posiciones va incluida en los pedidos de hoy.</strong>{" "}
                  Te llega al WhatsApp apenas confirmas, aunque el paquete todavía esté en camino.
                </p>
              </div>

              <p className="text-lg md:text-2xl font-bold">
                Reservas con $5 y pagas el resto cuando la tengas en la mano 💵
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
                <p className="font-bold text-base md:text-lg mb-1">Pago mixto</p>
                <p className="text-sm text-muted-foreground">
                  Reservas con $5 y pagas el resto en efectivo cuando el paquete llega a tu puerta.
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
              La torre llega en 2-4 días hábiles: reservas con $5 y pagas el resto cuando la tengas en la mano.
            </p>
            <p className="text-base md:text-lg font-semibold text-yellow-300">
              🎁 Y si pides hoy, la Guía de 30 Posiciones va incluida
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
              💵 Reserva $5, resto al recibir · 🚚 Envío gratis · 🎁 Guía de 30 posiciones incluida
            </p>
          </div>
        </div>
      </section>

      {/* ---------- STICKY MOBILE ---------- */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
        <div className="bg-gradient-to-r from-[#e91e63] to-[#f50057] p-3 shadow-2xl">
          <Button onClick={handleBuyClick} size="lg" className="w-full bg-white text-[#e91e63] hover:bg-white/90 font-bold text-base py-6 rounded-xl shadow-xl">
            <ShoppingCart className="mr-2 h-5 w-5" />
            COMPRAR AHORA
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
          { id: 'torreNormal', name: 'Torre La Previa (para grupos)', price: 10, image: torreNormalImg },
          { id: 'torrePicante', name: 'Torre Picante (para grupos)', price: 10, image: torrePicanteImg },
          { id: 'dadosPlacer', name: 'Dados del Placer', price: 5, image: dadosDelPlacerImg },
          { id: 'emparejados', name: 'Emparejados (juego digital)', price: 2.90, image: emparejadosPortada },
        ]}
      />
    </div>
  );
};

export default TorreParejasLanding;
