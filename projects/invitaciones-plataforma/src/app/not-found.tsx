export default function NoEncontrada() {
  return (
    <main className="rayas flex min-h-dvh items-center justify-center p-8 text-center">
      <p className="f-script text-4xl" style={{ color: 'var(--texto)' }}>
        No encontramos tu invitación.
        <span className="f-serif mt-3 block text-base opacity-80">Revisa que el enlace esté completo o escribe a quien te invitó.</span>
      </p>
    </main>
  );
}
