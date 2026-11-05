import type { Metadata, Viewport } from 'next';
import { DM_Sans, Pinyon_Script, Playfair_Display } from 'next/font/google';
import './globals.css';

const script = Pinyon_Script({ weight: '400', subsets: ['latin'], variable: '--f-script', display: 'swap' });
const serif = Playfair_Display({ subsets: ['latin'], variable: '--f-serif', display: 'swap' });
const sans = DM_Sans({ subsets: ['latin'], variable: '--f-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Invitación',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7a1226',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${script.variable} ${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
