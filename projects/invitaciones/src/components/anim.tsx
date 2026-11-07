'use client';

import { motion, useInView } from 'motion/react';
import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from 'react';

// Piezas de animación compartidas por las dos versiones de la invitación (plata y collage).

// Mientras la portada está cerrada los textos esperan, para que no terminen de animarse debajo.
export const Listo = createContext(true);

export const SUAVE = [0.22, 1, 0.36, 1] as const;

export function Entra({ children, retraso = 0, className = '' }: { children: ReactNode; retraso?: number; className?: string }) {
  const listo = useContext(Listo);
  return (
    <motion.div
      className={`relative z-[2] ${className}`}
      initial="off"
      animate={listo ? undefined : 'off'}
      whileInView={listo ? 'on' : undefined}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      variants={{ off: { opacity: 0, y: 24 }, on: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.65, ease: SUAVE, delay: retraso }}
    >
      {children}
    </motion.div>
  );
}

// Efecto "escrito a mano": el texto se destapa de izquierda a derecha. El detector de visibilidad
// va en un envoltorio sin recorte: un elemento recortado por completo con clip-path nunca se
// detecta como visible y su animación no arrancaría.
export function Escribe({ children, className = '', retraso = 0, dur = 1.4 }: { children: ReactNode; className?: string; retraso?: number; dur?: number }) {
  const listo = useContext(Listo);
  return (
    <motion.span
      className={`relative z-[2] inline-block ${className}`}
      initial="off"
      animate={listo ? undefined : 'off'}
      whileInView={listo ? 'on' : undefined}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      variants={{ off: {}, on: {} }}
    >
      <motion.span
        className="inline-block"
        variants={{
          off: { clipPath: 'inset(-60% 101% -60% -20%)', opacity: 0 },
          on: { clipPath: 'inset(-60% -30% -60% -20%)', opacity: 1 },
        }}
        transition={{ duration: dur, ease: 'easeOut', delay: retraso }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

export function Capitulo({ children, fondo, className = '', nombre, texto }: { children: ReactNode; fondo?: string; className?: string; nombre?: string; texto?: string }) {
  const ref = useRef<HTMLElement>(null);
  // Cuando el capítulo está lejos de la pantalla sus animaciones se pausan (ver globals.css).
  const visible = useInView(ref, { margin: '100px 0px 100px 0px' });
  return (
    <section
      ref={ref}
      data-vis={visible ? '1' : '0'}
      data-cap={nombre}
      className={`relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center overflow-x-clip px-8 py-24 text-center ${className}`}
      style={{ ...(fondo ? { background: fondo } : {}), ...(texto ? ({ '--texto': texto, color: 'var(--texto)' } as CSSProperties) : {}) }}
    >
      {children}
    </section>
  );
}

// Cinta de texto que se desplaza, a todo el ancho de la pantalla. Se pausa cuando no se ve.
export function Cinta({ texto, fondo = '#000', color = '#fff' }: { texto: string; fondo?: string; color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: '100px 0px 100px 0px' });
  if (!texto.trim()) return null;
  const mitad = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className="px-5">{texto}<span className="pl-5 opacity-60">✦</span></span>
  ));
  return (
    <div ref={ref} aria-hidden className="relative z-[3] -my-2 w-full -rotate-1 overflow-hidden py-3 shadow-[0_6px_14px_-6px_rgb(0_0_0/0.6)]" style={{ background: fondo, color }}>
      <div className="marquesina f-cond flex w-max whitespace-nowrap text-[15px] font-bold tracking-[0.3em]" style={{ animation: visible ? undefined : 'none' }}>
        <div className="flex">{mitad}</div>
        <div className="flex">{mitad}</div>
      </div>
    </div>
  );
}
