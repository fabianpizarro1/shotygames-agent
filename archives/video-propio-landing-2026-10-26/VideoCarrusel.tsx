import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { iniciarVideo, terminarVideo } from "@/lib/videoActivo";

// Tira de videos alojados en nuestra propia web: solo el video, play y pausa con un toque.
//
// Por qué no el reproductor de TikTok (TikTokCarrusel): aunque se apaguen todos sus
// parámetros (controls=0, description=0, music_info=0, ...) sigue pintando encima el
// nombre de la cuenta y los botones de me gusta, comentarios y compartir (probado
// 2026-10-26), y trae 1-2 MB de JS de terceros cuando el cliente lo toca.
//
// Costo en la carga de la landing ≈ 0:
// - El <video> no tiene `src` hasta el primer toque: ni metadata ni un byte del archivo.
// - Hasta entonces se ve la portada (webp chico, lazy, de baja prioridad).
// - Suena un solo video a la vez, y se pausa solo al salir de pantalla, al ocultar la
//   pestaña o al abrir el checkout (`pausarVideos()` de src/lib/videoActivo.ts), para no
//   dejar audio detrás del modal.
//
// Los archivos salen de `node scripts/optimizar-video.mjs` (540x960, H.264, faststart).

export type VideoLigero = {
  id: string;
  /** mp4 alojado en la web (src/assets/videos/<nombre>.mp4). */
  src: string;
  /** Portada (webp): se ve hasta que arranca el video. */
  portada: string;
  alt: string;
};

// Afuera del componente de la página a propósito (ver CtaBoton en las landings): un
// componente definido adentro se desmonta y vuelve a montar en cada render.
const Tarjeta = ({ video }: { video: VideoLigero }) => {
  const tarjetaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [jugando, setJugando] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [fallo, setFallo] = useState(false);

  // No dejar sonando un video que ya no se ve.
  useEffect(() => {
    const el = tarjetaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) videoRef.current?.pause();
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const alternar = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!v.paused) {
      v.pause();
      return;
    }
    // Primer toque: recién acá se pide el archivo. El play() tiene que salir del mismo
    // gesto del usuario o iOS lo bloquea, por eso se pone el src a mano y no por estado.
    if (!v.getAttribute("src")) v.src = video.src;
    // Un play() cancelado por un pause() rápido (AbortError) o bloqueado por el navegador
    // (NotAllowedError) no es un archivo roto: solo NotSupportedError saca la tarjeta.
    v.play().catch((e: unknown) => {
      if ((e as { name?: string })?.name === "NotSupportedError") setFallo(true);
    });
  };

  // Si el archivo no existe o no se puede reproducir, la tarjeta se va: peor es un play muerto.
  if (fallo) return null;

  return (
    <div
      ref={tarjetaRef}
      className="snap-center shrink-0 w-[62%] sm:w-[38%] md:w-[calc(25%-12px)] aspect-[9/16] relative rounded-2xl overflow-hidden bg-black shadow-lg"
    >
      <video
        ref={videoRef}
        preload="none"
        playsInline
        loop
        className="absolute inset-0 h-full w-full object-cover"
        onPlay={(e) => {
          iniciarVideo(e.currentTarget);
          setJugando(true);
        }}
        onPlaying={() => setIniciado(true)}
        onPause={(e) => {
          terminarVideo(e.currentTarget);
          setJugando(false);
        }}
        onError={() => setFallo(true)}
      />
      {!iniciado && (
        <img
          src={video.portada}
          alt=""
          width={540}
          height={960}
          loading="lazy"
          decoding="async"
          {...{ fetchpriority: "low" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <button
        type="button"
        onClick={alternar}
        aria-label={`${jugando ? "Pausar" : "Reproducir"}: ${video.alt}`}
        className="group absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
      >
        {!jugando && (
          <span
            className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform duration-150 ease-out group-active:scale-95"
            aria-hidden
          >
            <Play className="h-6 w-6 translate-x-0.5 fill-black text-black" />
          </span>
        )}
      </button>
    </div>
  );
};

export const VideoCarrusel = ({ videos }: { videos: VideoLigero[] }) => {
  if (videos.length === 0) return null;
  return (
    <div
      // Con 4 o menos, en escritorio entran todos: se centran. En móvil no, porque
      // `justify-center` en una tira que desborda corta el primer video.
      className={`-mx-4 px-4 flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${videos.length <= 4 ? "md:justify-center" : ""}`}
    >
      {videos.map((v) => (
        <Tarjeta key={v.id} video={v} />
      ))}
    </div>
  );
};
