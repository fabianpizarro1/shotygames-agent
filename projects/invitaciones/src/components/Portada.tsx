'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { BolaDisco, Brillo, Globo, Humo, Sticker } from './Decor';

// Portada: una bola disco cuelga y se balancea. Al tocar "Abrir" salta una ráfaga de destellos
// y la portada se desvanece hacia la invitación (~1,1 s). Solo transform y opacity.

interface Props {
  nombre: string;
  numero: string;
  onAbrir: () => void;
  onListo: () => void;
}

export function Portada({ nombre, numero, onAbrir, onListo }: Props) {
  const [abierta, setAbierta] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function abrir() {
    if (abierta) return;
    setAbierta(true);
    onAbrir();
    timer.current = window.setTimeout(onListo, 1100);
  }

  return (
    <motion.div className="rayas fixed inset-0 z-50 overflow-hidden" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
      <Humo />
      <Humo lado="abajo" />
      <div className="relative mx-auto h-full w-full max-w-[430px]">
        <div className="columpio absolute left-1/2 top-0 z-[1] -ml-[80px]" style={{ width: 160 }}>
          <BolaDisco tam={160} cuerda={64} style={{ position: 'relative' }} />
        </div>

        <Globo ancho={58} className="bottom-24 left-3" />
        <Globo ancho={48} className="bottom-16 left-16" retraso={1.4} />
        <Globo ancho={54} className="bottom-20 right-4" retraso={0.7} />
        <Sticker nombre="martini" tono="plata" ancho={52} rot={10} className="right-6 top-[44%]" anim="flota" retraso={0.4} />
        <Sticker nombre="labios" tono="negro" ancho={46} rot={-14} className="left-5 top-[40%]" />
        <Brillo tam={22} className="text-black" style={{ left: '22%', top: '33%' }} />
        <Brillo tam={16} className="text-black/70" style={{ right: '24%', top: '60%' }} retraso={1} />

        <div className="absolute inset-x-0 top-[34%] z-[2] flex flex-col items-center px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: abierta ? 0 : 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }} className="flex flex-col items-center">
            <span className="f-cond text-xs tracking-[0.35em] opacity-70">Para</span>
            <span className="f-firma mt-1 text-[3.6rem] leading-none">{nombre}</span>
            <span className="mt-6 flex items-end gap-1.5">
              <span className="f-serif pb-3 text-3xl font-black">RIP</span>
              <span className="globo-num text-[5.4rem]" data-t={numero}>{numero}</span>
            </span>
          </motion.div>
          <motion.button
            type="button"
            onClick={abrir}
            aria-label="Abrir invitación"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: abierta ? 0 : 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.45 }}
            className="boton f-cond relative mt-8 rounded-full bg-black px-9 py-4 text-sm font-bold tracking-[0.3em] text-white shadow-[0_14px_24px_-10px_rgb(0_0_0/0.6)]"
          >
            Abrir invitación
          </motion.button>
        </div>

        {abierta &&
          Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r = 110 + (i % 3) * 45;
            return (
              <motion.span
                key={i}
                className="pointer-events-none absolute left-1/2 top-[56%] z-[3] text-black"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0, scale: 1.3 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                <svg viewBox="0 0 24 24" width={14 + (i % 4) * 5} height={14 + (i % 4) * 5}><path fill="currentColor" d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" /></svg>
              </motion.span>
            );
          })}
      </div>
    </motion.div>
  );
}
