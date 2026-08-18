// Genera un dist/<ruta>/index.html por cada landing, con <title> y og:image
// propios ya presentes en el HTML que se sirve al primer request.
//
// Por qué existe: Seo.tsx escribe el título y las meta tags con
// document.title / DOM APIs dentro de un useEffect — corre después de que
// React monta. Los crawlers de Meta/WhatsApp/Google no ejecutan ese JS (o lo
// hacen sin fiabilidad), así que ven siempre el <title> y el og:image
// genéricos de index.html, sin importar qué landing sea. Resultado real:
// compartir el link del Combo Parejas mostraba "ShotyGames - Los juegos que
// prenden la fiesta" en vez del título del combo.
//
// La solución no reescribe Seo.tsx (sigue haciendo falta para navegación
// client-side dentro de la SPA) — solo agrega, a nivel de build, una copia
// estática de index.html por ruta con las tags ya correctas. Vercel sirve
// archivos del filesystem antes de aplicar el rewrite catch-all de
// vercel.json (comprobado: /robots.txt y /favicon.ico ya se sirven como
// archivos reales, no como el index.html reescrito), así que
// dist/landing/combo-parejas/index.html gana sobre el rewrite sin tocarlo.
//
// El bundle de JS/CSS es el mismo para todas las copias: React arranca igual
// en cualquiera y React Router renderiza la página correcta según location.pathname.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(root, "dist");
const site = "https://www.shotygames.com";
const fallbackImage = `${site}/og-image.jpg`;

const manifest = JSON.parse(
  readFileSync(path.join(distDir, ".vite", "manifest.json"), "utf-8"),
);

// Resuelve "src/assets/foo.webp" -> "https://www.shotygames.com/assets/foo-<hash>.webp"
const resolveImage = (srcRelativePath) => {
  const entry = manifest[srcRelativePath];
  if (!entry) {
    console.warn(`[prerender-seo] no encontré en el manifest: ${srcRelativePath} (uso fallback)`);
    return fallbackImage;
  }
  return `${site}/${entry.file}`;
};

