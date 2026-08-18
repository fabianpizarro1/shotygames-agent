// Genera src/assets/thumbs/*.webp a 256 px para las miniaturas del checkout.
//
// Por qué: los upsells del CheckoutModal y varios bloques de resumen muestran
// imágenes a 40-64 px CSS pero cargaban el archivo de producto completo
// (1080x1080, ~150 KB cada uno). Al abrir el checkout —el momento más caro de
// perder— el móvil se descargaba media docena de esas. A 256 px (suficiente
// para 64 px a 3x) cada una baja a ~10 KB.
//
// Uso: node scripts/make-thumbs.mjs
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "src/assets");
const out = path.join(src, "thumbs");
mkdirSync(out, { recursive: true });

const files = [
  "dados-del-placer.webp", "dados-digitales-principal.webp",
  "emparejados-portada.jpg", "enganchados.jpg", "guia-placer-portada.webp",
  "torre-normal-brillo.webp", "torre-normal.jpg", "torre-parejas.jpg",
  "torre-picante.jpg",
];

for (const f of files) {
  const from = path.join(src, f);
  const to = path.join(out, f.replace(/\.(jpe?g|png)$/i, ".webp"));
  await sharp(from).resize({ width: 256, height: 256, fit: "inside" })
    .webp({ quality: 80, effort: 6 }).toFile(to);
  console.log(
    `${String(Math.round(statSync(from).size / 1024)).padStart(4)} → ` +
    `${String(Math.round(statSync(to).size / 1024)).padStart(3)} KB  ${path.basename(to)}`,
  );
}
