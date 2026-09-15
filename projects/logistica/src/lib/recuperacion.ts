// ============================================================
// RECUPERACIÓN DE PEDIDOS WEB — armado de la lista (SOLO SERVIDOR)
//
// Las reglas (baldes, umbrales, tipos) están en `recuperacion-tipos.ts`, que es
// lo que importan los componentes. Acá queda solo lo que toca Sheets, para que
// `googleapis` no termine en el bundle del navegador.
// ============================================================

import { diasEntre, hoyEC } from './fechas';
import {
  aPedidoWeb,
  idsYaVendidos,
  leerFilas,
  telefonoClave,
  telefonosConPedidoVivo,
} from './sheet-lovable';
import {
  ANTICIPO_ENVIO,
  avisosDe,
  baldeDe,
  RECUPERABLES,
  VENTANA_DIAS,
  type Balde,
  type Candidato,
  type Lista,
} from './recuperacion-tipos';

const redondear = (n: number) => Math.round(n * 100) / 100;

export async function construirLista(ventana = VENTANA_DIAS): Promise<Lista> {
  const hoy = hoyEC();

  // Las tres lecturas son independientes: en serie la pantalla tardaba el
  // triple para mostrar exactamente lo mismo.
  const [{ filas, C }, vendidos, vivos] = await Promise.all([
    leerFilas(),
    idsYaVendidos(),
    telefonosConPedidoVivo(),
  ]);

  const candidatos: Candidato[] = [];

  for (const f of filas) {
    const p = aPedidoWeb(f, C);
    if (!RECUPERABLES.includes(p.estado)) continue;

    // Ya se convirtió en venta real: la hoja oficial lo tiene con este mismo
    // código. El `ESTADO` de acá se quedó atrás.
    if (vendidos.has(p.id.toUpperCase())) continue;

    const dias = diasEntre(p.fecha || null, hoy);
    if (p.fecha && dias > ventana) continue;

    candidatos.push({
      ...p,
      dias,
      balde: baldeDe(p.dropi),
      tasaDevolucion:
        p.dropi && p.dropi.pedidos > 0
          ? Math.round((p.dropi.devueltos / p.dropi.pedidos) * 100)
          : null,
      avisos: avisosDe(p.logWa),
      avisoPedidoVivo: vivos.get(telefonoClave(p.telefono)) ?? null,
      saldoConAnticipo: redondear(Math.max(0, p.monto - ANTICIPO_ENVIO)),
    });
  }

  // Lo más fresco primero, y entre dos del mismo día el de más plata. Un
  // carrito de ayer se recupera; uno de hace tres semanas ya casi nunca.
  candidatos.sort((a, b) => a.dias - b.dias || b.monto - a.monto);

  const vacio = () => ({ pedidos: 0, monto: 0 });
  const porBalde: Record<Balde, { pedidos: number; monto: number }> = {
    riesgo: vacio(),
    limpio: vacio(),
    nuevo: vacio(),
  };
  for (const c of candidatos) {
    porBalde[c.balde].pedidos++;
    porBalde[c.balde].monto = redondear(porBalde[c.balde].monto + c.monto);
  }

  return {
    candidatos,
    resumen: {
      total: candidatos.length,
      monto: redondear(candidatos.reduce((a, c) => a + c.monto, 0)),
      porBalde,
      avisados: candidatos.filter((c) => c.avisos.length > 0).length,
    },
    hoy,
    ventana,
  };
}
