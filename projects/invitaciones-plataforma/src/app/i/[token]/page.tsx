import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { configDeEvento } from '@/lib/config';
import { db } from '@/lib/db';
import { invitadoPorToken } from '@/lib/invitados';
import { Invitacion } from '@/components/Invitacion';
import { InvitacionBoda } from '@/components/InvitacionBoda';
import { NoDisponible } from '@/components/NoDisponible';

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ vista?: string; volver?: string }> };

async function cargar(token: string) {
  const inv = await invitadoPorToken(token);
  if (!inv) return null;
  const evento = await db().eventoPorId(inv.evento_id);
  return evento ? { inv, evento } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const x = await cargar((await params).token);
  if (!x || x.evento.estado !== 'publicado') return { title: 'Invitación', robots: { index: false, follow: false } };
  const c = configDeEvento(x.evento);
  return {
    title: c.nombre_evento,
    description: `${x.inv.nombre}: ${c.titulo.replace('{invitada}', x.inv.genero === 'M' ? 'invitado' : 'invitada')} ${c.nombre_evento}`,
    robots: { index: false, follow: false },
  };
}

export default async function Pagina({ params, searchParams }: Props) {
  const { token } = await params;
  const { vista, volver } = await searchParams;
  const x = await cargar(token);
  if (!x) notFound();
  // ?vista=1 (vista previa del panel) solo funciona con la sesión del dueño del evento.
  const u = vista === '1' ? await usuarioActual() : null;
  const esDueno = !!u && (u.id === x.evento.dueno_id || u.es_admin);
  if (x.evento.estado !== 'publicado' && !esDueno) return <NoDisponible />;
  const Plantilla = x.evento.plantilla === 'boda' ? InvitacionBoda : Invitacion;
  return (
    <Plantilla
      vistaPrevia={vista === '1' && esDueno}
      volver={volver === '1'}
      config={configDeEvento(x.evento)}
      invitado={{ token: x.inv.token, nombre: x.inv.nombre, genero: x.inv.genero, cupos: x.inv.cupos, estado: x.inv.estado, asistentes: x.inv.asistentes, mensaje: x.inv.mensaje }}
    />
  );
}
