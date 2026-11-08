// Botón para volver a la invitación desde las páginas de playlist y fotos (se abren aparte del enlace).
// Va fijo arriba (siempre a la vista) y repetido al final. Vuelve sin pedir abrir el sobre otra vez.
export function VolverInvitacion({ token, abajo = false }: { token?: string; abajo?: boolean }) {
  if (!token || !/^[A-Za-z0-9]{6,32}$/.test(token)) return null;
  const href = `/i/${token}?volver=1`;
  if (abajo) {
    return (
      <div className="text-center">
        <a href={href} className="boton f-cond inline-block rounded-full border-2 px-7 py-3 text-[15.12px] font-bold tracking-[0.25em]" style={{ borderColor: 'var(--texto)', color: 'var(--texto)' }}>
          ← Volver a la invitación
        </a>
      </div>
    );
  }
  return (
    <div className="sticky top-3 z-40 mb-2 flex justify-start">
      <a
        href={href}
        aria-label="Volver a la invitación"
        className="boton f-cond inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[14px] font-bold tracking-[0.18em]"
        style={{ background: 'var(--papel)', color: 'var(--texto)', boxShadow: '0 0 0 1.5px var(--texto), 0 8px 18px -8px rgb(0 0 0 / 0.45)' }}
      >
        <span aria-hidden className="text-[18px] leading-none">←</span> INVITACIÓN
      </a>
    </div>
  );
}
