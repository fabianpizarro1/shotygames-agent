import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { esAdmin } from '@/lib/admin-auth';
import { getConfig } from '@/lib/config';
import { invitadoPorToken } from '@/lib/invitados';
import { Invitacion } from '@/components/Invitacion';

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ vista?: string; volver?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const [c, inv] = await Promise.all([getConfig(), invitadoPorToken(token)]);
  if (!inv) return { title: 'Invitación' };
  return {
    title: c.nombre_evento,
    description: `${inv.nombre}: ${c.titulo.replace('{invitada}', inv.genero === 'M' ? 'invitado' : 'invitada')} ${c.nombre_evento}`,
    robots: { index: false, follow: false },
  };
}

export default async function Pagina({ params, searchParams }: Props) {
  const { token } = await params;
  const { vista, volver } = await searchParams;
  // ?vista=1 (vista previa del panel) solo funciona con la sesión del admin.
  const vistaPrevia = vista === '1' && (await esAdmin());
  const [config, inv] = await Promise.all([getConfig(), invitadoPorToken(token)]);
  if (!inv) notFound();
  return (
    <Invitacion
      vistaPrevia={vistaPrevia}
      volver={volver === '1'}
      config={config}
      invitado={{
        token: inv.token,
        nombre: inv.nombre,
        genero: inv.genero,
        cupos: inv.cupos,
        estado: inv.estado,
        asistentes: inv.asistentes,
        mensaje: inv.mensaje,
      }}
    />
  );
}
