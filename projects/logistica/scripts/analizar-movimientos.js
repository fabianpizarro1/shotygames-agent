/**
 * Aprende el vocabulario de Servientrega a partir de historiales reales.
 *
 * Baja el rastreo de una muestra de guías y saca dos cosas:
 *   · qué movimientos existen y cuántas veces aparecen;
 *   · qué movimiento sigue a cuál (matriz de transiciones), que es lo que
 *     permite entender el significado de cada uno y predecir el siguiente.
 *
 * Uso:  node scripts/analizar-movimientos.js [cuantas]
 */
const fs = require('fs');

const TMP = process.env.TMP_ANALISIS || '/tmp';
const GUIAS = require(`${TMP}/guias.json`);
const BASE = 'https://www.servientrega.com.ec';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const SEP = '';
const sinTags = (h) =>
  h
    .replace(/<[^>]*>/g, SEP)
    .split(SEP)
    .map((x) => x.trim())
    .filter(Boolean);

function parsear(html) {
  const items = html.split(/class="timeline-item"/).slice(1);
  const movs = [];
  for (const it of items) {
    const partes = sinTags(it);
    const i = partes.findIndex((p) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(p));
    if (i < 0 || !partes[i + 1]) continue;
    movs.push({ fecha: partes[i], mov: partes[i + 1] });
  }
  const cab = html.match(/Destino\s*:\s*<\/?[^>]*>?\s*([^<]+)</i);
  return {
    destino: cab ? cab[1].replace(/\s*\(Provincia:[^)]*\)/i, '').trim() : null,
    movs: movs.sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
  };
}

/**
 * Deja la FAMILIA del movimiento: le saca el nombre propio de agencia, ciudad o
 * centro logístico, que es lo que hace que cada uno parezca distinto.
 */
function familia(m) {
  return m
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(CL|CS)\s+[A-Z0-9_(). ]+$/, '$1 <LUGAR>')
    .replace(/\b(AGENCIA|CONCESION)\s+[A-Z0-9_(). ]+$/, '$1 <LUGAR>')
    .replace(/\bA\s+CENTRO LOGISTICO\s+.*$/, 'A CENTRO LOGISTICO <LUGAR>')
    .replace(/\d{3,}/g, '<N>')
    .trim();
}

(async () => {
  const cuantas = Number(process.argv[2] || 250);
  // Todo lo que no esté pagado (ciclos abiertos y devoluciones) + una muestra
  // de pagados, que son los ciclos completos que terminan en entrega.
  const abiertos = GUIAS.filter((g) => !/PAGADO/i.test(g.est));
  const pagados = GUIAS.filter((g) => /PAGADO/i.test(g.est));
  const muestra = [...abiertos, ...pagados.slice(-Math.max(0, cuantas - abiertos.length))];

  console.log(`bajando ${muestra.length} historiales…`);

  const vocab = {};
  const transiciones = {};
  const finales = {};
  const ejemplos = {};
  let ok = 0;

  const LOTE = 6;
  for (let i = 0; i < muestra.length; i += LOTE) {
    await Promise.all(
      muestra.slice(i, i + LOTE).map(async (g) => {
        try {
          const r = await fetch(`${BASE}/Tracking/Index/?guia=${encodeURIComponent(g.g)}`, {
            headers: { 'user-agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(20000),
          });
          if (!r.ok) return;
          const { movs } = parsear(await r.text());
          if (!movs.length) return;
          ok++;
          const fam = movs.map((m) => familia(m.mov));
          fam.forEach((f, k) => {
            vocab[f] = (vocab[f] || 0) + 1;
            if (!ejemplos[f]) ejemplos[f] = movs[k].mov;
            if (k < fam.length - 1) {
              transiciones[f] = transiciones[f] || {};
              transiciones[f][fam[k + 1]] = (transiciones[f][fam[k + 1]] || 0) + 1;
            }
          });
          finales[fam[fam.length - 1]] = (finales[fam[fam.length - 1]] || 0) + 1;
        } catch {
          /* una guía que no responde no puede tumbar el análisis */
        }
      })
    );
    await dormir(150);
    if (i % 60 === 0) process.stdout.write('.');
  }

  console.log(`\n${ok} historiales leídos\n`);
  fs.writeFileSync(
    `${TMP}/vocab.json`,
    JSON.stringify({ vocab, transiciones, finales, ejemplos, leidos: ok }, null, 1)
  );
  console.log(`guardado en ${TMP}/vocab.json`);
})();
