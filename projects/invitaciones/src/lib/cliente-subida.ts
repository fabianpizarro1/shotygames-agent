// Subida desde el navegador: reduce las imágenes antes de enviarlas (una foto de
// iPhone pesa 4-8 MB; en la invitación basta con ~300 KB) y manda el archivo a la API en trozos.

const TROZO = 3 * 1024 * 1024; // múltiplo de 256 KB, exigido por Drive

async function reducirImagen(file: File, maxLado: number): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error('No se pudo leer la imagen. Usa JPG o PNG (las fotos HEIC se convierten solas en el celular).');
  const k = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  // PNG/WebP pueden tener transparencia (stickers): se conservan como PNG.
  const conservarPng = file.type === 'image/png' || file.type === 'image/webp';
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, conservarPng ? 'image/png' : 'image/jpeg', 0.86));
  if (!blob) throw new Error('No se pudo procesar la imagen');
  return blob;
}

export async function subirArchivo(file: File, opciones: { maxLado?: number; alProgreso?: (p: number) => void } = {}): Promise<string> {
  const esImagen = file.type.startsWith('image/');
  const blob: Blob = esImagen ? await reducirImagen(file, opciones.maxLado ?? 1600) : file;
  const tipo = esImagen ? blob.type : file.type || 'audio/mpeg';

  const ini = await (await fetch('/api/admin/subir/iniciar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: file.name, tipo, bytes: blob.size }),
  })).json();
  if (!ini.ok) throw new Error(ini.error || 'No se pudo iniciar la subida');

  for (let inicio = 0; inicio < blob.size; inicio += TROZO) {
    const parte = blob.slice(inicio, Math.min(inicio + TROZO, blob.size));
    const r = await (await fetch(
      `/api/admin/subir/trozo?sesion=${encodeURIComponent(ini.sesion)}&inicio=${inicio}&total=${blob.size}`,
      { method: 'POST', body: parte },
    )).json();
    if (!r.ok) throw new Error(r.error || 'Falló la subida');
    opciones.alProgreso?.(Math.min(1, (inicio + parte.size) / blob.size));
    if (r.listo) return r.url as string;
  }
  throw new Error('La subida no terminó');
}
