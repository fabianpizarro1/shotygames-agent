import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowLeft, ShoppingCart } from "lucide-react";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

import torreNormal from "@/assets/torre-normal.jpg";
import torrePicante from "@/assets/torre-picante.jpg";
import torreParejas from "@/assets/torre-parejas.jpg";
import enganchados from "@/assets/enganchados.jpg";
import cartasPartyshots from "@/assets/cartas-partyshots.jpg";

const productsData: Record<string, any> = {
  "torre-normal": {
    id: "torre-normal",
    name: "Torre de Shots Normal",
    description: "El clásico que prendió todas las fiestas. 51 bloques con retos, preguntas y penitencias en español.",
    longDescription: "La Torre de Shots Normal es el juego perfecto para animar cualquier fiesta. Con 51 bloques de madera de alta calidad, cada uno con retos únicos, este juego garantiza risas y diversión durante horas. Ideal para reuniones de amigos, previa, o cualquier ocasión que quieras hacer memorable.",
    price: 20,
    image: torreNormal,
    features: [
      "51 bloques de madera premium",
      "Retos en español latinoamericano",
      "Material resistente y duradero",
      "Perfecto para 2-10 jugadores",
      "Apto para mayores de 18 años"
    ],
    includes: [
      "51 bloques con retos",
      "1 vaso tequilero",
      "Instrucciones del juego",
      "🎁 Guía digital de 20 juegos para fiestas"
    ]
  },
  "torre-picante": {
    id: "torre-picante",
    name: "Torre de Shots Picante",
    description: "La versión más atrevida con retos picantes y calientes 🔥",
    longDescription: "¿Te atreves? La Torre de Shots Picante lleva la diversión al siguiente nivel con retos más atrevidos y calientes. Perfecta para fiestas de adultos que buscan una noche inolvidable con amigos cercanos.",
    price: 20,
    image: torrePicante,
    features: [
      "51 bloques con retos picantes",
      "Contenido para adultos +18",
      "Calidad premium",
      "Retos divertidos y atrevidos",
      "Ideal para grupos de confianza"
    ],
    includes: [
      "51 bloques con retos picantes",
      "1 vaso tequilero",
      "Instrucciones del juego",
      "🎁 Guía digital de 20 juegos para fiestas"
    ]
  },
  "torre-parejas": {
    id: "torre-parejas",
    name: "Torre de Shots Parejas",
    description: "Diseñada para parejas que quieren salir de la rutina y encender la noche ❤️",
    longDescription: "Enciende la pasión en tu relación. La Torre de Shots Parejas está diseñada específicamente para que tú y tu pareja salgan de la rutina y se conecten de una forma divertida y romántica.",
    price: 20,
    image: torreParejas,
    features: [
      "51 bloques diseñados para parejas",
      "Retos románticos y picantes",
      "Fortalece la intimidad",
      "Calidad premium",
      "Regalo perfecto para tu pareja"
    ],
    includes: [
      "51 bloques con retos para parejas",
      "1 vaso tequilero",
      "Instrucciones del juego",
      "🎁 Guía digital de 30 posiciones sexuales"
    ]
  },
  "enganchados": {
    id: "enganchados",
    name: "Enganchados",
    description: "Pon a prueba tu puntería, concentración y velocidad mientras compites con tus amigos",
    longDescription: "Enganchados es más que un juego, es una competencia épica de habilidad y suerte. Combina puntería, estrategia y diversión en un solo juego de mesa que mantendrá a todos entretenidos toda la noche.",
    price: 25,
    image: enganchados,
    features: [
      "Juego de madera artesanal",
      "Tabla de shots integrada",
      "Múltiples formas de jugar",
      "Perfecto para competencias",
      "Calidad excepcional"
    ],
    includes: [
      "Juego de madera completo",
      "Tabla de shots",
      "1 vaso tequilero",
      "1 dado",
      "Instrucciones del juego",
      "🎁 Guía digital de 20 juegos para fiestas"
    ]
  },
  "cartas-partyshots": {
    id: "cartas-partyshots",
    name: "Cartas PartyShots",
    description: "69 cartas con retos en 5 categorías: Acción, Picante, Grupal, Especial y Elige",
    longDescription: "69 cartas, infinitas posibilidades de diversión. Cartas PartyShots trae 5 categorías diferentes de retos para que cada ronda sea única. Portátil, fácil de jugar, y perfecto para cualquier ocasión.",
    price: 15,
    image: cartasPartyshots,
    features: [
      "69 cartas de alta calidad",
      "5 categorías de retos",
      "Fácil de transportar",
      "Rápido de aprender",
      "Ideal para cualquier fiesta"
    ],
    includes: [
      "69 cartas con retos",
      "1 dado",
      "1 vaso tequilero",
      "Instrucciones del juego",
      "🎁 Guía digital de 20 juegos para fiestas"
    ]
  }
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = id ? productsData[id] : null;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display mb-4">Producto no encontrado</h1>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'ViewContent', {
        content_name: product.name,
        content_category: 'Juegos de Mesa',
        value: product.price,
        currency: 'USD',
      });
    }
  }, [product.name, product.price]);

  const handleBuy = () => {
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: product.name,
        content_category: 'Juegos de Mesa',
        value: product.price,
        currency: 'USD',
      });
    }
    const message = encodeURIComponent(`Hola! Quiero comprar ${product.name} - $${product.price}`);
    window.open(`https://wa.me/593987654321?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{product.name} | ShotyGames Ecuador</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.name} | ShotyGames Ecuador`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:url" content={`https://shoty-fiesta-web-main.vercel.app/producto/${product.id}`} />
      </Helmet>
      {/* Header */}
      <header className="bg-secondary py-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-white hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      {/* Product Detail */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Image */}
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full rounded-2xl shadow-glow"
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl md:text-5xl mb-4">
                  {product.name}
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  {product.description}
                </p>
                <p className="text-lg leading-relaxed">
                  {product.longDescription}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 py-4 border-y border-border">
                <span className="text-5xl font-display font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground">USD</span>
              </div>

              {/* Features */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-display text-xl mb-4">Características:</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Includes */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-display text-xl mb-4">Incluye:</h3>
                  <ul className="space-y-2">
                    {product.includes.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* CTA */}
              <Button 
                variant="hero" 
                size="lg"
                className="w-full text-lg py-6"
                onClick={handleBuy}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Comprar por WhatsApp
              </Button>

              {/* Info adicional */}
              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>🚚 Envíos a todo Ecuador</p>
                <p>📦 Entrega en 2-4 días hábiles</p>
                <p>🔞 Producto para mayores de 18 años</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetail;
