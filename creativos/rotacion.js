/**
 * Decide qué producto+ángulo tocan hoy, sin repetir hasta agotar todas las combinaciones.
 * Se guarda en Redis (persiste entre reinicios/deploys); si no hay Redis, cae a memoria
 * del proceso (se reinicia la rotación en cada deploy — degradado, no roto).
 */
const REDIS_KEY = 'contenido:rotacion';

let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    redisClient.on('error', () => { redisClient = null; });
  }
} catch (e) {}

let estadoMemoria = null; // fallback: { orden: [idx...], pos: n }

function todasLasCombinaciones(PRODUCTOS) {
  const combos = [];
  for (const producto of PRODUCTOS) {
    for (const angulo of producto.angulos) {
      combos.push({ productoId: producto.id, angulo });
    }
  }
  return combos;
}

// Fisher-Yates
function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function leerEstado() {
  if (redisClient) {
    try {
      const raw = await redisClient.get(REDIS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return estadoMemoria;
}

async function guardarEstado(estado) {
  estadoMemoria = estado;
  if (redisClient) {
    try { await redisClient.set(REDIS_KEY, JSON.stringify(estado)); } catch (e) {}
  }
}

/**
 * Devuelve { producto, angulo } — el siguiente en la rotación.
 * Cuando se agotan todas las combinaciones, se vuelve a barajar (sin repetir el último).
 */
async function siguienteCombo(PRODUCTOS) {
  const combos = todasLasCombinaciones(PRODUCTOS);
  let estado = await leerEstado();

  if (!estado || !Array.isArray(estado.orden) || estado.orden.length !== combos.length) {
    estado = { orden: barajar(combos.map((_, i) => i)), pos: 0 };
  }

  if (estado.pos >= estado.orden.length) {
    const ultimo = estado.orden[estado.orden.length - 1];
    let nuevoOrden;
    do {
      nuevoOrden = barajar(combos.map((_, i) => i));
    } while (nuevoOrden[0] === ultimo && combos.length > 1);
    estado = { orden: nuevoOrden, pos: 0 };
  }

  const idx = estado.orden[estado.pos];
  const combo = combos[idx];
  const producto = PRODUCTOS.find(p => p.id === combo.productoId);

  await guardarEstado({ orden: estado.orden, pos: estado.pos + 1 });

  return { producto, angulo: combo.angulo };
}

module.exports = { siguienteCombo };
