import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getConfig } from '@/lib/config';
import { invitadoPorToken } from '@/lib/invitados';
import { Invitacion } from '@/components/Invitacion';

type Props = { params: Promise<{ token: string }> };

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

export default async function Pagina({ params }: Props) {
  const { token } = await params;
  const [config, inv] = await Promise.all([getConfig(), invitadoPorToken(token)]);
  if (!inv) notFound();
  return (
    <Invitacion
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
