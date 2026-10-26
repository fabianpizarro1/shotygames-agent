# Reproductor de video propio para la landing (descartado el 2026-10-26)

Fabián pidió que los TikToks de la v2 de La Previa se vieran "solo el video" (sin me gusta ni
comentarios), con play/pausa y sin frenar la landing. El reproductor embebido de TikTok no lo permite:
aunque se apaguen todos sus parámetros (controls, description, music_info, ...) siempre pinta el nombre
de la cuenta y los botones de me gusta/comentarios/compartir. Se construyó y probó un reproductor propio
y después Fabián decidió dejar el de TikTok ("mejor dejarlo así"). Nada de esto llegó a producción.

- `VideoCarrusel.tsx` — tira de tarjetas con `<video preload="none">` sin `src` hasta el primer toque
  (cero red al cargar), portada lazy, play/pausa con un toque, uno a la vez, pausa al salir de pantalla.
- `videoActivo.ts` — el video activo (para pausar al abrir el checkout o al ocultar la pestaña).
- `optimizar-video.mjs` — ffmpeg → 540x960, H.264 main, CRF 28, faststart, AAC mono 48k (`--sin-audio`).
  Necesita ffmpeg (en esta Mac: `/Users/user/bin/ffmpeg`, pasar `FFMPEG=...`).

Verificado: 0 requests de .mp4 al cargar; al tocar baja solo ese archivo (~1 MB); pausa y reanuda;
al tocar otro se pausa el anterior; un archivo roto saca la tarjeta. Faltaban los 4 archivos originales
(no estaban en la Mac ni en Drive). Los metadatos de TikTok decían: 7629538696882146567 (0,72 MB),
7628628724530941192 (1,06 MB), 7628410923962682632 (2,64 MB; usa la canción "TAKA LA DENTRO" de terceros:
alojarlo sin audio) y 7565926233649810706 (1,17 MB); los otros 3 con "sonido original" propio.
Para retomarlo: copiar los 3 archivos a src/, pasar los originales por el script y sustituir
`TikTokCarrusel` por `VideoCarrusel` en TorreNormalV2Landing.tsx.
