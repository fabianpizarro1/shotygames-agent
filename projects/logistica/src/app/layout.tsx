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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0d0c' },
  ],
};

// Bloqueante a propósito, antes de cualquier otra cosa: lee la preferencia
// guardada por InterruptorTema.tsx y la aplica a <html> antes del primer
// pintado. Sin esto, la página pintaría claro (el default) y saltaría a
// oscuro un instante después para quien lo eligió — el flash típico de los
// selectores de tema que corren en un useEffect normal.
const SCRIPT_TEMA = `
try {
  var t = localStorage.getItem('tema');
  if (t === 'oscuro') document.documentElement.dataset.theme = 'oscuro';
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: el script de abajo cambia `data-theme` antes de
  // que React hidrate, así que el HTML del servidor y el del cliente
  // difieren en ese atributo a propósito — no es un bug para avisar.
  return (
    <html lang="es-EC" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
