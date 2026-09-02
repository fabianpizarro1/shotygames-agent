import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Truck, Clock, Heart, Zap, CheckCircle2, Banknote, Flame, Users } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious , type CarouselApi } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import Testimonials from "@/components/Testimonials";
import torrePicante1 from "@/assets/torre-picante-1.webp";
import torreNormalImg from "@/assets/torre-normal-brillo.webp";
import torreParejasImg from "@/assets/torre-parejas.jpg";
import dadosDelPlacerImg from "@/assets/dados-del-placer.webp";
import emparejadosPortada from "@/assets/emparejados-portada.jpg";
import torrePicante2 from "@/assets/torre-picante-2.webp";
import torrePicante3 from "@/assets/torre-picante-3.webp";
import torrePicante4 from "@/assets/torre-picante-4.webp";
import torrePicante5 from "@/assets/torre-picante-5.webp";
import torrePicante6 from "@/assets/torre-picante-6.webp";
import torrePicante7 from "@/assets/torre-picante-7.webp";
import torrePicante8 from "@/assets/torre-picante-8.webp";
import torrePicante9 from "@/assets/torre-picante-9.webp";
import torrePicante10 from "@/assets/torre-picante-10.webp";
import torrePicanteLifeFuego from "@/assets/torre-picante-life-fuego.webp";
import torrePicanteLifeGrupo from "@/assets/torre-picante-life-grupo.webp";
import torreNormalImgThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import emparejadosPortadaThumb from "@/assets/thumbs/emparejados-portada.webp";
import { CarouselImage } from "@/components/CarouselImage";
import { useSlideActual } from "@/hooks/useSlideActual";

