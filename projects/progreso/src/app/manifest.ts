import type { MetadataRoute } from 'next';

/**
 * Manifest de la PWA. Se guarda en la pantalla de inicio del iPhone y tiene
 * que abrirse como app: sin barra de Safari, sin zoom y en vertical.
 * El icono de iOS sale de `src/app/apple-icon.png`, no de acá.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Progreso · Fabián',
    short_name: 'Progreso',
    description: 'Rutina, tareas y proyectos — un solo lugar, un solo progreso.',
    lang: 'es-EC',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f0b1a',
    theme_color: '#0f0b1a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
