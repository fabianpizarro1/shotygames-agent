import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-party.jpg";
import { ArrowRight } from "lucide-react";
const Hero = () => {
  const scrollToProducts = () => {
    document.getElementById('productos')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  
  const scrollToDigitalProducts = () => {
    document.getElementById('productos-digitales')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  
  const scrollToCombos = () => {
    document.getElementById('combos')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Fiesta con juegos de mesa para beber - ShotyGames Ecuador"
          fetchPriority="high"
          decoding="async"
          width={1920}
          height={1280}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 text-center lg:text-left">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight">
            Los juegos que <span className="text-gradient">prenden la fiesta</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-4 font-medium">Los juegos de mesa para beber más divertidos del Ecuador 🍻</p>
          
          <p className="text-lg md:text-xl text-white/80 mb-10">Envíos a todo el país</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button variant="hero" size="xl" onClick={scrollToProducts} className="group">
              Ver Juegos Físicos
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button variant="hero" size="xl" onClick={scrollToDigitalProducts} className="group">
              Juegos Digitales
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
            
          </div>

          {/* Trust Badges */}
          
        </div>
      </div>

      {/* Decorative gradient blob */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
    </section>;
};
export default Hero;