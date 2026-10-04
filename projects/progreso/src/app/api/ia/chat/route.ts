import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { leerTodo } from '@/lib/datos';
import { streamChat } from '@/lib/ia';

export const maxDuration = 120;

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { mensajes?: MensajeChat[] } | null;
  const mensajes = (body?.mensajes ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20); // contexto acotado: la foto del momento ya trae el estado, el historial largo no aporta
  if (!mensajes.length || mensajes[0].role !== 'user') {
    return new Response('Falta el mensaje', { status: 400 });
  }

  const datos = await leerTodo();
  const stream = streamChat(datos, mensajes);
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
