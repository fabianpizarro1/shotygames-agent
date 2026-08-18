import { useEffect, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

// Índice de la slide visible de un <Carousel> de shadcn/embla.
// Se usa junto al prop `setApi` del propio Carousel, para que
// CarouselImage sepa qué imágenes vale la pena descargar.
export const useSlideActual = (api: CarouselApi | undefined) => {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActual(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return actual;
};
