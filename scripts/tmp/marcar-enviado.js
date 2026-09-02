const hoja = require('../../projects/dropshipping/sheets-pedidos');
const { ahoraEC } = require('../../fechas.js');

const idPedido = process.argv[2];
const fechaArg = process.argv[3]; // opcional, ISO con offset

(async () => {
  const crudos = await hoja.leerPedidos();
  const registro = crudos.map(hoja.aObjeto).find(p => p.idPedido === idPedido);
  if (!registro) { console.error(`No encontré ${idPedido}.`); process.exit(1); }
  console.log(`Pedido: ${registro.idPedido} | ${registro.nombre} | guía ${registro.guia} | F_GUIA actual: ${registro.fGuia || '(vacío)'}`);
  const fecha = fechaArg || ahoraEC();
  await hoja.actualizarFila(registro.fila, { F_GUIA: fecha });
  console.log(`✅ Marcado como avisado, sin mandar WhatsApp. F_GUIA = ${fecha}`);
})().catch(e => { console.error(e.response?.data || e.message || e); process.exit(1); });
