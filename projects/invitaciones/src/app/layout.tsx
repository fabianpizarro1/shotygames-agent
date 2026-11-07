import type { Metadata, Viewport } from 'next';
import { Bowlby_One, DM_Sans, Great_Vibes, Mrs_Saint_Delafield, Oswald, Playfair_Display, Sacramento } from 'next/font/google';
import './globals.css';

const sacramento = Sacramento({ weight: '400', subsets: ['latin'], variable: '--f-sacramento', display: 'swap' });
const delafield = Mrs_Saint_Delafield({ weight: '400', subsets: ['latin'], variable: '--f-delafield', display: 'swap' });
const vibes = Great_Vibes({ weight: '400', subsets: ['latin'], variable: '--f-elegante', display: 'swap' });
const bowlby = Bowlby_One({ weight: '400', subsets: ['latin'], variable: '--f-bowlby', display: 'swap' });
const oswald = Oswald({ weight: ['500', '700'], subsets: ['latin'], variable: '--f-oswald', display: 'swap' });
const serif = Playfair_Display({ weight: ['500', '700', '900'], subsets: ['latin'], variable: '--f-serif', display: 'swap' });
const sans = DM_Sans({ subsets: ['latin'], variable: '--f-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Invitación',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#e9e6e1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sacramento.variable} ${vibes.variable} ${delafield.variable} ${bowlby.variable} ${oswald.variable} ${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
