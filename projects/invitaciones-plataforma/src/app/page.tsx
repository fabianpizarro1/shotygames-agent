import Link from 'next/link';
import { usuarioActual } from '@/lib/auth';

export default async function Inicio() {
  const u = await usuarioActual();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16 text-center">
      <p className="f-script text-5xl" style={{ color: 'var(--texto)' }}>Invitaciones que se sienten</p>
      <p className="mx-auto mt-4 max-w-md text-lg opacity-80">
        Crea tu invitación digital animada, personalízala con vista previa en vivo, envíala por WhatsApp con un enlace por invitado y mira quién abrió y quién confirmó.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href={u ? '/app' : '/registro'} className="f-cond rounded-full bg-[var(--texto)] px-8 py-3.5 text-[15px] font-bold tracking-[0.25em] text-[var(--papel)]">
          {u ? 'IR A MIS EVENTOS' : 'CREAR MI INVITACIÓN'}
        </Link>
        {!u && <Link href="/login" className="text-sm underline underline-offset-4 opacity-70">Ya tengo cuenta</Link>}
      </div>
    </main>
  );
}
