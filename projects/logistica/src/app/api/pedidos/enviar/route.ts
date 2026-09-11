// POST /api/pedidos/enviar — manda la plantilla por Evolution API y la marca.
//
// Existe para que los mensajes puedan llevar EMOJI: por `wa.me` no sobreviven
// (probado 2026-09-10), por la API sí. Ver la cabecera de `plantillas.ts`.
//
// ⚠️ MANDA UN WHATSAPP REAL A UN CLIENTE REAL. Los candados, en orden:
//
//  1. **Solo ShotyGames.** Es la única tienda con instancia de Evolution en esta
//     app (`EVOLUTION_INSTANCE_ID`) y la única con columna LOG WA donde anotar.
//     Truquito y Avanora siguen por `wa.me`.
//  2. **La fila tiene que seguir siendo el mismo pedido.** Se compara la clave
//     NOMBRE+TELÉFONO contra el Sheet; si no coincide, 409 y no se manda nada.
//  3. **El teléfono sale del SHEET, nunca del navegador.** Lo único que viaja
//     desde el cliente es el texto que Fabián confirmó en pantalla — el destino
//     lo decide el servidor, así que un texto manipulado no puede redirigirse.
//  4. **La marca se escribe DESPUÉS del envío.** Si el WhatsApp falla, la
//     plantilla no queda marcada como enviada: sería mentira.
//
// No hay candado de duplicados acá, a propósito: reenviar una plantilla a mano
// es algo que Fabián hace queriendo (el cliente no contestó, se le perdió el
// mensaje). Lo que sí se ve es la marca con fecha, para que sepa que ya la mandó.

import { NextRequest, NextResponse } from 'next/server';
import * as shotygames from '@/lib/sheet-shotygames';
import { PLANTILLAS, marcasEnviadas, serializarMarcas } from '@/lib/plantillas';
import { enviarWhatsApp } from '@/lib/whatsapp-shotygames';
import { hoyEC } from '@/lib/fechas';

export const dynamic = 'force-dynamic';

/** Tope defensivo: WhatsApp corta cerca de los 4096 y nada nuestro se acerca. */
const MAX_TEXTO = 4000;

export async function POST(req: NextRequest) {
  try {
    const { negocio, fila, clave, plantilla, texto } = await req.json();

    if (negocio !== 'shotygames') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Solo ShotyGames puede enviar desde la app: Truquito y Avanora no tienen instancia de Evolution acá. Usá el botón de abrir WhatsApp.',
        },
        { status: 400 }
      );
    }
    if (!fila || !clave || !plantilla) {
      return NextResponse.json({ ok: false, error: 'Faltan fila, clave o plantilla' }, { status: 400 });
    }
    // La plantilla tiene que ser una de las nuestras: así un id inventado no
    // escribe basura en LOG WA.
    if (!PLANTILLAS.some((pl) => pl.id === plantilla) || plantilla === 'libre') {
      return NextResponse.json({ ok: false, error: `Plantilla desconocida: ${plantilla}` }, { status: 400 });
    }
    const cuerpo = String(texto ?? '').trim();
    if (!cuerpo) {
      return NextResponse.json({ ok: false, error: 'El mensaje está vacío' }, { status: 400 });
    }
    if (cuerpo.length > MAX_TEXTO) {
      return NextResponse.json(
        { ok: false, error: `El mensaje es demasiado largo (${cuerpo.length} caracteres)` },
        { status: 400 }
      );
    }

    // Lectura fresca: pudo cambiar desde otro dispositivo o desde finanzas-app.
    const { datos, C } = await shotygames.leerFila(fila);
    if (C.LOG_WA === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Falta la columna "LOG WA" en el Sheet de ShotyGames' },
        { status: 400 }
      );
    }

    const claveReal = shotygames.claveDe(datos[C.NOMBRE], datos[C.TELEFONO]);
    if (claveReal !== clave) {
      return NextResponse.json(
        { ok: false, error: `La fila ${fila} ya no es el mismo pedido. Recargá la cola.` },
        { status: 409 }
      );
    }

    const telefono = String(datos[C.TELEFONO] ?? '').trim();
    if (!telefono) {
      return NextResponse.json({ ok: false, error: 'El pedido no tiene teléfono' }, { status: 400 });
    }

    // Primero manda; si esto tira, no se marca nada.
    await enviarWhatsApp(telefono, cuerpo);

    const marcas = marcasEnviadas(String(datos[C.LOG_WA] ?? ''));
    const hora = new Date(Date.now() - 5 * 3600000).toISOString().slice(11, 16); // Ecuador
    marcas[plantilla] = `${hoyEC()} ${hora}`;
    await shotygames.escribirCelda(fila, C.LOG_WA, serializarMarcas(marcas));

    return NextResponse.json({ ok: true, logWa: serializarMarcas(marcas) });
  } catch (e) {
    console.error('POST /api/pedidos/enviar', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
