import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Heart, Sparkles, CheckCircle2, Flame, BookOpen, MessageCircle, Users, Lock, Download, HelpCircle, ChevronDown } from "lucide-react";
import { LazyCheckoutModal as CheckoutModal } from "@/components/LazyCheckoutModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import guiaPlacerPortada from "@/assets/guia-placer-portada.webp";
import Seo from "@/components/Seo";

const PRECIO = 6.90;
const PRECIO_ANTERIOR = 15.00;
const PRODUCT_ID = "guia-placer";
const PRODUCT_NAME = "Guía Digital del Placer";

const GuiaPlacerLanding = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'ViewContent', {
        content_name: PRODUCT_NAME,
        content_category: 'Productos Digitales',
        value: PRECIO,
        currency: 'USD',
      });
    }
  }, []);

  const openCheckout = () => setIsCheckoutOpen(true);

  return (
    <>
      <Seo
        title="Guía Digital del Placer - Reconecta con tu pareja | ShotyGames"
        description="Ideas prácticas y experiencias para encender la pasión en pareja. Guía digital PDF con descarga inmediata. Oferta de lanzamiento $6.90"
        canonical="https://www.shotygames.com/landing/guia-del-placer"
        type="product"
      />

      <div className="min-h-screen bg-background">
        {/* Ambient warm gradient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent" />
        </div>

        {/* Sticky Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-sm shadow-lg border-b border-border" : "bg-transparent"}`}>
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-primary font-bold text-lg">ShotyGames</span>
            <Button size="sm" onClick={openCheckout} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs">
              Comprar
            </Button>
          </div>
        </header>

        {/* 1️⃣ HERO */}
        <section className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-4 py-1.5 mb-6">
              <Flame className="w-4 h-4 text-destructive" />
              <span className="text-destructive text-sm font-medium">Oferta de Lanzamiento</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
              Guía Digital del <span className="text-primary">Placer</span>
            </h1>
            
            <p className="text-muted-foreground text-lg mb-4 max-w-md mx-auto">
              Juego previo, exploración y experiencias prácticas para encender la pasión en pareja.
            </p>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto italic">
              Una guía directa, sin teoría aburrida y con ideas reales para probar desde hoy.
            </p>

            {/* Portada del ebook */}
            <div className="relative max-w-[220px] mx-auto mb-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-destructive/10 to-primary/20 rounded-3xl blur-xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src={guiaPlacerPortada} 
                  alt="Guía Digital del Placer - Portada" 
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-[10px]">PDF</span>
              </div>
            </div>

            {/* Precio */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-muted-foreground line-through text-lg">${PRECIO_ANTERIOR.toFixed(2)}</span>
              <span className="text-4xl font-black text-foreground">${PRECIO.toFixed(2)}</span>
            </div>
            <p className="text-destructive text-sm mb-6 font-medium">Precio especial disponible por tiempo limitado.</p>
            
            <Button 
              size="lg"
              onClick={openCheckout}
              className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-6 rounded-xl shadow-lg animate-pulse"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Comprar ahora — Acceso inmediato
            </Button>
          </div>
        </section>

        {/* 2️⃣ PROBLEMA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              ¿La pasión se volvió predecible?
            </h2>

            <div className="max-w-md mx-auto space-y-3">
              {[
                "Siempre lo mismo, sin sorpresa",
                "Menos anticipación antes de la intimidad",
                "Falta de ideas nuevas para variar",
                "Querer encender la chispa sin incomodidad",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-destructive text-sm">✗</span>
                  </div>
                  <p className="text-foreground text-sm">{text}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-primary font-semibold mt-8 text-base max-w-sm mx-auto">
              Esta guía fue creada para cambiar eso de forma simple y natural.
            </p>
          </div>
        </section>

        {/* 3️⃣ QUÉ ES ESTA GUÍA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                ¿Qué es esta guía?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                No es un libro teórico ni incómodo. Es una guía práctica con ideas, dinámicas y experiencias diseñadas para aumentar el deseo y crear momentos diferentes en pareja.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { icon: Flame, title: "Placer", desc: "Ideas directas para encender el deseo y disfrutar más" },
                { icon: Heart, title: "Exploración", desc: "Dinámicas para descubrir nuevas sensaciones juntos" },
                { icon: Sparkles, title: "Experiencias", desc: "Propuestas que pueden probar esta misma noche" },
              ].map((item, i) => (
                <Card key={i} className="bg-card border-border p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-foreground font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 4️⃣ QUÉ ENCONTRARÁS DENTRO */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                ¿Qué encontrarás dentro?
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { emoji: "🔥", title: "Juego previo que realmente enciende" },
                { emoji: "✨", title: "Ideas prácticas para romper la rutina" },
                { emoji: "💋", title: "Exploración del cuerpo y zonas de placer" },
                { emoji: "🧸", title: "Accesorios y juguetes sin incomodidad" },
                { emoji: "🌙", title: "Experiencias nuevas para sorprenderse" },
                { emoji: "❤️", title: "Comunicación íntima sin vergüenza" },
              ].map((chapter, i) => (
                <Card key={i} className="bg-card border-border p-5 text-center hover:border-primary/30 transition-colors">
                  <span className="text-3xl mb-3 block">{chapter.emoji}</span>
                  <h3 className="text-foreground font-semibold text-sm">{chapter.title}</h3>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 5️⃣ POR QUÉ ES DIFERENTE */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                ¿Por qué esta guía es diferente?
              </h2>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              {[
                "Sin lenguaje vulgar",
                "Sin teoría innecesaria",
                "Diseñada para parejas reales",
                "Ideas fáciles de aplicar",
                "Enfocada en experiencias, no reglas",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6️⃣ BONUS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <span className="text-3xl mb-3 block">🎁</span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Compra hoy y llévate <span className="text-primary">GRATIS</span>
              </h2>
              <p className="text-muted-foreground text-sm mt-2">Solo disponible durante el lanzamiento.</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="flex items-start gap-4 bg-primary/5 border border-primary/15 rounded-xl p-5">
                <div className="w-16 h-20 bg-gradient-to-br from-primary/20 to-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-bold text-base mb-1">Guía Digital de 30 Posiciones Sexuales</p>
                  <p className="text-muted-foreground text-sm mb-2">Ilustrada, práctica y sin tabúes. El complemento perfecto para tu Guía del Placer.</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground line-through text-sm">$9.90</span>
                    <span className="text-primary font-bold text-lg">GRATIS</span>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
        </section>

        {/* 6️⃣ BENEFICIOS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Lo que esta guía puede ayudarles a lograr
            </h2>

            <div className="max-w-md mx-auto space-y-3">
              {[
                "Aumentar el deseo sin presión",
                "Mejorar el juego previo naturalmente",
                "Descubrir nuevas sensaciones juntos",
                "Salir de la rutina íntima",
                "Crear momentos más intensos y memorables",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7️⃣ PARA QUIÉN ES */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              ¿Para quién es esta guía?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {[
                "Parejas nuevas",
                "Parejas con años juntos",
                "Personas que quieren reconectar",
                "Quienes buscan ideas prácticas sin incomodidad",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8️⃣ TESTIMONIOS */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Lo que dicen quienes ya la tienen
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { name: "Andrea & Luis", city: "Guayaquil", initials: "A&L", text: "Pensamos que sería otro ebook más, pero nos sorprendió muchísimo. Son ideas simples que realmente te dan ganas de probar cosas nuevas sin sentir incomodidad." },
                { name: "Camila R.", city: "Quito", initials: "CR", text: "No tiene teoría aburrida. Todo es práctico y fácil de aplicar. Probamos algunas ideas el mismo día y la verdad cambió totalmente el ambiente entre nosotros." },
                { name: "Daniel & Sofía", city: "Cuenca", initials: "D&S", text: "Tenía miedo de que fuera algo incómodo o demasiado explícito, pero es súper elegante y natural. Se siente como una guía hecha para parejas reales." },
                { name: "Javier M.", city: "Machala", initials: "JM", text: "Por el precio pensé que sería algo básico, pero trae muchísimas ideas. Literalmente ya tenemos planes para varias noches diferentes gracias a la guía." },
                { name: "Paola", city: "Loja", initials: "PA", text: "Nos hizo volver a conversar y reírnos juntos. No es solo sobre intimidad, también ayuda a reconectar de una forma muy natural." },
                { name: "Valentina G.", city: "Samborondón", initials: "VG", text: "La compré por curiosidad y terminó siendo una de las mejores compras digitales que hemos hecho como pareja. Súper recomendada." },
              ].map((review, i) => (
                <Card key={i} className="bg-card border-border p-5">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-primary text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed line-clamp-3 mb-4">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-xs">{review.initials}</span>
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-sm">{review.name}</p>
                      <p className="text-muted-foreground text-xs">{review.city}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 9️⃣ CTA FINAL */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <Heart className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Empiecen hoy a crear noches diferentes juntos.
            </h2>

            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-muted-foreground line-through text-lg">${PRECIO_ANTERIOR.toFixed(2)}</span>
              <span className="text-4xl font-black text-foreground">${PRECIO.toFixed(2)}</span>
            </div>
            <p className="text-destructive text-sm mb-6 font-medium">Oferta de lanzamiento por tiempo limitado</p>

            <Button 
              size="lg"
              onClick={openCheckout}
              className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-6 rounded-xl shadow-lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Comprar ahora — Acceso inmediato
            </Button>
          </div>
        </section>

        {/* 🔟 FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Preguntas frecuentes
            </h2>

            <div className="max-w-lg mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {[
                  { q: "¿Cómo recibo la guía?", a: "Inmediatamente después de confirmar tu pago, recibirás el enlace de descarga por WhatsApp y correo electrónico." },
                  { q: "¿Es contenido explícito?", a: "No. La guía tiene un tono sensual pero elegante. Está diseñada para inspirar y dar ideas prácticas, sin contenido vulgar ni incómodo." },
                  { q: "¿Es incómodo de leer?", a: "Para nada. Todo está escrito con un tono natural, respetuoso y directo. Pueden leerla juntos o por separado sin incomodidad." },
                  { q: "¿Funciona aunque llevemos años juntos?", a: "Especialmente para ustedes. Las ideas están pensadas para romper la rutina y redescubrirse, sin importar cuánto tiempo lleven." },
                  { q: "¿Debo descargar algo?", a: "Solo necesitas abrir el PDF. Puedes leerlo desde tu celular, tablet o computadora sin instalar nada." },
                  { q: "¿El acceso es inmediato?", a: "Sí, una vez confirmado tu pago recibes el archivo inmediatamente. Lo compras hoy, lo usas hoy." },
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                    <AccordionTrigger className="text-foreground text-sm font-semibold text-left hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* 1️⃣1️⃣ FOOTER */}
        <Footer />

        {/* Checkout Modal */}
        <CheckoutModal
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          productName={PRODUCT_NAME}
          productPrice={PRECIO}
          productImage=""
          originalPrice={PRECIO_ANTERIOR}
          productId="guia-placer"
        />
      </div>
    </>
  );
};

export default GuiaPlacerLanding;
