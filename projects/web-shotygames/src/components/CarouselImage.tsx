import { useRef } from "react";

// Imagen de carrusel que solo se descarga cuando su slide está cerca.
//
// El problema que resuelve: `loading="lazy"` no sirve dentro de un carrusel.
// Embla pone todas las slides una al lado de la otra en la misma fila, así que
// para el navegador están todas "casi visibles" y se las baja de golpe. Medido
// en el build real de Torre Parejas: 20 imágenes / 1.2 MB en el primer segundo,
// cuando en pantalla solo se ve UNA.
//
// Acá el <img> ni siquiera existe hasta que su índice entra en la ventana de
// slides cercanas. Una vez cargada se deja montada, para que volver atrás no
// vuelva a pedir nada. El hueco lo ocupa el contenedor, que ya tiene aspecto
// fijo, así que no hay saltos de layout.

type Props = {
  src: string;
  alt: string;
  /** Índice de esta slide. */
  index: number;
  /** Slide visible ahora mismo. */
  current: number;
  /** Cuántas slides a cada lado se precargan. */
  ventana?: number;
  className?: string;
};

export const CarouselImage = ({ src, alt, index, current, ventana = 1, className }: Props) => {
  const cerca = Math.abs(index - current) <= ventana;
  // Una vez que estuvo cerca, se queda: el usuario ya la vio o la va a ver.
  const yaCargo = useRef(cerca);
  if (cerca) yaCargo.current = true;

  if (!yaCargo.current) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={index === 0 ? "eager" : "lazy"}
      fetchPriority={index === 0 ? "high" : "auto"}
      decoding={index === 0 ? "sync" : "async"}
    />
  );
};
