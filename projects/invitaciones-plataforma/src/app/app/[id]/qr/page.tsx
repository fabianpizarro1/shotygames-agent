import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eventoDelUsuario } from '@/lib/auth';
import { configDeEvento } from '@/lib/config';
import { QrImprimible } from '@/components/admin/QrImprimible';

export const metadata: Metadata = { title: 'QR de fotos', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PaginaQr({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await eventoDelUsuario(id);
  if (!p) notFound();
  const c = configDeEvento(p.evento);
  return (
    <QrImprimible
      eventoId={p.evento.id}
      slug={p.evento.slug}
      urlBase={c.url_base.trim()}
      titulo={c.fotos_titulo}
      evento={c.nombre_evento}
      colores={{ fondo: c.color_fondo, fondo2: c.color_fondo_2, papel: c.color_papel, texto: c.color_texto, acento: c.color_acento }}
    />
  );
}
