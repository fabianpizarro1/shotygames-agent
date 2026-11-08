import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { invitadoPorToken } from '@/lib/invitados';
import { estadoPlaylist } from '@/lib/musica';
import { eventoPublico } from '@/lib/publico';
import { Playlist } from '@/components/Playlist';

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
  return { title: p ? `${p.config.playlist_titulo} · ${p.config.nombre_evento}` : 'Playlist de la fiesta', robots: { index: false, follow: false } };
}

export default async function PaginaPlaylist({ searchParams }: Props) {
  const p = await cargar(await searchParams);
  if (!p) notFound();
  const c = p.config;
  const inv = p.token ? await invitadoPorToken(p.token) : null;
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
      sinConfirmar={c.extras_solo_confirmados.trim().toLowerCase() !== 'no' && !!inv && inv.estado !== 'confirmado'}
      inicial={{ activa: e.activa, abierta: e.abierta, max: e.max }}
    />
  );
}
