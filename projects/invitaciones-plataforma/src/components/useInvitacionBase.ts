'use client';

import { useEffect, useRef, useState } from 'react';
import type { Config } from '@/lib/config';
import type { MusicaApi } from './Musica';

export interface InvitadoVista {
  token: string;
  nombre: string;
  genero: 'F' | 'M';
  cupos: number;
  estado: 'pendiente' | 'confirmado' | 'no_asiste';
  asistentes: number;
  mensaje: string;
}

// Solo http(s) o rutas propias en cualquier campo que acabe como enlace o archivo.
const CAMPOS_URL = new Set(['recepcion_maps_url', 'regalos_url', 'maps_url', 'waze_url', 'url_base', 'musica_url', 'portada_url', 'lugar_foto_url', 'playlist_url', 'galeria_fotos']);
const urlSegura = (v: string) => v.split('\n').every((l) => !l.trim() || /^(\/|https?:\/\/)/i.test(l.trim()));
function limpiarValores(v: unknown, base: Config): Partial<Config> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== 'object') return out;
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (!(k in base) || typeof x !== 'string' || x.length > 5000) continue;
    out[k] = CAMPOS_URL.has(k) && !urlSegura(x) ? '' : x;
  }
  return out;
}


interface Opciones {
  config: Config;
  invitado: InvitadoVista;
  vistaPrevia: boolean;
  volver: boolean;
  soloLectura: boolean;
}

// Lo que comparten TODAS las plantillas de invitación: configuración en vivo (vista previa del panel),
// portada (sobre), scroll, música, estado de la confirmación y registro de "abierto".
export function useInvitacionBase({ config, invitado, vistaPrevia, volver, soloLectura }: Opciones) {
  // En la vista previa del panel, `c` se actualiza en vivo con lo que se está editando (sin guardar).
  const [c, setC] = useState(config);
  useEffect(() => setC(config), [config]);
  // `volver`: se llega desde la playlist/fotos con el botón «Volver a la invitación»; no se pide abrir el sobre otra vez
  const [portada, setPortada] = useState(!vistaPrevia && !volver);
  const musica = useRef<MusicaApi>(null);
  // Estado de la confirmación (cambia en vivo cuando el invitado confirma en esta misma pantalla)
  const [estadoRsvp, setEstadoRsvp] = useState(invitado.estado);

  // Siempre desde el principio: sin esto el navegador restaura el scroll anterior (al recargar o volver
  // atrás) y la invitación arranca "a la mitad" al abrir el sobre.
  useEffect(() => {
    try {
      history.scrollRestoration = 'manual';
    } catch {}
    if (!volver) window.scrollTo(0, 0);
  }, [volver]);
  useEffect(() => {
    if (portada) return;
    window.scrollTo(0, 0);
    // al volver desde la playlist/fotos se aterriza en las tarjetas (con un segundo intento cuando ya cargaron las imágenes)
    const ir = () => {
      const extras = volver ? document.getElementById('extras') ?? document.getElementById('confirmar') : null;
      if (extras) extras.scrollIntoView({ block: 'center' });
      else window.scrollTo(0, 0);
    };
    const id = requestAnimationFrame(ir);
    const t = volver ? window.setTimeout(ir, 500) : 0;
    return () => {
      cancelAnimationFrame(id);
      if (t) clearTimeout(t);
    };
  }, [portada, volver]);

  // La portada bloquea el scroll mientras está abierta.
  useEffect(() => {
    document.body.style.overflow = portada ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [portada]);

  // Vista previa (solo admin): recibe los cambios del panel, salta a un capítulo y avisa qué capítulo se tocó.
  useEffect(() => {
    if (!vistaPrevia) return;
    const yo = window.location.origin;
    const alMensaje = (e: MessageEvent) => {
      if (e.origin !== yo) return;
      const d = e.data as { tipo?: string; valores?: unknown; cap?: string } | null;
      if (d?.tipo === 'config') setC((prev) => ({ ...prev, ...limpiarValores(d.valores, config) }));
      else if (d?.tipo === 'ir' && typeof d.cap === 'string') {
        const s = d.cap === 'inicio' ? null : document.querySelector(`section[data-cap="${CSS.escape(d.cap)}"]`);
        if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    const alClic = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('a')) e.preventDefault();
      const cap = (t?.closest?.('section[data-cap]') as HTMLElement | null)?.dataset.cap;
      if (cap) window.parent.postMessage({ tipo: 'editar', cap }, yo);
    };
    window.addEventListener('message', alMensaje);
    document.addEventListener('click', alClic, true);
    window.parent.postMessage({ tipo: 'listo' }, yo);
    return () => {
      window.removeEventListener('message', alMensaje);
      document.removeEventListener('click', alClic, true);
    };
  }, [vistaPrevia, config]);

  // Marca "abierto" una sola vez por sesión (alimenta las estadísticas del panel).
  useEffect(() => {
    if (vistaPrevia) return;
    try {
      const k = `abierto-${invitado.token}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {}
    if (soloLectura) return;
    fetch('/api/abierto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: invitado.token }) }).catch(() => {});
  }, [invitado.token, vistaPrevia, soloLectura]);

  return { c, portada, setPortada, musica, estadoRsvp, setEstadoRsvp };
}
