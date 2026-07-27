import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, CreditCard, Truck } from "lucide-react";

const steps = [
  {
    icon: ShoppingBag,
    number: "1",
    title: "Elige tu juego",
    description: "Selecciona tu juego favorito o un combo especial. Todos incluyen regalos digitales gratis.",
  },
  {
    icon: CreditCard,
    number: "2",
    title: "Completa tu pedido",
    description: "Ingresa tus datos de envío y confirma tu compra. Proceso rápido y seguro.",
  },
  {
    icon: Truck,
    number: "3",
    title: "Recíbelo rapidísimo",
    description: "Entrega en 2-4 días hábiles a todo Ecuador.",
  },
];

const HowToBuy = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            ¿Cómo <span className="text-gradient">Comprar?</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Es súper fácil. Solo 3 pasos y listo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="relative border-2 hover:border-primary transition-smooth group">
                <CardContent className="pt-8 text-center">
                  {/* Number Badge */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full gradient-party flex items-center justify-center shadow-glow">
                    <span className="text-2xl font-display font-bold text-white">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-2xl mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HowToBuy;
