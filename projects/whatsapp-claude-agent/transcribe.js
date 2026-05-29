const Groq = require('groq-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');

let groqClient = null;
function getGroq() {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

// Transcribe un audio en base64 a texto usando Groq Whisper
// mimeType: 'audio/ogg', 'audio/mp4', 'audio/mpeg', etc.
async function transcribeBase64(base64, mimeType) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY no configurado');

  // Determinar extensión según el mime
  const ext = mimeType?.includes('ogg') ? 'ogg'
    : mimeType?.includes('mp4') ? 'mp4'
    : mimeType?.includes('mpeg') || mimeType?.includes('mp3') ? 'mp3'
    : mimeType?.includes('webm') ? 'webm'
    : 'ogg'; // WhatsApp Voice Notes suelen ser ogg/opus

  // Escribir a archivo temporal (Groq SDK necesita un File o stream)
  const tmpPath = path.join(os.tmpdir(), `wa_audio_${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, Buffer.from(base64, 'base64'));

  try {
    const groq = getGroq();
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: 'whisper-large-v3-turbo', // rápido y gratis
      language: 'es',
      response_format: 'text'
    });
    return typeof transcription === 'string' ? transcription.trim() : transcription?.text?.trim() || '';
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

module.exports = { transcribeBase64 };
