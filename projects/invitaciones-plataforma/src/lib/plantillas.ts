import { CONFIG_DEFAULTS } from './config-defaults.mjs';

// Una plantilla = piel + valores por defecto sobre el mismo motor de invitación.
// Por ahora solo existe "cumple" (las de boda y quinceañera llegan después de que el motor funcione).

export interface Plantilla {
  slug: string;
  nombre: string;
  descripcion: string;
  defaults: Record<string, string>;
}

const base = (extra: Record<string, string>) => ({
  ...Object.fromEntries(Object.entries(CONFIG_DEFAULTS).map(([k, v]) => [k, v.valor])),
  ...extra,
});

export const PLANTILLAS: Plantilla[] = [
  {
    slug: 'cumple',
    nombre: 'Cumpleaños elegante',
    descripcion: 'Sobre con sello de cera, capítulos animados, confirmación, mapa y cuenta regresiva.',
    defaults: base({
      festejado: 'Nombre',
      nombre_evento: 'Mi cumpleaños',
      sobre_texto: '{festejado} Birthday',
      cinta_texto: 'BIENVENIDA A LOS 30 ✦ {festejado} ✦ CELEBRA CONMIGO',
      bienvenida_palabra: 'Hello a mis',
      bienvenida_numero: "30's",
      contacto_whatsapp: '',
      maps_url: '',
      waze_url: '',
      musica_url: '',
      musica_titulo: '',
      portada_url: '',
      lugar_foto_url: '',
      lugar_nombre: 'Nombre del lugar',
      lugar_direccion: 'Ciudad',
      fecha_limite_rsvp: '',
      playlist_activa: 'si',
      fotos_activas: 'si',
      // las ventanas de fecha las elige el cliente; vacías = subida abierta y galería cerrada
      fotos_subida_desde: '',
      fotos_subida_hasta: '',
      fotos_galeria_desde: '',
      playlist_hasta: '',
    }),
  },
];

export const plantillaPorSlug = (slug: string) => PLANTILLAS.find((p) => p.slug === slug) ?? PLANTILLAS[0];
