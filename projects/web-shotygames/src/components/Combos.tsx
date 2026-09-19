import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, ShoppingCart, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LazyCheckoutModal as CheckoutModal } from "./LazyCheckoutModal";
import comboParejasImg from "@/assets/combo-parejas-banner.webp";
import comboParejasThumb from "@/assets/thumbs/combo-parejas-flatlay.webp";
import torreNormalThumb from "@/assets/thumbs/torre-normal-brillo.webp";
import torrePicanteThumb from "@/assets/thumbs/torre-picante.webp";
import { trackInitiateCheckout } from "@/lib/pixels";

/**
 * Sección de combos de la home.
 *
 * Historia: este componente existía desde antes con 4 combos, pero NUNCA se
 * renderizó — no estaba importado en Index.tsx. Por eso sus precios se
 * quedaron viejos (decía "antes $60" para el Combo Torres cuando su landing
 * dice $75, y "antes $85" para el Chuchaqui cuando su landing dice $105): nadie
 * los veía, así que nadie los corrigió.
 *
 * Hoy arranca con UN solo combo, el de Parejas, decidido con Fabián el
 * 2026-09-15. Los demás combos siguen vivos en sus landings (/landing/promo-hoy,
 * /landing/combo-la-previa, /landing/combo-chuchaqui, /landing/3-torres) y se
 * irán agregando acá de a uno. El "Combo Torres" a $45 quedó deprecado: son las
 * mismas 3 torres que /landing/3-torres vende a $49, así que no va en la home.
 *
 * REGLA al agregar un combo: copiar precio, originalPrice, includes y upsells
 * EXACTOS de su landing. No hay catálogo central — si acá y la landing no
 * coinciden, el cliente ve un precio en la home y otro al hacer clic.
 */

type Combo = {
  id: string;
  productId: "comboParejas";
  nombre: string;
  gancho: string;
  precio: number;
  precioAntes: number;
  imagen: string;
  imagenCheckout: string;
  badge: string;
  ruta: string;
  incluye: string[];
  upsells: Array<{
    id: "torreNormal" | "torrePicante" | "torreParejas" | "enganchados" | "emparejados" | "dadosPlacer";
    name: string;
    price: number;
    image: string;
  }>;
};

// Fuente: src/pages/ComboParejasLanding.tsx (mantener sincronizado)
const combos: Combo[] = [
  {
    id: "combo-parejas",
    productId: "comboParejas",
    nombre: "Combo Parejas",
    gancho: "Todo lo que necesitan para una noche distinta, en un solo pedido.",
    precio: 35,
    precioAntes: 49.9,
    imagen: comboParejasImg,
    imagenCheckout: comboParejasThumb,
    badge: "PROMO DE LA SEMANA ❤️",
    ruta: "/landing/combo-parejas",
    incluye: [
      "Torre Parejas + 1 vaso tequilero",
      "Dados del Placer — 4 dados: Acción, Zona, Tiempo e Intensidad",
      "Emparejados — 72 cartas (digital + PDF imprimible)",
      "🎁 Guía 30 Posiciones — GRATIS por la promo",
      "🎁 Guía Digital del Placer — GRATIS por la promo",
    ],
    upsells: [
      { id: "torreNormal", name: "Torre La Previa (para grupos)", price: 10, image: torreNormalThumb },
      { id: "torrePicante", name: "Torre Picante (para grupos)", price: 10, image: torrePicanteThumb },
    ],
  },
];

const Combos = () => {
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [comboActivo, setComboActivo] = useState<Combo | null>(null);

  const comprar = (combo: Combo) => {
    trackInitiateCheckout({
      content_name: combo.nombre,
      value: combo.precio,
    });
    setComboActivo(combo);
    setCheckoutOpen(true);
  };

  return (
    <section id="combos" className="bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display mb-4 text-4xl md:text-5xl">
            <span className="text-gradient">Combos</span> con descuento
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Packs armados para que salga más barato que comprar cada juego por separado.
          </p>
        </div>

        <div className="mx-auto max-w-4xl space-y-8">
          {combos.map((combo) => {
            const ahorro = combo.precioAntes - combo.precio;
            return (
              <Card
                key={combo.id}
                className="overflow-hidden border-2 transition-smooth hover:border-primary hover:shadow-glow"
              >
                <div className="grid md:grid-cols-2">
                  {/* Imagen */}
                  <button
                    type="button"
                    onClick={() => navigate(combo.ruta)}
                    aria-label={`Ver ${combo.nombre}`}
                    className="relative aspect-[4/5] overflow-hidden bg-muted/20 md:aspect-auto"
                  >
                    <img
                      src={combo.imagen}
                      alt={`${combo.nombre} — ${combo.gancho}`}
                      width={800}
                      height={993}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-smooth hover:scale-105"
                    />
                    <Badge className="gradient-party absolute left-3 top-3 font-bold text-white">
                      {combo.badge}
                    </Badge>
                  </button>

                  {/* Contenido */}
                  <CardContent className="flex flex-col gap-5 p-6 md:p-8">
                    <div>
                      <h3 className="font-display text-3xl md:text-4xl">{combo.nombre}</h3>
                      <p className="mt-2 text-muted-foreground">{combo.gancho}</p>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-display text-4xl font-bold text-primary">
                        ${combo.precio}
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        ${combo.precioAntes.toFixed(2)}
                      </span>
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
                        Ahorras ${ahorro.toFixed(2)}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {combo.incluye.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Envío gratis a todo Ecuador · Pagas al recibir
                    </p>

                    <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="hero"
                        size="lg"
                        className="w-full sm:flex-1"
                        onClick={() => comprar(combo)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        COMPRAR
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:flex-1"
                        onClick={() => navigate(combo.ruta)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver más
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {comboActivo && (
        <CheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          productName={comboActivo.nombre}
          productPrice={comboActivo.precio}
          productImage={comboActivo.imagenCheckout}
          productId={comboActivo.productId}
          isCombo
          comboIncludes={comboActivo.incluye}
          originalPrice={comboActivo.precioAntes}
          upsells={comboActivo.upsells}
        />
      )}
    </section>
  );
};

export default Combos;
