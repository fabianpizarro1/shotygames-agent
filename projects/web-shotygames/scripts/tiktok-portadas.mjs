// Baja la portada de cada TikTok a src/assets/tiktok/<id>.webp para el
// componente TikTokCarrusel.
//
// Por qué portadas propias y no la URL que da TikTok: esas URLs vienen
// firmadas y vencen (x-expires) — a los días la tarjeta queda en negro.
//
// Uso: node scripts/tiktok-portadas.mjs <link1> <link2> ...
// Acepta links cortos (vm.tiktok.com / vt.tiktok.com) y largos.
// Imprime por cada video el id y el @autor para cargar el array de la landing.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "src/assets/tiktok");
mkdirSync(out, { recursive: true });

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Los links cortos redirigen al largo; el id solo está en el largo.
async function resolver(link) {
  const res = await fetch(link, { redirect: "follow", headers: { "User-Agent": UA } });
  const final = res.url;
  const m = final.match(/\/video\/(\d+)/) ?? link.match(/\/video\/(\d+)/);
  if (!m) throw new Error(`no encontré /video/<id> en ${final} (¿es un carrusel de fotos?)`);
  const usuario = final.match(/\/@([^/?]+)/)?.[1];
  return { id: m[1], url: final.split("?")[0], usuario, html: await res.text() };
}

// 1) oEmbed oficial. 2) Si falla, el og:image de la página del video.
async function portadaDe({ url, html }) {
  try {
    const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { "User-Agent": UA },
    });
    if (r.ok) {
      const d = await r.json();
      if (d.thumbnail_url) return { src: d.thumbnail_url, autor: d.author_unique_id, titulo: d.title };
    }
  } catch {
    /* cae al plan B */
  }
  const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1];
  if (og) return { src: og.replace(/&amp;/g, "&") };
  throw new Error(`sin portada para ${url}`);
}

const links = process.argv.slice(2);
if (links.length === 0) {
  console.error("Uso: node scripts/tiktok-portadas.mjs <link1> <link2> ...");
  process.exit(1);
}

let fallos = 0;
for (const link of links) {
  try {
    const video = await resolver(link);
    const portada = await portadaDe(video);
    const img = await fetch(portada.src, { headers: { "User-Agent": UA } });
    if (!img.ok) throw new Error(`HTTP ${img.status} bajando la portada`);
    const buf = Buffer.from(await img.arrayBuffer());
    const destino = path.join(out, `${video.id}.webp`);
    const info = await sharp(buf).resize({ width: 540, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
    writeFileSync(destino, info.data);
    const autor = portada.autor ?? video.usuario;
    console.log(
      JSON.stringify({ id: video.id, autor: autor ? `@${autor}` : null, titulo: portada.titulo ?? null, kb: Math.round(info.data.length / 1024), w: info.info.width, h: info.info.height }),
    );
  } catch (e) {
    fallos++;
    console.error(`❌ ${link}: ${e.message}`);
  }
}
process.exit(fallos ? 1 : 0);
