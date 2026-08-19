import { useEffect, useRef, useState } from "react";

// Video que no descarga el archivo hasta que el usuario se acerca a él.
//
// Por qué existe: `preload="none"` no evita nada si el <video> tiene autoPlay.
// Chrome se baja el archivo igual apenas carga la página, esté donde esté.
// Medido en el build de producción: la landing de Torre Parejas descargaba los
// 855 KB del unboxing sin que nadie hubiera scrolleado — casi la mitad del peso
// de la página, por un video que está muy por debajo del fold.
//
// ── Lo único que hace este componente es retrasar el `src` ───────────────────
// El <video> está SIEMPRE en el DOM, con su poster y sus atributos normales.
// Sin `src` no descarga nada y muestra el póster; cuando se le pone el `src`,
// la reproducción la arranca el navegador solo, por `autoPlay`, exactamente
// igual que un <video> común. No hay intercambio de elementos ni control
// manual de la reproducción.
//
// Esto es a propósito: la primera versión SÍ intercambiaba <img> por <video> y
// quedó rota en producción (se veía como foto fija y nunca arrancaba). Dos
// lecciones que conviene no repetir:
//
//   1. El observer estaba sobre un wrapper con `display: contents`, que no
//      genera caja: su rect es 0x0 y nunca dispara.
//   2. Ni IntersectionObserver ni requestAnimationFrame corren en páginas no
//      visibles, así que en un navegador headless/oculto es imposible
//      distinguir "no descarga el video" (bien) de "está roto" (mal). Por eso
//      el disparador es una lectura de getBoundingClientRect() en el scroll:
//      es determinista y verificable en cualquier entorno.

type Props = {
  src: string;
  poster: string;
  className?: string;
  /** Cuántos px antes de entrar en pantalla empieza a cargar. */
  margen?: number;
} & Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "src" | "poster">;

export const LazyVideo = ({ src, poster, className, margen = 300, ...rest }: Props) => {
  const [cargar, setCargar] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (cargar) return;

    const revisar = () => {
      const el = video.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + margen && r.bottom > -margen) setCargar(true);
    };

    // Sin throttle por requestAnimationFrame a propósito (ver nota de arriba).
    // Es una lectura de rect por evento, con el listener en passive y
    // desenganchándose apenas el video carga: dura unos segundos.
    revisar(); // por si ya está en pantalla al montar
    window.addEventListener("scroll", revisar, { passive: true });
    window.addEventListener("resize", revisar, { passive: true });
    return () => {
      window.removeEventListener("scroll", revisar);
      window.removeEventListener("resize", revisar);
    };
  }, [cargar, margen]);

  return (
    <video
      ref={video}
      // Sin src no se descarga nada y se ve el póster.
      {...(cargar ? { src } : {})}
      poster={poster}
      className={className}
      preload="none"
      {...rest}
    />
  );
};
