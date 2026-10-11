import 'server-only';

// Voz del chat: OpenAI transcribe los audios de Fabián y lee las respuestas.
// Claude no recibe ni genera audio; lo que entra y sale de Claude sigue
// siendo texto. Se usa fetch directo: son dos endpoints y no justifican un SDK.

import { IA_ACTIVA, MENSAJE_IA_APAGADA } from './ia-activa';

const API = 'https://api.openai.com/v1/audio';
const VOZ = 'ash';
const INSTRUCCIONES_VOZ =
  'Habla en español latinoamericano neutro, como un amigo de confianza: directo, seguro y cálido, a ritmo natural. Nada de tono de locutor ni de vendedor.';
// Límite del endpoint de voz.
const MAX_CARACTERES = 4096;

function clave(): string {
  if (!IA_ACTIVA) throw new Error(MENSAJE_IA_APAGADA);
  const k = process.env.OPENAI_API_KEY?.trim();
  if (!k) throw new Error('Falta OPENAI_API_KEY en el servidor');
  return k;
}

export async function transcribir(audio: Blob, nombre: string): Promise<string> {
  const form = new FormData();
  form.append('file', audio, nombre);
  form.append('model', 'gpt-4o-mini-transcribe');
  form.append('language', 'es');
  // Nombres que el modelo no adivina solo ("Farian", "Shoty Games").
  form.append('prompt', 'Fabián, ShotyGames, CandyShots, Nerea, Marcelo, Truquito, Avanora, DROPI, Meta Ads, Cartas Parejas, Product Lab, Top 3.');
  const r = await fetch(`${API}/transcriptions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${clave()}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Transcripción falló (${r.status})`);
  const { text } = (await r.json()) as { text?: string };
  return (text ?? '').trim();
}

/** Markdown → texto que se puede leer en voz alta. */
export function paraLeer(texto: string): string {
  const limpio = texto
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*\|?[-:| ]+\|?\s*$/gm, '') // separador de tabla
    .replace(/\|/g, ', ')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*•·]\s+/gm, '')
    .replace(/\*\*|__|`|\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (limpio.length <= MAX_CARACTERES) return limpio;
  // Cortar en el último punto antes del límite para no terminar a media palabra.
  const corte = limpio.lastIndexOf('.', MAX_CARACTERES - 1);
  return limpio.slice(0, corte > MAX_CARACTERES / 2 ? corte + 1 : MAX_CARACTERES);
}

export async function hablar(texto: string): Promise<Response> {
  const r = await fetch(`${API}/speech`, {
    method: 'POST',
    headers: { authorization: `Bearer ${clave()}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: VOZ,
      input: paraLeer(texto),
      instructions: INSTRUCCIONES_VOZ,
      response_format: 'mp3',
    }),
  });
  if (!r.ok || !r.body) throw new Error(`Voz falló (${r.status})`);
  return r;
}
