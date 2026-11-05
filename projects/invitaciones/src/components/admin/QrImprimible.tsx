'use client';

import QRCode from 'qrcode';
import { useEffect, useState, type CSSProperties } from 'react';

interface Props {
  urlBase: string;
  titulo: string;
  evento: string;
  colores: { fondo: string; fondo2: string; papel: string; texto: string; acento: string };
}

// Tarjeta lista para imprimir (o para mandar como imagen): QR grande que lleva a /fotos.
export function QrImprimible({ urlBase, titulo, evento, colores }: Props) {
  const [url, setUrl] = useState('');
  const [png, setPng] = useState('');

  useEffect(() => {
    const u = `${(urlBase || window.location.origin).replace(/\/$/, '')}/fotos`;
    setUrl(u);
    // Oscuro sobre blanco: el contraste es lo que hace que el QR escanee bien con poca luz.
    QRCode.toDataURL(u, { width: 900, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#3a0712', light: '#ffffff' } }).then(setPng);
  }, [urlBase]);

  const tema = { '--fondo': colores.fondo, '--fondo2': colores.fondo2, '--papel': colores.papel, '--texto': colores.texto, '--acento': colores.acento } as CSSProperties;

  return (
    <div className="min-h-dvh bg-stone-100 p-4 text-stone-900 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-md items-center justify-between gap-3 print:hidden">
        <a href="/admin" className="text-sm underline underline-offset-4">← Volver al panel</a>
        <div className="flex gap-2">
          {png && (
            <a href={png} download="qr-fotos.png" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium">Descargar PNG</a>
          )}
          <button onClick={() => window.print()} className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white">Imprimir</button>
        </div>
      </div>

      <div style={{ ...tema, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} className="rayas mx-auto flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center gap-5 p-8 text-center">
        <p className="f-serif text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--papel)', opacity: 0.85 }}>{evento}</p>
        <h1 className="f-script text-6xl leading-none" style={{ color: 'var(--papel)' }}>{titulo}</h1>
        <div className="papel rounded-sm p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {png ? <img src={png} alt={`Código QR que lleva a ${url}`} className="size-56" /> : <div className="size-56" />}
        </div>
        <p className="f-serif max-w-[16rem] text-sm" style={{ color: 'var(--papel)' }}>Escanea con la cámara de tu celular y sube tus fotos de la fiesta</p>
      </div>

      <p className="mx-auto mt-4 max-w-md break-all text-center text-xs text-stone-500 print:hidden">{url}</p>
    </div>
  );
}
