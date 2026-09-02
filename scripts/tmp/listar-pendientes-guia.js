const hoja = require('../../projects/dropshipping/sheets-pedidos');

(async () => {
  const crudos = await hoja.leerPedidos();
  const pedidos = crudos.map(hoja.aObjeto);
  const pendientes = pedidos.filter(p => p.guia && !p.fGuia && !['ENTREGADO','PAGADO','CANCELADO','DEVUELTO'].includes(p.estado));
  console.log(`Total pedidos: ${pedidos.length}`);
  console.log(`Pendientes de aviso de guía: ${pendientes.length}\n`);
  pendientes.forEach(p => {
    console.log(`${p.idPedido} | ${p.nombre} | tel ${p.telefono} | guía ${p.guia} | estado ${p.estado} | tienda ${p.tienda}`);
  });
})().catch(e => { console.error(e); process.exit(1); });
