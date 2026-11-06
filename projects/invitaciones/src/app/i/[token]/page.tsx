import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getConfig } from '@/lib/config';
import { invitadoPorToken } from '@/lib/invitados';
import { Invitacion } from '@/components/Invitacion';
import { InvitacionCollage } from '@/components/InvitacionCollage';

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ v?: string }> };

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
  const { v } = await searchParams;
  // ?v=2 muestra la versión 2 (collage); sin parámetro, la versión plata.
  const Version = v === '2' || v === 'collage' ? InvitacionCollage : Invitacion;
  const [config, inv] = await Promise.all([getConfig(), invitadoPorToken(token)]);
  if (!inv) notFound();
  return (
    <Version
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
