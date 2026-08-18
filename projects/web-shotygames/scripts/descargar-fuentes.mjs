// Baja de Google Fonts los woff2 (solo subset latin + latin-ext) y genera
// public/fonts/fonts.css para servirlos desde nuestro propio dominio.
//
// Por qué self-host: pedirle las fuentes a fonts.googleapis.com obliga al
// móvil a resolver DNS + TLS con DOS dominios extra (googleapis y gstatic)
// antes de poder pintar un solo texto con la tipografía correcta. Desde
// nuestro dominio la conexión ya está abierta desde el primer byte del HTML.
// Las tres familias son SIL Open Font License, self-hosting está permitido.
//
// Uso: node scripts/descargar-fuentes.mjs   (solo cuando cambien las familias)

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public/fonts");
mkdirSync(outDir, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"; // sin esto Google manda ttf

// Los pesos son los que el sitio realmente pinta, medidos en el navegador
// sobre la home y las landings (no los que decía el <link> viejo):
//   Poppins 400/500/600/700/800/900 — es la fuente de TODO el texto, porque
//     index.css tiene `* { font-family: Poppins }` y ese selector universal
//     gana sobre lo que herede el body.
//   Montserrat 600/700 — solo los títulos con la clase `font-display`.
// Inter salió de la lista: se descargaban 3 pesos (141 KB) y no había ni un
// solo elemento renderizado con esa familia. El 800/900 de Montserrat también
// se cargaban sin usarse, y el 600 se pedía sin estar en el <link> (el
// navegador lo sintetizaba deformando el 700).
const QUERY = "family=Poppins:wght@400;500;600;700;800;900" +
  "&family=Montserrat:wght@600;700&display=swap";

const css = await (await fetch(
  `https://fonts.googleapis.com/css2?${QUERY}`, { headers: { "User-Agent": UA } },
)).text();

// Cada @font-face viene precedido de un comentario con el subset.
// Solo nos quedamos con latin y latin-ext: el sitio es en español.
const blocks = css.split("/*").slice(1);
const wanted = new Set(["latin", "latin-ext"]);
let out = "";
let total = 0;

for (const block of blocks) {
  const subset = block.slice(0, block.indexOf("*/")).trim();
  if (!wanted.has(subset)) continue;

  const family = /font-family: '([^']+)'/.exec(block)[1];
  const weight = /font-weight: (\d+)/.exec(block)[1];
  const url = /src: url\((https:[^)]+)\)/.exec(block)[1];
  const range = /unicode-range: ([^;]+);/.exec(block)?.[1];

  const file = `${family.toLowerCase()}-${weight}-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(path.join(outDir, file), buf);
  total += buf.length;

  out += `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};` +
    `font-display:swap;src:url(/fonts/${file}) format('woff2');` +
    (range ? `unicode-range:${range};` : "") + `}\n`;
  console.log(`${String(Math.round(buf.length / 1024)).padStart(3)} KB  ${file}`);
}

writeFileSync(path.join(outDir, "fonts.css"), out);
console.log(`\n${(total / 1024).toFixed(0)} KB en total → public/fonts/`);
