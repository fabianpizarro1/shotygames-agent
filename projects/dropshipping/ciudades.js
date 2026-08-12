/**
 * Resuelve el nombre de ciudad que espera la transportadora.
 *
 * El problema: la lista de ciudades de la landing (copiada de Shotygames) usa
 * los nombres que dice la gente, y DROPI usa los de la transportadora. No
 * siempre coinciden:
 *
 *   la gente dice        DROPI/Servientrega espera
 *   ─────────────        ─────────────────────────
 *   San Miguel           SAN MIGUEL DE BOLIVAR      (y "SAN MIGUEL" existe, ¡pero en Cañar!)
 *   Salinas              SALINAS (SANTA ELENA)      o SALINAS (BOLIVAR)
 *   Chimbo               SAN JOSE DE CHIMBO
 *
 * Si se manda el nombre equivocado, DROPI rechaza el pedido con
 * "La ciudad no existe en el departamento ingresado" y la venta se cae.
 *
 * `dropi.js` resuelve esto con un mapa escrito a mano que crece de a una ciudad
 * cada vez que aparece un caso nuevo — o sea, cada vez que se pierde un pedido.
 * Acá se consulta el catálogo real (GET /city, 835 ciudades) y se busca dentro
 * de la provincia correcta, que es la única forma de no equivocarse de San Miguel.
 */

const { conToken } = require('./catalogo');

let _cache = null;
let _cacheAt = 0;
const TTL = 12 * 60 * 60 * 1000;   // el catálogo casi no cambia

const norm = (s) =>
  String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Catálogo de ciudades de DROPI, cacheado. */
async function getCiudades({ refrescar = false } = {}) {
  if (_cache && !refrescar && Date.now() - _cacheAt < TTL) return _cache;

  const r = await conToken(async (c) => c.get('/city'));
  const crudas = r.data?.objects || r.data || [];

  _cache = crudas.map((c) => ({
    id: c.id,
    nombre: c.name,
    provincia: c.department?.name || '',
    nNombre: norm(c.name),
    nProvincia: norm(c.department?.name)
  }));
  _cacheAt = Date.now();
  return _cache;
}

/**
 * Devuelve el nombre exacto que espera DROPI, o lanza un error con las
 * opciones de esa provincia para que se pueda corregir sin adivinar.
 */
async function resolverCiudad(ciudad, provincia) {
  const ciudades = await getCiudades();
  const nCiudad = norm(ciudad);
  const nProv = norm(provincia);

  // Buscar SIEMPRE dentro de la provincia: "SAN MIGUEL" existe en Cañar y en
  // Bolívar con nombres distintos, y sin este filtro se elige el equivocado.
  const enProvincia = nProv ? ciudades.filter((c) => c.nProvincia === nProv) : ciudades;
  const universo = enProvincia.length ? enProvincia : ciudades;

  const exacta = universo.find((c) => c.nNombre === nCiudad);
  if (exacta) return { nombre: exacta.nombre, provincia: exacta.provincia, exacto: true };

  // "SAN MIGUEL" → "SAN MIGUEL DE BOLIVAR"
  const empieza = universo.filter((c) => c.nNombre.startsWith(nCiudad + ' '));
  if (empieza.length === 1) {
    return { nombre: empieza[0].nombre, provincia: empieza[0].provincia, exacto: false };
  }

  // "SALINAS (SANTA ELENA)" cuando entra "SALINAS"
  const contiene = universo.filter((c) => c.nNombre.includes(nCiudad));
  if (contiene.length === 1) {
    return { nombre: contiene[0].nombre, provincia: contiene[0].provincia, exacto: false };
  }

  // "CAMILO PONCE ENRIQUEZ" → "PONCE ENRIQUEZ"
  const dentro = universo.filter((c) => nCiudad.includes(c.nNombre));
  if (dentro.length === 1) {
    return { nombre: dentro[0].nombre, provincia: dentro[0].provincia, exacto: false };
  }

  const parecidas = empieza.length ? empieza : contiene;

  // Si no hay ninguna parecida, listar opciones al azar de la provincia solo
  // confunde. Mejor decir que no está y dónde sí existe ese nombre.
  if (!parecidas.length) {
    const enOtraProvincia = ciudades.filter((c) => c.nNombre.includes(nCiudad));
    const pista = enOtraProvincia.length
      ? ` En DROPI "${ciudad}" existe pero en: ${[...new Set(enOtraProvincia.map((c) => c.provincia))].join(', ')}.`
      : '';
    throw new Error(
      `La transportadora no tiene "${ciudad}" en ${provincia || 'esa provincia'}.${pista}`
    );
  }

  throw new Error(
    `"${ciudad}" en ${provincia} es ambiguo. Opciones: ${parecidas.slice(0, 12).map((c) => c.nombre).join(' · ')}`
  );
}

module.exports = { getCiudades, resolverCiudad, _norm: norm };
