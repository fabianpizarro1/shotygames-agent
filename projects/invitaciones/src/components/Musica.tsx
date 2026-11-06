'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';

export interface MusicaApi {
  reproducir: () => void;
}

// Reproductor mini fijo. Solo aparece si hay musica_url en CONFIG.
// El navegador exige un toque del usuario para sonar: la invitación llama a
// reproducir() cuando toca el sello del sobre.
export function Musica({ url, titulo, apiRef }: { url: string; titulo: string; apiRef: Ref<MusicaApi> }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [suena, setSuena] = useState(false);

  useImperativeHandle(apiRef, () => ({
    reproducir: () => {
      audio.current?.play().catch(() => setSuena(false));
    },
  }));

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const on = () => setSuena(true);
    const off = () => setSuena(false);
    a.addEventListener('play', on);
    a.addEventListener('pause', off);
    a.addEventListener('ended', off);
    return () => {
      a.removeEventListener('play', on);
      a.removeEventListener('pause', off);
      a.removeEventListener('ended', off);
    };
  }, []);

  if (!url) return null;

  return (
    <>
      <audio ref={audio} src={url} loop preload="none" />
      <button
        type="button"
        onClick={() => (suena ? audio.current?.pause() : audio.current?.play().catch(() => {}))}
        aria-label={suena ? 'Pausar música' : 'Reproducir música'}
        className="boton fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-full py-2 pl-3 pr-4 text-[13.5px] shadow-lg"
        style={{ background: 'var(--papel)', color: 'var(--texto)', boxShadow: '0 8px 20px rgb(0 0 0 / 0.35)' }}
      >
        <span className="flex h-4 items-end gap-[3px]" aria-hidden>
          {[0, 0.2, 0.4].map((d) => (
            <i
              key={d}
              className="block w-[3px] origin-bottom rounded-full"
              style={{
                height: '100%',
                background: 'var(--texto)',
                transform: suena ? undefined : 'scaleY(0.35)',
                animation: suena ? `barra 0.9s ease-in-out ${d}s infinite` : 'none',
              }}
            />
          ))}
        </span>
        <span className="max-w-[9rem] truncate">{titulo || (suena ? 'Pausar' : 'Música')}</span>
      </button>
    </>
  );
}
