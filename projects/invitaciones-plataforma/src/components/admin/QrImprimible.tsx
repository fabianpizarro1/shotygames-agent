'use client';

import QRCode from 'qrcode';
import { useEffect, useState, type CSSProperties } from 'react';
import { BolaDisco, Brillo, Globo, Humo, Sticker } from '../Decor';

interface Props {
  eventoId: string;
  slug: string;
  urlBase: string;
  titulo: string;
  evento: string;
  colores: { fondo: string; fondo2: string; papel: string; texto: string; acento: string };
}

// Tarjeta lista para imprimir (o para mandar como imagen): QR grande que lleva a /fotos.
export function QrImprimible({ eventoId, slug, urlBase, titulo, evento, colores }: Props) {
  const [url, setUrl] = useState('');
  const [png, setPng] = useState('');

  useEffect(() => {
    const u = `${(urlBase || window.location.origin).replace(/\/$/, '')}/fotos?e=${slug}`;
    setUrl(u);
    // Oscuro sobre blanco: el contraste es lo que hace que el QR escanee bien con poca luz.
    QRCode.toDataURL(u, { width: 900, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } }).then(setPng);
  }, [urlBase, slug]);

  const tema = { '--fondo': colores.fondo, '--fondo2': colores.fondo2, '--papel': colores.papel, '--texto': colores.texto, '--acento': colores.acento } as CSSProperties;

  return (
    <div className="min-h-dvh bg-stone-100 p-4 text-stone-900 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-md items-center justify-between gap-3 print:hidden">
        <a href={`/app/${eventoId}`} className="text-sm underline underline-offset-4">← Volver al panel</a>
        <div className="flex gap-2">
          {png && (
            <a href={png} download="qr-fotos.png" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium">Descargar PNG</a>
          )}
          <button onClick={() => window.print()} className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white">Imprimir</button>
        </div>
      </div>

      <div style={{ ...tema, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} className="rayas relative mx-auto flex min-h-[640px] w-full max-w-md flex-col items-center justify-center gap-5 overflow-hidden px-8 py-20 text-center shadow-sm ring-1 ring-black/20">
        <Humo />
        <Humo lado="abajo" />
        <Globo ancho={46} className="left-2 top-4" />
        <BolaDisco tam={120} className="-right-8 top-0" />
        <Sticker nombre="labios" tono="negro" ancho={38} rot={-12} className="bottom-6 left-6" />
        <Sticker nombre="martini" tono="plata" ancho={44} rot={8} className="bottom-6 right-6" />
        <Brillo tam={18} className="text-black" style={{ left: '14%', top: '38%' }} />
        <p className="f-cond relative z-[2] text-xs tracking-[0.3em] opacity-70">{evento}</p>
        <h1 className="f-script relative z-[2] max-w-[15rem] text-5xl leading-[0.95]">{titulo}</h1>
        <div className="papel relative z-[2] rounded-sm p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {png ? <img src={png} alt={`Código QR que lleva a ${url}`} className="size-56" /> : <div className="size-56" />}
        </div>
        <p className="f-cond relative z-[2] max-w-[16rem] text-sm font-medium leading-snug">Escanea con la cámara de tu celular y sube tus fotos de la fiesta</p>
      </div>

      <p className="mx-auto mt-4 max-w-md break-all text-center text-xs text-stone-500 print:hidden">{url}</p>
    </div>
  );
}
