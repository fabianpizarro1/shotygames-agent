/**
 * Catálogo compacto para generación de creativos.
 * Las imágenes usan las URLs públicas del catálogo (sirven en local y servidor).
 */

const BASE_IMG = 'https://catalogo.shotygames.com/images/products';

// Avatares (públicos objetivo)
const AVATARES = {
  grupos:  'Grupos de amigos / fiesteros, 18-30, Ecuador. Buscan prender la reunión, previa o fiesta.',
  parejas: 'Parejas 22-40, Ecuador. Quieren salir de la rutina, una noche diferente, conectar.',
  regalo:  'Persona buscando un regalo original y divertido para pareja o amigos.',
};

// Ángulos de comunicación
const ANGULOS = {
  lifestyle:      'Gente real disfrutando el producto en una fiesta/cita. Aspiracional, emocional, divertido.',
  hero:           'Producto como protagonista, toma limpia y premium, fondo con bokeh de fiesta.',
  dolor_solucion: 'Plantea un dolor (aburrimiento, rutina, reunión sosa) y presenta el juego como solución.',
  precio_valor:   'Enfatiza lo que recibes por el precio. Ahorro, todo lo incluido, envío gratis.',
  regalo:         'Posiciona el producto como el regalo perfecto que sí van a usar.',
  urgencia:       'Escasez/temporalidad: pídelo para este finde, regalos digitales solo por hoy.',
};

// Productos priorizados (combos primero, luego torres). beneficios = bullets cortos para el copy.
const PRODUCTOS = [
  {
    id: 'combo-la-previa', nombre: 'Combo La Previa', precio: 43, avatar: 'grupos',
    imagen: `${BASE_IMG}/combo-la-previa.jpg`,
    resumen: '2 torres a elección + Dados del Placer físicos + envío gratis a todo Ecuador.',
    beneficios: ['2 torres a elección', 'Dados del Placer físicos', 'Envío gratis', '3 guías digitales de regalo'],
    angulos: ['lifestyle', 'precio_valor', 'dolor_solucion'],
  },
  {
    id: 'combo-parejas-hot', nombre: 'Combo Parejas Hot', precio: 33, avatar: 'parejas',
    imagen: `${BASE_IMG}/combo-parejas-hot.jpg`,
    resumen: 'Torre de Shots Parejas + Dados del Placer físicos + envío gratis.',
    beneficios: ['Torre Parejas', 'Dados del Placer físicos', 'Envío gratis', '2 guías digitales'],
    angulos: ['dolor_solucion', 'lifestyle', 'regalo'],
  },
  {
    id: 'combo-2-torres', nombre: 'Combo 2 Torres', precio: 39, avatar: 'grupos',
    imagen: `${BASE_IMG}/combo-2-torres.jpg`,
    resumen: 'Elige 2 torres + envío gratis + regalos digitales. Ahorras $12 vs por separado.',
    beneficios: ['2 torres a elección', 'Ahorras $12', 'Envío gratis', 'Guías de regalo'],
    angulos: ['precio_valor', 'lifestyle', 'urgencia'],
  },
  {
    id: 'combo-full-torres', nombre: 'Combo Full Torres', precio: 49, avatar: 'grupos',
    imagen: `${BASE_IMG}/combo-full-torres.jpg`,
    resumen: 'Las 3 torres: Normal + Picante + Parejas. Ahorras $25.',
    beneficios: ['Las 3 versiones', 'Ahorras $25', 'Envío gratis', 'Listo para cualquier plan'],
    angulos: ['precio_valor', 'hero', 'regalo'],
  },
  {
    id: 'torre-parejas', nombre: 'Torre de Shots Parejas', precio: 23, avatar: 'parejas',
    imagen: `${BASE_IMG}/torre-parejas-foto.jpg`,
    resumen: 'Juego de retos para parejas. Sube la tensión, salgan de la rutina. Incluye guía de 30 posiciones.',
    beneficios: ['Retos para dos', 'Guía de 30 posiciones de regalo', 'Sube la temperatura'],
    angulos: ['dolor_solucion', 'regalo', 'lifestyle'],
  },
  {
    id: 'torre-normal', nombre: 'Torre de Shots Normal', precio: 23, avatar: 'grupos',
    imagen: `${BASE_IMG}/torre-normal-foto.jpg`,
    resumen: 'El clásico para prender cualquier reunión. Retos divertidos para grupos.',
    beneficios: ['Prende la fiesta', 'Fácil de jugar', 'Guía de 25 juegos de regalo'],
    angulos: ['lifestyle', 'precio_valor', 'hero'],
  },
  {
    id: 'torre-picante', nombre: 'Torre de Shots Picante', precio: 23, avatar: 'grupos',
    imagen: `${BASE_IMG}/torre-picante-brillo.jpg`,
    resumen: 'Para reuniones más atrevidas y sin vergüenza. Retos picantes que rompen el hielo.',
    beneficios: ['Retos atrevidos', 'Rompe la vergüenza', 'Guía de 25 juegos de regalo'],
    angulos: ['lifestyle', 'dolor_solucion', 'hero'],
  },
];

module.exports = { PRODUCTOS, AVATARES, ANGULOS, BASE_IMG };
