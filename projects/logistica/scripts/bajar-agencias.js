/**
 * Baja el directorio de agencias de Servientrega y lo guarda como JSON.
 *
 * El endpoint es el que usa la propia página de "Centro de Soluciones"
 * (https://www.servientrega.com.ec/Establecimientos/Agencias): se elige una
 * ciudad y hace un POST por ciudad. Acá se recorren las ~240 ciudades.
 *
 * El resultado se COMMITEA en `src/lib/agencias.json` a propósito: son datos
 * que cambian pocas veces al año y así la app no depende en cada carga de que
 * el sitio de Servientrega esté arriba.
 *
 * Uso:  node scripts/bajar-agencias.js
 */
const fs = require('fs');
const path = require('path');

const URL_API = 'https://www.servientrega.com.ec/Establecimientos/GetBuscarEstablecimientos';
const CIUDADES = require('./ciudades-servientrega.json');   // [[id, "GUAYAQUIL (GUAYAS)"], …]

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** "GUAYAQUIL (GUAYAS)" → "GUAYAQUIL" */
const soloCiudad = (t) => t.replace(/\s*\([^)]*\)\s*$/, '').trim();

async function ciudad(id) {
  const r = await fetch(URL_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' },
    body: JSON.stringify({ ciudad: String(id), referencia: '' }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const lista = await r.json();
  return Array.isArray(lista) ? lista : [];
}

(async () => {
  const salida = {};
  let total = 0;

  for (const [id, nombre] of CIUDADES) {
    if (!id || id === '0') continue;
    try {
      const ags = await ciudad(id);
      if (ags.length) {
        salida[soloCiudad(nombre)] = ags.map((a) => ({
          sucursal: String(a.sucursal ?? '').trim(),
          direccion: String(a.direccion ?? '').trim(),
          telefono: String(a.telefono ?? '').trim(),
          horario: String(a.horario_normal ?? '').trim(),
        }));
        total += ags.length;
      }
    } catch (e) {
      console.error(`  ✗ ${nombre}: ${e.message}`);
    }
    // No golpear el sitio de Servientrega: son ~240 llamadas seguidas.
    await dormir(150);
  }

  const destino = path.join(__dirname, '..', 'src', 'lib', 'agencias.json');
  fs.writeFileSync(destino, JSON.stringify(salida, null, 0));
  console.log(`${total} agencias en ${Object.keys(salida).length} ciudades → ${destino}`);
})();
