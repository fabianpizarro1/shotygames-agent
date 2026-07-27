import { Button } from "@/components/ui/button";
import { Flame, Gift } from "lucide-react";
const PromoBanner = () => {
  const handlePromoClaim = () => {
    const message = encodeURIComponent('Hola! Quiero aprovechar la promoción de regalos digitales');
    window.open(`https://wa.me/593987654321?text=${message}`, '_blank');
  };
  return <section className="relative py-12 overflow-hidden">
      <div className="absolute inset-0 gradient-party opacity-90" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Flame className="w-10 h-10 animate-pulse" />
              <Gift className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl font-bold mb-1">HOY: Regalos Digitales Incluidos</p>
              
            </div>
          </div>
          
          
        </div>
      </div>

      {/* Animated decorative elements */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse delay-75" />
    </section>;
};
export default PromoBanner;