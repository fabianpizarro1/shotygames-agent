'use client';

import { useEffect, useState } from 'react';
import { completarTarea, sumarContador } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { CONTADOR_FOCO } from '@/lib/tipos';

// "No tengo que terminarlo. Solo empiezo 10 minutos."
// El temporizador vive en localStorage (hora de fin, no segundos restantes):
// sobrevive a recargar, a bloquear el teléfono y a cerrar la PWA.

const CLAVE = 'progreso-foco';
const MIN_FOCO = 10;
const MIN_DESCANSO = 15;

type Fase = 'cerrado' | 'inicio' | 'foco' | 'fin-foco' | 'descanso' | 'fin-descanso';

interface Guardado {
  fase: 'foco' | 'descanso';
  fin: number;
  tareaId: string;
  texto: string;
}

function leer(): Guardado | null {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
  } catch {
    return null;
  }
}

function guardar(g: Guardado | null) {
  try {
    if (g) localStorage.setItem(CLAVE, JSON.stringify(g));
    else localStorage.removeItem(CLAVE);
  } catch {}
}

export default function ModoFoco({ fecha, tarea }: { fecha: string; tarea: { id: string; texto: string } | null }) {
  const [fase, setFase] = useState<Fase>('cerrado');
  const [fin, setFin] = useState(0);
  const [ahora, setAhora] = useState(() => Date.now());
  const [actual, setActual] = useState(tarea);
  const { correr, error } = useAccion();

  // Retomar un temporizador que quedó corriendo.
  useEffect(() => {
    const g = leer();
    if (!g) return;
    setActual({ id: g.tareaId, texto: g.texto });
    setFin(g.fin);
    setFase(Date.now() >= g.fin ? (g.fase === 'foco' ? 'fin-foco' : 'fin-descanso') : g.fase);
  }, []);

  useEffect(() => {
    if (fase !== 'foco' && fase !== 'descanso') return;
    const t = setInterval(() => {
      const n = Date.now();
      setAhora(n);
      if (n >= fin) {
        if (fase === 'foco') correr(() => sumarContador(fecha, CONTADOR_FOCO, 1));
        setFase(fase === 'foco' ? 'fin-foco' : 'fin-descanso');
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {}
      }
    }, 500);
    return () => clearInterval(t);
  }, [fase, fin, fecha, correr]);

  function arrancar(tipo: 'foco' | 'descanso') {
    const minutos = tipo === 'foco' ? MIN_FOCO : MIN_DESCANSO;
    const f = Date.now() + minutos * 60_000;
    setFin(f);
    setAhora(Date.now());
    setFase(tipo);
    guardar({ fase: tipo, fin: f, tareaId: actual?.id ?? '', texto: actual?.texto ?? '' });
  }

  function cerrar() {
    guardar(null);
    setFase('cerrado');
  }

  function terminada() {
    if (actual?.id) correr(() => completarTarea(actual.id, true));
    cerrar();
  }

  const restante = Math.max(0, fin - ahora);
  const mm = String(Math.floor(restante / 60_000)).padStart(2, '0');
  const ss = String(Math.floor((restante % 60_000) / 1000)).padStart(2, '0');
  const corriendo = fase === 'foco' || fase === 'descanso';

  return (
    <>
      <button
        onClick={() => {
          setActual(leer() ? actual : tarea);
          setFase(corriendo || fase.startsWith('fin') ? fase : 'inicio');
        }}
        className="pulsable w-full rounded-[var(--radius-tarjeta)] border border-[var(--color-ambar)]/50 bg-[var(--color-ambar-tenue)] px-4 py-3 text-sm font-semibold text-[var(--color-ambar)]"
      >
        {corriendo ? `${fase === 'foco' ? 'Foco' : 'Descanso'} en curso · ${mm}:${ss}` : 'Estoy procrastinando'}
      </button>

      {fase !== 'cerrado' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--color-fondo)]/95 p-6 backdrop-blur">
          <div className="animar-aparecer w-full max-w-sm text-center">
            {actual?.texto && (
              <>
                <p className="text-xs font-semibold tracking-widest text-[var(--color-texto-tenue)] uppercase">Tu tarea</p>
                <p className="mt-1 text-lg font-semibold">{actual.texto}</p>
              </>
            )}

            {fase === 'inicio' && (
              <>
                <p className="prosa mt-6 text-2xl font-bold">No tienes que terminarla.</p>
                <p className="prosa mt-1 text-[var(--color-texto-suave)]">
                  Solo {MIN_FOCO} minutos. Abre el archivo, escribe la primera línea, haz la primera llamada.
                </p>
                <button onClick={() => arrancar('foco')} className="pulsable boton-primario mt-6 w-full py-4 text-base">
                  Empezar {MIN_FOCO} min
                </button>
                <button onClick={() => arrancar('descanso')} className="pulsable boton mt-2 w-full">
                  Es cansancio real → descanso {MIN_DESCANSO} min
                </button>
                <button onClick={cerrar} className="mt-4 text-sm text-[var(--color-texto-tenue)]">
                  Cancelar
                </button>
              </>
            )}

            {corriendo && (
              <>
                <p className="mt-8 text-7xl font-bold tabular-nums">
                  {mm}:{ss}
                </p>
                <p className="prosa mt-2 text-sm text-[var(--color-texto-suave)]">
                  {fase === 'foco' ? 'Teléfono boca abajo. Nada de redes.' : 'Descanso de verdad: agua, caminar, sin pantalla.'}
                </p>
                <button onClick={cerrar} className="mt-10 text-sm text-[var(--color-texto-tenue)]">
                  Parar
                </button>
              </>
            )}

            {fase === 'fin-foco' && (
              <>
                <p className="prosa mt-6 text-2xl font-bold">{MIN_FOCO} minutos hechos.</p>
                <p className="prosa mt-1 text-[var(--color-texto-suave)]">Lo difícil era empezar. ¿Otros {MIN_FOCO}?</p>
                <button onClick={() => arrancar('foco')} className="pulsable boton-primario mt-6 w-full py-4 text-base">
                  Otros {MIN_FOCO} min
                </button>
                {actual?.id && (
                  <button onClick={terminada} className="pulsable boton mt-2 w-full">
                    La terminé ✓
                  </button>
                )}
                <button onClick={cerrar} className="pulsable boton mt-2 w-full">
                  Sigo sin temporizador
                </button>
              </>
            )}

            {fase === 'fin-descanso' && (
              <>
                <p className="prosa mt-6 text-2xl font-bold">Descanso terminado.</p>
                <p className="prosa mt-1 text-[var(--color-texto-suave)]">Ahora sí: solo {MIN_FOCO} minutos.</p>
                <button onClick={() => arrancar('foco')} className="pulsable boton-primario mt-6 w-full py-4 text-base">
                  Empezar {MIN_FOCO} min
                </button>
                <button onClick={cerrar} className="mt-4 text-sm text-[var(--color-texto-tenue)]">
                  Cerrar
                </button>
              </>
            )}
            {error && <p className="mt-3 text-sm text-[var(--color-rojo)]">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
