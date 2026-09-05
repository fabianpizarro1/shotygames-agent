// POST /api/pedidos/actualizar — el único punto que ESCRIBE en los Sheets.
//
// Tres candados, porque acá se toca la fuente de verdad de la operación:
//
//  1. Antes de escribir se relee la fila y se compara su clave con la que mandó
//     el cliente. Si no coinciden, la fila se movió y escribir ahí le cambiaría
//     el estado a OTRO pedido. La clave es el ID PEDIDO en dropshipping y
//     nombre+teléfono en ShotyGames, donde la columna ID vale "1" en todas las
//     filas y no identifica nada.
//  2. Solo se aceptan `estado` y `notas`. Nada de reenviar un objeto entero y
//     dejar que el servidor escriba lo que venga.
//  3. El estado tiene que ser uno de los literales del negocio que corresponde.
//     Escribir "DEVUELTO" en el Sheet de ShotyGames —que usa "DEVOLUCION"— deja
//     la celda fuera del desplegable de la hoja DATOS y los filtros del Sheet
//     dejan de verla.

import { NextRequest, NextResponse } from 'next/server';
import * as dropshipping from '@/lib/sheet';
import * as shotygames from '@/lib/sheet-shotygames';
import { norm, type Negocio } from '@/lib/negocios';
import { esEstadoValido } from '@/lib/estados';
import { ahoraEC } from '@/lib/fechas';
import { dispararPorEstado } from '@/lib/whatsapp-shotygames';

export const dynamic = 'force-dynamic';

interface Cuerpo {
  negocio?: Negocio;
  fila?: number;
  /** Lo que la app cree que identifica esa fila. Obligatorio. */
  clave?: string;
  estado?: string;
  notas?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { negocio, fila, clave, estado, notas } = (await req.json()) as Cuerpo;

    if (negocio !== 'dropshipping' && negocio !== 'shotygames') {
      return NextResponse.json({ ok: false, error: 'Negocio inválido' }, { status: 400 });
    }
    if (!fila || !Number.isInteger(fila) || fila < 2) {
      return NextResponse.json({ ok: false, error: 'Fila inválida' }, { status: 400 });
    }
    if (!clave) {
      return NextResponse.json({ ok: false, error: 'Falta la clave del pedido' }, { status: 400 });
    }
    if (estado === undefined && notas === undefined) {
      return NextResponse.json({ ok: false, error: 'No hay nada que cambiar' }, { status: 400 });
    }

    if (estado !== undefined) {
      const valido = await esEstadoValido(negocio, estado);
      if (!valido) {
        return NextResponse.json(
          { ok: false, error: `"${estado}" no es un estado válido en ${negocio}` },
          { status: 400 }
        );
      }
    }

    if (negocio === 'dropshipping') {
      const error = await escribirDropshipping(fila, clave, { estado, notas });
      if (error) return NextResponse.json({ ok: false, error }, { status: 409 });
      return NextResponse.json({ ok: true, fila });
    }

    const { error, antes } = await shotygames.actualizarFila(fila, clave, { estado, notas });
    if (error) return NextResponse.json({ ok: false, error }, { status: 409 });

    // Los disparadores que ya existían en adm.shotygames.com: cambiar el estado
    // a ENTREGADO o PAGADO manda el WhatsApp de agradecimiento, con el mismo
    // candado (columna LOG) para no escribirle dos veces al cliente.
    //
    // Corre DESPUÉS de escribir y nunca tira: el estado ya quedó guardado, así
    // que un fallo de WhatsApp se informa pero no deshace nada.
    let disparador = null;
    if (estado !== undefined && antes) {
      disparador = await dispararPorEstado({
        fila,
        estadoNuevo: estado,
        nombre: antes.nombre,
        telefono: antes.telefono,
        logActual: antes.log,
        colLog: antes.colLog,
      });
    }

    return NextResponse.json({ ok: true, fila, disparador });
  } catch (e) {
    console.error('POST /api/pedidos/actualizar', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error escribiendo en el Sheet' },
      { status: 500 }
    );
  }
}

/**
 * Escritura en el Sheet de dropshipping. Además del estado sella las fechas de
 * control: se ponen solo si están vacías, porque reescribirlas borraría cuándo
 * pasó de verdad.
 */
async function escribirDropshipping(
  fila: number,
  clave: string,
  cambios: { estado?: string; notas?: string }
): Promise<string | null> {
  const { datos, C } = await dropshipping.leerFila(fila);
  const claveReal = String(datos[C.ID] ?? '').trim();

  if (claveReal !== clave) {
    return (
      `La fila ${fila} ya no es el pedido ${clave} (ahora tiene "${claveReal || 'vacío'}"). ` +
      'Recargá la cola antes de volver a intentar.'
    );
  }

  const campos: Record<string, string | number> = {};
  if (cambios.notas !== undefined) campos.NOTAS = cambios.notas;

  if (cambios.estado !== undefined) {
    campos.ESTADO = cambios.estado;

    const sello = (col: string) => {
      if (C[col] !== undefined && !String(datos[C[col]] ?? '').trim()) campos[col] = ahoraEC();
    };
    const e = norm(cambios.estado);
    if (e === 'ENTREGADO') sello('F_ENTREGA');
    if (e === 'PAGADO') {
      sello('F_ENTREGA');
      sello('F_PAGO');
    }
    if (e === 'GUIA_GENERADA') sello('F_GUIA');
  }

  await dropshipping.actualizarFila(fila, campos);
  return null;
}
