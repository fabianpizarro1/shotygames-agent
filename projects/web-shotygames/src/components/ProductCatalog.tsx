import ProductCard from "./ProductCard";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";
import torreNormal from "@/assets/torre-normal-brillo.webp";
import torrePicante from "@/assets/torre-picante-1.webp";
import torreParejas from "@/assets/torre-parejas-1.webp";
import enganchados from "@/assets/enganchados-brillo.webp";
import cartasPartyshots from "@/assets/cartas-partyshots.jpg";
import emparejadosPortada from "@/assets/emparejados-portada.jpg";
import dadosDigitalesPrincipal from "@/assets/dados-digitales-principal.webp";
import dadosDelPlacer from "@/assets/dados-del-placer.webp";

const physicalProducts = [{
  id: "torre-normal",
  name: "Torre La Previa",
  description: "El clásico que prendió todas las fiestas. 51 bloques con retos, preguntas y penitencias en español.",
  price: 28,
  image: torreNormal,
  badge: "MÁS VENDIDO",
  includes: [
    "51 bloques con retos",
    "1 vaso tequilero",
    "Instrucciones del juego",
    "🚚 Envío incluido",
    "🎁 Guía digital de 20 juegos para fiestas",
  ]
}, {
  id: "torre-picante",
  name: "Torre de Shots Picante",
  description: "La versión más atrevida con retos picantes y calientes 🔥",
  price: 28,
  image: torrePicante,
  badge: "PICANTE 🌶️",
  includes: [
    "51 bloques con retos picantes",
    "1 vaso tequilero",
    "Instrucciones del juego",
    "🚚 Envío incluido",
    "🎁 Guía digital de 20 juegos para fiestas",
  ]
}, {
  id: "torre-parejas",
  name: "Torre de Shots Parejas",
  description: "Diseñada para parejas que quieren salir de la rutina y encender la noche ❤️",
  price: 28,
  image: torreParejas,
  badge: "PAREJAS ❤️",
  includes: [
    "51 bloques con retos para parejas",
    "1 vaso tequilero",
    "Instrucciones del juego",
    "🚚 Envío incluido",
    "🎁 Guía digital de 30 posiciones sexuales",
  ]
}, {
  id: "enganchados",
  name: "Enganchados",
  description: "Pon a prueba tu puntería, concentración y velocidad mientras compites con tus amigos",
  price: 33,
  image: enganchados,
  includes: [
    "Juego de madera completo",
    "Tabla de shots",
    "1 vaso tequilero",
    "1 dado",
    "Instrucciones del juego",
    "🚚 Envío incluido",
    "🎁 Guía digital de 20 juegos para fiestas",
  ]
}];

