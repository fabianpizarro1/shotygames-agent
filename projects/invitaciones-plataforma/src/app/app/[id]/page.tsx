import { notFound, redirect } from 'next/navigation';
import { eventoDelUsuario, usuarioActual } from '@/lib/auth';
import { Dashboard } from '@/components/admin/Dashboard';

export const metadata = { title: 'Panel del evento', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PanelEvento({ params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioActual())) redirect('/login');
  const p = await eventoDelUsuario((await params).id);
  if (!p) notFound();
  return <Dashboard eventoId={p.evento.id} nombre={p.evento.nombre} />;
}
