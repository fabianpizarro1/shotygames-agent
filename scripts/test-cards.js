const fs   = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('/tmp/pdftest/node_modules/pdf-lib');

function primerNombre(nombreCompleto) {
  const first = (nombreCompleto || '').trim().split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function drawCentered(page, text, centerX, y, font, size, color) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - w / 2, y, size, font, color });
}

// Mensaje de agradecimiento — líneas ya definidas (centradas individualmente)
const MENSAJE = [
  { text: 'Te queremos expresar nuestro mas sincero', bold: false },
  { text: 'agradecimiento por confiar en nosotros y por', bold: false },
  { text: 'permitirnos brindarte una experiencia unica', bold: false },
  { text: 'e inolvidable con nuestros productos.', bold: false },
  { text: '', bold: false }, // espacio
  { text: 'A partir de hoy tus fiestas y reuniones seran', bold: false },
  { text: 'otro nivel y nos emociona saber que seremos', bold: false },
  { text: 'parte de ello.', bold: false },
  { text: '', bold: false },
  { text: 'Esperamos que te diviertas y disfrutes con', bold: false },
  { text: 'cada uno de nuestros productos junto a tus', bold: false },
  { text: 'amigos y seres queridos.', bold: false },
  { text: '', bold: false },
  { text: 'Con gratitud y emocion,', bold: true },
  { text: 'El equipo de SHOTYGAMES EC', bold: true },
];

(async () => {
  console.log('Generando tarjetas...');

  // Template (3): área de contenido limpia + redes/etiquétennos ya diseñados
  const templateBytes = fs.readFileSync('/Users/user/Downloads/Mensaje de Gracias A4 (3).pdf');
  const templateDoc   = await PDFDocument.load(templateBytes);

  const doc      = await PDFDocument.create();
  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pedidos = [
    { nombre: 'MARIA JOSE LOPEZ' },
    { nombre: 'CARLOS ANDRES TORRES' },
    { nombre: 'VALENTINA GUERRERO' },
    { nombre: 'SEBASTIAN PIZARRO' },
  ];

  const A4_W = 595.28;
  const A4_H = 841.89;
  const cellW = A4_W / 2;
  const cellH = A4_H / 2;

  const cells = [
    { ox: 0,     oy: cellH },
    { ox: cellW, oy: cellH },
    { ox: 0,     oy: 0     },
    { ox: cellW, oy: 0     },
  ];

  const [tplPage] = await doc.embedPdf(templateDoc, [0]);

  // Emoji 👋
  const emojiBytes = fs.readFileSync(path.join(__dirname, 'assets', 'emoji-wave.png'));
  const emojiImg   = await doc.embedPng(emojiBytes);

  const BLACK = rgb(0.08, 0.08, 0.08);
  const WHITE = rgb(1, 1, 1);

  for (let pageStart = 0; pageStart < pedidos.length; pageStart += 4) {
    const page  = doc.addPage([A4_W, A4_H]);
    const group = pedidos.slice(pageStart, pageStart + 4);

    for (let ci = 0; ci < group.length; ci++) {
      const { ox, oy } = cells[ci];
      const nombre  = primerNombre(group[ci].nombre);
      const centerX = ox + cellW / 2;

      // ── 1. Fondo: template completo escalado ────────────────────────────
      page.drawPage(tplPage, { x: ox, y: oy, width: cellW, height: cellH });

      // ── 2. ¡HOLA [NOMBRE]! 👋 ───────────────────────────────────────────
      const holaSize  = 15;
      const holaText  = `¡HOLA ${nombre.toUpperCase()}!`;
      const holaNameY = oy + cellH * 0.908;
      const textW     = fontBold.widthOfTextAtSize(holaText, holaSize);
      const emojiSize = 15;
      const gap       = 4;
      const totalW    = textW + gap + emojiSize;
      const startX    = centerX - totalW / 2;
      page.drawText(holaText, { x: startX, y: holaNameY, size: holaSize, font: fontBold, color: BLACK });
      page.drawImage(emojiImg, { x: startX + textW + gap, y: holaNameY - 2, width: emojiSize, height: emojiSize });

      // ── 3. Mensaje de agradecimiento ── centrado entre nombre y redes ──
      const bodySize  = 11;
      const lineH     = 16;
      const BLANK_GAP = 5;

      // Límites del espacio disponible
      const nameBottom  = oy + cellH * 0.908 - holaSize; // base real del texto ¡HOLA!
      const socialsTop  = oy + 148;                       // tope de la sección de redes (escalada ×0.5)

      // Altura total del bloque de texto
      let totalBlockH = 0;
      for (const { text } of MENSAJE) {
        totalBlockH += text === '' ? BLANK_GAP : lineH;
      }

      // Centrar verticalmente en el espacio disponible
      const available = nameBottom - socialsTop;
      let curY = socialsTop + (available + totalBlockH) / 2;

      for (const { text, bold } of MENSAJE) {
        if (text === '') { curY -= BLANK_GAP; continue; }
        const f = bold ? fontBold : font;
        drawCentered(page, text, centerX, curY, f, bodySize, BLACK);
        curY -= lineH;
      }
    }

    // Líneas de corte — dibujadas al final para que queden encima del fondo
    const CUT = rgb(0.78, 0.78, 0.78);
    page.drawLine({ start: { x: cellW, y: 0 },    end: { x: cellW, y: A4_H }, thickness: 0.4, color: CUT });
    page.drawLine({ start: { x: 0,     y: cellH }, end: { x: A4_W, y: cellH }, thickness: 0.4, color: CUT });
  }

  const pdfBytes = await doc.save();
  fs.writeFileSync('/tmp/tarjetas-prueba.pdf', pdfBytes);
  console.log('PDF generado.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
