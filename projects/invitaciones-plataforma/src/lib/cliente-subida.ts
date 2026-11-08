// Subida desde el navegador: reduce las imágenes antes de enviarlas (una foto de iPhone pesa 4-8 MB;
// para la invitación basta con ~300 KB). Se manda en una sola petición (Vercel limita a ~4,5 MB).

async function reducirImagen(file: File, maxLado: number): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error('No se pudo leer la imagen. Usa JPG o PNG (las fotos HEIC se convierten solas en el celular).');
  const k = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  // PNG/WebP pueden tener transparencia (stickers): se conservan como PNG.
  const conservarPng = file.type === 'image/png' || file.type === 'image/webp';
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, conservarPng ? 'image/png' : 'image/jpeg', 0.86));
  if (!blob) throw new Error('No se pudo procesar la imagen');
  return blob;
}

/** Imagen del editor → /media/<id> (solo el dueño del evento puede subir). */
export async function subirImagenEditor(eventoId: string, file: File, opciones: { maxLado?: number } = {}): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Solo se pueden subir imágenes.');
  const blob = await reducirImagen(file, opciones.maxLado ?? 1600);
  const r = await fetch(`/api/app/${eventoId}/subir`, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inválida' }));
  if (!r.ok || !j.ok) throw new Error(j.error || 'No se pudo subir');
  return j.url as string;
}

// ---- Fotos de la fiesta (invitados) ----
// Una foto de celular pesa 3-8 MB: se manda una versión de 1600 px (< 3 MB, límite del servidor)
// y una miniatura de 420 px (~25 KB) para que la galería cargue rápido.

async function aJpeg(bmp: ImageBitmap, maxLado: number, calidad: number): Promise<Blob> {
  const k = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', calidad));
  if (!blob) throw new Error('No se pudo procesar la foto');
  return blob;
}

export async function prepararFoto(file: File): Promise<{ foto: Blob; mini: Blob }> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error('No se pudo leer la foto');
  try {
    let foto = await aJpeg(bmp, 1600, 0.82);
    for (const [lado, q] of [[1400, 0.72], [1200, 0.65]] as const) {
      if (foto.size <= 2.8 * 1024 * 1024) break;
      foto = await aJpeg(bmp, lado, q);
    }
    return { foto, mini: await aJpeg(bmp, 420, 0.7) };
  } finally {
    bmp.close();
  }
}

// `ctx` identifica el evento: "e=<slug>" (QR general) o "t=<token>" (enlace personal).
export async function enviarFoto(partes: { foto: Blob; mini: Blob }, uploader: string, autor: string, ctx: string): Promise<void> {
  const base = `/api/fotos/subir?${ctx}&u=${encodeURIComponent(uploader)}`;
  const post = async (url: string, cuerpo: Blob) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: cuerpo });
    const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inválida' }));
    if (!r.ok || !j.ok) throw new Error(j.error || 'No se pudo subir');
    return j.id as string;
  };
  const th = await post(`${base}&tipo=mini`, partes.mini);
  await post(`${base}&tipo=foto&autor=${encodeURIComponent(autor)}&th=${encodeURIComponent(th)}`, partes.foto);
}
