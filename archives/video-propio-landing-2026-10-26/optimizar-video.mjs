// Recomprime un video para la landing: 540x960 (9:16), H.264 con faststart, ~0,5-1,2 MB
// por cada 15 s. Sale en src/assets/videos/<nombre>.mp4 y se importa como cualquier
// imagen (Vite le pone hash y Vercel lo sirve con caché inmutable y Range).
//
// Uso:  node scripts/optimizar-video.mjs <entrada> <nombre> [--sin-audio]
//   --sin-audio   para videos con música de terceros (no se puede alojar fuera de TikTok)
//                 o cuando el video se entiende solo con los textos en pantalla.
//
// Necesita ffmpeg en el PATH (o en ~/bin).
import { mkdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "src/assets/videos");

const [entrada, nombre, ...flags] = process.argv.slice(2);
if (!entrada || !nombre) {
  console.error("Uso: node scripts/optimizar-video.mjs <entrada> <nombre> [--sin-audio]");
  process.exit(1);
}
const sinAudio = flags.includes("--sin-audio");

mkdirSync(out, { recursive: true });
const destino = path.join(out, `${nombre}.mp4`);

const args = [
  "-y", "-hide_banner", "-loglevel", "error",
  "-i", entrada,
  // 540 de ancho, alto par proporcional (9:16 -> 960). Máximo 30 fps.
  "-vf", "scale=540:-2,fps=fps=30:round=down",
  // Los textos en pantalla piden CRF bajo; maxrate evita picos que se paguen en móvil.
  "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-profile:v", "main", "-pix_fmt", "yuv420p",
  "-maxrate", "1200k", "-bufsize", "2400k",
  // moov al principio: empieza a verse sin bajar todo el archivo.
  "-movflags", "+faststart",
  ...(sinAudio ? ["-an"] : ["-c:a", "aac", "-b:a", "48k", "-ac", "1"]),
  destino,
];

const ffmpeg = process.env.FFMPEG || (spawnSync("ffmpeg", ["-version"]).status === 0 ? "ffmpeg" : path.join(homedir(), "bin/ffmpeg"));
const r = spawnSync(ffmpeg, args, { stdio: "inherit" });
if (r.status !== 0) {
  console.error(`ffmpeg falló (${r.status ?? r.error?.message})`);
  process.exit(1);
}
console.log(`${path.relative(root, destino)}  ${(statSync(destino).size / 1024).toFixed(0)} KB${sinAudio ? "  (sin audio)" : ""}`);
