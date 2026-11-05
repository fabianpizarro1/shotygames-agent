import type { Metadata } from 'next';
import { getConfig } from '@/lib/config';
import { invitadoPorToken } from '@/lib/invitados';
import { estadoPlaylist } from '@/lib/musica';
import { Playlist } from '@/components/Playlist';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const c = await getConfig();
  return { title: `${c.playlist_titulo} · ${c.nombre_evento}`, robots: { index: false, follow: false } };
}

export default async function PaginaPlaylist({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const [c, inv] = await Promise.all([getConfig(), t ? invitadoPorToken(t) : Promise.resolve(null)]);
  const e = estadoPlaylist(c);
  return (
    <Playlist
      config={{
        titulo: c.playlist_titulo,
        mensaje: c.playlist_mensaje,
        evento: c.nombre_evento,
        hasta: c.playlist_hasta,
        url: c.playlist_url,
        colores: { fondo: c.color_fondo, fondo2: c.color_fondo_2, papel: c.color_papel, texto: c.color_texto, acento: c.color_acento },
      }}
      invitado={inv ? { token: inv.token, nombre: inv.nombre } : null}
      inicial={{ activa: e.activa, abierta: e.abierta, max: e.max }}
    />
  );
}
