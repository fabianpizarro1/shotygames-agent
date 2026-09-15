// POST /api/recuperacion/actualizar — lo único que ESCRIBE en "PEDIDOS LOVABLE".
//
// Los mismos candados que `/api/pedidos/actualizar`:
//
//  1. Se relee la fila y se compara su `ID` (`PED-XXXXX`) con el que mandó la
//     app. Si no coincide, la fila se movió y escribir ahí le cambiaría el
//     estado a OTRO cliente.
//  2. Solo se aceptan tres cosas: el estado, la nota y la marca de aviso. Nada
//     de mandar un objeto entero y dejar que el servidor escriba lo que venga.
//  3. El estado tiene que ser uno de los literales que la hoja acepta en su
//     validación (`DATOS!C2:C19`). Escribir cualquier otra cosa deja la celda
//     fuera del desplegable y los filtros del Sheet dejan de verla.
//
// La marca de aviso NO se pisa: se relee el LOG WA y se toca solo la entrada de
// esa plantilla, para no perder las otras si dos pestañas escriben. `enviado`
// decide si se marca o se desmarca — **nunca se marca sola al abrir WhatsApp**,
// ver `marcarAviso` en `recuperacion-tipos.ts`.

import { NextRequest, NextResponse } from 'next/server';
import { actualizarFila, leerFila } from '@/lib/sheet-lovable';
import { marcarAviso } from '@/lib/recuperacion-tipos';
import { estadosDeLaHojaWeb } from '@/lib/estados-web';
import { PLANTILLAS_RECUPERACION } from '@/lib/plantillas-recuperacion';
import { selloEC } from '@/lib/fechas';

export const dynamic = 'force-dynamic';

interface Cuerpo {
  fila?: number;
  /** El `PED-XXXXX`. Obligatorio: es el candado de la fila. */
  id?: string;
  estado?: string;
  nota?: string;
  /** Id de la plantilla a marcar o desmarcar en el LOG WA. */
  aviso?: string;
  /** `true` marca, `false` desmarca. Lo decide Fabián con el check. */
  enviado?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { fila, id, estado, nota, aviso, enviado = true } = (await req.json()) as Cuerpo;

    if (!fila || !Number.isInteger(fila) || fila < 2) {
      return NextResponse.json({ ok: false, error: 'Fila inválida' }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Falta el código del pedido' }, { status: 400 });
    }
    if (estado === undefined && nota === undefined && !aviso) {
      return NextResponse.json({ ok: false, error: 'No hay nada que cambiar' }, { status: 400 });
    }

    if (estado !== undefined) {
      const validos = await estadosDeLaHojaWeb();
      if (!validos.includes(estado.toUpperCase())) {
        return NextResponse.json(
          {
            ok: false,
            error:
              `"${estado}" no está en la validación de la hoja web. ` +
              `Los que acepta son: ${validos.join(', ')}.`,
          },
          { status: 400 }
        );
      }
    }

    if (aviso && !PLANTILLAS_RECUPERACION.some((p) => p.id === aviso)) {
      return NextResponse.json({ ok: false, error: 'Plantilla desconocida' }, { status: 400 });
    }

    // El LOG WA se lee ANTES de escribir y se le AGREGA la marca. Pisarlo con
    // solo la última perdería el historial de a quién ya se le escribió, que es
    // justamente lo que esta pantalla vino a resolver.
    let logWa: string | undefined;
    if (aviso) {
      const { datos, C } = await leerFila(fila);
      if (C.LOG_WA === undefined) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'La hoja web no tiene la columna LOG WA. Corré ' +
              '`node scripts/preparar-recuperacion.js` una vez para agregarla.',
          },
          { status: 400 }
        );
      }
      logWa = marcarAviso(String(datos[C.LOG_WA] ?? ''), aviso, selloEC(), enviado);
    }

    const { error } = await actualizarFila(fila, id, { estado, nota, logWa });
    if (error) return NextResponse.json({ ok: false, error }, { status: 409 });

    return NextResponse.json({ ok: true, fila, logWa });
  } catch (e) {
    console.error('POST /api/recuperacion/actualizar', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error escribiendo en la hoja web' },
      { status: 500 }
    );
  }
}
