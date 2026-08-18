import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Truck, Clock, Users, Heart, Zap, CheckCircle2, MessageCircle, Target, Package, Grid3x3 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import enganchados from "@/assets/enganchados-brillo.webp";
import torreNormalImg from "@/assets/torre-normal-brillo.webp";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import torreParejasImg from "@/assets/torre-parejas.jpg";
import emparejadosPortada from "@/assets/emparejados-portada.jpg";
import dadosDelPlacerImg from "@/assets/dados-del-placer.webp";
import torreNormalImgThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torrePicanteImgThumb from "@/assets/thumbs/torre-picante.webp";
import torreParejasImgThumb from "@/assets/thumbs/torre-parejas.webp";
import dadosDelPlacerImgThumb from "@/assets/thumbs/dados-del-placer.webp";
import emparejadosPortadaThumb from "@/assets/thumbs/emparejados-portada.webp";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
const EnganchadosLanding = () => {
  const navigate = useNavigate();
  const productName = "Enganchados";
  const productPrice = 33.00;
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
    src: enganchados,
    badge: "Foto Real 📸",
    alt: "Juego completo"
  }, {
    src: enganchados,
    badge: "Vista completa 🎯",
    alt: "Tablero armado"
  }, {
    src: enganchados,
    badge: "Detalle tablero ✨",
    alt: "Tablero de cerca"
  }, {
    src: enganchados,
    badge: "En acción 🔥",
    alt: "Jugando"
  }, {
    src: enganchados,
    badge: "Empaque 📦",
    alt: "Caja del producto"
  }, {
    src: enganchados,
    badge: "Vaso incluido 🥃",
    alt: "Vaso de shot"
  }, {
    src: enganchados,
    badge: "Instrucciones 📋",
    alt: "Manual de juego"
  }, {
    src: enganchados,
    badge: "Calidad premium ⭐",
    alt: "Material de calidad"
  }, {
    src: enganchados,
    badge: "Para competir 🎉",
    alt: "Ambiente competitivo"
  }, {
    src: enganchados,
    badge: "100% Original ✅",
    alt: "Producto auténtico"
  }];
  const benefits = [{
    icon: Zap,
    text: "Diversión garantizada desde el primer tiro"
  }, {
    icon: Users,
    text: "Ideal para grupos grandes o competencias rápidas"
  }, {
    icon: Heart,
    text: "Perfecto para fiestas, previas o retos entre panas"
  }, {
    icon: Gift,
    text: "Fabricado en Ecuador 🇪🇨 con materiales resistentes"
  }, {
    icon: CheckCircle2,
    text: "Portátil, fácil de armar y 100% reutilizable"
  }];
  const howToBuySteps = [{
    number: "1",
    text: "Elige tu juego favorito"
  }, {
    number: "2",
    text: "Haz clic en 'Comprar por WhatsApp'"
  }, {
    number: "3",
    text: "Confirma tu pedido y recibe en casa 🎉"
  }];
  return <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Enganchados - El Juego de Puntería para Fiestas | ShotyGames Ecuador"
        description="Pon a prueba tu puntería, concentración y velocidad. El juego más adictivo para grupos. Envíos a todo Ecuador."
        canonical="https://www.shotygames.com/landing/enganchados"
        type="website"
      />
      {/* Header fijo con promo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#10b981] to-[#059669] text-white py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
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
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          /* solo la primera se carga ya; las otras 9 al deslizar */
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                        />
                        <Badge className="absolute top-4 right-4 bg-[#10b981] text-white border-none text-sm md:text-base px-3 py-1">
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
              <h1 className="text-3xl md:text-5xl font-bold gradient-text leading-tight">
                {productName} 🎯
              </h1>
              
              <p className="text-lg md:text-2xl text-muted-foreground font-semibold">
                🔥 El juego más adictivo de las fiestas 🔥
              </p>
              
              {/* Precio */}
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <span className="text-2xl md:text-3xl text-muted-foreground line-through">$45.00</span>
                <span className="text-4xl md:text-6xl font-bold text-[#10b981]">$33.00</span>
                <Badge className="bg-[#10b981] text-white text-sm md:text-base px-3 py-1 animate-pulse">
                  -27% HOY
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
                
                <Card className="p-3 md:p-4 border-2 border-[#10b981]/20 bg-[#10b981]/5">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="w-6 h-6 md:w-8 md:h-8 text-[#10b981]" />
                    <p className="text-xs md:text-sm font-bold text-center">Solo 5 unidades</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-purple-500/20 bg-purple-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    <p className="text-xs md:text-sm font-bold text-center">18 viendo ahora</p>
                  </div>
                </Card>
              </div>

              {/* CTA Principal */}
              <Button onClick={handleBuyClick} size="lg" className="w-full md:w-auto bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#10b981]/90 hover:to-[#059669]/90 text-white text-lg md:text-2xl font-bold px-8 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all mt-4">
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                COMPRAR AHORA
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>

              {/* Garantías adicionales */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
                  <span>Entrega 100% segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
                  <span>Entrega 2-3 días</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
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
            <h2 className="text-2xl md:text-5xl font-bold text-[#10b981] leading-tight">
              ¿Tus reuniones son siempre iguales?
            </h2>
            <div className="text-base md:text-xl text-muted-foreground space-y-2 md:space-y-4">
              <p>Nada nuevo, sin emoción ni competencia real...</p>
              <p className="text-xl md:text-2xl font-bold gradient-text px-2">
                Enganchados llegó para prender cualquier grupo.
              </p>
              <p>Un juego físico, divertido y con la mezcla perfecta entre habilidad, suerte y shots 😆</p>
            </div>
          </div>
        </div>
      </section>

      {/* Descripción del Producto */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-12 border-2 border-[#059669]/20 shadow-xl">
              <div className="text-center space-y-4 md:space-y-6">
                <h2 className="text-2xl md:text-4xl font-bold gradient-text">
                  El nuevo juego de fiesta de ShotyGames
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  Basado en el clásico <span className="font-bold">Ring Hook</span>, pero con un toque único y más divertido:
                  ahora se juega con shots y dado. Tu objetivo es enganchar el aro y mover el vaso hacia el lado del rival.
                  Cada tiro cuenta y el dado decide cuántos intentos tienes por turno 🎯
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6">
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl md:text-4xl">🎯</div>
                    <div className="text-left">
                      <p className="font-bold text-sm md:text-base">Competencia real</p>
                      <p className="text-xs md:text-sm text-muted-foreground">1 vs 1, 2 vs 2 o por equipos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-3xl md:text-4xl">🎁</div>
                    <div className="text-left">
                      <p className="font-bold text-sm md:text-base">Incluye todo</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Tablero, dado, vaso e instrucciones</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Cómo se juega */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 gradient-text">
              🎮 Cómo se juega
            </h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <Card className="p-4 md:p-6 border-2 border-[#10b981]/20">
                <div className="flex items-start gap-3">
                  <div className="text-3xl md:text-4xl">1️⃣</div>
                  <div>
                    <p className="font-bold mb-2">Lanza el dado</p>
                    <p className="text-sm text-muted-foreground">El número que salga indica cuántos intentos tienes para enganchar el aro</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 md:p-6 border-2 border-[#10b981]/20">
                <div className="flex items-start gap-3">
                  <div className="text-3xl md:text-4xl">2️⃣</div>
                  <div>
                    <p className="font-bold mb-2">Engancha y avanza</p>
                    <p className="text-sm text-muted-foreground">Cada vez que enganches, mueve el vaso una posición hacia el lado del oponente</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 md:p-6 border-2 border-[#10b981]/20">
                <div className="flex items-start gap-3">
                  <div className="text-3xl md:text-4xl">3️⃣</div>
                  <div>
                    <p className="font-bold mb-2">Gana la partida</p>
                    <p className="text-sm text-muted-foreground">El primero que logre llevar el vaso hasta el extremo contrario gana</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 md:p-6 border-2 border-[#10b981]/20">
                <div className="flex items-start gap-3">
                  <div className="text-3xl md:text-4xl">4️⃣</div>
                  <div>
                    <p className="font-bold mb-2">El perdedor toma</p>
                    <p className="text-sm text-muted-foreground">El perdedor... ¡toma el shot completo! 🍸</p>
                  </div>
                </div>
              </Card>
            </div>
            <p className="text-center text-lg md:text-xl font-bold mt-6 text-[#10b981]">
              💥 Rápido, competitivo y adictivo — imposible jugar solo una ronda
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#10b981]/5 to-[#059669]/5">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-5xl font-bold text-center mb-8 md:mb-12 gradient-text">
            Por qué todos eligen Enganchados
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => <Card key={index} className="p-4 md:p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="p-2 md:p-3 rounded-full bg-[#10b981]/10 flex-shrink-0">
                    <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-[#10b981]" />
                  </div>
                  <p className="text-sm md:text-lg font-semibold flex-1">{benefit.text}</p>
                </div>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Urgencia y Bonus */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#10b981] to-[#059669] opacity-95"></div>
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
              <p className="text-2xl md:text-4xl font-bold text-yellow-300">Guía Digital de 20 Juegos para Fiestas 🎉</p>
              <p className="text-base md:text-lg text-white/90">Una guía exclusiva con más ideas y juegos para que nunca falte la diversión en tus reuniones.</p>
              <div className="h-1 w-24 md:w-32 mx-auto bg-white/50 rounded"></div>
              <p className="text-lg md:text-xl"></p>
              <p className="text-sm md:text-lg text-white/90 animate-pulse">
                🕒 Promoción válida hasta agotar stock — última producción ⚡
              </p>
            </div>

            <Button onClick={handleBuyClick} size="lg" className="hidden md:inline-flex bg-white text-[#10b981] hover:bg-white/90 text-xl font-bold px-12 py-8 rounded-xl shadow-2xl hover:scale-110 transition-all">
              <ShoppingCart className="mr-2 h-5 w-5" />
              COMPRAR AHORA
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Cómo Comprar */}
      

      {/* CTA Final */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSI1IiBjeT0iNSIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2RvdHMpIi8+PC9zdmc+')] opacity-50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-6xl font-bold leading-tight">
              No dejes pasar esta promo:
              <br />
              <span className="text-[#059669]">regalo digital incluido</span>
              <br />
              solo por hoy
            </h2>
            
            <p className="text-lg md:text-2xl text-white/90">
              Demuestra tu puntería y tu suerte.
              <br />
              <span className="font-bold">Enganchados es el juego que convierte cualquier noche en una competencia épica entre risas y shots.</span>
            </p>

            <Button onClick={handleBuyClick} size="lg" className="hidden md:inline-flex bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#10b981]/90 hover:to-[#059669]/90 text-white text-2xl font-bold px-16 py-10 rounded-2xl shadow-2xl hover:scale-110 transition-all animate-pulse">
              <ShoppingCart className="mr-2 h-6 w-6" />
              COMPRAR AHORA
              <Zap className="ml-2 h-6 w-6" />
            </Button>

            <p className="text-xs md:text-sm text-white/70">
              ⚡ Respuesta inmediata por WhatsApp • 🔒 Compra 100% segura
            </p>
          </div>
        </div>
      </section>


      {/* Botón Sticky Inferior (Mobile) y Flotante (Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 z-50 md:w-auto">
        {/* Mobile: Botón Sticky Completo */}
        <div className="md:hidden bg-gradient-to-r from-[#10b981] to-[#059669] p-3 shadow-2xl">
          <Button onClick={handleBuyClick} size="lg" className="w-full bg-white text-[#10b981] hover:bg-white/90 font-bold text-base py-6 rounded-xl shadow-xl">
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
        productImage={enganchados}
        productId="enganchados"
        upsells={[
          {
            id: 'torreNormal',
            name: 'Torre La Previa (para grupos)',
            price: 10,
            image: torreNormalImgThumb
          },
          {
            id: 'torrePicante',
            name: 'Torre Picante (para grupos)',
            price: 10,
            image: torrePicanteImgThumb
          },
          {
            id: 'torreParejas',
            name: 'Torre de Shots Parejas',
            price: 10,
            image: torreParejasImgThumb
          },
          {
            id: 'dadosPlacer',
            name: 'Dados del Placer',
            price: 5,
            image: dadosDelPlacerImgThumb
          },
          {
            id: 'emparejados',
            name: 'Emparejados (juego digital)',
            price: 2.90,
            image: emparejadosPortadaThumb
          }
        ]}
      />
      
    </div>;
};
export default EnganchadosLanding;