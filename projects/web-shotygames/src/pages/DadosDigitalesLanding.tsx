import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useCheckoutRestore } from "@/hooks/useCheckoutRestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Gift, Heart, MessageCircle, Sparkles, Zap, Clock, Shield, Star, ChevronLeft, ChevronRight, Check, Smartphone, Wifi, Download, HelpCircle, Dice1 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import dadosPrincipal from "@/assets/dados-digitales-principal.webp";
import dadosImg2 from "@/assets/dados-digitales-2.webp";
import dadosImg3 from "@/assets/dados-digitales-3.webp";
import dadosImg4 from "@/assets/dados-digitales-4.webp";
import dadosImg5 from "@/assets/dados-digitales-5.webp";
import dadosImg6 from "@/assets/dados-digitales-6.webp";
import dadosImg7 from "@/assets/dados-digitales-7.webp";
import dadosImg8 from "@/assets/dados-digitales-8.webp";
import dadosImg9 from "@/assets/dados-digitales-9.webp";
import dadosPreview1 from "@/assets/dados-preview-1.webp";
import dadosPreview2 from "@/assets/dados-preview-2.webp";

const DadosDigitalesLanding = () => {
  const productName = "Dados Digitales de Posiciones";
  const productPrice = 6.90;
  const originalPrice = 14.90;
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
        content_category: 'Juegos Digitales',
        value: productPrice,
        currency: 'USD',
      });
    }
  }, []);

  const handleBuyClick = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: productName,
        content_category: 'Juegos Digitales',
        value: productPrice,
        currency: 'USD'
      });
    }
    setCheckoutOpen(true);
  };

  const productImages = [{
    src: dadosPrincipal,
    badge: "OFERTA HOY",
    alt: "Dados Digitales - Vista principal"
  }, {
    src: dadosImg2,
    badge: "JUEGO",
    alt: "Dados Digitales - Activa la chispa"
  }, {
    src: dadosImg3,
    badge: "RESULTADO",
    alt: "Dados Digitales - Tu combinación"
  }, {
    src: dadosImg4,
    badge: "DEMO",
    alt: "Dados Digitales - Interfaz del juego"
  }, {
    src: dadosImg5,
    badge: "MODO JUEGO",
    alt: "Dados Digitales - Cómo funciona"
  }, {
    src: dadosImg6,
    badge: "PRODUCTO",
    alt: "Dados Digitales - La chispa empieza aquí"
  }, {
    src: dadosImg8,
    badge: "PAREJA",
    alt: "Dados Digitales - Pareja jugando"
  }];
  const [currentImage, setCurrentImage] = useState(0);
  const nextImage = () => {
    setCurrentImage(prev => (prev + 1) % productImages.length);
  };
  const prevImage = () => {
    setCurrentImage(prev => (prev - 1 + productImages.length) % productImages.length);
  };
  const testimonials = [{
    name: "Laura & Diego",
    location: "Quito",
    rating: 5,
    text: "Nos encantó. Cada vez que jugamos descubrimos algo nuevo del otro. Muy recomendado para parejas.",
    avatar: "LD"
  }, {
    name: "Camila R.",
    location: "Guayaquil",
    rating: 5,
    text: "Simple, divertido y muy entretenido. Perfecto para salir de la rutina en pareja.",
    avatar: "CR"
  }, {
    name: "Andrés M.",
    location: "Cuenca",
    rating: 5,
    text: "Lo mejor es que puedes jugarlo en cualquier momento. Las combinaciones son muy variadas.",
    avatar: "AM"
  }];
  const benefits = [{
    icon: Heart,
    text: "Mayor conexión en pareja"
  }, {
    icon: Shield,
    text: "Más confianza"
  }, {
    icon: Sparkles,
    text: "Más creatividad"
  }, {
    icon: Zap,
    text: "Cero rutina"
  }, {
    icon: MessageCircle,
    text: "Risas, juegos y complicidad"
  }, {
    icon: Star,
    text: "Momentos íntimos y significativos"
  }];
  const howItWorks = [{
    step: "1",
    title: "Entra al juego",
    description: "Accede desde el celular o computador",
    icon: Smartphone
  }, {
    step: "2",
    title: "Elige el set",
    description: "Posiciones principales o el set adicional de acciones",
    icon: Dice1
  }, {
    step: "3",
    title: "Lanza los dados",
    description: "Toca cada dado para obtener una combinación",
    icon: Sparkles
  }, {
    step: "4",
    title: "Disfruta juntos",
    description: "Una dinámica o actividad lista para disfrutar",
    icon: Heart
  }, {
    step: "5",
    title: "Repite",
    description: "Jueguen cuantas veces quieran",
    icon: Zap
  }];
  const faqs = [{
    question: "¿Cómo recibo el juego?",
    answer: "Acceso inmediato al finalizar la compra. Recibirás el enlace por WhatsApp y correo."
  }, {
    question: "¿Tengo que descargarlo?",
    answer: "No. Puedes usarlo directamente desde la web. Descargarlo es opcional y solo si deseas usarlo sin conexión."
  }, {
    question: "¿Funciona en cualquier celular?",
    answer: "Sí, es compatible con Android y iPhone. Funciona en cualquier navegador."
  }, {
    question: "¿Incluye los bonos?",
    answer: "Sí, los Dados de Acciones y la Guía Digital están disponibles solo por lanzamiento."
  }];
  return <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 overflow-x-hidden w-full">
      <Seo
        title="Dados Digitales del Placer - Juego para Parejas | ShotyGames Ecuador"
        description="Dados digitales con posiciones y retos para parejas. Acceso inmediato por solo $6.90. Enciende la pasión."
        canonical="https://www.shotygames.com/landing/dados-digitales"
        type="website"
      />
      {/* Fixed Header with Promo */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-primary text-primary-foreground py-3 px-2 text-center font-semibold text-xs sm:text-sm md:text-base shadow-lg animate-fade-in">
        🎁 HOY: 2 BONOS GRATIS + Acceso Inmediato 🎁
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-24 overflow-x-hidden w-full max-w-[100vw]">
        
        {/* SECCIÓN 1 - HERO */}
        <section className="w-full px-3 sm:px-4 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center w-full">
            {/* Image Carousel */}
            <div className="relative w-full">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl w-full bg-background">
                <img src={productImages[currentImage].src} alt={productImages[currentImage].alt} className="w-full h-full object-contain transition-transform duration-300" />
                <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-sm px-3 py-1 animate-pulse">
                  {productImages[currentImage].badge}
                </Badge>
              </div>
              
              <Button variant="secondary" size="icon" onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button variant="secondary" size="icon" onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <ChevronRight className="w-6 h-6" />
              </Button>

              <div className="flex justify-center gap-2 mt-4">
                {productImages.map((_, index) => <button key={index} onClick={() => setCurrentImage(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentImage ? "bg-primary w-8" : "bg-muted-foreground/30"}`} />)}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-4 md:space-y-6 w-full">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4 leading-tight">
                  Dados Digitales de Posiciones Sexuales
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                  Un juego digital diseñado para transformar la noche de la pareja en algo más especial, divertido y lleno de conexión.
                </p>
              </div>

              {/* Bullets */}
              <ul className="space-y-2 text-sm md:text-base">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  Acceso inmediato desde cualquier dispositivo.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  Fácil de usar e interactivo.
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  Ideal para salir de la rutina y crear nuevos momentos.
                </li>
              </ul>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Gift className="w-4 h-4 mr-1" />
                  2 Bonos Gratis
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

              {/* Price */}
              <div className="bg-muted/50 rounded-xl p-4 md:p-6 border-2 border-primary/20">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span className="text-xl md:text-2xl text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                  <span className="text-4xl md:text-5xl font-bold text-primary">${productPrice.toFixed(2)}</span>
                  <Badge className="bg-destructive text-destructive-foreground">Lanzamiento</Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-4">
                  🎁 <strong>BONOS HOY:</strong> Dados de Acciones + Guía PDF de 30 Posiciones (gratis)
                </p>
                <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full text-sm md:text-base lg:text-lg animate-pulse">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  COMPRAR AHORA
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Acceso inmediato al confirmar tu pago.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2 - QUÉ ES ESTE JUEGO */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16">
          <div className="bg-muted/30 rounded-xl md:rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-6">
              ¿Qué es este juego?
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-3xl mx-auto">
              Es un juego digital donde la pareja lanza <strong>tres dados virtuales</strong> que crean combinaciones únicas para disfrutar juntos.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-xl transition-shadow border-2 border-primary/20">
                <CardContent className="pt-6 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Dice1 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Dado 1</h3>
                  <p className="text-muted-foreground text-sm">Posición Sexual</p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-xl transition-shadow border-2 border-primary/20">
                <CardContent className="pt-6 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Dado 2</h3>
                  <p className="text-muted-foreground text-sm">Lugar donde hacerla </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-xl transition-shadow border-2 border-primary/20">
                <CardContent className="pt-6 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Dado 3</h3>
                  <p className="text-muted-foreground text-sm">Tiempo o intensidad</p>
                </CardContent>
              </Card>
            </div>
            
            <p className="text-center text-muted-foreground mt-6">
              Cada combinación genera una dinámica diferente para disfrutar juntos.
            </p>
          </div>
        </section>

        {/* SECCIÓN 3 - BENEFICIOS */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8">
            Beneficios para tu relación
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                  <benefit.icon className="w-8 h-8 text-primary mb-3" />
                  <p className="font-medium text-sm md:text-base">{benefit.text}</p>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* SECCIÓN 4 - LO QUE INCLUYE */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16">
          <div className="bg-muted/30 rounded-xl md:rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8">
              Lo que incluye tu compra
            </h2>
            
            <div className="space-y-4 max-w-3xl mx-auto">
              <Card className="hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Dice1 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Dados Digitales de Posiciones Sexuales </h3>
                      <p className="text-muted-foreground">Juego principal con dinámicas guiadas para parejas.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-2 border-primary hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-destructive-foreground" />
                    </div>
                    <div>
                      <Badge className="bg-destructive text-destructive-foreground mb-2">BONUS #1 - Solo hoy</Badge>
                      <h3 className="font-bold text-lg mb-1">Dados de Acciones</h3>
                      <p className="text-muted-foreground text-sm">Retos y actividades adicionales para complementar la experiencia.</p>
                      <p className="text-sm mt-2">
                        <span className="line-through text-muted-foreground">$4.90</span>
                        <span className="text-primary font-bold ml-2">GRATIS</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-2 border-primary hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-destructive-foreground" />
                    </div>
                    <div>
                      <Badge className="bg-destructive text-destructive-foreground mb-2">BONUS #2 - Solo hoy</Badge>
                      <h3 className="font-bold text-lg mb-1">Guía Digital PDF </h3>
                      <p className="text-muted-foreground text-sm">Una guía con 30 posiciones sexuales para parejas.</p>
                      <p className="text-sm mt-2">
                        <span className="line-through text-muted-foreground">$3.90</span>
                        <span className="text-primary font-bold ml-2">GRATIS</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* SECCIÓN 5 - OFERTA Y URGENCIA */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl md:rounded-3xl p-6 md:p-8 border-2 border-primary/30">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-6">
              Oferta de Lanzamiento
            </h2>
            
            <div className="max-w-md mx-auto space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span>Ddos de Posiciones</span>
                <span className="line-through text-muted-foreground">$14.90</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span>Dados de Acciones</span>
                <span className="line-through text-muted-foreground">$4.90</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary/20">
                <span>Guía Digital</span>
                <span className="line-through text-muted-foreground">$3.90</span>
              </div>
              <div className="flex justify-between items-center py-3 font-bold text-lg">
                <span>Valor total:</span>
                <span className="line-through text-muted-foreground">$26.70</span>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-muted-foreground mb-2">Hoy solo pagas:</p>
              <p className="text-5xl md:text-6xl font-bold text-primary">$6.90</p>
              <Badge className="mt-3 bg-destructive text-destructive-foreground animate-pulse">
                ⏰ Oferta exclusiva por lanzamiento. Tiempo limitado.
              </Badge>
            </div>
            
            <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full max-w-md mx-auto flex items-center justify-center text-lg animate-pulse">
              <ShoppingCart className="mr-2 h-5 w-5" />
              COMPRAR YA
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* SECCIÓN 6 - TESTIMONIOS */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8">
            Lo que dicen las parejas
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* SECCIÓN 7 - CÓMO FUNCIONA */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16">
          <div className="bg-muted/30 rounded-xl md:rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8">
              Cómo funciona
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {howItWorks.map(item => <div key={item.step} className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">{item.step}</div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>)}
            </div>
          </div>
        </section>

        {/* SECCIÓN 8 - DESCARGA OPCIONAL */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-6">
              Juega desde cualquier lugar
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 flex flex-col items-center">
                  <Wifi className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-bold mb-2">Desde la web</h3>
                  <p className="text-muted-foreground text-sm">
                    El juego funciona perfectamente desde el navegador. Sin descargas.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 flex flex-col items-center">
                  <Download className="w-12 h-12 text-primary mb-4" />
                  <h3 className="font-bold mb-2">Descarga opcional</h3>
                  <p className="text-muted-foreground text-sm">
                    Agrégalo a tu pantalla de inicio para acceder más rápido, incluso sin conexión.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Al comprar, recibirás una guía sencilla para agregarlo a tu celular si lo deseas.
            </p>
          </div>
        </section>

        {/* SECCIÓN 9 - IMÁGENES DE REFERENCIA */}
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-12 md:py-16">
          <div className="bg-muted/30 rounded-xl md:rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8">
              Vista previa del juego
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[dadosPreview2, dadosPreview1].map((img, index) => (
                <div key={index} className="rounded-xl overflow-hidden shadow-lg bg-muted">
                  <img src={img} alt={`Vista previa ${index + 1}`} className="w-full h-auto object-contain" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN 10 - PREGUNTAS FRECUENTES */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-8">
            <HelpCircle className="inline-block w-8 h-8 mr-2 text-primary" />
            Preguntas Frecuentes
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="bg-muted/30 rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </div>
        </section>

        {/* SECCIÓN 11 - CTA FINAL */}
        <section className="w-full px-3 sm:px-4 py-12 md:py-16 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl md:rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-4">
              Llévate hoy todo el pack
            </h2>
            <p className="text-xl md:text-2xl mb-2">
              Por solo <span className="font-bold text-3xl md:text-4xl">$6.90</span>
            </p>
            <p className="text-primary-foreground/80 mb-6">
              Precio normal: <span className="line-through">$14.90</span>
            </p>
            
            <Button onClick={handleBuyClick} size="lg" className="bg-white text-primary hover:bg-white/90 font-bold text-base md:text-lg px-6 md:px-10 py-6 rounded-xl shadow-xl hover:scale-105 transition-transform mx-auto">
              <ShoppingCart className="mr-2 h-5 w-5" />
              OBTENER EL JUEGO AHORA
            </Button>
            
            <p className="text-sm mt-4 text-primary-foreground/80">
              Acceso inmediato. Compra 100% segura.
            </p>
          </div>
        </section>
      </div>

      {/* Fixed Bottom CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border p-3 md:hidden">
        <Button onClick={handleBuyClick} size="lg" variant="hero" className="w-full text-base animate-pulse">
          <ShoppingCart className="mr-2 h-5 w-5" />
          COMPRAR - $6.90
          <Zap className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} productName={productName} productPrice={productPrice} productImage={dadosPrincipal} productId="dadosDigitales" />
    </div>;
};
export default DadosDigitalesLanding;