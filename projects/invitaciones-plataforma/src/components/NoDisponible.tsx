export function NoDisponible() {
  return (
    <main className="rayas flex min-h-dvh items-center justify-center p-8 text-center">
      <p className="f-script text-4xl" style={{ color: 'var(--texto)' }}>
        Esta invitación todavía no está disponible.
        <span className="f-serif mt-3 block text-base opacity-80">Vuelve a intentarlo más tarde o escribe a quien te invitó.</span>
      </p>
    </main>
  );
}
