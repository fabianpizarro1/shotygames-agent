import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Logística · Truquito, Avanora y ShotyGames',
  description: 'Los pedidos que están en la calle, en un solo lugar.',
  // Guardada en la pantalla de inicio del iPhone se abre como app: sin barra de
  // Safari y con el contenido debajo de la hora y la batería.
  appleWebApp: {
    capable: true,
    title: 'Logística',
    statusBarStyle: 'black-translucent',
  },
  // Los links de guías y rastreo apuntan a otros sitios; no hay nada que
  // indexar acá y la app pide contraseña igual.
  robots: { index: false, follow: false },
  other: {
    // Next ya no emite este meta porque está deprecado, pero es el único que
    // entienden las versiones de iOS anteriores a la 16.4 — sin él la app
    // guardada abre dentro de Safari, con la barra de direcciones y todo.
    'apple-mobile-web-app-capable': 'yes',
  },
};

// En Next.js 16 el viewport va separado del metadata.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Sin zoom: en una app instalada, el doble toque que agranda la pantalla y
  // la deja torcida es lo que más delata que no es nativa.
  maximumScale: 1,
  userScalable: false,
  // `cover` deja el fondo llegando hasta el notch y la barra de gestos; el
  // contenido se separa con env(safe-area-inset-*) en globals.css.
  viewportFit: 'cover',
  themeColor: '#0a0d0c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-EC">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
