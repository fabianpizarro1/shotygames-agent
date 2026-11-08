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
    nombre: 'Cumpleaños: nueva década',
    descripcion: 'Sobre con sello de cera, portada con número grande, brindis, código de vestimenta, confirmación, mapa, fotos y playlist. Rosa elegante.',
    defaults: base({
      // ---- datos del evento (el cliente los cambia) ----
      festejado: 'Nombre',
      nombre_evento: 'Mi cumpleaños',
      lugar_nombre: 'Nombre del lugar',
      lugar_direccion: 'Ciudad',
      maps_url: '',
      waze_url: '',
      lugar_foto_url: '',
      portada_url: '',
      contacto_whatsapp: '',
      musica_url: '',
      musica_titulo: '',
      fecha_limite_rsvp: '',
      // ---- textos ----
      titulo: 'Estás {invitada} a',
      intro_linea: '',
      intro_titulo: '',
      rip_prefijo: 'RIP',
      rip_numero: '20s',
      rip_texto: 'Estás cordialmente {invitada} a la despedida de mis 20s',
      brindis_titulo: '¡Brindemos!',
      brindis_texto: 'Una nueva década está por comenzar… y quiero recibirla rodeada de personas especiales como tú.',
      cinta_texto: 'RIP 20s ✦ BIENVENIDA 30 ✦ CELEBRA CONMIGO',
      bienvenida_linea: '',
      bienvenida_palabra: 'Hello a mis',
      bienvenida_numero: "30's",
      fecha_linea: '¡Me encantaría que me acompañes en este día tan especial!',
      vestimenta_titulo: 'Código de vestimenta',
      dresscode_titulo: 'Ven en tonos rosa bebé o rosa claro.',
      dresscode_detalle: '',
      dresscode_colores: '#f8d7df,#f4c2d0,#ef9aa8',
      regalos_texto: 'El obsequio se recibirá en sobre cerrado.',
      final_titulo: '¡Te espero!',
      final_texto: 'Por favor confirma tu asistencia',
      sobre_texto: '{festejado} Birthday',
      wa_mensaje: 'Con mucho cariño quiero invitarte a celebrar conmigo una fecha muy especial.\n\nTe agradecería confirmar tu asistencia para poder organizar cada detalle. ¡Espero contar contigo!\n\n{link}',
      // ---- estilo (rosa elegante) ----
      color_fondo: '#f8dde4',
      color_fondo_2: '#df97a3',
      color_papel: '#ede8e2',
      color_texto: '#8c2937',
      color_acento: '#9f414c',
      texto_color_inicio: '#822834',
      texto_color_brindis: '#6d1a36',
      texto_color_bienvenida: '#b8325f',
      texto_color_fecha: '#6d1a36',
      texto_color_vestimenta: '#b8325f',
      texto_color_programa: '#6d1a36',
      texto_color_final: '#6d1a36',
      numero_color_inicio: '#6d1a36',
      numero_color_bienvenida: '#6d1a36',
      firma_color: '#6d1a36',
      firma_mostrar: 'no',
      corona_color: 'rosa',
      sello_color: 'vino',
      bienvenida_letra: 'elegante',
      gorro_mostrar: 'no',
      foto_bn: 'no',
      musica_autoplay: 'si',
      extras_solo_confirmados: 'si',
      stickers_propios: 'si', // sin memes ni fotos de internet: derechos propios
      // ---- fotos y playlist (las fechas las elige el cliente: vacías = subida abierta y galería cerrada) ----
      fotos_activas: 'si',
      fotos_subida_desde: '',
      fotos_subida_hasta: '',
      fotos_galeria_desde: '',
      playlist_activa: 'si',
      playlist_hasta: '',
    }),
  },
];

export const plantillaPorSlug = (slug: string) => PLANTILLAS.find((p) => p.slug === slug) ?? PLANTILLAS[0];
