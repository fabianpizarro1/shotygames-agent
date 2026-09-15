// ============================================================
// COMPROBANTE PARA EL CLIENTE
//
// La única página de toda la app que NO la mira Fabián: la abre el cliente
// desde WhatsApp cuando se le pide el abono del envío. Por eso todo acá está
// pensado desde el otro lado del mostrador y no se parece al resto de la app:
// fondo claro como un recibo, sin jerga interna, sin nada que tocar.
//
// **Qué es y qué no es.** Es un comprobante de ShotyGames que CITA el sistema
// de la transportadora, con la fecha de consulta. No imita la pantalla de
// DROPI ni se presenta como un documento de ellos: eso sería fabricar el
// documento de un tercero, y además no hace falta — el dato es real y con
// decir de dónde sale alcanza.
//
// El historial se consulta EN VIVO contra DROPI (cacheado 10 min), no se lee de
// la hoja: si el cliente abre el link dos días después, ve el dato de hoy.
// ============================================================

import { notFound } from 'next/navigation';
import { idDelCodigo } from '@/lib/comprobante';
import { dropiShotygames } from '@/lib/dropi';
import { aPedidoWeb, leerFilas } from '@/lib/sheet-lovable';
import { ANTICIPO_ENVIO } from '@/lib/recuperacion-tipos';

export const dynamic = 'force-dynamic';

// No debe aparecer en Google: son datos de una persona.
export const metadata = {
  title: 'Tu pedido · ShotyGames',
  robots: { index: false, follow: false },
};

const usd = (n: number) => '$' + (Number(n) || 0).toFixed(2);

/** "$5" para cifras redondas, igual que en el mensaje de WhatsApp. */
const usdCorto = (n: number) => (Number.isInteger(n) ? '$' + n : usd(n));

const tituloCiudad = (s: string) => {
  const menores = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en']);
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i > 0 && menores.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
};

export default async function Comprobante({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  // Firma inválida → 404 pelado, no un "código incorrecto": un mensaje de error
  // distinto le confirmaría a quien esté probando códigos que el id existe.
  const id = idDelCodigo(decodeURIComponent(codigo));
  if (!id) notFound();

  // Si la hoja no contesta no se muestra un comprobante a medias: el cliente
  // vería el pedido sin el historial, que es justo lo que vino a ver.
  const hoja = await leerFilas().catch(() => null);
  if (!hoja) notFound();

  const { filas, C } = hoja;
  const fila = filas.find((f) => String(f.datos[C.ID] ?? '').trim().toUpperCase() === id);
  if (!fila) notFound();

  const p = aPedidoWeb(fila, C);
  const h = await dropiShotygames.getHistorialCliente(p.telefono);

  const saldo = Math.max(0, Math.round((p.monto - ANTICIPO_ENVIO) * 100) / 100);
  // `timeStyle: 'short'` daba "12:08 a. m." y con el punto de la frase quedaba
  // "a. m..". Reloj de 24 h y la fecha armada a mano.
  const ahora = new Date();
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', ...o }).format(ahora);
  const consultadoEl = `${f({ day: 'numeric' })} de ${f({ month: 'long' })} de ${f({
    year: 'numeric',
  })}, ${f({ hour: '2-digit', minute: '2-digit', hour12: false })}`;

  return (
    <div style={{ background: '#f4f5f4', minHeight: '100dvh', padding: '24px 16px 48px' }}>
      <main
        style={{
          margin: '0 auto',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #e3e5e3',
          overflow: 'hidden',
          color: '#1b211f',
          fontSize: 15,
          lineHeight: 1.55,
        }}
      >
        <header
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #eceeec',
            background: '#101514',
            color: '#fff',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', opacity: 0.65 }}>
            SHOTYGAMES
          </p>
          <h1 style={{ margin: '4px 0 0', fontSize: 21, fontWeight: 600 }}>
            Tu pedido {p.id}
          </h1>
        </header>

        <section style={{ padding: '18px 22px', borderBottom: '1px solid #eceeec' }}>
          <Fila t="A nombre de" v={p.nombre || '—'} />
          {p.descripcion && <Fila t="Contiene" v={p.descripcion} />}
          <Fila t="Total del pedido" v={usd(p.monto)} fuerte />
          {p.ciudad && <Fila t="Envío a" v={tituloCiudad(p.ciudad)} />}
        </section>

        <section style={{ padding: '18px 22px', borderBottom: '1px solid #eceeec' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600 }}>
            Por qué te pedimos un abono del envío
          </h2>
          <p style={{ margin: '0 0 14px', color: '#4b544f' }}>
            Cuando un paquete sale de la bodega, la transportadora nos cobra el envío se
            entregue o no. Este es el historial de entregas que figura a tu número:
          </p>

          {h ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <Caja n={h.pedidos} t="pedidos" />
                <Caja n={h.entregados} t="entregados" color="#1c7a4a" />
                <Caja n={h.devueltos} t="devueltos" color="#b3262c" />
              </div>

              {h.ultimaIncidencia && (
                <div
                  style={{
                    background: '#fbf6ec',
                    border: '1px solid #f0e3c8',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      color: '#8a6d2f',
                    }}
                  >
                    MOTIVO DE LA ÚLTIMA DEVOLUCIÓN
                  </p>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{h.ultimaIncidencia}</p>
                </div>
              )}
            </>
          ) : (
            <p style={{ margin: 0, color: '#8a9089' }}>
              No pudimos consultar el historial en este momento.
            </p>
          )}

          <p style={{ margin: '14px 0 0', fontSize: 12, color: '#8a9089' }}>
            Dato tomado del sistema de la transportadora (DROPI), consultado el{' '}
            {consultadoEl}. Corresponde a los pedidos hechos con este número en toda la
            plataforma, no solo con nosotros.
          </p>
        </section>

        <section style={{ padding: '18px 22px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600 }}>
            Cómo lo enviamos
          </h2>
          <Fila t="Abono para asegurar el envío" v={usdCorto(ANTICIPO_ENVIO)} fuerte />
          <Fila t="Pagas en efectivo al recibirlo" v={usd(saldo)} fuerte />
          <p style={{ margin: '12px 0 0', color: '#4b544f' }}>
            En cuanto recibamos el abono lo despachamos. Cualquier duda, respóndenos por
            WhatsApp.
          </p>
        </section>
      </main>

      <p
        style={{
          margin: '18px auto 0',
          maxWidth: 520,
          fontSize: 12,
          color: '#8a9089',
          textAlign: 'center',
        }}
      >
        ShotyGames · Este comprobante es solo para ti y no se puede compartir.
      </p>
    </div>
  );
}

function Fila({ t, v, fuerte }: { t: string; v: string; fuerte?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        padding: '5px 0',
      }}
    >
      <span style={{ color: '#6d756f' }}>{t}</span>
      <span style={{ fontWeight: fuerte ? 700 : 500, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

function Caja({ n, t, color = '#1b211f' }: { n: number; t: string; color?: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#f7f8f7',
        border: '1px solid #eceeec',
        borderRadius: 12,
        padding: '10px 8px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color }}>{n}</p>
      <p style={{ margin: 0, fontSize: 11, color: '#6d756f' }}>{t}</p>
    </div>
  );
}
