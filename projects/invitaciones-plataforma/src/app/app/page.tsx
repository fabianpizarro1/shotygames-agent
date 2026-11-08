import Link from 'next/link';
import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { PLANTILLAS } from '@/lib/plantillas';
import { NuevoEvento } from '@/components/app/NuevoEvento';
import { BotonSalir } from '@/components/app/BotonSalir';

export const metadata = { title: 'Mis eventos', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const ESTADO: Record<string, string> = { borrador: 'Borrador', publicado: 'Publicado', vencido: 'Vencido' };

export default async function MisEventos() {
  const u = await usuarioActual();
  if (!u) redirect('/login');
  const eventos = (await db().eventosDe(u.id)).sort((a, b) => b.creado_at.localeCompare(a.creado_at));
  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="f-script text-3xl leading-none">Mis eventos</span>
          <span className="flex items-center gap-4 text-sm text-stone-500">
            {u.nombre || u.email}
            <BotonSalir />
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <NuevoEvento plantillas={PLANTILLAS.map((p) => ({ slug: p.slug, nombre: p.nombre, descripcion: p.descripcion }))} />
        {eventos.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-stone-600 ring-1 ring-stone-200">Todavía no tienes eventos. Crea el primero arriba.</p>
        ) : (
          <ul className="space-y-3">
            {eventos.map((e) => (
              <li key={e.id}>
                <Link href={`/app/${e.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200 active:scale-[0.99]">
                  <span>
                    <span className="block font-semibold">{e.nombre}</span>
                    <span className="text-sm text-stone-500">{PLANTILLAS.find((p) => p.slug === e.plantilla)?.nombre ?? e.plantilla}</span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${e.estado === 'publicado' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{ESTADO[e.estado] ?? e.estado}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
