// Manda el aviso de guía a UN pedido puntual, indicado por argv.
// Uso: node scripts/tmp/enviar-uno-guia.js TRQ-95177
const hoja = require('../../projects/dropshipping/sheets-pedidos');
const pedidosDropi = require('../../projects/dropshipping/pedidos');
const { notificarGuiaLista } = require('../../projects/dropshipping/notificar-guia');
const { ahoraEC } = require('../../fechas.js');

const idPedido = process.argv[2];
if (!idPedido) {
  console.error('Uso: node scripts/tmp/enviar-uno-guia.js <ID_PEDIDO>');
  process.exit(1);
}

(async () => {
  const crudos = await hoja.leerPedidos();
  const registro = crudos.map(hoja.aObjeto).find(p => p.idPedido === idPedido);
  if (!registro) { console.error(`No encontré ${idPedido} en el Sheet.`); process.exit(1); }

  console.log(`Pedido: ${registro.idPedido} | ${registro.nombre} | tel ${registro.telefono} | guía ${registro.guia} | estado ${registro.estado}`);

  if (registro.fGuia) {
    console.log(`⚠️  Ya tiene F_GUIA sellada (${registro.fGuia}) — no se manda de nuevo. Si Fabián ya avisó a mano, esto está bien así.`);
    process.exit(0);
  }
  if (!registro.guia) { console.error('No tiene guía todavía.'); process.exit(1); }
  if (!registro.ordenDropi) { console.error('No tiene ORDEN_DROPI, no puedo buscar transportadora/PDF.'); process.exit(1); }

  const o = await pedidosDropi.getOrden(registro.ordenDropi);
  const fGuiaReal = pedidosDropi.fechaDeEstado(o?.historial, 'GUIA_GENERADA') || ahoraEC();

  await notificarGuiaLista({
    nombre: registro.nombre,
    telefono: registro.telefono,
    transportadora: o.transportadora,
    guia: o.guia || registro.guia,
    valor: registro.total,
    pdfUrl: o.pdf
  });

  await hoja.actualizarFila(registro.fila, { F_GUIA: fGuiaReal });
  console.log(`✅ Avisado y F_GUIA sellada (${fGuiaReal}).`);
})().catch(e => {
  console.error('Falló:', e.response?.data || e.message || e);
  process.exit(1);
});
