import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Progreso',
  description: 'Sistema operativo personal: qué hacer hoy y hacerlo.',
  appleWebApp: {
    capable: true,
    title: 'Progreso',
    statusBarStyle: 'black-translucent',
  },
  robots: { index: false, follow: false },
  other: {
    // Next ya no emite este meta (deprecado), pero es el único que entienden
    // las versiones de iOS anteriores a 16.4 — sin él la app instalada abre
    // dentro de Safari, con barra de direcciones y todo.
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0b1a' },
  ],
};

// Bloqueante a propósito, antes de cualquier pintado: aplica el tema guardado
// para que no haya flash del tema equivocado al cargar. Oscuro es el default
// ("modo juego" — XP, niveles y rachas se leen mejor ahí) salvo que se haya
// elegido claro explícitamente con el interruptor.
const SCRIPT_TEMA = `
try {
  var t = localStorage.getItem('tema');
  if (t !== 'claro') document.documentElement.dataset.theme = 'oscuro';
} catch (e) {
  document.documentElement.dataset.theme = 'oscuro';
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-EC" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
