import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { leerTodo } from '@/lib/datos';
import { streamChat } from '@/lib/ia';

export const maxDuration = 120;

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

interface Cuerpo {
  mensajes?: MensajeChat[];
  /** Foto del último mensaje, como data URL JPEG. Las anteriores no se reenvían. */
  imagen?: string;
  /** El mensaje llegó por voz y la respuesta se va a escuchar. */
  voz?: boolean;
}

const IMAGEN = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

const NOTA_VOZ =
  '\n\n(Fabián mandó esto por audio y va a ESCUCHAR tu respuesta: máximo 80 palabras, frases cortas como si hablaras, sin tablas, listas ni markdown. Termina con la acción concreta.)';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Cuerpo | null;
  const mensajes = (body?.mensajes ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20); // contexto acotado: la foto del momento ya trae el estado, el historial largo no aporta
  if (!mensajes.length || mensajes[0].role !== 'user' || mensajes[mensajes.length - 1].role !== 'user') {
    return new Response('Falta el mensaje', { status: 400 });
  }

  const ultimo = mensajes[mensajes.length - 1];
  const texto = ultimo.content + (body?.voz ? NOTA_VOZ : '');
  let contenido: Anthropic.Beta.BetaMessageParam['content'] = texto;
  if (body?.imagen) {
    const m = IMAGEN.exec(body.imagen);
    if (!m) return new Response('Imagen inválida', { status: 400 });
    contenido = [
      { type: 'image', source: { type: 'base64', media_type: `image/${m[1]}` as 'image/jpeg', data: m[2] } },
      { type: 'text', text: texto },
    ];
  }
  const conversacion: Anthropic.Beta.BetaMessageParam[] = [...mensajes.slice(0, -1), { role: 'user', content: contenido }];

  const datos = await leerTodo();
  const stream = streamChat(datos, conversacion);
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        stream.on('text', (delta) => controller.enqueue(encoder.encode(delta)));
        try {
          const final = await stream.finalMessage();
          if (final.stop_reason === 'refusal') {
            controller.enqueue(encoder.encode('\n\n(La IA no respondió esto. Reformúlalo.)'));
          } else if (final.stop_reason === 'max_tokens') {
            controller.enqueue(encoder.encode('\n\n(…respuesta cortada por largo)'));
          }
        } catch (e) {
          const msg =
            e instanceof Anthropic.RateLimitError
              ? 'Límite de uso de la IA, espera un minuto.'
              : e instanceof Anthropic.APIError
                ? `Error de la IA (${e.status}).`
                : 'Se cortó la conexión con la IA.';
          controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    }),
    { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } }
  );
}
