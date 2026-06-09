const axios = require('axios');
const { PDFDocument } = require('pdf-lib');

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
  const MARGIN = 6; // margen entre guías en puntos

  // Coordenadas de cada celda en la hoja (PDF: y=0 es abajo)
  const positions = [
    { x: 0,     y: cellH }, // arriba-izquierda
    { x: cellW, y: cellH }, // arriba-derecha
    { x: 0,     y: 0     }, // abajo-izquierda
    { x: cellW, y: 0     }, // abajo-derecha
  ];

  for (let i = 0; i < pdfBuffers.length; i += 4) {
    const page = outputDoc.addPage([A4_W, A4_H]);
    const group = pdfBuffers.slice(i, i + 4);

    for (let j = 0; j < group.length; j++) {
      try {
        const srcDoc = await PDFDocument.load(group[j]);
        const [embeddedPage] = await outputDoc.embedPdf(srcDoc, [0]);

        const { width, height } = embeddedPage;

        // Escalar para que quepa en la celda con margen
        const availW = cellW - MARGIN * 2;
        const availH = cellH - MARGIN * 2;
        const scale  = Math.min(availW / width, availH / height);

        const scaledW = width  * scale;
        const scaledH = height * scale;

        // Centrar dentro de la celda
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

module.exports = { downloadPdf, merge4Up };
