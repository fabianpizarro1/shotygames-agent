import { useEffect, useRef, useState } from "react";

// Video que no existe en el DOM hasta que está por entrar en pantalla.
//
// Por qué no alcanza con preload="none": si el <video> tiene autoPlay, Chrome
// se baja el archivo igual apenas carga la página, esté donde esté. Medido en
// el build de producción: la landing de Torre Parejas descargaba los 855 KB
// del unboxing sin que nadie hubiera scrolleado — casi la mitad del peso total
// de la página, por un video que está muy abajo.
//
// Mientras tanto se muestra el póster con las mismas medidas, así que el
// bloque ocupa su lugar desde el principio y nada salta cuando aparece.

type Props = {
  src: string;
  poster: string;
  className?: string;
  /** Margen para empezar a cargar ANTES de que se vea. */
  rootMargin?: string;
} & Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src" | "poster">;

export const LazyVideo = ({ src, poster, className, rootMargin = "300px", ...rest }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className="contents">
      {visible ? (
        <video src={src} poster={poster} className={className} preload="none" {...rest} />
      ) : (
        <img src={poster} alt="" aria-hidden className={className} />
      )}
    </div>
  );
};
