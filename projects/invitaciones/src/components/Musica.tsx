'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';

export interface MusicaApi {
  reproducir: () => void;
}

// Botón de música fijo, arriba a la derecha, visible desde la portada del sobre.
// La música NUNCA empieza sola: solo suena cuando el invitado toca este botón.
// Solo aparece si hay musica_url en CONFIG.
export function Musica({ url, titulo, apiRef }: { url: string; titulo: string; apiRef?: Ref<MusicaApi> }) {
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
      <audio ref={audio} src={url} loop preload="metadata" />
      <button
        type="button"
        data-musica="boton-inicio"
        onClick={() => (suena ? audio.current?.pause() : audio.current?.play().catch(() => {}))}
        aria-label={suena ? 'Pausar música' : 'Reproducir música'}
        aria-pressed={suena}
        className="boton fixed right-3 z-[60] flex min-h-[46px] items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-[1.176rem] font-semibold"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          background: 'var(--papel)',
          color: 'var(--texto)',
          boxShadow: '0 0 0 2px var(--texto), 0 8px 18px -6px rgb(0 0 0 / 0.5)',
        }}
      >
        <span className="grid size-[34px] shrink-0 place-items-center rounded-full" style={{ background: 'var(--texto)', color: 'var(--papel)' }} aria-hidden>
          {suena ? (
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
          )}
        </span>
        <span className="leading-none">{suena ? 'Pausar música' : titulo ? `Escuchar: ${titulo}` : 'Escuchar música'}</span>
      </button>
    </>
  );
}
