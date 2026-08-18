// Recomprime en sitio todos los mapas de bits de src/assets.
//
// Por qué existe: las imágenes venían exportadas casi sin comprimir (hasta
// 970 KB para un 1080x1080) y varias a 1824/1920 px, un tamaño que ninguna
// landing llega a mostrar — en móvil, que es de donde viene la mayoría del
// tráfico, eso es descargar 5-8x más bytes de los necesarios. Cuatro archivos
// además eran PNG con extensión .jpg (por eso pesaban ~500 KB cada uno).
//
// No cambia nombres ni extensiones a propósito: los imports de las landings y
// el og:image del prerender-SEO (Meta/WhatsApp scrapean mal el webp) siguen
// funcionando sin tocar una sola línea de TSX.
//
// Uso:  node scripts/optimize-images.mjs [--dry]
// Los originales están en git: `git checkout -- src/assets` revierte todo.

import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, "src/assets");
const dry = process.argv.includes("--dry");

// Lado más largo. Ninguna landing muestra una imagen a más de ~700 px CSS;
// 1400 deja margen para pantallas 2x sin pagar por píxeles invisibles.
const MAX = 1400;
const kb = (n) => Math.round(n / 1024);

let before = 0, after = 0;
const changes = [];

for (const file of readdirSync(dir).sort()) {
  if (!/\.(webp|jpe?g|png)$/i.test(file)) continue;
  const full = path.join(dir, file);
  const origSize = statSync(full).size;
  before += origSize;

  const img = sharp(full);
  const meta = await img.metadata();
  const resize = Math.max(meta.width, meta.height) > MAX
    ? { width: meta.width >= meta.height ? MAX : null,
        height: meta.height > meta.width ? MAX : null,
        withoutEnlargement: true }
    : null;

  // La extensión manda, no el formato real del contenido: los cuatro PNG
  // llamados .jpg se reescriben como JPEG de verdad.
  const ext = path.extname(file).toLowerCase();
  let pipeline = sharp(full, { failOn: "none" }).rotate();
  if (resize) pipeline = pipeline.resize(resize);
  pipeline = ext === ".webp"
    ? pipeline.webp({ quality: 78, effort: 6, smartSubsample: true })
    : ext === ".png"
      ? pipeline.png({ compressionLevel: 9, palette: true })
      : pipeline.jpeg({ quality: 80, mozjpeg: true, progressive: true });

  const out = await pipeline.toBuffer();

  if (out.length >= origSize) { after += origSize; continue; } // ya estaba bien
  after += out.length;
  changes.push(
    `${String(kb(origSize)).padStart(5)} → ${String(kb(out.length)).padStart(4)} KB  ` +
    `${meta.width}x${meta.height}${resize ? ` → cap ${MAX}` : ""}  ${file}`,
  );
  if (!dry) writeFileSync(full, out);
}

console.log(changes.join("\n"));
console.log(
  `\n${changes.length} imágenes${dry ? " (DRY RUN, no se escribió nada)" : " reescritas"}: ` +
  `${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB ` +
  `(-${Math.round((1 - after / before) * 100)}%)`,
);
