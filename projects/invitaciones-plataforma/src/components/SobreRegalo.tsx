'use client';

import { motion } from 'motion/react';

// Sobre cerrado del obsequio (dibujo propio). Entra con un rebote y el sello late una sola vez al
// aparecer en pantalla. Sin animaciones continuas: no suma capas ni trabajo al hacer scroll.
export function SobreRegalo({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`relative z-[2] ${className}`}
      initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
      whileInView={{ scale: 1, opacity: 1, rotate: -3 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ type: 'spring', stiffness: 240, damping: 14 }}
    >
      <svg viewBox="0 0 240 176" width="236" role="img" aria-label="Sobre cerrado para el obsequio" className="block overflow-visible">
        <defs>
          <radialGradient id="sr-sombra">
            <stop offset="0" stopColor="#000" stopOpacity="0.3" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sr-sello" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#6a6a6a" />
            <stop offset="0.7" stopColor="#0b0b0b" />
          </radialGradient>
          <linearGradient id="sr-cuerpo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8bccb" />
            <stop offset="1" stopColor="#ee90a8" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="166" rx="96" ry="9" fill="url(#sr-sombra)" />
        {/* cuerpo y pliegues del frente */}
        <rect x="14" y="30" width="212" height="126" rx="9" fill="url(#sr-cuerpo)" stroke="#d9728f" strokeWidth="1.6" />
        <path d="M14 156 L112 96 M226 156 L128 96" fill="none" stroke="#d9728f" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
        {/* solapa cerrada */}
        <path d="M14 30 L120 106 L226 30 Z" fill="#fcd6df" stroke="#d9728f" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M30 34 L120 98 L210 34" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        {/* sello de cera con corazón: late una vez */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scale: 1 }}
          whileInView={{ scale: [1, 1.3, 1, 1.2, 1] }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 1, ease: 'easeInOut' }}
        >
          <circle cx="120" cy="106" r="20" fill="url(#sr-sello)" stroke="rgb(255 255 255 / 0.2)" strokeWidth="3" />
          <path d="M120 116 c-10-7-13-11-13-15.5 a6.5 6.5 0 0 1 13-2 a6.5 6.5 0 0 1 13 2 c0 4.5-3 8.5-13 15.5z" fill="#f48fb1" />
        </motion.g>
        {/* destellos */}
        <path d="M28 12 C29 18 33 21 39 22 C33 23 29 26 28 32 C27 26 23 23 17 22 C23 21 27 18 28 12Z" fill="#111" opacity="0.85" />
        <path d="M214 6 C215 10 218 13 222 14 C218 15 215 18 214 22 C213 18 210 15 206 14 C210 13 213 10 214 6Z" fill="#ee90a8" />
      </svg>
    </motion.div>
  );
}
