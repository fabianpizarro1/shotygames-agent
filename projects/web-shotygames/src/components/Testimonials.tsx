import { Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";
import testimonial4 from "@/assets/testimonial-4.jpg";
import testimonial5 from "@/assets/testimonial-5.jpg";
import testimonial6 from "@/assets/testimonial-6.jpg";
const testimonialImages = [{
  image: testimonial1,
  alt: "Testimonio real de cliente - Entrega confirmada del producto"
}, {
  image: testimonial2,
  alt: "Cliente satisfecho con Torre de Shots Parejas"
}, {
  image: testimonial3,
  alt: "Testimonio positivo - Producto recibido con agradecimiento"
}, {
  image: testimonial4,
  alt: "Confirmación de entrega - Cliente agradecido"
}, {
  image: testimonial5,
  alt: "Cliente feliz con la entrega de su pedido"
}, {
  image: testimonial6,
  alt: "Testimonio destacado - Profesionalismo y puntualidad 10/10"
}];
const Testimonials = () => {
  return <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-8 h-8 fill-primary text-primary" />)}
          </div>
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            +3,500 Clientes <span className="text-gradient">Felices</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-2">Lee lo que dicen nuestros clientes</p>
          <p className="text-lg text-muted-foreground/80 italic">👉 Desliza para ver más reseñas 👈</p>
        </div>

        <div className="relative">
          <Carousel opts={{
          align: "start",
          loop: true
        }} className="w-full max-w-5xl mx-auto">
            <CarouselContent className="-ml-2 sm:-ml-4">
              {testimonialImages.map((testimonial, index) => <CarouselItem key={index} className="pl-2 sm:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <img src={testimonial.image} alt={testimonial.alt} className="w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-smooth" loading="lazy" />
                  </div>
                </CarouselItem>)}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-6">
              <CarouselPrevious className="static translate-y-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl" />
              <CarouselNext className="static translate-y-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl" />
            </div>
          </Carousel>
        </div>

        {/* Trust Stats */}
        
      </div>
    </section>;
};
export default Testimonials;