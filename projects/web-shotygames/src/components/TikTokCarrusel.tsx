import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

// Tira horizontal de videos de TikTok.
//
// Cada tarjeta arranca como una portada nuestra (webp en src/assets/tiktok,
// bajada con scripts/tiktok-portadas.mjs) y recién al tocarla se monta el
// reproductor oficial de TikTok. Un iframe de TikTok pesa ~1-2 MB entre JS y
// video: con 6 videos montados de entrada la landing cargaba como 10 MB antes
// de que el cliente viera nada. Así la carga inicial son solo las portadas.
//
// Se reproduce uno a la vez: tocar otro desmonta el anterior, que además
// corta su audio.

export type VideoTikTok = {
  /** El número largo de la URL: tiktok.com/@usuario/video/<id> */
  id: string;
  portada: string;
  alt: string;
  /** "@usuario", se muestra abajo a la izquierda de la portada. */
  autor?: string;
};

type Props = {
  videos: VideoTikTok[];
  /** Color del botón de play, para que combine con la landing. */
  acento?: string;
};

// Reproductor v1: https://developers.tiktok.com/doc/embed-player
// Sin música, descripción, relacionados ni menú: solo el video.
const urlPlayer = (id: string) =>
  `https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=1&rel=0&music_info=0&description=0&native_context_menu=0&closed_caption=0`;

export const TikTokCarrusel = ({ videos, acento = "#ff3d00" }: Props) => {
  const [activo, setActivo] = useState<string | null>(null);
  const tiraRef = useRef<HTMLDivElement>(null);

  // En móvil se desliza con el dedo; las flechas son para escritorio, donde
  // con mouse no hay forma obvia de scrollear de costado.
  const mover = (dir: 1 | -1) => {
    const tira = tiraRef.current;
    if (tira) tira.scrollBy({ left: dir * tira.clientWidth * 0.8, behavior: "smooth" });
  };

  if (videos.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={tiraRef}
        className="-mx-4 px-4 flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((v) => (
          <div
            key={v.id}
            className="snap-center shrink-0 w-[62%] sm:w-[38%] md:w-[calc(25%-12px)] aspect-[9/16] relative rounded-2xl overflow-hidden bg-black shadow-lg"
          >
            {activo === v.id ? (
              <iframe
                src={urlPlayer(v.id)}
                title={v.alt}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setActivo(v.id)}
                className="group absolute inset-0 w-full h-full text-left"
                aria-label={`Reproducir: ${v.alt}`}
              >
                <img
                  src={v.portada}
                  alt={v.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/20" aria-hidden />
                <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white" aria-hidden>
                  TikTok
                </span>
                <span
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform group-hover:scale-110"
                  aria-hidden
                >
                  <Play className="ml-0.5 h-6 w-6" style={{ color: acento }} fill="currentColor" />
                </span>
                {v.autor && (
                  <span className="absolute bottom-3 left-3 right-3 truncate text-xs md:text-sm font-semibold text-white drop-shadow">
                    {v.autor}
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {videos.length > 4 && (
        <>
          <button
            type="button"
            onClick={() => mover(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg border"
            aria-label="Videos anteriores"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg border"
            aria-label="Más videos"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};
