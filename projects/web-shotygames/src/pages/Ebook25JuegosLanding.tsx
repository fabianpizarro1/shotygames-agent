import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Download, Users, PartyPopper, Wine, Heart, Sparkles, CheckCircle2, Clock, Smartphone, MessageCircle, UserCheck, TreePine, Zap, Star, Gift } from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";

import portadaEbook from "@/assets/ebook-25-juegos-portada.webp";
import ejemploJuego from "@/assets/ebook-25-juegos-ejemplo.webp";
import Seo from "@/components/Seo";

const PRECIO = 4.90;
const PRECIO_ANTERIOR = 12.99;
const PRODUCT_ID = "ebook-25-juegos-fiestas";
const PRODUCT_NAME = "Guía Digital de 20 Juegos para Fiestas";

const Ebook25JuegosLanding = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
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

  const scrollToModes = () => {
    document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Seo
        title="Guía Digital de 20 Juegos para Fiestas | ShotyGames"
        description="Guía práctica en PDF con 20 juegos para animar reuniones, cenas y previas. Descarga inmediata por solo $4.90"
        canonical="https://www.shotygames.com/landing/25-juegos-fiestas"
        type="product"
      />

      <div className="min-h-screen bg-gradient-to-b from-red-950 via-red-900 to-amber-950">
        {/* Decoración navideña sutil */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-500/10 to-transparent" />
          <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
          <div className="absolute top-32 left-1/4 w-1 h-1 bg-amber-300 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-16 right-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "0.7s" }} />
        </div>

        {/* Header Sticky */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-red-950/95 backdrop-blur-sm shadow-lg" : "bg-transparent"}`}>
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-amber-400 font-bold text-lg">ShotyGames</span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={scrollToModes}
                className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/20 text-xs hidden sm:inline-flex"
              >
                Ver qué incluye
              </Button>
              <Button 
                size="sm"
                onClick={() => setIsCheckoutOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-red-950 font-bold text-xs"
              >
                Comprar
              </Button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="container mx-auto px-4 pt-20 pb-12">
          <div className="text-center mb-6">
            {/* Badge oferta */}
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-1.5 mb-4">
              <TreePine className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">Oferta especial Navidad</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
              La guía que <span className="text-amber-400">salva tus reuniones</span> esta Navidad
            </h1>
            
            <p className="text-amber-200/90 text-base mb-5">
              <strong className="text-white">25 Juegos para Fiestas</strong> – ideas listas para usar en cenas, previas y reuniones
            </p>

            {/* Bullets */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6 text-xs">
              <span className="flex items-center gap-1.5 text-amber-200/80">
                <TreePine className="w-3.5 h-3.5 text-amber-400" />
                Ideal para Navidad y fin de año
              </span>
              <span className="flex items-center gap-1.5 text-amber-200/80">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Para familia, amigos o adultos
              </span>
              <span className="flex items-center gap-1.5 text-amber-200/80">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Sin preparación complicada
              </span>
              <span className="flex items-center gap-1.5 text-amber-200/80">
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Descarga inmediata
              </span>
            </div>
          </div>

          {/* Imagen portada con mockup */}
          <div className="relative max-w-[240px] mx-auto mb-6">
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/30 via-red-500/20 to-amber-500/30 rounded-3xl blur-xl" />
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-[20px] p-2 shadow-2xl border border-gray-700">
              <div className="bg-black rounded-2xl overflow-hidden">
                <img 
                  src={portadaEbook} 
                  alt="25 Juegos para Fiestas - Portada del ebook"
                  className="w-full h-auto"
                />
              </div>
            </div>
            {/* Badge PDF */}
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-red-950 font-bold text-[10px]">PDF</span>
            </div>
          </div>

          {/* Precio y CTA */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-amber-400/60 line-through text-lg">${PRECIO_ANTERIOR}</span>
              <span className="text-4xl font-black text-white">${PRECIO.toFixed(2)}</span>
            </div>
            <p className="text-amber-300 text-xs mb-5">Disponible por tiempo limitado</p>
            
            <Button 
              size="lg"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-bold text-base py-5 rounded-xl shadow-lg shadow-amber-500/30 animate-pulse"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Comprar ahora y animar mi reunión
            </Button>
          </div>
        </section>

        {/* SECCIÓN: EL DOLOR */}
        <section className="bg-red-950/50 py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
              ¿Te suena familiar?
            </h2>

            <div className="max-w-sm mx-auto space-y-3">
              {[
                { icon: MessageCircle, text: "Reuniones donde nadie sabe qué hacer" },
                { icon: Clock, text: "Silencios incómodos que se hacen eternos" },
                { icon: Smartphone, text: "Todos pegados al celular" },
                { icon: UserCheck, text: "El anfitrión cargando con todo" },
                { icon: MessageCircle, text: '"¿Y ahora qué hacemos?"' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 bg-red-900/40 border border-red-700/30 rounded-xl p-3"
                >
                  <div className="w-9 h-9 bg-red-800/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-red-300" />
                  </div>
                  <p className="text-red-100 text-sm">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-amber-300 text-sm font-medium max-w-xs mx-auto">
                Las reuniones no fallan por la gente, <span className="text-white font-bold">fallan por falta de ideas.</span>
              </p>
            </div>
          </div>
        </section>

        {/* SECCIÓN: LA SOLUCIÓN */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Esta guía hace el trabajo por ti
              </h2>
            </div>

            <div className="max-w-sm mx-auto">
              <div className="bg-gradient-to-br from-amber-900/30 to-red-900/30 border border-amber-500/20 rounded-2xl p-5">
                <p className="text-amber-100 mb-4 text-center text-sm">
                  El ebook te dice exactamente:
                </p>
                <div className="space-y-3">
                  {[
                    "Qué hacer en cada momento",
                    "Qué materiales necesitas",
                    "Cómo se juega paso a paso",
                    "Cuándo usar cada tipo de juego"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-white text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-amber-500/20 text-center">
                  <p className="text-amber-200 text-xs">
                    Todo pensado para usarse <strong className="text-white">en el momento</strong>, sin planificación previa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN: CATEGORÍAS */}
        <section id="categorias" className="py-10 bg-red-950/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                3 modos para cualquier reunión
              </h2>
              <p className="text-amber-200/80 text-sm">Elige según tu grupo</p>
            </div>

            <div className="max-w-sm mx-auto space-y-3">
              {/* Modo Fiesta */}
              <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wine className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-0.5">Modo Fiesta</h3>
                    <p className="text-purple-200 text-xs mb-1">Para adultos</p>
                    <p className="text-purple-100/80 text-xs">
                      Dinámicas para romper el hielo. Ideal para previas y reuniones con bebidas.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Modo Familia */}
              <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-0.5">Modo Familia</h3>
                    <p className="text-green-200 text-xs mb-1">Todas las edades</p>
                    <p className="text-green-100/80 text-xs">
                      Juegos simples, creativos y divertidos. Perfecto para cenas navideñas familiares.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Modo Amigos */}
              <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-0.5">Modo Amigos</h3>
                    <p className="text-blue-200 text-xs mb-1">Adolescentes o adultos</p>
                    <p className="text-blue-100/80 text-xs">
                      Conversación, risas y retos. Para grupos que quieren algo diferente.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <p className="text-center text-amber-200/80 text-xs mt-5 max-w-xs mx-auto">
              Tú eliges el modo según el grupo. La guía se adapta a tu reunión.
            </p>
          </div>
        </section>

        {/* SECCIÓN: CÓMO SE VE POR DENTRO */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
              ¿Cómo se ve por dentro?
            </h2>

            <div className="max-w-[280px] mx-auto">
              <div className="relative">
                <div className="absolute -inset-2 bg-amber-500/20 rounded-xl blur-lg" />
                <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl">
                  <img 
                    src={ejemploJuego} 
                    alt="Ejemplo de página del ebook - El Asesino (Juego del Guiño)"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-5 mt-5">
                {["Así de claro", "Así de fácil", "Así se usa"].map((text, index) => (
                  <div key={index} className="text-center">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <span className="text-amber-200 text-[10px]">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN: POR QUÉ NAVIDAD */}
        <section className="py-10 bg-gradient-to-b from-red-900/50 to-amber-900/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <TreePine className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Porque en Navidad nadie quiere reuniones aburridas
              </h2>
            </div>

            <div className="max-w-sm mx-auto grid grid-cols-2 gap-3">
              {[
                { icon: Clock, text: "Más tiempo juntos" },
                { icon: Smartphone, text: "Menos celulares" },
                { icon: PartyPopper, text: "Risas reales" },
                { icon: Star, text: "Momentos que se recuerdan" },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center"
                >
                  <item.icon className="w-7 h-7 text-amber-400 mx-auto mb-1.5" />
                  <p className="text-amber-100 text-xs">{item.text}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-amber-200/80 text-xs mt-5 max-w-xs mx-auto">
              No es solo para Navidad, pero en Navidad <span className="text-amber-300 font-medium">se vuelve indispensable</span>.
            </p>
          </div>
        </section>

        {/* SECCIÓN: GARANTÍA */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-sm mx-auto bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-7 h-7 text-green-400" />
                <h3 className="text-white font-bold text-lg">Acceso inmediato</h3>
              </div>
              <div className="space-y-2">
                {[
                  "Producto 100% digital (PDF)",
                  "Lo compras hoy, lo usas hoy",
                  "Descarga instantánea",
                  "Ideal si tu reunión es esta misma noche"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-100 text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-12 bg-gradient-to-b from-amber-900/30 to-red-950">
          <div className="container mx-auto px-4 text-center">
            <Gift className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
              No improvises tu reunión esta Navidad
            </h2>
            <p className="text-amber-200/80 text-sm mb-5 max-w-xs mx-auto">
              Para tus reuniones de esta semana de fiestas
            </p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-amber-400/60 line-through text-lg">${PRECIO_ANTERIOR}</span>
              <span className="text-3xl font-black text-white">${PRECIO.toFixed(2)}</span>
            </div>

            <Button 
              size="lg"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-red-950 font-bold text-base py-5 rounded-xl shadow-lg shadow-amber-500/30"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Comprar ahora y tener la guía lista
            </Button>

            <p className="text-amber-300/60 text-xs mt-3">
              Oferta especial por Navidad y fin de año
            </p>
          </div>
        </section>

        {/* Footer simple */}
        <footer className="py-6 bg-red-950 border-t border-amber-500/10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-amber-400 font-bold mb-1">ShotyGames</p>
            <p className="text-amber-200/50 text-xs">
              © {new Date().getFullYear()} Todos los derechos reservados
            </p>
          </div>
        </footer>

        {/* Checkout Modal - mismo que productos digitales */}
        <CheckoutModal
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          productName={PRODUCT_NAME}
          productPrice={PRECIO}
          productImage={portadaEbook}
          originalPrice={PRECIO_ANTERIOR}
          productId="ebook-25-juegos"
        />
      </div>
    </>
  );
};

export default Ebook25JuegosLanding;
