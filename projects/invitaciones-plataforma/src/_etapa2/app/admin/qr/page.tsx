import type { Metadata } from 'next';
import { getConfig } from '@/lib/config';
import { QrImprimible } from '@/components/admin/QrImprimible';

export const metadata: Metadata = { title: 'QR de fotos', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PaginaQr() {
  const c = await getConfig();
  return (
    <QrImprimible
      urlBase={c.url_base.trim()}
      titulo={c.fotos_titulo}
      evento={c.nombre_evento}
      colores={{ fondo: c.color_fondo, fondo2: c.color_fondo_2, papel: c.color_papel, texto: c.color_texto, acento: c.color_acento }}
    />
  );
}
