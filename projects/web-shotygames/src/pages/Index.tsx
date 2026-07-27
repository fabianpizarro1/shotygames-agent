import Hero from "@/components/Hero";
import ProductCatalog from "@/components/ProductCatalog";
import Testimonials from "@/components/Testimonials";
import HowToBuy from "@/components/HowToBuy";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <PromoBanner />
      <ProductCatalog />
      <Testimonials />
      <HowToBuy />
      <Footer />
    </div>
  );
};

export default Index;
