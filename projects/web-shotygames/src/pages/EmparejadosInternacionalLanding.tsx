import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Gift, Heart, MessageCircle, Sparkles, Zap, Clock, Shield, Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import portadaImage from "@/assets/emparejados-portada.jpg";
import conexionImage from "@/assets/emparejados-conexion.jpg";
import deseoImage from "@/assets/emparejados-deseo.jpg";
import diversionImage from "@/assets/emparejados-diversion.jpg";
import productImage1 from "@/assets/emparejados-prod-1.webp";
import productImage2 from "@/assets/emparejados-prod-2.webp";
import productImage3 from "@/assets/emparejados-prod-3.webp";
import productImage4 from "@/assets/emparejados-prod-4.webp";
import ebookImage from "@/assets/ebook-30-posiciones.webp";

const HOTMART_URL = "https://pay.hotmart.com/V103157355N?checkoutMode=10";

const EmparejadosInternacionalLanding = () => {
  useEffect(() => {
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'ViewContent', {
        content_name: 'Emparejados Internacional',
        content_category: 'Juegos de Cartas',
        value: 3.90,
        currency: 'USD',
      });
    }
  }, []);

  const handleBuyClick = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: 'Emparejados Internacional',
        content_category: 'Juegos de Cartas',
        value: 3.90,
        currency: 'USD'
      });
    }
    window.open(HOTMART_URL, '_blank');
  };

  const productImages = [
    { src: portadaImage, badge: "OFERTA HOY", alt: "Emparejados - Juego Digital para Parejas" },
    { src: productImage1, badge: "PRODUCTO", alt: "Emparejados - Cartas y caja del juego" },
    { src: productImage2, badge: "INCLUYE", alt: "Emparejados - Contenido completo del juego" },
    { src: productImage3, badge: "3 CATEGORÍAS", alt: "Emparejados - Conexión, Deseo y Diversión" },
    { src: productImage4, badge: "PREMIUM", alt: "Emparejados - Diseño elegante" },
  ];

  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const testimonials = [
    {
      name: "Sofía M.",
      location: "Quito",
      rating: 5,
      text: "Terminamos muriéndonos de risa y más conectados. Las cartas son súper variadas y nunca aburren.",
      date: "Hace 3 días",
      avatar: "SM",
    },
    {
      name: "Carlos & Ana",
      location: "Guayaquil",
      rating: 5,
      text: "Lo compramos para nuestro aniversario y fue la mejor decisión. Súper romántico y divertido a la vez.",
      date: "Hace 1 semana",
      avatar: "CA",
    },
    {
      name: "Daniel R.",
      location: "Cuenca",
      rating: 5,
      text: "Las cartas de 'Deseo' son increíbles. Elevó la chispa en nuestra relación de forma elegante.",
      date: "Hace 2 semanas",
      avatar: "DR",
    },
    {
      name: "María José",
      location: "Manta",
      rating: 5,
      text: "Lo uso con mi novio en cada cita. Es perfecto para romper la rutina y conocernos más.",
      date: "Hace 5 días",
      avatar: "MJ",
    },
    {
      name: "Roberto P.",
      location: "Ambato",
      rating: 5,
      text: "Digital y accesible desde cualquier dispositivo. Lo recomiendo 100%. Gran inversión en nuestra relación.",
      date: "Hace 1 semana",
      avatar: "RP",
    },
  ];

  const benefits = [
    { icon: MessageCircle, text: "Más conversación real y cercanía genuina" },
    { icon: Sparkles, text: "Más chispa y novedad en tu relación" },
    { icon: Heart, text: "Plan instantáneo para citas y aniversarios" },
    { icon: Zap, text: "Juegas donde sea, cuando sea" },
  ];

  const howToPlaySteps = [
    {
      step: "1",
      title: "Baraja las cartas",
      description: "Presiona BARAJEAR para mezclar las 72 cartas",
      icon: Heart
    },
    {
      step: "2",
      title: "Saca una carta",
      description: "Aparecerá un reto de ❤️ Conexión, 🔥 Deseo o 🎯 Diversión",
      icon: Sparkles
    },
    {
      step: "3",
      title: "Cumple o toma",
      description: "Si no deseas cumplir la carta, toma un shot de castigo",
      icon: Zap
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 overflow-x-hidden w-full">
      <Seo
        title="Emparejados Internacional - Juego Digital para Parejas | ShotyGames"
        description="El juego digital para parejas con acceso inmediato vía Hotmart. Conexión, deseo y diversión. Solo $3.90."
        canonical="https://www.shotygames.com/landing/emparejados-internacional"
        type="website"
      />
      {/* Fixed Header with Promo */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-primary text-primary-foreground py-3 px-2 text-center font-semibold text-xs sm:text-sm md:text-base shadow-lg animate-fade-in">
        🎁 HOY: Guía Digital de 30 Posiciones GRATIS + Acceso Inmediato 🎁
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-24 overflow-x-hidden w-full max-w-[100vw]">
        {/* Hero Section */}
        <section className="w-full px-3 sm:px-4 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center w-full max-w-full">
            {/* Image Carousel */}
            <div className="relative w-full max-w-full">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl w-full bg-background">
                <img
                  src={productImages[currentImage].src}
                  alt={productImages[currentImage].alt}
                  className="w-full h-full object-contain transition-transform duration-300"
                  loading={currentImage === 0 ? "eager" : "lazy"}
                  fetchPriority={currentImage === 0 ? "high" : "auto"}
                />
                <link 
                  rel="preload" 
                  as="image" 
                  href={productImages[(currentImage + 1) % productImages.length].src}
                />
                <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-sm px-3 py-1 animate-pulse">
                  {productImages[currentImage].badge}
                </Badge>
              </div>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              <div className="flex justify-center gap-2 mt-4">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImage ? "bg-primary w-8" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-4 md:space-y-6 w-full max-w-full">
              <div className="w-full">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4 leading-tight break-words">
                  Empareja 2: el juego digital que enciende su conexión
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                  72 cartas para reír, conectar y vivir una noche diferente. 100% digital.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Gift className="w-4 h-4 mr-1" />
                  Bono Hoy
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Acceso Inmediato
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Shield className="w-4 h-4 mr-1" />
                  Uso Ilimitado
                </Badge>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 md:p-6 border-2 border-primary/20 w-full">
                <div className="flex items-baseline gap-2 md:gap-3 mb-2 flex-wrap">
                  <span className="text-xl md:text-2xl text-muted-foreground line-through">$15.00</span>
                  <span className="text-4xl md:text-5xl font-bold text-primary">$3.90</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  🎁 <strong>BONO HOY:</strong> Incluye Guía Digital de 30 Posiciones (gratis)
                </p>
                <Button
                  onClick={handleBuyClick}
                  size="lg"
                  variant="hero"
                  className="w-full text-sm md:text-base lg:text-lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  COMPRAR AHORA
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Acceso inmediato al confirmar tu pago. Úsalo cuantas veces quieras.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo se juega */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16 my-8 md:my-12">
          <div className="bg-muted/30 rounded-xl md:rounded-3xl p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-3 md:mb-4">
              Cómo se juega
            </h2>
            <p className="text-center text-sm md:text-base text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto">
              Se juega desde el celular, tablet o PC. Sin descargas.
            </p>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 w-full max-w-full">
            {howToPlaySteps.map((step) => (
              <Card key={step.step} className="text-center hover:shadow-xl transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">{step.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
            </div>
          </div>
        </section>

        {/* Qué incluye */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8 md:mb-12">
            Qué incluye
          </h2>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto w-full max-w-full">
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-semibold mb-1">72 cartas digitales únicas</h3>
                    <p className="text-sm text-muted-foreground">Contenido exclusivo y variado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-semibold mb-1">3 categorías</h3>
                    <p className="text-sm text-muted-foreground">Conexión, Deseo, Diversión</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-semibold mb-1">Acceso inmediato y repetible</h3>
                    <p className="text-sm text-muted-foreground">Ilimitadas veces, cuando quieras</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="font-semibold mb-1">Actualizaciones gratis</h3>
                    <p className="text-sm text-muted-foreground">Mejoras menores incluidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-2 border-primary hover:shadow-xl transition-shadow md:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <h3 className="font-semibold mb-1 text-primary">BONO DE HOY: Guía digital 30 posiciones</h3>
                    <p className="text-sm text-muted-foreground">Regalo especial solo por comprar hoy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Vista Previa de Cartas */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16 my-8 md:my-12">
          <div className="bg-muted/30 rounded-xl md:rounded-3xl p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-3 md:mb-4">
              Vista previa de las cartas
            </h2>
            <p className="text-center text-sm md:text-base text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto">
              Conoce las 3 categorías del juego
            </p>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto w-full max-w-full">
            <Card className="overflow-hidden hover:shadow-2xl transition-all hover:scale-105">
              <div className="aspect-[2/3] relative">
                <img
                  src={conexionImage}
                  alt="Categoría Conexión"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-4 pb-6 bg-[#d63384]/10">
                <h3 className="font-bold text-lg mb-2" style={{ color: '#d63384' }}>💗 CONEXIÓN</h3>
                <p className="text-sm text-muted-foreground">
                  Preguntas y dinámicas para abrirse y fortalecer el vínculo emocional.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-2xl transition-all hover:scale-105">
              <div className="aspect-[2/3] relative">
                <img
                  src={deseoImage}
                  alt="Categoría Deseo"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-4 pb-6 bg-[#8B1538]/10">
                <h3 className="font-bold text-lg mb-2" style={{ color: '#8B1538' }}>🔥 DESEO</h3>
                <p className="text-sm text-muted-foreground">
                  Retos coquetos y elegantes para subir la temperatura con clase.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-2xl transition-all hover:scale-105">
              <div className="aspect-[2/3] relative">
                <img
                  src={diversionImage}
                  alt="Categoría Diversión"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-4 pb-6 bg-[#0077b6]/10">
                <h3 className="font-bold text-lg mb-2" style={{ color: '#0077b6' }}>🎉 DIVERSIÓN</h3>
                <p className="text-sm text-muted-foreground">
                  Dinámicas ligeras para reír juntos y romper el hielo.
                </p>
              </CardContent>
            </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8 md:mb-12">
            Beneficios que notarás
          </h2>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto w-full max-w-full">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg pt-2">{benefit.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Urgencia y Bonus */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 my-8 md:my-12 max-w-7xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 shadow-2xl w-full max-w-full">
            <CardContent className="pt-6 md:pt-8 pb-6 md:pb-8 text-center px-3 sm:px-4">
              <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 w-full max-w-full">
                <Badge className="text-lg px-6 py-2 bg-destructive text-destructive-foreground animate-pulse">
                  OFERTA ESPECIAL
                </Badge>
                
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  Compra hoy y llévate GRATIS
                </h2>

                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="bg-background/80 rounded-xl p-6 border border-primary/20">
                    <div className="flex items-start gap-4">
                      <img 
                        src={ebookImage} 
                        alt="Ebook 30 Posiciones para Parejas" 
                        className="w-20 h-28 object-cover rounded-lg shadow-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-2">Guía Digital de 30 Posiciones</h3>
                        <p className="text-muted-foreground">
                          Ilustrada y práctica. Valor $10 - ¡GRATIS HOY!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/80 rounded-xl p-6 border border-primary/20">
                    <Zap className="w-10 h-10 text-primary mb-3" />
                    <h3 className="font-bold text-xl mb-2">Acceso Inmediato</h3>
                    <p className="text-muted-foreground">
                      Recibe tu acceso al instante. Sin esperas.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-xl font-semibold mb-4">
                    Precio normal: <span className="line-through text-muted-foreground">$15.00</span>
                  </p>
                  <p className="text-4xl font-bold text-primary mb-6">
                    HOY solo $3.90
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    ⏰ Promo y bono válidos solo por hoy
                  </p>
                  <Button
                    onClick={handleBuyClick}
                    size="xl"
                    variant="hero"
                    className="w-full text-sm sm:text-base md:text-xl px-4 sm:px-8 md:px-12"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    COMPRAR AHORA
                    <Zap className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Testimonials */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16 my-8 md:my-12">
          <div className="bg-muted/30 rounded-xl md:rounded-3xl p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-3 md:mb-4">
              Lo que dicen nuestras parejas
            </h2>
            <p className="text-center text-sm md:text-base text-muted-foreground mb-8 md:mb-12">
              Más de 500 parejas ya disfrutando de Empareja 2
            </p>

          <Carousel className="max-w-5xl mx-auto">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                        ))}
                      </div>

                      <p className="text-sm mb-3 italic">"{testimonial.text}"</p>
                      
                      <div className="text-xs text-muted-foreground">{testimonial.date}</div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8 md:mb-12">
            Preguntas frecuentes
          </h2>

          <div className="max-w-3xl mx-auto space-y-3 md:space-y-4 w-full max-w-full">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">¿Es físico o digital?</h3>
                <p className="text-muted-foreground">
                  Es 100% digital. Juegas desde cualquier dispositivo: celular, tablet o computadora. Sin necesidad de descargar nada.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">¿Cuándo recibo el acceso?</h3>
                <p className="text-muted-foreground">
                  De inmediato al confirmar el pago. Recibes el enlace exclusivo automáticamente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">¿Puedo usarlo varias veces?</h3>
                <p className="text-muted-foreground">
                  ¡Sí! El acceso es ilimitado. Puedes jugar cuantas veces quieras, sin límite de tiempo ni restricciones.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">¿Cómo realizo el pago?</h3>
                <p className="text-muted-foreground">
                  Al hacer clic en "Comprar Ahora" serás redirigido a una plataforma de pago segura donde puedes pagar con tarjeta de crédito, débito u otros métodos internacionales.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">¿La guía de 30 posiciones está incluida?</h3>
                <p className="text-muted-foreground">
                  Sí, solo por hoy. Es un bono gratis que normalmente vale $10. La recibes junto con el acceso al juego.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 my-8 md:my-12 max-w-7xl mx-auto">
          <Card className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-2xl w-full max-w-full">
            <CardContent className="pt-8 md:pt-12 pb-8 md:pb-12 text-center px-3 sm:px-4">
              <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 w-full max-w-full">
                <h2 className="text-4xl md:text-5xl font-display font-bold">
                  Activa tu noche hoy
                </h2>
                
                <p className="text-xl opacity-95">
                  Empieza a disfrutar en los próximos 5 minutos
                </p>

                <div className="py-6">
                  <div className="text-2xl line-through opacity-75 mb-2">$15.00</div>
                  <div className="text-6xl font-bold mb-2">$3.90</div>
                  <p className="text-lg opacity-90">+ Guía de 30 posiciones GRATIS</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <p className="text-lg font-semibold mb-2">⏰ Promo válida solo por hoy</p>
                  <p className="opacity-90">No pierdas esta oportunidad única</p>
                </div>

                <Button
                  onClick={handleBuyClick}
                  size="xl"
                  variant="secondary"
                  className="text-xl px-12 py-8 text-primary hover:scale-105 transition-transform"
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  COMPRAR AHORA
                  <Zap className="w-6 h-6 ml-2" />
                </Button>

                <p className="text-sm opacity-75 pt-4">
                  ✓ Acceso inmediato ✓ Uso ilimitado ✓ Pago seguro internacional
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Fixed Bottom CTA Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border shadow-2xl w-full">
        <div className="w-full px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 w-full max-w-full">
            <div className="flex items-center gap-2 flex-shrink-0">
              <img src={portadaImage} alt="Emparejados" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground line-through leading-tight">$15.00</div>
                <div className="text-base font-bold text-primary leading-tight">$3.90</div>
              </div>
            </div>
            <Button
              onClick={handleBuyClick}
              size="sm"
              variant="hero"
              className="flex-1 min-w-0 text-xs sm:text-sm"
            >
              <ShoppingCart className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">COMPRAR AHORA</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Button Desktop */}
      <div className="hidden md:block">
        <Button
          onClick={handleBuyClick}
          size="lg"
          variant="whatsapp"
          className="fixed bottom-6 right-6 z-50 shadow-2xl hover:scale-110 transition-transform animate-pulse px-6 py-6 text-base"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          COMPRAR AHORA
        </Button>
      </div>
    </div>
  );
};

export default EmparejadosInternacionalLanding;
