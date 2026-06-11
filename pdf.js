const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Descarga un PDF desde una URL y devuelve el buffer
async function downloadPdf(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return Buffer.from(res.data);
}

// Combina múltiples PDFs en páginas de 4 guías (2x2) por hoja A4
// Devuelve un Buffer con el PDF final
async function merge4Up(pdfBuffers) {
  const outputDoc = await PDFDocument.create();

  const A4_W = 595.28;
  const A4_H = 841.89;
  const cellW = A4_W / 2;
  const cellH = A4_H / 2;
  const MARGIN = 6;

  const positions = [
    { x: 0,     y: cellH },
    { x: cellW, y: cellH },
    { x: 0,     y: 0     },
    { x: cellW, y: 0     },
  ];

  for (let i = 0; i < pdfBuffers.length; i += 4) {
    const page = outputDoc.addPage([A4_W, A4_H]);
    const group = pdfBuffers.slice(i, i + 4);

    for (let j = 0; j < group.length; j++) {
      try {
        const srcDoc = await PDFDocument.load(group[j]);
        const [embeddedPage] = await outputDoc.embedPdf(srcDoc, [0]);
        const { width, height } = embeddedPage;
        const availW = cellW - MARGIN * 2;
        const availH = cellH - MARGIN * 2;
        const scale  = Math.min(availW / width, availH / height);
        const scaledW = width  * scale;
        const scaledH = height * scale;
        const x = positions[j].x + (cellW - scaledW) / 2;
        const y = positions[j].y + (cellH - scaledH) / 2;
        page.drawPage(embeddedPage, { x, y, width: scaledW, height: scaledH });
      } catch (e) {
        console.error(`pdf.js: error embebiendo guía ${i + j + 1}:`, e.message);
      }
    }
  }

  return Buffer.from(await outputDoc.save());
}

function primerNombre(nombreCompleto) {
  const first = (nombreCompleto || '').trim().split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function drawCentered(page, text, centerX, y, font, size, color) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - w / 2, y, size, font, color });
}

const MENSAJE_LINES = [
  { text: 'Te queremos expresar nuestro mas sincero', bold: false },
  { text: 'agradecimiento por confiar en nosotros y por', bold: false },
  { text: 'permitirnos brindarte una experiencia unica', bold: false },
  { text: 'e inolvidable con nuestros productos.', bold: false },
  { text: '', bold: false },
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

// Genera una hoja A4 con 4 tarjetas de agradecimiento (2x2)
// pedidos = [{ nombre: 'JUAN PEREZ' }, ...]
async function generateThankyouCards(pedidos) {
  const doc      = await PDFDocument.create();
  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Template y emoji desde assets
  const tplBytes   = fs.readFileSync(path.join(__dirname, 'assets', 'tarjeta-agradecimiento.pdf'));
  const tplDoc     = await PDFDocument.load(tplBytes);
  const [tplPage]  = await doc.embedPdf(tplDoc, [0]);

  const emojiBytes = fs.readFileSync(path.join(__dirname, 'assets', 'emoji-wave.png'));
  const emojiImg   = await doc.embedPng(emojiBytes);

  const BLACK = rgb(0.08, 0.08, 0.08);
  const CUT   = rgb(0.78, 0.78, 0.78);

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

  for (let pageStart = 0; pageStart < pedidos.length; pageStart += 4) {
    const page  = doc.addPage([A4_W, A4_H]);
    const group = pedidos.slice(pageStart, pageStart + 4);

    for (let ci = 0; ci < group.length; ci++) {
      const { ox, oy } = cells[ci];
      const nombre  = primerNombre(group[ci].nombre || '');
      const centerX = ox + cellW / 2;

      // Fondo
      page.drawPage(tplPage, { x: ox, y: oy, width: cellW, height: cellH });

      // ¡HOLA [NOMBRE]! 👋
      const holaSize = 15;
      const holaText = `¡HOLA ${nombre.toUpperCase()}!`;
      const holaY    = oy + cellH * 0.908;
      const textW    = fontBold.widthOfTextAtSize(holaText, holaSize);
      const emojiSz  = 15;
      const gap      = 4;
      const startX   = centerX - (textW + gap + emojiSz) / 2;
      page.drawText(holaText, { x: startX, y: holaY, size: holaSize, font: fontBold, color: BLACK });
      page.drawImage(emojiImg, { x: startX + textW + gap, y: holaY - 2, width: emojiSz, height: emojiSz });

      // Mensaje — centrado verticalmente entre nombre y redes
      const bodySize  = 11;
      const lineH     = 16;
      const BLANK_GAP = 5;
      const nameBottom = oy + cellH * 0.908 - holaSize;
      const socialsTop = oy + 148;

      let totalBlockH = 0;
      for (const { text } of MENSAJE_LINES) totalBlockH += text === '' ? BLANK_GAP : lineH;

      const available = nameBottom - socialsTop;
      let curY = socialsTop + (available + totalBlockH) / 2;

      for (const { text, bold } of MENSAJE_LINES) {
        if (text === '') { curY -= BLANK_GAP; continue; }
        drawCentered(page, text, centerX, curY, bold ? fontBold : font, bodySize, BLACK);
        curY -= lineH;
      }
    }

    // Líneas de corte — encima del fondo
    page.drawLine({ start: { x: cellW, y: 0 },    end: { x: cellW, y: A4_H }, thickness: 0.4, color: CUT });
    page.drawLine({ start: { x: 0,     y: cellH }, end: { x: A4_W, y: cellH }, thickness: 0.4, color: CUT });
  }

  return Buffer.from(await doc.save());
}

// Combina un buffer de guías y un buffer de tarjetas en un solo PDF
async function mergePdfs(bufferA, bufferB) {
  const docA = await PDFDocument.load(bufferA);
  const docB = await PDFDocument.load(bufferB);
  const merged = await PDFDocument.create();

  const pagesA = await merged.copyPages(docA, docA.getPageIndices());
  pagesA.forEach(p => merged.addPage(p));

  const pagesB = await merged.copyPages(docB, docB.getPageIndices());
  pagesB.forEach(p => merged.addPage(p));

  return Buffer.from(await merged.save());
}

module.exports = { downloadPdf, merge4Up, generateThankyouCards, mergePdfs };
