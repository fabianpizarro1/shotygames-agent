// Reporte: cuánto JS/CSS descarga de verdad cada ruta en la primera visita.
// Suma el chunk de la página + todo lo que ese chunk importa (transitivo),
// que es exactamente lo que el navegador tiene que tener antes de pintar.
// Uso: node scripts/peso-por-ruta.mjs   (después de `npm run build`)

import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");
const manifest = JSON.parse(readFileSync(path.join(dist, ".vite/manifest.json"), "utf8"));

const gz = (f) => gzipSync(readFileSync(path.join(dist, f))).length;

const collect = (key, seen = new Set()) => {
  const e = manifest[key];
  if (!e) return seen;
  if (e.file) seen.add(e.file);
  (e.css ?? []).forEach((c) => seen.add(c));
  (e.imports ?? []).forEach((i) => collect(i, seen));
  return seen;
};

const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry);
const base = collect(entryKey);

const routes = {
  "/ (home)": "src/pages/Index.tsx",
  "/landing/torre-normal": "src/pages/TorreNormalLanding.tsx",
  "/landing/torre-picante": "src/pages/TorrePicanteLanding.tsx",
  "/landing/torre-parejas": "src/pages/TorreParejasLanding.tsx",
  "/landing/combo-parejas": "src/pages/ComboParejasLanding.tsx",
  "/landing/emparejados": "src/pages/EmparejadosLanding.tsx",
  "/landing/emparejados-imprimible": "src/pages/EmparejadosImprimibleLanding.tsx",
  "/landing/3-torres": "src/pages/TresTorresLanding.tsx",
  "/pago-tarjeta": "src/pages/PayphoneCheckout.tsx",
};

console.log("ruta                              archivos   crudo    gzip");
for (const [label, key] of Object.entries(routes)) {
  const files = collect(key, new Set(base));
  let raw = 0, gzip = 0;
  for (const f of files) { raw += statSync(path.join(dist, f)).size; gzip += gz(f); }
  console.log(
    `${label.padEnd(34)} ${String(files.size).padStart(3)}  ` +
    `${(raw / 1024).toFixed(0).padStart(5)} KB ${(gzip / 1024).toFixed(0).padStart(5)} KB`,
  );
}
