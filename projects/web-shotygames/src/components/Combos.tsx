import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Heart, Zap, ShoppingCart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";
import comboPromoHoyImg from "@/assets/combo-promo-hoy.webp";
import comboTorresImg from "@/assets/combo-torres.webp";
import comboChuchaquiImg from "@/assets/combo-chuchaqui.webp";

const combos = [
  {
    id: "promo-hoy",
    name: "Promo de Hoy",
    description: "2 Torres a elección + Regalos Exclusivos",
    price: 35,
    originalPrice: 55,
    savings: 20,
    icon: Zap,
    includes: ["2 Torres de Shots a elección (Normal, Picante o Parejas)", "🎁 Guía digital de 30 posiciones sexuales", "🎁 Guía digital de 20 juegos para fiestas", "🎁 Shot BIDU de regalo"],
    badge: "OFERTA HOY 🔥",
    landingRoute: "/landing/promo-hoy",
    image: comboPromoHoyImg,
    torreSelection: { required: true, count: 2 },
  },
  {
    id: "torres",
    name: "Combo Torres",
    description: "3 Torres + Shot Bidu + Guías Digitales",
    price: 45,
    originalPrice: 60,
    savings: 15,
    icon: Package,
    includes: ["Torre La Previa", "Torre Picante", "Torre Parejas", "🎁 Shot Bidu de regalo", "🎁 Guía digital de 30 posiciones sexuales", "🎁 Guía digital de 20 juegos para fiestas"],
    badge: "MÁS VENDIDO",
    landingRoute: "/landing/combo-torres",
    image: comboTorresImg,
    torreSelection: undefined,
  },
  {
    id: "previa",
    name: "Combo la Previa",
    description: "2 Torres a elección + Enganchados + Regalos",
    price: 50,
    originalPrice: 80,
    savings: 30,
    icon: Zap,
    includes: ["2 Torres a elección (Normal, Picante o Parejas)", "Enganchados", "🎁 Shot Bidu de regalo", "🎁 Guía digital de 30 posiciones sexuales", "🎁 Guía digital de 20 juegos para fiestas"],
    badge: "PREVIA PERFECTA 🍻",
    landingRoute: "/landing/combo-la-previa",
    image: comboPromoHoyImg,
    torreSelection: { required: true, count: 2 },
  },
  {
    id: "chuchaqui",
    name: "Combo Chuchaqui",
    description: "4 Juegos completos + Botella + Guías",
    price: 65,
    originalPrice: 85,
    savings: 20,
    icon: Heart,
    includes: ["Torre La Previa", "Torre Picante", "Torre Parejas", "Enganchados", "🎁 Botella de regalo", "🎁 Guía digital de 30 posiciones sexuales", "🎁 Guía digital de 20 juegos para fiestas"],
    badge: "PACK COMPLETO 🔥",
    landingRoute: "/landing/combo-chuchaqui",
    image: comboChuchaquiImg,
    torreSelection: undefined,
  },
];

const Combos = () => {
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<typeof combos[0] | null>(null);

  const handleBuyCombo = (combo: typeof combos[0]) => {
    // Meta Pixel - InitiateCheckout event
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: combo.name,
        content_type: 'product',
        value: combo.price,
        currency: 'USD'
      });
    }
    
    setSelectedCombo(combo);
    setCheckoutOpen(true);
  };

  const handleViewMore = (landingRoute: string) => {
    navigate(landingRoute);
  };

  const getProductIdForCombo = (comboId: string) => {
    const comboIdMap: Record<string, 'promo-hoy' | 'torres' | 'previa' | 'chuchaqui'> = {
      'promo-hoy': 'promo-hoy',
      'torres': 'torres',
      'previa': 'previa',
      'chuchaqui': 'chuchaqui',
    };
    return comboIdMap[comboId] || 'promo-hoy';
  };

  return (
    <section id="combos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 gradient-party text-white font-bold text-lg px-6 py-2">
            OFERTAS ESPECIALES
          </Badge>
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            Combos <span className="text-gradient">Irresistibles</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ahorra más comprando nuestros packs. Incluyen regalos digitales exclusivos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {combos.map((combo) => {
            const Icon = combo.icon;
            return (
              <Card 
                key={combo.id} 
                className="relative overflow-hidden border-2 hover:border-primary transition-smooth hover:shadow-glow"
              >
                <Badge className="absolute top-4 right-4 gradient-party text-white font-bold">
                  {combo.badge}
                </Badge>

                <CardHeader className="text-center pt-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="font-display text-3xl mb-2">
                    {combo.name}
                  </CardTitle>
                  <p className="text-muted-foreground">{combo.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-3 mb-2">
                      <span className="text-4xl font-display font-bold text-primary">
                        ${combo.price}
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        ${combo.originalPrice}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-primary">
                      Ahorras ${combo.savings}
                    </p>
                  </div>

                  {/* Includes */}
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-muted-foreground uppercase">
                      Incluye:
                    </p>
                    <ul className="space-y-2">
                      {combo.includes.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="hero"
                      className="w-full"
                      size="lg"
                      onClick={() => handleBuyCombo(combo)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      COMPRAR
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={() => handleViewMore(combo.landingRoute)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver más
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Checkout Modal */}
        {selectedCombo && (
          <CheckoutModal
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            productName={selectedCombo.name}
            productPrice={selectedCombo.price}
            productImage={selectedCombo.image}
            productId={getProductIdForCombo(selectedCombo.id)}
            upsells={[]}
            isCombo={true}
            comboIncludes={selectedCombo.includes}
            originalPrice={selectedCombo.originalPrice}
            torreSelection={selectedCombo.torreSelection}
          />
        )}
      </div>
    </section>
  );
};

export default Combos;