const digitalProducts = [{
  id: "emparejados",
  name: "Emparejados",
  description: "Juego digital de cartas para parejas. Conecta, desafía y diviértete con tu pareja.",
  price: 6.90,
  originalPrice: 15.00,
  image: emparejadosPortada,
  badge: "DIGITAL 📱",
  includes: [
    "Acceso inmediato al juego",
    "72 cartas digitales",
    "PDF imprimible de las 72 cartas",
    "Juega desde cualquier dispositivo"
  ]
}, {
  id: "dados-digitales",
  name: "Dados Digitales de Posiciones",
  description: "Juego digital de dados para parejas. Transforma tu noche en algo especial.",
  price: 6.90,
  originalPrice: 14.90,
  image: dadosDigitalesPrincipal,
  badge: "NUEVO 🎲",
  includes: [
    "Acceso inmediato al juego",
    "Dados de Acciones (BONUS)",
    "Guía PDF de 30 Posiciones (REGALO HOY)",
    "Juega desde cualquier dispositivo"
  ]
}];
const ProductCatalog = () => {
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ 
    name: string; 
    price: number; 
    image: string; 
    id: string;
    upsells: Array<{
      id: 'torreNormal' | 'torrePicante' | 'torreParejas' | 'enganchados' | 'emparejados' | 'dadosPlacer';
      name: string;
      price: number;
      image: string;
    }>;
  } | null>(null);
  
  const getUpsellsForProduct = (productId: string) => {
    // Mapear el ID del producto a formato camelCase
    const productIdMap: Record<string, string> = {
      'torre-normal': 'torreNormal',
      'torre-picante': 'torrePicante',
      'torre-parejas': 'torreParejas',
      'enganchados': 'enganchados',
      'emparejados': 'emparejados'
    };
    
    const mappedId = productIdMap[productId] || productId;
    
    const allProducts = [
      { id: 'torreNormal', name: 'Torre La Previa (para grupos)', price: 10, image: torreNormal },
      { id: 'torrePicante', name: 'Torre Picante (para grupos)', price: 10, image: torrePicante },
      { id: 'torreParejas', name: 'Torre Parejas', price: 10, image: torreParejas },
      { id: 'dadosPlacer', name: 'Dados del Placer', price: 5, image: dadosDelPlacer },
      { id: 'emparejados', name: 'Emparejados (Juego Digital)', price: 2.90, image: emparejadosPortada }
    ];
    
    // Filtrar el producto principal y retornar los otros
    return allProducts.filter(p => p.id !== mappedId) as Array<{
      id: 'torreNormal' | 'torrePicante' | 'torreParejas' | 'enganchados' | 'emparejados' | 'dadosPlacer';
      name: string;
      price: number;
      image: string;
    }>;
  };
  
  const handleBuy = (productName: string, productPrice: number, productImage: string, productId: string) => {
    // Meta Pixel - InitiateCheckout event
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'InitiateCheckout');
    }
    const upsells = getUpsellsForProduct(productId);
    setSelectedProduct({ 
      name: productName, 
      price: productPrice, 
      image: productImage, 
      id: productId,
      upsells
    });
    setCheckoutOpen(true);
  };

  const handleViewMore = (productId: string) => {
    const landingRoutes: { [key: string]: string } = {
      "torre-normal": "/landing/torre-normal",
      "torre-picante": "/landing/torre-picante",
      "torre-parejas": "/landing/torre-parejas",
      "enganchados": "/landing/enganchados",
      "cartas-partyshots": "/landing/partyshots",
      "emparejados": "/landing/emparejados-imprimible",
      "dados-digitales": "/landing/dados-digitales"
    };
    navigate(landingRoutes[productId] || `/producto/${productId}`);
  };

  return (
    <section id="productos" data-section="products" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Productos Físicos */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Juegos <span className="text-gradient">Físicos</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Elige el juego perfecto para tu próxima fiesta. Todos incluyen regalos digitales
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {physicalProducts.map(product => (
              <ProductCard 
                key={product.id} 
                {...product} 
                onBuy={() => handleBuy(product.name, product.price, product.image, product.id)}
                onViewMore={() => handleViewMore(product.id)}
              />
            ))}
          </div>
        </div>

        {/* Productos Digitales */}
        <div id="productos-digitales">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              Juegos <span className="text-gradient">Digitales</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Acceso inmediato, juega desde cualquier dispositivo
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {digitalProducts.map(product => (
              <ProductCard 
                key={product.id} 
                {...product} 
                onBuy={() => handleBuy(product.name, product.price, product.image, product.id)}
                onViewMore={() => handleViewMore(product.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <CheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          productName={selectedProduct.name}
          productPrice={selectedProduct.price}
          productImage={selectedProduct.image}
          productId={
            selectedProduct.id === 'torre-normal' ? 'torreNormal' :
            selectedProduct.id === 'torre-picante' ? 'torrePicante' :
            selectedProduct.id === 'torre-parejas' ? 'torreParejas' :
            selectedProduct.id === 'enganchados' ? 'enganchados' :
            selectedProduct.id === 'emparejados' ? 'emparejados' :
            selectedProduct.id === 'dados-digitales' ? 'dadosDigitales' :
            'partyshots'
          }
          upsells={selectedProduct.upsells}
        />
      )}
    </section>
  );
};
export default ProductCatalog;