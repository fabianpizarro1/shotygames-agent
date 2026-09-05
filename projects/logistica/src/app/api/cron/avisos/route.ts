// GET /api/cron/avisos — el ÚNICO punto que le escribe a un cliente sin que
// Fabián toque nada. Avisa que el paquete ya llegó a su ciudad.
//
// ⚠️ Manda WhatsApps reales. Cuatro candados, en este orden:
//
//  1. **Secreto.** Sin `CRON_SECRET` correcto no corre. Vercel lo manda solo en
//     sus cron jobs; a mano hay que pasarlo en el header.
//  2. **Solo ShotyGames.** Es el único Sheet con columna LOG WA, que es donde
//     queda la marca de "ya avisado". Sin un lugar donde anotarlo, el aviso se
//     repetiría cada corrida. Truquito y Avanora quedan afuera hasta que ese
//     Sheet tenga su columna.
//  3. **Horario.** Entre las 9:00 y las 20:00 de Ecuador. Un mensaje comercial
//     a las 3 de la mañana molesta más de lo que ayuda.
//  4. **Una sola vez.** Se marca `ciudad|fecha` en LOG WA. La misma marca que
//     usa el selector de plantillas, así que en la app se ve como enviada.
//
// `?simular=1` hace todo menos mandar: sirve para ver a quién le escribiría.

import { NextRequest, NextResponse } from 'next/server';
import { construirCola } from '@/lib/cola';
import { PLANTILLAS, marcasEnviadas, serializarMarcas } from '@/lib/plantillas';
import * as shotygames from '@/lib/sheet-shotygames';
import { enviarWhatsApp } from '@/lib/whatsapp-shotygames';
import { hoyEC } from '@/lib/fechas';
import type { Pedido } from '@/lib/tipos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Franja en la que se permite escribir, hora de Ecuador. */
const DESDE = 9;
const HASTA = 20;

const horaEC = () =>
  Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Guayaquil',
      hour: '2-digit',
      hour12: false,
    }).format(new Date())
  );

export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ ok: false, error: 'Falta CRON_SECRET' }, { status: 500 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const simular = req.nextUrl.searchParams.get('simular') === '1';

  const hora = horaEC();
  if (!simular && (hora < DESDE || hora >= HASTA)) {
    return NextResponse.json({
      ok: true,
      omitido: `Fuera de horario (${hora}:00 en Ecuador; se escribe de ${DESDE} a ${HASTA})`,
      enviados: 0,
    });
  }

  const plantilla = PLANTILLAS.find((p) => p.id === 'ciudad');
  if (!plantilla) {
    return NextResponse.json({ ok: false, error: 'Falta la plantilla "ciudad"' }, { status: 500 });
  }

  const { pedidos, fallos } = await construirCola();

  const candidatos = pedidos.filter(
    (p) =>
      p.negocio === 'shotygames' &&
      // Solo cuando llegó a SU ciudad y todavía se está moviendo. Si ya está
      // en agencia o ya salió a entrega le corresponde otro mensaje, no este.
      p.momento === 'en-ciudad' &&
      !marcasEnviadas(p.logWa).ciudad &&
      p.telefono
  );

  const enviados: string[] = [];
  const errores: string[] = [];

  for (const p of candidatos) {
    try {
      if (!simular) {
        await enviarWhatsApp(p.telefono, plantilla.texto(p));
        await marcar(p);
      }
      enviados.push(`${p.nombre} (${p.ciudad})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[cron avisos] ${p.nombre}:`, msg);
      errores.push(`${p.nombre}: ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    simulado: simular,
    revisados: pedidos.length,
    enviados: enviados.length,
    aQuienes: enviados,
    errores,
    fallos,
  });
}

/** Deja la marca en LOG WA para que el aviso no se repita nunca. */
async function marcar(p: Pedido): Promise<void> {
  const { datos, C } = await shotygames.leerFila(p.fila);
  if (C.LOG_WA === undefined) throw new Error('Falta la columna "LOG WA"');

  // Relectura fresca: entre que se armó la cola y ahora, la app o finanzas-app
  // pudieron escribir otra marca en la misma celda.
  const marcas = marcasEnviadas(String(datos[C.LOG_WA] ?? ''));
  const hora = new Date(Date.now() - 5 * 3600000).toISOString().slice(11, 16);
  marcas.ciudad = `${hoyEC()} ${hora}`;

  await shotygames.escribirCelda(p.fila, C.LOG_WA, serializarMarcas(marcas));
}
