import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Truck, Clock, Users, Heart, Zap, CheckCircle2, Package, Crown } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { CheckoutModal } from "@/components/CheckoutModal";
import comboChuchaquiImg from "@/assets/combo-chuchaqui.webp";
import torreNormalImg from "@/assets/torre-normal-brillo.webp";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import torreParejasImg from "@/assets/torre-parejas.jpg";
import enganchadosImg from "@/assets/enganchados.jpg";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";

const ComboChuchaquiLanding = () => {
  const navigate = useNavigate();
  const productName = "Combo Chuchaqui";
  const productPrice = 65.00;
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
        content_category: 'Combos',
        value: productPrice,
        currency: 'USD',
      });
    }
  }, []);

  const handleBuyClick = () => {
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: productName,
        content_type: 'product',
        value: productPrice,
        currency: 'USD'
      });
    }
    setCheckoutOpen(true);
  };

  const comboIncludes = [
    "Torre La Previa",
    "Torre Picante",
    "Torre Parejas",
    "Enganchados",
    "🎁 Botella de regalo",
    "🎁 Guía digital de 30 posiciones sexuales",
    "🎁 Guía digital de 20 juegos para fiestas",
  ];

  const productImages = [
    { src: comboChuchaquiImg, badge: "Combo Chuchaqui 🔥", alt: "Combo Chuchaqui" },
    { src: torreNormalImg, badge: "Torre La Previa 🎮", alt: "Torre La Previa" },
    { src: torrePicanteImg, badge: "Torre Picante 🌶️", alt: "Torre Picante" },
    { src: torreParejasImg, badge: "Torre Parejas 💕", alt: "Torre Parejas" },
    { src: enganchadosImg, badge: "Enganchados 🎯", alt: "Enganchados" }
  ];

  const benefits = [
    { icon: Crown, text: "Pack completo - 4 juegos en uno" },
    { icon: Zap, text: "Ahorra $40 comprando todo junto" },
    { icon: Gift, text: "Botella + 2 Guías digitales gratis" },
    { icon: Heart, text: "Perfecto para fiestas épicas" },
    { icon: Truck, text: "Entrega a todo Ecuador" },
    { icon: CheckCircle2, text: "Entrega en 2-4 días hábiles" }
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Combo Chuchaqui - Pack Completo para tu Fiesta | ShotyGames Ecuador"
        description="3 Torres + Enganchados + botella de regalo + guías digitales. El pack definitivo para fiestas épicas. Envíos a todo Ecuador."
        canonical="https://www.shotygames.com/landing/combo-chuchaqui"
        type="website"
      />
      {/* Header fijo con promo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
        <p className="text-xs md:text-base animate-pulse">
          🔥 SOLO HOY: Promoción especial 🇪🇨
        </p>
      </div>

      <div className="h-10 md:h-14"></div>

      {/* Hero Section */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Botón de navegación */}
            <div className="flex justify-center mb-6 md:mb-8">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 font-semibold hover:scale-105 transition-all"
              >
                <Package className="w-5 h-5" />
                Ver Más Combos
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
                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none text-sm md:text-base px-3 py-1">
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
                📸 Desliza para ver los 4 juegos incluidos
              </div>
            </div>

            {/* Información del Producto */}
            <div className="text-center space-y-4 md:space-y-6">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base md:text-lg px-4 py-2 animate-pulse">
                PACK COMPLETO 🔥
              </Badge>
              
              <h1 className="text-3xl md:text-5xl font-bold gradient-text leading-tight">
                {productName}
              </h1>
              
              <p className="text-lg md:text-2xl text-muted-foreground font-semibold">
                4 Juegos Completos + Botella + Guías
              </p>

              {/* Precio */}
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <span className="text-2xl md:text-3xl text-muted-foreground line-through">$105.00</span>
                <span className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">$65.00</span>
                <Badge className="bg-green-600 text-white text-sm md:text-base px-3 py-1">
                  AHORRAS $40
                </Badge>
              </div>

              {/* Badges de Confianza */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
                <Card className="p-3 md:p-4 border-2 border-green-500/20 bg-green-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Compra Segura</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-blue-500/20 bg-blue-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Entrega Rápida</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-amber-500/20 bg-amber-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Crown className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Pack Premium</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-orange-500/20 bg-orange-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Gift className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Botella Gratis</p>
                  </div>
                </Card>
              </div>

              {/* CTA Principal */}
              <Button 
                onClick={handleBuyClick}
                size="lg"
                className="w-full max-w-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg md:text-2xl font-bold px-6 md:px-12 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all mt-4"
              >
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                COMPRAR AHORA
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                  <span>Entrega 2-4 días</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-600 fill-amber-600" />
                  <span>Pack más completo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Incluye */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 gradient-text">
              🎁 Todo lo que incluye este super combo
            </h2>
            <Card className="p-6 md:p-8 border-2 border-amber-500/20">
              <ul className="space-y-4">
                {comboIncludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-base md:text-lg font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-lg">
                <p className="text-center font-bold text-lg text-amber-700">
                  💰 Valor total si compras por separado: $105 - ¡AHORRAS $40!
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 gradient-text">
            ¿Por qué elegir el Combo Chuchaqui?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-4 md:p-6 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-amber-500/10">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="p-2 md:p-3 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-600/10 flex-shrink-0">
                    <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                  </div>
                  <p className="text-sm md:text-lg font-semibold flex-1">{benefit.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Descripción */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-amber-500/5 to-orange-600/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-12 border-2 border-amber-500/20 shadow-xl">
              <div className="text-center space-y-4 md:space-y-6">
                <Crown className="w-16 h-16 mx-auto text-amber-600" />
                <h2 className="text-2xl md:text-4xl font-bold gradient-text">
                  El pack definitivo de la fiesta
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                  ¿Quieres tener <span className="font-bold">TODO lo necesario</span> para una fiesta épica?
                  Este combo incluye <span className="font-bold">las 3 Torres de Shots + Enganchados</span>,
                  más una botella de regalo y guías digitales exclusivas. Es el kit completo
                  para convertir cualquier reunión en una noche inolvidable.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-4xl mb-2">🎮</div>
                    <p className="font-bold text-lg">4 Juegos Completos</p>
                    <p className="text-sm text-muted-foreground">La Previa, Picante, Parejas + Enganchados</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-4xl mb-2">🍾</div>
                    <p className="font-bold text-lg">Botella de Regalo</p>
                    <p className="text-sm text-muted-foreground">¡Empieza la fiesta con todo!</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-4xl mb-2">📚</div>
                    <p className="font-bold text-lg">2 Guías Digitales</p>
                    <p className="text-sm text-muted-foreground">30 posiciones + 20 juegos para fiestas</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-4xl mb-2">🚚</div>
                    <p className="font-bold text-lg">Entrega Rápida</p>
                    <p className="text-sm text-muted-foreground">A todo Ecuador en 2-4 días</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Urgencia */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full font-bold text-lg md:text-xl animate-pulse">
              ⏰ OFERTA LIMITADA - POCAS UNIDADES
            </div>
            <h2 className="text-2xl md:text-4xl font-bold">
              La inversión perfecta para tus fiestas
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Con este combo tienes todo lo que necesitas para meses de diversión.
              Ahorra $40 y recibe una botella gratis.
            </p>
            <div className="p-6 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600 mb-2">
                🎯 Solo $16.25 por juego
              </p>
              <p className="text-sm text-muted-foreground">
                (comprando por separado pagarías $26.25 por juego)
              </p>
            </div>
            <Button 
              onClick={handleBuyClick}
              size="lg"
              className="w-full max-w-md bg-gradient-to-r from-amber-500 to-orange-600 text-white text-lg md:text-xl font-bold px-8 py-6 rounded-xl hover:scale-105 transition-all"
            >
              <ShoppingCart className="mr-2" />
              QUIERO EL COMBO COMPLETO
            </Button>
          </div>
        </div>
      </section>

      <Testimonials />
      <Footer />

      {/* Botón flotante fijo en móviles */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50 shadow-lg">
        <Button 
          onClick={handleBuyClick}
          size="lg"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-500/90 hover:to-orange-600/90 text-white text-lg font-bold py-6 rounded-xl shadow-xl"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          COMPRAR AHORA - ${productPrice.toFixed(2)}
        </Button>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        productName={productName}
        productPrice={productPrice}
        productImage={comboChuchaquiImg}
        productId="chuchaqui"
        upsells={[]}
        isCombo={true}
        incluyeShotBidu={true}
        comboIncludes={comboIncludes}
        originalPrice={105}
      />
    </div>
  );
};

export default ComboChuchaquiLanding;
