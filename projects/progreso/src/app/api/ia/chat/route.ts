import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { leerTodo } from '@/lib/datos';
import { chat } from '@/lib/ia';

// Planificar una semana son varias vueltas de herramientas (~40-60 s).
export const maxDuration = 300;

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

const SEP = '\u001e';

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
  const encoder = new TextEncoder();
  const corte = new AbortController();

  return new Response(
    new ReadableStream({
      async start(controller) {
        const emitir = (t: string) => controller.enqueue(encoder.encode(t));
        // El estado viaja dentro del mismo stream de texto, entre dos
        // separadores (U+001E) que el cliente quita antes de mostrar.
        const estado = (t: string) => emitir(`${SEP}${t}${SEP}`);
        try {
          const r = await chat(datos, conversacion, emitir, estado, corte.signal);
          if (r.stop === 'refusal') emitir('\n\n(La IA no respondió esto. Reformúlalo.)');
          else if (r.stop === 'max_tokens') emitir('\n\n(…respuesta cortada por largo)');
        } catch (e) {
          if (corte.signal.aborted) return;
          const msg =
            e instanceof Anthropic.RateLimitError
              ? 'Límite de uso de la IA, espera un minuto.'
              : e instanceof Anthropic.APIError
                ? `Error de la IA (${e.status}).`
                : 'Se cortó la conexión con la IA.';
          emitir(`\n\n⚠️ ${msg}`);
        } finally {
          try {
            controller.close();
          } catch {}
        }
      },
      cancel() {
        corte.abort();
      },
    }),
    { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } }
  );
}
