import type { Metadata } from 'next';
import { getConfig } from '@/lib/config';
import { estadoFotos } from '@/lib/fotos';
import { invitadoPorToken } from '@/lib/invitados';
import { Fotos } from '@/components/Fotos';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const c = await getConfig();
  return { title: `${c.fotos_titulo} · ${c.nombre_evento}`, robots: { index: false, follow: false } };
}

export default async function PaginaFotos({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const [c, inv] = await Promise.all([getConfig(), t ? invitadoPorToken(t) : Promise.resolve(null)]);
  const e = estadoFotos(c);
  return (
    <Fotos
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
