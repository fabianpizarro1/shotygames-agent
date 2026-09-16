import Seo from "@/components/Seo";
import Hero from "@/components/Hero";
import ProductCatalog from "@/components/ProductCatalog";
import Combos from "@/components/Combos";
import Testimonials from "@/components/Testimonials";
import HowToBuy from "@/components/HowToBuy";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

/**
 * Orden decidido con Fabián el 2026-09-15:
 * hero → promo de la semana → juegos físicos → juegos digitales → combos.
 *
 * El <Seo> hace falta aunque index.html ya traiga las meta tags de la home:
 * al navegar de vuelta desde una landing (client-side, sin recarga), el título
 * y el og:url se quedaban con los de la landing anterior.
 */
const Index = () => {
  return (
    <div className="min-h-screen">
      <Seo
        title="ShotyGames - Los juegos que prenden la fiesta | Envíos a todo Ecuador"
        description="Torres de Shots, Enganchados y combos con descuento. Juegos de mesa para beber. Pagas al recibir, envío gratis a todo Ecuador. Más de 3.500 clientes."
        canonical="https://www.shotygames.com/"
        image="https://www.shotygames.com/og-image.jpg"
      />
      <Hero />
      <PromoBanner />
      <ProductCatalog />
      <Combos />
      <Testimonials />
      <HowToBuy />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