const pages = [
  {
    route: "/landing/torre-normal",
    title: "Torre La Previa 🎉 - El Juego que Prende la Reunión | ShotyGames Ecuador",
    description:
      "51 retos que convierten cualquier reunión en fiesta. Madera de pino premium. Reserva con $5 y paga el resto al recibir. Envío gratis a todo Ecuador.",
    image: resolveImage("src/assets/torre-normal-brillo.webp"),
    type: "product",
  },
  {
    route: "/landing/torre-picante",
    title: "Torre de Shots Picante 🌶️ - Retos Atrevidos | ShotyGames Ecuador",
    description:
      "51 retos atrevidos para grupos con confianza. Madera de pino premium. Reserva con $5 y paga el resto al recibir. Envío gratis a todo Ecuador.",
    image: resolveImage("src/assets/torre-picante-1.webp"),
    type: "product",
  },
  {
    route: "/landing/torre-parejas",
    title: "Torre de Shots Parejas ❤️ - Sal de la Rutina | ShotyGames Ecuador",
    description:
      "51 retos para dos que convierten una noche cualquiera en uno que van a recordar. Madera de pino premium. Reserva con $5 y paga el resto al recibir. Envío gratis a todo Ecuador.",
    image: resolveImage("src/assets/torre-parejas-1.webp"),
    type: "product",
  },
  {
    route: "/landing/partyshots",
    title: "Cartas PartyShots - Juego de Cartas para Beber | ShotyGames Ecuador",
    description:
      "Las cartas más divertidas para tu próxima fiesta. Para grupos de 2-10 personas. Con retos, preguntas y penitencias. Envíos a todo Ecuador.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/enganchados",
    title: "Enganchados - El Juego de Puntería para Fiestas | ShotyGames Ecuador",
    description:
      "Pon a prueba tu puntería, concentración y velocidad. El juego más adictivo para grupos. Envíos a todo Ecuador.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/emparejados",
    title: "Emparejados — 72 cartas para jugar en pareja | ShotyGames Ecuador",
    description:
      "72 cartas de Conexión, Deseo y Diversión. Lo juegas desde el celular y además lo puedes imprimir. Lo recibes en minutos por $6.90.",
    image: resolveImage("src/assets/emparejados-portada.jpg"),
    type: "product",
  },
  {
    route: "/landing/emparejados-imprimible",
    title: "Emparejados — 72 cartas imprimibles para parejas | ShotyGames Ecuador",
    description:
      "72 cartas de Conexión, Deseo y Diversión listas para imprimir hoy. También incluye la versión digital y la Guía de 30 Posiciones gratis. $6.90, pago único.",
    image: resolveImage("src/assets/emparejados-hero-imprimible.jpg"),
    type: "product",
  },
  {
    route: "/landing/emparejados-internacional",
    title: "Emparejados Internacional - Juego Digital para Parejas | ShotyGames",
    description:
      "El juego digital para parejas con acceso inmediato vía Hotmart. Conexión, deseo y diversión. Solo $3.90.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/dados-digitales",
    title: "Dados Digitales del Placer - Juego para Parejas | ShotyGames Ecuador",
    description:
      "Dados digitales con posiciones y retos para parejas. Acceso inmediato por solo $6.90. Enciende la pasión.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/promo-hoy",
    title: "Promo de Hoy - 2 Torres + Regalos con Envío Gratis | ShotyGames Ecuador",
    description:
      "Lleva 2 Torres de Shots a elegir + regalos digitales incluidos con envío gratis. Oferta por tiempo limitado.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/combo-torres",
    title: "Combo 2 Torres de Shots - Ahorra $12 | ShotyGames Ecuador",
    description:
      "Lleva 2 Torres de Shots + Shot Bidu de regalo + guías digitales. Ahorra $12 vs comprar por separado. Envíos a todo Ecuador.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/3-torres",
    title: "Las 3 Torres de Shots | Desde $28 con Envío Gratis | ShotyGames Ecuador",
    description:
      "La Previa, Picante y Parejas. 51 retos en cada una. Llévate las 3 por $49 con envío gratis a todo Ecuador.",
    image: fallbackImage,
    type: "product",
  },
  {
    route: "/landing/combo-chuchaqui",
    title: "Combo Chuchaqui - Pack Completo para tu Fiesta | ShotyGames Ecuador",
    description:
      "3 Torres + Enganchados + botella de regalo + guías digitales. El pack definitivo para fiestas épicas. Envíos a todo Ecuador.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/combo-la-previa",
    title: "Combo La Previa - Kit de Fiesta Completo | ShotyGames Ecuador",
    description:
      "2 Torres + Enganchados + Shot Bidu + guías digitales. El kit perfecto para arrancar la noche. Envíos a todo Ecuador.",
    image: fallbackImage,
    type: "website",
  },
  {
    route: "/landing/combo-parejas",
    title: "Combo Parejas 🔥 3 juegos + 2 guías por $35 | ShotyGames Ecuador",
    description:
      "Torre Parejas + Dados del Placer + Emparejados digital, y esta semana 2 guías digitales de regalo. Todo por $35 con envío incluido. Reserva con $5 y paga el resto al recibir.",
    image: resolveImage("src/assets/combo-parejas-pareja-hero.webp"),
    type: "product",
  },
  {
    route: "/landing/25-juegos-fiestas",
    title: "Guía Digital de 20 Juegos para Fiestas | ShotyGames",
    description:
      "Guía práctica en PDF con 20 juegos para animar reuniones, cenas y previas. Descarga inmediata por solo $4.90",
    image: fallbackImage,
    type: "product",
  },
  {
    route: "/landing/guia-del-placer",
    title: "Guía Digital del Placer - Reconecta con tu pareja | ShotyGames",
    description:
      "Ideas prácticas y experiencias para encender la pasión en pareja. Guía digital PDF con descarga inmediata. Oferta de lanzamiento $6.90",
    image: fallbackImage,
    type: "product",
  },
];

const template = readFileSync(path.join(distDir, "index.html"), "utf-8");

const escapeAttr = (s) => s.replace(/"/g, "&quot;");
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let written = 0;
for (const page of pages) {
  const canonical = `${site}${page.route}`;
  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);

  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeAttr(page.description)}">`,
  );
  html = html.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeAttr(page.title)}">`,
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeAttr(page.description)}">`,
  );
  // og:image y og:type vienen en index.html como tags self-closing
  // (`content="..." />`), a diferencia de og:title/og:description que no
  // llevan la barra. [^>]* cubre ambos formatos sin depender de eso.
  html = html.replace(
    /<meta property="og:image"[^>]*>/,
    `<meta property="og:image" content="${escapeAttr(page.image)}">`,
  );
  html = html.replace(
    /<meta property="og:type"[^>]*>/,
    `<meta property="og:type" content="${escapeAttr(page.type)}">`,
  );
  if (!/<meta property="og:url"/.test(html)) {
    html = html.replace(
      "</head>",
      `  <meta property="og:url" content="${escapeAttr(canonical)}">\n  </head>`,
    );
  } else {
    html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${escapeAttr(canonical)}">`);
  }
  html = html.replace(
    /<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeAttr(page.title)}">`,
  );
  html = html.replace(
    /<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeAttr(page.description)}">`,
  );
  html = html.replace(
    /<meta name="twitter:image"[^>]*>/,
    `<meta name="twitter:image" content="${escapeAttr(page.image)}">`,
  );
  if (!/rel="canonical"/.test(html)) {
    html = html.replace(
      "</head>",
      `  <link rel="canonical" href="${escapeAttr(canonical)}">\n  </head>`,
    );
  } else {
    html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escapeAttr(canonical)}">`);
  }

  const outDir = path.join(distDir, page.route.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), html);
  written += 1;
}

console.log(`[prerender-seo] ${written} páginas con título/og:image propios generadas en dist/`);
