// Un solo video de la landing suena a la vez, y todos se callan al ocultar la pestaña o al
// abrir el checkout (lo llama la página). Lo usa VideoCarrusel.
let activo: HTMLVideoElement | null = null;

export const iniciarVideo = (v: HTMLVideoElement) => {
  if (activo && activo !== v) activo.pause();
  activo = v;
};

export const terminarVideo = (v: HTMLVideoElement) => {
  if (activo === v) activo = null;
};

/** Pausa el video que esté sonando. */
export const pausarVideos = () => {
  activo?.pause();
};

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pausarVideos();
  });
}
