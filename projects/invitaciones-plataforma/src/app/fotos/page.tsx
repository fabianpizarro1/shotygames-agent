import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { estadoFotos } from '@/lib/fotos';
import { invitadoPorToken } from '@/lib/invitados';
import { eventoPublico } from '@/lib/publico';
import { Fotos } from '@/components/Fotos';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ t?: string; e?: string }> };

async function cargar(sp: { t?: string; e?: string }) {
  const q = new URLSearchParams();
  if (sp.t) q.set('t', sp.t);
  else if (sp.e) q.set('e', sp.e);
  return eventoPublico(q);
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await cargar(await searchParams);
  return { title: p ? `${p.config.fotos_titulo} · ${p.config.nombre_evento}` : 'Fotos de la fiesta', robots: { index: false, follow: false } };
}

// Con ?e=<slug> es el QR general (cualquiera con el QR sube fotos); con ?t=<token> es el enlace personal.
export default async function PaginaFotos({ searchParams }: Props) {
  const sp = await searchParams;
  const p = await cargar(sp);
  if (!p) notFound();
  const c = p.config;
  const inv = p.token ? await invitadoPorToken(p.token) : null;
  const e = estadoFotos(c);
  return (
    <Fotos
      ctx={p.token ? `t=${p.token}` : `e=${p.evento.slug}`}
      config={{
        titulo: c.fotos_titulo,
        mensaje: c.fotos_mensaje,
        evento: c.nombre_evento,
        subidaDesde: c.fotos_subida_desde,
        galeriaDesde: c.fotos_galeria_desde,
        colores: { fondo: c.color_fondo, fondo2: c.color_fondo_2, papel: c.color_papel, texto: c.color_texto, acento: c.color_acento },
      }}
      inicial={{ subida: e.subida, galeriaAbierta: e.galeriaAbierta, max: e.maxPorPersona }}
      nombreInicial={inv?.nombre ?? ''}
      token={inv?.token}
    />
  );
}