const TorrePicanteLanding = () => {
  const productName = "Torre de Shots Picante";
  const productPrice = 29.99;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Para saber qué foto de la galería está a la vista y no bajar las otras 10.
  const [api, setApi] = useState<CarouselApi>();
  const slideActual = useSlideActual(api);
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
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Torre de Shots Picante 🌶️ - Retos Atrevidos | ShotyGames Ecuador"
        description="51 retos atrevidos para grupos con confianza. Madera de pino premium. Pagas en efectivo al recibir. Envío gratis a todo Ecuador."
        canonical="https://www.shotygames.com/landing/torre-picante"
        image={`https://www.shotygames.com${torrePicante1}`}
        type="product"
      />

      {/* Barra fija: mata las 2 objeciones mas grandes en el primer segundo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] text-white py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
        <p className="text-[11px] md:text-base leading-tight">
          💵 Pagas al recibir · 🚚 Envío gratis a todo Ecuador
        </p>
      </div>
      <div className="h-10 md:h-14"></div>

      {/* ---------- HERO: promesa, no nombre de producto ---------- */}
      <section className="py-6 md:py-12 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-[27px] leading-[1.15] md:text-5xl font-bold mb-3 md:mb-4">
                La previa siempre termina igual:{" "}
                <span className="bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] bg-clip-text text-transparent">
                  música y hablar
                </span>
              </h1>
              <p className="text-base md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                51 retos atrevidos que suben el nivel del grupo en minutos.
                Sin salir de casa, sin planear nada.
              </p>
            </div>

            {/* Carrusel con retos reales */}
            <div className="relative mb-5 md:mb-6">
              <Carousel opts={{ align: "center", loop: true }} setApi={setApi} className="w-full">
                <CarouselContent>
                  {productImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
                        <CarouselImage
                          src={image.src}
                          alt={image.alt}
                          index={index}
                          current={slideActual}
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
                👉 Desliza para ver los retos reales que trae
              </div>
            </div>

            {/* Prueba social temprana: valida antes de pedir nada */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#ff3d00] text-[#ff3d00]" />
                ))}
              </div>
              <p className="text-sm md:text-base font-semibold text-center">
                +3.500 clientes en Ecuador ya la tienen en su casa
              </p>
            </div>

            {/* CTA temprano: captura al que ya esta listo */}
            <div className="text-center space-y-3">
              {/* El regalo se anuncia antes del CTA */}
              <div className="inline-flex items-center gap-2 bg-[#ff3d00]/10 border-2 border-[#ff3d00]/30 rounded-full px-4 py-2 mb-1">
                <Gift className="w-4 h-4 md:w-5 md:h-5 text-[#ff3d00] flex-shrink-0" />
                <p className="text-xs md:text-base font-semibold text-left">
                  Pedido de hoy: llevas la <strong>Guía de 20 Juegos para Fiestas</strong> de regalo
                </p>
              </div>

              <Button
                onClick={handleBuyClick}
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] hover:from-[#ff3d00]/90 hover:to-[#ff7b00]/90 text-white text-lg md:text-2xl font-bold px-8 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all"
              >
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                LA QUIERO EN MI CASA
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-foreground">Contraentrega</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#ff3d00]" />
                  <span>Envío gratis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#ff3d00]" />
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
              Se juntan, ponen música, y a la hora ya no saben qué más hacer.
            </h2>
            <div className="text-base md:text-xl text-muted-foreground space-y-3">
              <p>
                Nadie quiere ser el aburrido, pero tampoco el que propone algo y queda en silencio.
                Y la previa se apaga antes de arrancar de verdad.
              </p>
              <p>
                No faltan ganas. Falta algo que rompa el hielo por ustedes.
              </p>
              <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] bg-clip-text text-transparent pt-2">
                Alguien tiene que sacar el primer bloque.
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
                  Se arma en la mesa en 2 minutos
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  Cada bloque tiene un reto distinto. Sacan uno, lo cumplen, siguen.
                  Lo que empieza incómodo termina en risas — y ninguna previa sale igual.
                </p>
              </div>
              <div className="order-1 md:order-2 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={torrePicanteLifeFuego}
                  alt="Torre de Shots Picante, la caja real del producto"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Mecanismo unico: por que ESTA torre y no cualquier jenga */}
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
                    <p className="font-bold text-base md:text-lg">
                      Guía Digital de 20 Juegos para Fiestas
                      <Badge className="ml-2 bg-[#ff3d00] text-white align-middle">DE REGALO</Badge>
                    </p>
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

      {/* ---------- COMO SE JUEGA ---------- */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-10">
              Cómo se juega
            </h2>
            <div className="grid md:grid-cols-[minmax(0,280px)_1fr] gap-6 md:gap-8 items-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl mx-auto w-full max-w-[280px] aspect-square md:aspect-auto md:h-full">
                <img
                  src={torrePicanteLifeGrupo}
                  alt="Grupo de amigos jugando Torre de Shots Picante"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-5">
                {[
                  { n: "1", t: "Arman la torre" },
                  { n: "2", t: "Sacan un bloque y leen el reto" },
                  { n: "3", t: "Lo cumplen o toman 3 shots 🍸" },
                  { n: "4", t: "El que la tumba paga la penitencia final 💥" },
                ].map((step, i) => (
                  <Card key={i} className="p-4 md:p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] text-white font-bold text-lg md:text-xl flex items-center justify-center mx-auto mb-3">
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] opacity-95"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <Badge className="bg-white text-[#ff3d00] text-sm md:text-base px-4 py-1.5 mb-4 font-bold">
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
                    Torre Picante + vaso tequilero
                  </span>
                  <span className="font-semibold whitespace-nowrap">$29.99</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-base md:text-lg">
                  <span className="flex items-center gap-2">
                    <Gift className="w-5 h-5 flex-shrink-0 text-yellow-300" />
                    Guía de 20 Juegos para Fiestas
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

              <div className="bg-yellow-300/15 border border-yellow-300/40 rounded-xl p-3 md:p-4">
                <p className="text-sm md:text-base text-yellow-100">
                  🎁 <strong className="text-yellow-300">La Guía de 20 Juegos va incluida en los pedidos de hoy.</strong>{" "}
                  Viene dentro de la caja, en una tarjeta con código QR para descargarla.
                </p>
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
              🎁 Y si pides hoy, la Guía de 20 Juegos va incluida
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
              💵 Pagas al recibir · 🚚 Envío gratis · 🎁 Guía de 20 juegos
            </p>
          </div>
        </div>
      </section>

      {/* ---------- STICKY MOBILE ---------- */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
        <div className="bg-gradient-to-r from-[#ff3d00] to-[#ff7b00] p-3 shadow-2xl">
          <Button onClick={handleBuyClick} size="lg" className="w-full bg-white text-[#ff3d00] hover:bg-white/90 font-bold text-base py-6 rounded-xl shadow-xl">
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

export default TorrePicanteLanding;
