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

// El endpoint devuelve algunos nombres con el escape Unicode sin resolver
// ("QUITO_LA NIu00d1A" por LA NIÑA) y otros encima mal decodificados dos veces
// ("QUITO_LA NIÃu2018A": la Ñ es C3 91 en UTF-8, leída como cp1252 da "Ã" + "‘").
// Sin esto la Ñ llegaba literal al WhatsApp del cliente.

// cp1252 mapea 0x80-0x9F a caracteres que NO son los de latin1 — por eso
// Buffer.from(s, 'latin1') solo no alcanza: el "‘" (U+2018) es el byte 0x91.
const CP1252 = new Map(Object.entries({
  '\u20ac': 0x80, '\u201a': 0x82, '\u0192': 0x83, '\u201e': 0x84, '\u2026': 0x85,
  '\u2020': 0x86, '\u2021': 0x87, '\u02c6': 0x88, '\u2030': 0x89, '\u0160': 0x8a,
  '\u2039': 0x8b, '\u0152': 0x8c, '\u017d': 0x8e, '\u2018': 0x91, '\u2019': 0x92,
  '\u201c': 0x93, '\u201d': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02dc': 0x98, '\u2122': 0x99, '\u0161': 0x9a, '\u203a': 0x9b, '\u0153': 0x9c,
  '\u017e': 0x9e, '\u0178': 0x9f,
}));

/** "Ã‘" → "Ñ". Devuelve el original si la secuencia no era UTF-8 válido. */
function desmojibake(v) {
  if (!/[\u00c2-\u00c3]/.test(v)) return v;
  const bytes = [];
  for (const ch of v) {
    const cp = ch.codePointAt(0);
    const b = CP1252.get(ch);
    if (b !== undefined) bytes.push(b);
    else if (cp <= 0xff) bytes.push(cp);
    else return v;   // hay algo que no cabe en un byte: no era mojibake
  }
  const salida = Buffer.from(bytes).toString('utf8');
  return salida.includes('\ufffd') ? v : salida;
}

// OJO con ensanchar este patrón: con `u[0-9a-f]{4}` suelto, "CIUDADANA" trae
// "u"+"DADA" —cuatro hex válidos— y se convertía en un surrogate suelto que
// dejaba el JSON ilegible. Solo se tocan los dos rangos que este endpoint
// emite de verdad: u00XX (latín-1, la Ñ y las tildes) y u20XX (las comillas
// tipográficas del mojibake). Nunca se produce un surrogate.
const ESCAPE_REAL = /u(00[0-9a-f]{2}|20[0-9a-f]{2})/gi;

const limpiar = (v) =>
  desmojibake(
    String(v ?? '').replace(ESCAPE_REAL, (m, h) => {
      const cp = parseInt(h, 16);
      if (cp < 0x80 || (cp >= 0xd800 && cp <= 0xdfff)) return m;
      return String.fromCharCode(cp);
    })
  )
    .replace(/\s+/g, ' ')
    .trim();

// Servientrega escribe las horas como se le ocurre: "08H00 A 18H30",
// "0830 A 12H30", "0900 a 1200- 1300 a 1700". Esto va tal cual al WhatsApp del
// cliente, así que se unifica a "08H30 A 12H30". Solo se tocan los bloques de
// 3-4 dígitos que son una hora: nada más en la cadena se modifica.
const horaBonita = (v) =>
  String(v ?? '')
    .replace(/\b(\d{1,2})(\d{2})\b/g, (m, hh, mm) =>
      +hh <= 24 && +mm < 60 ? `${String(hh).padStart(2, '0')}H${mm}` : m
    )
    .replace(/\bh\b/gi, 'H')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\ba\b/g, 'A')
    .replace(/\s+/g, ' ')
    .trim();

/** "NO LABORA", "-", "" → no abre. */
const sinSabado = (h) => !String(h ?? '').trim() || /NO\s*LABORA|^-+$/i.test(String(h).trim());

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
          sucursal: limpiar(a.sucursal),
          direccion: limpiar(a.direccion),
          telefono: limpiar(a.telefono),
          horario: horaBonita(limpiar(a.horario_normal)),
          // El sábado viene por separado y antes se descartaba: los mensajes
          // salían diciendo "08H00 A 18H30" sin aclarar si el cliente puede ir
          // el sábado. En Manta las 14 agencias abren sábado y ninguna lo decía.
          sabado: sinSabado(a.horario_especial) ? '' : horaBonita(limpiar(a.horario_especial)),
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
