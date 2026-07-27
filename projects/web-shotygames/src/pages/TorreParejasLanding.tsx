import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Truck, Clock, Users, Heart, Zap, CheckCircle2, MessageCircle, Package, Grid3x3 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { CheckoutModal } from "@/components/CheckoutModal";
import Testimonials from "@/components/Testimonials";
import torreParejas1 from "@/assets/torre-parejas-1.webp";
import torreNormalImg from "@/assets/torre-normal.jpg";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import enganchadosImg from "@/assets/enganchados.jpg";
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
const TorreParejasLanding = () => {
  const navigate = useNavigate();
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
  const productImages = [{
    src: torreParejas1,
    badge: "Foto Real 📸",
    alt: "Torre Parejas - empaque completo"
  }, {
    src: torreParejas2,
    badge: "Reto Parejas 🔥",
    alt: "Castígame con 5 nalgadas"
  }, {
    src: torreParejas3,
    badge: "Reto Parejas 💋",
    alt: "Juegas en ropa interior durante 3 rondas"
  }, {
    src: torreParejas4,
    badge: "Reto Parejas 💞",
    alt: "Hazle un masaje por 2 minutos"
  }, {
    src: torreParejas5,
    badge: "Reto Parejas 🌶️",
    alt: "Véndale los ojos y juega con su cuerpo durante 1 minuto"
  }, {
    src: torreParejas6,
    badge: "Reto Parejas 😈",
    alt: "Juegas desnudo/a durante 2 rondas"
  }, {
    src: torreParejas7,
    badge: "Reto Parejas ⚡",
    alt: "Hazme un rapidín en el lugar que elijas"
  }, {
    src: torreParejas8,
    badge: "Reto Parejas 💋",
    alt: "Quítame la ropa interior con la boca"
  }, {
    src: torreParejas9,
    badge: "Reto Parejas 😏",
    alt: "Mírame fíjamente mientras te tocas por 1 minuto"
  }, {
    src: torreParejas10,
    badge: "Reto Parejas 💑",
    alt: "Hazme terminar con tus manos"
  }, {
    src: torreParejas11,
    badge: "Reto Parejas 🔥",
    alt: "Hazme s❤️x❤️ oral por 3 minutos"
  }];
  const benefits = [{
    icon: Heart,
    text: "Rompe la rutina y revive la pasión ❤️"
  }, {
    icon: Zap,
    text: "Fortalece la confianza y la conexión emocional"
  }, {
    icon: Users,
    text: "Retos equilibrados entre diversión y deseo"
  }, {
    icon: Gift,
    text: "Ideal para sorprender a tu pareja"
  }, {
    icon: CheckCircle2,
    text: "Hecho en Ecuador 🇪🇨 con materiales de alta calidad"
  }];
  return <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Helmet>
        <title>Torre de Shots Parejas ❤️ - Sal de la Rutina | ShotyGames Ecuador</title>
        <meta name="description" content="51 retos exclusivos para dos. Sal de la rutina y enciende la noche con tu pareja. Envíos a todo Ecuador." />
        <meta property="og:title" content="Torre de Shots Parejas ❤️ - Sal de la Rutina | ShotyGames Ecuador" />
        <meta property="og:description" content="51 retos exclusivos para dos. Sal de la rutina y enciende la noche con tu pareja." />
        <meta property="og:url" content="https://shoty-fiesta-web-main.vercel.app/landing/torre-parejas" />
      </Helmet>
      {/* Header fijo con promo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#e91e63] to-[#f50057] text-white py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
        <p className="text-xs md:text-base animate-pulse">
          🔥 SOLO HOY: Promoción especial 🇪🇨
        </p>
      </div>

      {/* Espaciado para el header fijo */}
      <div className="h-10 md:h-14"></div>

      {/* Hero Section - Carrusel de Producto */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Botones de Navegación */}
            <div className="flex flex-row justify-between mb-6 md:mb-8">
              <Button
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    const juegosSection = document.querySelector('[data-section="products"]');
                    juegosSection?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 font-semibold hover:scale-105 transition-all"
              >
                <Grid3x3 className="w-5 h-5" />
                Ver Juegos
              </Button>
              <Button
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    const combosSection = document.getElementById('combos');
                    combosSection?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 font-semibold hover:scale-105 transition-all"
              >
                <Package className="w-5 h-5" />
                Ver Combos
              </Button>
            </div>

            {/* Carrusel de Imágenes */}
            <div className="relative mb-6 md:mb-8">
              <Carousel opts={{
              align: "center",
              loop: true
            }} className="w-full">
                <CarouselContent>
                  {productImages.map((image, index) => <CarouselItem key={index}>
                      <div className="relative aspect-square md:aspect-video rounded-2xl overflow-hidden bg-muted shadow-2xl">
                        <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
                        <Badge className="absolute top-4 right-4 bg-[#e91e63] text-white border-none text-sm md:text-base px-3 py-1">
                          {image.badge}
                        </Badge>
                      </div>
                    </CarouselItem>)}
                </CarouselContent>
                <CarouselPrevious className="left-2 md:left-4" />
                <CarouselNext className="right-2 md:right-4" />
              </Carousel>
              
              {/* Indicador de fotos */}
              <div className="text-center mt-3 text-sm text-muted-foreground">
                📸 Desliza para ver más fotos reales
              </div>
            </div>

            {/* Información del Producto */}
            <div className="text-center space-y-4 md:space-y-6">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent">
                {productName}
              </h1>
              
              {/* Precio */}
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <span className="text-2xl md:text-3xl text-muted-foreground line-through">$38.00</span>
                <span className="text-4xl md:text-6xl font-bold text-[#e91e63]">$28.00</span>
                <Badge className="bg-[#e91e63] text-white text-sm md:text-base px-3 py-1 animate-pulse">
                  -26% HOY
                </Badge>
              </div>
              <p className="text-center text-sm md:text-base text-primary font-semibold mt-2">🚚 Envío incluido en el precio</p>

              {/* Badges de Confianza y Urgencia */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
                <Card className="p-3 md:p-4 border-2 border-green-500/20 bg-green-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Compra Segura</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-blue-500/20 bg-blue-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Star className="w-6 h-6 md:w-8 md:h-8 text-blue-600 fill-blue-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Calidad Premium</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-[#e91e63]/20 bg-[#e91e63]/5">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="w-6 h-6 md:w-8 md:h-8 text-[#e91e63]" />
                    <p className="text-xs md:text-sm font-bold text-center">Solo 6 unidades</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-purple-500/20 bg-purple-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    <p className="text-xs md:text-sm font-bold text-center">15 viendo ahora</p>
                  </div>
                </Card>
              </div>

              {/* CTA Principal */}
              <Button onClick={handleBuyClick} size="lg" className="w-full md:w-auto bg-gradient-to-r from-[#e91e63] to-[#f50057] hover:from-[#e91e63]/90 hover:to-[#f50057]/90 text-white text-lg md:text-2xl font-bold px-8 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all mt-4">
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                COMPRAR AHORA
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>

              {/* Garantías adicionales */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-[#e91e63]" />
                  <span>Entrega 100% segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#e91e63]" />
                  <span>Entrega 2-3 días</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-[#e91e63]" />
                  <span>Regalo gratis incluido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección del Dolor */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-6 md:px-4">
          <div className="max-w-3xl mx-auto text-center space-y-3 md:space-y-6">
            <h2 className="text-2xl md:text-5xl font-bold text-[#e91e63] leading-tight">
              ¿Tu relación cayó en la rutina?
            </h2>
            <div className="text-base md:text-xl text-muted-foreground space-y-2 md:space-y-4">
              <p>¿Las noches juntos ya no tienen esa chispa del inicio?</p>
              <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent px-2">
                La Torre de Shots Parejas fue creada para encender el deseo, reír juntos y volver a sentirse cómplices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Descripción del Producto */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-12 border-2 border-[#f50057]/20 shadow-xl">
              <div className="text-center space-y-4 md:space-y-6">
                <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent">
                  🔥 El juego que transforma una noche cualquiera en una noche inolvidable 🔥
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  La Torre de Shots Parejas es la versión más sensual y divertida del clásico juego tipo Jenga.
                  Cada bloque contiene retos románticos, sensuales y atrevidos que aumentan la conexión y la diversión con tu pareja.
                  Algunos te harán reír, otros sonrojarte... y otros, simplemente, no los olvidarás 😉
                </p>
                
                <div className="text-base md:text-lg text-muted-foreground space-y-2 pt-4">
                  <p className="font-bold">Perfecta para:</p>
                  <div className="grid gap-2">
                    <p>💞 Noches de pareja</p>
                    <p>💋 Aniversarios o escapadas románticas</p>
                    <p>🔥 Fechas especiales o juegos previos a una cita</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6">
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl md:text-4xl">💕</div>
                    <div className="text-left">
                      <p className="font-bold text-sm md:text-base">Retos románticos</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Equilibrados entre diversión y deseo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl md:text-4xl">🎁</div>
                    <div className="text-left">
                      <p className="font-bold text-sm md:text-base">Incluye todo</p>
                      <p className="text-xs md:text-sm text-muted-foreground">51 bloques, 2 vasos e instrucciones</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#e91e63]/5 to-[#f50057]/5">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-5xl font-bold text-center mb-8 md:mb-12 bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent">
            Por qué todos eligen la Torre Parejas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => <Card key={index} className="p-4 md:p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="p-2 md:p-3 rounded-full bg-[#e91e63]/10 flex-shrink-0">
                    <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-[#e91e63]" />
                  </div>
                  <p className="text-sm md:text-lg font-semibold flex-1">{benefit.text}</p>
                </div>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Urgencia y Bonus */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#e91e63] to-[#f50057] opacity-95"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6 md:space-y-8">
            <div className="flex justify-center gap-3 md:gap-4 text-4xl md:text-6xl animate-pulse">
              <Gift className="w-10 h-10 md:w-auto md:h-auto" />
              <Truck className="w-10 h-10 md:w-auto md:h-auto" />
              <Clock className="w-10 h-10 md:w-auto md:h-auto" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold">
              🎁 BONUS EXCLUSIVO (solo por hoy) 🎁
            </h2>
            
            <div className="space-y-3 md:space-y-4 text-base md:text-2xl font-semibold bg-black/20 backdrop-blur-sm p-6 md:p-8 rounded-2xl border-2 border-white/30">
              <p className="text-2xl md:text-3xl">Por tu compra HOY te llevas GRATIS la</p>
              <p className="text-2xl md:text-4xl font-bold text-yellow-300">Guía Digital de 30 Posiciones Sexuales 😈</p>
              <p className="text-base md:text-lg text-white/90">Una guía sensual, creativa y visualmente irresistible para explorar nuevas formas de placer y conexión con tu pareja. Ideal para subir la temperatura después del juego y convertir la noche en una experiencia completa 🔥</p>
              <div className="h-1 w-24 md:w-32 mx-auto bg-white/50 rounded"></div>
              <p className="text-lg md:text-xl"></p>
              <p className="text-sm md:text-lg text-white/90 animate-pulse">
                🕒 Promoción válida hasta agotar stock — última producción 💕
              </p>
            </div>

            <Button onClick={handleBuyClick} size="lg" className="hidden md:inline-flex bg-white text-[#e91e63] hover:bg-white/90 text-xl font-bold px-12 py-8 rounded-xl shadow-2xl hover:scale-110 transition-all">
              <ShoppingCart className="mr-2 h-5 w-5" />
              COMPRAR AHORA
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Cómo Jugar */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-5xl font-bold text-center mb-8 md:mb-12 bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent">
              🎮 Cómo se juega
            </h2>
            
            <div className="grid md:grid-cols-4 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">1️⃣</div>
                <p className="text-sm md:text-base font-semibold">Arma la torre</p>
              </Card>
              
              <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">2️⃣</div>
                <p className="text-sm md:text-base font-semibold">Saca un bloque y cumple el reto</p>
              </Card>
              
              <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">3️⃣</div>
                <p className="text-sm md:text-base font-semibold">Si no lo haces… toma 3 shots 🍸</p>
              </Card>
              
              <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">💥</div>
                <p className="text-sm md:text-base font-semibold">El que derribe la torre cumple la penitencia final</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Formas de Pago */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-5xl font-bold text-center mb-8 md:mb-12 bg-gradient-to-r from-[#e91e63] to-[#f50057] bg-clip-text text-transparent">
              💳 Formas de pago
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all">
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">🏦</div>
                <p className="text-sm md:text-base font-semibold">Transferencia o depósito</p>
              </Card>
              
              <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all">
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">🔗</div>
                <p className="text-sm md:text-base font-semibold">Tarjeta de crédito/débito</p>
              </Card>
              
              <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-all">
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">🚚</div>
                <p className="text-sm md:text-base font-semibold">Entrega en 2-4 días hábiles</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final con Urgencia */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e91e63] via-[#f50057] to-[#e91e63] opacity-95"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              ⚠️ No esperes a otro día
            </h2>
            
            <div className="space-y-3 md:space-y-4 text-base md:text-2xl font-semibold bg-black/20 backdrop-blur-sm p-6 md:p-8 rounded-2xl border-2 border-white/30">
              <p className="text-2xl md:text-3xl">💞 Solo HOY: Guía Digital al llevar 2 juegos</p>
              <div className="h-1 w-24 md:w-32 mx-auto bg-white/50 rounded"></div>
              <p className="text-lg md:text-xl">Haz que esta noche sea la más divertida y atrevida del año.</p>
              <p className="text-sm md:text-base text-white/90 animate-pulse">
                Stock limitado — última producción antes de fin de semana 💕
              </p>
            </div>

            
            
            <p className="text-xs md:text-sm text-white/80">
              ✅ Compra 100% segura • 📦 Envío rápido • 🎁 Regalo incluido
            </p>
          </div>
        </div>
      </section>

      {/* Botón Sticky Inferior (Mobile) y Flotante (Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 z-50 md:w-auto">
        {/* Mobile: Botón Sticky Completo */}
        <div className="md:hidden bg-gradient-to-r from-[#e91e63] to-[#f50057] p-3 shadow-2xl">
          <Button onClick={handleBuyClick} size="lg" className="w-full bg-white text-[#e91e63] hover:bg-white/90 font-bold text-base py-6 rounded-xl shadow-xl">
            <ShoppingCart className="mr-2 h-5 w-5" />
            COMPRAR AHORA
            <Zap className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        {/* Desktop: Botón Flotante */}
        <Button onClick={handleBuyClick} className="hidden md:flex w-16 h-16 rounded-full shadow-2xl hover:scale-110 animate-pulse bg-[#25D366] hover:bg-[#20BA5A]" size="icon" aria-label="Comprar por WhatsApp">
          <MessageCircle className="w-8 h-8" />
        </Button>
      </div>
      
      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
        productPrice={productPrice}
        productImage={torreParejas1}
        productId="torreParejas"
        upsells={[
          {
            id: 'torreNormal',
            name: 'Torre de Shots Normal',
            price: 10,
            image: torreNormalImg
          },
          {
            id: 'torrePicante',
            name: 'Torre de Shots Picante',
            price: 10,
            image: torrePicanteImg
          },
          {
            id: 'dadosPlacer',
            name: 'Dados del Placer',
            price: 5,
            image: dadosDelPlacerImg
          },
          {
            id: 'emparejados',
            name: 'Emparejados (juego digital)',
            price: 3.90,
            image: emparejadosPortada
          }
        ]}
      />
    </div>;
};
export default TorreParejasLanding;