'use client';

import { descartarInbox, ideaATarea } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { LABEL_CLASE_INBOX, labelNegocio, type ItemInbox } from '@/lib/tipos';

export default function BancoIdeas({ ideas }: { ideas: ItemInbox[] }) {
  const { pendiente, error, correr } = useAccion();
  if (!ideas.length) return null;

  return (
    <section>
      <h2 className="titulo-seccion">Banco de ideas ({ideas.length})</h2>
      <ul className="flex flex-col gap-2">
        {ideas.map((i) => (
          <li key={i.id} className="tarjeta px-3 py-2.5">
            <p className="text-sm">{i.texto}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-texto-tenue)]">
              <span>
                {i.clase ? LABEL_CLASE_INBOX[i.clase] : 'Sin clasificar'}
                {i.negocio && ` · ${labelNegocio(i.negocio)}`}
              </span>
              <span className="flex gap-3">
                <button onClick={() => correr(() => ideaATarea(i.id))} disabled={pendiente} className="font-semibold text-[var(--color-acento)]">
                  → Tarea
                </button>
                <button onClick={() => correr(() => descartarInbox(i.id))} disabled={pendiente}>
                  Descartar
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-[var(--color-rojo)]">{error}</p>}
    </section>
  );
}
