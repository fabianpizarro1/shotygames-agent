'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Brillo, Humo, Pegatina, Sticker } from './Decor';

// Portada tipo sobre: sobre plateado con sello de cera negro. Al tocar el sello: el sello salta,
// la solapa se abre, la tarjeta sube y todo se desvanece hacia la invitación (~1,4 s).
// Solo se animan transform y opacity.

interface Props {
  fondo?: string;
  humo?: boolean;
  nombre: string;
  inicial: string;
  numero: string;
  colorNumero?: string;
  onAbrir: () => void;
  onListo: () => void;
}

export function Sobre({ fondo = 'rayas', humo = true, nombre, inicial, numero, colorNumero, onAbrir, onListo }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [solapaAtras, setSolapaAtras] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function abrir() {
    if (abierto) return;
    setAbierto(true);
    onAbrir();
    timers.current.push(window.setTimeout(() => setSolapaAtras(true), 260));
    timers.current.push(window.setTimeout(onListo, 1350));
  }

  // Plata (--acento) en tres tonos para el cuerpo, el frente y la solapa del sobre.
  const cuerpo = 'color-mix(in srgb, var(--acento) 78%, #000)';
  const frente = 'color-mix(in srgb, var(--acento) 92%, #fff)';
  const solapa = 'color-mix(in srgb, var(--acento) 55%, #fff)';
  const V = 'polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)';

  return (
    <motion.div
      className={`${fondo} fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 overflow-hidden px-6 pb-44`}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {humo && <Humo />}
      {humo && <Humo lado="abajo" />}
      <Pegatina nombre="globos-rosa" ancho={150} rot={-6} className="bottom-4 -left-1" anim="flota" />
      <Pegatina nombre="globos-rosa" ancho={124} rot={8} espejo className="bottom-8 -right-1" anim="flota" retraso={0.9} />
      <Sticker nombre="martini" tono="plata" ancho={46} rot={10} className="right-5 top-[14%]" anim="flota" retraso={0.5} />
      <Brillo tam={20} className="text-black" style={{ left: '24%', top: '10%' }} />
      <Brillo tam={15} className="text-black/70" style={{ right: '22%', bottom: '30%' }} retraso={1} />

      <motion.p
        className="relative z-[2] text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: abierto ? 0 : 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span className="f-cond block text-[16.8px] tracking-[0.4em] opacity-70">Para</span>
        <span className="f-firma block text-[3.4rem] leading-tight">{nombre}</span>
      </motion.p>

      <motion.div
        className="relative z-[2] aspect-[10/7] w-[min(80vw,340px)]"
        style={{ perspective: 900 }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      >
        {/* fondo del sobre */}
        <div className="absolute inset-0 rounded-sm" style={{ background: cuerpo, boxShadow: '0 22px 40px -10px rgb(0 0 0 / 0.55)' }} />

        {/* tarjeta que sube */}
        <motion.div
          className="papel absolute inset-x-[7%] top-[8%] bottom-[6%] z-[1] flex items-center justify-center rounded-sm"
          style={{ boxShadow: '0 2px 10px rgb(0 0 0 / 0.25)' }}
          animate={{ y: abierto ? '-46%' : '0%' }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: abierto ? 0.4 : 0 }}
        >
          <span className="flex items-end gap-1 pt-2">
            <span className="f-serif pb-1 text-[1.26rem] font-black">RIP</span>
            <span className="globo-num text-[2.912rem]" data-t={numero} style={colorNumero ? ({ '--num': colorNumero } as React.CSSProperties) : undefined}>{numero}</span>
          </span>
        </motion.div>

        {/* frente del sobre (con la V abierta) */}
        <div className="absolute inset-0 z-[2]" style={{ background: frente, clipPath: V }} />
        <div className="absolute inset-0 z-[2] opacity-35" style={{ background: 'linear-gradient(115deg, transparent 40%, #fff 100%)', clipPath: V }} />

        {/* solapa */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[56%]"
          style={{
            background: solapa,
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            transformOrigin: 'top center',
            zIndex: solapaAtras ? 0 : 3,
          }}
          animate={{ rotateX: abierto ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        />

        {/* sello de cera */}
        <motion.button
          type="button"
          onClick={abrir}
          aria-label="Abrir invitación"
          className="absolute left-1/2 top-[56%] z-[4] grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #5b5b5b, #0b0b0b 70%)',
            boxShadow: '0 4px 10px rgb(0 0 0 / 0.5), inset 0 0 0 3px rgb(255 255 255 / 0.14)',
            color: '#f2f2f2',
          }}
          animate={abierto ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : { scale: [1, 1.07, 1] }}
          transition={abierto ? { duration: 0.28, ease: 'easeOut' } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="f-firma text-[2.52rem] leading-none">{inicial}</span>
        </motion.button>
      </motion.div>

      <motion.p
        className="f-cond relative z-[2] text-[15.12px] tracking-[0.3em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: abierto ? 0 : 0.75 }}
        transition={{ delay: abierto ? 0 : 0.8, duration: 0.4 }}
      >
        Toca el sello para abrir
      </motion.p>
    </motion.div>
  );
}
