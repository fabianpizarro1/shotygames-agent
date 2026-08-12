import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Truck, Clock, Users, Heart, Zap, CheckCircle2, Package } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { CheckoutModal } from "@/components/CheckoutModal";
import torreNormalImg from "@/assets/torre-normal-brillo.webp";
import torrePicanteImg from "@/assets/torre-picante.jpg";
import torreParejasImg from "@/assets/torre-parejas.jpg";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";

const ComboLaPreviaLanding = () => {
  const navigate = useNavigate();
  const productName = "Combo La Previa";
  const productPrice = 50.00;
  const originalPrice = 80.00;
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
    "2 Torres de Shots a elección (Normal, Picante o Parejas)",
    "Enganchados - Juego de cartas para fiestas",
    "🎁 Guía digital de 30 posiciones sexuales",
    "🎁 Guía digital de 20 juegos para fiestas",
    "🎁 Shot BIDU de regalo",
  ];

  const productImages = [
    { src: torreNormalImg, badge: "Combo La Previa 🎉", alt: "Combo La Previa" },
    { src: torrePicanteImg, badge: "Torre Picante 🌶️", alt: "Torre Picante incluida" },
    { src: torreParejasImg, badge: "Torre Parejas 💕", alt: "Torre Parejas incluida" }
  ];

  const benefits = [
    { icon: Zap, text: "Ahorra $30 comprando hoy" },
    { icon: Gift, text: "3 Regalos incluidos" },
    { icon: Users, text: "Perfecto para el previa con amigos" },
    { icon: Truck, text: "Entrega a todo Ecuador" },
    { icon: CheckCircle2, text: "Entrega en 2-4 días hábiles" }
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Seo
        title="Combo La Previa - Kit de Fiesta Completo | ShotyGames Ecuador"
        description="2 Torres + Enganchados + Shot Bidu + guías digitales. El kit perfecto para arrancar la noche. Envíos a todo Ecuador."
        canonical="https://www.shotygames.com/landing/combo-la-previa"
        type="website"
      />
      {/* Header fijo con promo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 md:py-3 px-4 text-center font-semibold shadow-lg">
        <p className="text-xs md:text-base animate-pulse">
          🎉 COMBO LA PREVIA: Promoción especial 🇪🇨
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
                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none text-sm md:text-base px-3 py-1">
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
                📸 Desliza para ver las torres incluidas
              </div>
            </div>

            {/* Información del Producto */}
            <div className="text-center space-y-4 md:space-y-6">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base md:text-lg px-4 py-2 animate-pulse">
                COMBO LA PREVIA 🎉
              </Badge>
              
              <h1 className="text-3xl md:text-5xl font-bold gradient-text leading-tight">
                {productName}
              </h1>
              
              <p className="text-lg md:text-2xl text-muted-foreground font-semibold">
                Todo para calentar tu previa antes de la fiesta
              </p>

              {/* Precio */}
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <span className="text-2xl md:text-3xl text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                <span className="text-4xl md:text-6xl font-bold text-purple-600">${productPrice.toFixed(2)}</span>
                <Badge className="bg-green-600 text-white text-sm md:text-base px-3 py-1">
                  AHORRAS ${(originalPrice - productPrice).toFixed(0)}
                </Badge>
              </div>

              {/* Badges de Confianza */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-6">
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
                
                <Card className="p-3 md:p-4 border-2 border-purple-500/20 bg-purple-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Gift className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    <p className="text-xs md:text-sm font-bold text-center">3 Regalos Gratis</p>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4 border-2 border-pink-500/20 bg-pink-500/5">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
                    <p className="text-xs md:text-sm font-bold text-center">Para Grupos</p>
                  </div>
                </Card>

                <Card className="p-3 md:p-4 border-2 border-[#ff3d00]/20 bg-[#ff3d00]/5">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-6 h-6 md:w-8 md:h-8 text-[#ff3d00]" />
                    <p className="text-xs md:text-sm font-bold text-center">Combo Completo</p>
                  </div>
                </Card>
              </div>

              {/* CTA Principal */}
              <Button 
                onClick={handleBuyClick}
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-600/90 hover:to-pink-600/90 text-white text-lg md:text-2xl font-bold px-8 md:px-16 py-6 md:py-8 rounded-xl shadow-2xl hover:scale-105 transition-all mt-4"
              >
                <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                COMPRAR AHORA
                <Zap className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  <span>Entrega 2-4 días</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-purple-600 fill-purple-600" />
                  <span>Perfecto para la previa</span>
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
              🎁 Todo lo que incluye este combo
            </h2>
            <Card className="p-6 md:p-8">
              <ul className="space-y-4">
                {comboIncludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-base md:text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 gradient-text">
            ¿Por qué elegir Combo La Previa?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-4 md:p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="p-2 md:p-3 rounded-full bg-purple-600/10 flex-shrink-0">
                    <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <p className="text-sm md:text-lg font-semibold flex-1">{benefit.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Descripción del Combo */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 gradient-text">
              El combo perfecto para tu previa
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-600">🎴 Enganchados</h3>
                <p className="text-muted-foreground">
                  Juego de cartas diseñado para crear momentos divertidos y memorables. Perfecto para romper el hielo y conocerse mejor.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-600">🎯 2 Torres a Elección</h3>
                <p className="text-muted-foreground">
                  Elige las torres que más te gusten: Normal para diversión clásica, Picante para subir la temperatura, o Parejas para jugar en pareja.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-600">📖 2 Guías Digitales</h3>
                <p className="text-muted-foreground">
                  Guía de 30 posiciones sexuales + Guía de 20 juegos para fiestas. Contenido digital exclusivo para tus reuniones.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-600">🎁 Shot BIDU</h3>
                <p className="text-muted-foreground">
                  Regalo especial para completar tu combo. Un shot de regalo para empezar la previa con todo.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Urgencia */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-purple-600/10 to-pink-600/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg md:text-xl animate-pulse">
              ⏰ OFERTA LIMITADA
            </div>
            <h2 className="text-2xl md:text-4xl font-bold">
              Prepara la mejor previa de todas
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Ahorra $30 y recibe todo lo necesario para una previa épica. .
            </p>
            <Button 
              onClick={handleBuyClick}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg md:text-xl font-bold px-10 py-6 rounded-xl hover:scale-105 transition-all"
            >
              <ShoppingCart className="mr-2" />
              QUIERO MI COMBO AHORA
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
          className="w-full max-w-md mx-auto block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-600/90 hover:to-pink-600/90 text-white text-lg font-bold py-6 rounded-xl shadow-xl"
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
        productImage={torreNormalImg}
        productId="previa"
        upsells={[]}
        isCombo={true}
        comboIncludes={comboIncludes}
        originalPrice={originalPrice}
        torreSelection={{ required: true, count: 2 }}
      />
    </div>
  );
};

export default ComboLaPreviaLanding;
