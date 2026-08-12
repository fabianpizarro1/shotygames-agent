/**
 * Genera src/data/ecuador.ts de la landing desde el catálogo real de DROPI.
 *
 * Por qué: la lista que traía la landing venía de Shotygames y usa los nombres
 * que dice la gente ("San Miguel"), no los de la transportadora
 * ("SAN MIGUEL DE BOLIVAR"). Cuando no coinciden, DROPI rechaza el pedido con
 * "La ciudad no existe en el departamento ingresado" y la venta se pierde
 * DESPUÉS de haberla pagado en ads.
 *
 * Con este listado el cliente solo puede elegir ciudades que DROPI reconoce,
 * así que el problema desaparece en el formulario en vez de resolverse tarde.
 *
 * Correr cuando DROPI agregue cobertura:
 *   node projects/dropshipping/generar-ciudades-landing.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getCiudadesCOD } = require('./ciudades');

const DESTINO = path.join(__dirname, '..', 'truquito', 'src', 'data', 'ecuador.ts');

// Palabras que en español van en minúscula dentro de un nombre propio.
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'el']);

/**
 * "SAN MIGUEL DE BOLIVAR" → "San Miguel de Bolívar" para mostrar.
 * El VALOR que se envía sigue siendo el de DROPI, tal cual: acá solo se
 * embellece la etiqueta que ve el cliente.
 */
function bonito(txt) {
  return String(txt)
    .toLowerCase()
    .split(' ')
    .map((palabra, i) => {
      if (i > 0 && MINUSCULAS.has(palabra)) return palabra;
      // Respetar paréntesis: "salinas (santa elena)" → "Salinas (Santa Elena)"
      return palabra.replace(/^(\(?)(\p{L})/u, (_, p, l) => p + l.toUpperCase());
    })
    .join(' ');
}

async function generar() {
  // Solo ciudades con servicio contra entrega. 22 del catálogo no lo tienen
  // (entre ellas las 3 de Galápagos) y ofrecerlas sería prometer una entrega
  // que la transportadora no hace.
  const ciudades = await getCiudadesCOD({ refrescar: true });

  const porProvincia = {};
  for (const c of ciudades) {
    if (!c.provincia) continue;
    (porProvincia[c.provincia] ||= []).push(c.nombre);
  }

  const provincias = Object.keys(porProvincia).sort((a, b) => a.localeCompare(b, 'es'));
  for (const p of provincias) {
    porProvincia[p] = [...new Set(porProvincia[p])].sort((a, b) => a.localeCompare(b, 'es'));
  }

  const total = provincias.reduce((n, p) => n + porProvincia[p].length, 0);

  const lineasProvincias = provincias
    .map((p) => `  { valor: ${JSON.stringify(p)}, label: ${JSON.stringify(bonito(p))} }`)
    .join(',\n');

  const lineasCiudades = provincias
    .map((p) => {
      const items = porProvincia[p]
        .map((c) => `    { valor: ${JSON.stringify(c)}, label: ${JSON.stringify(bonito(c))} }`)
        .join(',\n');
      return `  ${JSON.stringify(p)}: [\n${items}\n  ]`;
    })
    .join(',\n');

  const contenido = `/**
 * Provincias y ciudades EXACTAS del catálogo de DROPI.
 *
 * GENERADO AUTOMÁTICAMENTE — no editar a mano.
 * Regenerar: node projects/dropshipping/generar-ciudades-landing.js
 *
 * \`valor\` es el nombre literal que espera la transportadora y es lo que viaja
 * en el pedido. \`label\` es solo cosmético, para no mostrarle mayúsculas
 * gritadas al cliente.
 *
 * Que el formulario ofrezca únicamente estas opciones evita el error
 * "La ciudad no existe en el departamento ingresado", que rechaza el pedido
 * después de haber pagado el clic.
 *
 * ${total} ciudades en ${provincias.length} provincias · ${new Date().toISOString().slice(0, 10)}
 */

export type Opcion = { valor: string; label: string };

export const provincias: Opcion[] = [
${lineasProvincias}
];

export const ciudadesPorProvincia: Record<string, Opcion[]> = {
${lineasCiudades}
};
`;

  fs.writeFileSync(DESTINO, contenido);
  return { provincias: provincias.length, ciudades: total, archivo: DESTINO };
}

if (require.main === module) {
  generar()
    .then((r) => console.log(`✅ ${r.ciudades} ciudades en ${r.provincias} provincias → ${path.relative(process.cwd(), r.archivo)}`))
    .catch((e) => { console.error('❌ ' + e.message); process.exit(1); });
}

module.exports = { generar, bonito };
