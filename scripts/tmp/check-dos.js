const hoja = require('../../projects/dropshipping/sheets-pedidos');
(async () => {
  for (const id of ['TRQ-95177','AVN-29654']) {
    const p = await hoja.buscarPedido(id);
    console.log(id, '->', p ? { estado: p.estado, guia: p.guia, fGuia: p.fGuia, telefono: p.telefono, nombre: p.nombre } : 'NO ENCONTRADO');
  }
})().catch(e=>{console.error(e);process.exit(1)});
