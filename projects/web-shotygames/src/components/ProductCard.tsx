import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  includes?: string[];
  onBuy?: () => void;
  onViewMore?: () => void;
}

const ProductCard = ({
  name,
  description,
  price,
  originalPrice,
  image,
  badge,
  includes = [],
  onBuy,
  onViewMore,
}: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden transition-smooth hover:shadow-glow hover:-translate-y-1 border-border/50 flex flex-col h-full">
      <div className="relative overflow-hidden aspect-square bg-muted/20">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-contain transition-smooth group-hover:scale-105"
        />
        {badge && (
          <Badge className="absolute top-2 right-2 md:top-4 md:right-4 gradient-party text-white font-bold text-[10px] md:text-xs">
            {badge}
          </Badge>
        )}
      </div>
      
      <CardHeader className="p-3 md:p-6 pb-1 md:pb-1.5">
        <CardTitle className="font-display text-sm md:text-2xl leading-tight">{name}</CardTitle>
        <CardDescription className="text-xs md:text-base line-clamp-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="p-3 md:p-6 pt-1 md:pt-0 flex-1">
        <div className="flex items-baseline gap-1 md:gap-2">
          <span className="text-xl md:text-3xl font-display font-bold text-primary">
            ${price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-xs md:text-lg text-muted-foreground line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Includes list hidden on mobile, shown on desktop */}
        {includes.length > 0 && (
          <div className="hidden md:block space-y-2 mt-4">
            <p className="text-sm font-semibold text-muted-foreground">Incluye:</p>
            <ul className="space-y-1">
              {includes.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-1.5 md:flex-row md:gap-2 p-3 md:p-6 pt-0 mt-auto">
        <Button 
          variant="hero" 
          className="w-full md:flex-1 text-xs md:text-lg px-3 py-2 md:px-8 md:py-6 h-auto min-h-[36px] md:min-h-[48px]"
          onClick={onBuy}
        >
          COMPRAR
        </Button>
        <Button 
          variant="outline" 
          className="w-full md:flex-1 text-xs md:text-base h-auto min-h-[32px] md:min-h-[40px]"
          onClick={onViewMore}
        >
          Ver más
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
