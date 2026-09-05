// POST /api/pedidos/plantilla — marca o desmarca una plantilla de WhatsApp.
//
// Se escribe en la columna **LOG WA** (AO) y NO en LOG: el disparador del
// agradecimiento sobreescribe LOG en cada envío y se llevaría el historial por
// delante. Mismo criterio que `/api/logistica/log` de finanzas-app, y el mismo
// formato ("id|fecha ; id|fecha") para que lo que se marcó allá se siga viendo.
//
// La marca se pone sola al abrir WhatsApp con el mensaje listo, pero WhatsApp
// no avisa si de verdad se envió — por eso se puede desmarcar a mano. Es el
// registro de lo que Fabián dice que mandó, no una confirmación de entrega.
//
// Solo ShotyGames: el Sheet de dropshipping no tiene esa columna y agregarla
// toca su encabezado, que no se hace sin preguntar.

import { NextRequest, NextResponse } from 'next/server';
import * as shotygames from '@/lib/sheet-shotygames';
import { marcasEnviadas, serializarMarcas } from '@/lib/plantillas';
import { hoyEC } from '@/lib/fechas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { negocio, fila, clave, plantilla, enviado = true } = await req.json();

    if (negocio !== 'shotygames') {
      return NextResponse.json(
        { ok: false, error: 'Solo ShotyGames registra las plantillas enviadas' },
        { status: 400 }
      );
    }
    if (!fila || !clave || !plantilla) {
      return NextResponse.json(
        { ok: false, error: 'Faltan fila, clave o plantilla' },
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

    const marcas = marcasEnviadas(String(datos[C.LOG_WA] ?? ''));
    if (enviado) {
      const hora = new Date(Date.now() - 5 * 3600000).toISOString().slice(11, 16); // Ecuador
      marcas[plantilla] = `${hoyEC()} ${hora}`;
    } else {
      delete marcas[plantilla];
    }

    await shotygames.escribirCelda(fila, C.LOG_WA, serializarMarcas(marcas));

    return NextResponse.json({ ok: true, logWa: serializarMarcas(marcas) });
  } catch (e) {
    console.error('POST /api/pedidos/plantilla', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
