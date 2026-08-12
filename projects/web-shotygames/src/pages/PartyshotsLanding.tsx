import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Truck, Clock, Users, Heart, Zap, CheckCircle2, MessageCircle, Package, Grid3x3 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { CheckoutModal } from "@/components/CheckoutModal";
import cartasPartyshots from "@/assets/cartas-partyshots.jpg";
import torreNormalImg from "@/assets/torre-normal-brillo.webp";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import torreParejasImg from "@/assets/torre-parejas.jpg";
import enganchadosImg from "@/assets/enganchados.jpg";
import dadosDelPlacerImg from "@/assets/dados-del-placer.webp";
import emparejadosPortada from "@/assets/emparejados-portada.jpg";

const PartyshotsLanding = () => {
  const navigate = useNavigate();
  const productName = "Cartas PartyShots";
  const productPrice = 15.00;
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
    { src: cartasPartyshots, badge: "Foto Real 📸", alt: "Cartas completas" },
    { src: cartasPartyshots, badge: "Vista completa 🎯", alt: "Set completo" },
    { src: cartasPartyshots, badge: "Detalle cartas ✨", alt: "Cartas de cerca" },
    { src: cartasPartyshots, badge: "En acción 🔥", alt: "Jugando" },
    { src: cartasPartyshots, badge: "Empaque 📦", alt: "Caja del producto" },
    { src: cartasPartyshots, badge: "Vaso incluido 🥃", alt: "Vaso de shot" },
    { src: cartasPartyshots, badge: "Instrucciones 📋", alt: "Manual de juego" },
    { src: cartasPartyshots, badge: "Calidad premium ⭐", alt: "Material de calidad" },
    { src: cartasPartyshots, badge: "Para fiestas 🎉", alt: "Ambiente festivo" },
    { src: cartasPartyshots, badge: "100% Original ✅", alt: "Producto auténtico" }
  ];

  const testimonials = [
    {
      name: "Fernanda L.",
      location: "Guayaquil",
      rating: 5,
      text: "¡Una locura! Lo llevamos a una reunión y nadie quería que acabe el juego 😂",
      date: "Hace 1 semana",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fernanda",
      photo: cartasPartyshots
    },
    {
      name: "Kevin R.",
      location: "Quito",
      rating: 5,
      text: "Las cartas picantes fueron un caos. Nos reímos toda la noche 🔥",
      date: "Hace 3 días",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin",
      photo: cartasPartyshots
    },
    {
      name: "Diego S.",
      location: "Cuenca",
      rating: 5,
      text: "Perfecto para viajes, se juega en cualquier lugar. Súper recomendado 🙌",
      date: "Hace 2 semanas",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego",
      photo: cartasPartyshots
    },
    {
      name: "Andrea M.",
      location: "Machala",
      rating: 5,
      text: "Compramos 3 para regalar y todos quedaron felices. Calidad increíble",
      date: "Hace 5 días",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andrea",
      photo: cartasPartyshots
    },
    {
      name: "Carlos P.",
      location: "Loja",
      rating: 5,
      text: "El mejor juego para previas. Las cartas especiales son geniales para salvarte",
      date: "Hace 1 semana",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
      photo: cartasPartyshots
    },
    {
      name: "Valeria T.",
      location: "Ambato",
      rating: 5,
      text: "Perfecto para cumpleaños. Todos participan y se divierten un montón 🎉",
      date: "Hace 4 días",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Valeria",
      photo: cartasPartyshots
    },
    {
      name: "Sebastián G.",
      location: "Manta",
      rating: 5,
      text: "Las cartas de acción son lo máximo. Nos partimos de risa bailando 😆",
      date: "Hace 2 días",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian",
      photo: cartasPartyshots
    },
    {
      name: "Camila R.",
      location: "Santo Domingo",
      rating: 5,
      text: "Calidad top. El dado y el vaso están súper bien hechos 💪",
      date: "Hace 6 días",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Camila",
      photo: cartasPartyshots
    },
    {
      name: "Mateo V.",
      location: "Riobamba",
      rating: 5,
      text: "Nos morimos de risa con las cartas 'Elige'. Súper entretenido 😆",
      date: "Hace 3 días",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mateo",
      photo: cartasPartyshots
    },
    {
      name: "Isabella F.",
      location: "Esmeraldas",
      rating: 5,
      text: "La fiesta del sábado fue épica gracias a este juego. Lo recomiendo 100% 🔥",
      date: "Hace 1 día",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella",
      photo: cartasPartyshots
    }
  ];

  const benefits = [
    { icon: Zap, text: "Diversión instantánea garantizada" },
    { icon: Users, text: "100% reusable para múltiples fiestas" },
    { icon: Heart, text: "Juego unisex (+18)" },
    { icon: Gift, text: "Perfecto para regalar" },
    { icon: CheckCircle2, text: "Marca líder en juegos para beber" }
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Cartas PartyShots - Juego de Cartas para Beber | ShotyGames Ecuador"
        description="Las cartas más divertidas para tu próxima fiesta. Para grupos de 2-10 personas. Con retos, preguntas y penitencias. Envíos a todo Ecuador."
        canonical="https://www.shotygames.com/landing/partyshots"
        type="website"
      />
      {/* Header fijo con promo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
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
              <Carousel opts={{ align: "center", loop: true }} className="w-full">
                <CarouselContent>
                  {productImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-square md:aspect-video rounded-2xl overflow-hidden bg-muted shadow-2xl">
                        <img 
                          src={image.src} 
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-4 right-4 bg-[#fbbf24] text-black border-none text-sm md:text-base px-3 py-1">
                          {image.badge}
                        </Badge>
                      </div>
                    </CarouselItem>
                  ))}
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
                {productName}
              </h1>
              
              {/* Precio */}
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <span className="text-2xl md:text-3xl text-muted-foreground line-through">$20.00</span>
                <span className="text-4xl md:text-6xl font-bold text-[#fbbf24]">$15.00</span>
                <Badge className="bg-[#fbbf24] text-black text-sm md:text-base px-3 py-1 animate-pulse">
                  -25% HOY
                </Badge>
              </div>

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
                
                <Card className="p-3 md:p-4 border-2 border-[#fbbf24]/20 bg-[#fbbf24]/5">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="w-6 h-6 md:w-8 md:h-8 text-[#fbbf24]" />
                    <p className="text-xs md:text-sm font-bold text-center">Solo 12 unidades</p>
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
              <Button 
                onClick={handleBuyClick}
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#fbbf24]/90 hover:to-[#f59e0b]/90 text-black text-lg md:text-2xl font-bold px-8 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all mt-4"
              >
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                COMPRAR AHORA
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>

              {/* Garantías adicionales */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-[#fbbf24]" />
                  <span>Entrega 100% segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#fbbf24]" />
                  <span>Entrega 2-3 días</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-[#fbbf24]" />
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
            <h2 className="text-2xl md:text-5xl font-bold text-[#fbbf24] leading-tight">
              ¿Tus fiestas se apagan rápido?
            </h2>
            <div className="text-base md:text-xl text-muted-foreground space-y-2 md:space-y-4">
              <p>¿Siempre juegan lo mismo o se quedan sin ideas?</p>
              <p className="text-xl md:text-2xl font-bold gradient-text px-2">
                Las Cartas PartyShots cambian eso.
              </p>
              <p>El combustible que necesitas para que la noche explote de risas, locura y diversión.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Descripción del Producto */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-12 border-2 border-[#f59e0b]/20 shadow-xl">
              <div className="text-center space-y-4 md:space-y-6">
                <h2 className="text-2xl md:text-4xl font-bold gradient-text">
                  El juego más versátil y adictivo de ShotyGames
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  72 cartas con desafíos únicos divididos en 5 categorías, para que cada partida sea diferente y cada noche más salvaje:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 text-left">
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl md:text-3xl">🎯</div>
                    <div>
                      <p className="font-bold text-sm md:text-base">GRUPAL</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Juegos y dinámicas donde todos participan, ¡nadie se escapa!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl md:text-3xl">⚡</div>
                    <div>
                      <p className="font-bold text-sm md:text-base">ACCIÓN</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Retos físicos como cantar, bailar o cumplir acciones locas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl md:text-3xl">🔥</div>
                    <div>
                      <p className="font-bold text-sm md:text-base">PICANTE</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Los retos más atrevidos y calientes (solo para valientes 😏)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl md:text-3xl">👀</div>
                    <div>
                      <p className="font-bold text-sm md:text-base">ELIGE</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Señala a alguien del grupo… y prepárense para el caos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50 sm:col-span-2">
                    <div className="text-2xl md:text-3xl">🎁</div>
                    <div>
                      <p className="font-bold text-sm md:text-base">ESPECIAL</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Cartas comodín para salvarte, regalar shots o cambiar el destino del juego</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-base md:text-lg">
                    Perfecto para <span className="font-bold">fiestas, previas, viajes o reuniones entre panas.</span>
                  </p>
                  <p className="text-base md:text-lg font-bold text-[#fbbf24]">
                    Simple, rápido y brutalmente divertido.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#fbbf24]/5 to-[#f59e0b]/5">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-5xl font-bold text-center mb-8 md:mb-12 gradient-text">
            Por qué todos eligen las Cartas PartyShots
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-4 md:p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="p-2 md:p-3 rounded-full bg-[#fbbf24]/10 flex-shrink-0">
                    <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-[#fbbf24]" />
                  </div>
                  <p className="text-sm md:text-lg font-semibold flex-1">{benefit.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Urgencia y Bonus */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] opacity-95"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-black space-y-6 md:space-y-8">
            <div className="flex justify-center gap-3 md:gap-4 text-4xl md:text-6xl animate-pulse">
              <Gift className="w-10 h-10 md:w-auto md:h-auto" />
              <Truck className="w-10 h-10 md:w-auto md:h-auto" />
              <Clock className="w-10 h-10 md:w-auto md:h-auto" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold">
              🎁 BONUS EXCLUSIVO (solo por hoy) 🎁
            </h2>
            
            <div className="space-y-3 md:space-y-4 text-base md:text-2xl font-semibold bg-black/20 backdrop-blur-sm p-6 md:p-8 rounded-2xl border-2 border-black/30">
              <p className="text-2xl md:text-3xl">Por tu compra HOY te llevas GRATIS la</p>
              <p className="text-2xl md:text-4xl font-bold text-white">Guía Digital de 20 Juegos para Fiestas 🎉</p>
              <p className="text-base md:text-lg text-black/90">Un bonus exclusivo con ideas nuevas, divertidas y locas para seguir la noche con tu grupo.</p>
              <div className="h-1 w-24 md:w-32 mx-auto bg-black/50 rounded"></div>
              <p className="text-lg md:text-xl"></p>
              <p className="text-sm md:text-lg text-black/90 animate-pulse">
                🕒 Promoción válida hasta agotar stock — última producción ⚡
              </p>
            </div>

            <Button 
              onClick={handleBuyClick}
              size="lg"
              className="hidden md:inline-flex bg-black text-white hover:bg-black/90 text-xl font-bold px-12 py-8 rounded-xl shadow-2xl hover:scale-110 transition-all"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              COMPRAR AHORA
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonios en Carrusel */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-5xl font-bold text-center mb-4 md:mb-6 gradient-text">
            Lo que dicen nuestros clientes
          </h2>
          
          {/* Rating General */}
          <div className="flex flex-col items-center gap-2 mb-8 md:mb-12">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 md:w-8 md:h-8 fill-[#f59e0b] text-[#f59e0b]" />
              ))}
            </div>
            <div className="text-center">
              <p className="text-xl md:text-3xl font-bold">5.0 de 5 estrellas</p>
              <p className="text-sm md:text-base text-muted-foreground">Basado en más de 400 reseñas verificadas ✓</p>
            </div>
          </div>

          {/* Indicador de deslizar para mobile */}
          <div className="text-center mb-4 md:hidden">
            <p className="text-sm text-muted-foreground animate-pulse flex items-center justify-center gap-2">
              👈 Desliza para ver más reseñas 👉
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto overflow-hidden relative">
            <Carousel opts={{
              align: "center",
              loop: true
            }} className="w-full">
              <CarouselContent className="md:-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                    <div className="px-2">
                      <Card className="p-4 md:p-6 hover:shadow-xl transition-all h-full">
                        <div className="space-y-3 md:space-y-4">
                          {/* Foto del cliente */}
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <img src={testimonial.photo} alt={`Foto de ${testimonial.name}`} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-[#f59e0b]/30" />
                            <div className="flex-1">
                              <p className="font-bold text-sm md:text-base">{testimonial.name}</p>
                              <p className="text-xs md:text-sm text-muted-foreground">{testimonial.location}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-[#f59e0b] text-[#f59e0b]" />
                            ))}
                          </div>
                          <p className="text-sm md:text-base text-muted-foreground italic">"{testimonial.text}"</p>
                          <p className="text-xs text-muted-foreground pt-2 border-t">{testimonial.date}</p>
                        </div>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12 bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 border-none shadow-lg" />
              <CarouselNext className="hidden md:flex -right-12 bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 border-none shadow-lg" />
            </Carousel>
            
            {/* Indicadores visuales de navegación para desktop */}
            <div className="hidden md:flex justify-center gap-2 mt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-[#fbbf24]/10 flex items-center justify-center">←</div>
                <span>Usa las flechas para ver más reseñas</span>
                <div className="w-8 h-8 rounded-full bg-[#fbbf24]/10 flex items-center justify-center">→</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSI1IiBjeT0iNSIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2RvdHMpIi8+PC9zdmc+')] opacity-50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-6xl font-bold leading-tight">
              No dejes pasar esta promo:
              <br />
              <span className="text-[#f59e0b]">regalo digital incluido</span>
              <br />
              solo por hoy
            </h2>
            
            <p className="text-lg md:text-2xl text-white/90">
              Miles de personas ya están jugando.
              <br />
              <span className="font-bold">¿Qué esperas para unirte?</span>
            </p>

            <Button 
              onClick={handleBuyClick}
              size="lg"
              className="hidden md:inline-flex bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#fbbf24]/90 hover:to-[#f59e0b]/90 text-black text-2xl font-bold px-16 py-10 rounded-2xl shadow-2xl hover:scale-110 transition-all animate-pulse"
            >
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
        <div className="md:hidden bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] p-3 shadow-2xl">
          <Button 
            onClick={handleBuyClick}
            size="lg"
            className="w-full bg-black text-white hover:bg-black/90 font-bold text-base py-6 rounded-xl shadow-xl"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            COMPRAR AHORA
            <Zap className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        {/* Desktop: Botón Flotante */}
        <Button 
          onClick={handleBuyClick}
          className="hidden md:flex w-16 h-16 rounded-full shadow-2xl hover:scale-110 animate-pulse bg-[#25D366] hover:bg-[#20BA5A]"
          size="icon"
          aria-label="Comprar por WhatsApp"
        >
          <MessageCircle className="w-8 h-8" />
        </Button>
      </div>
      
      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
        productPrice={productPrice}
        productImage={cartasPartyshots}
        productId="partyshots"
        upsells={[
          {
            id: 'torreNormal',
            name: 'Torre La Previa (para grupos)',
            price: 10,
            image: torreNormalImg
          },
          {
            id: 'torrePicante',
            name: 'Torre Picante (para grupos)',
            price: 10,
            image: torrePicanteImg
          },
          {
            id: 'torreParejas',
            name: 'Torre de Shots Parejas',
            price: 10,
            image: torreParejasImg
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
            price: 2.90,
            image: emparejadosPortada
          }
        ]}
      />
    </div>
  );
};

export default PartyshotsLanding;
