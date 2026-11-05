'use client';

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// Portada: sobre rosa con sello de cera. Al tocar el sello: el sello salta,
// la solapa se abre, la tarjeta sube y todo se desvanece hacia la invitación.
// Solo se animan transform y opacity. ~1.4 s en total.

interface Props {
  nombre: string;
  inicial: string;
  onAbrir: () => void;
  onListo: () => void;
}

export function Sobre({ nombre, inicial, onAbrir, onListo }: Props) {
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

  const rosa = 'var(--acento)';
  const rosaOscuro = 'color-mix(in srgb, var(--acento) 82%, #6a0f22)';
  const rosaClaro = 'color-mix(in srgb, var(--acento) 70%, #fff)';

  return (
    <motion.div
      className="rayas fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 px-6"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <motion.p
        className="f-script text-center text-4xl leading-tight"
        style={{ color: 'var(--papel)' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: abierto ? 0 : 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span className="f-serif block text-xs uppercase tracking-[0.3em] opacity-80">Para</span>
        {nombre}
      </motion.p>

      <motion.div
        className="relative aspect-[10/7] w-[min(80vw,340px)]"
        style={{ perspective: 900 }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      >
        {/* fondo del sobre */}
        <div className="absolute inset-0 rounded-sm" style={{ background: rosaOscuro, boxShadow: '0 22px 40px -10px rgb(0 0 0 / 0.55)' }} />

        {/* tarjeta que sube */}
        <motion.div
          className="papel absolute inset-x-[7%] top-[8%] bottom-[6%] z-[1] flex items-center justify-center rounded-sm"
          style={{ boxShadow: '0 2px 10px rgb(0 0 0 / 0.25)' }}
          animate={{ y: abierto ? '-46%' : '0%' }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: abierto ? 0.4 : 0 }}
        >
          <span className="f-script px-4 text-center text-2xl leading-none" style={{ color: 'var(--texto)' }}>
            You&rsquo;re invited
          </span>
        </motion.div>

        {/* frente del sobre (con la V abierta) */}
        <div
          className="absolute inset-0 z-[2]"
          style={{ background: rosa, clipPath: 'polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)' }}
        />
        <div
          className="absolute inset-0 z-[2] opacity-40"
          style={{ background: `linear-gradient(115deg, transparent 40%, ${rosaClaro} 100%)`, clipPath: 'polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)' }}
        />

        {/* solapa */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[56%]"
          style={{
            background: rosaClaro,
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
            background: 'radial-gradient(circle at 35% 30%, #b3243e, #6f0f22 70%)',
            boxShadow: '0 4px 10px rgb(0 0 0 / 0.5), inset 0 0 0 3px rgb(255 255 255 / 0.12)',
            color: 'var(--papel)',
          }}
          animate={abierto ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : { scale: [1, 1.07, 1] }}
          transition={abierto ? { duration: 0.28, ease: 'easeOut' } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="f-script text-3xl leading-none">{inicial}</span>
        </motion.button>
      </motion.div>

      <motion.p
        className="f-serif text-xs uppercase tracking-[0.28em]"
        style={{ color: 'var(--papel)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: abierto ? 0 : 0.85 }}
        transition={{ delay: abierto ? 0 : 0.8, duration: 0.4 }}
      >
        Toca el sello para abrir
      </motion.p>
    </motion.div>
  );
}
