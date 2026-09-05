import type { MetadataRoute } from 'next';

/**
 * Manifest de la PWA. Fabián la guarda en la pantalla de inicio del iPhone y
 * tiene que abrirse como app: sin barra de Safari, sin zoom y en vertical.
 *
 * El icono de iOS NO sale de acá — lo toma de `src/app/apple-icon.png`. Estos
 * son para Android y para el escritorio.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Logística · Truquito, Avanora y ShotyGames',
    short_name: 'Logística',
    description: 'Los pedidos que están en la calle ahora mismo.',
    lang: 'es-EC',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0d0c',
    theme_color: '#0a0d0c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // "maskable" trae margen propio: Android recorta el icono con la forma
      // que tenga el launcher y sin ese margen se come el dibujo.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
