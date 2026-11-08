import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { configDeEvento } from '@/lib/config';
import { db } from '@/lib/db';
import { InvitacionPorPlantilla } from '@/components/PorPlantilla';
import { NoDisponible } from '@/components/NoDisponible';

// Enlace general del evento. Con ?vista=1 el dueño ve la vista previa del editor (con un invitado de ejemplo);
// sin eso, si el evento está publicado, se ve la invitación en solo lectura (sin confirmar: eso es por enlace personal).
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ vista?: string; n?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await db().eventoPorSlug((await params).slug);
  return { title: e && e.estado === 'publicado' ? configDeEvento(e).nombre_evento : 'Invitación', robots: { index: false, follow: false } };
}

export default async function Pagina({ params, searchParams }: Props) {
  const { slug } = await params;
  const { vista, n } = await searchParams;
  const e = await db().eventoPorSlug(slug);
  if (!e) notFound();
  const u = vista === '1' ? await usuarioActual() : null;
  const esDueno = !!u && (u.id === e.dueno_id || u.es_admin);
  if (e.estado !== 'publicado' && !esDueno) return <NoDisponible />;
  const preview = vista === '1' && esDueno;
  return (
    <InvitacionPorPlantilla
      plantilla={e.plantilla}
      vistaPrevia={preview}
      soloLectura={!preview}
      config={configDeEvento(e)}
      invitado={{ token: 'EJEMPLO0', nombre: (n ?? '').trim().slice(0, 80) || 'Tu invitado', genero: 'F', cupos: 2, estado: 'pendiente', asistentes: 0, mensaje: '' }}
    />
  );
}
